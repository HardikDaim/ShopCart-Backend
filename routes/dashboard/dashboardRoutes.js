const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewares/authMiddleware");
const dashboardController = require("../../controllers/dashboard/dashboardController");

router.get("/admin/get-dashboard-data", authMiddleware, dashboardController.get_admiin_dashboard_data);
router.get("/seller/get-dashboard-data", authMiddleware, dashboardController.get_seller_dashboard_data);

module.exports = router;
