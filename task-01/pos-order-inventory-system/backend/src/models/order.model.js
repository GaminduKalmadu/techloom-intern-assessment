const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      default: null, // Null indicates walk-in customer at POS
    },
    sourceCartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      default: null,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'An order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'RESERVED',
        'PAID',
        'FAILED',
        'CANCELLED',
        'EXPIRED',
        'pending',
        'reserved',
        'paid',
        'failed',
        'cancelled',
        'expired',
      ],
      default: 'PENDING',
      set: (v) => (v ? v.toUpperCase() : v),
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high-performance order querying
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index(
  { sourceCartId: 1 },
  { unique: true, partialFilterExpression: { sourceCartId: { $type: 'objectId' } } }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
