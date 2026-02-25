// =============================
//  MASKET — Category Page JS
// =============================

let currentCategory = 'shoes';
let currentCondition = 'brand_new';

document.addEventListener('DOMContentLoaded', () => {
  // Get category from URL
  const params = new URLSearchParams(window.location.search);
  currentCategory = params.get('cat') || 'shoes';
  currentCondition = params.get('cond') || 'brand_new';

  // Set page title & breadcrumb
  const catNames = { shoes: 'Shoes', jewelry: 'Jewelry', clothes: 'Clothes', electronics: 'Electronics' };
  const catName = catNames[currentCategory] || capitalize(currentCategory);

  const titleEl = document.getElementById('cat-title');
  const breadcrumbEl = document.getElementById('cat-breadcrumb');
  if (titleEl) titleEl.textContent = catName;
  if (breadcrumbEl) breadcrumbEl.textContent = catName;

  // Condition tabs
  document.querySelectorAll('.cond-tab').forEach(tab => {
    if (tab.dataset.cond === currentCondition) tab.classList.add('active');
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cond-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCondition = tab.dataset.cond;
      loadProducts();
    });
  });

  loadProducts();

  document.querySelectorAll('.dark-toggle').forEach(btn => btn.addEventListener('click', toggleDarkMode));
});

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  const loading = document.getElementById('products-loading');
  const countEl = document.getElementById('products-count');

  if (!grid) return;

  grid.innerHTML = '';
  if (loading) loading.style.display = 'flex';

  try {
    const data = await API.get(`/products?category=${currentCategory}&condition=${currentCondition}`);
    if (loading) loading.style.display = 'none';

    if (countEl) countEl.textContent = data.products.length + ' products';

    if (data.products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon"><i class="ri-shopping-bag-line"></i></div>
          <h3>No ${currentCondition === 'refurbished' ? 'refurbished' : 'brand new'} ${capitalize(currentCategory)} yet</h3>
          <p>Check back soon for new arrivals!</p>
        </div>`;
      return;
    }

    data.products.forEach((p, i) => {
      const card = buildProductCard(p, i);
      grid.appendChild(card);
    });

  } catch (err) {
    if (loading) loading.style.display = 'none';
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px">${err.message}</div>`;
  }
}

function buildProductCard(product, index) {
  const div = document.createElement('div');
  div.className = 'product-card fade-in';
  div.style.animationDelay = `${index * 0.05}s`;

  const imgSrc = product.image
    ? product.image
    : 'https://placehold.co/300x300/E2E6F0/8A93A8?text=No+Image';

  const condBadge = product.condition === 'refurbished'
    ? `<span class="badge badge-orange">Refurbished</span>`
    : `<span class="badge badge-blue">Brand New</span>`;

  div.innerHTML = `
    <div class="product-img-wrap">
      <img src="${imgSrc}" alt="${product.name}" loading="lazy"
        onerror="this.src='https://placehold.co/300x300/E2E6F0/8A93A8?text=No+Image'">
      <div class="product-badge">${condBadge}</div>
    </div>
    <div class="product-info">
      <div class="product-category">${capitalize(product.category)}</div>
      <div class="product-name">${product.name}</div>
      <div class="product-short-desc">${product.shortDescription || product.description.substring(0, 80)}</div>
      <div class="product-footer">
        <div class="product-price">KSh ${Number(product.price).toLocaleString()}</div>
        <button class="add-to-cart-btn" title="Add to Cart"
          onclick="addToCart('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${imgSrc}', '${product.condition}')">
          <i class="ri-shopping-cart-2-line"></i>
        </button>
      </div>
    </div>`;
  return div;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function addToCart(productId, name, price, image, condition) {
  const cart = CartStore.get();
  const existing = cart.find(i => i.productId === productId && i.condition === condition);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ productId, name, price, image, condition, quantity: 1 });
  }
  CartStore.set(cart);
  updateCartBadge();
  showToast(`"${name}" added to cart!`, 'success');
  if (Auth.isLoggedIn()) {
    API.post('/auth/cart', { productId, quantity: 1, condition }).catch(() => {});
  }
}

window.addToCart = addToCart;