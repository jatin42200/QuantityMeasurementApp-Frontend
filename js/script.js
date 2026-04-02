const APP_STORAGE_KEY = "qm-auth-user";
const THEME_STORAGE_KEY = "qm-theme";
const GOOGLE_MODAL_KEY = "googleModal";
const USERS_STORAGE_KEY = "qm-users";

const measurementCatalog = {
  length: {
    label: "Length",
    iconColor: "#f6b21a",
    units: {
      Millimetre: 0.001,
      Centimetre: 0.01,
      Inch: 0.0254,
      Feet: 0.3048,
      Yard: 0.9144,
      Metre: 1,
      Kilometre: 1000
    }
  },
  weight: {
    label: "Weight",
    iconColor: "#f6b21a",
    units: {
      Gram: 0.001,
      Kilogram: 1,
      Pound: 0.453592,
      Ounce: 0.0283495
    }
  },
  temperature: {
    label: "Temperature",
    iconColor: "#ff5a1f",
    units: {
      Celsius: { toBase: (value) => value, fromBase: (value) => value },
      Fahrenheit: { toBase: (value) => ((value - 32) * 5) / 9, fromBase: (value) => (value * 9) / 5 + 32 },
      Kelvin: { toBase: (value) => value - 273.15, fromBase: (value) => value + 273.15 }
    }
  },
  volume: {
    label: "Volume",
    iconColor: "#67d1d4",
    units: {
      Millilitre: 0.001,
      Litre: 1,
      Gallon: 3.78541,
      "Cubic metre": 1000
    }
  }
};

const actionModes = ["comparison", "conversion", "arithmetic"];
const dashboardState = { type: "length", action: "conversion" };

document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme();
  bindThemeToggle();

  const page = document.body.dataset.page;
  if (page === "auth") initializeAuthPage();
  if (page === "dashboard") initializeDashboard();
});

function applySavedTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
  document.body.classList.toggle("theme-dark", savedTheme === "dark");
  document.body.classList.toggle("theme-light", savedTheme !== "dark");
  updateThemeToggleText(savedTheme);
}

function bindThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("theme-dark") ? "light" : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applySavedTheme();
  });
}

function updateThemeToggleText(theme) {
  const themeIcon = document.getElementById("themeIcon");
  const themeText = document.getElementById("themeText");
  if (themeIcon) themeIcon.innerHTML = theme === "dark" ? "&#9728;" : "&#9790;";
  if (themeText) themeText.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

function initializeAuthPage() {
  bindAuthTabs();
  bindPasswordToggles();
  bindAuthForms();
  bindSocialLogin();
}

function bindAuthTabs() {
  const tabs = [...document.querySelectorAll(".auth-tab")];
  const forms = [...document.querySelectorAll(".auth-form")];

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      clearAuthFeedback();
      tabs.forEach((item) => {
        item.classList.toggle("is-active", item === tab);
        item.setAttribute("aria-selected", String(item === tab));
      });
      forms.forEach((form) => form.classList.toggle("is-active", form.id === tab.dataset.target));
    });
  });
}

function bindPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.dataset.passwordToggle);
      const nextType = input.type === "password" ? "text" : "password";
      input.type = nextType;
      toggle.innerHTML = nextType === "password" ? "&#9676;" : "&#9679;";
    });
  });
}

function bindAuthForms() {
  document.getElementById("loginPanel")?.addEventListener("submit", (event) => {
    event.preventDefault();
    clearAuthFeedback();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const user = getUsers().find((entry) => entry.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
      setAuthFeedback("loginFeedback", "Invalid email or password. Please use a registered account.");
      return;
    }

    saveCurrentUser(user.email);
    window.location.href = "dashboard.html";
  });

  document.getElementById("signupPanel")?.addEventListener("submit", (event) => {
    event.preventDefault();
    clearAuthFeedback();

    const fullName = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const phone = document.getElementById("signupPhone").value.trim();

    if (!fullName || !email || !password || !phone) {
      setAuthFeedback("signupFeedback", "Please fill all signup fields before continuing.");
      return;
    }

    const users = getUsers();
    const existingUser = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      setAuthFeedback("signupFeedback", "This email is already registered. Please login instead.");
      return;
    }

    users.push({
      id: Date.now(),
      fullName,
      email,
      password,
      phone,
      provider: "local"
    });

    saveUsers(users);
    saveCurrentUser(email);
    window.location.href = "dashboard.html";
  });
}

function bindSocialLogin() {
  const modal = document.getElementById(GOOGLE_MODAL_KEY);
  if (!modal) return;

  document.querySelectorAll("[data-social-login]").forEach((button) => {
    button.addEventListener("click", () => {
      clearAuthFeedback();
      modal.hidden = false;
      document.body.classList.add("modal-open");
    });
  });

  modal.querySelectorAll("[data-close-social]").forEach((control) => {
    control.addEventListener("click", closeSocialModal);
  });

  modal.querySelectorAll("[data-google-email]").forEach((button) => {
    button.addEventListener("click", () => completeGoogleLogin(button.dataset.googleEmail));
  });

  document.getElementById("customGoogleForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("customGoogleEmail")?.value.trim() || "";
    if (!/@gmail\.com$/i.test(email)) {
      alert("Please enter a valid Gmail address to continue.");
      return;
    }
    completeGoogleLogin(email);
  });
}

function closeSocialModal() {
  const modal = document.getElementById(GOOGLE_MODAL_KEY);
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function completeGoogleLogin(email) {
  const users = getUsers();
  const existingUser = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());

  if (!existingUser) {
    users.push({
      id: Date.now(),
      fullName: email.split("@")[0],
      email,
      password: "",
      phone: "",
      provider: "google"
    });
    saveUsers(users);
  }

  saveCurrentUser(email);
  closeSocialModal();
  window.location.href = "dashboard.html";
}

function setAuthFeedback(id, message) {
  const node = document.getElementById(id);
  if (node) node.textContent = message;
}

function clearAuthFeedback() {
  ["loginFeedback", "signupFeedback"].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = "";
  });
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function saveCurrentUser(email) {
  localStorage.setItem(APP_STORAGE_KEY, email);
}

function initializeDashboard() {
  const userEmail = document.getElementById("userEmail");
  const savedUser = localStorage.getItem(APP_STORAGE_KEY);
  if (userEmail && savedUser) userEmail.textContent = savedUser;

  renderTypeGrid();
  renderActionSwitcher();
  renderActionPanel();
}

function renderTypeGrid() {
  const typeGrid = document.getElementById("typeGrid");
  if (!typeGrid) return;

  typeGrid.innerHTML = Object.entries(measurementCatalog).map(([key, config]) => `
    <button class="type-card ${dashboardState.type === key ? "is-active" : ""}" type="button" data-type="${key}">
      ${getTypeIcon(key, config.iconColor)}
      <span>${config.label}</span>
    </button>`).join("");

  typeGrid.querySelectorAll("[data-type]").forEach((button) => {
    button.addEventListener("click", () => {
      dashboardState.type = button.dataset.type;
      renderTypeGrid();
      renderActionPanel();
    });
  });
}

function renderActionSwitcher() {
  const actionGrid = document.getElementById("actionGrid");
  if (!actionGrid) return;

  actionGrid.innerHTML = actionModes.map((mode) => `
    <button class="action-chip ${dashboardState.action === mode ? "is-active" : ""}" type="button" data-action="${mode}">
      ${mode === "arithmetic" ? "Calculator" : capitalize(mode)}
    </button>`).join("");

  actionGrid.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      dashboardState.action = button.dataset.action;
      renderActionSwitcher();
      renderActionPanel();
    });
  });
}

function renderActionPanel() {
  const host = document.getElementById("measurementLayout");
  const template = document.getElementById(`${dashboardState.action}Template`);
  if (!host || !template) return;

  host.innerHTML = "";
  host.appendChild(template.content.cloneNode(true));

  if (dashboardState.action === "comparison") setupComparisonPanel();
  if (dashboardState.action === "conversion") setupConversionPanel();
  if (dashboardState.action === "arithmetic") setupArithmeticPanel();
}

function setupComparisonPanel() {
  const units = getUnitNames();
  populateSelect("comparisonLeftUnit", units, units[0]);
  populateSelect("comparisonRightUnit", units, units[0]);

  ["comparisonLeftValue", "comparisonRightValue", "comparisonLeftUnit", "comparisonRightUnit"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateComparisonResult);
    document.getElementById(id)?.addEventListener("change", updateComparisonResult);
  });

  updateComparisonResult();
}

function updateComparisonResult() {
  const leftValue = Number(document.getElementById("comparisonLeftValue")?.value || 0);
  const rightValue = Number(document.getElementById("comparisonRightValue")?.value || 0);
  const leftUnit = document.getElementById("comparisonLeftUnit")?.value;
  const rightUnit = document.getElementById("comparisonRightUnit")?.value;
  const normalizedLeft = toBase(leftValue, leftUnit);
  const normalizedRight = toBase(rightValue, rightUnit);

  let label = "Value 1 = Value 2";
  if (Math.abs(normalizedLeft - normalizedRight) > 1e-9) {
    label = normalizedLeft > normalizedRight ? "Value 1 > Value 2" : "Value 1 < Value 2";
  }

  const result = document.getElementById("comparisonResult");
  if (result) result.textContent = label;
}

function setupConversionPanel() {
  const units = getUnitNames();
  populateSelect("conversionFromUnit", units, units[3] || units[0]);
  populateSelect("conversionToUnit", units, units[2] || units[0]);

  ["conversionFromValue", "conversionFromUnit", "conversionToUnit"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateConversionResult);
    document.getElementById(id)?.addEventListener("change", updateConversionResult);
  });

  updateConversionResult();
}

function updateConversionResult() {
  const fromValue = Number(document.getElementById("conversionFromValue")?.value || 0);
  const fromUnit = document.getElementById("conversionFromUnit")?.value;
  const toUnit = document.getElementById("conversionToUnit")?.value;
  const converted = fromBase(toBase(fromValue, fromUnit), toUnit);
  const target = document.getElementById("conversionToValue");
  if (target) target.value = formatNumber(converted);
}

function setupArithmeticPanel() {
  const units = getUnitNames();
  populateSelect("arithmeticLeftUnit", units, units[3] || units[0]);
  populateSelect("arithmeticRightUnit", units, units[3] || units[0]);
  populateSelect("arithmeticResultUnit", units, units[3] || units[0]);

  ["arithmeticLeftValue", "arithmeticRightValue", "arithmeticLeftUnit", "arithmeticRightUnit", "arithmeticResultUnit", "arithmeticOperator"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateArithmeticResult);
    document.getElementById(id)?.addEventListener("change", updateArithmeticResult);
  });

  updateArithmeticResult();
}

function updateArithmeticResult() {
  const leftValue = Number(document.getElementById("arithmeticLeftValue")?.value || 0);
  const rightValue = Number(document.getElementById("arithmeticRightValue")?.value || 0);
  const leftUnit = document.getElementById("arithmeticLeftUnit")?.value;
  const rightUnit = document.getElementById("arithmeticRightUnit")?.value;
  const resultUnit = document.getElementById("arithmeticResultUnit")?.value;
  const operator = document.getElementById("arithmeticOperator")?.value || "+";

  const leftBase = toBase(leftValue, leftUnit);
  const rightBase = toBase(rightValue, rightUnit);

  let output = 0;
  if (operator === "+") output = leftBase + rightBase;
  if (operator === "-") output = leftBase - rightBase;
  if (operator === "*") output = leftBase * rightValue;
  if (operator === "/") output = rightValue === 0 ? 0 : leftBase / rightValue;

  const result = document.getElementById("arithmeticResult");
  if (result) {
    result.textContent = `Ans = ${formatNumber(fromBase(output, resultUnit))}`;
  }
}

function populateSelect(id, options, selectedOption) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = options.map((option) => `<option value="${option}" ${option === selectedOption ? "selected" : ""}>${option}</option>`).join("");
}

function getUnitNames() {
  return Object.keys(measurementCatalog[dashboardState.type].units);
}

function toBase(value, unitName) {
  const definition = measurementCatalog[dashboardState.type].units[unitName];
  return typeof definition === "number" ? value * definition : definition.toBase(value);
}

function fromBase(value, unitName) {
  const definition = measurementCatalog[dashboardState.type].units[unitName];
  return typeof definition === "number" ? value / definition : definition.fromBase(value);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "0";
  return Number.parseFloat(value.toFixed(3)).toString();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getTypeIcon(type, color) {
  if (type === "length") {
    return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M11 30.5 30.5 11c1.2-1.2 3.1-1.2 4.3 0l4.2 4.2c1.2 1.2 1.2 3.1 0 4.3L19.5 39c-.8.8-1.9 1.1-3 .9l-6.5-1.4-1.4-6.5c-.2-1.1.1-2.2.9-3Z" stroke="${color}" stroke-width="3.6" stroke-linejoin="round"/><path d="m20 18 4 4m2-8 4 4" stroke="${color}" stroke-width="3.6" stroke-linecap="round"/></svg>`;
  }
  if (type === "weight") {
    return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 11v27m-10-18 10-9 10 9M12 20h24" stroke="${color}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 22h11l-3 12m24-12H29l3 12" stroke="${color}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (type === "temperature") {
    return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 12a4 4 0 0 1 4 4v12.7a8 8 0 1 1-8 0V16a4 4 0 0 1 4-4Z" stroke="${color}" stroke-width="3.6"/><path d="M24 31v-9" stroke="${color}" stroke-width="3.6" stroke-linecap="round"/></svg>`;
  }
  return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="10" y="12" width="28" height="26" rx="4" stroke="${color}" stroke-width="3.6"/><path d="M17 9v8m14-8v8M10 21h28" stroke="${color}" stroke-width="3.6" stroke-linecap="round"/></svg>`;
}
