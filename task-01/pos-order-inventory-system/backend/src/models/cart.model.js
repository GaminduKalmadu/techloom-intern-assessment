const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    price: {
      type: Number,
      required: [true, 'Item unit price is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for cart'],
      index: true,
    },
    items: [cartItemSchema],
    status: {
      type: String,
      enum: ['active', 'converted', 'abandoned'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: Fast lookup of a user's active cart
cartSchema.index({ userId: 1, status: 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
