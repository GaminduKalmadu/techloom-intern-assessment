const mongoose = require('mongoose');

const reservationItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required for reservation item'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required for reservation item'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required for reservation'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for reservation'],
      index: true,
    },
    items: {
      type: [reservationItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Reservation must contain at least one item',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'COMPLETED', 'RELEASED', 'EXPIRED'],
        message: 'Invalid reservation status',
      },
      default: 'ACTIVE',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry timestamp is required for reservation'],
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

// Compound index for background expiration queries
reservationSchema.index({ status: 1, expiresAt: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
