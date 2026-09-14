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
const Payment = require('../src/models/Payment');
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

const runPaymentTestSuite = async () => {
  console.log('\n======================================================');
  console.log('   Section 02 Mock Payment Gateway Test Suite         ');
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

  const results = [];

  try {
    // SETUP: Register two test customers
    const emailA = `pay.customer.a.${Date.now()}@test.com`;
    const emailB = `pay.customer.b.${Date.now()}@test.com`;

    const regA = await makeRequest(port, '/api/auth/register', 'POST', {
      name: 'Payment Customer A',
      email: emailA,
      password: 'Password123!',
    });
    tokenA = regA.data.data.token;
    userA = regA.data.data.user;

    const regB = await makeRequest(port, '/api/auth/register', 'POST', {
      name: 'Payment Customer B',
      email: emailB,
      password: 'Password123!',
    });
    tokenB = regB.data.data.token;
    userB = regB.data.data.user;

    testCat = await Category.findOne();

    // Helper to create a reserved order
    const createReservedOrder = async (token, product, quantity = 1) => {
      // 1. Add item to cart
      await makeRequest(
        port,
        '/api/cart/items',
        'POST',
        { productId: product._id.toString(), quantity },
        { Authorization: `Bearer ${token}` }
      );

      // 2. Checkout
      const checkoutRes = await makeRequest(
        port,
        '/api/checkout',
        'POST',
        {},
        { Authorization: `Bearer ${token}` }
      );

      if (checkoutRes.status !== 201) {
        throw new Error(`Checkout failed: ${checkoutRes.data?.message}`);
      }

      return checkoutRes.data.data; // { orderId, reservationId, total, expiresAt }
    };

    // Products for each test scenario
    const prodSuccess = await Product.create({
      name: `Headphones Success Test ${Date.now()}`,
      categoryId: testCat._id,
      price: 100,
      stockQuantity: 10,
      reservedQuantity: 0,
      isActive: true,
    });

    const prodFailed = await Product.create({
      name: `Speaker Failed Test ${Date.now()}`,
      categoryId: testCat._id,
      price: 80,
      stockQuantity: 5,
      reservedQuantity: 0,
      isActive: true,
    });

    const prodTimeout = await Product.create({
      name: `Mic Timeout Test ${Date.now()}`,
      categoryId: testCat._id,
      price: 60,
      stockQuantity: 7,
      reservedQuantity: 0,
      isActive: true,
    });

    let successOrderId;
    const successIdempotencyKey = `idemp-success-${Date.now()}`;

    // ----------------------------------------------------
    // TEST 1: Payment SUCCESS (4111 1111 1111 1111)
    // ----------------------------------------------------
    results.push(
      await runTest('1. Payment SUCCESS (Order CONFIRMED, stockQuantity & reservedQuantity deducted)', async () => {
        // Customer A reserves 2 units of prodSuccess
        const checkoutData = await createReservedOrder(tokenA, prodSuccess, 2);
        successOrderId = checkoutData.orderId;

        // Verify pre-payment DB state
        const preProd = await Product.findById(prodSuccess._id);
        if (preProd.stockQuantity !== 10 || preProd.reservedQuantity !== 2) {
          throw new Error(`Pre-pay product stock invalid: stock=${preProd.stockQuantity}, reserved=${preProd.reservedQuantity}`);
        }

        // Call Payment API with SUCCESS card
        const payRes = await makeRequest(
          port,
          '/api/payments',
          'POST',
          {
            orderId: successOrderId,
            cardNumber: '4111 1111 1111 1111',
            cardholderName: 'Jane Customer',
            expiryDate: '12/28',
            cvv: '123',
            idempotencyKey: successIdempotencyKey,
          },
          { Authorization: `Bearer ${tokenA}` }
        );

        if (payRes.status !== 200 || !payRes.data?.success) {
          throw new Error(`Expected 200 SUCCESS, got ${payRes.status}: ${payRes.data?.message}`);
        }

        if (!payRes.data.data?.transactionReference) {
          throw new Error('Response missing transactionReference');
        }

        // Verify Payment in DB
        const payment = await Payment.findById(payRes.data.data.paymentId);
        if (!payment || payment.status !== 'SUCCESS' || payment.amount !== 200) {
          throw new Error(`Payment DB record invalid: status=${payment?.status}, amount=${payment?.amount}`);
        }

        // Verify Order in DB
        const order = await Order.findById(successOrderId);
        if (order.status !== 'CONFIRMED' || order.paymentStatus !== 'SUCCESS') {
          throw new Error(`Order DB status invalid: status=${order?.status}, paymentStatus=${order?.paymentStatus}`);
        }

        // Verify Reservation in DB
        const reservation = await Reservation.findById(checkoutData.reservationId);
        if (reservation.status !== 'COMPLETED') {
          throw new Error(`Reservation DB status invalid: status=${reservation?.status}`);
        }

        // Verify Product stock reduction: stockQuantity 10 -> 8, reservedQuantity 2 -> 0
        const postProd = await Product.findById(prodSuccess._id);
        if (postProd.stockQuantity !== 8 || postProd.reservedQuantity !== 0) {
          throw new Error(
            `Product inventory incorrect after SUCCESS. Expected stock=8, reserved=0. Got stock=${postProd.stockQuantity}, reserved=${postProd.reservedQuantity}`
          );
        }
      })
    );

    // ----------------------------------------------------
    // TEST 2: Payment FAILED (4000 0000 0000 0002)
    // ----------------------------------------------------
    results.push(
      await runTest('2. Payment FAILED (Order FAILED, Reservation RELEASED, stockQuantity unchanged)', async () => {
        // Customer A reserves 1 unit of prodFailed (stock: 5, reserved: 0)
        const checkoutData = await createReservedOrder(tokenA, prodFailed, 1);
        const orderId = checkoutData.orderId;

        // Verify pre-pay product stock
        const preProd = await Product.findById(prodFailed._id);
        if (preProd.stockQuantity !== 5 || preProd.reservedQuantity !== 1) {
          throw new Error(`Pre-pay product stock invalid: stock=${preProd.stockQuantity}, reserved=${preProd.reservedQuantity}`);
        }

        // Call Payment with FAILED card
        const payRes = await makeRequest(
          port,
          '/api/payments',
          'POST',
          {
            orderId,
            cardNumber: '4000 0000 0000 0002',
            cardholderName: 'Jane Customer',
            expiryDate: '12/28',
            cvv: '123',
            idempotencyKey: `idemp-fail-${Date.now()}`,
          },
          { Authorization: `Bearer ${tokenA}` }
        );

        if (payRes.data?.data?.status !== 'FAILED') {
          throw new Error(`Expected FAILED status, got ${payRes.data?.data?.status}`);
        }

        // Verify Order in DB
        const order = await Order.findById(orderId);
        if (order.status !== 'FAILED' || order.paymentStatus !== 'FAILED') {
          throw new Error(`Order state invalid: status=${order?.status}, paymentStatus=${order?.paymentStatus}`);
        }

        // Verify Reservation in DB
        const reservation = await Reservation.findById(checkoutData.reservationId);
        if (reservation.status !== 'RELEASED') {
          throw new Error(`Reservation expected RELEASED, got ${reservation?.status}`);
        }

        // Verify Product stock: reservedQuantity released to 0, stockQuantity unchanged at 5
        const postProd = await Product.findById(prodFailed._id);
        if (postProd.stockQuantity !== 5 || postProd.reservedQuantity !== 0) {
          throw new Error(
            `Product inventory incorrect after FAILED. Expected stock=5, reserved=0. Got stock=${postProd.stockQuantity}, reserved=${postProd.reservedQuantity}`
          );
        }
      })
    );

    // ----------------------------------------------------
    // TEST 3: Payment TIMEOUT (4000 0000 0000 9995)
    // ----------------------------------------------------
    results.push(
      await runTest('3. Payment TIMEOUT (Order EXPIRED, Reservation EXPIRED, stockQuantity unchanged)', async () => {
        // Customer A reserves 1 unit of prodTimeout (stock: 7, reserved: 0)
        const checkoutData = await createReservedOrder(tokenA, prodTimeout, 1);
        const orderId = checkoutData.orderId;

        // Verify pre-pay product stock
        const preProd = await Product.findById(prodTimeout._id);
        if (preProd.stockQuantity !== 7 || preProd.reservedQuantity !== 1) {
          throw new Error(`Pre-pay product stock invalid: stock=${preProd.stockQuantity}, reserved=${preProd.reservedQuantity}`);
        }

        // Call Payment with TIMEOUT card
        const payRes = await makeRequest(
          port,
          '/api/payments',
          'POST',
          {
            orderId,
            cardNumber: '4000 0000 0000 9995',
            cardholderName: 'Jane Customer',
            expiryDate: '12/28',
            cvv: '123',
            idempotencyKey: `idemp-timeout-${Date.now()}`,
          },
          { Authorization: `Bearer ${tokenA}` }
        );

        if (payRes.data?.data?.status !== 'TIMEOUT') {
          throw new Error(`Expected TIMEOUT status, got ${payRes.data?.data?.status}`);
        }

        // Verify Order in DB
        const order = await Order.findById(orderId);
        if (order.status !== 'EXPIRED' || order.paymentStatus !== 'TIMEOUT') {
          throw new Error(`Order state invalid: status=${order?.status}, paymentStatus=${order?.paymentStatus}`);
        }

        // Verify Reservation in DB
        const reservation = await Reservation.findById(checkoutData.reservationId);
        if (reservation.status !== 'EXPIRED') {
          throw new Error(`Reservation expected EXPIRED, got ${reservation?.status}`);
        }

        // Verify Product stock: reservedQuantity released to 0, stockQuantity unchanged at 7
        const postProd = await Product.findById(prodTimeout._id);
        if (postProd.stockQuantity !== 7 || postProd.reservedQuantity !== 0) {
          throw new Error(
            `Product inventory incorrect after TIMEOUT. Expected stock=7, reserved=0. Got stock=${postProd.stockQuantity}, reserved=${postProd.reservedQuantity}`
          );
        }
      })
    );

    // ----------------------------------------------------
    // TEST 4: Same idempotencyKey Twice
    // ----------------------------------------------------
    results.push(
      await runTest('4. Same idempotencyKey returns safe response without duplicate processing', async () => {
        const repeatRes = await makeRequest(
          port,
          '/api/payments',
          'POST',
          {
            orderId: successOrderId,
            cardNumber: '4111 1111 1111 1111',
            cardholderName: 'Jane Customer',
            expiryDate: '12/28',
            cvv: '123',
            idempotencyKey: successIdempotencyKey,
          },
          { Authorization: `Bearer ${tokenA}` }
        );

        if (repeatRes.status !== 200) {
          throw new Error(`Expected 200 OK, got ${repeatRes.status}`);
        }

        if (!repeatRes.data?.message?.includes('already been paid')) {
          throw new Error(`Expected "This order has already been paid", got message: ${repeatRes.data?.message}`);
        }

        // Verify only 1 payment record exists for this idempotencyKey
        const count = await Payment.countDocuments({ idempotencyKey: successIdempotencyKey });
        if (count !== 1) {
          throw new Error(`Expected exactly 1 payment record, found ${count}`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 5: Double-Click Pay (Concurrent Payment Race)
    // ----------------------------------------------------
    results.push(
      await runTest('5. Double-click pay protection: only one payment succeeds, no double inventory deduction', async () => {
        const prodDouble = await Product.create({
          name: `Double Click Test Prod ${Date.now()}`,
          categoryId: testCat._id,
          price: 50,
          stockQuantity: 10,
          reservedQuantity: 0,
          isActive: true,
        });

        // Customer A reserves 1 unit
        const checkoutData = await createReservedOrder(tokenA, prodDouble, 1);
        const orderId = checkoutData.orderId;

        // Simulate simultaneous double-click pay
        const [res1, res2] = await Promise.all([
          makeRequest(
            port,
            '/api/payments',
            'POST',
            {
              orderId,
              cardNumber: '4111 1111 1111 1111',
              cardholderName: 'Jane Customer',
              expiryDate: '12/28',
              cvv: '123',
              idempotencyKey: `idemp-dc-1-${Date.now()}`,
            },
            { Authorization: `Bearer ${tokenA}` }
          ),
          makeRequest(
            port,
            '/api/payments',
            'POST',
            {
              orderId,
              cardNumber: '4111 1111 1111 1111',
              cardholderName: 'Jane Customer',
              expiryDate: '12/28',
              cvv: '123',
              idempotencyKey: `idemp-dc-2-${Date.now()}`,
            },
            { Authorization: `Bearer ${tokenA}` }
          ),
        ]);

        const messages = [res1.data?.message, res2.data?.message];
        const hasSuccess = messages.some((m) => m?.includes('processed successfully'));
        const hasAlreadyPaid = messages.some((m) => m?.includes('already been paid') || m?.includes('no longer in RESERVED'));

        if (!hasSuccess) {
          throw new Error(`Neither request processed successfully: res1=${JSON.stringify(res1.data)}, res2=${JSON.stringify(res2.data)}`);
        }

        // CRITICAL CONCURRENCY CHECK: Stock was deducted exactly ONCE (10 -> 9, NOT 8)
        const finalProd = await Product.findById(prodDouble._id);
        if (finalProd.stockQuantity !== 9 || finalProd.reservedQuantity !== 0) {
          throw new Error(
            `Stock was corrupted or double-deducted! Expected stock=9, reserved=0. Got stock=${finalProd.stockQuantity}, reserved=${finalProd.reservedQuantity}`
          );
        }

        // Exactly one SUCCESS payment record for this order
        const successPayments = await Payment.countDocuments({ orderId, status: 'SUCCESS' });
        if (successPayments !== 1) {
          throw new Error(`Expected exactly 1 SUCCESS payment for order, found ${successPayments}`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 6: Payment After Reservation Expiry
    // ----------------------------------------------------
    results.push(
      await runTest('6. Payment after reservation expiry is rejected safely', async () => {
        const prodExp = await Product.create({
          name: `Expired Hold Prod ${Date.now()}`,
          categoryId: testCat._id,
          price: 90,
          stockQuantity: 4,
          reservedQuantity: 0,
          isActive: true,
        });

        const checkoutData = await createReservedOrder(tokenA, prodExp, 1);
        const orderId = checkoutData.orderId;

        // Artificially age the reservation to the past
        await Reservation.findByIdAndUpdate(checkoutData.reservationId, {
          expiresAt: new Date(Date.now() - 5000),
        });

        const payRes = await makeRequest(
          port,
          '/api/payments',
          'POST',
          {
            orderId,
            cardNumber: '4111 1111 1111 1111',
            cardholderName: 'Jane Customer',
            expiryDate: '12/28',
            cvv: '123',
            idempotencyKey: `idemp-exp-${Date.now()}`,
          },
          { Authorization: `Bearer ${tokenA}` }
        );

        if (payRes.status !== 409 && payRes.status !== 400) {
          throw new Error(`Expected 409 or 400 on expired reservation payment, got ${payRes.status}`);
        }

        // Verify Order is not confirmed
        const orderInDb = await Order.findById(orderId);
        if (orderInDb.status === 'CONFIRMED') {
          throw new Error('Order should not have confirmed on expired reservation');
        }
      })
    );

    // ----------------------------------------------------
    // TEST 7: Payment For Another Customer's Order
    // ----------------------------------------------------
    results.push(
      await runTest('7. Payment for another customer\'s order is rejected with 403 Forbidden', async () => {
        const prodOwn = await Product.create({
          name: `Ownership Test Prod ${Date.now()}`,
          categoryId: testCat._id,
          price: 40,
          stockQuantity: 5,
          reservedQuantity: 0,
          isActive: true,
        });

        // Customer B creates an order
        const checkoutDataB = await createReservedOrder(tokenB, prodOwn, 1);

        // Customer A tries to pay for Customer B's order
        const hijackRes = await makeRequest(
          port,
          '/api/payments',
          'POST',
          {
            orderId: checkoutDataB.orderId,
            cardNumber: '4111 1111 1111 1111',
            cardholderName: 'Intruder User',
            expiryDate: '12/28',
            cvv: '123',
            idempotencyKey: `idemp-intruder-${Date.now()}`,
          },
          { Authorization: `Bearer ${tokenA}` } // tokenA paying for B's order
        );

        if (hijackRes.status !== 403) {
          throw new Error(`Expected 403 Forbidden, received ${hijackRes.status}`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 8: Stock Values After Each Outcome Verified
    // ----------------------------------------------------
    results.push(
      await runTest('8. Final stock and reserved values verified across all outcomes', async () => {
        const finalSuccess = await Product.findById(prodSuccess._id);
        const finalFailed = await Product.findById(prodFailed._id);
        const finalTimeout = await Product.findById(prodTimeout._id);

        // SUCCESS: 10 - 2 = 8 stock, 0 reserved
        if (finalSuccess.stockQuantity !== 8 || finalSuccess.reservedQuantity !== 0) {
          throw new Error(`Success prod inventory wrong: stock=${finalSuccess.stockQuantity}, res=${finalSuccess.reservedQuantity}`);
        }

        // FAILED: 5 stock (unchanged), 0 reserved
        if (finalFailed.stockQuantity !== 5 || finalFailed.reservedQuantity !== 0) {
          throw new Error(`Failed prod inventory wrong: stock=${finalFailed.stockQuantity}, res=${finalFailed.reservedQuantity}`);
        }

        // TIMEOUT: 7 stock (unchanged), 0 reserved
        if (finalTimeout.stockQuantity !== 7 || finalTimeout.reservedQuantity !== 0) {
          throw new Error(`Timeout prod inventory wrong: stock=${finalTimeout.stockQuantity}, res=${finalTimeout.reservedQuantity}`);
        }
      })
    );

    console.log('\n------------------------------------------------------');
    const allPassed = results.every((r) => r === true);
    if (allPassed) {
      console.log(` ALL ${results.length} PAYMENT & IDEMPOTENCY TESTS PASSED! `);
    } else {
      console.error(` ✘ SOME TESTS FAILED (${results.filter((r) => !r).length} failures) `);
    }
    console.log('------------------------------------------------------\n');

    server.close();
    await mongoose.disconnect();
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('[Payment Test Suite Error]', err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runPaymentTestSuite();
