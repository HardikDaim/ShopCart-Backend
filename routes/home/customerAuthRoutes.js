const express = require("express");
const router = express.Router();
const customerAuthController = require("../../controllers/home/customerAuthController");

router.post("/customer-register", customerAuthController.customer_register);
router.post("/registerMail", customerAuthController.register_Mail);
router.post("/customer-login", customerAuthController.customer_login);
router.post("/loginMail", customerAuthController.login_Mail);
router.get("/logout", customerAuthController.customer_logout);


module.exports = router;
