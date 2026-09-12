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
      enum: ['cash', 'card', 'digital_wallet'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
