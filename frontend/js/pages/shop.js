
/* ============================================
   NEXUS STORE — SHOP PAGE
   Product listing, filters, search
   ============================================ */

const ShopPage = (() => {

    let currentPage = 1;
    let totalPages = 1;
    let categories = [];
    let filters = {};
    let searchTimer = null;

    /* ============================================
       GET ARRAY FROM API RESPONSE
       ============================================ */

    const getArray = (response, keys = []) => {

        if (Array.isArray(response)) {
            return response;
        }

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


    /* ============================================
       BUILD API QUERY
       ============================================ */

    const buildQuery = () => {

        const params = new URLSearchParams();

        params.set('page', currentPage);
        params.set('limit', 12);

        if (filters.category) {
            params.set('category', filters.category);
        }

        if (filters.sort) {
            params.set('sort', filters.sort);
        }

        if (filters.search) {
            params.set('search', filters.search);
        }

        if (filters.maxPrice) {
            params.set('price[lte]', filters.maxPrice);
        }

        if (filters.inStock) {
            params.set('stock[gt]', '0');
        }

        return params.toString();
    };


    /* ============================================
       GET WISHLIST FROM LOCAL STORAGE
       ============================================ */

    const getWishlist = () => {

        try {

            const wishlist = JSON.parse(
                localStorage.getItem('nexus-wishlist') || '[]'
            );

            return Array.isArray(wishlist) ? wishlist : [];

        } catch (error) {

            console.error('Wishlist Error:', error);

            return [];
        }
    };


    /* ============================================
       RENDER SHOP PAGE
       ============================================ */

    const render = async (initFilters = {}) => {

        UI.setNavActive('shop');

        filters = { ...initFilters };

        currentPage = 1;

        const app = document.getElementById('app');

        if (!app) return;

        app.innerHTML = `

            <div class="shop-layout">

                <!-- FILTERS SIDEBAR -->

                <aside class="filters-panel">

                    <h3 class="filter-title">
                        🎛 Filters
                    </h3>

                    <div class="filter-group">

                        <label>Category</label>

                        <select
                            class="filter-select"
                            id="filter-category"
                        >

                            <option value="">
                                All Categories
                            </option>

                        </select>

                    </div>

                    <div class="filter-group">

                        <label>Sort By</label>

                        <select
                            class="filter-select"
                            id="filter-sort"
                        >

                            <option value="-createdAt">
                                Newest First
                            </option>

                            <option value="price">
                                Price: Low to High
                            </option>

                            <option value="-price">
                                Price: High to Low
                            </option>

                            <option value="-ratings">
                                Top Rated
                            </option>

                            <option value="-sold">
                                Best Selling
                            </option>

                        </select>

                    </div>

                    <div class="filter-group">

                        <label>
                            Max Price:
                            <span id="price-val">₹50,000</span>
                        </label>

                        <input
                            type="range"
                            class="range-input"
                            id="filter-price"
                            min="0"
                            max="50000"
                            step="500"
                            value="50000"
                        />

                        <div class="range-labels">
                            <span>₹0</span>
                            <span>₹50,000</span>
                        </div>

                    </div>

                    <div class="filter-group">

                        <label class="filter-check">

                            <input
                                type="checkbox"
                                id="filter-instock"
                                ${filters.inStock ? 'checked' : ''}
                            />

                            In Stock Only

                        </label>

                    </div>

                    <button
                        class="btn-primary full"
                        id="apply-filters-btn"
                        style="margin-top:0.5rem;"
                    >
                        Apply Filters
                    </button>

                    <button
                        class="btn-ghost full"
                        id="clear-filters-btn"
                        style="margin-top:0.5rem;"
                    >
                        Clear All
                    </button>

                </aside>


                <!-- PRODUCTS AREA -->

                <div class="shop-main">

                    <div class="shop-toolbar">

                        <div class="toolbar-left">

                            <span
                                class="result-count"
                                id="result-count"
                            >
                                Loading…
                            </span>

                        </div>

                        <div style="display:flex;gap:0.5rem;align-items:center;">

                            <input
                                type="text"
                                id="inline-search"
                                placeholder="🔍 Search products…"
                                value="${filters.search || ''}"
                                style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:0.5rem 1rem;color:var(--text-primary);font-size:0.85rem;outline:none;width:220px;"
                            />

                        </div>

                    </div>


                    <div id="products-grid">

                        ${UI.skeletonGrid(12)}

                    </div>


                    <div
                        class="pagination"
                        id="pagination"
                    ></div>

                </div>

            </div>


            <div id="detail-mount"></div>


            <footer>

                <div class="footer-logo">NEXUS</div>

                <p>
                    © 2026 NEXUS Store. Premium shopping experience.
                </p>

            </footer>

        `;


        await loadCategories();


        if (filters.category) {

            document.getElementById(
                'filter-category'
            ).value = filters.category;
        }

        if (filters.sort) {

            document.getElementById(
                'filter-sort'
            ).value = filters.sort;
        }


        bindFilterEvents();

        await loadProducts();

    };


    /* ============================================
       LOAD CATEGORIES
       ============================================ */

    const loadCategories = async () => {

        try {

            if (!categories.length) {

                const response = await API.categories.getAll();

                categories = getArray(
                    response,
                    ['categories']
                );

            }


            const select = document.getElementById(
                'filter-category'
            );

            if (!select) return;


            select.innerHTML = `

                <option value="">
                    All Categories
                </option>

                ${categories.map(category => `

                    <option value="${category._id}">
                        ${category.name}
                    </option>

                `).join('')}

            `;

        } catch (error) {

            console.error(
                'Category loading error:',
                error.message
            );

        }

    };


    /* ============================================
       LOAD PRODUCTS
       ============================================ */

    const loadProducts = async () => {

        const grid = document.getElementById(
            'products-grid'
        );

        const count = document.getElementById(
            'result-count'
        );

        if (!grid) return;


        grid.innerHTML = UI.skeletonGrid(12);


        try {

            console.log(
                'Loading products from:',
                API.BASE_URL
            );

            const response = await API.products.getAll(
                buildQuery()
            );

            console.log(
                'Products API Response:',
                response
            );


            const products = getArray(
                response,
                ['products']
            );


            // Backend pagination

            totalPages =
                response.pagination?.totalPages ||
                response.totalPages ||
                1;


            const total =
                response.pagination?.totalProducts ||
                response.total ||
                response.count ||
                products.length;


            if (count) {

                count.textContent =
                    `${total} products found`;

            }


            // Wishlist from localStorage

            const wishlist = getWishlist();


            if (!products.length) {

                grid.innerHTML = `

                    <div
                        class="empty-state"
                        style="grid-column:1/-1;padding:4rem;"
                    >

                        <div class="empty-icon">
                            🔍
                        </div>

                        <p>
                            No products match your filters
                        </p>

                        <button
                            class="btn-outline"
                            id="reset-search-btn"
                        >
                            Clear Filters
                        </button>

                    </div>

                `;


                document
                    .getElementById('reset-search-btn')
                    ?.addEventListener('click', () => {

                        filters = {};

                        currentPage = 1;

                        render();

                    });

            } else {

                grid.innerHTML = `

                    <div class="product-grid">

                        ${products.map((product, index) => {

                            return UI.productCard(
                                product,
                                wishlist
                            ).replace(
                                'class="product-card"',
                                `class="product-card" style="animation-delay:${index * 0.05}s;"`
                            );

                        }).join('')}

                    </div>

                `;


                bindProductCardEvents(grid);

            }


            renderPagination();


        } catch (error) {

            console.error(
                'Product loading error:',
                error
            );


            if (count) {
                count.textContent = 'Products could not be loaded';
            }


            grid.innerHTML = `

                <div
                    class="empty-state"
                    style="grid-column:1/-1;"
                >

                    <div class="empty-icon">
                        ⚠️
                    </div>

                    <p>
                        ${error.message || 'Could not load products'}
                    </p>

                    <button
                        class="btn-outline"
                        id="retry-products-btn"
                    >
                        Try Again
                    </button>

                </div>

            `;


            document
                .getElementById('retry-products-btn')
                ?.addEventListener('click', loadProducts);

        }

    };


    /* ============================================
       PAGINATION
       ============================================ */

    const renderPagination = () => {

        const pagination = document.getElementById(
            'pagination'
        );

        if (!pagination) return;


        if (totalPages <= 1) {

            pagination.innerHTML = '';

            return;
        }


        let html = `

            <button
                class="page-btn"
                id="pg-prev"
                ${currentPage === 1 ? 'disabled' : ''}
            >
                ‹
            </button>

        `;


        for (let i = 1; i <= totalPages; i++) {

            if (
                i === 1 ||
                i === totalPages ||
                Math.abs(i - currentPage) <= 1
            ) {

                html += `

                    <button
                        class="page-btn ${i === currentPage ? 'active' : ''}"
                        data-page="${i}"
                    >
                        ${i}
                    </button>

                `;

            } else if (
                Math.abs(i - currentPage) === 2
            ) {

                html += `

                    <span style="color:var(--text-muted);padding:0 0.25rem;">
                        …
                    </span>

                `;

            }

        }


        html += `

            <button
                class="page-btn"
                id="pg-next"
                ${currentPage === totalPages ? 'disabled' : ''}
            >
                ›
            </button>

        `;


        pagination.innerHTML = html;


        pagination
            .querySelector('#pg-prev')
            ?.addEventListener('click', () => {

                if (currentPage > 1) {

                    currentPage--;

                    loadProducts();

                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });

                }

            });


        pagination
            .querySelector('#pg-next')
            ?.addEventListener('click', () => {

                if (currentPage < totalPages) {

                    currentPage++;

                    loadProducts();

                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });

                }

            });


        pagination
            .querySelectorAll('[data-page]')
            .forEach(button => {

                button.addEventListener('click', () => {

                    currentPage = parseInt(
                        button.dataset.page,
                        10
                    );

                    loadProducts();

                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });

                });

            });

    };


    /* ============================================
       FILTER EVENTS
       ============================================ */

    const bindFilterEvents = () => {

        const applyBtn = document.getElementById(
            'apply-filters-btn'
        );

        const clearBtn = document.getElementById(
            'clear-filters-btn'
        );

        const priceRange = document.getElementById(
            'filter-price'
        );

        const priceValue = document.getElementById(
            'price-val'
        );

        const inlineSearch = document.getElementById(
            'inline-search'
        );


        // Price display

        priceRange?.addEventListener('input', () => {

            if (priceValue) {

                priceValue.textContent =
                    `₹${Number(priceRange.value).toLocaleString('en-IN')}`;

            }

        });


        // Search

        inlineSearch?.addEventListener('input', () => {

            clearTimeout(searchTimer);

            searchTimer = setTimeout(() => {

                filters.search = inlineSearch.value.trim();

                currentPage = 1;

                loadProducts();

            }, 400);

        });


        // Apply filters

        applyBtn?.addEventListener('click', () => {

            filters.category = document.getElementById(
                'filter-category'
            ).value;

            filters.sort = document.getElementById(
                'filter-sort'
            ).value;

            filters.maxPrice = document.getElementById(
                'filter-price'
            ).value;

            filters.inStock = document.getElementById(
                'filter-instock'
            ).checked;

            currentPage = 1;

            loadProducts();

        });


        // Clear filters

        clearBtn?.addEventListener('click', () => {

            filters = {};

            currentPage = 1;


            document.getElementById(
                'filter-category'
            ).value = '';

            document.getElementById(
                'filter-sort'
            ).value = '-createdAt';

            document.getElementById(
                'filter-price'
            ).value = '50000';

            document.getElementById(
                'price-val'
            ).textContent = '₹50,000';

            document.getElementById(
                'filter-instock'
            ).checked = false;


            if (inlineSearch) {
                inlineSearch.value = '';
            }


            loadProducts();

        });

    };


    /* ============================================
       RETURN PUBLIC METHODS
       ============================================ */

    return {
        render
    };

})();
