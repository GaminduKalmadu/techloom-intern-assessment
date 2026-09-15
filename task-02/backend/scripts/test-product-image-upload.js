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

async function runTests() {
  console.log('\n======================================================');
  console.log('   Test: Product Device Image Upload (Max 10 MB)');
  console.log('======================================================\n');

  await connectDB();
  await seedAdmin();
  await seedCategoriesAndProducts();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running at http://localhost:${port}\n`);

  try {
    // 1. Authenticate Admin
    const loginRes = await makeRequest(port, '/api/auth/login', 'POST', {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    });

    if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
    }

    const adminToken = loginRes.data.data.token;
    console.log('✔ Admin authenticated successfully.');

    // 2. Get a valid category
    const cat = await Category.findOne({});
    if (!cat) throw new Error('No categories found.');
    console.log(`✔ Found category: ${cat.name} (${cat._id})`);

    // 3. Test: Create product with valid device image (< 10MB)
    // Create a 50KB mock PNG data URL
    const mockImageHeader = 'data:image/png;base64,';
    const mockBase64Content = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='.repeat(500);
    const validDataUrl = mockImageHeader + mockBase64Content;

    const createRes = await makeRequest(
      port,
      '/api/products',
      'POST',
      {
        name: 'Test Device Upload Product',
        description: 'Product created with device uploaded image',
        categoryId: cat._id.toString(),
        price: 99.99,
        stockQuantity: 15,
        imageUrl: validDataUrl,
        isActive: true,
      },
      { Authorization: `Bearer ${adminToken}` }
    );

    if (createRes.status === 201 && createRes.data?.data?.product?.imageUrl) {
      console.log('✔ PASS: Successfully created product with device image payload (< 10 MB)');
    } else {
      throw new Error(`Failed to create product with device image: ${JSON.stringify(createRes.data)}`);
    }

    const createdProductId = createRes.data.data.product._id;

    // 4. Test: Reject product creation when image exceeds 10 MB limit (e.g. ~11MB binary -> ~14.7MB base64)
    const elevenMbLength = 14.7 * 1024 * 1024; // ~14.7MB base64 = ~11MB binary
    const elevenMbMockDataUrl = 'data:image/png;base64,' + 'A'.repeat(Math.floor(elevenMbLength));

    const oversizedRes = await makeRequest(
      port,
      '/api/products',
      'POST',
      {
        name: 'Oversized Image Product',
        description: 'Should be rejected by 10MB controller guard',
        categoryId: cat._id.toString(),
        price: 49.99,
        stockQuantity: 10,
        imageUrl: elevenMbMockDataUrl,
        isActive: true,
      },
      { Authorization: `Bearer ${adminToken}` }
    );

    if (oversizedRes.status === 400 && oversizedRes.data?.message?.includes('10 MB')) {
      console.log(`✔ PASS: Correctly rejected oversized image (> 10 MB) with 400: "${oversizedRes.data.message}"`);
    } else {
      throw new Error(`Expected 400 for 11MB image, got status=${oversizedRes.status}: ${JSON.stringify(oversizedRes.data)}`);
    }

    // 5. Cleanup test product
    await Product.findByIdAndDelete(createdProductId);
    console.log('✔ Test product cleaned up successfully.');

    console.log('\n======================================================');
    console.log('   All 10MB Image Upload Backend Tests Passed! 🎉');
    console.log('======================================================\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
