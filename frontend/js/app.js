
/* ============================================
   MAIN APP — Router, Product Detail, Search
   ============================================ */

// ============================================
// PRODUCT DETAIL MODAL
// ============================================

const openProductDetail = async (productId) => {

    UI.showModal('product-modal');

    const content = document.getElementById('product-modal-content');

    content.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;padding:3rem;">
            <div class="loader-ring" style="position:static;width:50px;height:50px;border:2px solid transparent;border-top-color:var(--purple);border-radius:50%;animation:spin 1s linear infinite;"></div>
        </div>`;

    try {

        const data = await API.products.getById(productId);
        const p = data.data || data.product;

        const wishlist = Auth.getWishlist();
        const isWished = wishlist.includes(p._id);

        const discountPct = p.discountPrice
            ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
            : 0;

        content.innerHTML = `
            <div class="product-detail">

                <div class="product-gallery">

                    <div class="gallery-main">
                        ${
                            p.images?.length
                            ? `<img id="gallery-main-img" src="${p.images[0].url}" alt="${p.name}" />`
                            : `<div class="no-img" style="height:300px;display:flex;align-items:center;justify-content:center;font-size:4rem;background:var(--gradient-card);">🛍️</div>`
                        }
                    </div>

                    ${
                        p.images?.length > 1
                        ? `
                        <div class="gallery-thumbs">
                            ${p.images.map((img, i) => `
                                <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-url="${img.url}">
                                    <img src="${img.url}" alt="" />
                                </div>
                            `).join('')}
                        </div>`
                        : ''
                    }

                </div>

                <div class="product-detail-info">

                    ${p.brand ? `<div class="product-detail-brand">${p.brand}</div>` : ''}

                    <h2 class="product-detail-name">${p.name}</h2>

                    <div class="product-rating">
                        <span class="stars" style="font-size:1rem;">
                            ${UI.stars(p.ratings || 0)}
                        </span>

                        <span class="rating-val">
                            ${(p.ratings || 0).toFixed(1)}
                        </span>

                        <span class="rating-count">
                            (${p.numReviews || 0} reviews)
                        </span>
                    </div>

                    <div class="product-detail-price">
                        <span class="detail-price-current">
                            ${UI.formatPrice(p.discountPrice || p.price)}
                        </span>

                        ${p.discountPrice
                            ? `<span class="detail-price-original">${UI.formatPrice(p.price)}</span>`
                            : ''
                        }

                        ${discountPct > 0
                            ? `<span class="detail-discount-badge">−${discountPct}%</span>`
                            : ''
                        }
                    </div>

                    <span class="stock-badge ${p.stock > 0 ? 'in-stock' : 'out'}">
                        ${p.stock > 0 ? `✔ In Stock (${p.stock} left)` : '✖ Out of Stock'}
                    </span>

                    <p class="product-detail-desc">
                        ${p.shortDescription || p.description?.slice(0, 250) || ''}
                    </p>

                    ${
                        p.specifications?.length
                        ? `
                        <div class="product-specs">
                            ${p.specifications.slice(0, 5).map((s) => `
                                <div class="spec-row">
                                    <span class="spec-key">${s.key}</span>
                                    <span class="spec-val">${s.value}</span>
                                </div>
                            `).join('')}
                        </div>`
                        : ''
                    }

                    ${
                        p.tags?.length
                        ? `
                        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                            ${p.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
                        </div>`
                        : ''
                    }

                    <div class="qty-control">
                        <button class="qty-btn" id="qty-dec">−</button>
                        <span class="qty-num" id="qty-num">1</span>
                        <button class="qty-btn" id="qty-inc">+</button>
                    </div>

                    <div class="product-detail-actions">

                        <button class="btn-primary" id="detail-add-cart" style="flex:1;" ${p.stock === 0 ? 'disabled' : ''}>
                            ${p.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                        </button>

                        <button class="btn-icon ${isWished ? 'active' : ''}" id="detail-wishlist" title="Wishlist">
                            <svg viewBox="0 0 24 24" fill="${isWished ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </button>

                    </div>
                </div>
            </div>

            <div class="reviews-section" style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border);">

                <h3 style="font-family:var(--font-main);font-size:1.2rem;font-weight:700;margin-bottom:1rem;">
                    Customer Reviews ${p.reviews?.length ? `(${p.reviews.length})` : ''}
                </h3>

                ${
                    p.reviews?.length
                    ? p.reviews.slice(0, 3).map((r) => `
                        <div class="review-card">
                            <div class="review-header">
                                <div class="review-avatar">${(r.name || 'U')[0].toUpperCase()}</div>

                                <div class="review-meta">
                                    <div class="review-name">${r.name}</div>
                                    <div class="stars" style="font-size:0.8rem;">
                                        ${UI.stars(r.rating)}
                                    </div>
                                </div>

                                ${r.isVerifiedPurchase ? `<span class="review-verified">✔ Verified</span>` : ''}
                            </div>

                            ${r.title ? `<div class="review-title">${r.title}</div>` : ''}

                            <div class="review-comment">${r.comment}</div>
                        </div>
                    `).join('')
                    : `<div class="empty-state" style="padding:2rem;"><div class="empty-icon">💬</div><p>No reviews yet. Be the first!</p></div>`
                }

            </div>
        `;

        // Gallery thumbnails
        document.querySelectorAll('.gallery-thumb').forEach((thumb) => {

            thumb.addEventListener('click', () => {

                document.querySelectorAll('.gallery-thumb').forEach((t) => {
                    t.classList.remove('active');
                });

                thumb.classList.add('active');

                document.getElementById('gallery-main-img').src = thumb.dataset.url;
            });

        });

        // Quantity control
        let qty = 1;

        document.getElementById('qty-dec').addEventListener('click', () => {

            if (qty > 1) {
                qty--;
                document.getElementById('qty-num').textContent = qty;
            }

        });

        document.getElementById('qty-inc').addEventListener('click', () => {

            if (qty < p.stock) {
                qty++;
                document.getElementById('qty-num').textContent = qty;
            }

        });

        // Add to cart
        document.getElementById('detail-add-cart')?.addEventListener('click', () => {

            Cart.add(p, qty);
            UI.hideAllModals();

        });

        // Wishlist
        document.getElementById('detail-wishlist')?.addEventListener('click', async () => {

            const isNowWished = await Auth.toggleWishlist(p._id);

            const btn = document.getElementById('detail-wishlist');

            if (btn) {
                btn.classList.toggle('active', isNowWished);

                UI.toast(
                    isNowWished ? 'Added to wishlist ❤️' : 'Removed from wishlist',
                    'info'
                );
            }

        });

    } catch (err) {

        content.innerHTML = `
            <div class="empty-state" style="padding:3rem;">
                <div class="empty-icon">⚠️</div>
                <p>${err.message}</p>
            </div>`;

    }
};


// ============================================
// GLOBAL PRODUCT CARD EVENTS
// ============================================

const bindProductCardEvents = (container) => {

    // Product card click
    container.querySelectorAll('.product-card').forEach((card) => {

        card.addEventListener('click', (e) => {

            if (
                e.target.closest('.add-to-cart-btn') ||
                e.target.closest('.wishlist-toggle') ||
                e.target.closest('.quick-view-btn')
            ) return;

            openProductDetail(card.dataset.id);

        });

    });

    // Add to cart
    container.querySelectorAll('.add-to-cart-btn').forEach((btn) => {

        btn.addEventListener('click', async (e) => {

            e.stopPropagation();

            btn.textContent = '⏳ Adding…';

            try {

                const data = await API.products.getById(btn.dataset.id);
                const p = data.data || data.product;

                await Cart.add(p, 1);

            } catch (err) {

                UI.toast(err.message, 'error');

            } finally {

                btn.textContent = '🛒 Add to Cart';

            }

        });

    });

    // Wishlist
    container.querySelectorAll('.wishlist-toggle').forEach((btn) => {

        btn.addEventListener('click', async (e) => {

            e.stopPropagation();

            const isNowWished = await Auth.toggleWishlist(btn.dataset.id);

            if (isNowWished !== false) {

                btn.classList.toggle('active', isNowWished);

                btn.querySelector('svg')?.setAttribute(
                    'fill',
                    isNowWished ? 'currentColor' : 'none'
                );

                UI.toast(
                    isNowWished ? 'Added to wishlist ❤️' : 'Removed from wishlist',
                    'info'
                );

            }

        });

    });

    // Quick view
    container.querySelectorAll('.quick-view-btn').forEach((btn) => {

        btn.addEventListener('click', (e) => {

            e.stopPropagation();
            openProductDetail(btn.dataset.id);

        });

    });

};


// ============================================
// SEARCH
// ============================================

const initSearch = () => {

    const toggleBtn = document.getElementById('search-toggle-btn');
    const searchBar = document.getElementById('search-bar');
    const closeBtn = document.getElementById('search-close-btn');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');

    let timer = null;

    if (!toggleBtn || !searchBar || !closeBtn || !input || !results) return;

    toggleBtn.addEventListener('click', () => {

        searchBar.classList.toggle('open');

        if (searchBar.classList.contains('open')) {
            input.focus();
        }

    });

    closeBtn.addEventListener('click', () => {

        searchBar.classList.remove('open');
        results.innerHTML = '';
        input.value = '';

    });

    input.addEventListener('input', () => {

        clearTimeout(timer);

        const q = input.value.trim();

        if (!q) {
            results.innerHTML = '';
            return;
        }

        timer = setTimeout(async () => {

            try {

                const data = await API.products.getAll(
                    `search=${encodeURIComponent(q)}&limit=6`
                );

                const products = data.data || [];

                if (!products.length) {

                    results.innerHTML = `
                        <div style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem;">
                            No results for "${q}"
                        </div>`;

                    return;
                }

                results.innerHTML = products.map((p) => `

                    <div class="search-result-item" data-id="${p._id}">

                        ${
                            p.images?.[0]
                            ? `<img src="${p.images[0].url}" alt="${p.name}" />`
                            : `<div style="width:40px;height:40px;background:var(--gradient-card);border-radius:6px;display:flex;align-items:center;justify-content:center;">🛍️</div>`
                        }

                        <div>
                            <span style="display:block;font-weight:600;font-size:0.85rem;color:var(--text-primary);">
                                ${p.name}
                            </span>

                            <span>
                                ${UI.formatPrice(p.discountPrice || p.price)}
                            </span>
                        </div>

                    </div>

                `).join('');

                results.querySelectorAll('.search-result-item').forEach((el) => {

                    el.addEventListener('click', () => {

                        searchBar.classList.remove('open');
                        results.innerHTML = '';
                        input.value = '';

                        openProductDetail(el.dataset.id);

                    });

                });

            } catch (err) {

                console.error('Search Error:', err);

            }

        }, 350);

    });

};


// ============================================
// NAVBAR SCROLL
// ============================================

const initNavbarScroll = () => {

    window.addEventListener('scroll', () => {

        document.getElementById('navbar')?.classList.toggle(
            'scrolled',
            window.scrollY > 20
        );

    }, { passive: true });

};


// ============================================
// MOBILE MENU
// ============================================

const initMobileMenu = () => {

    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('sidebar-close');

    if (!menuBtn || !sidebar || !overlay || !closeBtn) return;

    menuBtn.addEventListener('click', () => {

        sidebar.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';

    });

    const close = () => {

        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';

    };

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);

    document.querySelectorAll('.sidebar-link[data-page]').forEach((l) => {

        l.addEventListener('click', (e) => {

            e.preventDefault();
            close();
            App.navigate(l.dataset.page);

        });

    });

};


// ============================================
// NAV LINK ROUTING
// ============================================

const initNavLinks = () => {

    document.querySelectorAll('.nav-link[data-page]').forEach((l) => {

        l.addEventListener('click', (e) => {

            e.preventDefault();
            App.navigate(l.dataset.page);

        });

    });

    document.getElementById('nav-home-btn')?.addEventListener('click', (e) => {

        e.preventDefault();
        App.navigate('home');

    });

    document.getElementById('orders-link')?.addEventListener('click', (e) => {

        e.preventDefault();
        document.getElementById('user-dropdown')?.classList.remove('show');
        App.navigate('orders');

    });

    document.getElementById('wishlist-link')?.addEventListener('click', (e) => {

        e.preventDefault();
        document.getElementById('user-dropdown')?.classList.remove('show');
        UI.toast('Wishlist page — coming soon!', 'info');

    });

    document.getElementById('profile-link')?.addEventListener('click', (e) => {

        e.preventDefault();
        document.getElementById('user-dropdown')?.classList.remove('show');
        UI.toast('Profile page — coming soon!', 'info');

    });

};


// ============================================
// MODAL OVERLAY CLOSE
// ============================================

const initModalOverlay = () => {

    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {

        if (e.target === document.getElementById('modal-overlay')) {
            UI.hideAllModals();
        }

    });

    document.getElementById('product-modal-close')?.addEventListener('click', () => {
        UI.hideAllModals();
    });

};


// ============================================
// MAIN APP ROUTER
// ============================================

const App = {

    currentPage: 'home',

    navigate(page, opts = {}) {

        this.currentPage = page;

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        switch (page) {

            case 'home':
                HomePage.render();
                break;

            case 'shop':
                ShopPage.render(opts);
                break;

            case 'featured':
                ShopPage.render({
                    sort: '-isFeatured',
                    ...opts
                });
                break;

            case 'orders':
                OrdersPage.render();
                break;

            default:
                HomePage.render();

        }

    },

    closeMobileSidebar() {

        document.getElementById('mobile-sidebar')?.classList.remove('open');
        document.getElementById('overlay')?.classList.remove('show');
        document.body.style.overflow = '';

    }

};


// ============================================
// INITIALIZE APP
// ============================================

document.addEventListener('DOMContentLoaded', async () => {

    // Initialize UI events
    Auth.initAuthForms();
    Cart.initCartEvents();
    Cart.initCheckoutForm();

    initSearch();
    initNavbarScroll();
    initMobileMenu();
    initNavLinks();
    initModalOverlay();

    // Wishlist button
    document.getElementById('wishlist-btn')?.addEventListener('click', () => {

        if (!Auth.isLoggedIn()) {
            UI.showModal('auth-modal');
            return;
        }

        UI.toast('Wishlist page — coming soon!', 'info');

    });

    // Fetch current user
    await Auth.fetchMe();

    // Sync cart if logged in
    if (Auth.isLoggedIn()) {
        Cart.syncFromBackend();
    }

    // Render home page
    await HomePage.render();

    // Hide loader
    setTimeout(() => {
        UI.hideLoader();
    }, 600);

});
