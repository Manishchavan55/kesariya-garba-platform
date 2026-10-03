import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ customerName: "", customerEmail: "", customerPhone: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/events`)
      .then((res) => res.json())
      .then(setEvents)
      .catch(() => setMessage("Unable to load events right now."));
  }, []);

  const total = useMemo(
    () => (selectedEvent ? Number(selectedEvent.price) * Number(quantity) : 0),
    [selectedEvent, quantity]
  );

  function openBooking(event) {
    setSelectedEvent(event);
    setQuantity(1);
    setMessage("");
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleBooking(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const orderResponse = await fetch(`${API_URL}/api/bookings/order`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          quantity
        })
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.message || "Could not create payment order");

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout script is not loaded. Add it to index.html before production use.");
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Kesariya Garba Night",
        description: selectedEvent.title,
        order_id: order.orderId,
        prefill: {
          name: form.customerName,
          email: form.customerEmail,
          contact: form.customerPhone
        },
        handler: async (response) => {
          const verifyResponse = await fetch(`${API_URL}/api/bookings/verify`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              eventId: selectedEvent.id,
              quantity,
              ...form,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          });
          const result = await verifyResponse.json();
          setMessage(result.message || (verifyResponse.ok ? "Booking confirmed!" : "Booking verification failed."));
          if (verifyResponse.ok) setSelectedEvent(null);
        }
      });

      checkout.open();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-amber-50 text-stone-900">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-orange-600 via-red-600 to-amber-500 p-8 text-white shadow-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]">Kesariya Garba</p>
          <h1 className="text-4xl font-black md:text-6xl">Dance. Celebrate. Repeat.</h1>
          <p className="mt-4 max-w-2xl text-lg text-orange-50">
            Reserve your place for an unforgettable night of live garba, dandiya, music and festive energy.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {events.map((item) => (
              <article key={item.id} className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-orange-600">{new Date(item.event_date).toLocaleString()}</p>
                <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-stone-600">{item.venue}, {item.city}</p>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold">₹{Number(item.price).toFixed(0)}</div>
                    <div className="text-sm text-stone-500">{item.available_seats} seats left</div>
                  </div>
                  <button
                    className="rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-stone-700"
                    onClick={() => openBooking(item)}
                  >
                    Book Tickets
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-amber-200">
            {message}
          </div>
        )}

        {selectedEvent && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
            <form onSubmit={handleBooking} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Complete Booking</h2>
                  <p className="mt-1 text-sm text-stone-500">{selectedEvent.title}</p>
                </div>
                <button type="button" onClick={() => setSelectedEvent(null)} className="text-stone-500">✕</button>
              </div>

              <div className="mt-6 space-y-4">
                <input
                  required
                  placeholder="Full name"
                  value={form.customerName}
                  onChange={(e) => updateField("customerName", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={form.customerEmail}
                  onChange={(e) => updateField("customerEmail", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  required
                  placeholder="Phone"
                  value={form.customerPhone}
                  onChange={(e) => updateField("customerPhone", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400"
                />
                <div>
                  <label className="mb-2 block text-sm font-medium">Tickets</label>
                  <input
                    required
                    min="1"
                    max={selectedEvent.available_seats}
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-5">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-black">₹{total.toFixed(0)}</span>
              </div>

              <button
                disabled={loading}
                className="mt-5 w-full rounded-xl bg-orange-600 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {loading ? "Preparing checkout…" : "Pay with Razorpay"}
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
