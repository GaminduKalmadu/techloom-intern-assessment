const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required for order item'],
    },
    productName: {
      type: String,
      required: [true, 'Product name is required for order item'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required for order item'],
      min: [0, 'Item price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required for order item'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for order'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'RESERVED', 'CONFIRMED', 'CANCELLED', 'FAILED', 'EXPIRED'],
        message: 'Invalid order status',
      },
      default: 'RESERVED',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'REFUNDED'],
        message: 'Invalid payment status',
      },
      default: 'PENDING',
      index: true,
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

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
