const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-order', paymentController.createPaymentOrder);
router.post('/verify-order', paymentController.verifyPayment);

module.exports = router;
