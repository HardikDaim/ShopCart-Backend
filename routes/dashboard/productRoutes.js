const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewares/authMiddleware");
const productController = require("../../controllers/dashboard/productController");

router.post("/add-product", authMiddleware, productController.add_product);
router.post("/delete-product", authMiddleware, productController.delete_product);
router.get("/get-products", authMiddleware, productController.get_products);
router.get("/get-discounted-products", authMiddleware, productController.get_discounted_products);
router.get("/get-product/:productId", authMiddleware, productController.get_product);
router.post("/update-product", authMiddleware, productController.update_product);
router.post("/product-image-update", authMiddleware, productController.product_image_update);
router.post("/delete-product-image", authMiddleware, productController.delete_product_image);
router.post("/add-image", authMiddleware, productController.add_image);

module.exports = router;