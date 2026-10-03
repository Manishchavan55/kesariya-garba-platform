import QRCode from "qrcode";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const categoryMap = new Map();
const normalize = value => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");

async function loadLiveTicketData() {
  try {
    const response = await fetch(`${API_URL}/api/events/1`, { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const data = await response.json();
    const categories = Array.isArray(data.ticket_categories) ? data.ticket_categories : [];
    categoryMap.clear();
    categories.forEach(category => categoryMap.set(Number(category.id), category));
    syncTicketCards(categories);
    syncBookingModal();
  } catch {
    // The page remains usable in demo/offline mode with its bundled prices.
  }
}

function findCategoryForText(text) {
  const wanted = normalize(text);
  return [...categoryMap.values()].find(category => normalize(category.name) === wanted);
}

function syncTicketCards(categories) {
  const cards = [...document.querySelectorAll(".nav-ticket")];
  cards.forEach(card => {
    const titleNode = card.querySelector(".ticket-content h3");
    const category = findCategoryForText(titleNode?.textContent);
    if (!category) return;
    const price = Number(category.price || 0).toLocaleString("en-IN");
    const priceNode = card.querySelector(".ticket-content > strong");
    if (priceNode) priceNode.textContent = `₹${price}`;
    titleNode.textContent = category.name;
    card.dataset.ticketCategoryId = String(category.id);
    card.dataset.ticketPrice = String(category.price);
  });
}

function syncBookingModal() {
  const modal = document.querySelector(".quick-book-modal");
  const switcher = modal?.querySelector(".pass-switcher");
  if (!modal || !switcher || categoryMap.size === 0) return;
  const buttons = [...switcher.querySelectorAll("button")];
  buttons.forEach(button => {
    const category = findCategoryForText(button.querySelector("b")?.textContent);
    if (!category) return;
    const priceNode = button.querySelector("span");
    if (priceNode) priceNode.textContent = `₹${Number(category.price).toLocaleString("en-IN")}`;
    button.dataset.ticketCategoryId = String(category.id);
  });

  const activeButton = switcher.querySelector("button.active");
  const activeCategory = findCategoryForText(activeButton?.querySelector("b")?.textContent);
  const quantityNode = modal.querySelector("select");
  const totalNode = modal.querySelector(".booking-total strong");
  if (activeCategory && quantityNode && totalNode) {
    const quantity = Math.max(1, Number(quantityNode.value || 1));
    totalNode.textContent = `₹${(Number(activeCategory.price) * quantity).toLocaleString("en-IN")}`;
  }
}

function observeReactUI() {
  let scheduled = false;
  const refresh = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      syncBookingModal();
      syncTicketCards([...categoryMap.values()]);
    });
  };
  const observer = new MutationObserver(refresh);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("input", refresh, true);
  document.addEventListener("change", refresh, true);
}

function enableSmoothNavigation() {
  document.addEventListener("click", event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", id);
  });
}

function improveGalleryMotion() {
  const marquee = document.querySelector(".gallery-marquee");
  if (!marquee || marquee.dataset.enhanced === "true") return;
  marquee.dataset.enhanced = "true";
  marquee.setAttribute("aria-label", "Kesariya Navrang moving gallery");
  marquee.addEventListener("mouseenter", () => marquee.classList.add("is-paused"));
  marquee.addEventListener("mouseleave", () => marquee.classList.remove("is-paused"));
  marquee.addEventListener("focusin", () => marquee.classList.add("is-paused"));
  marquee.addEventListener("focusout", () => marquee.classList.remove("is-paused"));
}

function improveForms() {
  document.addEventListener("submit", event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.classList.contains("booking-modal")) return;
    const phone = form.querySelector('input[placeholder="Mobile number"]');
    if (phone && !/^[+]?\d[\d\s-]{7,14}$/.test(phone.value.trim())) {
      event.preventDefault();
      phone.setCustomValidity("Enter a valid mobile number.");
      phone.reportValidity();
    } else if (phone) {
      phone.setCustomValidity("");
    }
  }, true);
}

function addLiveStatus() {
  const nav = document.querySelector(".site-nav");
  if (!nav || nav.querySelector(".live-status-dot")) return;
  const status = document.createElement("span");
  status.className = "live-status-dot";
  status.textContent = "LIVE";
  status.title = "Booking system online when the API is reachable";
  nav.appendChild(status);
}

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.head.appendChild(script);
  });
}

function closeBookingModal(form) {
  const close = form?.querySelector(".modal-close");
  if (close) close.click();
}

function showPaymentConfirmation(booking, details, selectedCategory, quantity, paymentMode) {
  const existing = document.querySelector(".payment-confirmation-overlay");
  existing?.remove();
  const overlay = document.createElement("div");
  overlay.className = "modal-backdrop payment-confirmation-overlay";
  overlay.innerHTML = `<div class="confirmation-card"><div class="success-ring">✓</div><span class="gold-label">BOOKING CONFIRMED</span><h2>Your circle is reserved.</h2><p>${selectedCategory.name} · ${details.name}</p><div class="booking-code">${booking.booking_code}</div><div class="payment-badge">${paymentMode === "razorpay" ? "PAYMENT VERIFIED" : "DEMO PAYMENT"}</div><img class="qr-image" alt="Booking QR code"/><p class="small-note">Show this QR at entry. It can be used only once.</p><div class="confirmation-actions"><button class="gold-button save-payment-qr">SAVE QR</button><button class="text-link close-payment-confirmation">DONE</button></div></div>`;
  document.body.appendChild(overlay);
  const image = overlay.querySelector(".qr-image");
  QRCode.toDataURL(booking.booking_code, { margin: 1, width: 320 }).then(qr => {
    image.src = qr;
    const save = overlay.querySelector(".save-payment-qr");
    save.addEventListener("click", () => { const link = document.createElement("a"); link.href = qr; link.download = `${booking.booking_code}-qr.png`; link.click(); });
  });
  overlay.querySelector(".close-payment-confirmation").addEventListener("click", () => overlay.remove());
  overlay.querySelector(".payment-confirmation-overlay")?.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
}

async function handleBookingSubmit(form) {
  const inputs = form.querySelectorAll("input");
  const name = form.querySelector('input[placeholder="Full name"]')?.value.trim();
  const email = form.querySelector('input[type="email"]')?.value.trim();
  const phone = form.querySelector('input[placeholder="Mobile number"]')?.value.trim();
  const quantity = Math.max(1, Number(form.querySelector("select")?.value || 1));
  const active = form.querySelector(".pass-switcher button.active");
  const selectedCategory = findCategoryForText(active?.querySelector("b")?.textContent);
  if (!name || !email || !phone || !selectedCategory) throw new Error("Please complete all booking details.");

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) { submitButton.disabled = true; submitButton.dataset.originalText = submitButton.textContent; submitButton.textContent = "CREATING PAYMENT…"; }

  const orderResponse = await fetch(`${API_URL}/api/bookings/order`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventId: 1, ticketCategoryId: selectedCategory.id, customerName: name, customerEmail: email, customerPhone: phone, quantity })
  });
  const orderData = await orderResponse.json();
  if (!orderResponse.ok) throw new Error(orderData.message || "Unable to create payment order.");

  const details = { name, email, phone };
  if (orderData.mode === "demo") {
    const response = await fetch(`${API_URL}/api/bookings/confirm`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: 1, ticketCategoryId: selectedCategory.id, customerName: name, customerEmail: email, customerPhone: phone, quantity, paymentRef: orderData.orderId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Booking failed.");
    closeBookingModal(form);
    showPaymentConfirmation(data.booking, details, selectedCategory, quantity, "demo");
    return;
  }

  await loadRazorpay();
  if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable.");
  if (submitButton) submitButton.textContent = "OPENING SECURE CHECKOUT…";

  await new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "Kesariya Navrang 2026",
      description: selectedCategory.name,
      order_id: orderData.orderId,
      prefill: { name, email, contact: phone },
      theme: { color: "#d6a84f" },
      modal: { ondismiss: () => reject(new Error("Payment was cancelled. No ticket was issued.")) },
      handler: async payment => {
        try {
          const response = await fetch(`${API_URL}/api/bookings/confirm`, {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ eventId: 1, ticketCategoryId: selectedCategory.id, customerName: name, customerEmail: email, customerPhone: phone, quantity, razorpayOrderId: payment.razorpay_order_id, razorpayPaymentId: payment.razorpay_payment_id, razorpaySignature: payment.razorpay_signature })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || "Payment verification failed. No ticket was issued.");
          closeBookingModal(form);
          showPaymentConfirmation(data.booking, details, selectedCategory, quantity, "razorpay");
          resolve();
        } catch (error) { reject(error); }
      }
    });
    checkout.on("payment.failed", response => reject(new Error(response.error?.description || "Payment failed. No ticket was issued.")));
    checkout.open();
  });
}

function enablePaymentBooking() {
  document.addEventListener("submit", event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.classList.contains("booking-modal")) return;
    const phone = form.querySelector('input[placeholder="Mobile number"]');
    if (phone && !/^[+]?\d[\d\s-]{7,14}$/.test(phone.value.trim())) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    handleBookingSubmit(form).catch(error => {
      const button = form.querySelector('button[type="submit"]');
      if (button) { button.disabled = false; button.textContent = button.dataset.originalText || "PAY & GET QR ↗"; }
      const notice = document.createElement("div");
      notice.className = "error-box payment-error-toast";
      notice.textContent = error.message || "Payment could not be completed.";
      form.querySelector(".demo-note")?.before(notice);
      setTimeout(() => notice.remove(), 5000);
    });
  }, true);
}

function boot() {
  enableSmoothNavigation();
  improveForms();
  enablePaymentBooking();
  observeReactUI();
  loadLiveTicketData();
  setTimeout(() => {
    improveGalleryMotion();
    addLiveStatus();
  }, 250);
  setInterval(loadLiveTicketData, 30000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
