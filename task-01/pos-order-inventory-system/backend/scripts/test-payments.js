const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const Product = require('../src/models/product.model');
const Order = require('../src/models/order.model');
const Reservation = require('../src/models/reservation.model');
const Payment = require('../src/models/payment.model');
const Cart = require('../src/models/cart.model');
const orderService = require('../src/services/order.service');
const paymentService = require('../src/services/payment.service');

const createdOrderIds = [];
let product;
const createdCartIds = [];
const assert = (condition, message) => { if (!condition) throw new Error(`Assertion failed: ${message}`); };

const makeOrder = async (label) => {
  const order = await orderService.createOrder({
    userId: `payment_test_${label}_${Date.now()}`,
    items: [{ productId: product._id, quantity: 1 }],
    notes: `Mock payment test ${label}`,
  });
  createdOrderIds.push(order._id);
  return order;
};

const pay = (order, outcome, key) => paymentService.processPayment({
  orderId: order._id, paymentMethod: 'CARD', simulationOutcome: outcome, idempotencyKey: key,
});

(async () => {
  try {
    await connectDB();
    product = await Product.create({ name: `Payment Test ${Date.now()}`, category: 'Test', price: 25, stockQuantity: 10 });

    const successOrder = await makeOrder('success');
    const success = await pay(successOrder, 'SUCCESS', `pay-success-${successOrder._id}`);
    assert(success.paymentStatus === 'SUCCESS' && success.orderStatus === 'PAID', 'SUCCESS transitions to PAID');
    assert((await Product.findById(product._id)).stockQuantity === 9, 'successful payment keeps stock deducted');

    const replay = await pay(successOrder, 'SUCCESS', `pay-success-${successOrder._id}`);
    assert(replay.replayed === true && replay.transactionId === success.transactionId, 'same key returns original result');
    let duplicateRejected = false;
    try { await pay(successOrder, 'SUCCESS', `pay-duplicate-${successOrder._id}`); } catch (error) { duplicateRejected = error.code === 'PAYMENT_ALREADY_PROCESSED'; }
    assert(duplicateRejected, 'duplicate successful payment is rejected');

    const failedOrder = await makeOrder('failed');
    const failed = await pay(failedOrder, 'FAILED', `pay-failed-${failedOrder._id}`);
    assert(failed.paymentStatus === 'FAILED' && failed.orderStatus === 'FAILED', 'FAILED transitions order');
    assert((await Product.findById(product._id)).stockQuantity === 9, 'failed payment restores stock');
    await assertRejectedState(failedOrder, 'FAILED');

    const timeoutOrder = await makeOrder('timeout');
    const timeout = await pay(timeoutOrder, 'TIMEOUT', `pay-timeout-${timeoutOrder._id}`);
    assert(timeout.paymentStatus === 'TIMEOUT' && timeout.orderStatus === 'EXPIRED', 'TIMEOUT transitions order');
    assert((await Product.findById(product._id)).stockQuantity === 9, 'timeout restores stock');
    await assertRejectedState(timeoutOrder, 'EXPIRED');

    const concurrentOrder = await makeOrder('concurrent');
    const settled = await Promise.allSettled([
      pay(concurrentOrder, 'SUCCESS', `pay-race-a-${concurrentOrder._id}`),
      pay(concurrentOrder, 'SUCCESS', `pay-race-b-${concurrentOrder._id}`),
    ]);
    assert(settled.filter((item) => item.status === 'fulfilled').length === 1, 'only one concurrent payment succeeds');
    assert((await Payment.countDocuments({ orderId: concurrentOrder._id, status: 'SUCCESS' })) === 1, 'only one successful payment document exists');
    assert((await Product.findById(product._id)).stockQuantity === 8, 'concurrent payment never double-mutates stock');

    const cancelledOrder = await makeOrder('cancelled');
    await orderService.cancelOrder(cancelledOrder._id, 'Payment state test');
    await assertRejectedState(cancelledOrder, 'CANCELLED');

    let missingRejected = false;
    try {
      await paymentService.processPayment({ orderId: new mongoose.Types.ObjectId(), paymentMethod: 'CARD', simulationOutcome: 'SUCCESS', idempotencyKey: `missing-${Date.now()}` });
    } catch (error) { missingRejected = error.code === 'ORDER_NOT_FOUND'; }
    assert(missingRejected, 'non-existing order is rejected');

    const rollbackOrder = await makeOrder('rollback');
    let rollbackTriggered = false;
    try {
      await paymentService.processPayment({ orderId: rollbackOrder._id, paymentMethod: 'INVALID', simulationOutcome: 'SUCCESS', idempotencyKey: `rollback-${rollbackOrder._id}` });
    } catch (error) { rollbackTriggered = error.name === 'ValidationError'; }
    assert(rollbackTriggered, 'downstream validation error triggers transaction rollback');
    assert((await Order.findById(rollbackOrder._id)).status === 'RESERVED', 'rollback preserves order state');
    assert((await Reservation.findOne({ orderId: rollbackOrder._id })).status === 'reserved', 'rollback preserves reservation state');
    await orderService.cancelOrder(rollbackOrder._id, 'Rollback test cleanup');

    const cartUser = `duplicate_cart_${Date.now()}`;
    const cart = await Cart.create({ userId: cartUser, items: [{ productId: product._id, quantity: 1, price: product.price }] });
    createdCartIds.push(cart._id);
    const duplicateOrders = await Promise.all([
      orderService.createOrder({ userId: cartUser, fromCart: true }),
      orderService.createOrder({ userId: cartUser, fromCart: true }),
    ]);
    assert(duplicateOrders[0]._id.toString() === duplicateOrders[1]._id.toString(), 'duplicate checkout returns one order');
    createdOrderIds.push(duplicateOrders[0]._id);
    assert(await Order.countDocuments({ sourceCartId: cart._id }) === 1, 'only one order exists for a cart');
    await orderService.cancelOrder(duplicateOrders[0]._id, 'Duplicate checkout test cleanup');

    console.log('PASS payment outcomes, invalid states, idempotency, duplicate checkout/payment, rollback, stock restoration, and concurrency checks');
  } finally {
    if (createdOrderIds.length) {
      await Payment.deleteMany({ orderId: { $in: createdOrderIds } });
      await Reservation.deleteMany({ orderId: { $in: createdOrderIds } });
      await Order.deleteMany({ _id: { $in: createdOrderIds } });
    }
    if (product) await Product.findByIdAndDelete(product._id);
    if (createdCartIds.length) await Cart.deleteMany({ _id: { $in: createdCartIds } });
    await mongoose.connection.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });

async function assertRejectedState(order, expectedStatus) {
  let rejected = false;
  try { await pay(order, 'SUCCESS', `invalid-${expectedStatus}-${order._id}`); }
  catch (error) { rejected = error.code === 'INVALID_ORDER_STATE'; }
  assert(rejected, `${expectedStatus} order cannot be paid`);
}
