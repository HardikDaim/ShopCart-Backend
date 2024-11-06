const cartModel = require("../../models/cartModel");
const wishlistModel = require("../../models/wishlistModel");
const {
  mongo: { ObjectId },
} = require("mongoose");

const add_to_cart = async (req, res) => {
  const { userId, quantity, productId } = req.body;
  try {
    const product = await cartModel.findOne({
      $and: [{ productId: { $eq: productId } }, { userId: { $eq: userId } }],
    });
    if (product) {
      return res.status(404).json({ error: "Product already added to Cart" });
    } else {
      const product = await cartModel.create({ userId, productId, quantity });
      return res.status(200).json({ message: "Product added to Cart" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const add_to_wishlist = async (req, res) => {
  const { slug } = req.body;
  try {
    const product = await wishlistModel.findOne({ slug });
    if (product) {
      return res.status(404).json({ error: "Product is already in Wishlist" });
    } else {
      await wishlistModel.create(req.body);
      return res.status(200).json({ message: "Product added to Wishlist" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_wishlist_products = async (req, res) => {
  const { userId } = req.params;
  try {
    const wishlists = await wishlistModel.find({ userId });
    return res
      .status(200)
      .json({ wishlists, wishlist_count: wishlists.length });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_cart_products = async (req, res) => {
  const commission = 5; // 5%
  const { userId } = req.params;

  try {
    const cart_products = await cartModel.aggregate([
      { $match: { userId: { $eq: new ObjectId(userId) } } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "products",
        },
      },
    ]);

    let buy_product_item = 0;
    let calculatedPrice = 0;
    let cart_product_count = 0;
    const outOfStockProducts = cart_products.filter(
      (p) => p.products[0].stock < p.quantity
    );

    for (let i = 0; i < outOfStockProducts.length; i++) {
      cart_product_count += outOfStockProducts[i].quantity;
    }

    const stockProducts = cart_products.filter(
      (p) => p.products[0].stock >= p.quantity
    );

    for (let i = 0; i < stockProducts.length; i++) {
      const { quantity } = stockProducts[i];
      cart_product_count = buy_product_item + quantity;
      buy_product_item += quantity;
      const { price, discount } = stockProducts[i].products[0];
      if (discount !== 0) {
        calculatedPrice +=
          (price - Math.floor((price * discount) / 100)) * quantity;
      } else {
        calculatedPrice += price * quantity;
      }
    }

    let p = [];
    let unique = [
      ...new Set(stockProducts.map((p) => p.products[0].sellerId.toString())),
    ];

    for (let i = 0; i < unique.length; i++) {
      let price = 0;
      for (let j = 0; j < stockProducts.length; j++) {
        const tempProduct = stockProducts[j].products[0];
        if (unique[i] === tempProduct.sellerId.toString()) {
          let pri = 0;
          if (tempProduct.discount !== 0) {
            pri =
              tempProduct.price -
              Math.floor((tempProduct.price * tempProduct.discount) / 100);
          } else {
            pri = tempProduct.price;
          }
          pri = pri - Math.floor((pri * commission) / 100);
          price += pri * stockProducts[j].quantity;

          p[i] = {
            sellerId: unique[i],
            shopName: tempProduct.shopName,
            price,
            products: p[i]
              ? [
                  ...p[i].products,
                  {
                    _id: stockProducts[j]._id,
                    quantity: stockProducts[j].quantity,
                    productInfo: tempProduct,
                  },
                ]
              : [
                  {
                    _id: stockProducts[j]._id,
                    quantity: stockProducts[j].quantity,
                    productInfo: tempProduct,
                  },
                ],
          };
        }
      }
    }
    return res.status(200).json({
      cart_products: p,
      price: calculatedPrice,
      cart_product_count,
      shipping_fee: 0 * p.length,
      outOfStockProducts,
      buy_product_item,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const delete_cart_product = async (req, res) => {
  const { cartId } = req.params;
  try {
    await cartModel.findByIdAndDelete(cartId);
    return res.status(200).json({ message: "Product Removed from Cart" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const remove_wishlist_product = async (req, res) => {
  const { wishlistId } = req.params;
  try {
    const wishlist = await wishlistModel.findByIdAndDelete(wishlistId);
    return res
      .status(200)
      .json({ message: "Product removed from Wishlist", wishlistId });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const quantity_inc = async (req, res) => {
  const { cartId } = req.params;
  try {
    const product = await cartModel.findById(cartId);
    const { quantity } = product;
    await cartModel.findByIdAndUpdate(cartId, { quantity: quantity + 1 });
    return res.status(200).json({ message: "Quantity updated Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const quantity_dec = async (req, res) => {
  const { cartId } = req.params;
  try {
    const product = await cartModel.findById(cartId);
    const { quantity } = product;
    await cartModel.findByIdAndUpdate(cartId, { quantity: quantity - 1 });
    return res.status(200).json({ message: "Quantity updated Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  add_to_cart,
  get_cart_products,
  delete_cart_product,
  quantity_inc,
  quantity_dec,
  add_to_wishlist,
  get_wishlist_products,
  remove_wishlist_product,
};
