// =============================
//  MASKET — Profile Page JS
// =============================

// ---- Modal helpers (defined first so they're always available) ----
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
window.openModal = openModal;
window.closeModal = closeModal;

// ---- Logout (global so onclick attribute works too) ----
function doLogout() {
  Auth.clearSession();
  CartStore.clear();
  window.location.href = '/index.html';
}
window.doLogout = doLogout;

// ---- Helpers ----
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function setTextContent(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }

// ---- Fill UI from user object ----
function fillProfileUI(user) {
  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();

  setTextContent('profile-name', user.name);
  setTextContent('profile-email', user.email);
  setTextContent('profile-phone', user.phone || 'Not set');
  setTextContent('profile-residence', user.residence || 'Not set');
  setTextContent('profile-gender', user.gender || 'Not set');
  setTextContent('profile-joined', new Date(user.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }));

  // Sidebar detail fields
  setTextContent('detail-name', user.name);
  setTextContent('detail-email', user.email);
  setTextContent('detail-phone', user.phone || 'Not set');
  setTextContent('detail-residence', user.residence || 'Not set');
  setTextContent('detail-gender', user.gender || 'Not set');

  // Admin button — use fresh server data, not just localStorage
  const adminBtn = document.getElementById('admin-panel-btn');
  if (adminBtn) adminBtn.style.display = user.isAdmin ? 'flex' : 'none';

  // Pre-fill edit form
  setVal('edit-name', user.name);
  setVal('edit-phone', user.phone || '');
  setVal('edit-residence', user.residence || '');
  setVal('edit-gender', user.gender || '');
}

// ---- Fetch fresh user from server (fixes isAdmin not showing) ----
async function loadProfile() {
  try {
    const data = await API.get('/auth/me');
    const user = data.user;
    // Update localStorage with fresh data from server
    Auth.setSession(Auth.getToken(), user);
    fillProfileUI(user);
  } catch (err) {
    // Fallback to localStorage if server unreachable
    const user = Auth.getUser();
    if (user) fillProfileUI(user);
    else showToast('Could not load profile: ' + err.message, 'error');
  }
}

async function loadOrders() {
  const container = document.getElementById('orders-container');
  const loadingEl = document.getElementById('orders-loading');
  if (!container) return;

  try {
    const data = await API.get('/orders/my');
    if (loadingEl) loadingEl.remove();

    if (data.orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="ri-file-list-3-line"></i></div>
          <h3>No orders yet</h3>
          <p>When you place an order, it will appear here.</p>
          <a href="/index.html" class="btn btn-primary"><i class="ri-shopping-bag-line"></i> Start Shopping</a>
        </div>`;
      return;
    }

    container.innerHTML = '';
    data.orders.forEach(order => container.appendChild(buildOrderCard(order)));

  } catch (err) {
    if (loadingEl) loadingEl.remove();
    container.innerHTML = `<p style="color:var(--text-muted)">Failed to load orders: ${err.message}</p>`;
  }
}

function buildOrderCard(order) {
  const div = document.createElement('div');
  div.className = 'order-card';

  const statusIcon = {
    pending: 'ri-time-line', confirmed: 'ri-checkbox-circle-line',
    processing: 'ri-settings-3-line', shipped: 'ri-truck-line',
    delivered: 'ri-check-double-line', cancelled: 'ri-close-circle-line'
  }[order.status] || 'ri-time-line';

  const badgeClass = order.status === 'delivered' ? 'badge-green' : order.status === 'cancelled' ? 'badge-red' : 'badge-blue';
  const date = new Date(order.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

  div.innerHTML = `
    <div class="order-header">
      <div>
        <div class="order-id">#${order._id.slice(-8).toUpperCase()}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${date} • ${order.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Airtel Money'}</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <span class="badge ${badgeClass}"><i class="${statusIcon}"></i> ${capitalize(order.status)}</span>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">KSh ${Number(order.totalAmount).toLocaleString()}</div>
      </div>
    </div>
    <div class="order-items">
      ${order.items.map(item => `
        <div class="order-item-row">
          <img class="order-item-img"
            src="${fixImageUrl(item.image) || 'https://placehold.co/48x48/E2E6F0/8A93A8?text=?'}"
            alt="${item.name}"
            onerror="this.src='https://placehold.co/48x48/E2E6F0/8A93A8?text=?'">
          <div style="flex:1">
            <div style="font-weight:600">${item.name}</div>
            <div style="font-size:12px;color:var(--text-muted)">Qty: ${item.quantity} × KSh ${Number(item.price).toLocaleString()}</div>
          </div>
          <div style="font-weight:700;font-family:'Syne',sans-serif">KSh ${(item.quantity * item.price).toLocaleString()}</div>
        </div>`).join('')}
    </div>`;

  return div;
}

// ---- Main init ----
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  // Dark mode
  document.querySelectorAll('.dark-toggle').forEach(btn => btn.addEventListener('click', toggleDarkMode));

  // Logout button — both event listener AND onclick fallback
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = doLogout;
  }

  // Close modal when clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Edit profile form
  const editForm = document.getElementById('edit-profile-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = editForm.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px"></span> Saving...';

      const body = {
        name: document.getElementById('edit-name').value.trim(),
        phone: document.getElementById('edit-phone').value.trim(),
        residence: document.getElementById('edit-residence').value.trim(),
        gender: document.getElementById('edit-gender').value
      };

      try {
        const data = await API.put('/auth/profile', body);
        // Update localStorage with new data
        Auth.setSession(Auth.getToken(), data.user);
        // Update UI immediately
        fillProfileUI(data.user);
        // Close modal
        closeModal('edit-profile-modal');
        showToast('Profile updated successfully!', 'success');
      } catch (err) {
        showToast('Update failed: ' + err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ri-save-line"></i> Save Changes';
      }
    });
  }

  // Load data
  loadProfile();
  loadOrders();
});