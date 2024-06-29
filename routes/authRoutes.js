const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/authControllers");
const { authMiddleware } = require("../middlewares/authMiddleware");
 
router.post("/admin-login", authControllers.admin_login);
router.post("/seller-register", authControllers.seller_register);
router.post("/seller-login", authControllers.seller_login);
router.get("/get-user", authMiddleware, authControllers.getUser);
router.post(
  "/profile-image-upload",
  authMiddleware,
  authControllers.profile_image_upload
);
router.post(
  "/add-profile-info",
  authMiddleware,
  authControllers.add_profile_info
);
router.get("/logout", authMiddleware, authControllers.logout);

module.exports = router;
