const settingService = require('../services/setting.service');
const ApiResponse = require('../utils/apiResponse');

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingService.getSettings();
    return ApiResponse.success(res, 'Settings retrieved successfully', settings);
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const updated = await settingService.updateSettings(req.body);
    return ApiResponse.success(res, 'Settings updated successfully', updated);
  } catch (err) {
    next(err);
  }
};

const resetSettings = async (req, res, next) => {
  try {
    const reset = await settingService.resetSettings();
    return ApiResponse.success(res, 'Settings reset to factory defaults', reset);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
};
