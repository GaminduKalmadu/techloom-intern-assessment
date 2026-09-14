const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const Reservation = require('../src/models/Reservation');
const seedAdmin = require('../src/scripts/seedAdmin');
const seedCategoriesAndProducts = require('../src/scripts/seedCategories');
const { expireOverdueReservations } = require('../src/services/reservationExpiry.service');

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

const runCheckoutTestSuite = async () => {
  console.log('\n======================================================');
  console.log('   Section 02 Checkout & Stock Reservation Test Suite ');
  console.log('======================================================\n');

  await connectDB();
  await seedAdmin();
  await seedCategoriesAndProducts();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running at http://localhost:${port}/api\n`);

  let tokenA, userA;
  let tokenB, userB;
  let testCat;
  let prodMulti;
  let prodScarce;
  let prodZero;

  const results = [];

  try {
    // SETUP: Register two test customers
    const emailA = `customer.a.${Date.now()}@checkout-test.com`;
    const emailB = `customer.b.${Date.now()}@checkout-test.com`;

    const regResA = await makeRequest(port, '/api/auth/register', 'POST', {
      name: 'Customer A',
      email: emailA,
      password: 'Password123!',
    });
    tokenA = regResA.data.data.token;
    userA = regResA.data.data.user;

    const regResB = await makeRequest(port, '/api/auth/register', 'POST', {
      name: 'Customer B',
      email: emailB,
      password: 'Password123!',
    });
    tokenB = regResB.data.data.token;
    userB = regResB.data.data.user;

    // SETUP: Create test products
    testCat = await Category.findOne({ name: 'Audio' });
    if (!testCat) {
      testCat = await Category.create({ name: 'Audio', description: 'Audio devices' });
    }

    prodMulti = await Product.create({
      name: `Multi-Stock Headset ${Date.now()}`,
      description: 'Plentiful stock headphones',
      categoryId: testCat._id,
      price: 150,
      stockQuantity: 10,
      reservedQuantity: 0,
      isActive: true,
    });

    prodScarce = await Product.create({
      name: `Scarce Limited IEM ${Date.now()}`,
      description: 'Single unit scarce in-ear monitor',
      categoryId: testCat._id,
      price: 300,
      stockQuantity: 1,
      reservedQuantity: 0,
      isActive: true,
    });

    prodZero = await Product.create({
      name: `Out of Stock DAC ${Date.now()}`,
      description: 'Zero stock DAC amplifier',
      categoryId: testCat._id,
      price: 200,
      stockQuantity: 0,
      reservedQuantity: 0,
      isActive: true,
    });

    let normalCheckoutOrderId = null;
    let normalCheckoutReservationId = null;

    // ----------------------------------------------------
    // TEST 1: Normal Checkout Flow
    // ----------------------------------------------------
    results.push(
      await runTest('1. Normal checkout creates RESERVED order and ACTIVE reservation', async () => {
        // Customer A adds 2 units of prodMulti
        const addRes = await makeRequest(
          port,
          '/api/cart/items',
          'POST',
          { productId: prodMulti._id.toString(), quantity: 2 },
          { Authorization: `Bearer ${tokenA}` }
        );
        if (addRes.status !== 200 && addRes.status !== 201) {
          throw new Error(`Failed to add item to cart: ${addRes.data?.message}`);
        }

        // Call Checkout
        const checkoutRes = await makeRequest(
          port,
          '/api/checkout',
          'POST',
          {},
          { Authorization: `Bearer ${tokenA}` }
        );

        if (checkoutRes.status !== 201) {
          throw new Error(`Expected 201 Created, received ${checkoutRes.status}: ${checkoutRes.data?.message}`);
        }

        const data = checkoutRes.data?.data;
        if (!data?.orderId || !data?.reservationId || !data?.expiresAt) {
          throw new Error('Checkout response missing orderId, reservationId, or expiresAt');
        }

        if (data.total !== 300) {
          throw new Error(`Expected total 300, got ${data.total}`);
        }

        normalCheckoutOrderId = data.orderId;
        normalCheckoutReservationId = data.reservationId;

        // Verify Order in DB
        const order = await Order.findById(data.orderId);
        if (!order || order.status !== 'RESERVED' || order.paymentStatus !== 'PENDING') {
          throw new Error(`Order state invalid: status=${order?.status}, paymentStatus=${order?.paymentStatus}`);
        }

        // Verify Reservation in DB
        const reservation = await Reservation.findById(data.reservationId);
        if (!reservation || reservation.status !== 'ACTIVE') {
          throw new Error(`Reservation status invalid: ${reservation?.status}`);
        }

        const expiryDiffMinutes = (new Date(reservation.expiresAt) - new Date()) / (1000 * 60);
        if (expiryDiffMinutes < 4.5 || expiryDiffMinutes > 5.5) {
          throw new Error(`Reservation expiresAt should be ~5 min from now, got diff ${expiryDiffMinutes.toFixed(2)} min`);
        }

        // Verify Cart in DB transitioned to CHECKOUT
        const cartId = addRes.data?.data?.cart?._id || addRes.data?.data?._id;
        const cart = cartId
          ? await Cart.findById(cartId)
          : await Cart.findOne({ userId: userA._id, status: 'CHECKOUT' });
        if (!cart || cart.status !== 'CHECKOUT') {
          throw new Error(`Expected cart status CHECKOUT, got ${cart?.status}`);
        }

        // Verify Product reservedQuantity updated atomically
        const updatedProd = await Product.findById(prodMulti._id);
        if (updatedProd.reservedQuantity !== 2 || updatedProd.stockQuantity !== 10) {
          throw new Error(
            `Product reservedQuantity expected 2, got ${updatedProd.reservedQuantity}. stockQuantity expected 10, got ${updatedProd.stockQuantity}`
          );
        }
      })
    );

    // ----------------------------------------------------
    // TEST 2: Insufficient Stock
    // ----------------------------------------------------
    results.push(
      await runTest('2. Insufficient stock rejects checkout with 409 Conflict', async () => {
        // Customer B creates cart with requested quantity 15 (stock is 10, reserved is 2, available is 8)
        // Directly inject item into cart or update
        await Cart.deleteMany({ userId: userB._id });
        await Cart.create({
          userId: userB._id,
          status: 'ACTIVE',
          items: [{ productId: prodMulti._id, quantity: 15 }],
        });

        const checkoutRes = await makeRequest(
          port,
          '/api/checkout',
          'POST',
          {},
          { Authorization: `Bearer ${tokenB}` }
        );

        if (checkoutRes.status !== 409) {
          throw new Error(`Expected 409 Conflict, received ${checkoutRes.status}: ${checkoutRes.data?.message}`);
        }

        // Verify no order was created for Customer B
        const orderCount = await Order.countDocuments({ userId: userB._id });
        if (orderCount !== 0) {
          throw new Error('Order should not have been created for failed checkout');
        }

        // Verify product reservedQuantity was untouched
        const prod = await Product.findById(prodMulti._id);
        if (prod.reservedQuantity !== 2) {
          throw new Error(`Reserved quantity should remain 2, got ${prod.reservedQuantity}`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 3: Final Item Concurrent Checkout (Race Condition)
    // ----------------------------------------------------
    results.push(
      await runTest('3. Final item concurrent checkout: exactly one succeeds (409 on second)', async () => {
        // Prepare Customer A and Customer B active carts each holding the 1 scarce item
        await Cart.deleteMany({ userId: { $in: [userA._id, userB._id] }, status: 'ACTIVE' });

        await Cart.create({
          userId: userA._id,
          status: 'ACTIVE',
          items: [{ productId: prodScarce._id, quantity: 1 }],
        });

        await Cart.create({
          userId: userB._id,
          status: 'ACTIVE',
          items: [{ productId: prodScarce._id, quantity: 1 }],
        });

        // Fire both checkout requests concurrently
        const [resA, resB] = await Promise.all([
          makeRequest(port, '/api/checkout', 'POST', {}, { Authorization: `Bearer ${tokenA}` }),
          makeRequest(port, '/api/checkout', 'POST', {}, { Authorization: `Bearer ${tokenB}` }),
        ]);

        const statuses = [resA.status, resB.status];
        const successCount = statuses.filter((s) => s === 201).length;
        const conflictCount = statuses.filter((s) => s === 409).length;

        if (successCount !== 1 || conflictCount !== 1) {
          throw new Error(
            `Expected exactly 1 success (201) and 1 conflict (409). Got resA=${resA.status}, resB=${resB.status}`
          );
        }

        // Verify that Scarce product reservedQuantity is exactly 1 (never oversold to 2)
        const scarceInDb = await Product.findById(prodScarce._id);
        if (scarceInDb.reservedQuantity !== 1) {
          throw new Error(`Reserved quantity expected 1, but got ${scarceInDb.reservedQuantity}`);
        }

        if (scarceInDb.stockQuantity !== 1) {
          throw new Error(`Stock quantity modified unexpectedly: ${scarceInDb.stockQuantity}`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 4 & 5: Multi-Product Checkout Partial Failure & Complete Rollback
    // ----------------------------------------------------
    results.push(
      await runTest('4 & 5. Multi-product checkout failure guarantees complete rollback', async () => {
        // Customer B has a cart with:
        // - 1 unit of prodMulti (which has 8 units available)
        // - 1 unit of prodZero (which has 0 units available)
        await Cart.deleteMany({ userId: userB._id, status: 'ACTIVE' });
        await Cart.create({
          userId: userB._id,
          status: 'ACTIVE',
          items: [
            { productId: prodMulti._id, quantity: 1 },
            { productId: prodZero._id, quantity: 1 },
          ],
        });

        const prodMultiBefore = await Product.findById(prodMulti._id);
        const initialReserved = prodMultiBefore.reservedQuantity; // 2

        const checkoutRes = await makeRequest(
          port,
          '/api/checkout',
          'POST',
          {},
          { Authorization: `Bearer ${tokenB}` }
        );

        if (checkoutRes.status !== 409) {
          throw new Error(`Expected 409 Conflict, received ${checkoutRes.status}: ${checkoutRes.data?.message}`);
        }

        // Verify Complete Rollback:
        // 1. prodMulti's reservedQuantity must not have increased
        const prodMultiAfter = await Product.findById(prodMulti._id);
        if (prodMultiAfter.reservedQuantity !== initialReserved) {
          throw new Error(
            `prodMulti was not rolled back! Initial: ${initialReserved}, After: ${prodMultiAfter.reservedQuantity}`
          );
        }

        // 2. prodZero must remain 0
        const prodZeroAfter = await Product.findById(prodZero._id);
        if (prodZeroAfter.reservedQuantity !== 0) {
          throw new Error(`prodZero reservedQuantity should be 0, got ${prodZeroAfter.reservedQuantity}`);
        }

        // 3. Cart remains ACTIVE
        const cartInDb = await Cart.findOne({ userId: userB._id, status: 'ACTIVE' });
        if (!cartInDb) {
          throw new Error('Cart should remain ACTIVE after transaction rollback');
        }
      })
    );

    // ----------------------------------------------------
    // TEST 6: 5-Minute Background Expiration
    // ----------------------------------------------------
    results.push(
      await runTest('6. 5-minute background expiration releases reserved inventory', async () => {
        if (!normalCheckoutReservationId) {
          throw new Error('Missing normalCheckoutReservationId from Test 1');
        }

        // Age the reservation from Test 1 so it is past expiresAt
        await Reservation.findByIdAndUpdate(normalCheckoutReservationId, {
          expiresAt: new Date(Date.now() - 5000), // 5 seconds in the past
        });

        const prodBefore = await Product.findById(prodMulti._id);
        const reservedBefore = prodBefore.reservedQuantity; // 2

        // Run expiration service
        const expiryResult = await expireOverdueReservations();

        if (expiryResult.processedCount < 1) {
          throw new Error(`Expected at least 1 reservation expired, got ${expiryResult.processedCount}`);
        }

        // Verify Reservation status is EXPIRED
        const resInDb = await Reservation.findById(normalCheckoutReservationId);
        if (resInDb.status !== 'EXPIRED') {
          throw new Error(`Reservation status expected EXPIRED, got ${resInDb.status}`);
        }

        // Verify Order status is EXPIRED and paymentStatus is TIMEOUT
        const orderInDb = await Order.findById(normalCheckoutOrderId);
        if (orderInDb.status !== 'EXPIRED' || orderInDb.paymentStatus !== 'TIMEOUT') {
          throw new Error(
            `Order expected EXPIRED/TIMEOUT, got status=${orderInDb.status}, paymentStatus=${orderInDb.paymentStatus}`
          );
        }

        // Verify Product reservedQuantity was decremented by 2
        const prodAfter = await Product.findById(prodMulti._id);
        if (prodAfter.reservedQuantity !== reservedBefore - 2) {
          throw new Error(
            `Reserved quantity should have decremented from ${reservedBefore} to ${reservedBefore - 2}, got ${prodAfter.reservedQuantity}`
          );
        }

        // Verify stockQuantity is unaltered
        if (prodAfter.stockQuantity !== 10) {
          throw new Error(`stockQuantity should remain 10, got ${prodAfter.stockQuantity}`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 7: Stock Becomes Available Again
    // ----------------------------------------------------
    results.push(
      await runTest('7. Stock becomes available again after expiration and can be checked out', async () => {
        // Also age the scarce item reservation (from Test 3) so it expires
        const scarceReservation = await Reservation.findOne({
          'items.productId': prodScarce._id,
          status: 'ACTIVE',
        });

        if (scarceReservation) {
          await Reservation.findByIdAndUpdate(scarceReservation._id, {
            expiresAt: new Date(Date.now() - 5000),
          });
          await expireOverdueReservations();
        }

        // Verify Scarce item is now available again
        const scarceProd = await Product.findById(prodScarce._id);
        if (scarceProd.reservedQuantity !== 0 || scarceProd.availableStock !== 1) {
          throw new Error(
            `Scarce product stock was not restored! reservedQuantity=${scarceProd.reservedQuantity}, availableStock=${scarceProd.availableStock}`
          );
        }

        // Customer A can now add and checkout the restored scarce item
        await Cart.deleteMany({ userId: userA._id });
        await Cart.create({
          userId: userA._id,
          status: 'ACTIVE',
          items: [{ productId: prodScarce._id, quantity: 1 }],
        });

        const reCheckoutRes = await makeRequest(
          port,
          '/api/checkout',
          'POST',
          {},
          { Authorization: `Bearer ${tokenA}` }
        );

        if (reCheckoutRes.status !== 201) {
          throw new Error(`Expected 201 Created on re-checkout, received ${reCheckoutRes.status}: ${reCheckoutRes.data?.message}`);
        }

        const freshProd = await Product.findById(prodScarce._id);
        if (freshProd.reservedQuantity !== 1) {
          throw new Error(`Scarce product should now be reserved (1), got ${freshProd.reservedQuantity}`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 8: Repeated Checkout Request Safety
    // ----------------------------------------------------
    results.push(
      await runTest('8. Repeated checkout on already-processed cart is rejected safely', async () => {
        // Customer A just checked out their cart in Test 7.
        // Firing checkout again immediately on that same user should reject because cart is now in CHECKOUT status.
        const repeatRes = await makeRequest(
          port,
          '/api/checkout',
          'POST',
          {},
          { Authorization: `Bearer ${tokenA}` }
        );

        if (repeatRes.status !== 400) {
          throw new Error(`Expected 400 Bad Request on duplicate checkout, received ${repeatRes.status}`);
        }
      })
    );

    console.log('\n------------------------------------------------------');
    const allPassed = results.every((r) => r === true);
    if (allPassed) {
      console.log(` ALL ${results.length} CHECKOUT & CONCURRENCY TESTS PASSED! `);
    } else {
      console.error(` ✘ SOME TESTS FAILED (${results.filter((r) => !r).length} failures) `);
    }
    console.log('------------------------------------------------------\n');

    server.close();
    await mongoose.disconnect();
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('[Test Suite Error]', err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runCheckoutTestSuite();
