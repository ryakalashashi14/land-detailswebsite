const STORAGE_KEYS = {
  users: "agri-users",
  session: "agri-session",
  bookings: "agri-bookings",
};

const serviceCatalog = [
  {
    key: "surveyors",
    label: "Land Surveyor Details",
    shortLabel: "Surveyors",
    description:
      "Licensed surveyors for boundary marking, plot measurement, and field sketches.",
    items: [
      {
        id: "surveyor-ravi",
        name: "Ravi Survey & Mapping",
        area: "Village Road",
        contact: "+91 80 4112 6901",
        timings: "Mon-Sat, 8:00 AM - 1:00 PM",
        cost: "₹850 / visit",
        availability: "3 slots today",
        slots: ["08:00 AM", "09:15 AM", "10:30 AM", "11:45 AM"],
        summary: "Boundary marking, plot sketches, and field measurement reports.",
        features: ["Boundary marking", "Plot sketch", "10 km visit"],
      },
      {
        id: "surveyor-meera",
        name: "Meera Survey Desk",
        area: "Block B",
        contact: "+91 80 4112 6902",
        timings: "Mon-Fri, 9:00 AM - 3:00 PM",
        cost: "₹1,050 / visit",
        availability: "2 slots today",
        slots: ["09:00 AM", "10:45 AM", "12:30 PM", "02:00 PM"],
        summary: "Resurvey work, subdivision checks, and document verification.",
        features: ["Resurvey", "Document check", "Boundary support"],
      },
    ],
  },
  {
    key: "tractors",
    label: "Tractor Availability",
    shortLabel: "Tractors",
    description:
      "Tractors ready for ploughing, hauling, and field preparation on daily slots.",
    items: [
      {
        id: "tractor-farmmax",
        name: "FarmMax 45 HP Tractor",
        area: "North Yard",
        contact: "+91 80 4222 3344",
        timings: "Daily, 7:00 AM - 6:00 PM",
        cost: "₹1,200 / hour",
        availability: "2 slots left today",
        slots: ["07:00 AM", "09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
        summary: "Ploughing, hauling, and rotavation support.",
        features: ["Operator included", "Diesel extra", "Trailer optional"],
      },
      {
        id: "tractor-greenfield",
        name: "GreenField 50 HP Tractor",
        area: "South Yard",
        contact: "+91 80 4222 3355",
        timings: "Daily, 6:30 AM - 5:30 PM",
        cost: "₹1,350 / hour",
        availability: "1 slot left today",
        slots: ["06:30 AM", "08:30 AM", "10:30 AM", "01:00 PM", "03:30 PM"],
        summary: "Field preparation and transport work for larger plots.",
        features: ["Hydraulic lift", "Operator included", "Fast turnaround"],
      },
    ],
  },
  {
    key: "machinery",
    label: "Agricultural Machinery",
    shortLabel: "Machinery",
    description:
      "Sowing, spraying, and soil-preparation equipment available with clear pricing.",
    items: [
      {
        id: "machinery-rotavator",
        name: "Rotavator Pro",
        area: "Agri Hub",
        contact: "+91 80 4333 1101",
        timings: "Mon-Sat, 8:00 AM - 5:00 PM",
        cost: "₹950 / day",
        availability: "Available today",
        slots: ["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM"],
        summary: "Soil preparation and seedbed finishing.",
        features: ["With operator", "Soil mixing", "Field-ready"],
      },
      {
        id: "machinery-seeddrill",
        name: "Seed Drill Unit",
        area: "Agri Hub",
        contact: "+91 80 4333 1102",
        timings: "Mon-Sat, 8:30 AM - 4:30 PM",
        cost: "₹900 / day",
        availability: "2 bookings open",
        slots: ["08:30 AM", "10:30 AM", "12:30 PM", "02:30 PM"],
        summary: "Accurate sowing and row alignment.",
        features: ["Precision sowing", "Operator optional", "Seed saving"],
      },
      {
        id: "machinery-sprayer",
        name: "Power Sprayer",
        area: "Agri Hub",
        contact: "+91 80 4333 1103",
        timings: "Mon-Sat, 7:30 AM - 5:00 PM",
        cost: "₹650 / day",
        availability: "4 units available",
        slots: ["07:30 AM", "09:30 AM", "11:30 AM", "01:30 PM", "03:30 PM"],
        summary: "Crop spraying and pesticide application.",
        features: ["Lightweight", "Fast spraying", "Battery backup"],
      },
    ],
  },
];

const allServices = serviceCatalog.flatMap((category) =>
  category.items.map((item) => ({
    ...item,
    categoryKey: category.key,
    categoryLabel: category.label,
    categoryShortLabel: category.shortLabel,
  })),
);

const state = {
  mode: "signin",
  currentUser: null,
  selectedServiceId: allServices[0].id,
  users: [],
  bookings: [],
  filteredQuery: "",
};

const els = {};
const memoryStorage = new Map();

function $(id) {
  return document.getElementById(id);
}

function normalizeIdentity(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  if (raw.includes("@")) {
    const email = raw.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return null;
    }
    return {
      type: "email",
      key: email,
      display: email,
    };
  }

  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }

  const mobile = digits.slice(-10);
  return {
    type: "mobile",
    key: mobile,
    display: `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`,
  };
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    try {
      const raw = memoryStorage.get(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
}

function writeStorage(key, value) {
  const raw = JSON.stringify(value);
  try {
    localStorage.setItem(key, raw);
  } catch {
    memoryStorage.set(key, raw);
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    memoryStorage.delete(key);
  }
}

function readSession() {
  try {
    const local = localStorage.getItem(STORAGE_KEYS.session);
    if (local) {
      return JSON.parse(local);
    }
  } catch {
    // Continue to the next storage layer.
  }

  try {
    const session = sessionStorage.getItem(STORAGE_KEYS.session);
    if (session) {
      return JSON.parse(session);
    }
  } catch {
    // Continue to the in-memory fallback.
  }

  const fallback = memoryStorage.get(STORAGE_KEYS.session);
  return fallback ? JSON.parse(fallback) : null;
}

function persistSession(userId, remember) {
  const payload = JSON.stringify({ userId });

  if (remember) {
    try {
      localStorage.setItem(STORAGE_KEYS.session, payload);
    } catch {
      memoryStorage.set(STORAGE_KEYS.session, payload);
    }
    try {
      sessionStorage.removeItem(STORAGE_KEYS.session);
    } catch {
      memoryStorage.delete(STORAGE_KEYS.session);
    }
    return;
  }

  try {
    sessionStorage.setItem(STORAGE_KEYS.session, payload);
  } catch {
    memoryStorage.set(STORAGE_KEYS.session, payload);
  }
  try {
    localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    memoryStorage.delete(STORAGE_KEYS.session);
  }
}

function clearSession() {
  removeStorage(STORAGE_KEYS.session);
  try {
    sessionStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    memoryStorage.delete(STORAGE_KEYS.session);
  }
}

function uid() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function hashPassword(password) {
  const text = String(password || "");
  if (crypto?.subtle?.digest) {
    const bytes = new TextEncoder().encode(text);
    const buffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
}

function todayISO() {
  const date = new Date();
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(input) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${input}T00:00:00`));
}

function formatTimestamp(value) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function computeStrength(password) {
  const value = String(password || "");
  const checks = [
    value.length >= 8,
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];
  const score = checks.filter(Boolean).length;

  if (score <= 1) return { label: "Very weak", width: "18%", tone: "#a13b2e" };
  if (score === 2) return { label: "Weak", width: "36%", tone: "#b5732c" };
  if (score === 3) return { label: "Fair", width: "58%", tone: "#c49a43" };
  if (score === 4) return { label: "Strong", width: "78%", tone: "#6b8a46" };
  return { label: "Excellent", width: "100%", tone: "#4b6a36" };
}

function setFeedback(message, tone = "neutral") {
  els.authFeedback.textContent = message;
  els.authFeedback.classList.remove("is-error", "is-success");
  if (tone === "error") {
    els.authFeedback.classList.add("is-error");
  } else if (tone === "success") {
    els.authFeedback.classList.add("is-success");
  }
}

function getService(serviceId) {
  return allServices.find((item) => item.id === serviceId) || allServices[0];
}

function getVisibleCatalog(query) {
  const normalized = query.trim().toLowerCase();
  return serviceCatalog
    .map((category) => {
      const items = category.items.filter((item) => {
        if (!normalized) {
          return true;
        }

        const haystack = [
          category.label,
          category.shortLabel,
          category.description,
          item.name,
          item.area,
          item.contact,
          item.timings,
          item.cost,
          item.summary,
          ...(item.features || []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalized);
      });

      return { ...category, items };
    })
    .filter((category) => category.items.length > 0);
}

function ensureSelectedVisible(visibleCatalog) {
  if (!visibleCatalog.length) {
    return;
  }

  const visibleIds = new Set(visibleCatalog.flatMap((category) => category.items.map((item) => item.id)));
  if (!visibleIds.has(state.selectedServiceId)) {
    state.selectedServiceId = visibleCatalog[0].items[0].id;
  }
}

function syncServiceViews() {
  renderCatalog();
  renderDetailPanel();
  renderBookingOptions(state.selectedServiceId);
}

function setMode(mode) {
  state.mode = mode;
  const isSignIn = mode === "signin";

  els.authTitle.textContent = isSignIn
    ? "Easy access for surveyors, tractors, and farm machinery bookings."
    : "Create your account to manage agriculture service bookings.";
  els.authSubmit.textContent = isSignIn ? "Sign in securely" : "Create account";
  els.confirmField.hidden = isSignIn;
  els.fullNameField.hidden = isSignIn;
  els.strengthWrap.hidden = isSignIn;
  els.passwordInput.autocomplete = isSignIn ? "current-password" : "new-password";
  els.confirmInput.autocomplete = isSignIn ? "off" : "new-password";

  document.querySelectorAll(".mode-switch__btn").forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  if (!isSignIn) {
    updateStrength();
  } else {
    els.passwordInput.value = "";
    els.confirmInput.value = "";
  }

  setFeedback("");
}

function updateStrength() {
  const info = computeStrength(els.passwordInput.value);
  els.strengthWrap.hidden = state.mode === "signin";
  els.strengthBar.style.width = info.width;
  els.strengthBar.style.background = info.tone;
  els.strengthText.textContent = `Strength: ${info.label}`;
}

function renderCatalog() {
  const visibleCatalog = getVisibleCatalog(state.filteredQuery);
  ensureSelectedVisible(visibleCatalog);

  if (!visibleCatalog.length) {
    els.officeGrid.innerHTML = `
      <div class="empty-state">
        <h4>No services match your search.</h4>
        <p>Try surveyor, tractor, rotavator, seed drill, or sprayer.</p>
      </div>
    `;
    return;
  }

  els.officeGrid.innerHTML = visibleCatalog
    .map(
      (category) => `
        <section class="service-section">
          <div class="service-section__header">
            <div>
              <p class="eyebrow">${category.shortLabel}</p>
              <h3>${category.label}</h3>
              <p class="service-section__copy">${category.description}</p>
            </div>
            <span class="section-chip">${category.items.length} options</span>
          </div>
          <div class="service-grid">
            ${category.items.map((item) => renderServiceCard(category, item)).join("")}
          </div>
        </section>
      `,
    )
    .join("");
}

function renderServiceCard(category, item) {
  const selected = item.id === state.selectedServiceId ? "is-selected" : "";
  return `
    <button type="button" class="service-card ${selected}" data-service-id="${item.id}" aria-pressed="${
      item.id === state.selectedServiceId
    }">
      <div class="service-card__top">
        <div>
          <span class="eyebrow">${category.shortLabel}</span>
          <h4>${item.name}</h4>
        </div>
        <span class="status-pill">${item.availability}</span>
      </div>

      <div class="service-card__meta">
        <div><strong>Contact</strong><span>${item.contact}</span></div>
        <div><strong>Timing</strong><span>${item.timings}</span></div>
        <div><strong>Cost</strong><span>${item.cost}</span></div>
      </div>

      <p class="detail-note">${item.summary}</p>

      <div class="service-tags">
        ${item.features.map((feature) => `<span class="tag">${feature}</span>`).join("")}
      </div>

      <div class="office-actions">
        <span class="office-action office-action--secondary">View details</span>
        <span class="office-action office-action--primary">Book slot</span>
      </div>
    </button>
  `;
}

function renderDetailPanel() {
  const service = getService(state.selectedServiceId);

  els.officeDetails.innerHTML = `
    <div>
      <p class="eyebrow">Selected service</p>
      <h3>${service.name}</h3>
      <p class="detail-note">${service.categoryLabel}</p>
    </div>
    <div class="detail-highlight">
      ${service.cost} · ${service.timings}
    </div>
    <p class="detail-note">${service.summary}</p>
    <ul class="detail-list" aria-label="Service information">
      <li><strong>Area</strong><span>${service.area}</span></li>
      <li><strong>Contact</strong><span>${service.contact}</span></li>
      <li><strong>Availability</strong><span>${service.availability}</span></li>
      <li><strong>Best for</strong><span>${service.features[0]}</span></li>
    </ul>
    <div>
      <p class="eyebrow">Available slots</p>
      <div class="slot-chip-group">
        ${service.slots.map((slot) => `<span class="slot-chip">${slot}</span>`).join("")}
      </div>
    </div>
    <button type="button" class="primary-btn primary-btn--full" id="detailsBookBtn">
      Use this service for booking
    </button>
  `;
}

function renderBookingOptions(serviceId = state.selectedServiceId) {
  const service = getService(serviceId);

  els.officeSelect.innerHTML = serviceCatalog
    .map(
      (category) => `
        <optgroup label="${category.label}">
          ${category.items
            .map(
              (item) =>
                `<option value="${item.id}" ${item.id === service.id ? "selected" : ""}>${item.name}</option>`,
            )
            .join("")}
        </optgroup>
      `,
    )
    .join("");

  els.slotSelect.innerHTML = service.slots.map((slot) => `<option value="${slot}">${slot}</option>`).join("");
}

function renderStats() {
  if (!state.currentUser) {
    els.statsGrid.innerHTML = "";
    return;
  }

  const bookings = state.bookings.filter((booking) => booking.userId === state.currentUser.id);
  const cards = [
    {
      label: "Service groups",
      value: serviceCatalog.length,
      note: "Surveyors, tractors, and machinery",
    },
    {
      label: "Available options",
      value: allServices.length,
      note: "Each with slots and pricing",
    },
    {
      label: "Your bookings",
      value: bookings.length,
      note: "Saved in this browser",
    },
  ];

  els.statsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
          <small>${card.note}</small>
        </article>
      `,
    )
    .join("");
}

function renderBookings() {
  if (!state.currentUser) {
    els.bookingList.innerHTML = "";
    return;
  }

  const bookings = state.bookings
    .filter((booking) => booking.userId === state.currentUser.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  if (!bookings.length) {
    els.bookingList.innerHTML = `
      <div class="booking-empty empty-state">
        <h4>No bookings yet.</h4>
        <p>Choose a service, pick a date and slot, then confirm your booking.</p>
      </div>
    `;
    return;
  }

  els.bookingList.innerHTML = bookings
    .map((booking) => {
      const service = getService(booking.serviceId);
      return `
        <article class="booking-card">
          <div class="booking-card__top">
            <div>
              <h4>${service.name}</h4>
              <p>${service.categoryLabel}</p>
            </div>
            <span class="status-pill">${booking.status}</span>
          </div>

          <div class="booking-meta">
            <span class="tag">${formatDate(booking.date)}</span>
            <span class="slot-chip">${booking.slot}</span>
            <span class="tag">${service.cost}</span>
          </div>

          <p>${booking.notes || "No extra notes provided."}</p>
          <p><strong>Timing:</strong> ${service.timings}</p>
          <p><strong>Booked on:</strong> ${formatTimestamp(booking.createdAt)}</p>

          <button type="button" class="booking-remove" data-booking-id="${booking.id}">
            Cancel booking
          </button>
        </article>
      `;
    })
    .join("");
}

function showDashboard() {
  els.authScreen.classList.add("hidden");
  els.dashboard.classList.remove("hidden");
  els.userName.textContent = state.currentUser.name;
  syncServiceViews();
  renderStats();
  renderBookings();
}

function showAuth() {
  els.dashboard.classList.add("hidden");
  els.authScreen.classList.remove("hidden");
}

async function seedDemoUser() {
  const demoIdentity = normalizeIdentity("demo@agri.gov");
  const existingDemo = state.users.find((user) => user.identityKey === demoIdentity.key);
  if (!existingDemo) {
    const passwordHash = await hashPassword("Demo@1234");
    state.users.push({
      id: uid(),
      name: "Demo Citizen",
      identityType: demoIdentity.type,
      identityKey: demoIdentity.key,
      identityDisplay: demoIdentity.display,
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    writeStorage(STORAGE_KEYS.users, state.users);
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  setFeedback("");

  const identity = normalizeIdentity(els.identifierInput.value);
  const password = els.passwordInput.value.trim();

  if (!identity) {
    setFeedback("Enter a valid email address or 10-digit mobile number.", "error");
    return;
  }

  if (password.length < 8) {
    setFeedback("Password should be at least 8 characters long.", "error");
    return;
  }

  const passwordHash = await hashPassword(password);

  if (state.mode === "signup") {
    const fullName = els.fullNameInput.value.trim();
    const confirmPassword = els.confirmInput.value.trim();

    if (fullName.length < 3) {
      setFeedback("Please enter your full name.", "error");
      return;
    }

    if (password !== confirmPassword) {
      setFeedback("Passwords do not match.", "error");
      return;
    }

    if (state.users.some((user) => user.identityKey === identity.key)) {
      setFeedback("An account already exists for this email or mobile number.", "error");
      return;
    }

    const user = {
      id: uid(),
      name: fullName,
      identityType: identity.type,
      identityKey: identity.key,
      identityDisplay: identity.display,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    state.users.push(user);
    writeStorage(STORAGE_KEYS.users, state.users);
    persistSession(user.id, els.rememberMe.checked);
    state.currentUser = user;
    setFeedback("Account created successfully. Welcome!", "success");
    showDashboard();
    return;
  }

  const user = state.users.find((entry) => entry.identityKey === identity.key);
  if (!user || user.passwordHash !== passwordHash) {
    setFeedback("Invalid credentials. Try again or use the demo login.", "error");
    return;
  }

  state.currentUser = user;
  persistSession(user.id, els.rememberMe.checked);
  setFeedback("Signed in successfully.", "success");
  showDashboard();
}

function handleModeClick(event) {
  const button = event.target.closest("[data-mode]");
  if (!button) {
    return;
  }

  setMode(button.dataset.mode);
}

function handleCatalogClick(event) {
  const button = event.target.closest("[data-service-id]");
  if (!button) {
    return;
  }

  state.selectedServiceId = button.dataset.serviceId;
  syncServiceViews();
}

function handleDetailBookClick(event) {
  const button = event.target.closest("#detailsBookBtn");
  if (!button) {
    return;
  }

  els.officeSelect.value = state.selectedServiceId;
  renderBookingOptions(state.selectedServiceId);
  els.bookingDate.focus();
  els.bookingForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function handleServiceSelectChange() {
  state.selectedServiceId = els.officeSelect.value;
  syncServiceViews();
}

function handleSearchInput() {
  state.filteredQuery = els.searchInput.value;
  syncServiceViews();
}

async function handleBookingSubmit(event) {
  event.preventDefault();

  const service = getService(els.officeSelect.value);
  const date = els.bookingDate.value;
  const slot = els.slotSelect.value;
  const notes = els.notes ? els.notes.value.trim() : "";

  if (!date) {
    setFeedback("Choose a booking date.", "error");
    return;
  }

  if (date < todayISO()) {
    setFeedback("Please choose today or a future date.", "error");
    return;
  }

  const duplicate = state.bookings.some(
    (booking) =>
      booking.userId === state.currentUser.id &&
      booking.serviceId === service.id &&
      booking.date === date &&
      booking.slot === slot,
  );

  if (duplicate) {
    setFeedback("You already booked this service, date, and slot combination.", "error");
    return;
  }

  const booking = {
    id: uid(),
    userId: state.currentUser.id,
    serviceId: service.id,
    serviceName: service.name,
    categoryKey: service.categoryKey,
    categoryLabel: service.categoryLabel,
    date,
    slot,
    notes,
    cost: service.cost,
    status: "Confirmed",
    createdAt: new Date().toISOString(),
  };

  state.bookings.push(booking);
  writeStorage(STORAGE_KEYS.bookings, state.bookings);
  renderStats();
  renderBookings();
  setFeedback(`Booking confirmed for ${service.name} on ${formatDate(date)} at ${slot}.`, "success");

  els.bookingForm.reset();
  els.bookingDate.value = todayISO();
  els.officeSelect.value = service.id;
  renderBookingOptions(service.id);
}

function handleBookingListClick(event) {
  const removeButton = event.target.closest("[data-booking-id]");
  if (!removeButton) {
    return;
  }

  const bookingId = removeButton.dataset.bookingId;
  state.bookings = state.bookings.filter((booking) => booking.id !== bookingId);
  writeStorage(STORAGE_KEYS.bookings, state.bookings);
  renderStats();
  renderBookings();
}

function handleLogout() {
  clearSession();
  state.currentUser = null;
  els.identifierInput.value = "";
  els.passwordInput.value = "";
  els.confirmInput.value = "";
  els.fullNameInput.value = "";
  setMode("signin");
  showAuth();
  setFeedback("You have been logged out.", "success");
}

function fillDemoCredentials() {
  setMode("signin");
  els.identifierInput.value = "demo@agri.gov";
  els.passwordInput.value = "Demo@1234";
  updateStrength();
  setFeedback("Demo credentials loaded. You can sign in now.", "success");
}

function hydrateElements() {
  els.authScreen = $("authScreen");
  els.dashboard = $("dashboard");
  els.authForm = $("authForm");
  els.authFeedback = $("authFeedback");
  els.authTitle = $("authTitle");
  els.authSubmit = $("authSubmit");
  els.fullNameField = $("fullNameField");
  els.confirmField = $("confirmField");
  els.strengthWrap = $("strengthWrap");
  els.strengthBar = $("strengthBar");
  els.strengthText = $("strengthText");
  els.fullNameInput = $("fullName");
  els.identifierInput = $("identifier");
  els.passwordInput = $("password");
  els.confirmInput = $("confirmPassword");
  els.togglePasswordBtn = $("togglePasswordBtn");
  els.fillDemoBtn = $("fillDemoBtn");
  els.rememberMe = $("rememberMe");
  els.userName = $("userName");
  els.logoutBtn = $("logoutBtn");
  els.officeGrid = $("officeGrid");
  els.officeDetails = $("officeDetails");
  els.officeSelect = $("officeSelect");
  els.bookingDate = $("bookingDate");
  els.slotSelect = $("slotSelect");
  els.notes = $("notes");
  els.bookingForm = $("bookingForm");
  els.bookingList = $("bookingList");
  els.searchInput = $("searchInput");
  els.statsGrid = $("statsGrid");
  els.learnMoreLink = $("learnMoreLink");
}

async function initialize() {
  hydrateElements();

  state.users = readStorage(STORAGE_KEYS.users, []);
  state.bookings = readStorage(STORAGE_KEYS.bookings, []);
  await seedDemoUser();
  state.users = readStorage(STORAGE_KEYS.users, []);

  els.bookingDate.value = todayISO();
  els.bookingDate.min = todayISO();

  const session = readSession();
  if (session?.userId) {
    state.currentUser = state.users.find((user) => user.id === session.userId) || null;
  }

  setMode("signin");
  syncServiceViews();

  if (state.currentUser) {
    showDashboard();
  } else {
    showAuth();
  }

  els.authForm.addEventListener("submit", handleAuthSubmit);
  document.querySelector(".mode-switch").addEventListener("click", handleModeClick);
  els.officeGrid.addEventListener("click", handleCatalogClick);
  els.officeDetails.addEventListener("click", handleDetailBookClick);
  els.officeSelect.addEventListener("change", handleServiceSelectChange);
  els.searchInput.addEventListener("input", handleSearchInput);
  els.bookingForm.addEventListener("submit", handleBookingSubmit);
  els.bookingList.addEventListener("click", handleBookingListClick);
  els.logoutBtn.addEventListener("click", handleLogout);
  els.fillDemoBtn.addEventListener("click", fillDemoCredentials);
  els.togglePasswordBtn.addEventListener("click", () => {
    const showing = els.passwordInput.type === "text";
    els.passwordInput.type = showing ? "password" : "text";
    els.togglePasswordBtn.textContent = showing ? "Show" : "Hide";
    els.togglePasswordBtn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });
  els.passwordInput.addEventListener("input", updateStrength);
  els.learnMoreLink.addEventListener("click", (event) => {
    if (!state.currentUser) {
      event.preventDefault();
      setFeedback("Sign in first to access the service dashboard.", "error");
    }
  });
}

initialize();
