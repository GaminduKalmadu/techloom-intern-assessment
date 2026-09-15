const http = require('http');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const seedAdmin = require('../src/scripts/seedAdmin');
const seedCategoriesAndProducts = require('../src/scripts/seedCategories');
const Product = require('../src/models/Product');
const env = require('../src/config/env');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function pass(title) {
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${title}`);
}

function fail(title, error) {
  console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${title}`);
  if (error) {
    console.error(`    ${colors.red}Details:${colors.reset}`, error);
  }
}

async function request(baseUrl, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runProductTests() {
  console.log(`\n${colors.cyan}${colors.bold}==============================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}   Section 02 Category & Product Test Suite   ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}==============================================${colors.reset}\n`);

  console.log('Connecting to database & preparing seed data...');
  await connectDB();
  await seedAdmin();
  await seedCategoriesAndProducts();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running at ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;

  let adminToken = '';
  let customerToken = '';
  let createdCategoryId = '';
  let createdProductId = '';

  try {
    // Setup 1: Log in Admin
    const adminLoginRes = await request(baseUrl, '/auth/login', {
      method: 'POST',
      body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
    });
    adminToken = adminLoginRes.data.data.token;

    // Setup 2: Register & Log in Customer
    const testCustomerEmail = `cust_prod_test_${Date.now()}@example.com`;
    const customerRegRes = await request(baseUrl, '/auth/register', {
      method: 'POST',
      body: { name: 'Test Customer', email: testCustomerEmail, password: 'Password123!' },
    });
    customerToken = customerRegRes.data.data.token;

    // Test 1: Create Category
    try {
      const categoryName = `Test Category ${Date.now()}`;
      const res = await request(baseUrl, '/categories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: categoryName,
          description: 'Special testing category for hardware products',
        },
      });

      if (
        res.status === 201 &&
        res.data.success === true &&
        res.data.data.category.name === categoryName &&
        typeof res.data.data.category.slug === 'string'
      ) {
        pass('1. Admin can create category with auto-generated slug (status 201)');
        passed++;
        createdCategoryId = res.data.data.category._id;
      } else {
        throw new Error(`Unexpected response: status=${res.status}, body=${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      fail('1. Admin can create category', err.message);
      failed++;
    }

    // Test 2: Create Product
    try {
      const productName = `Premium Wireless Scanner ${Date.now()}`;
      const res = await request(baseUrl, '/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: productName,
          description: 'High performance Bluetooth 2D barcode imager',
          categoryId: createdCategoryId,
          price: 199.99,
          imageUrl: 'https://example.com/scanner.jpg',
          stockQuantity: 50,
          isActive: true,
        },
      });

      if (
        res.status === 201 &&
        res.data.success === true &&
        res.data.data.product.price === 199.99 &&
        res.data.data.product.stockQuantity === 50 &&
        res.data.data.product.reservedQuantity === 0 &&
        res.data.data.product.availableStock === 50 &&
        res.data.data.product.isActive === true
      ) {
        pass('2. Admin can create product with initial availableStock = stockQuantity (status 201)');
        passed++;
        createdProductId = res.data.data.product._id;
      } else {
        throw new Error(`Unexpected response: status=${res.status}, body=${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      fail('2. Admin can create product', err.message);
      failed++;
    }

    // Test 3: Update Product
    try {
      const updatedPrice = 179.5;
      const updatedStock = 60;
      const res = await request(baseUrl, `/products/${createdProductId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          price: updatedPrice,
          stockQuantity: updatedStock,
        },
      });

      if (
        res.status === 200 &&
        res.data.success === true &&
        res.data.data.product.price === updatedPrice &&
        res.data.data.product.stockQuantity === updatedStock &&
        res.data.data.product.availableStock === updatedStock
      ) {
        pass('3. Admin can update product details and stock (status 200)');
        passed++;
      } else {
        throw new Error(`Unexpected response: status=${res.status}, body=${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      fail('3. Admin can update product', err.message);
      failed++;
    }

    // Test 4: Deactivate Product (Soft Delete)
    try {
      const res = await request(baseUrl, `/products/${createdProductId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (
        res.status === 200 &&
        res.data.success === true &&
        res.data.data.product.isActive === false
      ) {
        pass('4. Product soft-deactivation works (isActive = false, status 200)');
        passed++;
      } else {
        throw new Error(`Unexpected response: status=${res.status}, body=${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      fail('4. Product deactivation works', err.message);
      failed++;
    }

    // Test 5: Invalid Price (Negative Price Rejected)
    try {
      const res = await request(baseUrl, '/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: 'Invalid Price Item',
          categoryId: createdCategoryId,
          price: -45.0,
          stockQuantity: 10,
        },
      });

      if (res.status === 400 && res.data.success === false) {
        pass('5. Negative price rejected with 400 Bad Request');
        passed++;
      } else {
        throw new Error(`Expected 400 but got status=${res.status}`);
      }
    } catch (err) {
      fail('5. Negative price rejected', err.message);
      failed++;
    }

    // Test 6: Invalid Stock (Negative Stock Rejected)
    try {
      const res = await request(baseUrl, '/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: 'Invalid Stock Item',
          categoryId: createdCategoryId,
          price: 99.0,
          stockQuantity: -20,
        },
      });

      if (res.status === 400 && res.data.success === false) {
        pass('6. Negative stockQuantity rejected with 400 Bad Request');
        passed++;
      } else {
        throw new Error(`Expected 400 but got status=${res.status}`);
      }
    } catch (err) {
      fail('6. Negative stockQuantity rejected', err.message);
      failed++;
    }

    // Test 7: Inventory Calculation (availableStock = stockQuantity - reservedQuantity)
    try {
      // Direct update in DB simulating reservations
      await Product.findByIdAndUpdate(createdProductId, {
        stockQuantity: 100,
        reservedQuantity: 35,
      });

      const res = await request(baseUrl, `/products/${createdProductId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const product = res.data.data.product;
      const expectedAvailable = 100 - 35; // 65

      if (
        res.status === 200 &&
        product.stockQuantity === 100 &&
        product.reservedQuantity === 35 &&
        product.availableStock === expectedAvailable
      ) {
        pass('7. availableStock accurately calculates (100 stock - 35 reserved = 65 available)');
        passed++;
      } else {
        throw new Error(
          `Expected availableStock=${expectedAvailable}, got ${product.availableStock} (stock=${product.stockQuantity}, reserved=${product.reservedQuantity})`
        );
      }
    } catch (err) {
      fail('7. Inventory calculation formula', err.message);
      failed++;
    }

    // Test 8: Admin Access to Stats & Telemetry
    try {
      const res = await request(baseUrl, '/products/stats', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (
        res.status === 200 &&
        res.data.success === true &&
        typeof res.data.data.stats.totalProducts === 'number' &&
        typeof res.data.data.stats.totalStock === 'number' &&
        typeof res.data.data.stats.totalAvailable === 'number'
      ) {
        pass('8. Admin can access /api/products/stats inventory telemetry (status 200)');
        passed++;
      } else {
        throw new Error(`Unexpected stats response: status=${res.status}`);
      }
    } catch (err) {
      fail('8. Admin access to stats', err.message);
      failed++;
    }

    // Test 9: Customer Blocked from Admin Actions (403 Forbidden)
    try {
      const res = await request(baseUrl, '/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          name: 'Hacker Product',
          categoryId: createdCategoryId,
          price: 10.0,
          stockQuantity: 100,
        },
      });

      if (res.status === 403 && res.data.success === false) {
        pass('9. Customer blocked from creating product (status 403 Forbidden)');
        passed++;
      } else {
        throw new Error(`Expected 403 Forbidden but got status=${res.status}`);
      }
    } catch (err) {
      fail('9. Customer blocked from admin actions', err.message);
      failed++;
    }

    // Test 10: Unauthenticated Request Blocked (401 Unauthorized)
    try {
      const res = await request(baseUrl, '/products', {
        method: 'POST',
        body: {
          name: 'Anonymous Product',
          categoryId: createdCategoryId,
          price: 10.0,
          stockQuantity: 10,
        },
      });

      if (res.status === 401 && res.data.success === false) {
        pass('10. Unauthenticated product creation rejected (status 401 Unauthorized)');
        passed++;
      } else {
        throw new Error(`Expected 401 Unauthorized but got status=${res.status}`);
      }
    } catch (err) {
      fail('10. Unauthenticated request blocked', err.message);
      failed++;
    }
  } finally {
    server.close();
  }

  console.log(`\n${colors.bold}----------------------------------------------${colors.reset}`);
  console.log(`Total: 10 | Passed: ${colors.green}${passed}${colors.reset} | Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
  console.log(`${colors.bold}----------------------------------------------${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runProductTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
