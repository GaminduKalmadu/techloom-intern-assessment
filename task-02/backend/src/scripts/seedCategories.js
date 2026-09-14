const Category = require('../models/Category');
const Product = require('../models/Product');
const { connectDB } = require('../config/db');

const initialCategories = [
  {
    name: 'Point of Sale & Hardware',
    slug: 'pos-hardware',
    description: 'Receipt printers, barcode scanners, and terminal equipment',
  },
  {
    name: 'Electronics & Displays',
    slug: 'electronics-displays',
    description: 'Touchscreen monitors, customer facing displays, and tablets',
  },
  {
    name: 'Cables & Accessories',
    slug: 'cables-accessories',
    description: 'High-speed RJ11, RJ45, USB-C cables and mounting brackets',
  },
  {
    name: 'Retail Essentials',
    slug: 'retail-essentials',
    description: 'Thermal paper rolls, ink ribbons, and cash drawer inserts',
  },
];

const seedCategoriesAndProducts = async () => {
  try {
    const categoryMap = {};

    for (const cat of initialCategories) {
      let existing = await Category.findOne({
        $or: [{ name: cat.name }, { slug: cat.slug }],
      });
      if (!existing) {
        existing = await Category.create(cat);
        console.log(`[Catalog Seeder] Created category: ${cat.name}`);
      }
      categoryMap[cat.slug] = existing._id;
    }

    // Seed sample starter products if product collection is empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const sampleProducts = [
        {
          name: 'Omnidirectional 2D Barcode Scanner',
          description: 'High-speed hands-free desktop presentation barcode scanner with USB interface.',
          categoryId: categoryMap['pos-hardware'],
          price: 129.99,
          imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60',
          stockQuantity: 45,
          reservedQuantity: 5, // available = 40 (In Stock)
          isActive: true,
        },
        {
          name: 'Heavy-Duty Cash Drawer (RJ11)',
          description: 'Solid steel cash drawer with 5 bill and 8 coin compartments, key lock, and RJ11 cable.',
          categoryId: categoryMap['pos-hardware'],
          price: 64.5,
          imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=500&auto=format&fit=crop&q=60',
          stockQuantity: 8,
          reservedQuantity: 2, // available = 6 (Low Stock)
          isActive: true,
        },
        {
          name: '80mm Thermal Receipt Printer',
          description: 'Ultra-fast 260mm/s auto-cutter receipt printer with Ethernet and USB connectivity.',
          categoryId: categoryMap['pos-hardware'],
          price: 179.0,
          imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=60',
          stockQuantity: 3,
          reservedQuantity: 3, // available = 0 (Out of Stock)
          isActive: true,
        },
        {
          name: '15-inch Touchscreen POS Monitor',
          description: 'True-flat capacitive touchscreen display with sturdy aluminum stand for checkout counters.',
          categoryId: categoryMap['electronics-displays'],
          price: 349.0,
          imageUrl: 'https://images.unsplash.com/photo-1547394765-185e1317ac14?w=500&auto=format&fit=crop&q=60',
          stockQuantity: 14,
          reservedQuantity: 0, // available = 14 (In Stock)
          isActive: true,
        },
        {
          name: 'Thermal Paper Rolls 80mm (Box of 50)',
          description: 'BPA-free premium thermal paper rolls for POS receipt printers.',
          categoryId: categoryMap['retail-essentials'],
          price: 48.0,
          imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop&q=60',
          stockQuantity: 100,
          reservedQuantity: 12, // available = 88 (In Stock)
          isActive: true,
        },
      ];

      await Product.insertMany(sampleProducts);
      console.log(`[Catalog Seeder] Seeded ${sampleProducts.length} starter products.`);
    }

    return true;
  } catch (error) {
    console.error('[Catalog Seeder Error]', error.message);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedCategoriesAndProducts();
      console.log('[Catalog Seeder] Done.');
      process.exit(0);
    } catch (err) {
      console.error('[Catalog Seeder Fatal]', err);
      process.exit(1);
    }
  })();
}

module.exports = seedCategoriesAndProducts;
