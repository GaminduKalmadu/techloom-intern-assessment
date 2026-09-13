const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Product description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Stock quantity must be an integer',
      },
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance
productSchema.index({ category: 1, name: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ stockQuantity: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
