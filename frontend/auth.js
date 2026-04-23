const API_BASE_URL = "http://localhost:4000/api";
const AUTH_STORAGE_KEY = "keja.auth";

function saveSession(payload) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  localStorage.setItem("keja.token", payload.token);
}

function getSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("keja.token");
}

async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }
  saveSession(data);
  return data;
}

function requireRole(roles) {
  const session = getSession();
  if (!session || !session.user || !roles.includes(session.user.role)) {
    window.location.href = "./login.html";
    return null;
  }
  return session;
}
