# 🛒 E-Commerce Backend API

A **production-ready** RESTful e-commerce backend built with **Node.js**, **Express.js**, and **MongoDB Atlas**, featuring JWT authentication, file uploads, advanced search, pagination, and comprehensive error handling.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

---

## 🚀 Live Demo

**API Base URL:** `https://your-app-name.onrender.com`

> **Test Credentials:**
> - Admin: `admin@ecommerce.com` / `Admin@123`
> - User: `user@ecommerce.com` / `User@1234`

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔐 **JWT Authentication** | Register, Login, Logout with secure HTTP-only cookies |
| 🛡️ **Role-Based Access** | User & Admin roles with middleware protection |
| 📦 **Products CRUD** | Create, Read, Update, Delete with image upload |
| 🗂️ **Categories** | Hierarchical category system |
| 🛒 **Shopping Cart** | Add, update, remove items with stock validation |
| 📋 **Orders** | Place orders, track status, admin management |
| ⭐ **Reviews** | Add/update/delete product reviews with ratings |
| 🔍 **Search & Filter** | Full-text search, price range, rating, brand filters |
| 📄 **Pagination** | All list endpoints support pagination |
| 📸 **File Upload** | Product images and avatars via Cloudinary |
| 📧 **Email Service** | Welcome, password reset, order confirmation emails |
| ❤️ **Wishlist** | Toggle products in/out of wishlist |
| 🏠 **Addresses** | Multiple shipping address management |
| 📊 **Admin Dashboard** | Revenue stats, user management, order analytics |
| 🔒 **Security** | Helmet, CORS, Rate limiting, NoSQL injection prevention |

---

## 📁 Project Structure

```
ecommerce-backend/
├── 📄 server.js              # Entry point
├── 📄 app.js                 # Express app configuration
├── 📁 config/
│   ├── database.js           # MongoDB connection
│   └── cloudinary.js         # File upload configuration
├── 📁 models/
│   ├── User.js               # User model
│   ├── Product.js            # Product + Review model
│   ├── Category.js           # Category model
│   ├── Order.js              # Order model
│   └── Cart.js               # Cart model
├── 📁 controllers/
│   ├── authController.js     # Authentication logic
│   ├── productController.js  # Product CRUD + Reviews
│   ├── categoryController.js # Category management
│   ├── orderController.js    # Order management
│   ├── cartController.js     # Cart management
│   └── adminController.js    # Admin operations
├── 📁 routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── categoryRoutes.js
│   ├── orderRoutes.js
│   ├── cartRoutes.js
│   └── adminRoutes.js
├── 📁 middleware/
│   ├── auth.js               # JWT protect & authorize
│   ├── errorHandler.js       # Global error handler
│   └── validate.js           # Request validation
├── 📁 validators/
│   ├── authValidator.js
│   └── productValidator.js
├── 📁 utils/
│   ├── AppError.js           # Custom error class
│   ├── APIFeatures.js        # Query builder (search/sort/paginate)
│   ├── sendEmail.js          # Email utility
│   └── response.js           # Response helpers
├── 📁 scripts/
│   └── seed.js               # Database seeder
├── 📄 .env.example
├── 📄 .gitignore
└── 📄 package.json
```

---

## 🛠️ Local Setup

### Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas account (free)
- Cloudinary account (free)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ecommerce-backend.git
cd ecommerce-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` with your credentials:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce
JWT_SECRET=your_secret_key_minimum_32_characters
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_EMAIL=your@gmail.com
SMTP_PASSWORD=your_app_password
```

### 4. Seed Database (Optional)
```bash
node scripts/seed.js
```

### 5. Start Development Server
```bash
npm run dev
```

Server runs at `http://localhost:5000` 🚀

---

## 📡 API Documentation

### Base URL
- **Local:** `http://localhost:5000/api/v1`
- **Production:** `https://your-app.onrender.com/api/v1`

---

### 🔐 Authentication Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login user |
| POST | `/auth/logout` | Private | Logout user |
| GET | `/auth/me` | Private | Get current user profile |
| PUT | `/auth/update-profile` | Private | Update profile + avatar |
| PUT | `/auth/update-password` | Private | Change password |
| POST | `/auth/forgot-password` | Public | Send reset email |
| PUT | `/auth/reset-password/:token` | Public | Reset password |
| POST | `/auth/address` | Private | Add new address |
| DELETE | `/auth/address/:addressId` | Private | Delete address |
| POST | `/auth/wishlist/:productId` | Private | Toggle wishlist |

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "John@1234",
  "confirmPassword": "John@1234"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "John@1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### 📦 Product Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/products` | Public | Get all products (search, filter, paginate) |
| GET | `/products/featured` | Public | Get featured products |
| GET | `/products/:id` | Public | Get single product |
| GET | `/products/:id/reviews` | Public | Get product reviews |
| POST | `/products` | Admin | Create product (with images) |
| PUT | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Delete product |
| POST | `/products/:id/reviews` | Private | Add/update review |
| DELETE | `/products/:id/reviews/:reviewId` | Private | Delete review |

#### Search & Filter Products
```http
GET /api/v1/products?keyword=iphone&category=CATEGORY_ID&minPrice=5000&maxPrice=150000&minRating=4&sort=-price&page=1&limit=12
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `keyword` | String | Search in name, description, brand, tags |
| `category` | ObjectId | Filter by category |
| `brand` | String | Filter by brand |
| `minPrice` | Number | Minimum price |
| `maxPrice` | Number | Maximum price |
| `minRating` | Number | Minimum rating (1-5) |
| `inStock` | Boolean | Only in-stock products |
| `featured` | Boolean | Only featured products |
| `sort` | String | Sort field (prefix `-` for desc): `price`, `-price`, `ratings`, `-createdAt` |
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 12, max: 100) |

#### Create Product (Admin)
```http
POST /api/v1/products
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

name: iPhone 15 Pro
description: Latest Apple iPhone...
price: 134900
discountPrice: 124900
category: <category_id>
brand: Apple
stock: 50
images: [file1.jpg, file2.jpg]
```

---

### 🗂️ Category Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/categories` | Public | Get all categories |
| GET | `/categories/:id` | Public | Get single category |
| POST | `/categories` | Admin | Create category |
| PUT | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Delete category |

---

### 🛒 Cart Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/cart` | Private | Get user's cart |
| POST | `/cart` | Private | Add item to cart |
| PUT | `/cart/:itemId` | Private | Update item quantity |
| DELETE | `/cart/:itemId` | Private | Remove item |
| DELETE | `/cart` | Private | Clear entire cart |

#### Add to Cart
```http
POST /api/v1/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "PRODUCT_ID",
  "quantity": 2
}
```

---

### 📋 Order Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/orders` | Private | Place new order |
| GET | `/orders/my-orders` | Private | Get my orders |
| GET | `/orders/:id` | Private | Get single order |
| PUT | `/orders/:id/cancel` | Private | Cancel order |
| GET | `/orders/admin/all` | Admin | Get all orders |
| GET | `/orders/admin/stats` | Admin | Order statistics |
| PUT | `/orders/admin/:id/status` | Admin | Update order status |

#### Place Order
```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderItems": [
    { "product": "PRODUCT_ID", "quantity": 2 }
  ],
  "shippingAddress": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "zipCode": "400001",
    "phone": "9876543210"
  },
  "paymentInfo": {
    "method": "cod"
  }
}
```

---

### 👑 Admin Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/dashboard` | Admin | Dashboard statistics |
| GET | `/admin/users` | Admin | All users with search/filter |
| GET | `/admin/users/:id` | Admin | Single user details |
| PUT | `/admin/users/:id` | Admin | Update user role/status |
| DELETE | `/admin/users/:id` | Admin | Delete user |

---

### 📊 Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Paginated:**
```json
{
  "success": true,
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProducts": 50,
    "itemsPerPage": 12,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "products": [...]
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Email is required" }]
}
```

---

## 🌐 Deploy to GitHub + Render.com

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "feat: complete e-commerce backend"
git branch -M main
git remote add origin https://github.com/yourusername/ecommerce-backend.git
git push -u origin main
```

### Step 2: Deploy on Render.com
1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add Environment Variables (from `.env.example`)
5. Click **Deploy!**

### Step 3: Get Your Live Link
After deployment: `https://ecommerce-backend-xxxx.onrender.com`

Share this link with anyone! 🎉

---

## 🔒 Security Features

- ✅ **JWT** - Secure token-based authentication
- ✅ **bcrypt** - Password hashing (12 salt rounds)
- ✅ **Helmet** - Security HTTP headers
- ✅ **Rate Limiting** - 100 req/15min (10 for auth)
- ✅ **CORS** - Configured allowed origins
- ✅ **MongoDB Sanitize** - NoSQL injection prevention
- ✅ **Express Validator** - Input validation
- ✅ **HTTP-only Cookies** - Secure token storage

---

## 🧪 Testing the API

Use **Postman**, **Thunder Client**, or **curl**:

```bash
# Health check
curl https://your-app.onrender.com/api/health

# Register
curl -X POST https://your-app.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test@1234","confirmPassword":"Test@1234"}'

# Get Products
curl https://your-app.onrender.com/api/v1/products?page=1&limit=5
```

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | `development` or `production` |
| `PORT` | ✅ | Server port (default: 5000) |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | JWT secret (min 32 chars) |
| `JWT_EXPIRE` | ✅ | Token expiry (e.g., `30d`) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `SMTP_HOST` | Optional | Email SMTP host |
| `SMTP_EMAIL` | Optional | Sender email |
| `SMTP_PASSWORD` | Optional | Email password |
| `CLIENT_URL` | Optional | Frontend URL for CORS |

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Built with ❤️ using Node.js, Express & MongoDB**

⭐ Star this repo if it helped you!

</div>
