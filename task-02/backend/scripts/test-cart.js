const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const seedAdmin = require('../src/scripts/seedAdmin');
const seedCategoriesAndProducts = require('../src/scripts/seedCategories');

const runTest = (name, fn) => {
  return fn()
    .then(() => {
      console.log(`  ✔ PASS: ${name}`);
      return true;
    })
    .catch((err) => {
      console.error(`  ✘ FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      return false;
    });
};

const makeRequest = (port, path, method = 'GET', data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const reqHeaders = { ...headers };

    if (data) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) req.write(postData);
    req.end();
  });
};

const runCartTestSuite = async () => {
  console.log('\n==============================================');
  console.log('   Section 02 Customer Cart Test Suite        ');
  console.log('==============================================\n');

  await connectDB();
  await seedAdmin();
  await seedCategoriesAndProducts();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running at http://localhost:${port}/api\n`);

  let customerToken;
  let customerUser;
  let adminToken;
  let testCategory;
  let testProduct1;
  let testProduct2;
  let inactiveProduct;

  try {
    // 1. Register a fresh customer
    const custEmail = `cart.tester.${Date.now()}@example.com`;
    const regRes = await makeRequest(port, '/api/auth/register', 'POST', {
      name: 'Cart Tester Customer',
      email: custEmail,
      password: 'password123',
    });
    customerToken = regRes.data?.data?.token;
    customerUser = regRes.data?.data?.user;

    // 2. Admin login to create test products
    const adminLogin = await makeRequest(port, '/api/auth/login', 'POST', {
      email: 'admin@gmail.com',
      password: '123456',
    });
    adminToken = adminLogin.data?.data?.token;

    // 3. Create test category & products
    const catRes = await makeRequest(
      port,
      '/api/categories',
      'POST',
      {
        name: `Cart Category ${Date.now()}`,
        description: 'Test category for cart suite',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    testCategory = catRes.data?.data?.category;

    // Product 1: $120.00
    const p1Res = await makeRequest(
      port,
      '/api/products',
      'POST',
      {
        name: 'Enterprise Barcode Scanner Model A',
        description: 'High performance USB scanner',
        categoryId: testCategory._id,
        price: 120.0,
        stockQuantity: 50,
        imageUrl: 'https://example.com/p1.jpg',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    testProduct1 = p1Res.data?.data?.product;

    // Product 2: $45.50
    const p2Res = await makeRequest(
      port,
      '/api/products',
      'POST',
      {
        name: 'Thermal Receipt Paper Rolls Pack',
        description: '80mm wide receipt paper',
        categoryId: testCategory._id,
        price: 45.5,
        stockQuantity: 100,
        imageUrl: 'https://example.com/p2.jpg',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    testProduct2 = p2Res.data?.data?.product;

    // Inactive Product: $80.00
    const p3Res = await makeRequest(
      port,
      '/api/products',
      'POST',
      {
        name: 'Discontinued Card Reader Model D',
        description: 'Legacy reader',
        categoryId: testCategory._id,
        price: 80.0,
        stockQuantity: 20,
        imageUrl: 'https://example.com/p3.jpg',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    inactiveProduct = p3Res.data?.data?.product;
    await Product.findByIdAndUpdate(inactiveProduct._id, { isActive: false });

    const results = [];

    // Test 1: Protected Cart Access (Unauthenticated rejected)
    results.push(
      await runTest('1. Protected cart access (401 Unauthorized without token)', async () => {
        const res = await makeRequest(port, '/api/cart');
        if (res.status !== 401) {
          throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
        }
      })
    );

    // Test 2: Add Product to Cart
    results.push(
      await runTest('2. Add product to cart (POST /api/cart/items with quantity 2)', async () => {
        const res = await makeRequest(
          port,
          '/api/cart/items',
          'POST',
          { productId: testProduct1._id, quantity: 2 },
          { Authorization: `Bearer ${customerToken}` }
        );
        if (res.status !== 200) {
          throw new Error(`Expected 200, got ${res.status} (${JSON.stringify(res.data)})`);
        }
        const cart = res.data?.data?.cart;
        if (!cart || cart.items.length !== 1) {
          throw new Error('Cart should contain exactly 1 item');
        }
        if (cart.items[0].quantity !== 2) {
          throw new Error(`Expected quantity 2, got ${cart.items[0].quantity}`);
        }
        if (cart.subtotal !== 240) {
          throw new Error(`Expected subtotal 240, got ${cart.subtotal}`);
        }
      })
    );

    // Test 3: Add Same Product Multiple Times (increments quantity, no duplicates)
    results.push(
      await runTest('3. Add same product multiple times increments quantity', async () => {
        const res = await makeRequest(
          port,
          '/api/cart/items',
          'POST',
          { productId: testProduct1._id, quantity: 3 },
          { Authorization: `Bearer ${customerToken}` }
        );
        if (res.status !== 200) {
          throw new Error(`Expected 200, got ${res.status}`);
        }
        const cart = res.data?.data?.cart;
        if (cart.items.length !== 1) {
          throw new Error(`Expected 1 unique item in items array, got ${cart.items.length}`);
        }
        if (cart.items[0].quantity !== 5) {
          throw new Error(`Expected total quantity 5 (2 + 3), got ${cart.items[0].quantity}`);
        }
        if (cart.subtotal !== 600) {
          throw new Error(`Expected subtotal 600 (5 * 120), got ${cart.subtotal}`);
        }
      })
    );

    // Test 4: Quantity Update (PUT /api/cart/items/:productId)
    results.push(
      await runTest('4. Quantity update and rejection of non-positive quantity', async () => {
        // Valid update to 4
        const resValid = await makeRequest(
          port,
          `/api/cart/items/${testProduct1._id}`,
          'PUT',
          { quantity: 4 },
          { Authorization: `Bearer ${customerToken}` }
        );
        if (resValid.status !== 200) {
          throw new Error(`Expected 200, got ${resValid.status}`);
        }
        const cart = resValid.data?.data?.cart;
        if (cart.items[0].quantity !== 4) {
          throw new Error(`Expected updated quantity 4, got ${cart.items[0].quantity}`);
        }

        // Invalid update (0 or negative)
        const resInvalid = await makeRequest(
          port,
          `/api/cart/items/${testProduct1._id}`,
          'PUT',
          { quantity: 0 },
          { Authorization: `Bearer ${customerToken}` }
        );
        if (resInvalid.status !== 400) {
          throw new Error(`Expected 400 for non-positive quantity, got ${resInvalid.status}`);
        }
      })
    );

    // Test 5: Subtotal Calculation strictly from Database Product Prices
    results.push(
      await runTest('5. Subtotal calculation strictly verified against DB prices', async () => {
        // Add Product 2 ($45.50) with quantity 2
        const resAddP2 = await makeRequest(
          port,
          '/api/cart/items',
          'POST',
          { productId: testProduct2._id, quantity: 2 },
          { Authorization: `Bearer ${customerToken}` }
        );
        if (resAddP2.status !== 200) {
          throw new Error(`Expected 200, got ${resAddP2.status}`);
        }
        const cart = resAddP2.data?.data?.cart;
        if (cart.items.length !== 2) {
          throw new Error(`Expected 2 items in cart, got ${cart.items.length}`);
        }

        // Expected: (4 * 120.00) + (2 * 45.50) = 480.00 + 91.00 = 571.00
        const expectedSubtotal = 480.0 + 91.0;
        if (cart.subtotal !== expectedSubtotal) {
          throw new Error(`Expected subtotal ${expectedSubtotal}, got ${cart.subtotal}`);
        }
        if (cart.itemCount !== 6) {
          throw new Error(`Expected total itemCount 6 (4 + 2), got ${cart.itemCount}`);
        }
      })
    );

    // Test 6: Cart does NOT reserve stock (reservedQuantity unchanged in DB)
    results.push(
      await runTest('6. Business rule: Adding to cart does NOT change reservedQuantity', async () => {
        const prod1 = await Product.findById(testProduct1._id);
        const prod2 = await Product.findById(testProduct2._id);

        if (prod1.reservedQuantity !== 0) {
          throw new Error(`Product 1 reservedQuantity was altered: ${prod1.reservedQuantity}`);
        }
        if (prod2.reservedQuantity !== 0) {
          throw new Error(`Product 2 reservedQuantity was altered: ${prod2.reservedQuantity}`);
        }
      })
    );

    // Test 7: Rejection of Inactive Product
    results.push(
      await runTest('7. Inactive products cannot be added to cart (400 Bad Request)', async () => {
        const res = await makeRequest(
          port,
          '/api/cart/items',
          'POST',
          { productId: inactiveProduct._id, quantity: 1 },
          { Authorization: `Bearer ${customerToken}` }
        );
        if (res.status !== 400) {
          throw new Error(`Expected 400 Bad Request for inactive product, got ${res.status}`);
        }
      })
    );

    // Test 8: Remove Specific Item (DELETE /api/cart/items/:productId)
    results.push(
      await runTest('8. Remove specific item from cart', async () => {
        const res = await makeRequest(
          port,
          `/api/cart/items/${testProduct2._id}`,
          'DELETE',
          null,
          { Authorization: `Bearer ${customerToken}` }
        );
        if (res.status !== 200) {
          throw new Error(`Expected 200, got ${res.status}`);
        }
        const cart = res.data?.data?.cart;
        if (cart.items.length !== 1) {
          throw new Error(`Expected 1 item remaining, got ${cart.items.length}`);
        }
        if (cart.items[0].productId.toString() !== testProduct1._id.toString()) {
          throw new Error('Remaining item should be testProduct1');
        }
        if (cart.subtotal !== 480) {
          throw new Error(`Expected subtotal 480 after removal, got ${cart.subtotal}`);
        }
      })
    );

    // Test 9: Clear Entire Cart (DELETE /api/cart)
    results.push(
      await runTest('9. Clear entire cart (DELETE /api/cart)', async () => {
        const res = await makeRequest(
          port,
          '/api/cart',
          'DELETE',
          null,
          { Authorization: `Bearer ${customerToken}` }
        );
        if (res.status !== 200) {
          throw new Error(`Expected 200, got ${res.status}`);
        }
        const cart = res.data?.data?.cart;
        if (cart.items.length !== 0) {
          throw new Error(`Expected 0 items after clear, got ${cart.items.length}`);
        }
        if (cart.subtotal !== 0) {
          throw new Error(`Expected subtotal 0, got ${cart.subtotal}`);
        }
      })
    );

    // Test 10: Empty Cart State Inspection (GET /api/cart)
    results.push(
      await runTest('10. Empty cart state inspection (GET /api/cart returns items=[], subtotal=0)', async () => {
        const res = await makeRequest(
          port,
          '/api/cart',
          'GET',
          null,
          { Authorization: `Bearer ${customerToken}` }
        );
        if (res.status !== 200) {
          throw new Error(`Expected 200, got ${res.status}`);
        }
        const cart = res.data?.data?.cart;
        if (!cart || !Array.isArray(cart.items) || cart.items.length !== 0) {
          throw new Error('Expected items array to be empty');
        }
        if (cart.subtotal !== 0 || cart.itemCount !== 0) {
          throw new Error('Expected subtotal=0 and itemCount=0');
        }
      })
    );

    const total = results.length;
    const passed = results.filter(Boolean).length;
    const failed = total - passed;

    console.log('\n----------------------------------------------');
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    console.log('----------------------------------------------\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    // Cleanup test data
    if (customerUser) {
      await Cart.deleteMany({ userId: customerUser.id || customerUser._id });
      await User.findByIdAndDelete(customerUser.id || customerUser._id);
    }
    if (testProduct1) await Product.findByIdAndDelete(testProduct1._id);
    if (testProduct2) await Product.findByIdAndDelete(testProduct2._id);
    if (inactiveProduct) await Product.findByIdAndDelete(inactiveProduct._id);
    if (testCategory) await Category.findByIdAndDelete(testCategory._id);
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
};

runCartTestSuite().catch((err) => {
  console.error('Cart test runner fatal error:', err);
  process.exit(1);
});
