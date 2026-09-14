const http = require('http');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const seedAdmin = require('../src/scripts/seedAdmin');
const env = require('../src/config/env');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
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

async function runAuthTests() {
  console.log(`\n${colors.cyan}${colors.bold}========================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}   Section 02 Auth & RBAC Test Suite   ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}========================================${colors.reset}\n`);

  // 1. Connect DB & Seed Admin
  console.log('Connecting to database...');
  await connectDB();
  await seedAdmin();

  // 2. Start server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running at ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;

  const testEmail = `customer_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let customerToken = '';
  let adminToken = '';

  try {
    // Test 1: Customer Registration Works
    try {
      const res = await request(baseUrl, '/auth/register', {
        method: 'POST',
        body: {
          name: 'Jane Customer',
          email: testEmail,
          password: testPassword,
          role: 'ADMIN', // Try malicious injection of ADMIN role
        },
      });

      if (
        res.status === 201 &&
        res.data.success === true &&
        res.data.data.user.email === testEmail &&
        res.data.data.user.role === 'CUSTOMER' && // Role MUST be forced to CUSTOMER
        res.data.data.user.passwordHash === undefined && // No passwordHash returned
        typeof res.data.data.token === 'string'
      ) {
        pass('1. Customer registration works & enforces CUSTOMER role (status 201)');
        passed++;
        customerToken = res.data.data.token;
      } else {
        throw new Error(`Unexpected response: status=${res.status}, body=${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      fail('1. Customer registration works (status 201)', err.message);
      failed++;
    }

    // Test 2: Customer Login Works
    try {
      const res = await request(baseUrl, '/auth/login', {
        method: 'POST',
        body: {
          email: testEmail,
          password: testPassword,
        },
      });

      if (
        res.status === 200 &&
        res.data.success === true &&
        res.data.data.user.email === testEmail &&
        res.data.data.user.passwordHash === undefined &&
        typeof res.data.data.token === 'string'
      ) {
        pass('2. Customer login works (status 200)');
        passed++;
        customerToken = res.data.data.token;
      } else {
        throw new Error(`Unexpected response: status=${res.status}, body=${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      fail('2. Customer login works (status 200)', err.message);
      failed++;
    }

    // Test 3: GET /api/auth/me Works
    try {
      const res = await request(baseUrl, '/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      if (
        res.status === 200 &&
        res.data.success === true &&
        res.data.data.user.email === testEmail &&
        res.data.data.user.role === 'CUSTOMER' &&
        res.data.data.user.passwordHash === undefined
      ) {
        pass('3. GET /api/auth/me returns current user profile without passwordHash (status 200)');
        passed++;
      } else {
        throw new Error(`Unexpected response: status=${res.status}, body=${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      fail('3. GET /api/auth/me works (status 200)', err.message);
      failed++;
    }

    // Test 4: Invalid Login Fails
    try {
      const res = await request(baseUrl, '/auth/login', {
        method: 'POST',
        body: {
          email: testEmail,
          password: 'WrongPassword999!',
        },
      });

      if (res.status === 401 && res.data.success === false) {
        pass('4. Invalid login credentials rejected (status 401)');
        passed++;
      } else {
        throw new Error(`Expected 401 but got status=${res.status}`);
      }
    } catch (err) {
      fail('4. Invalid login fails (status 401)', err.message);
      failed++;
    }

    // Test 5: Duplicate Registration Fails
    try {
      const res = await request(baseUrl, '/auth/register', {
        method: 'POST',
        body: {
          name: 'Jane Duplicate',
          email: testEmail,
          password: testPassword,
        },
      });

      if (res.status === 409 && res.data.success === false) {
        pass('5. Duplicate email registration rejected (status 409 Conflict)');
        passed++;
      } else {
        throw new Error(`Expected 409 but got status=${res.status}`);
      }
    } catch (err) {
      fail('5. Duplicate registration fails (status 409)', err.message);
      failed++;
    }

    // Test 6: Customer Cannot Access Admin Route
    try {
      const res = await request(baseUrl, '/auth/admin-check', {
        method: 'GET',
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      if (res.status === 403 && res.data.success === false) {
        pass('6. Customer denied access to admin-only route (status 403 Forbidden)');
        passed++;
      } else {
        throw new Error(`Expected 403 but got status=${res.status}`);
      }
    } catch (err) {
      fail('6. Customer cannot access admin route (status 403)', err.message);
      failed++;
    }

    // Test 7: Admin Can Access Protected Admin Route
    try {
      // Login as seeded admin
      const adminLoginRes = await request(baseUrl, '/auth/login', {
        method: 'POST',
        body: {
          email: env.ADMIN_EMAIL,
          password: env.ADMIN_PASSWORD,
        },
      });

      if (
        adminLoginRes.status !== 200 ||
        !adminLoginRes.data.data ||
        adminLoginRes.data.data.user.role !== 'ADMIN'
      ) {
        throw new Error(`Admin login failed: status=${adminLoginRes.status}`);
      }

      adminToken = adminLoginRes.data.data.token;

      // Access admin-only route with admin token
      const adminCheckRes = await request(baseUrl, '/auth/admin-check', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (
        adminCheckRes.status === 200 &&
        adminCheckRes.data.success === true &&
        adminCheckRes.data.data.user.role === 'ADMIN'
      ) {
        pass('7. Seeded Admin (admin@gmail.com / 123456) successfully authorized for admin route (status 200)');
        passed++;
      } else {
        throw new Error(`Expected 200 but got status=${adminCheckRes.status}`);
      }
    } catch (err) {
      fail('7. Admin can access protected admin route (status 200)', err.message);
      failed++;
    }

    // Test 8: Unauthenticated / Invalid Token Fails
    try {
      const missingTokenRes = await request(baseUrl, '/auth/me', {
        method: 'GET',
      });

      const invalidTokenRes = await request(baseUrl, '/auth/me', {
        method: 'GET',
        headers: { Authorization: 'Bearer totally_fake_invalid_token_123' },
      });

      if (missingTokenRes.status === 401 && invalidTokenRes.status === 401) {
        pass('8. Missing and invalid tokens rejected by protect middleware (status 401)');
        passed++;
      } else {
        throw new Error(
          `Expected 401 for both, got missing=${missingTokenRes.status}, invalid=${invalidTokenRes.status}`
        );
      }
    } catch (err) {
      fail('8. Missing/invalid token fails (status 401)', err.message);
      failed++;
    }
  } finally {
    server.close();
  }

  console.log(`\n${colors.bold}----------------------------------------${colors.reset}`);
  console.log(`Total: 8 | Passed: ${colors.green}${passed}${colors.reset} | Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
  console.log(`${colors.bold}----------------------------------------${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
