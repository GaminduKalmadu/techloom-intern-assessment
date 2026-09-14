const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
    },
    reservedQuantity: {
      type: Number,
      required: [true, 'Reserved quantity is required'],
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Virtual field: availableStock = stockQuantity - reservedQuantity
productSchema.virtual('availableStock').get(function () {
  const stock = typeof this.stockQuantity === 'number' ? this.stockQuantity : 0;
  const reserved = typeof this.reservedQuantity === 'number' ? this.reservedQuantity : 0;
  return Math.max(0, stock - reserved);
});

// Guard: Strictly prevent negative stock or negative reserved quantities
productSchema.pre('validate', function (next) {
  if (typeof this.stockQuantity === 'number' && this.stockQuantity < 0) {
    this.invalidate('stockQuantity', 'Stock quantity cannot be negative');
  }
  if (typeof this.reservedQuantity === 'number' && this.reservedQuantity < 0) {
    this.invalidate('reservedQuantity', 'Reserved quantity cannot be negative');
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
