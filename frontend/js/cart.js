// =============================
//  MASKET — Cart Page JS
// =============================

document.addEventListener('DOMContentLoaded', () => {
  renderCart();

  document.querySelectorAll('.dark-toggle').forEach(btn => {
    btn.addEventListener('click', toggleDarkMode);
  });
});

function renderCart() {
  const cart = CartStore.get();
  const cartItemsEl = document.getElementById('cart-items');
  const cartSummaryEl = document.getElementById('cart-summary');
  const emptyEl = document.getElementById('cart-empty');
  const cartContentEl = document.getElementById('cart-content');

  if (!cartItemsEl) return;

  if (cart.length === 0) {
    if (cartContentEl) cartContentEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (cartContentEl) cartContentEl.style.display = 'grid';

  cartItemsEl.innerHTML = '';
  let subtotal = 0;

  cart.forEach((item, idx) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    subtotal += itemTotal;

    const imgSrc = fixImageUrl(item.image) || 'https://placehold.co/80x80/E2E6F0/8A93A8?text=?';

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.idx = idx;
    div.innerHTML = `
      <img class="cart-item-img" src="${imgSrc}" alt="${item.name}"
        onerror="this.src='https://placehold.co/80x80/E2E6F0/8A93A8?text=?'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">
          ${item.condition === 'refurbished' ? '<span class="badge badge-orange">Refurbished</span>' : '<span class="badge badge-blue">Brand New</span>'}
          &nbsp;• KSh ${Number(item.price).toLocaleString()} each
        </div>
        <div class="qty-ctrl">
          <button onclick="changeQty(${idx}, -1)"><i class="ri-subtract-line"></i></button>
          <span>${item.quantity || 1}</span>
          <button onclick="changeQty(${idx}, 1)"><i class="ri-add-line"></i></button>
        </div>
      </div>
      <div class="cart-item-price">KSh ${Number(itemTotal).toLocaleString()}</div>
      <button class="cart-item-remove" onclick="removeItem(${idx})" title="Remove">
        <i class="ri-close-line"></i>
      </button>`;
    cartItemsEl.appendChild(div);
  });

  // Summary
  const shipping = subtotal > 5000 ? 0 : 0;
  const total = subtotal + shipping;

  if (cartSummaryEl) {
    document.getElementById('summary-subtotal').textContent = `KSh ${subtotal.toLocaleString()}`;
    document.getElementById('summary-shipping').textContent = shipping === 0 ? 'FREE' : `KSh ${shipping.toLocaleString()}`;
    document.getElementById('summary-total').textContent = `KSh ${total.toLocaleString()}`;
  }

  // Item count badge
  const countEl = document.getElementById('cart-item-count');
  if (countEl) countEl.textContent = cart.length + (cart.length === 1 ? ' item' : ' items');
}

function changeQty(idx, delta) {
  const cart = CartStore.get();
  if (!cart[idx]) return;
  cart[idx].quantity = Math.max(1, (cart[idx].quantity || 1) + delta);
  CartStore.set(cart);
  updateCartBadge();
  renderCart();
}

function removeItem(idx) {
  const cart = CartStore.get();
  const removed = cart.splice(idx, 1)[0];
  CartStore.set(cart);
  updateCartBadge();
  renderCart();
  showToast(`"${removed.name}" removed`, 'info');
}

function clearCart() {
  if (!confirm('Clear your entire cart?')) return;
  CartStore.clear();
  updateCartBadge();
  renderCart();
  showToast('Cart cleared', 'info');
}

window.changeQty = changeQty;
window.removeItem = removeItem;
window.clearCart = clearCart;