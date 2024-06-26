const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "seller",
    },
    status: {
      type: String,
      default: "pending",
    },
    payment: {
      type: String,
      default: "pending",
    },
    method: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    shopInfo: {
      type: Object,
      default: "",
    },
  },
  { timestamps: true }
);
sellerSchema.index(
  {
    name: "text",
    shopName: "text",
    email: "text",
  },
  {
    weights: {
      name: 5,
      shopName: 5,
      email: 4,
    },
  }
);
module.exports = mongoose.model("sellers", sellerSchema);
