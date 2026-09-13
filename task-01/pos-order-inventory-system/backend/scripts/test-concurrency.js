/**
 * Concurrency Test Script: 100 Users Competing for Limited Stock
 * 
 * Requirement:
 * - 100 simulated users attempting to buy limited stock simultaneously.
 * - Concurrency-safe atomic reservations.
 * - Expected: Absolutely NO negative stock.
 * - Test 5-minute reservation expiry and safe stock restoration.
 * - Verify idempotency (no double-restoration of stock).
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const Product = require('../src/models/product.model');
const Order = require('../src/models/order.model');
const Reservation = require('../src/models/reservation.model');
const orderService = require('../src/services/order.service');
const reservationService = require('../src/services/reservation.service');

const TOTAL_USERS = 100;
const INITIAL_STOCK = 10;
const UNITS_PER_USER = 1;

const runConcurrencyTest = async () => {
  console.log('\n===============================================================');
  console.log('       CONCURRENCY-SAFE STOCK RESERVATION TEST SUITE           ');
  console.log('===============================================================\n');

  try {
    // 1. Connect to MongoDB
    console.log('[Step 1/5] Connecting to MongoDB...');
    await connectDB();
    console.log(' Connected to database successfully.\n');

    // 2. Setup Test Fixture
    console.log('[Step 2/5] Creating test product with limited stock...');
    const testProduct = await Product.create({
      name: `Limited Edition Smartwatch (Test ${Date.now()})`,
      description: 'Concurrency stress testing product item',
      category: 'Electronics',
      price: 199.99,
      stockQuantity: INITIAL_STOCK,
    });

    console.log(` Created product: "${testProduct.name}" (ID: ${testProduct._id})`);
    console.log(` Initial Available Stock: ${INITIAL_STOCK} units`);
    console.log(` Total Concurrent Users:  ${TOTAL_USERS} users`);
    console.log(` Quantity per User:       ${UNITS_PER_USER} unit\n`);

    // 3. Fire 100 Concurrent Checkout Requests
    console.log(`[Step 3/5] Simulating ${TOTAL_USERS} simultaneous user checkouts...`);
    const startTime = Date.now();

    const userPromises = Array.from({ length: TOTAL_USERS }, (_, index) => {
      const userIndex = index + 1;
      return orderService
        .createOrder({
          userId: `test_user_${userIndex}`,
          items: [{ productId: testProduct._id, quantity: UNITS_PER_USER }],
          notes: `Concurrent test buyer #${userIndex}`,
        })
        .then((order) => ({
          user: userIndex,
          success: true,
          orderId: order._id,
          orderNumber: order.orderNumber,
        }))
        .catch((err) => ({
          user: userIndex,
          success: false,
          error: err.message,
        }));
    });

    const results = await Promise.all(userPromises);
    const duration = Date.now() - startTime;

    const successfulOrders = results.filter((r) => r.success);
    const failedOrders = results.filter((r) => !r.success);

    console.log(` Execution completed in ${duration}ms\n`);
    console.log('--- Test Results Breakdown ---');
    console.log(` Successful Checkouts (Reservations Created): ${successfulOrders.length}`);
    console.log(` Rejected Checkouts   (Out of Stock):        ${failedOrders.length}`);

    const errorSample = {};
    failedOrders.forEach((f) => {
      errorSample[f.error] = (errorSample[f.error] || 0) + 1;
    });
    console.log(' Error Breakdown:', errorSample);

    // Query product stock in DB
    const finalProduct = await Product.findById(testProduct._id);
    console.log(` Remaining Stock in Database:                ${finalProduct.stockQuantity}`);

    // Query reservations in DB
    const activeReservations = await Reservation.find({
      productId: testProduct._id,
      status: 'reserved',
    });
    console.log(` Active Reservations in Database:             ${activeReservations.length}\n`);

    // 4. Assertions on Concurrency & Oversell Protection
    console.log('[Step 4/5] Evaluating Concurrency Safety Assertions...');
    let passed = true;

    // Assertion 1: No negative stock
    if (finalProduct.stockQuantity < 0) {
      console.error(` FAIL: Stock dropped below zero! Current stock: ${finalProduct.stockQuantity}`);
      passed = false;
    } else {
      console.log(` PASS: No negative stock (stockQuantity: ${finalProduct.stockQuantity} >= 0)`);
    }

    // Assertion 2: Stock must be exactly 0 (since 100 > 10 units requested)
    if (finalProduct.stockQuantity === 0) {
      console.log(` PASS: Stock accurately depleted to exactly 0`);
    } else {
      console.error(` FAIL: Expected stock to be 0, but got ${finalProduct.stockQuantity}`);
      passed = false;
    }

    // Assertion 3: Exactly 10 successful reservations
    if (successfulOrders.length === INITIAL_STOCK) {
      console.log(` PASS: Exactly ${INITIAL_STOCK} users successfully reserved stock`);
    } else {
      console.error(` FAIL: Expected ${INITIAL_STOCK} successes, got ${successfulOrders.length}`);
      passed = false;
    }

    // Assertion 4: Exactly 90 rejected requests
    if (failedOrders.length === TOTAL_USERS - INITIAL_STOCK) {
      console.log(` PASS: Exactly ${TOTAL_USERS - INITIAL_STOCK} users were safely rejected (prevented overselling)`);
    } else {
      console.error(` FAIL: Expected ${TOTAL_USERS - INITIAL_STOCK} failures, got ${failedOrders.length}`);
      passed = false;
    }

    // Assertion 5: Exactly 10 reservation records in database
    if (activeReservations.length === INITIAL_STOCK) {
      console.log(` PASS: Database contains exactly ${INITIAL_STOCK} active reservation records`);
    } else {
      console.error(` FAIL: Expected ${INITIAL_STOCK} active reservations, got ${activeReservations.length}`);
      passed = false;
    }

    // 5. Test Reservation Expiry & Safe Stock Restoration
    console.log('\n[Step 5/5] Testing 5-minute Expiry Sweeper & Stock Restoration...');

    // Artificially expire the reservations by backdating expiresAt
    await Reservation.updateMany(
      { productId: testProduct._id, status: 'reserved' },
      { $set: { expiresAt: new Date(Date.now() - 60000) } }
    );
    console.log(` Backdated ${activeReservations.length} reservations to trigger simulated 5-min expiry.`);

    // Run cleanup sweeper
    const cleanupResult = await reservationService.cleanupExpiredReservations();
    console.log(` Sweeper Result:`, cleanupResult);

    // Verify stock restored
    const restoredProduct = await Product.findById(testProduct._id);
    console.log(` Restored Stock Quantity: ${restoredProduct.stockQuantity}`);

    if (restoredProduct.stockQuantity === INITIAL_STOCK) {
      console.log(` PASS: Stock safely restored back to initial level (${INITIAL_STOCK})`);
    } else {
      console.error(` FAIL: Expected restored stock to be ${INITIAL_STOCK}, got ${restoredProduct.stockQuantity}`);
      passed = false;
    }

    // Verify orders updated to 'EXPIRED'
    const expiredOrdersCount = await Order.countDocuments({
      _id: { $in: successfulOrders.map((o) => o.orderId) },
      status: { $in: ['EXPIRED', 'expired'] },
    });
    console.log(` Orders transitioned to EXPIRED: ${expiredOrdersCount}/${successfulOrders.length}`);

    if (expiredOrdersCount === successfulOrders.length) {
      console.log(` PASS: All orders transitioned to 'EXPIRED' status`);
    } else {
      console.error(` FAIL: Not all orders were updated to 'EXPIRED'`);
      passed = false;
    }

    // Verify Idempotency (running cleanup again should NOT increase stock)
    console.log('\nTesting Cleanup Sweeper Idempotency...');
    const secondCleanup = await reservationService.cleanupExpiredReservations();
    const productAfterSecondCleanup = await Product.findById(testProduct._id);

    if (
      secondCleanup.releasedReservations === 0 &&
      productAfterSecondCleanup.stockQuantity === INITIAL_STOCK
    ) {
      console.log(` PASS: Sweeper is idempotent. Second run released 0 items, stock remains ${INITIAL_STOCK}`);
    } else {
      console.error(
        ` FAIL: Double restoration detected! Stock is now ${productAfterSecondCleanup.stockQuantity}`
      );
      passed = false;
    }

    // Clean up test data
    console.log('\nCleaning up test artifacts from database...');
    await Product.findByIdAndDelete(testProduct._id);
    await Reservation.deleteMany({ productId: testProduct._id });
    await Order.deleteMany({ notes: /Concurrent test buyer/ });
    console.log(' Cleanup completed.');

    console.log('\n===============================================================');
    if (passed) {
      console.log('    CONCURRENCY TEST PASSED: ALL SAFETY CRITERIA MET!         ');
    } else {
      console.log('    CONCURRENCY TEST FAILED: ONE OR MORE CHECKS DID NOT PASS   ');
    }
    console.log('===============================================================\n');

    await mongoose.connection.close();
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('Fatal error during concurrency test execution:', error);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

runConcurrencyTest();
