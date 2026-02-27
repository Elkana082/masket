// =============================
//  MASKET — Admin Panel JS
// =============================

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAdmin()) return;

  // Nav
  document.querySelectorAll('.admin-nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  });

  document.querySelectorAll('.dark-toggle').forEach(btn => btn.addEventListener('click', toggleDarkMode));

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { Auth.clearSession(); CartStore.clear(); window.location.href = '/index.html'; });

  loadStats();
  loadProducts();
  loadOrders();
  loadContacts();
  loadUsers();

  // Product form
  const prodForm = document.getElementById('product-form');
  if (prodForm) {
    prodForm.addEventListener('submit', handleProductSubmit);
  }

  // Image preview
  const imgInput = document.getElementById('prod-image');
  if (imgInput) {
    imgInput.addEventListener('change', () => {
      const file = imgInput.files[0];
      if (file) {
        const preview = document.getElementById('img-preview');
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
      }
    });
  }
});

// ---- Section switching ----
function switchSection(id) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('section-' + id);
  if (sec) sec.classList.add('active');
  const btn = document.querySelector(`.admin-nav-item[data-section="${id}"]`);
  if (btn) btn.classList.add('active');
}

// ---- Stats ----
async function loadStats() {
  try {
    const data = await API.get('/admin/stats');
    const s = data.stats;
    setTextContent('stat-products', s.totalProducts);
    setTextContent('stat-orders', s.totalOrders);
    setTextContent('stat-users', s.totalUsers);
    setTextContent('stat-pending', s.pendingOrders);
  } catch (err) { console.error(err); }
}

// ---- Products ----
let editingProductId = null;

async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  try {
    const data = await API.get('/products');
    tbody.innerHTML = '';
    data.products.forEach(p => tbody.appendChild(buildProductRow(p)));
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Failed to load products</td></tr>`;
  }
}

function buildProductRow(p) {
  const tr = document.createElement('tr');
  const imgSrc = fixImageUrl(p.image) || 'https://placehold.co/46x46/E2E6F0/8A93A8?text=?';
  tr.innerHTML = `
    <td><img class="table-img" src="${imgSrc}" alt="${p.name}" onerror="this.src='https://placehold.co/46x46/E2E6F0/8A93A8?text=?'"></td>
    <td><div style="font-weight:600;font-size:14px">${p.name}</div><div style="font-size:12px;color:var(--text-muted)">${p.shortDescription?.substring(0,50) || ''}</div></td>
    <td><span class="badge badge-gray">${capitalize(p.category)}</span></td>
    <td><span class="badge ${p.condition==='refurbished'?'badge-orange':'badge-blue'}">${p.condition==='refurbished'?'Refurbished':'Brand New'}</span></td>
    <td style="font-family:'Syne',sans-serif;font-weight:700">KSh ${Number(p.price).toLocaleString()}</td>
    <td>
      <div class="table-actions">
        <button class="btn btn-ghost btn-sm" onclick="openEditProduct('${p._id}')"><i class="ri-edit-line"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p._id}', '${p.name.replace(/'/g,"\\'")}')"><i class="ri-delete-bin-line"></i></button>
        ${p.featured ? '<span class="badge badge-blue"><i class="ri-star-fill"></i></span>' : ''}
      </div>
    </td>`;
  return tr;
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type="submit"]');
  btn.disabled = true;

  const fd = new FormData();
  const fields = ['name','description','shortDescription','price','category','condition','stock','featuredCaption'];
  fields.forEach(f => { const el = document.getElementById('prod-' + f); if(el) fd.append(f, el.value); });
  const featuredEl = document.getElementById('prod-featured');
  if (featuredEl) fd.append('featured', featuredEl.checked);
  const imgEl = document.getElementById('prod-image');
  if (imgEl && imgEl.files[0]) fd.append('image', imgEl.files[0]);

  try {
    if (editingProductId) {
      await API.putForm(`/admin/products/${editingProductId}`, fd);
      showToast('Product updated!', 'success');
    } else {
      await API.postForm('/admin/products', fd);
      showToast('Product added!', 'success');
    }
    closeModal('product-modal');
    resetProductForm();
    loadProducts();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function openEditProduct(id) {
  try {
    const data = await API.get(`/products/${id}`);
    const p = data.product;
    editingProductId = id;

    const fields = ['name','description','shortDescription','price','category','condition','stock','featuredCaption'];
    fields.forEach(f => { const el = document.getElementById('prod-' + f); if(el) el.value = p[f] || ''; });
    const featEl = document.getElementById('prod-featured');
    if (featEl) featEl.checked = p.featured;

    const preview = document.getElementById('img-preview');
    if (preview && p.image) { preview.src = fixImageUrl(p.image); preview.style.display = 'block'; }

    document.getElementById('product-modal-title').textContent = 'Edit Product';
    openModal('product-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await API.delete(`/admin/products/${id}`);
    showToast(`"${name}" deleted`, 'info');
    loadProducts();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAddProduct() {
  editingProductId = null;
  resetProductForm();
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  openModal('product-modal');
}

function resetProductForm() {
  const form = document.getElementById('product-form');
  if (form) form.reset();
  const preview = document.getElementById('img-preview');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
}

// ---- Orders ----
async function loadOrders() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  try {
    const data = await API.get('/admin/orders');
    tbody.innerHTML = '';
    data.orders.forEach(o => tbody.appendChild(buildOrderRow(o)));
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Failed to load orders</td></tr>`;
  }
}

function buildOrderRow(o) {
  const tr = document.createElement('tr');
  const date = new Date(o.createdAt).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' });
  const statusColors = { pending:'badge-orange', confirmed:'badge-blue', processing:'badge-blue', shipped:'badge-blue', delivered:'badge-green', cancelled:'badge-red' };

  tr.innerHTML = `
    <td style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">#${o._id.slice(-8).toUpperCase()}</td>
    <td><div style="font-weight:600">${o.user?.name||'Unknown'}</div><div style="font-size:12px;color:var(--text-muted)">${o.user?.email||'—'}</div><div style="font-size:12px;color:var(--text-muted)">${o.user?.phone||'—'}</div></td>
    <td style="font-size:12px">${date}</td>
    <td style="font-family:'Syne',sans-serif;font-weight:700">KSh ${Number(o.totalAmount).toLocaleString()}</td>
    <td><span class="badge ${statusColors[o.status]||'badge-gray'}">${capitalize(o.status)}</span></td>
    <td>
      <div style="display:flex;gap:8px;align-items:center">
        <select class="form-control" style="font-size:12px;padding:6px 8px;width:130px" onchange="updateOrderStatus('${o._id}', this.value)">
          ${['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${s===o.status?'selected':''}>${capitalize(s)}</option>`).join('')}
        </select>
        <button class="btn btn-danger btn-sm" onclick="deleteOrder('${o._id}')" title="Delete Order"><i class="ri-delete-bin-line"></i></button>
      </div>
    </td>`;
  return tr;
}

async function deleteOrder(id) {
  if (!confirm('Delete this order permanently? This cannot be undone.')) return;
  try {
    await API.delete('/admin/orders/' + id);
    showToast('Order deleted', 'info');
    loadOrders();
    loadStats();
  } catch (err) { showToast(err.message, 'error'); }
}

async function updateOrderStatus(id, status) {
  try {
    await API.put(`/admin/orders/${id}`, { status });
    showToast('Order status updated', 'success');
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteUser(id, name) {
  if (!confirm('Delete user "' + name + '"? This cannot be undone.')) return;
  try {
    await API.delete('/admin/users/' + id);
    showToast('"' + name + '" deleted', 'info');
    loadUsers();
    loadStats();
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Contacts ----
async function loadContacts() {
  const container = document.getElementById('contacts-container');
  if (!container) return;
  try {
    const data = await API.get('/contact');
    container.innerHTML = '';
    if (data.messages.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="ri-message-3-line"></i></div><h3>No messages yet</h3></div>`;
      return;
    }
    data.messages.forEach(m => {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.marginBottom = '12px';
      const date = new Date(m.createdAt).toLocaleString('en-KE');
      div.innerHTML = `
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div>
              <div style="font-weight:700;font-family:'Syne',sans-serif">${m.name}</div>
              <div style="font-size:12px;color:var(--text-muted)">${m.phone} · ${date}</div>
            </div>
            ${m.read ? '<span class="badge badge-green"><i class="ri-check-line"></i> Read</span>' : `<button class="btn btn-ghost btn-sm" onclick="markRead('${m._id}', this)"><i class="ri-check-line"></i> Mark Read</button>`}
          </div>
          <p style="margin-top:12px;font-size:14px;color:var(--text)">${m.message}</p>
        </div>`;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = `<p style="color:var(--text-muted)">${err.message}</p>`;
  }
}

async function markRead(id, btn) {
  try {
    await API.put(`/contact/${id}/read`, {});
    btn.outerHTML = '<span class="badge badge-green"><i class="ri-check-line"></i> Read</span>';
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Users ----
async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  try {
    const data = await API.get('/admin/users');
    tbody.innerHTML = '';
    data.users.forEach(u => {
      const tr = document.createElement('tr');
      const date = new Date(u.createdAt).toLocaleDateString('en-KE');
      tr.innerHTML = `
        <td style="font-weight:600">${u.name}</td>
        <td style="font-size:13px">${u.email}</td>
        <td style="font-size:13px">${u.phone || '—'}</td>
        <td style="font-size:13px">${u.residence || '—'}</td>
        <td style="font-size:12px;color:var(--text-muted)">${date}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteUser('${u._id}', '${u.name.replace(/'/g,"\\'")}')" title="Delete User"><i class="ri-delete-bin-line"></i></button></td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Failed to load users</td></tr>`;
  }
}

// ---- Modal helpers ----
function openModal(id) { const m = document.getElementById(id); if(m){m.classList.add('open');document.body.style.overflow='hidden';} }
function closeModal(id) { const m = document.getElementById(id); if(m){m.classList.remove('open');document.body.style.overflow='';} }
document.querySelectorAll && document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', (e) => { if(e.target===o) closeModal(o.id); }));
});
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function setTextContent(id, val) { const el = document.getElementById(id); if(el) el.textContent = val; }

window.openModal = openModal;
window.closeModal = closeModal;
window.openAddProduct = openAddProduct;
window.openEditProduct = openEditProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.markRead = markRead;
window.switchSection = switchSection;
window.deleteOrder = deleteOrder;
window.deleteUser = deleteUser;