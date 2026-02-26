// =============================
//  MASKET — API Utility Layer
// =============================

// ---- Switch between local dev and production ----
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = IS_LOCAL
  ? 'http://localhost:5000/api'
  : 'https://masket.onrender.com/api';

// ---- Fix image URLs to always point to backend ----
function fixImageUrl(url) {
  if (!url) return '';
  // Already a full URL (http/https) — return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path like /uploads/xxx — prepend backend base
  const backendBase = IS_LOCAL ? 'http://localhost:5000' : 'https://masket.onrender.com';
  return backendBase + (url.startsWith('/') ? url : '/' + url);
}
window.fixImageUrl = fixImageUrl;

// ---- Auth token helpers ----
const Auth = {
  getToken: () => localStorage.getItem('masket_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('masket_user')); } catch { return null; } },
  setSession: (token, user) => {
    localStorage.setItem('masket_token', token);
    localStorage.setItem('masket_user', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('masket_token');
    localStorage.removeItem('masket_user');
  },
  isLoggedIn: () => !!localStorage.getItem('masket_token'),
  isAdmin: () => { const u = Auth.getUser(); return u && u.isAdmin; }
};

// ---- Base fetch wrapper ----
async function apiRequest(method, endpoint, body = null, isFormData = false) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

const API = {
  get:      (endpoint)       => apiRequest('GET',    endpoint),
  post:     (endpoint, body) => apiRequest('POST',   endpoint, body),
  put:      (endpoint, body) => apiRequest('PUT',    endpoint, body),
  delete:   (endpoint)       => apiRequest('DELETE', endpoint),
  postForm: (endpoint, fd)   => apiRequest('POST',   endpoint, fd, true),
  putForm:  (endpoint, fd)   => apiRequest('PUT',    endpoint, fd, true),
};

// ---- Cart (localStorage) ----
const CartStore = {
  get:   () => { try { return JSON.parse(localStorage.getItem('masket_cart') || '[]'); } catch { return []; } },
  set:   (cart) => localStorage.setItem('masket_cart', JSON.stringify(cart)),
  count: () => CartStore.get().reduce((s, i) => s + (i.quantity || 1), 0),
  clear: () => localStorage.removeItem('masket_cart')
};

// ---- Toast notification ----
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'ri-checkbox-circle-fill', error: 'ri-error-warning-fill', info: 'ri-information-fill' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---- Cart badge ----
function updateCartBadge() {
  const count = CartStore.count();
  document.querySelectorAll('.nav-cart-count, .bnav-cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ---- Dark mode ----
function initDarkMode() {
  const saved = localStorage.getItem('masket_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('masket_theme', next);
  updateThemeIcon(next);
}
function updateThemeIcon(theme) {
  document.querySelectorAll('.dark-toggle i').forEach(i => {
    i.className = theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
  });
}

// ---- Active nav link ----
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('[data-nav-link]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('href') === path || el.dataset.navLink === path);
  });
}

// ---- Auth guards ----
function requireAuth(redirectBack = true) {
  if (!Auth.isLoggedIn()) {
    const back = redirectBack ? `?next=${encodeURIComponent(window.location.pathname)}` : '';
    window.location.href = `/login.html${back}`;
    return false;
  }
  return true;
}
function requireAdmin() {
  if (!requireAuth()) return false;
  if (!Auth.isAdmin()) { window.location.href = '/index.html'; return false; }
  return true;
}

// ---- Run on every page ----
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  updateCartBadge();
  setActiveNav();
});