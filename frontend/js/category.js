// =============================
//  MASKET — Category Page JS
// =============================

let currentCategory = 'shoes';
let currentCondition = 'brand_new';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  currentCategory = params.get('cat') || 'shoes';
  currentCondition = params.get('cond') || 'brand_new';

  const catNames = { shoes: 'Shoes', jewelry: 'Jewelry', clothes: 'Clothes', electronics: 'Electronics' };
  const catName = catNames[currentCategory] || capitalize(currentCategory);

  const titleEl = document.getElementById('cat-title');
  const breadcrumbEl = document.getElementById('cat-breadcrumb');
  if (titleEl) titleEl.textContent = catName;
  if (breadcrumbEl) breadcrumbEl.textContent = catName;
  document.title = catName + ' — Masket';

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
    const data = await API.get('/products?category=' + currentCategory + '&condition=' + currentCondition);
    if (loading) loading.style.display = 'none';
    if (countEl) countEl.textContent = data.products.length + ' products';

    if (data.products.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.style.gridColumn = '1 / -1';
      empty.innerHTML = '<div class="empty-icon"><i class="ri-shopping-bag-line"></i></div>'
        + '<h3>No ' + (currentCondition === 'refurbished' ? 'refurbished' : 'brand new') + ' ' + capitalize(currentCategory) + ' yet</h3>'
        + '<p>Check back soon for new arrivals!</p>';
      grid.appendChild(empty);
      return;
    }

    data.products.forEach(function(p, i) { grid.appendChild(buildProductCard(p, i)); });

  } catch (err) {
    if (loading) loading.style.display = 'none';
    const errDiv = document.createElement('div');
    errDiv.className = 'empty-state';
    errDiv.style.gridColumn = '1 / -1';
    errDiv.innerHTML = '<div class="empty-icon"><i class="ri-wifi-off-line"></i></div>'
      + '<h3>Could not load products</h3>'
      + '<p>Make sure your backend server is running, then refresh.</p>'
      + '<button onclick="loadProducts()" class="btn btn-primary"><i class="ri-refresh-line"></i> Try Again</button>';
    grid.appendChild(errDiv);
  }
}

function buildProductCard(product, index) {
  const imgSrc = fixImageUrl(product.image) || 'https://placehold.co/300x300/E2E6F0/8A93A8?text=No+Image';

  // --- Outer card ---
  const div = document.createElement('div');
  div.className = 'product-card fade-in';
  div.style.animationDelay = (index * 0.05) + 's';
  div.style.cursor = 'pointer';

  // --- Image wrapper ---
  const imgWrap = document.createElement('div');
  imgWrap.className = 'product-img-wrap';

  const img = document.createElement('img');
  img.src = imgSrc;
  img.alt = product.name;
  img.loading = 'lazy';
  img.onerror = function() { this.src = 'https://placehold.co/300x300/E2E6F0/8A93A8?text=No+Image'; };

  const badgeWrap = document.createElement('div');
  badgeWrap.className = 'product-badge';
  const badge = document.createElement('span');
  badge.className = product.condition === 'refurbished' ? 'badge badge-orange' : 'badge badge-blue';
  badge.textContent = product.condition === 'refurbished' ? 'Refurbished' : 'Brand New';
  badgeWrap.appendChild(badge);

  imgWrap.appendChild(img);
  imgWrap.appendChild(badgeWrap);

  // --- Info section ---
  const info = document.createElement('div');
  info.className = 'product-info';

  const cat = document.createElement('div');
  cat.className = 'product-category';
  cat.textContent = capitalize(product.category);

  const name = document.createElement('div');
  name.className = 'product-name';
  name.textContent = product.name;

  const desc = document.createElement('div');
  desc.className = 'product-short-desc';
  desc.textContent = product.shortDescription || product.description.substring(0, 80);

  const footer = document.createElement('div');
  footer.className = 'product-footer';

  const price = document.createElement('div');
  price.className = 'product-price';
  price.textContent = 'KSh ' + Number(product.price).toLocaleString();

  const atcBtn = document.createElement('button');
  atcBtn.className = 'add-to-cart-btn';
  atcBtn.title = 'Add to Cart';
  atcBtn.innerHTML = '<i class="ri-shopping-cart-2-line"></i>';

  footer.appendChild(price);
  footer.appendChild(atcBtn);
  info.appendChild(cat);
  info.appendChild(name);
  info.appendChild(desc);
  info.appendChild(footer);
  div.appendChild(imgWrap);
  div.appendChild(info);

  // --- Click: go to product page ---
  div.addEventListener('click', function(e) {
    if (!e.target.closest('.add-to-cart-btn')) {
      window.location.href = '/product.html?id=' + product._id;
    }
  });

  // --- Add to cart: stop propagation ---
  atcBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    addToCart(product._id, product.name, product.price, imgSrc, product.condition, atcBtn);
  });

  return div;
}

function addToCart(productId, name, price, image, condition, btn) {
  const cart = CartStore.get();
  const existing = cart.find(function(i) { return i.productId === productId && i.condition === condition; });
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ productId: productId, name: name, price: price, image: image, condition: condition, quantity: 1 });
  }
  CartStore.set(cart);
  updateCartBadge();
  showToast('"' + name + '" added to cart!', 'success');

  if (btn) {
    var orig = btn.innerHTML;
    btn.innerHTML = '<i class="ri-check-line"></i>';
    btn.style.background = '#22c55e';
    setTimeout(function() { btn.innerHTML = orig; btn.style.background = ''; }, 1500);
  }

  if (Auth.isLoggedIn()) {
    API.post('/auth/cart', { productId: productId, quantity: 1, condition: condition }).catch(function() {});
  }
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }