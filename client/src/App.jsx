import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Html5QrcodeScanner } from "html5-qrcode";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const mapsUrl = "https://www.google.com/maps/search/?api=1&query=Grand+Celebration+Ground+Pune";
const whatsappUrl = "https://wa.me/919000000000?text=Hi%20Kesariya%20Garba%2C%20I%20want%20to%20book%20tickets.";
const images = [
  { title: "Garba Circle", src: "https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { title: "Celebration", src: "https://images.pexels.com/photos/28489406/pexels-photo-28489406.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { title: "Navrang", src: "https://images.pexels.com/photos/18983063/pexels-photo-18983063.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { title: "Festival Colours", src: "https://images.pexels.com/photos/8000319/pexels-photo-8000319.jpeg?auto=compress&cs=tinysrgb&w=1400" }
];
const event = { id: 1, title: "Kesariya Navrang 2026", event_date: "2026-10-24T19:00:00+05:30", venue: "Grand Celebration Ground", city: "Pune", available_seats: 2500 };
const passes = [
  { id: 1, key: "day", name: "Couple Day Pass", price: 1500, note: "2 people · one evening", image: images[0].src, tone: "wine" },
  { id: 2, key: "season", name: "5-Day Season Pass", price: 5000, note: "All five Navrang nights", image: images[1].src, tone: "gold", best: true },
  { id: 3, key: "premium", name: "Premium / Corporate Pass", price: 50000, note: "Premium hospitality · group access", image: images[2].src, tone: "violet" }
];
const faqs = [["What does my ticket include?", "Entry to the selected celebration and a digital QR pass for every confirmed booking."], ["Can I show the QR ticket on my phone?", "Yes. Keep the QR visible at entry. A used QR cannot be accepted twice."], ["Is payment real or demo?", "Razorpay Test Mode is used for this build. A QR ticket is issued only after successful payment verification."], ["Is parking available?", "Yes. Current venue data includes parking and a map link."], ["Can I book for a group?", "Yes. Premium / Corporate Pass is available, or contact the organizer for a custom group booking."]];
const formatDate = value => new Date(value).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });
const authHeaders = token => ({ Authorization: `Bearer ${token}`, "content-type": "application/json" });

function useCountdown(target) { const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 }); useEffect(() => { const tick = () => { const seconds = Math.max(0, Math.floor((new Date(target) - Date.now()) / 1000)); setTime({ days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 }); }; tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, [target]); return time; }

function Nav({ onBook, onAdmin }) { const [open, setOpen] = useState(false); const links = [["HOME", "home"], ["ABOUT", "about"], ["EVENT", "event"], ["TICKETS", "tickets"], ["GALLERY", "gallery"], ["CONTACT", "contact"]]; return <header className="site-nav"><a href="#home" className="brand-mark"><span className="brand-sun">✦</span><span><b>KESARIYA</b><small>NAVRANG 2026</small></span></a><nav className={open ? "nav-links open" : "nav-links"}>{links.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>)}<button onClick={onAdmin}>ADMIN</button></nav><button className="nav-cta" onClick={onBook}>BOOK TICKETS</button><button className="menu-toggle" aria-label="Open menu" onClick={() => setOpen(!open)}>☰</button></header>; }

function Hero({ onBook }) { const countdown = useCountdown(event.event_date); return <section id="home" className="dark-page hero-page"><div className="cosmic-ring ring-a"/><div className="cosmic-ring ring-b"/><div className="hero-grid"><div className="hero-copy"><span className="micro-label">THE NAVRANG FEELING</span><h1><span>MOMENTS IN MOTION.</span><strong>MEMORIES IN COLOUR.</strong></h1><p>Five nights of Navrang. One shared rhythm. A premium Garba and Dandiya experience where tradition meets celebration.</p><div className="hero-actions"><button className="gold-button" onClick={onBook}>BOOK YOUR TICKET ↗</button><a className="text-link" href="#event">DISCOVER THE JOURNEY ↓</a></div><div className="countdown-row">{Object.entries(countdown).map(([key, value]) => <div key={key}><b>{String(value).padStart(2, "0")}</b><span>{key}</span></div>)}</div></div><div className="hero-art"><div className="mandala-frame"><img src={images[1].src} alt="Garba celebration"/><div className="mandala-overlay"/><div className="date-stamp"><b>24</b><span>OCT</span></div><div className="art-caption">A CELEBRATION WITH PURPOSE</div></div></div></div></section>; }

function About() { return <section id="about" className="dark-page about-page"><div className="section-intro"><span>THE INVITATION</span><h2>MORE THAN A<br/><em>FESTIVAL.</em></h2><p>A SHARED SPIRITUAL RHYTHM.</p></div><div className="about-grid"><div className="portrait-card"><img src={images[2].src} alt="Navratri celebration"/><div className="card-label">TRADITION · COLOUR · RHYTHM</div></div><div className="about-copy"><div className="story-line"><b>01</b><div><small>THE INVITATION</small><p>Kesariya Navrang is a premium five-night Navratri and Dandiya celebration bringing together culture, music, entertainment and community.</p></div></div><div className="story-line"><b>02</b><div><small>THE EXPERIENCE</small><p>Move through a living mandala of colour, attire, ritual, live percussion, lights and a circular dance floor.</p></div></div></div></div></section>; }

function EventJourney({ onBook }) { const nights = ["VRINDAVAN", "RAJASTHANI ROYAL", "GUJARATI RANG", "BOLLYWOOD BEATS", "GRAND NAVRANG"]; return <section id="event" className="dark-page journey-page"><div className="section-intro centered"><span>THE SPIRITUAL JOURNEY</span><h2>FIVE NIGHTS.<br/><em>ONE EVOLVING SOUL.</em></h2><p>Move through the mandala and awaken each night's distinct ritual, colour, attire and energy.</p></div><div className="orbit-stage"><div className="orbit orbit-1"/><div className="orbit orbit-2"/><div className="orbit-center"><img src={images[0].src} alt="Garba circle"/><span>GARBA CIRCLE</span></div>{nights.map((night, i) => <div key={night} className={`night-node node-${i + 1}`}><small>DAY {i + 1}</small><b>{night}</b></div>)}</div><div className="journey-details"><div><small>FEATURED EVENT</small><h3>{event.title}</h3><p>{formatDate(event.event_date)} · {event.venue}, {event.city}</p></div><button className="gold-button" onClick={onBook}>CHOOSE YOUR PASS ↗</button></div></section>; }

function Tickets({ onBook }) { return <section id="tickets" className="dark-page tickets-page"><div className="section-intro centered"><span>CHOOSE YOUR ENTRY</span><h2>YOUR PASS.<br/><em>YOUR CIRCLE.</em></h2><p>Pick a pass, enter your details, pay securely with Razorpay and receive your QR ticket.</p></div><div className="ticket-grid">{passes.map(pass => <article key={pass.id} className={`nav-ticket ${pass.tone}`}>{pass.best && <div className="ribbon">BEST VALUE</div>}<div className="ticket-image"><img src={pass.image} alt={pass.name}/></div><div className="ticket-content"><small>{pass.key === "day" ? "ONE NIGHT" : pass.key === "season" ? "ALL FIVE NIGHTS" : "PREMIUM HOSPITALITY"}</small><h3>{pass.name}</h3><strong>₹{pass.price.toLocaleString("en-IN")}</strong><p>{pass.note}</p><button onClick={() => onBook(pass)}>BOOK THIS PASS ↗</button></div></article>)}</div><div className="easy-book-strip"><div><span>READY TO GO?</span><h3>Book in under a minute.</h3><p>Choose your pass → enter details → pay securely → receive your QR.</p></div><button className="gold-button" onClick={() => onBook(passes[1])}>QUICK BOOK NOW ↗</button></div></section>; }

function Gallery() { const loop = [...images, ...images]; return <section id="gallery" className="dark-page gallery-page"><div className="section-intro gallery-intro"><span>THE NAVRANG FEELING</span><h2>MOMENTS IN MOTION.<br/><em>MEMORIES IN COLOUR.</em></h2></div><div className="gallery-marquee"><div className="gallery-track">{loop.map((image, i) => <a className="gallery-card" key={`${image.title}-${i}`} href={image.src} target="_blank" rel="noreferrer"><img src={image.src} alt={image.title}/><span>{image.title}</span></a>)}</div></div><div className="gallery-controls"><span>LIVE MOTION GALLERY</span><span>01 — 04</span></div></section>; }

function FAQ() { const [open, setOpen] = useState(0); return <section id="faq" className="faq-page"><div className="section-intro centered"><span>GOOD TO KNOW</span><h2>QUESTIONS.<br/><em>ANSWERED.</em></h2></div><div className="faq-box">{faqs.map(([question, answer], i) => <button key={question} onClick={() => setOpen(open === i ? -1 : i)}><span>{question}</span><b>{open === i ? "−" : "+"}</b>{open === i && <p>{answer}</p>}</button>)}</div></section>; }

function Contact({ onSent }) { const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" }); const [busy, setBusy] = useState(false); const submit = async e => { e.preventDefault(); setBusy(true); try { const response = await fetch(`${API_URL}/api/inquiries`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }); const data = await response.json(); onSent(response.ok ? data.message : "Demo inquiry received."); } catch { onSent("Demo inquiry received. The organizer will follow up shortly."); } finally { setBusy(false); setForm({ name: "", email: "", phone: "", message: "" }); } }; return <section id="contact" className="contact-page"><div className="contact-wrap"><div><span className="gold-label">JOIN THE CIRCLE</span><h2>LET'S MAKE<br/><em>IT FESTIVE.</em></h2><p>For group bookings, sponsorships, partnerships or event questions, reach the Kesariya team.</p><div className="contact-list"><a href={whatsappUrl} target="_blank" rel="noreferrer">WHATSAPP <b>+91 90000 00000</b></a><a href="mailto:hello@kesariya.test">EMAIL <b>hello@kesariya.test</b></a><a href={mapsUrl} target="_blank" rel="noreferrer">VENUE <b>Grand Celebration Ground ↗</b></a></div></div><form onSubmit={submit} className="dark-form"><input required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/><input required type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/><input placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}/><textarea required rows="5" placeholder="Tell us what you need" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}/><button disabled={busy} className="gold-button">{busy ? "SENDING…" : "SEND INQUIRY ↗"}</button></form></div></section>; }

function BookingModal({ initialPass, onClose, onSuccess, onError }) {
  const [passId, setPassId] = useState(initialPass?.id || 2);
  const [quantity, setQuantity] = useState(1);
  const [details, setDetails] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const selected = passes.find(pass => pass.id === passId) || passes[1];
  const total = selected.price * quantity;

  const submit = async e => {
    e.preventDefault();
    setBusy(true);

    try {
      const orderResponse = await fetch(`${API_URL}/api/bookings/order`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          ticketCategoryId: selected.id,
          quantity
        })
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(orderData.message || "Unable to create payment order");
      }

      if (orderData.mode !== "razorpay") {
        throw new Error("Razorpay payment is not active. Set USE_MYSQL=true and configure Razorpay credentials on the server.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout did not load. Refresh the page and try again.");
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Kesariya Navrang",
        description: selected.name,
        order_id: orderData.orderId,
        prefill: {
          name: details.name,
          email: details.email,
          contact: details.phone
        },
        notes: {
          eventId: String(event.id),
          ticketCategoryId: String(selected.id),
          quantity: String(quantity)
        },
        theme: { color: "#f6c43d" },
        handler: async paymentResponse => {
          try {
            const response = await fetch(`${API_URL}/api/bookings/confirm`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                eventId: event.id,
                ticketCategoryId: selected.id,
                customerName: details.name,
                customerEmail: details.email,
                customerPhone: details.phone,
                quantity,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature
              })
            });

            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.message || "Payment verification failed");
            }

            const bookingCode = data.qr;
            const qr = await QRCode.toDataURL(bookingCode, { margin: 1, width: 320 });
            const booking = {
              code: bookingCode,
              qr,
              event,
              pass: selected,
              total: Number(data.booking?.total_amount ?? total),
              quantity,
              details,
              createdAt: new Date().toISOString(),
              serverBacked: true,
              paymentMode: "razorpay",
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpayOrderId: paymentResponse.razorpay_order_id
            };

            localStorage.setItem(`kesariya-booking-${bookingCode}`, JSON.stringify(booking));
            const saved = JSON.parse(localStorage.getItem("kesariya-bookings") || "[]");
            localStorage.setItem("kesariya-bookings", JSON.stringify([booking, ...saved].slice(0, 50)));
            onSuccess(booking);
          } catch (error) {
            onError(error.message);
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false)
        }
      });

      razorpay.on("payment.failed", response => {
        setBusy(false);
        onError(response.error?.description || "Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (error) {
      setBusy(false);
      onError(error.message);
    }
  };

  return <div className="modal-backdrop"><form className="booking-modal quick-book-modal" onSubmit={submit}><button type="button" className="modal-close" onClick={onClose}>×</button><span className="gold-label">QUICK BOOKING · 4 STEPS</span><h2>Reserve your circle.</h2><p className="modal-meta">1. Choose pass · 2. Enter details · 3. Pay securely · 4. Get QR ticket</p><div className="pass-switcher">{passes.map(pass => <button type="button" key={pass.id} className={pass.id === passId ? "active" : ""} onClick={() => setPassId(pass.id)}><b>{pass.name}</b><span>₹{pass.price.toLocaleString("en-IN")}</span></button>)}</div><div className="form-grid"><input autoFocus required placeholder="Full name" value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })}/><input required type="email" placeholder="Email" value={details.email} onChange={e => setDetails({ ...details, email: e.target.value })}/><input required placeholder="Mobile number" value={details.phone} onChange={e => setDetails({ ...details, phone: e.target.value })}/><select value={quantity} onChange={e => setQuantity(Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} booking unit{n > 1 ? "s" : ""}</option>)}</select></div><div className="booking-summary"><div><span>Event</span><b>{event.title}</b></div><div><span>When</span><b>24 Oct 2026 · 7:00 PM</b></div><div><span>Venue</span><b>{event.venue}, {event.city}</b></div><div className="booking-total"><span>Total</span><strong>₹{total.toLocaleString("en-IN")}</strong></div></div><button disabled={busy} className="gold-button full">{busy ? "OPENING PAYMENT…" : "PAY & GET QR ↗"}</button><small className="demo-note">Secure payment powered by Razorpay. Your QR ticket is issued only after successful payment.</small></form></div>;
}

function Confirmation({ booking, onClose }) { const downloadTicket = () => { const link = document.createElement("a"); link.href = booking.qr; link.download = `${booking.code}-qr.png`; link.click(); }; return <div className="modal-backdrop"><div className="confirmation-card"><div className="success-ring">✓</div><span className="gold-label">BOOKING CONFIRMED</span><h2>Your circle is reserved.</h2><p>{booking.pass.name} · {booking.details.name}</p><div className="booking-code">{booking.code}</div><img className="qr-image" src={booking.qr} alt="Booking QR code"/><p className="small-note">Show this QR at entry. It can be used only once.</p><div className="confirmation-actions"><button className="gold-button" onClick={downloadTicket}>SAVE QR</button><button className="text-link" onClick={onClose}>DONE</button></div></div></div>; }

function Scanner({ token, onVerified }) { useEffect(() => { const scanner = new Html5QrcodeScanner("qr-entry-reader", { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true, supportedScanTypes: [0, 1] }, false); scanner.render(decoded => { onVerified(decoded); scanner.clear().catch(() => {}); }, () => {}); return () => { scanner.clear().catch(() => {}); }; }, [token, onVerified]); return <div id="qr-entry-reader" className="qr-scanner"/>; }

function Admin({ onClose, showToast }) {
  const [email, setEmail] = useState("admin@kesariya.test"); const [password, setPassword] = useState("admin123"); const [token, setToken] = useState(""); const [tab, setTab] = useState("overview"); const [notice, setNotice] = useState(""); const [scannerKey, setScannerKey] = useState(0); const [scanResult, setScanResult] = useState(null); const [categories, setCategories] = useState([]); const [bookings, setBookings] = useState([]); const [stats, setStats] = useState({}); const [priceDraft, setPriceDraft] = useState({});
  const loadAdmin = async auth => { const headers = authHeaders(auth); const [s, b, c] = await Promise.all([fetch(`${API_URL}/api/admin/dashboard`, { headers }), fetch(`${API_URL}/api/admin/bookings`, { headers }), fetch(`${API_URL}/api/admin/ticket-categories`, { headers })]); const sd = await s.json(), bd = await b.json(), cd = await c.json(); setStats(sd); setBookings(Array.isArray(bd) ? bd : []); setCategories(Array.isArray(cd) ? cd : []); const drafts = {}; (Array.isArray(cd) ? cd : []).forEach(item => { drafts[item.id] = item.price; }); setPriceDraft(drafts); };
  const login = async e => { e.preventDefault(); try { const response = await fetch(`${API_URL}/api/admin/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setToken(data.token); await loadAdmin(data.token); } catch (error) { setNotice(error.message || "Login failed"); } };
  const verify = async decoded => { let code = decoded; try { const parsed = JSON.parse(decoded); code = parsed.bookingCode || parsed.code || decoded; } catch {} setScanResult({ state: "checking", code }); try { const response = await fetch(`${API_URL}/api/admin/qr/verify`, { method: "POST", headers: authHeaders(token), body: JSON.stringify({ token: code }) }); const data = await response.json(); setScanResult({ ...data, code }); await loadAdmin(token); } catch (error) { setScanResult({ valid: false, message: error.message, code }); } };
  const savePrice = async id => { const price = Number(priceDraft[id]); try { const response = await fetch(`${API_URL}/api/admin/ticket-categories/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ price }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setCategories(items => items.map(item => item.id === id ? data : item)); showToast("Ticket price updated."); } catch (error) { showToast(error.message); } };
  if (!token) return <div className="modal-backdrop"><form className="admin-login" onSubmit={login}><button type="button" className="modal-close" onClick={onClose}>×</button><span className="gold-label">ORGANIZER CONSOLE</span><h2>Admin access.</h2><p>Manage entry scanning and ticket prices from one screen.</p><input required type="email" placeholder="admin@kesariya.test" value={email} onChange={e => setEmail(e.target.value)}/><input required type="password" placeholder="admin123" value={password} onChange={e => setPassword(e.target.value)}/>{notice && <div className="error-box">{notice}</div>}<button className="gold-button full">LOGIN ↗</button></form></div>;
  return <div className="modal-backdrop"><div className="admin-panel admin-panel-wide"><button className="modal-close" onClick={onClose}>×</button><span className="gold-label">KESARIYA NAVRANG · ORGANIZER</span><h2>Admin control room.</h2><div className="admin-tabs"><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>Overview</button><button className={tab === "scan" ? "active" : ""} onClick={() => { setTab("scan"); setScanResult(null); setScannerKey(k => k + 1); }}>Scan Entry</button><button className={tab === "prices" ? "active" : ""} onClick={() => setTab("prices")}>Ticket Prices</button></div>{tab === "overview" && <><div className="admin-stats"><div><b>{stats.bookings ?? 0}</b><span>Bookings</span></div><div><b>{stats.ticketsSold ?? 0}</b><span>Tickets sold</span></div><div><b>₹{Number(stats.revenue || 0).toLocaleString("en-IN")}</b><span>Revenue</span></div><div><b>{stats.qrUsed ?? 0}</b><span>QR entries used</span></div></div><div className="admin-list">{bookings.length ? bookings.map(booking => <div key={booking.id || booking.booking_code}><b>{booking.booking_code}</b><span>{booking.customer_name || booking.customerName} · {booking.ticket_name || booking.pass?.name || "Ticket"}</span><strong>{booking.verification_status === "used" ? "USED" : "UNUSED"}</strong></div>) : <p>No bookings yet.</p>}</div></>}{tab === "scan" && <div className="scanner-panel"><div><h3>Scan customer QR</h3><p>Use the camera on your phone/laptop, or choose an image of the QR. The server marks a valid QR as <b>USED</b> immediately.</p></div><Scanner key={scannerKey} token={scannerKey} onVerified={verify}/>{scanResult && <div className={`scan-result ${scanResult.valid ? "valid" : "invalid"}`}>{scanResult.state === "checking" ? "CHECKING…" : scanResult.valid ? `✓ ${scanResult.message}` : `✕ ${scanResult.message}`}{scanResult.booking?.customer_name && <small>Guest: {scanResult.booking.customer_name}</small>}{scanResult.code && <small>Code: {scanResult.code}</small>}</div>}<button className="gold-button" onClick={() => { setScanResult(null); setScannerKey(k => k + 1); }}>SCAN NEXT QR</button></div>}{tab === "prices" && <div className="price-editor"><div className="price-editor-head"><div><h3>Ticket pricing</h3><p>If sales are slow, change a pass price here. New bookings immediately use the updated price.</p></div></div>{categories.map(category => <div className="price-row" key={category.id}><div><b>{category.name}</b><small>{category.event_title} · {category.available_quantity} remaining</small></div><label>₹<input type="number" min="0" step="50" value={priceDraft[category.id] ?? category.price} onChange={e => setPriceDraft({ ...priceDraft, [category.id]: e.target.value })}/></label><button className="gold-button" onClick={() => savePrice(category.id)}>SAVE</button></div>)}</div>}<button className="text-link admin-close" onClick={onClose}>CLOSE ADMIN</button></div></div>;
}

export default function App() { const [bookingPass, setBookingPass] = useState(null); const [confirmation, setConfirmation] = useState(null); const [adminOpen, setAdminOpen] = useState(false); const [toast, setToast] = useState(""); const openBooking = pass => setBookingPass(pass || passes[1]); const showToast = message => { setToast(message); setTimeout(() => setToast(""), 3500); }; return <div className="app-shell"><Nav onBook={() => openBooking()} onAdmin={() => setAdminOpen(true)}/><main><Hero onBook={() => openBooking()}/><About/><EventJourney onBook={() => openBooking()}/><Tickets onBook={openBooking}/><Gallery/><FAQ/><Contact onSent={showToast}/></main><button className="floating-book" onClick={() => openBooking()}><span>₹</span> BOOK TICKETS <b>↗</b></button><footer className="site-footer"><span>KESARIYA NAVRANG 2026</span><span>GARBA · DANDIYA · COMMUNITY</span></footer>{bookingPass && <BookingModal initialPass={bookingPass} onClose={() => setBookingPass(null)} onSuccess={booking => { setBookingPass(null); setConfirmation(booking); }} onError={showToast}/>} {confirmation && <Confirmation booking={confirmation} onClose={() => setConfirmation(null)}/>} {adminOpen && <Admin onClose={() => setAdminOpen(false)} showToast={showToast}/>} {toast && <div className="toast-message">{toast}</div>}</div>; }
