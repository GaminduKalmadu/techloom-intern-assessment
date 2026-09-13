const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required for payment'],
      index: true,
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CARD', 'CASH', 'DIGITAL_WALLET'],
      default: 'CARD',
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT'],
      default: 'PENDING',
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: [true, 'Idempotency key is required'],
      trim: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
// MongoDB enforces the invariant even if two app instances race.
paymentSchema.index(
  { orderId: 1 },
  { unique: true, partialFilterExpression: { status: 'SUCCESS' }, name: 'one_success_per_order' }
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
