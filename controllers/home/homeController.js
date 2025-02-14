const categoryModel = require("../../models/categoryModel");
const productModel = require("../../models/productModel");
const queryProducts = require("../../utils/queryProducts");
const reviewModel = require("../../models/reviewModel");
const moment = require("moment");
const { mongo: {ObjectId}} = require("mongoose")



const submit_review = async (req, res) => {
  const { name, review, rating, productId } = req.body;
  try {
    await reviewModel.create({
      name,
      productId,
      rating,
      review,
      date: moment(Date.now()).format("LL"),
    });

    let totalRating = 0;
    const reviews = await reviewModel.find({ productId });
    for (let i = 0; i < reviews.length; i++) {
      totalRating += reviews[i].rating;
    }
    let productRating = 0;
    if (reviews.length !== 0) {
      productRating = (totalRating / reviews.length).toFixed(1);
    }

    await productModel.findByIdAndUpdate(productId, {
      rating: productRating,
    });

    res.json({ message: "Review submitted successfully" });
  } catch (error) {
    console.error("Error submitting review:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_reviews = async (req, res) => {
  const { productId } = req.params;
  try {
    // Aggregation to get the count of each rating
    let getRating = await reviewModel.aggregate([
      {
        $match: {
          productId: new ObjectId(productId),
          rating: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize rating_review with default values
    let rating_review = [5, 4, 3, 2, 1].map(rating => ({ rating, sum: 0 }));

    // Populate rating_review with counts from getRating
    getRating.forEach(r => {
      let index = rating_review.findIndex(rr => rr.rating === r._id);
      if (index !== -1) {
        rating_review[index].sum = r.count;
      }
    });

    // Fetch reviews
    const reviews = await reviewModel.find({ productId }).sort({ createdAt: -1 });

    // Fetch total reviews
    const totalReview = await reviewModel.countDocuments({ productId });

    return res.status(200).json({
      reviews,
      totalReview,
      rating_review
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_category = async (req, res) => {
  try {
    const categories = await categoryModel.find({});
    return res.status(200).json({ categories: categories });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const formateProduct = (products) => {
  const productArray = [];
  for (let i = 0; i < products.length; i += 10) {
    productArray.push(products.slice(i, i + 10));
  }
  return productArray;
};

const get_product = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .limit(20)
      .sort({ createdAt: -1 });

    const latestProducts = await productModel
      .find({})
      .limit(20)
      .sort({ createdAt: -1 });
    const formattedLatestProducts = formateProduct(latestProducts);

    const topRatedProducts = await productModel
      .find({})
      .limit(20)
      .sort({ rating: -1 });
    const formattedTopRatedProducts = formateProduct(topRatedProducts);

    const discountProducts = await productModel
      .find({})
      .limit(20)
      .sort({ discount: -1 });
    const formattedDiscountProducts = formateProduct(discountProducts);
    return res.status(200).json({
      products,
      latestProducts: formattedLatestProducts,
      topRatedProducts: formattedTopRatedProducts,
      discountProducts: formattedDiscountProducts,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const price_range_product = async (req, res) => {
  try {
    const priceRange = {
      low: 0,
      high: 0,
    };
    const products = await productModel
      .find({})
      .limit(12)
      .sort({ createdAt: -1 });
    const latestProducts = formateProduct(products);
    const getPrice = await productModel.find({}).sort({ price: 1 });
    if (getPrice.length > 0) {
      priceRange.low = getPrice[0].price;
      priceRange.high = getPrice[getPrice.length - 1].price;
    }
    return res.status(200).json({ latestProducts, priceRange });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const query_products = async (req, res) => {
  const perPage = 30;
  const pageNumber = parseInt(req.query.pageNumber) || 1;

  try {
    // Get the total count of products after filtering
    const productsQuery = productModel.find(); // Reference to the MongoDB model
    const filteredProducts = queryProducts(productsQuery, { ...req.query, perPage, pageNumber });

    const [totalProducts, products] = await Promise.all([
      productModel.countDocuments(filteredProducts.getFilter()), // Count total products
      filteredProducts.exec(), // Execute the query to fetch the paginated products
    ]);

    return res.status(200).json({
      products,
      totalProducts,
      perPage,
      pageNumber,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const product_details = async (req, res) => {
  const { slug } = req.params;
  try {
    const product = await productModel.findOne({ slug });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const relatedProducts = await productModel
      .find({
        $and: [
          { _id: { $ne: product._id } },
          { category: { $eq: product.category } },
        ],
      })
      .limit(15);

    const moreProducts = await productModel.find({
      $and: [
        { _id: { $ne: product._id } },
        { sellerId: { $eq: product.sellerId } },
      ],
    });

    return res.status(200).json({
      product,
      relatedProducts,
      moreProducts,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  get_category,
  get_product,
  price_range_product,
  query_products,
  product_details,
  submit_review,
  get_reviews,
};
