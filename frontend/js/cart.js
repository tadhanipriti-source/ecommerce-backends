
/* ============================================
   CART MODULE — LOCAL STORAGE ONLY
   Login / Register Not Required
   ============================================ */

const Cart = (() => {

    let items = JSON.parse(localStorage.getItem('nexus_cart') || '[]');

    // Save cart
    const save = () => {
        localStorage.setItem('nexus_cart', JSON.stringify(items));
    };

    // Update cart badge
    const updateBadge = () => {
        const total = items.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
        );

        const badge = document.getElementById('cart-count');

        if (badge) {
            badge.textContent = total;
            badge.style.display = total ? 'flex' : 'none';
        }
    };

    // Get items
    const getItems = () => items;

    // Get subtotal
    const getTotal = () => {
        return items.reduce(
            (sum, item) =>
                sum + Number(item.price || 0) * Number(item.quantity || 0),
            0
        );
    };

    // Add to cart
    const add = async (product, quantity = 1) => {

        if (!product || !product._id) {
            UI.toast('Invalid product', 'error');
            return;
        }

        quantity = Number(quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
            UI.toast('Invalid quantity', 'error');
            return;
        }

        const existing = items.find(
            item => item.product === product._id
        );

        if (existing) {
            existing.quantity += quantity;
        } else {
            items.push({
                product: product._id,
                name: product.name,
                image: product.images?.[0]?.url || '',
                price: Number(product.discountPrice || product.price || 0),
                quantity
            });
        }

        save();
        updateBadge();
        renderDrawer();

        UI.toast(`"${product.name}" added to cart 🛒`, 'success');
    };

    // Remove item
    const remove = (productId) => {

        items = items.filter(
            item => item.product !== productId
        );

        save();
        updateBadge();
        renderDrawer();

        UI.toast('Product removed from cart', 'info');
    };

    // Update quantity
    const updateQty = (productId, qty) => {

        const item = items.find(
            i => i.product === productId
        );

        if (!item) return;

        qty = Number(qty);

        if (qty < 1) {
            remove(productId);
            return;
        }

        if (!Number.isInteger(qty)) {
            UI.toast('Invalid quantity', 'error');
            return;
        }

        item.quantity = qty;

        save();
        updateBadge();
        renderDrawer();
    };

    // Clear cart
    const clear = () => {
        items = [];

        save();
        updateBadge();
        renderDrawer();
    };

    // Open cart
    const openDrawer = () => {

        renderDrawer();

        document.getElementById('cart-drawer')?.classList.add('open');
        document.getElementById('overlay')?.classList.add('show');

        document.body.style.overflow = 'hidden';
    };

    // Close cart
    const closeDrawer = () => {

        document.getElementById('cart-drawer')?.classList.remove('open');
        document.getElementById('overlay')?.classList.remove('show');

        document.body.style.overflow = '';
    };

    // Render cart
    const renderDrawer = () => {

        const container = document.getElementById('cart-items');
        const footer = document.getElementById('cart-footer');
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');

        if (!container) return;

        if (items.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🛒</div>
                    <p>Your cart is empty</p>
                    <button class="btn-primary" id="cart-shop-btn">
                        Start Shopping
                    </button>
                </div>
            `;

            if (footer) footer.style.display = 'none';

            document.getElementById('cart-shop-btn')
                ?.addEventListener('click', () => {
                    closeDrawer();
                    App.navigate('shop');
                });

        } else {

            if (footer) footer.style.display = 'block';

            container.innerHTML = items.map(item => `
                <div class="cart-item" data-id="${item.product}">

                    <div class="cart-item-img">
                        ${
                            item.image
                            ? `<img src="${item.image}" alt="${item.name}" />`
                            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🛍️</div>`
                        }
                    </div>

                    <div class="cart-item-info">

                        <div class="cart-item-name">
                            ${item.name}
                        </div>

                        <div class="cart-item-price">
                            ${UI.formatPrice(item.price)}
                        </div>

                        <div class="cart-item-controls">

                            <button class="cart-qty-btn"
                                data-action="dec"
                                data-id="${item.product}">−</button>

                            <span class="cart-qty-num">
                                ${item.quantity}
                            </span>

                            <button class="cart-qty-btn"
                                data-action="inc"
                                data-id="${item.product}">+</button>

                            <button class="cart-item-remove"
                                data-id="${item.product}">
                                Remove
                            </button>

                        </div>
                    </div>
                </div>
            `).join('');

            // Quantity buttons
            container.querySelectorAll('.cart-qty-btn')
                .forEach(btn => {

                    btn.addEventListener('click', () => {

                        const id = btn.dataset.id;

                        const item = items.find(
                            i => i.product === id
                        );

                        if (!item) return;

                        const newQty =
                            btn.dataset.action === 'inc'
                            ? item.quantity + 1
                            : item.quantity - 1;

                        updateQty(id, newQty);
                    });
                });

            // Remove buttons
            container.querySelectorAll('.cart-item-remove')
                .forEach(btn => {

                    btn.addEventListener('click', () => {
                        remove(btn.dataset.id);
                    });
                });

            // Total calculation
            const subtotal = getTotal();
            const shipping = subtotal >= 500 ? 0 : 50;

            if (subtotalEl) {
                subtotalEl.textContent = UI.formatPrice(subtotal);
            }

            if (totalEl) {
                totalEl.textContent = UI.formatPrice(
                    subtotal + shipping
                );
            }

            const shippingEl = document.getElementById('cart-shipping');

            if (shippingEl) {
                shippingEl.textContent =
                    shipping === 0
                    ? 'Free'
                    : UI.formatPrice(shipping);
            }
        }

        updateBadge();
    };

    // Initialize cart events
    const initCartEvents = () => {

        document.getElementById('cart-btn')
            ?.addEventListener('click', openDrawer);

        document.getElementById('cart-close-btn')
            ?.addEventListener('click', closeDrawer);

        document.getElementById('overlay')
            ?.addEventListener('click', closeDrawer);

        document.getElementById('checkout-btn')
            ?.addEventListener('click', () => {

                if (items.length === 0) {
                    UI.toast('Your cart is empty', 'warning');
                    return;
                }

                closeDrawer();
                openCheckout();
            });
    };

    // Open checkout
    const openCheckout = () => {

        const itemsEl = document.getElementById('checkout-items');

        if (!itemsEl) return;

        itemsEl.innerHTML = items.map(item => `
            <div class="co-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>${UI.formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join('');

        const subtotal = getTotal();
        const tax = Math.round(subtotal * 0.18 * 100) / 100;
        const shipping = subtotal >= 500 ? 0 : 50;

        document.getElementById('co-items-price').textContent =
            UI.formatPrice(subtotal);

        document.getElementById('co-tax').textContent =
            UI.formatPrice(tax);

        document.getElementById('co-shipping').textContent =
            shipping === 0 ? 'Free' : UI.formatPrice(shipping);

        document.getElementById('co-total').textContent =
            UI.formatPrice(subtotal + tax + shipping);

        UI.showModal('checkout-modal');
    };

    // Initialize checkout form
    const initCheckoutForm = () => {

        document.getElementById('checkout-modal-close')
            ?.addEventListener('click', () => {
                UI.hideAllModals();
            });

        document.getElementById('checkout-form')
            ?.addEventListener('submit', (e) => {

                e.preventDefault();

                if (items.length === 0) {
                    UI.toast('Your cart is empty', 'error');
                    return;
                }

                const order = {
                    items: items.map(item => ({
                        product: item.product,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    shippingAddress: {
                        street: document.getElementById('ship-street').value,
                        city: document.getElementById('ship-city').value,
                        state: document.getElementById('ship-state').value,
                        zipCode: document.getElementById('ship-zip').value,
                        phone: document.getElementById('ship-phone').value
                    },
                    paymentMethod:
                        document.querySelector(
                            'input[name="payment"]:checked'
                        )?.value || 'cod',
                    total: getTotal()
                };

                // Save guest order locally.
                const orders = JSON.parse(
                    localStorage.getItem('nexus_orders') || '[]'
                );

                orders.push({
                    ...order,
                    orderDate: new Date().toISOString(),
                    status: 'Pending'
                });

                localStorage.setItem(
                    'nexus_orders',
                    JSON.stringify(orders)
                );

                clear();
                UI.hideAllModals();

                UI.toast('Order placed successfully! 🎉', 'success');
            });
    };

    // Initialize badge
    updateBadge();

    return {
        getItems,
        getTotal,
        add,
        remove,
        updateQty,
        clear,
        openDrawer,
        closeDrawer,
        openCheckout,
        initCartEvents,
        initCheckoutForm
    };

})();
