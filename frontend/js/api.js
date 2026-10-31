
/* ============================================
   NEXUS STORE — API CONFIGURATION
   ============================================ */

// Render Backend URL
const API_BASE_URL =
    'https://ecommerce-backends-9uxi.onrender.com/api/v1';


/* ============================================
   TOKEN MANAGEMENT
   ============================================ */

const getToken = () => {
    return localStorage.getItem('token');
};

const setToken = (token) => {

    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
};


/* ============================================
   COMMON API REQUEST FUNCTION
   ============================================ */

const request = async (endpoint, options = {}) => {

    const token = getToken();

    const headers = {
        ...(options.headers || {})
    };

    // Add authorization token
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // Set JSON content type when needed
    const isFormData =
        typeof FormData !== 'undefined' &&
        options.body instanceof FormData;

    if (options.body && !isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers,
                credentials: 'include'
            }
        );

        // Handle empty response
        if (response.status === 204) {
            return {
                success: true
            };
        }

        const data = await response.json().catch(() => ({}));

        // Handle API errors
        if (!response.ok) {

            const message =
                data.message ||
                data.error ||
                `Request failed (${response.status})`;

            // Clear invalid/expired token
            if (response.status === 401) {
                setToken(null);
            }

            throw new Error(message);
        }

        return data;

    } catch (error) {

        console.error('API Error:', error.message);

        throw error;
    }
};


/* ============================================
   AUTH API
   ============================================ */

const authAPI = {

    // Register
    register: (userData) =>
        request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),

    // Login
    login: (credentials) =>
        request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),

    // Logout
    logout: () =>
        request('/auth/logout', {
            method: 'POST'
        }),

    // Get logged-in user
    getMe: () =>
        request('/auth/me'),

    // Alias for compatibility
    fetchMe: () =>
        request('/auth/me'),

    // Update profile
    updateProfile: (userData) =>
        request('/auth/update-profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        }),

    // Update password
    updatePassword: (passwordData) =>
        request('/auth/update-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        }),

    // Forgot password
    forgotPassword: (email) =>
        request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        }),

    // Reset password
    resetPassword: (token, passwordData) =>
        request(`/auth/reset-password/${token}`, {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        }),

    // Add address
    addAddress: (addressData) =>
        request('/auth/address', {
            method: 'POST',
            body: JSON.stringify(addressData)
        }),

    // Delete address
    deleteAddress: (addressId) =>
        request(`/auth/address/${addressId}`, {
            method: 'DELETE'
        }),

    // Wishlist
    toggleWishlist: (productId) =>
        request(`/auth/wishlist/${productId}`, {
            method: 'POST'
        })
};


/* ============================================
   PRODUCTS API
   ============================================ */

const productsAPI = {

    // Get all products
    getAll: (query = '') => {

        const endpoint = query
            ? `/products?${query}`
            : '/products';

        return request(endpoint);
    },

    // Get product by ID
    getById: (productId) =>
        request(`/products/${productId}`),

    // Alias used by app.js
    getOne: (productId) =>
        request(`/products/${productId}`),

    // Featured products
    getFeatured: () =>
        request('/products/featured'),

    // Search products
    search: (keyword) =>
        request(
            `/products?search=${encodeURIComponent(keyword)}`
        ),

    // Add product
    create: (productData) =>
        request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        }),

    // Update product
    update: (productId, productData) =>
        request(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        }),

    // Delete product
    delete: (productId) =>
        request(`/products/${productId}`, {
            method: 'DELETE'
        }),

    // Get product reviews
    getReviews: (productId) =>
        request(`/products/${productId}/reviews`),

    // Add review
    addReview: (productId, reviewData) =>
        request(`/products/${productId}/reviews`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        }),

    // Delete review
    deleteReview: (productId, reviewId) =>
        request(`/products/${productId}/reviews/${reviewId}`, {
            method: 'DELETE'
        })
};


/* ============================================
   CATEGORIES API
   ============================================ */

const categoriesAPI = {

    // Get all categories
    getAll: () =>
        request('/categories'),

    // Get category by ID
    getById: (categoryId) =>
        request(`/categories/${categoryId}`),

    // Create category
    create: (categoryData) =>
        request('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        }),

    // Update category
    update: (categoryId, categoryData) =>
        request(`/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        }),

    // Delete category
    delete: (categoryId) =>
        request(`/categories/${categoryId}`, {
            method: 'DELETE'
        })
};


/* ============================================
   CART API
   ============================================ */

const cartAPI = {

    // Get cart
    get: () =>
        request('/cart'),

    // Alias
    getCart: () =>
        request('/cart'),

    // Add item to cart
    add: (productId, quantity = 1) =>
        request('/cart', {
            method: 'POST',
            body: JSON.stringify({
                productId,
                quantity
            })
        }),

    // Update cart item
    // itemId = Cart subdocument _id
    update: (itemId, quantity) =>
        request(`/cart/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({
                quantity
            })
        }),

    // Remove cart item
    // itemId = Cart subdocument _id
    remove: (itemId) =>
        request(`/cart/${itemId}`, {
            method: 'DELETE'
        }),

    // Clear cart
    clear: () =>
        request('/cart', {
            method: 'DELETE'
        })
};


/* ============================================
   ORDERS API
   ============================================ */

const ordersAPI = {

    // Create order
    create: (orderData) =>
        request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        }),

    // Get logged-in user's orders
    getMyOrders: () =>
        request('/orders/my-orders'),

    // Get order by ID
    getById: (orderId) =>
        request(`/orders/${orderId}`),

    // Cancel order
    cancel: (orderId) =>
        request(`/orders/${orderId}/cancel`, {
            method: 'PUT'
        }),

    // Admin: Get all orders
    getAll: (query = '') => {

        const endpoint = query
            ? `/orders/admin/all?${query}`
            : '/orders/admin/all';

        return request(endpoint);
    },

    // Admin: Order statistics
    getStats: () =>
        request('/orders/admin/stats'),

    // Admin: Update order status
    updateStatus: (orderId, statusData) =>
        request(`/orders/admin/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify(statusData)
        })
};


/* ============================================
   ADMIN API
   ============================================ */

const adminAPI = {

    // Dashboard
    getDashboard: () =>
        request('/admin/dashboard'),

    // Get all users
    getUsers: (query = '') => {

        const endpoint = query
            ? `/admin/users?${query}`
            : '/admin/users';

        return request(endpoint);
    },

    // Get user by ID
    getUser: (userId) =>
        request(`/admin/users/${userId}`),

    // Update user
    updateUser: (userId, userData) =>
        request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        }),

    // Delete user
    deleteUser: (userId) =>
        request(`/admin/users/${userId}`, {
            method: 'DELETE'
        }),

    // Get all orders
    getAllOrders: (query = '') =>
        ordersAPI.getAll(query),

    // Get order statistics
    getOrderStats: () =>
        ordersAPI.getStats()
};


/* ============================================
   MAIN API OBJECT
   ============================================ */

const API = {

    BASE_URL: API_BASE_URL,

    getToken,
    setToken,

    request,

    auth: authAPI,
    products: productsAPI,
    categories: categoriesAPI,
    cart: cartAPI,
    orders: ordersAPI,
    admin: adminAPI

};


// Make API available to other JS files
window.API = API;
