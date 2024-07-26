const myShopWallet = require("../../models/myShopWallet");
const productModel = require("../../models/productModel");
const customerOrder = require("../../models/customerOrder");
const sellerModel = require("../../models/sellerModel");
const AdminSellerMessage = require("../../models/chat/AdminSellerMessage");
const sellerCustomerMessage = require("../../models/chat/sellerCustomerMessage");
const sellerWallet = require("../../models/sellerWallet");
const authOrder = require("../../models/authOrder");
const {
  mongo: { ObjectId },
} = require("mongoose");

const get_admiin_dashboard_data = async (req, res) => {
  const { id } = req;
  try {
    const totalSale = await myShopWallet.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);
    const totalProduct = await productModel.find({}).countDocuments().sort({createdAt: -1});
    const totalOrder = await customerOrder.find({}).countDocuments().sort({createdAt: -1});
    const totalSeller = await sellerModel.find({}).countDocuments().sort({createdAt: -1});
    const messages = await AdminSellerMessage.find({}).limit(3).sort({createdAt: -1});
    const recentOrder = await customerOrder.find({}).limit(5).sort({createdAt: -1});
    return res.status(200).json({
      totalProduct,
      totalOrder,
      totalSeller,
      messages,
      recentOrder,
      totalSale: totalSale.length > 0 ? totalSale[0].totalAmount : 0,
    });
  } catch {
    console.error(error);
    return res.status(500).json({ error });
  }
};

const get_seller_dashboard_data = async (req, res) => {
  const { id } = req;
  try {
    const totalSale = await sellerWallet.aggregate([
      {
        $match: {
          sellerId: {
            $eq: id,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);
    const totalProduct = await productModel
      .find({ sellerId: new ObjectId(id) })
      .countDocuments().sort({createdAt: -1});
    const totalOrder = await authOrder
      .find({ sellerId: new ObjectId(id) })
      .countDocuments().sort({createdAt: -1});
    const totalPendingOrder = await authOrder
      .find({
        $and: [
          {
            sellerId: {
              $eq: new ObjectId(id),
            },
          },
          {
            delivery_status: {
              $eq: "pending",
            },
          },
        ],
      })
      .countDocuments().sort({createdAt: -1});
    const messages = await sellerCustomerMessage
      .find({
        $or: [
          {
            senderId: {
              $eq: id,
            },
          },
          {
            receiverId: {
              $eq: id,
            },
          },
        ],
      })
      .limit(3);

    const recentOrder = await authOrder
      .find({
        sellerId: new ObjectId(id),
      })
      .limit(5).sort({createdAt: -1});
      return res.status(200).json({
        totalProduct,
        totalOrder,
        totalPendingOrder,
        messages,
        recentOrder,
        totalSale: totalSale.length > 0 ? totalSale[0].totalAmount : 0,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
};

module.exports = {
  get_admiin_dashboard_data,
  get_seller_dashboard_data,
};
