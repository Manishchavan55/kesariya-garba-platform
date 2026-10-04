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
    // Ticket cards keep their bundled values when the API is unavailable.
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
