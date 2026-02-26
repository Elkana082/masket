// =============================
//  MASKET — Product Detail JS
// =============================

let currentProduct = null;
let currentQty = 1;
let zoomScale = 1;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let lastPan = { x: 0, y: 0 };

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  updateCartBadge();

  document.querySelectorAll('.dark-toggle').forEach(b => b.addEventListener('click', toggleDarkMode));

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    showError();
    return;
  }

  loadProduct(productId);
  setupZoomEvents();
});

// ===== LOAD PRODUCT =====
async function loadProduct(id) {
  try {
    const data = await API.get(`/products/${id}`);
    currentProduct = data.product;
    renderProduct(currentProduct);
    loadRelated(currentProduct.category, currentProduct._id);
  } catch (err) {
    showError();
  }
}

function renderProduct(p) {
  const loading = document.getElementById('product-loading');
  const detail = document.getElementById('product-detail');
  if (loading) loading.style.display = 'none';
  if (detail) detail.style.display = 'grid';

  const imgSrc = p.image || 'https://placehold.co/600x600/E2E6F0/8A93A8?text=No+Image';

  // Image
  const mainImg = document.getElementById('main-product-img');
  if (mainImg) { mainImg.src = imgSrc; mainImg.alt = p.name; }

  // Zoom img
  const zoomImg = document.getElementById('zoom-img');
  if (zoomImg) { zoomImg.src = imgSrc; zoomImg.alt = p.name; }

  // Condition badge
  const badge = document.getElementById('img-condition-badge');
  if (badge) {
    badge.innerHTML = p.condition === 'refurbished'
      ? '<span class="badge badge-orange"><i class="ri-recycle-line"></i> Refurbished</span>'
      : '<span class="badge badge-blue"><i class="ri-star-line"></i> Brand New</span>';
  }

  // Text content
  setText('product-name', p.name);
  setText('product-price-val', Number(p.price).toLocaleString());
  setText('product-description', p.description);
  setText('product-cat-text', capitalize(p.category));
  setText('meta-condition', p.condition === 'refurbished' ? '♻️ Refurbished' : '⭐ Brand New');
  setText('meta-category', capitalize(p.category));
  setText('meta-stock', 'Available');

  // Condition label next to price
  const condLabel = document.getElementById('product-condition-label');
  if (condLabel) condLabel.textContent = p.condition === 'refurbished' ? '(Refurbished)' : '(Brand New)';

  // Stock indicator — always show available
  const stockEl = document.getElementById('stock-indicator');
  const stockText = document.getElementById('stock-text');
  if (stockEl && stockText) {
    stockEl.className = 'stock-indicator in-stock';
    stockText.textContent = 'Available';
  }

  // Breadcrumb
  const catLink = document.getElementById('breadcrumb-cat');
  if (catLink) {
    catLink.textContent = capitalize(p.category);
    catLink.href = `/category.html?cat=${p.category}`;
  }
  setText('breadcrumb-name', p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name);

  // Page title
  document.title = `${p.name} — Masket`;
}

// ===== RELATED PRODUCTS =====
async function loadRelated(category, excludeId) {
  try {
    const data = await API.get(`/products?category=${category}`);
    const related = data.products.filter(p => p._id !== excludeId).slice(0, 4);

    const section = document.getElementById('related-section');
    const grid = document.getElementById('related-grid');
    const catName = document.getElementById('related-cat-name');
    const viewAll = document.getElementById('related-view-all');

    if (!section || !grid || related.length === 0) return;

    if (catName) catName.textContent = capitalize(category);
    if (viewAll) viewAll.href = `/category.html?cat=${category}`;

    section.style.display = 'block';
    grid.innerHTML = '';

    related.forEach(p => {
      const imgSrc = p.image || 'https://placehold.co/300x300/E2E6F0/8A93A8?text=No+Image';
      const card = document.createElement('div');
      card.className = 'product-card fade-in';
      card.style.cursor = 'pointer';
      card.onclick = () => window.location.href = `/product.html?id=${p._id}`;
      card.innerHTML = `
        <div class="product-img-wrap">
          <img src="${imgSrc}" alt="${p.name}" loading="lazy"
            onerror="this.src='https://placehold.co/300x300/E2E6F0/8A93A8?text=No+Image'">
          <div class="product-badge">
            ${p.condition === 'refurbished'
              ? '<span class="badge badge-orange">Refurbished</span>'
              : '<span class="badge badge-blue">Brand New</span>'}
          </div>
        </div>
        <div class="product-info">
          <div class="product-category">${capitalize(p.category)}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-short-desc">${p.shortDescription || p.description.substring(0, 60)}...</div>
          <div class="product-footer">
            <div class="product-price">KSh ${Number(p.price).toLocaleString()}</div>
            <button class="add-to-cart-btn" title="Add to Cart"
              onclick="event.stopPropagation(); quickAddToCart('${p._id}','${p.name.replace(/'/g,"\\'")}',${p.price},'${imgSrc}','${p.condition}')">
              <i class="ri-shopping-cart-2-line"></i>
            </button>
          </div>
        </div>`;
      grid.appendChild(card);
    });
  } catch (e) { /* silently fail */ }
}

// ===== QUANTITY =====
function changeQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  const el = document.getElementById('qty-display');
  if (el) el.textContent = currentQty;
}

// ===== ADD TO CART =====
function addProductToCart() {
  if (!currentProduct) return;
  const cart = CartStore.get();
  const existing = cart.find(i => i.productId === currentProduct._id && i.condition === currentProduct.condition);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + currentQty;
  } else {
    cart.push({
      productId: currentProduct._id,
      name: currentProduct.name,
      price: currentProduct.price,
      image: currentProduct.image || '',
      condition: currentProduct.condition,
      quantity: currentQty
    });
  }
  CartStore.set(cart);
  updateCartBadge();
  showToast(`"${currentProduct.name}" added to cart!`, 'success');

  // Animate button
  const btn = document.getElementById('add-cart-btn');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="ri-check-line"></i> Added!';
    btn.style.background = '#22c55e';
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 1500);
  }

  if (Auth.isLoggedIn()) {
    API.post('/auth/cart', { productId: currentProduct._id, quantity: currentQty, condition: currentProduct.condition }).catch(() => {});
  }
}

function quickAddToCart(productId, name, price, image, condition) {
  const cart = CartStore.get();
  const existing = cart.find(i => i.productId === productId && i.condition === condition);
  if (existing) existing.quantity = (existing.quantity || 1) + 1;
  else cart.push({ productId, name, price, image, condition, quantity: 1 });
  CartStore.set(cart);
  updateCartBadge();
  showToast(`"${name}" added to cart!`, 'success');
  if (Auth.isLoggedIn()) {
    API.post('/auth/cart', { productId, quantity: 1, condition }).catch(() => {});
  }
}

// ===== ZOOM =====
function openZoom() {
  const modal = document.getElementById('zoom-modal');
  if (!modal) return;
  resetZoom();
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeZoom() {
  const modal = document.getElementById('zoom-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  resetZoom();
}

function handleZoomBgClick(e) {
  if (e.target === document.getElementById('zoom-modal') ||
      e.target === document.querySelector('.zoom-modal-inner')) {
    closeZoom();
  }
}

function adjustZoom(delta) {
  zoomScale = Math.min(5, Math.max(0.5, zoomScale + delta));
  applyZoomTransform();
}

function resetZoom() {
  zoomScale = 1;
  panOffset = { x: 0, y: 0 };
  lastPan = { x: 0, y: 0 };
  applyZoomTransform();
}

function applyZoomTransform() {
  const img = document.getElementById('zoom-img');
  const label = document.getElementById('zoom-level-label');
  if (img) img.style.transform = `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`;
  if (label) label.textContent = Math.round(zoomScale * 100) + '%';
}

function setupZoomEvents() {
  const img = document.getElementById('zoom-img');
  if (!img) return;

  // Mouse wheel zoom
  document.getElementById('zoom-modal').addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    zoomScale = Math.min(5, Math.max(0.5, zoomScale + delta));
    applyZoomTransform();
  }, { passive: false });

  // Drag to pan
  img.addEventListener('mousedown', (e) => {
    if (zoomScale <= 1) return;
    isDragging = true;
    dragStart = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    img.classList.add('grabbing');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panOffset = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
    applyZoomTransform();
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    img.classList.remove('grabbing');
  });

  // Touch pinch-zoom
  let lastTouchDist = 0;
  img.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  img.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - lastTouchDist) * 0.01;
      zoomScale = Math.min(5, Math.max(0.5, zoomScale + delta));
      lastTouchDist = dist;
      applyZoomTransform();
      e.preventDefault();
    }
  }, { passive: false });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('zoom-modal');
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeZoom();
    if (e.key === '+' || e.key === '=') adjustZoom(0.25);
    if (e.key === '-') adjustZoom(-0.25);
    if (e.key === '0') resetZoom();
  });

  // Double-click to zoom in/out
  img.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    if (zoomScale >= 2) resetZoom();
    else { zoomScale = 2.5; applyZoomTransform(); }
  });
}

// ===== HELPERS =====
function showError() {
  const loading = document.getElementById('product-loading');
  const error = document.getElementById('product-error');
  if (loading) loading.style.display = 'none';
  if (error) error.style.display = 'block';
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

// Expose globals
window.changeQty = changeQty;
window.addProductToCart = addProductToCart;
window.quickAddToCart = quickAddToCart;
window.openZoom = openZoom;
window.closeZoom = closeZoom;
window.handleZoomBgClick = handleZoomBgClick;
window.adjustZoom = adjustZoom;
window.resetZoom = resetZoom;