const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    review: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        requires: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("reviews", reviewSchema);
