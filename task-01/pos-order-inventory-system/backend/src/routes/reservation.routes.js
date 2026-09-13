const express = require('express');
const reservationController = require('../controllers/reservation.controller');

const router = express.Router();

// GET /api/v1/reservations - List reservations
router.get('/', reservationController.getReservations);

// POST /api/v1/reservations/cleanup - Manually trigger expired reservation cleanup
router.post('/cleanup', reservationController.triggerCleanup);

module.exports = router;
