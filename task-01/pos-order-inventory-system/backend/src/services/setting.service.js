const Setting = require('../models/setting.model');

const DEFAULT_SETTINGS = {
  key: 'default_pos_settings',
  storeName: 'Techloom POS Retail',
  storeEmail: 'support@techloom.ai',
  storePhone: '+1 (555) 019-2834',
  storeAddress: '100 Innovation Way, Suite 400, Tech Park, CA',
  currency: 'USD',
  currencySymbol: '$',
  taxRate: 8.25,
  taxId: 'TX-992014-A',
  lowStockThreshold: 10,
  receiptHeader: 'THANK YOU FOR SHOPPING AT TECHLOOM POS',
  receiptFooter: 'Goods once sold can be returned within 14 days with original receipt.',
  enableSound: true,
  autoPrintReceipt: false,
  showCashierOnReceipt: true,
  showBarcodeOnReceipt: true,
};

/**
 * Get active system settings (creates default document if none exists)
 */
const getSettings = async () => {
  let setting = await Setting.findOne({ key: 'default_pos_settings' });
  if (!setting) {
    setting = await Setting.create(DEFAULT_SETTINGS);
  }
  return setting;
};

/**
 * Update system settings
 */
const updateSettings = async (updates) => {
  const allowedFields = [
    'storeName',
    'storeEmail',
    'storePhone',
    'storeAddress',
    'currency',
    'currencySymbol',
    'taxRate',
    'taxId',
    'lowStockThreshold',
    'receiptHeader',
    'receiptFooter',
    'enableSound',
    'autoPrintReceipt',
    'showCashierOnReceipt',
    'showBarcodeOnReceipt',
  ];

  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  const setting = await Setting.findOneAndUpdate(
    { key: 'default_pos_settings' },
    { $set: filteredUpdates },
    { new: true, upsert: true, runValidators: true }
  );

  return setting;
};

/**
 * Reset settings to default values
 */
const resetSettings = async () => {
  const setting = await Setting.findOneAndUpdate(
    { key: 'default_pos_settings' },
    { $set: DEFAULT_SETTINGS },
    { new: true, upsert: true }
  );
  return setting;
};

module.exports = {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  resetSettings,
};
