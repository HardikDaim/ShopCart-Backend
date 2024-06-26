const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    productId: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("cartProducts", cartSchema);
