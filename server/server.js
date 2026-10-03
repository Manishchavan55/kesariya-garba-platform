import "dotenv/config";
import cors from "cors";
import crypto from "node:crypto";
import express from "express";
import mysql from "mysql2/promise";
import Razorpay from "razorpay";

const app = express();
const port = Number(process.env.PORT || 5000);
const useMySQL = String(process.env.USE_MYSQL || "false").toLowerCase() === "true";

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

const imageSet = [
  "https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/28489406/pexels-photo-28489406.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/18983063/pexels-photo-18983063.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/8000319/pexels-photo-8000319.jpeg?auto=compress&cs=tinysrgb&w=1200"
];

const store = {
  events: [
    {
      id: 1,
      title: "Kesariya Grand Garba Night",
      description: "A premium Navratri celebration with live garba, dandiya, folk beats, lights and food stalls.",
      event_date: "2026-10-24T19:00:00+05:30",
      venue: "Grand Celebration Ground",
      city: "Pune",
      parking_info: "On-site parking and paid overflow parking nearby.",
      entry_guidelines: "Carry a valid booking QR. Gates open at 6:00 PM. No outside food or drinks.",
      price: 499,
      capacity: 2500,
      available_seats: 2500
    },
    {
      id: 2,
      title: "Kesariya Dandiya Under The Stars",
      description: "An open-air dandiya night with a live DJ, folk percussion and a family-friendly dance floor.",
      event_date: "2026-10-31T19:30:00+05:30",
      venue: "Riverside Lawns",
      city: "Pune",
      parking_info: "Free parking inside the venue compound.",
      entry_guidelines: "Gates open at 6:30 PM. Bring your digital or printed QR ticket.",
      price: 599,
      capacity: 1800,
      available_seats: 1800
    }
  ],
  ticketCategories: [
    { id: 1, event_id: 1, name: "Regular Pass", price: 499, available_quantity: 1800 },
    { id: 2, event_id: 1, name: "Couple Pass", price: 899, available_quantity: 500 },
    { id: 3, event_id: 1, name: "VIP Circle", price: 1499, available_quantity: 200 },
    { id: 4, event_id: 2, name: "Regular Pass", price: 599, available_quantity: 1500 },
    { id: 5, event_id: 2, name: "Couple Pass", price: 1099, available_quantity: 300 }
  ],
  bookings: [
    {
      id: 1001,
      booking_code: "KGR-DEMO-1001",
      event_id: 1,
      ticket_category_id: 1,
      customer_name: "Demo Guest",
      customer_email: "demo@example.com",
      customer_phone: "+91 90000 00000",
      quantity: 2,
      total_amount: 998,
      status: "confirmed",
      created_at: new Date().toISOString()
    }
  ],
  payments: [{ id: 1, booking_id: 1001, transaction_ref: "DUMMY-PAY-1001", amount: 998, payment_status: "success", gateway: "dummy" }],
  qrTickets: [{ id: 1, booking_id: 1001, qr_token: "KGR-DEMO-1001", verification_status: "unused", scanned_at: null }],
  gallery: imageSet.map((image_url, index) => ({
    id: index + 1,
    title: ["Dandiya Circle", "Festival Colours", "Garba Fashion", "Navratri Details"][index],
    image_url,
    caption: "Kesariya Navratri moments"
  })),
  sponsors: [
    { id: 1, name: "Rang Events", logo_url: "https://dummyimage.com/240x100/8b1e3f/ffffff&text=RANG+EVENTS", website_url: "https://example.com" },
    { id: 2, name: "Dandiya Beats", logo_url: "https://dummyimage.com/240x100/d97706/ffffff&text=DANDIYA+BEATS", website_url: "https://example.com" },
    { id: 3, name: "Maharashtra Live", logo_url: "https://dummyimage.com/240x100/4f1d4f/ffffff&text=MAHARASHTRA+LIVE", website_url: "https://example.com" }
  ],
  inquiries: []
};

const nextId = (items) => items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
const bookingByCode = (code) => store.bookings.find((booking) => booking.booking_code === code);

async function dbQuery(sql, params = []) {
  if (!useMySQL) throw new Error("MYSQL_DISABLED");
  return pool.query(sql, params);
}

async function loadEvents() {
  if (!useMySQL) return store.events;
  const [rows] = await dbQuery("SELECT * FROM events ORDER BY event_date");
  return rows;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: useMySQL ? "mysql" : "demo", service: "kesariya-garba-platform" });
});

app.get("/api/events", async (_req, res) => {
  try {
    res.json(await loadEvents());
  } catch (error) {
    res.status(500).json({ message: "Unable to load events", error: error.message });
  }
});

app.get("/api/events/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const events = await loadEvents();
    const event = events.find((item) => Number(item.id) === id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const categories = useMySQL
      ? (await dbQuery("SELECT * FROM ticket_categories WHERE event_id = ? ORDER BY price", [id]))[0]
      : store.ticketCategories.filter((item) => item.event_id === id);
    res.json({ ...event, ticket_categories: categories });
  } catch (error) {
    res.status(500).json({ message: "Unable to load event", error: error.message });
  }
});

app.get("/api/gallery", (_req, res) => res.json(store.gallery));
app.get("/api/sponsors", (_req, res) => res.json(store.sponsors));

app.post("/api/inquiries", (req, res) => {
  const { name, email, phone = "", message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ message: "Name, email and message are required" });
  const inquiry = { id: nextId(store.inquiries), name, email, phone, message, status: "new", created_at: new Date().toISOString() };
  store.inquiries.push(inquiry);
  res.status(201).json({ message: "Thanks! Your inquiry has been received.", inquiry });
});

app.post("/api/bookings/order", async (req, res) => {
  try {
    const { eventId, ticketCategoryId, quantity = 1 } = req.body;
    const qty = Number(quantity);
    if (!eventId || !Number.isInteger(qty) || qty < 1 || qty > 10) {
      return res.status(400).json({ message: "Choose between 1 and 10 tickets." });
    }

    const events = await loadEvents();
    const event = events.find((item) => Number(item.id) === Number(eventId));
    if (!event) return res.status(404).json({ message: "Event not found" });

    const categories = useMySQL
      ? (await dbQuery("SELECT * FROM ticket_categories WHERE event_id = ? ORDER BY price", [eventId]))[0]
      : store.ticketCategories.filter((item) => item.event_id === Number(eventId));
    const category = categories.find((item) => Number(item.id) === Number(ticketCategoryId)) || categories[0];
    if (!category) return res.status(400).json({ message: "Ticket category not found" });
    if (Number(category.available_quantity) < qty) return res.status(409).json({ message: "Not enough tickets available" });

    const amount = Math.round(Number(category.price) * qty * 100);
    if (useMySQL && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `garba_${Date.now()}`,
        notes: { eventId: String(eventId), ticketCategoryId: String(category.id), quantity: String(qty) }
      });
      return res.json({ mode: "razorpay", orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
    }

    res.json({
      mode: "demo",
      orderId: `demo_order_${Date.now()}`,
      amount,
      currency: "INR",
      keyId: null,
      message: "Demo payment mode is active. No real money will be charged."
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to create payment order", error: error.message });
  }
});

function createBooking({ eventId, ticketCategoryId, customerName, customerEmail, customerPhone, quantity, totalAmount, transactionRef }) {
  const events = store.events;
  const event = events.find((item) => Number(item.id) === Number(eventId));
  const category = store.ticketCategories.find((item) => Number(item.id) === Number(ticketCategoryId));
  if (!event || !category) throw new Error("Event or ticket category not found");
  if (event.available_seats < quantity || category.available_quantity < quantity) throw new Error("Not enough tickets available");

  event.available_seats -= quantity;
  category.available_quantity -= quantity;
  const id = nextId(store.bookings) + 1000;
  const booking = {
    id,
    booking_code: `KGR-${new Date().getFullYear()}-${String(id).padStart(5, "0")}`,
    event_id: event.id,
    ticket_category_id: category.id,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    quantity,
    total_amount: totalAmount,
    status: "confirmed",
    created_at: new Date().toISOString()
  };
  store.bookings.push(booking);
  store.payments.push({ id: nextId(store.payments), booking_id: id, transaction_ref: transactionRef, amount: totalAmount, payment_status: "success", gateway: "dummy" });
  store.qrTickets.push({ id: nextId(store.qrTickets), booking_id: id, qr_token: booking.booking_code, verification_status: "unused", scanned_at: null });
  return booking;
}

app.post("/api/bookings/confirm", async (req, res) => {
  try {
    const { eventId, ticketCategoryId, customerName, customerEmail, customerPhone, quantity = 1, paymentRef = `DUMMY-${Date.now()}` } = req.body || {};
    const qty = Number(quantity);
    if (!eventId || !ticketCategoryId || !customerName || !customerEmail || !customerPhone || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "Please complete all booking details." });
    }

    if (!useMySQL) {
      const category = store.ticketCategories.find((item) => item.id === Number(ticketCategoryId));
      const totalAmount = Number(category?.price || 0) * qty;
      const booking = createBooking({ eventId, ticketCategoryId, customerName, customerEmail, customerPhone, quantity: qty, totalAmount, transactionRef: paymentRef });
      return res.status(201).json({ message: "Booking confirmed", booking, qr: booking.booking_code, paymentMode: "demo" });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[event]] = await connection.query("SELECT * FROM events WHERE id = ? FOR UPDATE", [eventId]);
      const [[category]] = await connection.query("SELECT * FROM ticket_categories WHERE id = ? AND event_id = ? FOR UPDATE", [ticketCategoryId, eventId]);
      if (!event || !category) throw new Error("Event or ticket category not found");
      if (event.available_seats < qty || category.available_quantity < qty) throw new Error("Not enough tickets available");
      const totalAmount = Number(category.price) * qty;
      const bookingCode = `KGR-${Date.now()}`;
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings (booking_code,event_id,ticket_category_id,customer_name,customer_email,customer_phone,quantity,total_amount,status)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [bookingCode,eventId,ticketCategoryId,customerName,customerEmail,customerPhone,qty,totalAmount,"confirmed"]
      );
      await connection.query("UPDATE events SET available_seats = available_seats - ? WHERE id = ?", [qty, eventId]);
      await connection.query("UPDATE ticket_categories SET available_quantity = available_quantity - ? WHERE id = ?", [qty, ticketCategoryId]);
      await connection.query("INSERT INTO payments (booking_id,transaction_ref,amount,payment_status,gateway) VALUES (?,?,?,?,?)", [bookingResult.insertId,paymentRef,totalAmount,"success","razorpay"]);
      await connection.query("INSERT INTO qr_tickets (booking_id,qr_token,verification_status) VALUES (?,?,?)", [bookingResult.insertId,bookingCode,"unused"]);
      await connection.commit();
      res.status(201).json({ message: "Booking confirmed", booking: { id: bookingResult.insertId, booking_code: bookingCode, total_amount: totalAmount }, qr: bookingCode, paymentMode: "razorpay" });
    } catch (error) {
      await connection.rollback();
      res.status(409).json({ message: error.message });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: "Unable to confirm booking", error: error.message });
  }
});

app.get("/api/bookings/:code", (req, res) => {
  const booking = bookingByCode(req.params.code);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  const event = store.events.find((item) => item.id === booking.event_id);
  const qr = store.qrTickets.find((item) => item.booking_id === booking.id);
  res.json({ booking, event, qr });
});

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === "admin@kesariya.test" && password === "admin123") {
    return res.json({ token: "demo-admin-token", user: { name: "Kesariya Admin", email } });
  }
  res.status(401).json({ message: "Invalid demo credentials" });
});

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== "demo-admin-token") return res.status(401).json({ message: "Admin authentication required" });
  next();
}

app.get("/api/admin/dashboard", requireAdmin, (_req, res) => {
  const confirmed = store.bookings.filter((booking) => booking.status === "confirmed");
  res.json({
    events: store.events.length,
    bookings: confirmed.length,
    ticketsSold: confirmed.reduce((sum, booking) => sum + booking.quantity, 0),
    revenue: confirmed.reduce((sum, booking) => sum + Number(booking.total_amount), 0),
    inquiries: store.inquiries.filter((item) => item.status === "new").length,
    qrUsed: store.qrTickets.filter((item) => item.verification_status === "used").length
  });
});

app.get("/api/admin/bookings", requireAdmin, (_req, res) => {
  res.json(store.bookings.map((booking) => ({ ...booking, event: store.events.find((item) => item.id === booking.event_id), qr: store.qrTickets.find((item) => item.booking_id === booking.id) })));
});

app.post("/api/admin/qr/verify", requireAdmin, (req, res) => {
  const token = String(req.body?.token || "").trim();
  const qr = store.qrTickets.find((item) => item.qr_token === token);
  if (!qr) return res.status(404).json({ valid: false, message: "Invalid QR ticket" });
  if (qr.verification_status === "used") return res.status(409).json({ valid: false, duplicate: true, message: "Duplicate scan: this QR has already been used." });
  qr.verification_status = "used";
  qr.scanned_at = new Date().toISOString();
  const booking = store.bookings.find((item) => item.id === qr.booking_id);
  res.json({ valid: true, message: "Entry verified. QR marked as used.", booking });
});

app.get("/api/admin/inquiries", requireAdmin, (_req, res) => res.json(store.inquiries));
app.patch("/api/admin/inquiries/:id", requireAdmin, (req, res) => {
  const inquiry = store.inquiries.find((item) => item.id === Number(req.params.id));
  if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
  inquiry.status = req.body.status === "resolved" ? "resolved" : "new";
  res.json(inquiry);
});

app.get("/api/admin/events", requireAdmin, (_req, res) => res.json(store.events));
app.post("/api/admin/events", requireAdmin, (req, res) => {
  const { title, event_date, venue, city, price, capacity } = req.body || {};
  if (!title || !event_date || !venue || !city || !price || !capacity) return res.status(400).json({ message: "Complete event fields are required" });
  const event = { id: nextId(store.events), title, description: "Demo event created from admin panel.", event_date, venue, city, parking_info: "Parking available at venue.", entry_guidelines: "Carry your QR ticket.", price: Number(price), capacity: Number(capacity), available_seats: Number(capacity) };
  store.events.push(event);
  store.ticketCategories.push({ id: nextId(store.ticketCategories), event_id: event.id, name: "Regular Pass", price: Number(price), available_quantity: Number(capacity) });
  res.status(201).json(event);
});

app.post("/api/turnstile/verify", async (req, res) => {
  const token = req.body?.token;
  if (!token) return res.status(400).json({ success: false, message: "Turnstile token is required" });
  if (!process.env.TURNSTILE_SECRET_KEY) return res.json({ success: true, bypassed: true });
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: req.ip })
    });
    res.json(await response.json());
  } catch (error) {
    res.status(500).json({ success: false, message: "Turnstile verification failed", error: error.message });
  }
});

app.listen(port, () => console.log(`Kesariya Garba API listening on http://localhost:${port} (${useMySQL ? "MySQL" : "demo data"} mode)`));
