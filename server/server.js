import "dotenv/config";
import cors from "cors";
import express from "express";
import mysql from "mysql2/promise";
import Razorpay from "razorpay";
import crypto from "node:crypto";

const app = express();
const port = Number(process.env.PORT || 5000);
const useMySQL = String(process.env.USE_MYSQL || "false").toLowerCase() === "true";
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({ origin: clientUrl }));
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

const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const razorpay = razorpayConfigured
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

const sessionSecret = process.env.ADMIN_SESSION_SECRET || (!useMySQL ? crypto.randomBytes(32).toString("hex") : null);
const adminEmail = process.env.ADMIN_EMAIL || (useMySQL ? null : "admin@kesariya.test");
const adminPassword = process.env.ADMIN_PASSWORD || (useMySQL ? null : "admin123");
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || null;
if (useMySQL && (!sessionSecret || !adminEmail || (!adminPassword && !adminPasswordHash))) {
  throw new Error("Production admin authentication is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD), and ADMIN_SESSION_SECRET.");
}

const imageSet = [
  "https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/28489406/pexels-photo-28489406.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/18983063/pexels-photo-18983063.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/8000319/pexels-photo-8000319.jpeg?auto=compress&cs=tinysrgb&w=1200"
];
const store = {
  events: [
    { id: 1, title: "Kesariya Grand Garba Night", description: "A premium Navratri celebration with live garba, dandiya, folk beats, lights and food stalls.", event_date: "2026-10-24T19:00:00+05:30", venue: "Grand Celebration Ground", city: "Pune", parking_info: "On-site parking and paid overflow parking nearby.", entry_guidelines: "Carry a valid booking QR. Gates open at 6:00 PM. No outside food or drinks.", price: 1500, capacity: 2500, available_seats: 2500 },
    { id: 2, title: "Kesariya Dandiya Under The Stars", description: "An open-air dandiya night with a live DJ, folk percussion and a family-friendly dance floor.", event_date: "2026-10-31T19:30:00+05:30", venue: "Riverside Lawns", city: "Pune", parking_info: "Free parking inside the venue compound.", entry_guidelines: "Gates open at 6:30 PM. Bring your digital or printed QR ticket.", price: 599, capacity: 1800, available_seats: 1800 }
  ],
  ticketCategories: [
    { id: 1, event_id: 1, name: "Couple Day Pass", price: 1500, available_quantity: 1800 },
    { id: 2, event_id: 1, name: "5-Day Season Pass", price: 5000, available_quantity: 500 },
    { id: 3, event_id: 1, name: "Premium / Corporate Pass", price: 50000, available_quantity: 200 },
    { id: 4, event_id: 2, name: "Regular Pass", price: 599, available_quantity: 1500 },
    { id: 5, event_id: 2, name: "Couple Pass", price: 1099, available_quantity: 300 }
  ],
  bookings: [{ id: 1001, booking_code: "KGR-DEMO-1001", event_id: 1, ticket_category_id: 1, customer_name: "Demo Guest", customer_email: "demo@example.com", customer_phone: "+91 90000 00000", quantity: 2, total_amount: 3000, status: "confirmed", created_at: new Date().toISOString() }],
  payments: [{ id: 1, booking_id: 1001, transaction_ref: "DUMMY-PAY-1001", amount: 3000, payment_status: "success", gateway: "dummy" }],
  qrTickets: [{ id: 1, booking_id: 1001, qr_token: "KGR-DEMO-1001", verification_status: "unused", scanned_at: null }],
  gallery: imageSet.map((image_url, index) => ({ id: index + 1, title: ["Dandiya Circle", "Festival Colours", "Garba Fashion", "Navratri Details"][index], image_url, caption: "Kesariya Navratri moments" })),
  sponsors: [{ id: 1, name: "Rang Events", logo_url: "https://dummyimage.com/240x100/8b1e3f/ffffff&text=RANG+EVENTS", website_url: "https://example.com" }, { id: 2, name: "Dandiya Beats", logo_url: "https://dummyimage.com/240x100/d97706/ffffff&text=DANDIYA+BEATS", website_url: "https://example.com" }, { id: 3, name: "Maharashtra Live", logo_url: "https://dummyimage.com/240x100/4f1d4f/ffffff&text=MAHARASHTRA+LIVE", website_url: "https://example.com" }],
  inquiries: []
};
const legacyDemoScans = new Set();
const nextId = items => items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
async function dbQuery(sql, params = []) { if (!useMySQL) throw new Error("MYSQL_DISABLED"); return pool.query(sql, params); }
async function loadEvents() { if (!useMySQL) return store.events; const [rows] = await dbQuery("SELECT * FROM events ORDER BY event_date"); return rows; }

function timingSafeStringEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function verifyPassword(password) {
  if (adminPasswordHash) {
    const [scheme, salt, expected] = adminPasswordHash.split(":");
    if (scheme !== "scrypt" || !salt || !expected) return false;
    try {
      const derived = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
      return timingSafeStringEqual(derived, expected);
    } catch { return false; }
  }
  return Boolean(adminPassword) && timingSafeStringEqual(password, adminPassword);
}
function base64url(value) { return Buffer.from(value).toString("base64url"); }
function signAdminToken(email) {
  const payload = { sub: email, role: "admin", exp: Date.now() + 8 * 60 * 60 * 1000 };
  const encoded = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", sessionSecret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}
function verifyAdminToken(token) {
  if (!sessionSecret || !token) return null;
  const [encoded, signature] = String(token).split(".");
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac("sha256", sessionSecret).update(encoded).digest("base64url");
  if (!timingSafeStringEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload.role !== "admin" || payload.sub !== adminEmail || Number(payload.exp) < Date.now()) return null;
    return payload;
  } catch { return null; }
}
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!verifyAdminToken(token)) return res.status(401).json({ message: "Admin authentication required" });
  next();
}
function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!razorpayConfigured || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return timingSafeStringEqual(signature, expected);
}

app.get("/api/health", (_req, res) => res.json({
  ok: true,
  mode: useMySQL ? "mysql" : "demo",
  service: "kesariya-garba-platform",
  payments: useMySQL && razorpayConfigured ? "razorpay" : "disabled",
  bookingFlow: "razorpay-verified-only"
}));
app.get("/api/events", async (_req, res) => { try { res.json(await loadEvents()); } catch (error) { res.status(500).json({ message: "Unable to load events", error: error.message }); } });
app.get("/api/events/:id", async (req, res) => { try { const id = Number(req.params.id), events = await loadEvents(), event = events.find(item => Number(item.id) === id); if (!event) return res.status(404).json({ message: "Event not found" }); const categories = useMySQL ? (await dbQuery("SELECT * FROM ticket_categories WHERE event_id=? ORDER BY price", [id]))[0] : store.ticketCategories.filter(item => item.event_id === id); res.json({ ...event, ticket_categories: categories }); } catch (error) { res.status(500).json({ message: "Unable to load event", error: error.message }); } });
app.get("/api/gallery", (_req, res) => res.json(store.gallery));
app.get("/api/sponsors", (_req, res) => res.json(store.sponsors));
app.post("/api/inquiries", (req, res) => { const { name, email, phone = "", message } = req.body || {}; if (!name || !email || !message) return res.status(400).json({ message: "Name, email and message are required" }); const inquiry = { id: nextId(store.inquiries), name, email, phone, message, status: "new", created_at: new Date().toISOString() }; store.inquiries.push(inquiry); res.status(201).json({ message: "Thanks! Your inquiry has been received.", inquiry }); });

app.post("/api/bookings/order", async (req, res) => {
  try {
    const { eventId, ticketCategoryId, quantity = 1 } = req.body, qty = Number(quantity);
    console.log(`[PAYMENT] order requested event=${eventId} category=${ticketCategoryId} quantity=${qty}`);
    if (!useMySQL || !razorpayConfigured) return res.status(503).json({ message: "Razorpay payment is not configured. Booking creation is disabled until MySQL and Razorpay are enabled." });
    if (!eventId || !Number.isInteger(qty) || qty < 1 || qty > 10) return res.status(400).json({ message: "Choose between 1 and 10 tickets." });
    const events = await loadEvents(), event = events.find(item => Number(item.id) === Number(eventId));
    if (!event) return res.status(404).json({ message: "Event not found" });
    const [categories] = await dbQuery("SELECT * FROM ticket_categories WHERE event_id=? ORDER BY price", [eventId]);
    const category = categories.find(item => Number(item.id) === Number(ticketCategoryId));
    if (!category) return res.status(400).json({ message: "Ticket category not found" });
    if (Number(category.available_quantity) < qty) return res.status(409).json({ message: "Not enough tickets available" });
    const amount = Math.round(Number(category.price) * qty * 100);
    const order = await razorpay.orders.create({ amount, currency: "INR", receipt: `garba_${Date.now()}`, notes: { eventId: String(eventId), ticketCategoryId: String(category.id), quantity: String(qty) } });
    console.log(`[PAYMENT] Razorpay order created order=${order.id} amount=${order.amount}`);
    return res.json({ mode: "razorpay", orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) { console.error("[PAYMENT] order creation failed", error.message); res.status(500).json({ message: "Unable to create payment order", error: error.message }); }
});

app.post("/api/bookings/confirm", async (req, res) => {
  try {
    const { eventId, ticketCategoryId, customerName, customerEmail, customerPhone, quantity = 1, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
    const qty = Number(quantity);
    console.log(`[BOOKING] confirm requested order=${razorpayOrderId || "missing"} payment=${razorpayPaymentId || "missing"}`);
    if (!useMySQL || !razorpayConfigured) return res.status(503).json({ message: "Razorpay payment is required. Demo/direct booking is disabled." });
    if (!eventId || !ticketCategoryId || !customerName || !customerEmail || !customerPhone || !Number.isInteger(qty) || qty < 1 || qty > 10) return res.status(400).json({ message: "Please complete all booking details." });
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return res.status(402).json({ message: "Payment required. Complete Razorpay Checkout before confirming the booking." });

    const [[event]] = await dbQuery("SELECT * FROM events WHERE id=?", [eventId]);
    const [[category]] = await dbQuery("SELECT * FROM ticket_categories WHERE id=? AND event_id=?", [ticketCategoryId, eventId]);
    if (!event || !category) return res.status(404).json({ message: "Event or ticket category not found" });
    if (Number(category.available_quantity) < qty) return res.status(409).json({ message: "Not enough tickets available" });
    const expectedAmount = Math.round(Number(category.price) * qty * 100);

    console.log(`[PAYMENT] signature verification started order=${razorpayOrderId} payment=${razorpayPaymentId}`);
    if (!verifyRazorpaySignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature })) {
      console.warn(`[PAYMENT] signature verification failed order=${razorpayOrderId} payment=${razorpayPaymentId}`);
      return res.status(402).json({ message: "Payment verification failed. Complete Razorpay Checkout before confirming the booking." });
    }

    const order = await razorpay.orders.fetch(razorpayOrderId);
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    const notes = order.notes || {};
    const orderValid = order.id === razorpayOrderId
      && Number(order.amount) === expectedAmount
      && order.currency === "INR"
      && String(notes.eventId) === String(eventId)
      && String(notes.ticketCategoryId) === String(ticketCategoryId)
      && Number(notes.quantity) === qty;
    const paymentValid = payment.id === razorpayPaymentId
      && payment.order_id === razorpayOrderId
      && Number(payment.amount) === expectedAmount
      && payment.currency === "INR"
      && payment.status === "captured";
    if (!orderValid || !paymentValid) {
      console.warn(`[PAYMENT] payment/order validation failed order=${razorpayOrderId} payment=${razorpayPaymentId} orderStatus=${order.status} paymentStatus=${payment.status}`);
      return res.status(402).json({ message: "Payment could not be verified for this booking." });
    }
    console.log(`[PAYMENT] signature and payment verified order=${razorpayOrderId} payment=${razorpayPaymentId}`);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[existingPayment]] = await connection.query("SELECT p.booking_id,b.booking_code,b.total_amount,b.customer_name FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE p.transaction_ref=? LIMIT 1", [razorpayPaymentId]);
      if (existingPayment) {
        const [[qr]] = await connection.query("SELECT qr_token FROM qr_tickets WHERE booking_id=? LIMIT 1", [existingPayment.booking_id]);
        await connection.commit();
        console.log(`[BOOKING] existing verified booking returned booking=${existingPayment.booking_code}`);
        return res.status(200).json({ message: "Booking already confirmed", booking: existingPayment, qr: qr?.qr_token, paymentMode: "razorpay" });
      }

      const [[lockedEvent]] = await connection.query("SELECT * FROM events WHERE id=? FOR UPDATE", [eventId]);
      const [[lockedCategory]] = await connection.query("SELECT * FROM ticket_categories WHERE id=? AND event_id=? FOR UPDATE", [ticketCategoryId, eventId]);
      if (!lockedEvent || !lockedCategory) throw new Error("Event or ticket category not found");
      if (lockedEvent.available_seats < qty || lockedCategory.available_quantity < qty) throw new Error("Not enough tickets available");
      const totalAmount = Number(lockedCategory.price) * qty;
      const bookingCode = `KGR-${Date.now()}`;

      console.log(`[BOOKING] creating booking payment=${razorpayPaymentId}`);
      const [bookingResult] = await connection.query("INSERT INTO bookings (booking_code,event_id,ticket_category_id,customer_name,customer_email,customer_phone,quantity,total_amount,status) VALUES (?,?,?,?,?,?,?,?,?)", [bookingCode, eventId, ticketCategoryId, customerName, customerEmail, customerPhone, qty, totalAmount, "confirmed"]);
      await connection.query("UPDATE events SET available_seats=available_seats-? WHERE id=?", [qty, eventId]);
      await connection.query("UPDATE ticket_categories SET available_quantity=available_quantity-? WHERE id=?", [qty, ticketCategoryId]);
      await connection.query("INSERT INTO payments (booking_id,transaction_ref,amount,payment_status,gateway) VALUES (?,?,?,?,?)", [bookingResult.insertId, razorpayPaymentId, totalAmount, "success", "razorpay"]);
      console.log(`[QR] generating QR booking=${bookingCode}`);
      await connection.query("INSERT INTO qr_tickets (booking_id,qr_token,verification_status) VALUES (?,?,?)", [bookingResult.insertId, bookingCode, "unused"]);
      await connection.commit();
      res.status(201).json({ message: "Booking confirmed", booking: { id: bookingResult.insertId, booking_code: bookingCode, total_amount: totalAmount, customer_name: customerName }, qr: bookingCode, paymentMode: "razorpay" });
    } catch (error) { await connection.rollback(); res.status(409).json({ message: error.message }); } finally { connection.release(); }
  } catch (error) { console.error("[BOOKING] confirmation failed", error.message); res.status(500).json({ message: "Unable to confirm booking", error: error.message }); }
});

app.get("/api/bookings/:code", async (req, res) => { try { if (!useMySQL) { const booking = store.bookings.find(item => item.booking_code === req.params.code); if (!booking) return res.status(404).json({ message: "Booking not found" }); return res.json({ booking, event: store.events.find(item => item.id === booking.event_id), qr: store.qrTickets.find(item => item.booking_id === booking.id) }); } const [[booking]] = await dbQuery("SELECT * FROM bookings WHERE booking_code=?", [req.params.code]); if (!booking) return res.status(404).json({ message: "Booking not found" }); const [[event]] = await dbQuery("SELECT * FROM events WHERE id=?", [booking.event_id]); const [[qr]] = await dbQuery("SELECT * FROM qr_tickets WHERE booking_id=?", [booking.id]); res.json({ booking, event, qr }); } catch (error) { res.status(500).json({ message: "Unable to load booking", error: error.message }); } });

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!adminEmail || !sessionSecret) return res.status(503).json({ message: "Admin authentication is not configured." });
  if (timingSafeStringEqual(email, adminEmail) && verifyPassword(password)) return res.json({ token: signAdminToken(email), user: { name: "Kesariya Admin", email } });
  res.status(401).json({ message: "Invalid admin credentials" });
});
app.get("/api/admin/dashboard", requireAdmin, async (_req, res) => { try { if (useMySQL) { const [[summary]] = await dbQuery("SELECT COUNT(*) bookings,COALESCE(SUM(quantity),0) ticketsSold,COALESCE(SUM(total_amount),0) revenue FROM bookings WHERE status='confirmed'"); const [[qr]] = await dbQuery("SELECT COUNT(*) qrUsed FROM qr_tickets WHERE verification_status='used'"); const [[inq]] = await dbQuery("SELECT COUNT(*) inquiries FROM inquiries WHERE status='new'"); const [[events]] = await dbQuery("SELECT COUNT(*) events FROM events"); return res.json({ ...summary, ...qr, ...inq, ...events }); } const confirmed = store.bookings.filter(booking => booking.status === "confirmed"); res.json({ events: store.events.length, bookings: confirmed.length, ticketsSold: confirmed.reduce((sum, booking) => sum + booking.quantity, 0), revenue: confirmed.reduce((sum, booking) => sum + Number(booking.total_amount), 0), inquiries: store.inquiries.filter(item => item.status === "new").length, qrUsed: store.qrTickets.filter(item => item.verification_status === "used").length }); } catch (error) { res.status(500).json({ message: "Unable to load dashboard", error: error.message }); } });
app.get("/api/admin/bookings", requireAdmin, async (_req, res) => { try { if (!useMySQL) return res.json(store.bookings.map(booking => ({ ...booking, event: store.events.find(item => item.id === booking.event_id), qr: store.qrTickets.find(item => item.booking_id === booking.id) }))); const [rows] = await dbQuery("SELECT b.*,e.title event_title,tc.name ticket_name,q.verification_status,q.scanned_at FROM bookings b JOIN events e ON e.id=b.event_id LEFT JOIN ticket_categories tc ON tc.id=b.ticket_category_id LEFT JOIN qr_tickets q ON q.booking_id=b.id ORDER BY b.created_at DESC"); res.json(rows); } catch (error) { res.status(500).json({ message: "Unable to load bookings", error: error.message }); } });
app.get("/api/admin/ticket-categories", requireAdmin, async (_req, res) => { try { if (useMySQL) { const [rows] = await dbQuery("SELECT tc.*,e.title event_title FROM ticket_categories tc JOIN events e ON e.id=tc.event_id ORDER BY e.event_date,tc.price"); return res.json(rows); } res.json(store.ticketCategories.map(category => ({ ...category, event_title: store.events.find(event => event.id === category.event_id)?.title || "Event" }))); } catch (error) { res.status(500).json({ message: "Unable to load ticket prices", error: error.message }); } });
app.patch("/api/admin/ticket-categories/:id", requireAdmin, async (req, res) => { const id = Number(req.params.id), price = Number(req.body?.price); if (!Number.isFinite(price) || price < 0) return res.status(400).json({ message: "Enter a valid price." }); try { if (useMySQL) { const [result] = await dbQuery("UPDATE ticket_categories SET price=? WHERE id=?", [price, id]); if (!result.affectedRows) return res.status(404).json({ message: "Ticket category not found" }); const [[category]] = await dbQuery("SELECT tc.*,e.title event_title FROM ticket_categories tc JOIN events e ON e.id=tc.event_id WHERE tc.id=?", [id]); return res.json(category); } const category = store.ticketCategories.find(item => item.id === id); if (!category) return res.status(404).json({ message: "Ticket category not found" }); category.price = price; res.json({ ...category, event_title: store.events.find(event => event.id === category.event_id)?.title || "Event" }); } catch (error) { res.status(500).json({ message: "Unable to update ticket price", error: error.message }); } });
app.post("/api/admin/qr/verify", requireAdmin, async (req, res) => { const token = String(req.body?.token || "").trim(); if (!token) return res.status(400).json({ valid: false, message: "QR code is empty" }); try { if (useMySQL) { const connection = await pool.getConnection(); try { await connection.beginTransaction(); const [[qr]] = await connection.query("SELECT * FROM qr_tickets WHERE qr_token=? FOR UPDATE", [token]); if (!qr) { await connection.rollback(); return res.status(404).json({ valid: false, message: "Invalid QR ticket" }); } if (qr.verification_status === "used") { await connection.rollback(); return res.status(409).json({ valid: false, duplicate: true, message: `Invalid: QR already used on ${new Date(qr.scanned_at).toLocaleString("en-IN")}.` }); } await connection.query("UPDATE qr_tickets SET verification_status='used',scanned_at=NOW() WHERE id=?", [qr.id]); const [[booking]] = await connection.query("SELECT b.*,e.title event_title,tc.name ticket_name FROM bookings b JOIN events e ON e.id=b.event_id LEFT JOIN ticket_categories tc ON tc.id=b.ticket_category_id WHERE b.id=?", [qr.booking_id]); await connection.commit(); return res.json({ valid: true, message: "ENTRY ALLOWED · QR marked as used.", booking }); } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); } } const qr = store.qrTickets.find(item => item.qr_token === token); if (!qr && /^KG-\d{6}$/.test(token)) { if (legacyDemoScans.has(token)) return res.status(409).json({ valid: false, duplicate: true, message: "Invalid: this legacy demo QR was already scanned." }); legacyDemoScans.add(token); return res.json({ valid: true, legacyDemo: true, message: "DEMO ENTRY ALLOWED · QR marked as used for this server session.", booking: { booking_code: token, customer_name: "Legacy demo booking" } }); } if (!qr) return res.status(404).json({ valid: false, message: "Invalid QR ticket" }); if (qr.verification_status === "used") return res.status(409).json({ valid: false, duplicate: true, message: `Invalid: QR already used on ${new Date(qr.scanned_at).toLocaleString("en-IN")}.` }); qr.verification_status = "used"; qr.scanned_at = new Date().toISOString(); const booking = store.bookings.find(item => item.id === qr.booking_id); res.json({ valid: true, message: "ENTRY ALLOWED · QR marked as used.", booking }); } catch (error) { res.status(500).json({ valid: false, message: "QR verification failed", error: error.message }); } });
app.get("/api/admin/inquiries", requireAdmin, (_req, res) => res.json(store.inquiries));
app.patch("/api/admin/inquiries/:id", requireAdmin, (req, res) => { const inquiry = store.inquiries.find(item => item.id === Number(req.params.id)); if (!inquiry) return res.status(404).json({ message: "Inquiry not found" }); inquiry.status = req.body.status === "resolved" ? "resolved" : "new"; res.json(inquiry); });
app.get("/api/admin/events", requireAdmin, async (_req, res) => { try { res.json(await loadEvents()); } catch (error) { res.status(500).json({ message: "Unable to load events", error: error.message }); } });
app.post("/api/admin/events", requireAdmin, async (req, res) => { const { title, event_date, venue, city, price, capacity } = req.body || {}; if (!title || !event_date || !venue || !city || !price || !capacity) return res.status(400).json({ message: "Complete event fields are required" }); try { if (useMySQL) { const [result] = await dbQuery("INSERT INTO events (title,description,event_date,venue,city,parking_info,entry_guidelines,price,capacity,available_seats) VALUES (?,?,?,?,?,?,?,?,?,?)", [title, "Event created from admin panel.", event_date, venue, city, "Parking available at venue.", "Carry your QR ticket.", Number(price), Number(capacity), Number(capacity)]); const [rows] = await dbQuery("SELECT * FROM events WHERE id=?", [result.insertId]); await dbQuery("INSERT INTO ticket_categories (event_id,name,price,available_quantity) VALUES (?,?,?,?)", [result.insertId, "Regular Pass", Number(price), Number(capacity)]); return res.status(201).json(rows[0]); } const event = { id: nextId(store.events), title, description: "Demo event created from admin panel.", event_date, venue, city, parking_info: "Parking available at venue.", entry_guidelines: "Carry your QR ticket.", price: Number(price), capacity: Number(capacity), available_seats: Number(capacity) }; store.events.push(event); store.ticketCategories.push({ id: nextId(store.ticketCategories), event_id: event.id, name: "Regular Pass", price: Number(price), available_quantity: Number(capacity) }); res.status(201).json(event); } catch (error) { res.status(500).json({ message: "Unable to create event", error: error.message }); } });
app.post("/api/turnstile/verify", async (req, res) => { const token = req.body?.token; if (!token) return res.status(400).json({ success: false, message: "Turnstile token is required" }); if (!process.env.TURNSTILE_SECRET_KEY) return res.json({ success: true, bypassed: true }); try { const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: req.ip }) }); res.json(await response.json()); } catch (error) { res.status(500).json({ success: false, message: "Turnstile verification failed", error: error.message }); } });

app.listen(port, () => console.log(`Kesariya Garba API listening on http://localhost:${port} (${useMySQL ? "MySQL" : "demo data"} mode; payments ${razorpayConfigured && useMySQL ? "razorpay" : "disabled"})`));
