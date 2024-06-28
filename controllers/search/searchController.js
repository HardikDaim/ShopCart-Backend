const productModel = require("../../models/productModel");

const search_products = async (req, res) => {
  const { name } = req.query;
  try {
    const products = await productModel
      .find({
        name: { $regex: new RegExp(name, "i") }, // Case-insensitive search
      })
      .exec();

    res.json({ products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  search_products,
};
