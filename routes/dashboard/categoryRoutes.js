const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewares/authMiddleware");
const categoryController = require("../../controllers/dashboard/categoryController");

router.post("/add-category", authMiddleware, categoryController.add_category);
router.post("/update-category", authMiddleware, categoryController.update_category);
router.post("/delete-category", authMiddleware, categoryController.delete_category);
router.get("/get-category", authMiddleware, categoryController.get_category);

module.exports = router;
