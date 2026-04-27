const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE_URL = isLocalhost
  ? "http://localhost:4000/api"
  : `${window.location.origin}/api`;
const listingGrid = document.getElementById("listingGrid");
const skeletonGrid = document.getElementById("skeletonGrid");
const emptyState = document.getElementById("emptyState");
const mapBox = document.getElementById("mapBox");
const toast = document.getElementById("toast");

const state = {
  savedOnly: false,
  saved: JSON.parse(localStorage.getItem("keja.saved") || "[]"),
  selectedListingId: null,
  listings: [],
  session: null
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = Math.max(1, Math.floor(target / 45));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = String(current);
  }, 18);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function enable3DHover(card) {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y / rect.height) - 0.5) * -8;
    const ry = ((x / rect.width) - 0.5) * 8;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
  });
}

function listingTemplate(item) {
  const isSaved = state.saved.includes(item.id);
  return `
    <article data-id="${item.id}">
      <span class="badge">${item.status_badge || "Verified"}</span>
      <button class="save ${isSaved ? "active" : ""}" data-save="${item.id}" aria-label="Save listing">${isSaved ? "♥" : "♡"}</button>
      <img class="cover" src="${(item.image_urls && item.image_urls[0]) || "https://picsum.photos/seed/keja-default/700/500"}" loading="lazy" alt="${item.title}">
      <div class="card-body">
        <h3>${item.title}</h3>
        <p class="meta">${item.location} • ${item.rental_type} • KES ${item.price.toLocaleString()}</p>
        <p class="meta">Host: ${item.host_name}</p>
        <div class="pills">${item.amenities.map((a) => `<span class="pill">${a}</span>`).join("")}</div>
        <div class="actions">
          <button class="btn btn-secondary" data-detail="${item.id}">Details</button>
          <button class="btn btn-primary" data-book="${item.id}">Book</button>
        </div>
      </div>
    </article>
  `;
}

function renderMap(list) {
  if (!mapBox.classList.contains("active")) return;
  mapBox.innerHTML = list.map((item) => `
    <div class="row-between">
      <span>${item.title} (${item.location})</span>
      <a class="btn btn-secondary" href="${item.map_url || `https://www.google.com/maps/search/${item.location}`}" target="_blank" rel="noopener">Open Map</a>
    </div>
  `).join("");
}

function getSelectedAmenities() {
  return [...document.querySelectorAll(".amenities input:checked")].map((i) => i.value);
}

function filterAndSort(listings) {
  const location = document.getElementById("location").value;
  const maxPrice = Number(document.getElementById("priceRange").value);
  const rentalType = document.getElementById("rentalType").value;
  const sortBy = document.getElementById("sortBy").value;
  const selectedAmenities = getSelectedAmenities();

  let result = listings.filter((item) => {
    if (location && item.location !== location) return false;
    if (item.price > maxPrice) return false;
    if (rentalType && item.rental_type !== rentalType) return false;
    if (selectedAmenities.length && !selectedAmenities.every((a) => item.amenities.includes(a))) return false;
    if (state.savedOnly && !state.saved.includes(item.id)) return false;
    return true;
  });

  if (sortBy === "low-price") result.sort((a, b) => a.price - b.price);
  if (sortBy === "high-price") result.sort((a, b) => b.price - a.price);
  if (sortBy === "newest") result.sort((a, b) => b.id - a.id);
  if (sortBy === "popular") result.sort((a, b) => b.popularity_score - a.popularity_score);
  return result;
}

function renderListings() {
  const filtered = filterAndSort(state.listings);
  listingGrid.innerHTML = filtered.map(listingTemplate).join("");
  emptyState.style.display = filtered.length ? "none" : "block";
  renderMap(filtered);

  listingGrid.querySelectorAll("article").forEach(enable3DHover);
  listingGrid.querySelectorAll("[data-save]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.save);
      if (state.saved.includes(id)) {
        state.saved = state.saved.filter((v) => v !== id);
      } else {
        state.saved.push(id);
      }
      localStorage.setItem("keja.saved", JSON.stringify(state.saved));
      renderListings();
    });
  });

  listingGrid.querySelectorAll("[data-detail]").forEach((btn) => {
    btn.addEventListener("click", () => openDetails(Number(btn.dataset.detail)));
  });
  listingGrid.querySelectorAll("[data-book]").forEach((btn) => {
    btn.addEventListener("click", () => openBooking(Number(btn.dataset.book)));
  });
}

function createSkeletons() {
  skeletonGrid.innerHTML = "<article></article><article></article><article></article>";
}

async function fetchListings() {
  createSkeletons();
  emptyState.style.display = "none";
  try {
    state.listings = await fetchJson(`${API_BASE_URL}/listings`);
  } catch (err) {
    state.listings = [];
    emptyState.textContent = `Could not load listings: ${err.message}`;
  } finally {
    skeletonGrid.innerHTML = "";
    renderListings();
  }
}

async function loadLiveStats() {
  try {
    const stats = await fetchJson(`${API_BASE_URL}/listings/stats`);
    animateCount("totalHousesCount", stats.totalHouses);
    animateCount("availableHousesCount", stats.availableHouses);
    animateCount("hostsCount", stats.hosts);
    animateCount("usersCount", stats.users);
  } catch (err) {
    showToast(`Stats unavailable: ${err.message}`);
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  const card = modal.querySelector(".modal-card");
  if (card) {
    card.classList.remove("slide-out-right");
    card.classList.add("slide-in-right");
  }
  modal.classList.add("open");
  modal.classList.remove("exit");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  const card = modal.querySelector(".modal-card");
  modal.classList.add("exit");
  if (card) {
    card.classList.remove("slide-in-right");
    card.classList.add("slide-out-right");
  }
  setTimeout(() => {
    modal.classList.remove("open", "exit");
    modal.setAttribute("aria-hidden", "true");
    if (card) card.classList.remove("slide-out-right");
  }, 230);
}

function openDetails(id) {
  state.selectedListingId = id;
  const item = state.listings.find((x) => x.id === id);
  if (!item) return;

  document.getElementById("modalContent").innerHTML = `
    <h3>${item.title}</h3>
    <p class="meta">${item.location} • ${item.rental_type} • KES ${item.price.toLocaleString()}</p>
    <img class="cover" src="${item.image_urls[0]}" alt="${item.title}">
    <p class="meta" style="margin-top:8px;">${item.description || "Great student-friendly place with practical amenities and safe access."}</p>
  `;
  openModal("detailsModal");
}

function openBooking(id) {
  state.selectedListingId = id;
  if (window.innerWidth <= 720) {
    document.getElementById("mobileSheet").classList.add("open");
  } else {
    openModal("detailsModal");
    showToast("Use Book Viewing button in the modal.");
  }
}

async function sendChat(message) {
  const token = state.session && state.session.token;
  if (!token || !state.selectedListingId) return false;
  await fetchJson(`${API_BASE_URL}/chat/${state.selectedListingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message })
  });
  return true;
}

async function submitViewingRequest() {
  const token = state.session && state.session.token;
  if (!token || !state.selectedListingId) {
    throw new Error("Login required to request a viewing");
  }

  await fetchJson(`${API_BASE_URL}/viewings/${state.selectedListingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fullName: document.getElementById("bookName").value.trim(),
      phone: document.getElementById("bookPhone").value.trim(),
      preferredDate: document.getElementById("bookDate").value,
      notes: ""
    })
  });
}

function setupEvents() {
  document.getElementById("pageTransition").classList.add("done");
  document.getElementById("menuBtn").addEventListener("click", () => {
    const menu = document.getElementById("menu");
    const isOpen = menu.classList.contains("open");
    if (isOpen) {
      menu.classList.remove("slide-in");
      menu.classList.add("slide-out");
      setTimeout(() => {
        menu.classList.remove("open", "slide-out");
      }, 220);
    } else {
      menu.classList.add("open", "slide-in");
      setTimeout(() => menu.classList.remove("slide-in"), 220);
    }
  });
  document.getElementById("ctaBrowse").addEventListener("click", () => document.getElementById("listingSection").scrollIntoView({ behavior: "smooth" }));
  document.getElementById("ctaHow").addEventListener("click", () => document.getElementById("hostSection").scrollIntoView({ behavior: "smooth" }));

  document.getElementById("toggleFilters").addEventListener("click", () => {
    const form = document.getElementById("searchForm");
    if (form.classList.contains("expanded")) {
      form.classList.add("slide-down");
      form.classList.remove("expanded");
      setTimeout(() => form.classList.remove("slide-down"), 240);
    } else {
      form.classList.add("expanded", "slide-up");
      setTimeout(() => form.classList.remove("slide-up"), 260);
    }
  });
  document.getElementById("priceRange").addEventListener("input", (e) => { document.getElementById("priceLabel").textContent = `KES ${Number(e.target.value).toLocaleString()}`; });
  document.getElementById("searchForm").addEventListener("submit", (e) => { e.preventDefault(); renderListings(); });

  document.getElementById("savedBtn").addEventListener("click", (e) => {
    state.savedOnly = !state.savedOnly;
    e.currentTarget.setAttribute("aria-pressed", String(state.savedOnly));
    renderListings();
  });

  document.getElementById("mapBtn").addEventListener("click", () => {
    mapBox.classList.toggle("active");
    renderMap(filterAndSort(state.listings));
  });

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) closeModal(e.target.id);
  });

  document.getElementById("chatOpenBtn").addEventListener("click", () => {
    closeModal("detailsModal");
    openModal("chatModal");
  });

  document.getElementById("chatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;
    let ok = false;
    try {
      ok = await sendChat(message);
    } catch (err) {
      showToast(err.message);
    }
    const log = document.getElementById("chatLog");
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = `${ok ? "You" : "Offline"}: ${message}`;
    log.appendChild(bubble);
    input.value = "";
  });

  document.getElementById("bookBtn").addEventListener("click", () => {
    if (!state.session) {
      showToast("Login first to request viewing");
      window.location.href = "./login.html";
      return;
    }
    if (window.innerWidth <= 720) {
      closeModal("detailsModal");
      document.getElementById("mobileSheet").classList.add("open");
    } else {
      showToast("Booking sent. Host will confirm shortly.");
    }
  });

  document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await submitViewingRequest();
      const sheet = document.getElementById("mobileSheet");
      sheet.classList.add("slide-out-down");
      setTimeout(() => {
        sheet.classList.remove("open", "slide-out-down");
      }, 260);
      showToast("Viewing request submitted.");
    } catch (err) {
      showToast(err.message);
    }
  });
}

function revealOnScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function boot() {
  state.session = (() => {
    try {
      return JSON.parse(localStorage.getItem("keja.auth") || "null");
    } catch (_err) {
      return null;
    }
  })();
  setupEvents();
  revealOnScroll();
  loadLiveStats();
  fetchListings();
}

boot();
