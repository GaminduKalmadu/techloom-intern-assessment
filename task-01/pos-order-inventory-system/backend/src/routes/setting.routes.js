const express = require('express');
const settingController = require('../controllers/setting.controller');

const router = express.Router();

// GET /api/v1/settings
router.get('/', settingController.getSettings);

// PUT /api/v1/settings
router.put('/', settingController.updateSettings);

// POST /api/v1/settings/reset
router.post('/reset', settingController.resetSettings);

module.exports = router;
