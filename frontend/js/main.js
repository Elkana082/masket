// =============================
//  MASKET — Home Page JS
// =============================

document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
  setupHeroAnimations();
  updateNavAuthState();
  document.querySelectorAll('.dark-toggle').forEach(btn => btn.addEventListener('click', toggleDarkMode));
});

function updateNavAuthState() {
  const user = Auth.getUser();
  const loggedIn = Auth.isLoggedIn();

  const authLink = document.getElementById('nav-auth-link');
  const authText = document.getElementById('nav-auth-text');
  const authIcon = document.getElementById('nav-auth-icon');
  if (authLink && loggedIn && user) {
    if (authText) authText.textContent = user.name.split(' ')[0];
    if (authIcon) authIcon.className = 'ri-user-3-fill';
    authLink.href = '/profile.html';
  }

  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    if (loggedIn) {
      logoutBtn.style.display = 'flex';
      logoutBtn.onclick = () => { Auth.clearSession(); CartStore.clear(); window.location.href = '/index.html'; };
    } else {
      logoutBtn.style.display = 'none';
    }
  }
}

async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products');
  const loadingEl = document.getElementById('featured-loading');
  if (!container) return;

  try {
    const data = await API.get('/products?featured=true');
    if (loadingEl) loadingEl.remove();

    if (!data.products || data.products.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon"><i class="ri-shopping-bag-line"></i></div>
          <h3>No featured products yet</h3>
          <p>Add products from the Admin Panel and mark them as featured.</p>
        </div>`;
      return;
    }

    container.innerHTML = '';
    data.products.forEach((p, i) => container.appendChild(createProductCard(p, i)));

    // Set hero caption from first featured product
    const featured = data.products.find(p => p.featuredCaption);
    if (featured) {
      const heroCaption = document.getElementById('hero-caption');
      if (heroCaption) heroCaption.textContent = featured.featuredCaption;
    }

  } catch (err) {
    if (loadingEl) loadingEl.remove();
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px">Failed to load products</div>`;
  }
}

function createProductCard(product, index = 0) {
  const div = document.createElement('div');
  div.className = `product-card fade-in fade-in-delay-${Math.min(index + 1, 3)}`;
  div.style.cursor = 'pointer';

  const imgSrc = fixImageUrl(product.image) || 'https://placehold.co/300x300/E2E6F0/8A93A8?text=No+Image';
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
      <div class="product-short-desc">${product.shortDescription || product.description.substring(0, 80)}...</div>
      <div class="product-footer">
        <div class="product-price">KSh ${Number(product.price).toLocaleString()}</div>
        <button class="add-to-cart-btn" title="Add to Cart" id="atc-home-${product._id}">
          <i class="ri-shopping-cart-2-line"></i>
        </button>
      </div>
    </div>`;

  // Navigate to product detail on card click
  div.addEventListener('click', (e) => {
    if (!e.target.closest('.add-to-cart-btn')) {
      window.location.href = `/product.html?id=${product._id}`;
    }
  });

  // Add to cart — stop propagation
  const atcBtn = div.querySelector(`#atc-home-${product._id}`);
  if (atcBtn) {
    atcBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product._id, product.name, product.price, imgSrc, product.condition, atcBtn);
    });
  }

  return div;
}

function addToCart(productId, name, price, image, condition, btn) {
  const cart = CartStore.get();
  const existing = cart.find(i => i.productId === productId && i.condition === condition);
  if (existing) existing.quantity = (existing.quantity || 1) + 1;
  else cart.push({ productId, name, price, image, condition, quantity: 1 });
  CartStore.set(cart);
  updateCartBadge();
  showToast(`"${name}" added to cart!`, 'success');

  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="ri-check-line"></i>';
    btn.style.background = '#22c55e';
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 1500);
  }

  if (Auth.isLoggedIn()) {
    API.post('/auth/cart', { productId, quantity: 1, condition }).catch(() => {});
  }
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function setupHeroAnimations() {
  const heroEls = document.querySelectorAll('.hero-content > *');
  heroEls.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s`;
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 100);
  });
}

window.addToCart = addToCart;
window.createProductCard = createProductCard;