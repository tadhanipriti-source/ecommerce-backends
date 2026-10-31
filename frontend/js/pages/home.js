
/* ============================================
   HOME PAGE — Hero, Featured, Categories
   ============================================ */

const HomePage = (() => {

    const getArray = (response, keys = []) => {

        if (Array.isArray(response)) return response;

        for (const key of keys) {

            if (Array.isArray(response?.[key])) {
                return response[key];
            }
        }

        if (Array.isArray(response?.data)) {
            return response.data;
        }

        return [];
    };


    const render = async () => {

        UI.setNavActive(null);

        const app = document.getElementById('app');

        app.innerHTML = `

            <!-- HERO -->

            <section class="hero">

                <div class="hero-bg"></div>

                <div class="hero-orb orb1"></div>
                <div class="hero-orb orb2"></div>
                <div class="hero-orb orb3"></div>

                <div class="hero-content">

                    <div class="hero-badge">
                        <span class="dot"></span>
                        ✨ New Collection 2026
                    </div>

                    <h1>
                        Shop the
                        <span class="gradient-text">Future</span>
                        <br/>of Commerce
                    </h1>

                    <p>
                        Discover premium products curated for the modern lifestyle.
                        <br/>
                        Fast delivery. Easy returns. Exceptional quality.
                    </p>

                    <div class="hero-actions">

                        <button class="btn-primary" id="hero-shop-btn">
                            Explore Products →
                        </button>

                        <button class="btn-ghost" id="hero-featured-btn">
                            View Featured
                        </button>

                    </div>


                    <div class="hero-stats">

                        <div class="stat-item">
                            <div class="stat-num" id="stat-products">1000+</div>
                            <div class="stat-label">Products</div>
                        </div>

                        <div class="stat-divider"></div>

                        <div class="stat-item">
                            <div class="stat-num">50K+</div>
                            <div class="stat-label">Happy Customers</div>
                        </div>

                        <div class="stat-divider"></div>

                        <div class="stat-item">
                            <div class="stat-num">4.9★</div>
                            <div class="stat-label">Average Rating</div>
                        </div>

                        <div class="stat-divider"></div>

                        <div class="stat-item">
                            <div class="stat-num">Free</div>
                            <div class="stat-label">Shipping over ₹500</div>
                        </div>

                    </div>

                </div>

            </section>


            <!-- CATEGORIES -->

            <div class="category-scroll" id="home-cats">

                <div class="cat-chip active" data-cat="">
                    <span class="cat-icon">🌟</span>
                    All Products
                </div>

            </div>


            <!-- FEATURED PRODUCTS -->

            <section class="section">

                <div class="section-header">

                    <div>
                        <h2 class="section-title">
                            ⚡ <span>Featured</span> Picks
                        </h2>

                        <p class="section-subtitle">
                            Hand-curated products our editors love
                        </p>
                    </div>

                    <button class="btn-outline" id="see-all-featured">
                        View All →
                    </button>

                </div>

                <div id="featured-container">
                    ${UI.skeletonGrid(4)}
                </div>

            </section>


            <!-- NEW ARRIVALS -->

            <section class="section" style="padding-top:0;">

                <div class="section-header">

                    <div>
                        <h2 class="section-title">
                            🆕 New <span>Arrivals</span>
                        </h2>

                        <p class="section-subtitle">
                            Just landed — fresh picks for you
                        </p>
                    </div>

                    <button class="btn-outline" id="see-all-new">
                        Browse All →
                    </button>

                </div>

                <div id="new-arrivals-container">
                    ${UI.skeletonGrid(8)}
                </div>

            </section>


            <!-- FOOTER -->

            <footer>

                <div class="footer-logo">NEXUS</div>

                <p>
                    © 2026 NEXUS Store. Built with ❤️ for premium shopping.
                </p>

                <p style="margin-top:0.5rem;color:#334155">
                    Fast • Secure • Reliable
                </p>

            </footer>

        `;


        // Events

        document.getElementById('hero-shop-btn')
            ?.addEventListener('click', () => App.navigate('shop'));

        document.getElementById('hero-featured-btn')
            ?.addEventListener('click', () => App.navigate('featured'));

        document.getElementById('see-all-featured')
            ?.addEventListener('click', () => App.navigate('featured'));

        document.getElementById('see-all-new')
            ?.addEventListener('click', () => App.navigate('shop'));


        // Load data

        await Promise.all([
            loadCategories(),
            loadFeatured(),
            loadNewArrivals()
        ]);
    };


    /* ============================================
       LOAD CATEGORIES
       ============================================ */

    const loadCategories = async () => {

        const container = document.getElementById('home-cats');

        if (!container) return;

        try {

            const response = await API.categories.getAll();

            const categories = getArray(
                response,
                ['categories']
            );

            const icons = [
                '👗', '💻', '📱', '👟', '🏠',
                '📚', '⌚', '🎮', '💄', '🍕'
            ];


            container.innerHTML = `

                <div class="cat-chip active" data-cat="">
                    <span class="cat-icon">🌟</span>
                    All
                </div>

                ${categories.map((category, index) => `

                    <div
                        class="cat-chip"
                        data-cat="${category._id}"
                        style="animation:fadeInUp 0.3s ease forwards;opacity:0;animation-delay:${(index + 1) * 0.05}s;"
                    >

                        <span class="cat-icon">
                            ${icons[index % icons.length]}
                        </span>

                        ${category.name}

                    </div>

                `).join('')}

            `;


            container.querySelectorAll('.cat-chip')
                .forEach(chip => {

                    chip.addEventListener('click', () => {

                        container.querySelectorAll('.cat-chip')
                            .forEach(c => c.classList.remove('active'));

                        chip.classList.add('active');

                        App.navigate('shop', {
                            category: chip.dataset.cat
                        });
                    });
                });

        } catch (error) {

            console.error(
                'Category loading error:',
                error.message
            );
        }
    };


    /* ============================================
       LOAD FEATURED PRODUCTS
       ============================================ */

    const loadFeatured = async () => {

        const container =
            document.getElementById('featured-container');

        if (!container) return;

        try {

            const response = await API.products.getFeatured();

            const products = getArray(
                response,
                ['products']
            ).slice(0, 4);

            const wishlist = Auth.getWishlist();

            if (!products.length) {

                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🌟</div>
                        <p>No featured products yet</p>
                    </div>
                `;

                return;
            }


            container.innerHTML = `
                <div class="product-grid">
                    ${products.map(product =>
                        UI.productCard(product, wishlist)
                    ).join('')}
                </div>
            `;

            bindProductCardEvents(container);

        } catch (error) {

            console.error(
                'Featured products error:',
                error.message
            );

            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <p>Could not load featured products</p>
                </div>
            `;
        }
    };


    /* ============================================
       LOAD NEW ARRIVALS
       ============================================ */

    const loadNewArrivals = async () => {

        const container =
            document.getElementById('new-arrivals-container');

        if (!container) return;

        try {

            // Backend does not have a separate new-arrivals route.
            // Use products listing with newest sorting.

            const response = await API.products.getAll(
                'sort=-createdAt&limit=8'
            );

            const products = getArray(
                response,
                ['products']
            );

            const wishlist = Auth.getWishlist();

            if (!products.length) {

                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📦</div>
                        <p>No products found</p>
                    </div>
                `;

                return;
            }


            container.innerHTML = `
                <div class="product-grid">
                    ${products.slice(0, 8).map(product =>
                        UI.productCard(product, wishlist)
                    ).join('')}
                </div>
            `;

            bindProductCardEvents(container);

        } catch (error) {

            console.error(
                'New arrivals error:',
                error.message
            );

            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <p>Could not load products</p>
                </div>
            `;
        }
    };


    return { render };

})();
