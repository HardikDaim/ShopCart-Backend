const express = require("express");
const router = express.Router();
const cartController = require("../../controllers/home/cartController");

router.post("/product/add-to-cart", cartController.add_to_cart);
router.post("/product/add-to-wishlist", cartController.add_to_wishlist);
router.get("/product/get-cart-products/:userId", cartController.get_cart_products);
router.get("/product/get-wishlist-products/:userId", cartController.get_wishlist_products);
router.delete("/product/delete-cart-product/:cartId", cartController.delete_cart_product);
router.delete("/product/remove-wishlist-product/:wishlistId", cartController.remove_wishlist_product);
router.put("/product/quantity-inc/:cartId", cartController.quantity_inc);
router.put("/product/quantity-dec/:cartId", cartController.quantity_dec);



module.exports = router;
