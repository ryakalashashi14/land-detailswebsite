const STORAGE_KEYS = {
  users: "landreg-users",
  session: "landreg-session",
  bookings: "landreg-bookings",
};

const offices = [
  {
    id: "central-city",
    name: "Central City Registration Office",
    area: "Central Ward",
    phone: "+91 80 4123 8870",
    helpline: "1800 425 2110",
    address: "12 Civic Avenue, Central Ward",
    hours: "Mon-Sat, 9:30 AM - 5:30 PM",
    summary: "Handles sale deeds, gift deeds, and general property registration inquiries.",
    services: [
      "Sale deed registration",
      "Gift deed registration",
      "Encumbrance certificate",
    ],
    documents: [
      "Aadhaar or government ID",
      "Property papers",
      "Passport-sized photo",
    ],
    slots: ["09:30 AM", "10:45 AM", "12:00 PM", "02:15 PM", "03:30 PM"],
  },
  {
    id: "north-district",
    name: "North District Land Records Center",
    area: "North District",
    phone: "+91 80 4987 1204",
    helpline: "1800 425 2194",
    address: "45 Market Road, North District",
    hours: "Mon-Fri, 10:00 AM - 5:00 PM",
    summary: "Best for mutation support, survey records, and verification requests.",
    services: [
      "Mutation support",
      "Survey record copies",
      "Property verification",
    ],
    documents: [
      "Old property receipt",
      "Latest tax receipt",
      "Address proof",
    ],
    slots: ["10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"],
  },
  {
    id: "south-sub",
    name: "South Sub-Registrar Service Desk",
    area: "South Zone",
    phone: "+91 44 2449 7710",
    helpline: "1800 425 2088",
    address: "8 Lake View Road, South Zone",
    hours: "Mon-Sat, 9:00 AM - 4:30 PM",
    summary: "Supports appointment-based document submission and stamp duty queries.",
    services: [
      "Appointment booking",
      "Stamp duty support",
      "Document submission",
    ],
    documents: [
      "Signed deed draft",
      "Witness ID copies",
      "Payment receipt",
    ],
    slots: ["09:00 AM", "10:15 AM", "11:45 AM", "01:30 PM", "03:00 PM"],
  },
  {
    id: "east-customer",
    name: "East Customer Support Office",
    area: "East Corridor",
    phone: "+91 80 4677 9021",
    helpline: "1800 425 2233",
    address: "19 Heritage Lane, East Corridor",
    hours: "Mon-Sat, 10:00 AM - 6:00 PM",
    summary: "Helpful for status tracking, complaint registration, and service guidance.",
    services: [
      "Status tracking",
      "Complaint support",
      "General guidance",
    ],
    documents: [
      "Reference number",
      "Case details",
      "Mobile number",
    ],
    slots: ["10:00 AM", "11:15 AM", "12:45 PM", "02:30 PM", "04:15 PM"],
  },
];

const state = {
  mode: "signin",
  currentUser: null,
  selectedOfficeId: offices[0].id,
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
    // Continue to session storage and in-memory fallback.
  }

  try {
    const session = sessionStorage.getItem(STORAGE_KEYS.session);
    if (session) {
      return JSON.parse(session);
    }
  } catch {
    const raw = memoryStorage.get(STORAGE_KEYS.session);
    return raw ? JSON.parse(raw) : null;
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

  // Fallback hash for environments where SubtleCrypto is unavailable.
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
  const date = new Date(`${input}T00:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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

  if (score <= 1) return { label: "Very weak", width: "18%", tone: "#b42318" };
  if (score === 2) return { label: "Weak", width: "36%", tone: "#d97706" };
  if (score === 3) return { label: "Fair", width: "58%", tone: "#eab308" };
  if (score === 4) return { label: "Strong", width: "78%", tone: "#0f766e" };
  return { label: "Excellent", width: "100%", tone: "#166534" };
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

function setMode(mode) {
  state.mode = mode;
  const isSignIn = mode === "signin";
  els.authTitle.textContent = isSignIn
    ? "Secure access for booking local land registration visits."
    : "Create your account to manage land registration bookings.";
  els.authSubmit.textContent = isSignIn ? "Sign in securely" : "Create account";
  els.confirmField.hidden = isSignIn;
  els.fullNameField.hidden = isSignIn;
  els.strengthWrap.hidden = isSignIn;
  els.passwordInput.autocomplete = isSignIn ? "current-password" : "new-password";
  els.confirmInput.autocomplete = isSignIn ? "off" : "new-password";
  els.authForm.dataset.mode = mode;

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

function renderOfficeGrid() {
  const query = state.filteredQuery.trim().toLowerCase();
  const visibleOffices = offices.filter((office) => {
    if (!query) return true;
    const haystack = [
      office.name,
      office.area,
      office.summary,
      office.services.join(" "),
      office.documents.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  if (!visibleOffices.some((office) => office.id === state.selectedOfficeId) && visibleOffices.length) {
    state.selectedOfficeId = visibleOffices[0].id;
  }

  if (!visibleOffices.length) {
    els.officeGrid.innerHTML = `
      <div class="empty-state">
        <h4>No offices match your search.</h4>
        <p>Try a district, office name, or service like "mutation" or "encumbrance".</p>
      </div>
    `;
    return;
  }

  els.officeGrid.innerHTML = visibleOffices
    .map((office) => {
      const selected = office.id === state.selectedOfficeId ? "is-selected" : "";
      return `
        <button type="button" class="office-card ${selected}" data-office-id="${office.id}">
          <div class="office-card__top">
            <div>
              <span class="eyebrow">${office.area}</span>
              <h4>${office.name}</h4>
            </div>
            <span class="status-pill">Open today</span>
          </div>

          <div class="office-card__meta">
            <div><strong>Office number</strong><span>${office.phone}</span></div>
            <div><strong>Helpline</strong><span>${office.helpline}</span></div>
            <div><strong>Hours</strong><span>${office.hours}</span></div>
          </div>

          <p class="detail-note">${office.summary}</p>

          <div class="service-tags">
            ${office.services.map((service) => `<span class="tag">${service}</span>`).join("")}
          </div>

          <div class="office-actions">
            <span class="office-action office-action--secondary">View details</span>
            <span class="office-action office-action--primary">Book slot</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderOfficeDetails() {
  const office = offices.find((entry) => entry.id === state.selectedOfficeId) || offices[0];

  els.officeDetails.innerHTML = `
    <div>
      <p class="eyebrow">Selected office</p>
      <h3>${office.name}</h3>
      <p class="detail-note">${office.address}</p>
    </div>
    <div class="detail-highlight">
      Office: ${office.phone} | Helpline: ${office.helpline}
    </div>
    <p class="detail-note">${office.summary}</p>
    <ul class="detail-list" aria-label="Documents and timings">
      <li><strong>Working hours</strong><span>${office.hours}</span></li>
      <li><strong>Common services</strong><span>${office.services[0]}</span></li>
      <li><strong>What to carry</strong><span>${office.documents[0]}</span></li>
    </ul>
    <div>
      <p class="eyebrow">Available slots</p>
      <div class="slot-chip-group">
        ${office.slots.map((slot) => `<span class="slot-chip">${slot}</span>`).join("")}
      </div>
    </div>
    <button type="button" class="primary-btn primary-btn--full" id="detailsBookBtn">
      Use this office for booking
    </button>
  `;

  renderBookingOptions(office.id);
}

function renderBookingOptions(selectedOfficeId) {
  const office = offices.find((entry) => entry.id === selectedOfficeId) || offices[0];
  els.officeSelect.innerHTML = offices
    .map(
      (entry) =>
        `<option value="${entry.id}" ${entry.id === office.id ? "selected" : ""}>${entry.name}</option>`,
    )
    .join("");

  els.slotSelect.innerHTML = office.slots
    .map((slot) => `<option value="${slot}">${slot}</option>`)
    .join("");
}

function renderStats() {
  if (!state.currentUser) {
    els.statsGrid.innerHTML = "";
    return;
  }

  const userBookings = state.bookings.filter((booking) => booking.userId === state.currentUser.id);
  const totalSlots = offices.reduce((sum, office) => sum + office.slots.length, 0);

  const cards = [
    {
      label: "Offices listed",
      value: offices.length,
      note: "sample local registration centers",
    },
    {
      label: "Appointment slots",
      value: totalSlots,
      note: "available across all offices",
    },
    {
      label: "Your bookings",
      value: userBookings.length,
      note: "saved in this browser",
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
    .sort((left, right) => `${right.date} ${right.slot}`.localeCompare(`${left.date} ${left.slot}`));

  if (!bookings.length) {
    els.bookingList.innerHTML = `
      <div class="booking-empty empty-state">
        <h4>No bookings yet.</h4>
        <p>Pick an office, choose a date and slot, then confirm your appointment.</p>
      </div>
    `;
    return;
  }

  els.bookingList.innerHTML = bookings
    .map(
      (booking) => {
        const office = offices.find((entry) => entry.id === booking.officeId);
        return `
          <article class="booking-card">
            <div class="booking-card__top">
              <div>
                <h4>${office ? office.name : booking.officeName}</h4>
                <p>${office ? office.area : "Land registration office"}</p>
              </div>
              <span class="status-pill">${booking.status}</span>
            </div>

            <div class="booking-meta">
              <span class="tag">${formatDate(booking.date)}</span>
              <span class="slot-chip">${booking.slot}</span>
            </div>

            <p>${booking.note || "No extra notes provided."}</p>
            <p><strong>Booked on:</strong> ${formatTimestamp(booking.createdAt)}</p>

            <button type="button" class="booking-remove" data-booking-id="${booking.id}">
              Cancel booking
            </button>
          </article>
        `;
      },
    )
    .join("");
}

function syncDashboardSelection() {
  renderOfficeGrid();
  renderOfficeDetails();
  renderStats();
  renderBookings();
}

function showDashboard() {
  els.authScreen.classList.add("hidden");
  els.dashboard.classList.remove("hidden");
  els.userName.textContent = state.currentUser.name;
  syncDashboardSelection();
}

function showAuth() {
  els.dashboard.classList.add("hidden");
  els.authScreen.classList.remove("hidden");
}

async function seedDemoUser() {
  const demoIdentity = normalizeIdentity("demo@land.gov");
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
  if (!button) return;
  setMode(button.dataset.mode);
}

function handleOfficeClick(event) {
  const card = event.target.closest("[data-office-id]");
  if (!card) return;

  state.selectedOfficeId = card.dataset.officeId;
  renderOfficeGrid();
  renderOfficeDetails();
}

function handleOfficeAction(event) {
  const officeId = event.target.closest("[data-office-id]")?.dataset.officeId;
  if (!officeId) return;

  if (event.target.closest(".office-action--primary")) {
    state.selectedOfficeId = officeId;
    renderOfficeGrid();
    renderOfficeDetails();
    els.officeSelect.value = officeId;
    renderBookingOptions(officeId);
    document.querySelector("#bookingForm").scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function updateStrength() {
  const info = computeStrength(els.passwordInput.value);
  els.strengthWrap.hidden = state.mode === "signin";
  els.strengthBar.style.width = info.width;
  els.strengthBar.style.background = info.tone;
  els.strengthText.textContent = `Strength: ${info.label}`;
}

function handleOfficeSelectChange() {
  state.selectedOfficeId = els.officeSelect.value;
  renderOfficeGrid();
  renderOfficeDetails();
}

function handleSearchInput() {
  state.filteredQuery = els.searchInput.value;
  renderOfficeGrid();
  renderOfficeDetails();
}

async function handleBookingSubmit(event) {
  event.preventDefault();

  const officeId = els.officeSelect.value;
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

  const office = offices.find((entry) => entry.id === officeId);
  if (!office) {
    setFeedback("Select a valid office.", "error");
    return;
  }

  const duplicate = state.bookings.some(
    (booking) =>
      booking.userId === state.currentUser.id &&
      booking.officeId === officeId &&
      booking.date === date &&
      booking.slot === slot,
  );

  if (duplicate) {
    setFeedback("You already booked this office, date, and slot combination.", "error");
    return;
  }

  const booking = {
    id: uid(),
    userId: state.currentUser.id,
    officeId,
    officeName: office.name,
    date,
    slot,
    note: notes,
    status: "Confirmed",
    createdAt: new Date().toISOString(),
  };

  state.bookings.push(booking);
  writeStorage(STORAGE_KEYS.bookings, state.bookings);
  renderStats();
  renderBookings();
  setFeedback(`Booking confirmed for ${office.name} on ${formatDate(date)} at ${slot}.`, "success");
  els.bookingForm.reset();
  els.officeSelect.value = officeId;
  els.bookingDate.value = todayISO();
  renderBookingOptions(officeId);
}

function handleBookingListClick(event) {
  const removeButton = event.target.closest("[data-booking-id]");
  if (!removeButton) return;

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
  els.identifierInput.value = "demo@land.gov";
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
  els.detailsBookBtn = $("detailsBookBtn");
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
  renderOfficeGrid();
  renderOfficeDetails();

  if (state.currentUser) {
    renderStats();
    renderBookings();
    showDashboard();
  } else {
    showAuth();
  }

  els.authForm.addEventListener("submit", handleAuthSubmit);
  document.querySelector(".mode-switch").addEventListener("click", handleModeClick);
  els.officeGrid.addEventListener("click", (event) => {
    handleOfficeClick(event);
    handleOfficeAction(event);
  });
  els.officeSelect.addEventListener("change", handleOfficeSelectChange);
  els.searchInput.addEventListener("input", handleSearchInput);
  els.bookingForm.addEventListener("submit", handleBookingSubmit);
  els.bookingList.addEventListener("click", handleBookingListClick);
  els.logoutBtn.addEventListener("click", handleLogout);
  els.fillDemoBtn.addEventListener("click", fillDemoCredentials);
  els.officeDetails.addEventListener("click", (event) => {
    if (!event.target.closest("#detailsBookBtn")) {
      return;
    }

    els.officeSelect.value = state.selectedOfficeId;
    renderBookingOptions(state.selectedOfficeId);
    els.bookingDate.focus();
    els.bookingForm.scrollIntoView({ behavior: "smooth", block: "center" });
  });
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
      setFeedback("Sign in first to access the booking dashboard.", "error");
    }
  });
  document.getElementById("dashboardTitle").textContent =
    "Your office contacts, service details, and bookings";
}

initialize();
