const express = require("express");
const router = express.Router();
const homeController = require("../../controllers/home/homeController");

router.post("/customer/submit-review", homeController.submit_review);
router.get("/get-categories", homeController.get_category);
router.get("/customer/get-reviews/:productId", homeController.get_reviews);
router.get("/get-products", homeController.get_product);
router.get("/price-range-latest-product", homeController.price_range_product);
router.get("/query-products", homeController.query_products);
router.get("/product/details/:slug", homeController.product_details);


module.exports = router;
