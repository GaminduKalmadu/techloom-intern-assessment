const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required for reservation'],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required for reservation'],
    },
    quantity: {
      type: Number,
      required: [true, 'Reserved quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    expiresAt: {
      type: Date,
      required: [true, 'Reservation expiry date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['reserved', 'confirmed', 'released', 'expired'],
      default: 'reserved',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for inventory reservation lookups and scheduled cleanup
reservationSchema.index({ orderId: 1, status: 1 });
reservationSchema.index({ status: 1, expiresAt: 1 });
reservationSchema.index({ productId: 1, status: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
