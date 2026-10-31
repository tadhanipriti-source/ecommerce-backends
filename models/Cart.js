
/* ============================================
   NEXUS STORE - CART MODULE
   ============================================ */

const Cart = (() => {

    // Load cart from localStorage
    let items = [];

    try {
        items = JSON.parse(
            localStorage.getItem('nexus_cart') || '[]'
        );

        if (!Array.isArray(items)) {
            items = [];
        }

    } catch (error) {
        items = [];
    }


    /* ============================================
       SAVE CART
       ============================================ */

    const save = () => {
        localStorage.setItem(
            'nexus_cart',
            JSON.stringify(items)
        );
    };


    /* ============================================
       UPDATE CART BADGE
       ============================================ */

    const updateBadge = () => {

        const total = items.reduce(
            (sum, item) => {
                return sum + Number(item.quantity || 0);
            },
            0
        );

        const badge = document.getElementById('cart-count');

        if (badge) {
            badge.textContent = total;
            badge.style.display = total > 0 ? 'flex' : 'none';
        }
    };


    /* ============================================
       GET CART ITEMS
       ============================================ */

    const getItems = () => items;


    /* ============================================
       GET CART TOTAL
       ============================================ */

    const getTotal = () => {

        return items.reduce(
            (sum, item) => {
                return sum +
                    Number(item.price || 0) *
                    Number(item.quantity || 0);
            },
            0
        );
    };


    /* ============================================
       FORMAT BACKEND CART ITEM
       ============================================ */

    const formatBackendItem = (item) => {

        const product =
            item.product && typeof item.product === 'object'
                ? item.product
                : {};

        return {

            // MongoDB cart subdocument ID
            cartItemId: item._id || null,

            // Product ID
            product: product._id || item.product,

            name:
                product.name ||
                item.name ||
                'Product',

            image:
                product.images?.[0]?.url ||
                item.image ||
                '',

            price: Number(
                item.price ??
                product.discountPrice ??
                product.price ??
                0
            ),

            quantity: Number(item.quantity || 1)
        };
    };


    /* ============================================
       ADD TO CART
       ============================================ */

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


        // Logged-in user: save directly to backend
        if (Auth.isLoggedIn()) {

            try {

                await API.cart.add(
                    product._id,
                    quantity
                );

                await syncFromBackend();

                UI.toast(
                    `${product.name} added to cart`,
                    'success'
                );

            } catch (error) {

                UI.toast(
                    error.message || 'Unable to add product',
                    'error'
                );
            }

            return;
        }


        // Guest user: save to localStorage
        const existing = items.find(
            item => String(item.product) === String(product._id)
        );

        if (existing) {

            existing.quantity += quantity;

        } else {

            items.push({

                cartItemId: null,

                product: product._id,

                name: product.name,

                image: product.images?.[0]?.url || '',

                price: Number(
                    product.discountPrice || product.price || 0
                ),

                quantity
            });
        }

        save();
        updateBadge();
        renderDrawer();

        UI.toast(
            `${product.name} added to cart`,
            'success'
        );
    };


    /* ============================================
       REMOVE FROM CART
       ============================================ */

    const remove = async (productId) => {

        const item = items.find(
            i => String(i.product) === String(productId)
        );

        if (!item) return;


        if (Auth.isLoggedIn()) {

            try {

                // Ensure backend cart item ID exists
                if (!item.cartItemId) {
                    await syncFromBackend();
                }

                const updatedItem = items.find(
                    i => String(i.product) === String(productId)
                );

                if (!updatedItem?.cartItemId) {
                    UI.toast('Cart item not found', 'error');
                    return;
                }

                // Backend expects cart subdocument _id
                await API.cart.remove(
                    updatedItem.cartItemId
                );

                await syncFromBackend();

            } catch (error) {

                UI.toast(
                    error.message || 'Unable to remove item',
                    'error'
                );
            }

            return;
        }


        // Guest cart
        items = items.filter(
            i => String(i.product) !== String(productId)
        );

        save();
        updateBadge();
        renderDrawer();
    };


    /* ============================================
       UPDATE QUANTITY
       ============================================ */

    const updateQty = async (productId, quantity) => {

        const item = items.find(
            i => String(i.product) === String(productId)
        );

        if (!item) return;

        quantity = Number(quantity);

        if (!Number.isInteger(quantity)) {
            UI.toast('Invalid quantity', 'error');
            return;
        }

        if (quantity < 1) {
            await remove(productId);
            return;
        }


        if (Auth.isLoggedIn()) {

            try {

                // Ensure cart item ID exists
                if (!item.cartItemId) {
                    await syncFromBackend();
                }

                const updatedItem = items.find(
                    i => String(i.product) === String(productId)
                );

                if (!updatedItem?.cartItemId) {
                    UI.toast('Cart item not found', 'error');
                    return;
                }

                // Backend expects cart subdocument _id
                await API.cart.update(
                    updatedItem.cartItemId,
                    quantity
                );

                await syncFromBackend();

            } catch (error) {

                UI.toast(
                    error.message || 'Unable to update quantity',
                    'error'
                );
            }

            return;
        }


        // Guest cart
        item.quantity = quantity;

        save();
        updateBadge();
        renderDrawer();
    };


    /* ============================================
       CLEAR CART
       ============================================ */

    const clear = () => {

        items = [];

        save();
        updateBadge();
        renderDrawer();
    };


    /* ============================================
       SYNC LOCAL CART WITH BACKEND
       ============================================ */

    const syncFromBackend = async () => {

        if (!Auth.isLoggedIn()) return;

        try {

            // Keep a copy of guest cart
            const localItems = [...items];

            // Get backend cart
            let response = await API.cart.get();

            let backendItems = response.cart?.items || [];


            // If backend is empty, transfer local cart
            if (
                backendItems.length === 0 &&
                localItems.length > 0
            ) {

                for (const item of localItems) {

                    if (!item.product) continue;

                    await API.cart.add(
                        item.product,
                        item.quantity
                    );
                }

                // Get updated backend cart
                response = await API.cart.get();

                backendItems = response.cart?.items || [];
            }


            // Backend cart becomes the current cart
            items = backendItems.map(
                formatBackendItem
            );

            save();
            updateBadge();
            renderDrawer();

        } catch (error) {

            console.error(
                'Cart sync error:',
                error.message
            );
        }
    };


    /* ============================================
       OPEN CART DRAWER
       ============================================ */

    const openDrawer = () => {

        renderDrawer();

        document
            .getElementById('cart-drawer')
            ?.classList.add('open');

        document
            .getElementById('overlay')
            ?.classList.add('show');

        document.body.style.overflow = 'hidden';
    };


    /* ============================================
       CLOSE CART DRAWER
       ============================================ */

    const closeDrawer = () => {

        document
            .getElementById('cart-drawer')
            ?.classList.remove('open');

        document
            .getElementById('overlay')
            ?.classList.remove('show');

        document.body.style.overflow = '';
    };


    /* ============================================
       RENDER CART DRAWER
       ============================================ */

    const renderDrawer = () => {

        const container =
            document.getElementById('cart-items');

        const footer =
            document.getElementById('cart-footer');

        const subtotalEl =
            document.getElementById('cart-subtotal');

        const totalEl =
            document.getElementById('cart-total');

        if (!container) return;


        // Empty cart
        if (items.length === 0) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">🛒</div>

                    <p>Your cart is empty</p>

                    <button
                        class="btn-primary"
                        id="cart-shop-btn">

                        Start Shopping

                    </button>

                </div>
            `;

            if (footer) {
                footer.style.display = 'none';
            }

            document
                .getElementById('cart-shop-btn')
                ?.addEventListener('click', () => {

                    closeDrawer();
                    App.navigate('shop');
                });

        } else {

            if (footer) {
                footer.style.display = 'block';
            }


            // Cart products
            container.innerHTML = items.map(item => `

                <div
                    class="cart-item"
                    data-id="${item.product}">

                    <div class="cart-item-img">

                        ${
                            item.image
                                ? `<img src="${item.image}" alt="${item.name}">`
                                : `<div>🛍️</div>`
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

                            <button
                                class="cart-qty-btn"
                                data-action="dec"
                                data-id="${item.product}">

                                −

                            </button>

                            <span class="cart-qty-num">
                                ${item.quantity}
                            </span>

                            <button
                                class="cart-qty-btn"
                                data-action="inc"
                                data-id="${item.product}">

                                +

                            </button>

                            <button
                                class="cart-item-remove"
                                data-id="${item.product}">

                                Remove

                            </button>

                        </div>

                    </div>

                </div>

            `).join('');


            // Increase / decrease quantity
            container
                .querySelectorAll('.cart-qty-btn')
                .forEach(btn => {

                    btn.addEventListener('click', () => {

                        const id = btn.dataset.id;

                        const item = items.find(
                            i => String(i.product) === String(id)
                        );

                        if (!item) return;

                        const newQty =
                            btn.dataset.action === 'inc'
                                ? item.quantity + 1
                                : item.quantity - 1;

                        updateQty(id, newQty);
                    });
                });


            // Remove item
            container
                .querySelectorAll('.cart-item-remove')
                .forEach(btn => {

                    btn.addEventListener('click', () => {
                        remove(btn.dataset.id);
                    });
                });


            // Calculate totals
            const subtotal = getTotal();

            // Backend shipping rule
            const shipping = subtotal >= 500 ? 0 : 50;


            if (subtotalEl) {
                subtotalEl.textContent =
                    UI.formatPrice(subtotal);
            }

            if (totalEl) {
                totalEl.textContent =
                    UI.formatPrice(subtotal + shipping);
            }


            const shippingEl =
                document.getElementById('cart-shipping');

            if (shippingEl) {

                shippingEl.textContent =
                    shipping === 0
                        ? 'Free'
                        : UI.formatPrice(shipping);
            }
        }

        updateBadge();
    };


    /* ============================================
       INITIALIZE CART EVENTS
       ============================================ */

    const initCartEvents = () => {

        document
            .getElementById('cart-btn')
            ?.addEventListener('click', openDrawer);

        document
            .getElementById('cart-close-btn')
            ?.addEventListener('click', closeDrawer);

        document
            .getElementById('overlay')
            ?.addEventListener('click', closeDrawer);


        document
            .getElementById('checkout-btn')
            ?.addEventListener('click', () => {

                if (!Auth.isLoggedIn()) {

                    UI.toast(
                        'Please sign in to checkout',
                        'info'
                    );

                    UI.showModal('auth-modal');
                    return;
                }

                if (items.length === 0) {

                    UI.toast(
                        'Your cart is empty',
                        'warning'
                    );

                    return;
                }

                closeDrawer();
                openCheckout();
            });
    };


    /* ============================================
       OPEN CHECKOUT
       ============================================ */

    const openCheckout = () => {

        const itemsEl =
            document.getElementById('checkout-items');

        if (!itemsEl) return;


        itemsEl.innerHTML = items.map(item => `

            <div class="co-item">

                <span>
                    ${item.name} × ${item.quantity}
                </span>

                <span>
                    ${UI.formatPrice(
                        item.price * item.quantity
                    )}
                </span>

            </div>

        `).join('');


        const subtotal = getTotal();

        const tax =
            Math.round(subtotal * 0.18 * 100) / 100;

        const shipping =
            subtotal >= 500 ? 0 : 50;


        document.getElementById('co-items-price').textContent =
            UI.formatPrice(subtotal);

        document.getElementById('co-tax').textContent =
            UI.formatPrice(tax);

        document.getElementById('co-shipping').textContent =
            shipping === 0
                ? 'Free'
                : UI.formatPrice(shipping);

        document.getElementById('co-total').textContent =
            UI.formatPrice(subtotal + tax + shipping);


        // Prefill user address
        const user = Auth.getUser();

        if (user?.addresses?.length) {

            const address = user.addresses[0];

            const street =
                document.getElementById('ship-street');

            const city =
                document.getElementById('ship-city');

            const state =
                document.getElementById('ship-state');

            const zip =
                document.getElementById('ship-zip');

            const phone =
                document.getElementById('ship-phone');


            if (street) {
                street.value = address.street || '';
            }

            if (city) {
                city.value = address.city || '';
            }

            if (state) {
                state.value = address.state || '';
            }

            if (zip) {
                zip.value = address.zipCode || '';
            }

            if (phone) {
                phone.value = address.phone || '';
            }
        }

        UI.showModal('checkout-modal');
    };


    /* ============================================
       INITIALIZE CHECKOUT FORM
       ============================================ */

    const initCheckoutForm = () => {

        document
            .getElementById('checkout-modal-close')
            ?.addEventListener('click', () => {

                UI.hideAllModals();
            });


        document
            .getElementById('checkout-form')
            ?.addEventListener('submit', async (e) => {

                e.preventDefault();


                if (!Auth.isLoggedIn()) {

                    UI.toast(
                        'Please login first',
                        'error'
                    );

                    return;
                }


                if (items.length === 0) {

                    UI.toast(
                        'Your cart is empty',
                        'error'
                    );

                    return;
                }


                const btn =
                    document.getElementById('place-order-btn');

                if (btn) {
                    btn.disabled = true;
                    btn.textContent = 'Placing Order...';
                }


                try {

                    // Selected payment method
                    const payment =
                        document.querySelector(
                            'input[name="payment"]:checked'
                        )?.value || 'cod';


                    // Order data
                    const orderData = {

                        orderItems: items.map(item => ({

                            product: item.product,

                            quantity: item.quantity

                        })),

                        shippingAddress: {

                            street:
                                document.getElementById('ship-street')
                                    .value.trim(),

                            city:
                                document.getElementById('ship-city')
                                    .value.trim(),

                            state:
                                document.getElementById('ship-state')
                                    .value.trim(),

                            country: 'India',

                            zipCode:
                                document.getElementById('ship-zip')
                                    .value.trim(),

                            phone:
                                document.getElementById('ship-phone')
                                    .value.trim()
                        },

                        paymentInfo: {

                            method: payment,

                            // No payment gateway connected yet
                            status: 'pending'
                        }
                    };


                    // Create order
                    const response =
                        await API.orders.create(orderData);


                    if (!response.success) {

                        throw new Error(
                            response.message ||
                            'Order could not be placed'
                        );
                    }


                    // Backend clears database cart
                    // Clear local cart
                    clear();


                    // Close checkout modal
                    UI.hideAllModals();


                    UI.toast(
                        'Order placed successfully!',
                        'success'
                    );


                    // Navigate to orders page
                    setTimeout(() => {

                        App.navigate('orders');

                    }, 1000);


                } catch (error) {

                    UI.toast(
                        error.message ||
                        'Unable to place order',
                        'error'
                    );

                } finally {

                    if (btn) {

                        btn.disabled = false;

                        btn.textContent = 'Place Order';
                    }
                }
            });
    };


    /* ============================================
       INITIALIZE
       ============================================ */

    updateBadge();


    /* ============================================
       PUBLIC METHODS
       ============================================ */

    return {

        getItems,
        getTotal,

        add,
        remove,
        updateQty,

        clear,

        syncFromBackend,

        openDrawer,
        closeDrawer,
        openCheckout,

        initCartEvents,
        initCheckoutForm

    };

})();
