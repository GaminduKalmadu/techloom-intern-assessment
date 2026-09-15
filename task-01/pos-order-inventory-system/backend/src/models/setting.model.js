const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default_pos_settings',
      unique: true,
    },
    storeName: {
      type: String,
      trim: true,
      default: 'Techloom POS Retail',
      maxlength: 100,
    },
    storeEmail: {
      type: String,
      trim: true,
      default: 'support@techloom.ai',
    },
    storePhone: {
      type: String,
      trim: true,
      default: '+1 (555) 019-2834',
    },
    storeAddress: {
      type: String,
      trim: true,
      default: '100 Innovation Way, Suite 400, Tech Park, CA',
    },
    currency: {
      type: String,
      trim: true,
      default: 'USD',
    },
    currencySymbol: {
      type: String,
      trim: true,
      default: '$',
    },
    taxRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 8.25,
    },
    taxId: {
      type: String,
      trim: true,
      default: 'TX-992014-A',
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 10,
    },
    receiptHeader: {
      type: String,
      trim: true,
      default: 'THANK YOU FOR SHOPPING AT TECHLOOM POS',
    },
    receiptFooter: {
      type: String,
      trim: true,
      default: 'Goods once sold can be returned within 14 days with original receipt.',
    },
    enableSound: {
      type: Boolean,
      default: true,
    },
    autoPrintReceipt: {
      type: Boolean,
      default: false,
    },
    showCashierOnReceipt: {
      type: Boolean,
      default: true,
    },
    showBarcodeOnReceipt: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;
