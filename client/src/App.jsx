import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const mapsUrl = "https://www.google.com/maps/search/?api=1&query=Grand+Celebration+Ground+Pune";
const whatsappUrl = "https://wa.me/919000000000?text=Hi%20Kesariya%20Garba%2C%20I%20want%20to%20know%20more%20about%20tickets.";

const fallbackEvents = [
  { id: 1, title: "Kesariya Grand Garba Night", description: "A premium Navratri celebration with live garba, dandiya, folk beats, lights and food stalls.", event_date: "2026-10-24T19:00:00+05:30", venue: "Grand Celebration Ground", city: "Pune", price: 499, capacity: 2500, available_seats: 2500 },
  { id: 2, title: "Kesariya Dandiya Under The Stars", description: "An open-air dandiya night with a live DJ, folk percussion and a family-friendly dance floor.", event_date: "2026-10-31T19:30:00+05:30", venue: "Riverside Lawns", city: "Pune", price: 599, capacity: 1800, available_seats: 1800 }
];

const galleryFallback = [
  { id: 1, title: "Dandiya Circle", image_url: "https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=1200", caption: "Dandiya sticks, colour and rhythm" },
  { id: 2, title: "Festival Colours", image_url: "https://images.pexels.com/photos/28489406/pexels-photo-28489406.jpeg?auto=compress&cs=tinysrgb&w=1200", caption: "Traditional Indian festival attire" },
  { id: 3, title: "Garba Fashion", image_url: "https://images.pexels.com/photos/18983063/pexels-photo-18983063.jpeg?auto=compress&cs=tinysrgb&w=1200", caption: "Vibrant festive dress" },
  { id: 4, title: "Navratri Details", image_url: "https://images.pexels.com/photos/8000319/pexels-photo-8000319.jpeg?auto=compress&cs=tinysrgb&w=1200", caption: "Dandiya and Navratri decorations" }
];

const faqs = [
  ["What does my ticket include?", "Your ticket includes entry to the selected Garba/Dandiya event and one digital QR pass per booking."],
  ["Can I show the QR ticket on my phone?", "Yes. Keep the QR code ready on your phone. The admin team scans it at entry and a used QR cannot be accepted again."],
  ["Is payment real or demo?", "The current repository runs in demo payment mode by default. Add Razorpay credentials and enable MySQL to switch to the production payment flow."],
  ["Is there parking?", "Yes. Demo venue data includes parking. Use the venue map button for directions."],
  ["Can I cancel a ticket?", "Cancellation/refund policy is currently represented as a demo workflow and can be connected to the organizer's final policy before launch."]
];

function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });
}

function useCountdown(target) {
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now());
      const total = Math.floor(diff / 1000);
      setLeft({ days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60 });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);
  return left;
}

function Nav({ onAdmin }) {
  const links = [["Home", "home"], ["Event", "event"], ["Tickets", "tickets"], ["Gallery", "gallery"], ["FAQ", "faq"], ["Contact", "contact"]];
  return <header className="sticky top-0 z-40 border-b border-orange-100/80 bg-[#fffaf4]/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
      <a href="#home" className="group flex items-center gap-3 font-black tracking-tight">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff9f1c] to-[#c1121f] text-xl text-white shadow-lg shadow-orange-200">ॐ</span>
        <span><span className="block text-xs uppercase tracking-[.28em] text-[#c1121f]">Kesariya</span><span className="text-lg text-[#3d1424]">Dandiya Nights</span></span>
      </a>
      <nav className="hidden items-center gap-6 lg:flex">
        {links.map(([label, id]) => <a key={id} href={`#${id}`} className="nav-link">{label}</a>)}
        <button onClick={onAdmin} className="rounded-full border border-[#6d2140] px-4 py-2 text-sm font-bold text-[#6d2140] hover:bg-[#6d2140] hover:text-white">Admin</button>
      </nav>
      <a href="#tickets" className="rounded-full bg-[#c1121f] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5">Book Tickets</a>
    </div>
  </header>;
}

function FloatingDecor() {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
    {["✦", "✧", "•", "✦", "•", "✧", "✦", "•"].map((symbol, i) => <span key={i} className={`spark spark-${i + 1}`}>{symbol}</span>)}
    <div className="floating-diya diya-one">🪔</div><div className="floating-diya diya-two">🪔</div>
  </div>;
}

function Hero({ event, onBook }) {
  const countdown = useCountdown(event?.event_date || "2026-10-24T19:00:00+05:30");
  return <section id="home" className="hero-shell relative overflow-hidden">
    <div className="hero-orb orb-one"/><div className="hero-orb orb-two"/>
    <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
      <div className="relative z-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.25em] text-orange-100 backdrop-blur">✦ Navratri 2026 · Pune</div>
        <h1 className="display-font max-w-3xl text-5xl font-black leading-[.95] text-white sm:text-6xl lg:text-8xl">Rang, Raas &amp; <span className="text-[#ffd166]">Kesariya</span>.</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-orange-50/90">A high-energy Garba &amp; Dandiya celebration built for music lovers, families and friends. Dress festive. Bring your best steps.</p>
        <div className="mt-9 flex flex-wrap gap-3"><button onClick={onBook} className="btn-gold">Book Tickets <span>↗</span></button><a href="#gallery" className="btn-glass">See the vibe</a></div>
        <div className="mt-10 grid max-w-xl grid-cols-4 gap-2 sm:gap-3">
          {Object.entries(countdown).map(([key, value]) => <div key={key} className="count-box"><b>{String(value).padStart(2, "0")}</b><span>{key}</span></div>)}
        </div>
      </div>
      <div className="relative z-20 mx-auto w-full max-w-xl lg:max-w-none">
        <div className="hero-image-frame">
          <img src="https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=1400" alt="People celebrating with colourful dandiya sticks" />
          <div className="hero-image-gradient"/><div className="hero-badge"><span>24</span><small>OCT</small></div>
          <div className="hero-caption"><span className="pulse-dot"/> LIVE GARBA NIGHT <span>·</span> GRAND CELEBRATION GROUND</div>
        </div>
      </div>
    </div>
  </section>;
}

function EventSection({ event, onBook }) {
  return <section id="event" className="section-pad bg-[#fffaf4]">
    <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
      <div className="relative"><img className="rounded-[2rem] object-cover shadow-2xl shadow-[#6d2140]/15" src="https://images.pexels.com/photos/28489406/pexels-photo-28489406.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Traditional Indian dancers in colourful attire"/><div className="image-note">Festive energy<br/><strong>All night long</strong></div></div>
      <div><span className="eyebrow">The celebration</span><h2 className="section-title">One night. <em>Many colours.</em></h2><p className="section-copy">{event?.description || "Experience a modern Navratri night with traditional roots, live percussion, immersive lights and a huge circular dance floor."}</p>
        <div className="info-grid"><Info label="Date & Time" value={formatDate(event?.event_date || "2026-10-24T19:00:00+05:30")} icon="◷"/><Info label="Venue" value={`${event?.venue || "Grand Celebration Ground"}, ${event?.city || "Pune"}`} icon="⌖"/><Info label="Parking" value={event?.parking_info || "On-site parking available"} icon="P"/><Info label="Entry" value={event?.entry_guidelines || "Digital QR ticket required"} icon="✓"/></div>
        <div className="mt-7 flex flex-wrap gap-3"><button onClick={onBook} className="btn-primary">Reserve your spot</button><a className="btn-outline" href={mapsUrl} target="_blank" rel="noreferrer">Open venue map ↗</a></div>
      </div>
    </div>
  </section>;
}

function Info({ label, value, icon }) { return <div className="info-card"><span className="info-icon">{icon}</span><div><small>{label}</small><p>{value}</p></div></div>; }

function Tickets({ events, onBook }) {
  return <section id="tickets" className="section-pad ticket-bg"><div className="mx-auto max-w-7xl px-5"><div className="text-center"><span className="eyebrow">Tickets</span><h2 className="section-title">Pick your <em>pass</em>.</h2><p className="section-copy mx-auto">Demo ticket inventory is live and updates instantly after each booking.</p></div>
    <div className="mt-12 grid gap-6 md:grid-cols-2">{events.map((event, index) => <article key={event.id} className={`ticket-card ${index === 0 ? "ticket-featured" : ""}`}><div className="ticket-top"><span className="ticket-chip">{index === 0 ? "MAIN NIGHT" : "SPECIAL NIGHT"}</span><span>{event.available_seats} seats left</span></div><h3>{event.title}</h3><p>{formatDate(event.event_date)}<br/>{event.venue}, {event.city}</p><div className="ticket-price"><span>from</span><strong>₹{Number(event.price).toFixed(0)}</strong><button onClick={() => onBook(event)}>Choose tickets →</button></div></article>)}</div>
  </div></section>;
}

function Gallery({ images }) { return <section id="gallery" className="section-pad bg-[#321225] text-white"><div className="mx-auto max-w-7xl px-5"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="eyebrow light">Gallery</span><h2 className="section-title light-title">See the <em>vibe</em>.</h2></div><a href="https://www.pexels.com/search/navratri%20and%20dandiya/" target="_blank" rel="noreferrer" className="text-sm font-bold text-orange-200 hover:text-white">More festival inspiration ↗</a></div><div className="mt-10 grid auto-rows-[220px] grid-cols-2 gap-4 md:grid-cols-4 md:auto-rows-[260px]">{images.map((item, i) => <a key={item.id} href={item.image_url} target="_blank" rel="noreferrer" className={`gallery-tile ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}><img src={item.image_url} alt={item.title}/><div><b>{item.title}</b><span>{item.caption}</span></div></a>)}</div></div></section>; }

function FAQ() { const [open, setOpen] = useState(0); return <section id="faq" className="section-pad bg-[#fffaf4]"><div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[.7fr_1.3fr]"><div><span className="eyebrow">FAQ</span><h2 className="section-title">Everything you need to <em>know.</em></h2><p className="section-copy">Questions about tickets, entry, payments and the event experience.</p></div><div className="faq-list">{faqs.map(([q,a],i)=><button key={q} onClick={()=>setOpen(open===i?-1:i)} className="faq-row"><span>{q}</span><b>{open===i?"−":"+"}</b>{open===i&&<p>{a}</p>}</button>)}</div></div></section>; }

function Contact({ onSent }) { const [form,setForm]=useState({name:"",email:"",phone:"",message:""}); const [busy,setBusy]=useState(false); const submit=async(e)=>{e.preventDefault();setBusy(true);try{const r=await fetch(`${API_URL}/api/inquiries`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw new Error(d.message);onSent(d.message);setForm({name:"",email:"",phone:"",message:""});}catch(err){onSent(err.message)}finally{setBusy(false)}}; return <section id="contact" className="section-pad bg-[#f6e6d2]"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.9fr_1.1fr]"><div><span className="eyebrow">Contact</span><h2 className="section-title">Let's make it <em>festive.</em></h2><p className="section-copy">For group bookings, sponsorships or event questions, reach the team directly.</p><div className="mt-8 space-y-4"><a href={whatsappUrl} target="_blank" rel="noreferrer" className="contact-link"><span>◉</span><div><small>WhatsApp</small><b>+91 90000 00000</b></div></a><a href="mailto:hello@kesariya.test" className="contact-link"><span>✉</span><div><small>Email</small><b>hello@kesariya.test</b></div></a><a href="tel:+919000000000" className="contact-link"><span>☎</span><div><small>Call</small><b>+91 90000 00000</b></div></a></div></div><form onSubmit={submit} className="contact-form"><div className="grid gap-4 sm:grid-cols-2"><input required placeholder="Your name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div><input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><textarea required rows="5" placeholder="How can we help?" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><button disabled={busy} className="btn-primary w-full">{busy?"Sending…":"Send inquiry →"}</button></form></div></section>; }

function BookingModal({ event, onClose, onConfirmed }) {
  const [detail,setDetail]=useState({ticketCategoryId:"",customerName:"",customerEmail:"",customerPhone:"",quantity:1});
  const [categories,setCategories]=useState([]); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  useEffect(()=>{fetch(`${API_URL}/api/events/${event.id}`).then(r=>r.json()).then(d=>{const c=d.ticket_categories||[];setCategories(c);setDetail(v=>({...v,ticketCategoryId:c[0]?.id||""}));}).catch(()=>setCategories([{id:1,name:"Regular Pass",price:event.price,available_quantity:event.available_seats}]));},[event]);
  const category=categories.find(c=>Number(c.id)===Number(detail.ticketCategoryId))||categories[0]; const total=Number(category?.price||event.price)*Number(detail.quantity||1);
  const confirm=async(e)=>{e.preventDefault();setBusy(true);setError("");try{const orderR=await fetch(`${API_URL}/api/bookings/order`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({eventId:event.id,ticketCategoryId:detail.ticketCategoryId,quantity:Number(detail.quantity)})});const order=await orderR.json();if(!orderR.ok)throw new Error(order.message);if(order.mode==="razorpay"&&window.Razorpay){new window.Razorpay({key:order.keyId,amount:order.amount,currency:order.currency,name:"Kesariya Dandiya Nights",description:event.title,order_id:order.orderId,prefill:{name:detail.customerName,email:detail.customerEmail,contact:detail.customerPhone},handler:async(response)=>{const r=await fetch(`${API_URL}/api/bookings/confirm`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...detail,eventId:event.id,quantity:Number(detail.quantity),paymentRef:response.razorpay_payment_id})});const d=await r.json();if(!r.ok)throw new Error(d.message);onConfirmed(d);}}).open();}else{await new Promise(r=>setTimeout(r,500));const r=await fetch(`${API_URL}/api/bookings/confirm`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...detail,eventId:event.id,quantity:Number(detail.quantity),paymentRef:`DEMO-${Date.now()}`})});const d=await r.json();if(!r.ok)throw new Error(d.message);onConfirmed(d);}}catch(err){setError(err.message)}finally{setBusy(false)}};
  return <div className="modal-backdrop"><form onSubmit={confirm} className="booking-modal"><button type="button" onClick={onClose} className="modal-close">×</button><span className="eyebrow">Secure booking</span><h2>{event.title}</h2><p className="text-sm text-stone-500">{formatDate(event.event_date)} · {event.venue}</p><div className="mt-6 grid gap-4"><select required value={detail.ticketCategoryId} onChange={e=>setDetail({...detail,ticketCategoryId:e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.name} · ₹{c.price}</option>)}</select><input required placeholder="Full name" value={detail.customerName} onChange={e=>setDetail({...detail,customerName:e.target.value})}/><div className="grid gap-4 sm:grid-cols-2"><input required type="email" placeholder="Email" value={detail.customerEmail} onChange={e=>setDetail({...detail,customerEmail:e.target.value})}/><input required placeholder="Phone" value={detail.customerPhone} onChange={e=>setDetail({...detail,customerPhone:e.target.value})}/></div><input required min="1" max="10" type="number" value={detail.quantity} onChange={e=>setDetail({...detail,quantity:e.target.value})}/></div><div className="booking-total"><span>Total</span><strong>₹{total.toFixed(0)}</strong></div>{error&&<div className="error-box">{error}</div>}<button disabled={busy} className="btn-primary w-full">{busy?"Confirming…":"Continue to payment →"}</button><p className="mt-3 text-center text-xs text-stone-400">Demo mode: no real money is charged unless Razorpay credentials are configured.</p></form></div>;
}

function Confirmation({ data, onClose }) { const [qr,setQr]=useState(""); useEffect(()=>{QRCode.toDataURL(data.qr,{width:300,margin:2}).then(setQr)},[data.qr]); return <div className="modal-backdrop"><div className="confirmation-card"><div className="success-mark">✓</div><span className="eyebrow">Booking confirmed</span><h2>Your Garba pass is ready.</h2><p>Show this QR at the entrance. It will be marked as used after the first successful scan.</p>{qr&&<img src={qr} alt="Booking QR code" className="mx-auto mt-5 w-52 rounded-2xl"/>}<div className="booking-code">{data.booking.booking_code}</div><div className="grid grid-cols-2 gap-3"><a className="btn-outline" href={`mailto:${data.booking.customer_email}?subject=Kesariya%20Garba%20Ticket&body=Booking%20${data.booking.booking_code}`} >Email ticket</a><button onClick={onClose} className="btn-primary">Done</button></div></div></div>; }

function Admin({ onExit }) { const [token,setToken]=useState(localStorage.getItem("kesariya_admin")||""); const [login,setLogin]=useState({email:"admin@kesariya.test",password:"admin123"}); const [dash,setDash]=useState(null); const [bookings,setBookings]=useState([]); const [scan,setScan]=useState(""); const [scanResult,setScanResult]=useState(null); const [inquiries,setInquiries]=useState([]); const [tab,setTab]=useState("overview");
  const headers=token?{Authorization:`Bearer ${token}`}:{};
  const load=async()=>{const [d,b,i]=await Promise.all([fetch(`${API_URL}/api/admin/dashboard`,{headers}),fetch(`${API_URL}/api/admin/bookings`,{headers}),fetch(`${API_URL}/api/admin/inquiries`,{headers})]);if(d.ok)setDash(await d.json());if(b.ok)setBookings(await b.json());if(i.ok)setInquiries(await i.json())};
  useEffect(()=>{if(token)load()},[token]);
  const doLogin=async(e)=>{e.preventDefault();const r=await fetch(`${API_URL}/api/admin/login`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(login)});const d=await r.json();if(!r.ok)return alert(d.message);localStorage.setItem("kesariya_admin",d.token);setToken(d.token)};
  const verify=async(e)=>{e.preventDefault();const r=await fetch(`${API_URL}/api/admin/qr/verify`,{method:"POST",headers:{...headers,"content-type":"application/json"},body:JSON.stringify({token:scan})});const d=await r.json();setScanResult({ok:r.ok,...d});if(r.ok){setScan("");load()}};
  if(!token)return <div className="min-h-screen bg-[#321225] px-5 py-16"><form onSubmit={doLogin} className="admin-login"><span className="eyebrow light">Organizer access</span><h1>Kesariya Admin</h1><p>Demo credentials are pre-filled. This panel covers bookings, QR verification and inquiries.</p><input type="email" value={login.email} onChange={e=>setLogin({...login,email:e.target.value})}/><input type="password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})}/><button className="btn-gold w-full">Sign in</button><button type="button" onClick={onExit} className="btn-glass w-full">Back to website</button></form></div>;
  return <div className="min-h-screen bg-[#f8efe5]"><div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 lg:flex-row"><aside className="admin-side"><div className="flex items-center justify-between lg:block"><div><span className="text-xs font-black uppercase tracking-[.25em] text-orange-300">Kesariya</span><h2>Admin Panel</h2></div><button className="lg:hidden" onClick={onExit}>×</button></div><div className="mt-8 space-y-2">{[["overview","Dashboard"],["scanner","QR Scanner"],["bookings","Bookings"],["inquiries","Inquiries"]].map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={tab===id?"admin-tab active":"admin-tab"}>{label}</button>)}</div><button onClick={()=>{localStorage.removeItem("kesariya_admin");setToken("")}} className="mt-8 text-sm font-bold text-orange-200">Sign out</button></aside><main className="min-w-0 flex-1">{tab==="overview"&&<><div className="mb-7 flex items-end justify-between"><div><span className="eyebrow">Overview</span><h1 className="text-4xl font-black text-[#321225]">Good evening, organizer.</h1></div><button onClick={onExit} className="btn-outline">View website</button></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Events",dash?.events],["Bookings",dash?.bookings],["Tickets sold",dash?.ticketsSold],["Revenue",`₹${dash?.revenue||0}`],["New inquiries",dash?.inquiries],["QR scans",dash?.qrUsed]].map(([label,value])=><div key={label} className="stat-card"><small>{label}</small><strong>{value??"—"}</strong></div>)}</div><div className="mt-6 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">QR entry workflow</h2><p className="mt-2 text-stone-500">Scan or paste a ticket code. The first valid scan is accepted; the same QR is rejected afterwards.</p><button onClick={()=>setTab("scanner")} className="btn-primary mt-5">Open scanner</button></div></>}{tab==="scanner"&&<div className="rounded-3xl bg-white p-7 shadow-sm"><span className="eyebrow">Entry control</span><h1 className="text-4xl font-black text-[#321225]">Verify QR ticket</h1><form onSubmit={verify} className="mt-8 flex flex-col gap-3 sm:flex-row"><input className="flex-1" placeholder="Paste QR token e.g. KGR-DEMO-1001" value={scan} onChange={e=>setScan(e.target.value)}/><button className="btn-primary">Verify entry</button></form>{scanResult&&<div className={`mt-6 rounded-2xl p-5 ${scanResult.ok?"bg-emerald-50 text-emerald-800":"bg-red-50 text-red-800"}`}><b>{scanResult.message}</b>{scanResult.booking&&<p className="mt-1">{scanResult.booking.customer_name} · {scanResult.booking.quantity} tickets</p>}</div>}<div className="mt-10 rounded-2xl bg-[#fff7ed] p-5"><b>Demo QR:</b> KGR-DEMO-1001 <span className="text-sm text-stone-500">(use once to test duplicate protection)</span></div></div>}{tab==="bookings"&&<div className="rounded-3xl bg-white p-7 shadow-sm"><span className="eyebrow">Sales</span><h1 className="text-4xl font-black text-[#321225]">Bookings</h1><div className="mt-6 overflow-x-auto"><table className="admin-table"><thead><tr><th>Code</th><th>Guest</th><th>Tickets</th><th>Amount</th><th>QR</th></tr></thead><tbody>{bookings.map(b=><tr key={b.id}><td>{b.booking_code}</td><td>{b.customer_name}<small>{b.customer_email}</small></td><td>{b.quantity}</td><td>₹{b.total_amount}</td><td><span className={b.qr?.verification_status==="used"?"pill used":"pill"}>{b.qr?.verification_status}</span></td></tr>)}</tbody></table></div></div>}{tab==="inquiries"&&<div className="rounded-3xl bg-white p-7 shadow-sm"><span className="eyebrow">Inbox</span><h1 className="text-4xl font-black text-[#321225]">Inquiries</h1><div className="mt-6 space-y-3">{inquiries.length?inquiries.map(i=><div key={i.id} className="rounded-2xl border border-stone-100 p-5"><div className="flex justify-between gap-4"><b>{i.name}</b><span className="pill">{i.status}</span></div><p className="mt-2 text-sm text-stone-500">{i.email} · {i.phone}</p><p className="mt-3">{i.message}</p></div>):<p className="text-stone-500">No inquiries yet. Submit one from the website contact form.</p>}</div></div>}</main></div></div>;
}

function Footer({ onAdmin }) { return <footer className="bg-[#210d19] py-12 text-orange-100"><div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-3"><div><div className="text-2xl font-black">KESARIYA</div><p className="mt-2 max-w-sm text-sm text-orange-200/70">A digital booking experience for modern Navratri and Dandiya nights.</p></div><div><b>Quick links</b><div className="mt-3 grid grid-cols-2 gap-2 text-sm text-orange-200/70"><a href="#event">Event</a><a href="#tickets">Tickets</a><a href="#gallery">Gallery</a><a href="#faq">FAQ</a><a href="#contact">Contact</a><button className="text-left" onClick={onAdmin}>Admin</button></div></div><div><b>Venue</b><p className="mt-3 text-sm text-orange-200/70">Grand Celebration Ground<br/>Pune, Maharashtra</p><a className="mt-3 inline-block text-sm font-bold text-orange-200" href={mapsUrl} target="_blank" rel="noreferrer">Get directions ↗</a></div></div><div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-5 pt-5 text-xs text-orange-200/40">© 2026 Kesariya Dandiya Nights · Demo event platform</div></footer>; }

export default function App() {
  const [page,setPage]=useState(window.location.hash==="#admin"?"admin":"site"); const [events,setEvents]=useState(fallbackEvents); const [gallery,setGallery]=useState(galleryFallback); const [selectedEvent,setSelectedEvent]=useState(null); const [confirmation,setConfirmation]=useState(null); const [toast,setToast]=useState("");
  useEffect(()=>{const onHash=()=>setPage(window.location.hash==="#admin"?"admin":"site");window.addEventListener("hashchange",onHash);return()=>window.removeEventListener("hashchange",onHash)},[]);
  useEffect(()=>{Promise.all([fetch(`${API_URL}/api/events`).then(r=>r.ok?r.json():fallbackEvents),fetch(`${API_URL}/api/gallery`).then(r=>r.ok?r.json():galleryFallback)]).then(([e,g])=>{if(e?.length)setEvents(e);if(g?.length)setGallery(g)}).catch(()=>{})},[]);
  const mainEvent=events[0]; const openBook=(event=mainEvent)=>setSelectedEvent(event); const sent=(message)=>{setToast(message);setTimeout(()=>setToast(""),3500)};
  if(page==="admin")return <Admin onExit={()=>{window.location.hash="home";setPage("site")}}/>;
  return <div className="min-h-screen bg-[#fffaf4]"><FloatingDecor/><Nav onAdmin={()=>{window.location.hash="admin";setPage("admin")}}/><Hero event={mainEvent} onBook={()=>openBook()}/><EventSection event={mainEvent} onBook={()=>openBook()}/><Tickets events={events} onBook={openBook}/><section className="ticker"><div>✦ LIVE Dhol &nbsp; ✦ Dandiya Circle &nbsp; ✦ Navratri Colours &nbsp; ✦ Family Friendly &nbsp; ✦ Food Court &nbsp; ✦ Live DJ &nbsp; ✦</div></section><Gallery images={gallery}/><FAQ/><Contact onSent={sent}/><Footer onAdmin={()=>{window.location.hash="admin";setPage("admin")}}/>{selectedEvent&&<BookingModal event={selectedEvent} onClose={()=>setSelectedEvent(null)} onConfirmed={(data)=>{setSelectedEvent(null);setConfirmation(data);fetch(`${API_URL}/api/events`).then(r=>r.json()).then(setEvents).catch(()=>{})}}/>}{confirmation&&<Confirmation data={confirmation} onClose={()=>setConfirmation(null)}/>} {toast&&<div className="toast">✓ {toast}</div>}</div>;
}
