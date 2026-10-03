const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const categoryMap = new Map();

async function loadLiveTicketData() {
  try {
    const response = await fetch(`${API_URL}/api/events/1`, { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const data = await response.json();
    const categories = Array.isArray(data.ticket_categories) ? data.ticket_categories : [];
    categories.forEach(category => categoryMap.set(Number(category.id), category));
    syncTicketCards(categories);
  } catch {
    // The page remains usable in demo/offline mode with its bundled prices.
  }
}

function syncTicketCards(categories) {
  const cards = [...document.querySelectorAll(".nav-ticket")];
  cards.forEach((card, index) => {
    const category = categories[index];
    if (!category) return;
    const price = Number(category.price || 0).toLocaleString("en-IN");
    const priceNode = card.querySelector(".ticket-content > strong");
    if (priceNode) priceNode.textContent = `₹${price}`;
    const titleNode = card.querySelector(".ticket-content h3");
    if (titleNode) titleNode.textContent = category.name;
    card.dataset.ticketCategoryId = String(category.id);
    card.dataset.ticketPrice = String(category.price);
  });
}

function syncBookingModal() {
  const switcher = document.querySelector(".pass-switcher");
  if (!switcher || categoryMap.size === 0) return;
  const buttons = [...switcher.querySelectorAll("button")];
  buttons.forEach((button, index) => {
    const category = categoryMap.get(index + 1);
    if (!category) return;
    const priceNode = button.querySelector("span");
    if (priceNode) priceNode.textContent = `₹${Number(category.price).toLocaleString("en-IN")}`;
  });
}

function observeReactUI() {
  const observer = new MutationObserver(() => {
    syncBookingModal();
    syncTicketCards([...categoryMap.values()].filter(item => item.event_id === 1));
  });
  observer.observe(document.body, { childList: true, subtree: true });
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
  if (!marquee) return;
  marquee.setAttribute("aria-label", "Kesariya Navrang moving gallery");
  marquee.addEventListener("mouseenter", () => marquee.classList.add("is-paused"));
  marquee.addEventListener("mouseleave", () => marquee.classList.remove("is-paused"));
  marquee.addEventListener("focusin", () => marquee.classList.add("is-paused"));
  marquee.addEventListener("focusout", () => marquee.classList.remove("is-paused"));
}

function improveForms() {
  document.addEventListener("submit", event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.classList.contains("booking-modal")) {
      const phone = form.querySelector('input[placeholder="Mobile number"]');
      if (phone && !/^[+]?\d[\d\s-]{7,14}$/.test(phone.value.trim())) {
        event.preventDefault();
        phone.setCustomValidity("Enter a valid mobile number.");
        phone.reportValidity();
      } else if (phone) {
        phone.setCustomValidity("");
      }
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

function boot() {
  enableSmoothNavigation();
  improveForms();
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
