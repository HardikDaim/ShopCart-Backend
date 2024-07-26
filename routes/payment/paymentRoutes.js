const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewares/authMiddleware");
const paymentController = require("../../controllers/payment/paymentController");

router.get("/payment/create-paypal-connect-account", authMiddleware, paymentController.create_paypal_connect_account);
router.post("/generate-qr", paymentController.generate_qr);
router.post("/payment-callback", paymentController.payment_callback);


module.exports = router;
