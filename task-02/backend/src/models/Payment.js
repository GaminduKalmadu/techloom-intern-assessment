const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required for payment'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for payment'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'REFUNDED'],
        message: 'Invalid payment status',
      },
      default: 'PENDING',
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: [true, 'Idempotency key is required'],
      trim: true,
    },
    transactionReference: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Unique index on idempotencyKey as strictly required by assessment specification
paymentSchema.index({ idempotencyKey: 1 }, { unique: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
