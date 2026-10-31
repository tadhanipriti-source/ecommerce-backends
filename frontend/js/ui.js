/* ============================================
   UI MODULE — Toast, Loader, Shared Helpers
   ============================================ */

const UI = (() => {
  /* ---- TOAST ---- */
  const toast = (msg, type = 'info', duration = 4000) => {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  };

  /* ---- LOADER ---- */
  const hideLoader = () => {
    const l = document.getElementById('loader');
    if (l) l.classList.add('hidden');
  };
  const showLoader = () => {
    const l = document.getElementById('loader');
    if (l) l.classList.remove('hidden');
  };

  /* ---- MODAL ---- */
  const showModal = (id) => {
    document.getElementById('modal-overlay').classList.add('show');
    document.getElementById(id).classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  const hideModal = (id) => {
    document.getElementById('modal-overlay').classList.remove('show');
    document.querySelectorAll('.modal.show').forEach((m) => m.classList.remove('show'));
    document.body.style.overflow = '';
  };
  const hideAllModals = () => hideModal();

  /* ---- STARS ---- */
  const stars = (rating) => {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  /* ---- FORMAT PRICE ---- */
  const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

  /* ---- SKELETON ---- */
  const skeletonCard = () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line sm"></div>
        <div class="skeleton skeleton-line lg"></div>
        <div class="skeleton skeleton-line md"></div>
        <div class="skeleton skeleton-line sm" style="height:32px;margin-top:0.5rem;border-radius:8px;"></div>
      </div>
    </div>`;

  const skeletonGrid = (n = 8) => {
    let html = '<div class="product-grid">';
    for (let i = 0; i < n; i++) html += skeletonCard();
    html += '</div>';
    return html;
  };

  /* ---- PRODUCT CARD ---- */
  const productCard = (p, wishlistIds = []) => {
    const img = p.images && p.images.length ? p.images[0].url : null;
    const isWished = wishlistIds.includes(p._id);
    const isOutOfStock = p.stock === 0;
    const discountPct = p.discountPrice
      ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
      : p.discountPercent || 0;

    return `
    <div class="product-card" data-id="${p._id}">
      <div class="product-card-img">
        ${img ? `<img src="${img}" alt="${p.name}" loading="lazy" />` : `<div class="no-img">🛍️</div>`}
        ${isOutOfStock ? `<span class="card-badge out-of-stock">Out of Stock</span>` : discountPct > 0 ? `<span class="card-badge discount">−${discountPct}%</span>` : p.isFeatured ? `<span class="card-badge featured">⚡ Featured</span>` : ''}
        <div class="card-actions">
          <button class="btn-icon wishlist-toggle ${isWished ? 'active' : ''}" data-id="${p._id}" title="Wishlist">
            <svg viewBox="0 0 24 24" fill="${isWished ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button class="btn-icon quick-view-btn" data-id="${p._id}" title="Quick View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="product-card-body">
        ${p.brand ? `<div class="product-brand">${p.brand}</div>` : ''}
        <div class="product-name">${p.name}</div>
        <div class="product-rating">
          <span class="stars">${stars(p.ratings || 0)}</span>
          <span class="rating-val">${(p.ratings || 0).toFixed(1)}</span>
          <span class="rating-count">(${p.numReviews || 0})</span>
        </div>
        <div class="product-pricing">
          <span class="price-current">${formatPrice(p.discountPrice || p.price)}</span>
          ${p.discountPrice ? `<span class="price-original">${formatPrice(p.price)}</span>` : ''}
        </div>
        <div class="product-card-footer">
          <button class="btn-primary add-to-cart-btn" data-id="${p._id}" ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
          </button>
        </div>
      </div>
    </div>`;
  };

  /* ---- NAV ACTIVE ---- */
  const setNavActive = (page) => {
    document.querySelectorAll('.nav-link').forEach((l) => {
      l.classList.toggle('active', l.dataset.page === page);
    });
  };

  return { toast, hideLoader, showLoader, showModal, hideModal, hideAllModals, stars, formatPrice, skeletonCard, skeletonGrid, productCard, setNavActive };
})();
