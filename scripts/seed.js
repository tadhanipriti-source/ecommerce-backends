const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@ecommerce.com',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true,
    });

    const testUser = await User.create({
      name: 'Test User',
      email: 'user@ecommerce.com',
      password: 'User@1234',
      role: 'user',
      isVerified: true,
    });

    console.log('👤 Users created');

    // Create categories
    const categories = await Category.create([
      { name: 'Electronics', description: 'Electronic devices and gadgets', order: 1 },
      { name: 'Clothing', description: 'Fashion and apparel', order: 2 },
      { name: 'Books', description: 'Books and educational material', order: 3 },
      { name: 'Home & Kitchen', description: 'Home appliances and kitchen items', order: 4 },
      { name: 'Sports', description: 'Sports and fitness equipment', order: 5 },
    ]);
    console.log('📁 Categories created');

    // Create products
    const products = [
      {
        name: 'iPhone 15 Pro Max',
        description: 'Latest Apple iPhone with A17 Pro chip, titanium design, and advanced camera system with 5x optical zoom.',
        shortDescription: 'Apple iPhone 15 Pro Max - 256GB',
        price: 134900,
        discountPrice: 124900,
        category: categories[0]._id,
        brand: 'Apple',
        stock: 50,
        isFeatured: true,
        tags: ['smartphone', 'apple', 'ios', '5g'],
        images: [
          { public_id: 'demo_iphone', url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800' },
        ],
        specifications: [
          { key: 'Display', value: '6.7 inch Super Retina XDR' },
          { key: 'Processor', value: 'A17 Pro Bionic' },
          { key: 'Storage', value: '256GB' },
          { key: 'Battery', value: '4422 mAh' },
        ],
        createdBy: admin._id,
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Samsung flagship with S Pen, 200MP camera, and Snapdragon 8 Gen 3 processor.',
        shortDescription: 'Samsung Galaxy S24 Ultra - 512GB',
        price: 129999,
        discountPrice: 114999,
        category: categories[0]._id,
        brand: 'Samsung',
        stock: 35,
        isFeatured: true,
        tags: ['smartphone', 'samsung', 'android', 's-pen'],
        images: [
          { public_id: 'demo_samsung', url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800' },
        ],
        createdBy: admin._id,
      },
      {
        name: 'Nike Air Max 270',
        description: 'Ultra-comfortable running shoes with Air Max unit for superior cushioning and breathable mesh upper.',
        shortDescription: 'Nike Air Max 270 Running Shoes',
        price: 12995,
        discountPrice: 9995,
        category: categories[1]._id,
        brand: 'Nike',
        stock: 100,
        isFeatured: true,
        tags: ['shoes', 'sports', 'running', 'nike'],
        images: [
          { public_id: 'demo_nike', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800' },
        ],
        createdBy: admin._id,
      },
      {
        name: 'The Pragmatic Programmer',
        description: 'Classic book for software developers. Learn timeless lessons about crafting software with care.',
        shortDescription: '20th Anniversary Edition',
        price: 2499,
        discountPrice: 1799,
        category: categories[2]._id,
        brand: 'Addison-Wesley',
        stock: 200,
        isFeatured: false,
        tags: ['programming', 'software', 'career', 'book'],
        images: [
          { public_id: 'demo_book', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800' },
        ],
        createdBy: admin._id,
      },
      {
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Industry-leading noise canceling headphones with 30-hour battery life and premium sound quality.',
        shortDescription: 'Sony WH-1000XM5 Wireless ANC',
        price: 29990,
        discountPrice: 24990,
        category: categories[0]._id,
        brand: 'Sony',
        stock: 75,
        isFeatured: true,
        tags: ['headphones', 'wireless', 'anc', 'sony'],
        images: [
          { public_id: 'demo_headphone', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
        ],
        createdBy: admin._id,
      },
    ];

    await Product.create(products);
    console.log('📦 Products created');

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('');
    console.log('👤 Admin: admin@ecommerce.com / Admin@123');
    console.log('👤 User:  user@ecommerce.com  / User@1234');
    console.log('');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
