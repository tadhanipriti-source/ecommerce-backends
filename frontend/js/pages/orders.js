
/* ============================================
   ORDERS PAGE — User Order History
   ============================================ */

const OrdersPage = (() => {

    const render = async () => {

        UI.setNavActive('orders');

        const app = document.getElementById('app');

        if (!Auth.isLoggedIn()) {

            app.innerHTML = `
                <div class="section">
                    <div class="empty-state" style="min-height:60vh;">
                        <div class="empty-icon">🔐</div>

                        <h3 style="font-family:var(--font-main);font-size:1.5rem;font-weight:800;">
                            Sign in to view orders
                        </h3>

                        <p>
                            You need to be logged in to see your order history.
                        </p>

                        <button class="btn-primary" id="orders-login-btn">
                            Sign In
                        </button>
                    </div>
                </div>
            `;

            document
                .getElementById('orders-login-btn')
                ?.addEventListener('click', () => {
                    UI.showModal('auth-modal');
                });

            return;
        }


        app.innerHTML = `
            <div class="section">

                <div class="section-header">
                    <div>
                        <h2 class="section-title">
                            📦 My <span>Orders</span>
                        </h2>

                        <p class="section-subtitle">
                            Track your recent purchases
                        </p>
                    </div>
                </div>

                <div id="orders-list">

                    ${Array(3).fill(0).map(() => `
                        <div class="order-card" style="margin-bottom:1.5rem;">

                            <div class="skeleton skeleton-line"
                                style="height:20px;width:200px;margin-bottom:1rem;">
                            </div>

                            <div class="skeleton skeleton-line md"
                                style="height:60px;border-radius:8px;margin-bottom:0.75rem;">
                            </div>

                            <div class="skeleton skeleton-line sm"
                                style="height:14px;width:120px;">
                            </div>

                        </div>
                    `).join('')}

                </div>

            </div>

            <footer>
                <div class="footer-logo">NEXUS</div>
                <p>© 2026 NEXUS Store</p>
            </footer>
        `;


        try {

            const data = await API.orders.getMyOrders();

            // Backend returns { success, pagination, orders }
            const orders = data.orders || [];

            const list = document.getElementById('orders-list');

            if (!list) return;


            if (!orders.length) {

                list.innerHTML = `
                    <div class="empty-state" style="min-height:50vh;">

                        <div class="empty-icon">📭</div>

                        <h3 style="font-family:var(--font-main);font-size:1.3rem;font-weight:800;">
                            No orders yet
                        </h3>

                        <p>Your ordered items will appear here.</p>

                        <button class="btn-primary" id="go-shop-btn">
                            Start Shopping
                        </button>

                    </div>
                `;

                document
                    .getElementById('go-shop-btn')
                    ?.addEventListener('click', () => {
                        App.navigate('shop');
                    });

                return;
            }


            list.innerHTML = `
                <div class="orders-list">
                    ${orders.map(renderOrder).join('')}
                </div>
            `;

        } catch (err) {

            const list = document.getElementById('orders-list');

            if (list) {

                list.innerHTML = `
                    <div class="empty-state">

                        <div class="empty-icon">⚠️</div>

                        <p>
                            ${escapeHTML(err.message || 'Unable to load orders')}
                        </p>

                        <button class="btn-outline" id="retry-orders-btn">
                            Try Again
                        </button>

                    </div>
                `;

                document
                    .getElementById('retry-orders-btn')
                    ?.addEventListener('click', render);
            }
        }
    };


    const escapeHTML = (value) => {

        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    };


    const statusClass = (status) => {

        const map = {
            pending: 'pending',
            confirmed: 'confirmed',
            processing: 'processing',
            shipped: 'shipped',
            delivered: 'delivered',
            cancelled: 'cancelled',
            refunded: 'cancelled'
        };

        return map[status] || 'pending';
    };


    const renderOrder = (order) => {

        const date = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
            : 'Date unavailable';


        const orderId = String(order._id || '')
            .slice(-8)
            .toUpperCase();


        const orderItems = Array.isArray(order.orderItems)
            ? order.orderItems
            : [];


        return `
            <div class="order-card">

                <div class="order-header">

                    <div>
                        <div class="order-id">
                            #${escapeHTML(orderId)}
                        </div>

                        <div class="order-date">
                            ${escapeHTML(date)}
                        </div>
                    </div>

                    <span class="order-status status-${statusClass(order.orderStatus)}">
                        ${escapeHTML(order.orderStatus || 'pending')}
                    </span>

                </div>


                <div class="order-items-list">

                    ${orderItems.map(item => `

                        <div class="order-item-row">

                            <div class="order-item-img">

                                ${
                                    item.image
                                        ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">`
                                        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">🛍️</div>`
                                }

                            </div>

                            <span class="order-item-name">
                                ${escapeHTML(item.name)}
                            </span>

                            <span class="order-item-qty">
                                ×${Number(item.quantity || 1)}
                            </span>

                            <span class="order-item-price">
                                ${UI.formatPrice(
                                    Number(item.price || 0) *
                                    Number(item.quantity || 1)
                                )}
                            </span>

                        </div>

                    `).join('')}

                </div>


                <div class="order-footer">

                    <div>
                        <div class="order-total-label">
                            Total Amount
                        </div>

                        <div class="order-total">
                            ${UI.formatPrice(order.totalPrice || 0)}
                        </div>
                    </div>


                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem;">

                        <div style="font-size:0.8rem;color:var(--text-muted);">
                            Payment:
                            ${escapeHTML(order.paymentInfo?.method?.toUpperCase() || 'COD')}
                        </div>

                        ${
                            order.trackingNumber
                                ? `
                                    <div style="font-size:0.8rem;color:var(--cyan);">
                                        📍 Tracking:
                                        ${escapeHTML(order.trackingNumber)}
                                    </div>
                                `
                                : ''
                        }

                    </div>

                </div>

            </div>
        `;
    };


    return { render };

})();
