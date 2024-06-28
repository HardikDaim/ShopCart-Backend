const express = require("express");
const router = express.Router();
const searchController = require("../../controllers/search/searchController");


router.get("/search-products", searchController.search_products);




module.exports = router;
