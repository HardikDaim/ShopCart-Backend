const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    image: {
      type: String,
      required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    slug: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("wishlists", wishlistSchema);
