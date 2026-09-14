const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
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

const runCustomerStoreTestSuite = async () => {
  console.log('\n==============================================');
  console.log('   Section 02 Customer Discovery Test Suite   ');
  console.log('==============================================\n');

  await connectDB();
  await seedAdmin();
  await seedCategoriesAndProducts();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running at http://localhost:${port}/api\n`);

  let testCategory;
  let inStockProduct;
  let outOfStockProduct;
  let inactiveProduct;
  let adminToken;

  try {
    // 1. Admin login to create test products
    const loginRes = await makeRequest(port, '/api/auth/login', 'POST', {
      email: 'admin@gmail.com',
      password: '123456',
    });
    adminToken = loginRes.data?.data?.token;

    // 2. Prepare categories and test products
    const catRes = await makeRequest(
      port,
      '/api/categories',
      'POST',
      {
        name: `Customer Test Category ${Date.now()}`,
        description: 'Category for customer discovery testing',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    testCategory = catRes.data?.data?.category;

    // Product 1: In Stock (Stock: 20, Reserved: 2 -> Available: 18, Price: 150)
    const p1Res = await makeRequest(
      port,
      '/api/products',
      'POST',
      {
        name: 'Ultra High-Speed Desktop Barcode Scanner Pro',
        description: 'Omnidirectional multi-line optical scanner with quick USB-C connection.',
        categoryId: testCategory._id,
        price: 150.0,
        stockQuantity: 20,
        imageUrl: 'https://example.com/scanner.jpg',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    inStockProduct = p1Res.data?.data?.product;

    // Simulate reservation in DB to test availableStock calculation
    await Product.findByIdAndUpdate(inStockProduct._id, { reservedQuantity: 2 });

    // Product 2: Out of Stock (Stock: 5, Reserved: 5 -> Available: 0, Price: 45)
    const p2Res = await makeRequest(
      port,
      '/api/products',
      'POST',
      {
        name: 'Compact Direct Thermal Paper Rolls Box',
        description: 'High-sensitivity paper rolls for checkout printers.',
        categoryId: testCategory._id,
        price: 45.0,
        stockQuantity: 5,
        imageUrl: 'https://example.com/paper.jpg',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    outOfStockProduct = p2Res.data?.data?.product;
    await Product.findByIdAndUpdate(outOfStockProduct._id, { reservedQuantity: 5 });

    // Product 3: Inactive Product (Price: 300)
    const p3Res = await makeRequest(
      port,
      '/api/products',
      'POST',
      {
        name: 'Discontinued Magnetic Stripe Reader',
        description: 'Legacy card reader hardware item.',
        categoryId: testCategory._id,
        price: 300.0,
        stockQuantity: 10,
        imageUrl: 'https://example.com/legacy.jpg',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    inactiveProduct = p3Res.data?.data?.product;
    await Product.findByIdAndUpdate(inactiveProduct._id, { isActive: false });

    // RUN THE 10 TESTS
    const results = [];

    // Test 1: Product Listing (Public gets only active products)
    results.push(
      await runTest('1. Public product listing displays only active products', async () => {
        const res = await makeRequest(port, '/api/products');
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const products = res.data?.data?.products || [];
        if (!Array.isArray(products) || products.length === 0) {
          throw new Error('No products returned');
        }
        const hasInactive = products.some((p) => p.isActive === false);
        if (hasInactive) throw new Error('Inactive products were returned to public caller');
      })
    );

    // Test 2: Search (Case-insensitive across name and description)
    results.push(
      await runTest('2. Case-insensitive search by name and description', async () => {
        // Lowercase query
        const res1 = await makeRequest(port, '/api/products?search=barcode+scanner');
        if (res1.status !== 200) throw new Error(`Expected 200, got ${res1.status}`);
        const found1 = res1.data?.data?.products?.some((p) => p._id === inStockProduct._id);
        if (!found1) throw new Error('Product not found with lowercase search');

        // Uppercase query matching description word "OMNIDIRECTIONAL"
        const res2 = await makeRequest(port, '/api/products?search=OMNIDIRECTIONAL');
        if (res2.status !== 200) throw new Error(`Expected 200, got ${res2.status}`);
        const found2 = res2.data?.data?.products?.some((p) => p._id === inStockProduct._id);
        if (!found2) throw new Error('Product not found with uppercase description search');
      })
    );

    // Test 3: Category Filter (By slug and by ObjectId)
    results.push(
      await runTest('3. Category filter by slug and ObjectId', async () => {
        // By Slug
        const resSlug = await makeRequest(port, `/api/products?category=${testCategory.slug}`);
        if (resSlug.status !== 200) throw new Error(`Expected 200, got ${resSlug.status}`);
        const prodsSlug = resSlug.data?.data?.products || [];
        if (!prodsSlug.some((p) => p._id === inStockProduct._id)) {
          throw new Error('Product not found by category slug');
        }

        // By ObjectId
        const resId = await makeRequest(port, `/api/products?category=${testCategory._id}`);
        if (resId.status !== 200) throw new Error(`Expected 200, got ${resId.status}`);
        const prodsId = resId.data?.data?.products || [];
        if (!prodsId.some((p) => p._id === inStockProduct._id)) {
          throw new Error('Product not found by category ObjectId');
        }
      })
    );

    // Test 4: Minimum Price Filter (minPrice)
    results.push(
      await runTest('4. Minimum price filter (minPrice=100)', async () => {
        const res = await makeRequest(
          port,
          `/api/products?category=${testCategory.slug}&minPrice=100`
        );
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const prods = res.data?.data?.products || [];
        if (!prods.some((p) => p._id === inStockProduct._id)) {
          throw new Error('In-stock scanner ($150) should be included');
        }
        if (prods.some((p) => p._id === outOfStockProduct._id)) {
          throw new Error('Paper rolls ($45) should NOT be included with minPrice=100');
        }
      })
    );

    // Test 5: Maximum Price Filter (maxPrice)
    results.push(
      await runTest('5. Maximum price filter (maxPrice=60)', async () => {
        const res = await makeRequest(
          port,
          `/api/products?category=${testCategory.slug}&maxPrice=60`
        );
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const prods = res.data?.data?.products || [];
        if (!prods.some((p) => p._id === outOfStockProduct._id)) {
          throw new Error('Paper rolls ($45) should be included with maxPrice=60');
        }
        if (prods.some((p) => p._id === inStockProduct._id)) {
          throw new Error('Scanner ($150) should NOT be included with maxPrice=60');
        }
      })
    );

    // Test 6: Availability Filter (in-stock vs out-of-stock)
    results.push(
      await runTest('6. Availability filter (in-stock vs out-of-stock)', async () => {
        // In-stock
        const resInStock = await makeRequest(
          port,
          `/api/products?category=${testCategory.slug}&availability=in-stock`
        );
        if (resInStock.status !== 200) throw new Error(`Expected 200, got ${resInStock.status}`);
        const inStockList = resInStock.data?.data?.products || [];
        if (!inStockList.some((p) => p._id === inStockProduct._id)) {
          throw new Error('In-stock product missing from availability=in-stock');
        }
        if (inStockList.some((p) => p._id === outOfStockProduct._id)) {
          throw new Error('Out of stock product erroneously found in availability=in-stock');
        }

        // Out-of-stock
        const resOut = await makeRequest(
          port,
          `/api/products?category=${testCategory.slug}&availability=out-of-stock`
        );
        if (resOut.status !== 200) throw new Error(`Expected 200, got ${resOut.status}`);
        const outList = resOut.data?.data?.products || [];
        if (!outList.some((p) => p._id === outOfStockProduct._id)) {
          throw new Error('Out of stock product missing from availability=out-of-stock');
        }
        if (outList.some((p) => p._id === inStockProduct._id)) {
          throw new Error('In stock product erroneously found in availability=out-of-stock');
        }
      })
    );

    // Test 7: Combined Filtering
    results.push(
      await runTest('7. Combined search, category, price range, and availability filter', async () => {
        const query = `/api/products?search=Scanner&category=${testCategory.slug}&minPrice=100&maxPrice=200&availability=in-stock`;
        const res = await makeRequest(port, query);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const prods = res.data?.data?.products || [];
        if (prods.length !== 1 || prods[0]._id !== inStockProduct._id) {
          throw new Error(`Expected exactly 1 matching product, got ${prods.length}`);
        }
      })
    );

    // Test 8: Product Details by ID
    results.push(
      await runTest('8. Product details by ID returns complete data with populated category', async () => {
        const res = await makeRequest(port, `/api/products/${inStockProduct._id}`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const prod = res.data?.data?.product;
        if (!prod || prod.name !== inStockProduct.name) {
          throw new Error('Product details did not return matching name');
        }
        if (!prod.categoryId || !prod.categoryId.name) {
          throw new Error('Category was not properly populated');
        }
        if (typeof prod.reservedQuantity !== 'undefined') {
          throw new Error('reservedQuantity was leaked to public caller');
        }
      })
    );

    // Test 9: Inactive products not publicly accessible (404 on details, hidden from list)
    results.push(
      await runTest('9. Inactive products hidden from public list and return 404 on details', async () => {
        // Should return 404 for public customer
        const resDetail = await makeRequest(port, `/api/products/${inactiveProduct._id}`);
        if (resDetail.status !== 404) {
          throw new Error(`Expected 404 for inactive product details, got ${resDetail.status}`);
        }

        // Admin can still view it
        const resAdmin = await makeRequest(
          port,
          `/api/products/${inactiveProduct._id}`,
          'GET',
          null,
          { Authorization: `Bearer ${adminToken}` }
        );
        if (resAdmin.status !== 200) {
          throw new Error(`Admin should be able to view inactive product, got ${resAdmin.status}`);
        }
      })
    );

    // Test 10: Out-of-Stock Presentation and availableStock Calculation
    results.push(
      await runTest('10. Out-of-stock calculation (availableStock = stockQuantity - reservedQuantity)', async () => {
        const res = await makeRequest(port, `/api/products/${outOfStockProduct._id}`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const prod = res.data?.data?.product;
        if (prod.availableStock !== 0) {
          throw new Error(`Expected availableStock = 0, got ${prod.availableStock}`);
        }
        if (typeof prod.reservedQuantity !== 'undefined') {
          throw new Error('reservedQuantity must not be directly exposed to customer');
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
    // Cleanup temporary test items
    if (inStockProduct) await Product.findByIdAndDelete(inStockProduct._id);
    if (outOfStockProduct) await Product.findByIdAndDelete(outOfStockProduct._id);
    if (inactiveProduct) await Product.findByIdAndDelete(inactiveProduct._id);
    if (testCategory) await Category.findByIdAndDelete(testCategory._id);
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
};

runCustomerStoreTestSuite().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
