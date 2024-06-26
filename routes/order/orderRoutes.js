const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/order/orderController");

// admin routes
router.get("/admin/get-admin-orders", orderController.get_admin_orders);
router.get("/admin/get-admin-order/:orderId", orderController.get_admin_order_details);
router.put("/admin/admin-order-status/update/:orderId", orderController.admin_order_status_update);

// customer routes
router.post("/home/order/place-order", orderController.place_order);
router.get("/home/customer/get-dashboard-data/:customerId", orderController.get_dashboard_data);
router.get("/home/customer/get-orders/:customerId/:status", orderController.get_orders);
router.get("/home/customer/get-order-details/:orderId", orderController.get_order_details);

// seller routes
router.get("/seller/get-seller-orders/:sellerId", orderController.get_seller_orders);
router.get("/seller/get-seller-order/:orderId", orderController.get_seller_order_details);
router.put("/seller/seller-order-status/update/:orderId", orderController.seller_order_status_update);

module.exports = router;
