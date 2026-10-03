import "dotenv/config";
import cors from "cors";
import crypto from "node:crypto";
import express from "express";
import mysql from "mysql2/promise";
import Razorpay from "razorpay";

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "kesariya_garba",
  waitForConnections: true,
  connectionLimit: 10
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || ""
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "kesariya-garba-platform" });
});

app.get("/api/events", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, event_date, venue, city, price, capacity, available_seats FROM events ORDER BY event_date"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Unable to load events", error: error.message });
  }
});

app.post("/api/bookings/order", async (req, res) => {
  try {
    const { eventId, quantity = 1 } = req.body;
    const qty = Number(quantity);
    if (!eventId || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "eventId and a valid quantity are required" });
    }

    const [events] = await pool.query(
      "SELECT id, title, price, available_seats FROM events WHERE id = ? LIMIT 1",
      [eventId]
    );
    if (!events.length) return res.status(404).json({ message: "Event not found" });

    const event = events[0];
    if (event.available_seats < qty) {
      return res.status(409).json({ message: "Not enough seats available" });
    }

    const amount = Math.round(Number(event.price) * qty * 100);
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `garba_${Date.now()}`,
      notes: { eventId: String(eventId), quantity: String(qty) }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || null
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to create payment order", error: error.message });
  }
});

app.post("/api/bookings/verify", async (req, res) => {
  try {
    const {
      eventId,
      customerName,
      customerEmail,
      customerPhone,
      quantity = 1,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(payload)
      .digest("hex");

    if (!razorpaySignature || expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Payment signature verification failed" });
    }

    const qty = Number(quantity);
    if (!eventId || !customerName || !customerEmail || !customerPhone || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "Missing or invalid booking details" });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [events] = await connection.query(
        "SELECT id, price, available_seats FROM events WHERE id = ? FOR UPDATE",
        [eventId]
      );
      if (!events.length) throw new Error("Event not found");

      const event = events[0];
      if (event.available_seats < qty) throw new Error("Not enough seats available");

      const totalAmount = Number(event.price) * qty;
      const [result] = await connection.query(
        `INSERT INTO bookings
          (event_id, customer_name, customer_email, customer_phone, quantity, total_amount, razorpay_order_id, razorpay_payment_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, customerName, customerEmail, customerPhone, qty, totalAmount, razorpayOrderId, razorpayPaymentId]
      );

      await connection.query(
        "UPDATE events SET available_seats = available_seats - ? WHERE id = ?",
        [qty, eventId]
      );

      await connection.commit();
      res.status(201).json({ bookingId: result.insertId, message: "Booking confirmed" });
    } catch (error) {
      await connection.rollback();
      res.status(409).json({ message: error.message });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: "Unable to verify booking", error: error.message });
  }
});

// Turnstile verification endpoint.
// Configure TURNSTILE_SECRET_KEY in .env before enabling CAPTCHA verification in production.
app.post("/api/turnstile/verify", async (req, res) => {
  const token = req.body?.token;
  if (!token) return res.status(400).json({ success: false, message: "Turnstile token is required" });

  if (!process.env.TURNSTILE_SECRET_KEY) {
    return res.json({ success: true, bypassed: true, message: "Turnstile secret is not configured" });
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: req.ip
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: "Turnstile verification failed", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Kesariya Garba API listening on http://localhost:${port}`);
});
