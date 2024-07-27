const express = require("express");
const router = express.Router();
const paymentController = require("../../controllers/payment/paymentController");

router.post("/payment/generate-qr", paymentController.generate_qr);
router.post("/payment/status/:orderId", paymentController.check_payment_status);


module.exports = router;
