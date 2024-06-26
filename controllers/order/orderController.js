const moment = require("moment");
const authOrderModel = require("../../models/authOrder");
const customerOrderModel = require("../../models/customerOrder");
const cartModel = require("../../models/cartModel");
const {
  mongo: { ObjectId },
} = require("mongoose");

const paymentCheck = async (id) => {
  try {
    const order = await customerOrderModel.findById(id);
    if (order.payment_status === "unpaid") {
      await customerOrderModel.findByIdAndUpdate(id, {
        delivery_status: "cancelled",
      });
      await authOrderModel.updateMany(
        { orderId: id },
        {
          delivery_status: "cancelled",
        }
      );
    }
    return true;
  } catch (error) {
    console.error("Payment Check Error:", error);
  }
};

const place_order = async (req, res) => {
  const { price, products, shipping_fee, shippingInfo, customerId } = req.body;

  let authorOrderData = [];
  let cartId = [];
  const tempDate = moment(Date.now()).format("LLLL");
  let customerOrderProduct = [];

  for (let i = 0; i < products.length; i++) {
    const pro = products[i].products;
    for (let j = 0; j < pro.length; j++) {
      const tempCusPro = pro[j].productInfo;
      tempCusPro.quantity = pro[j].quantity;
      customerOrderProduct.push(tempCusPro);
      if (pro[j]._id) {
        cartId.push(pro[j]._id);
      }
    }
  }

  try {
    const order = await customerOrderModel.create({
      customerId,
      shippingInfo,
      products: customerOrderProduct,
      price: price + shipping_fee,
      payment_status: "unpaid",
      delivery_status: "pending",
      date: tempDate,
    });

    for (let i = 0; i < products.length; i++) {
      const pro = products[i].products;
      const pri = products[i].price;
      const sellerId = products[i].sellerId;
      let storePro = [];
      for (let j = 0; j < pro.length; j++) {
        const tempPro = pro[j].productInfo;
        tempPro.quantity = pro[j].quantity;
        storePro.push(tempPro);
      }
      authorOrderData.push({
        orderId: order._id,
        sellerId,
        products: storePro,
        price: pri,
        payment_status: "unpaid",
        shippingInfo: "ShopCart Main Warehouse",
        delivery_status: "pending",
        date: tempDate,
      });
    }

    await authOrderModel.insertMany(authorOrderData);

    for (let k = 0; k < cartId.length; k++) {
      await cartModel.findByIdAndDelete(cartId[k]);
    }

    setTimeout(() => {
      paymentCheck(order._id);
    }, 15000); // 15 sec

    return res
      .status(200)
      .json({ message: "Order Placed Successfully", orderId: order._id });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_dashboard_data = async (req, res) => {
  const { customerId } = req.params;
  try {
    const recentOrders = await customerOrderModel
      .find({
        customerId: new ObjectId(customerId),
      })
      .limit(5);
    const pendingOrders = await customerOrderModel
      .find({
        customerId: new ObjectId(customerId),
        delivery_status: "pending",
      })
      .countDocuments();
    const cancelledOrders = await customerOrderModel
      .find({
        customerId: new ObjectId(customerId),
        delivery_status: "cancelled",
      })
      .countDocuments();
    const totalOrders = await customerOrderModel
      .find({ customerId: new ObjectId(customerId) })
      .countDocuments();
    return res
      .status(200)
      .json({ recentOrders, pendingOrders, totalOrders, cancelledOrders });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_orders = async (req, res) => {
  const { customerId, status } = req.params;
  try {
    let orders = [];
    if (status !== "all") {
      orders = await customerOrderModel.find({
        customerId: new ObjectId(customerId),
        delivery_status: status,
      });
    } else {
      orders = await customerOrderModel.find({
        customerId: new ObjectId(customerId),
      });
    }
    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_order_details = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await customerOrderModel.findById(orderId);
    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_admin_orders = async (req, res) => {
  let { page, perPage, searchValue } = req.query;
  page = parseInt(page);
  perPage = parseInt(perPage);
  const skipPage = perPage * (page - 1);
  try {
    if (searchValue) {
      
    } else {
      const orders = await customerOrderModel
        .aggregate([
          {
            $lookup: {
              from: "authorders",
              localField: "_id",
              foreignField: "orderId",
              as: "suborder",
            },
          },
        ])
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });

      const totalOrders = await customerOrderModel.aggregate([
        {
          $lookup: {
            from: "authorders",
            localField: "_id",
            foreignField: "orderId",
            as: "suborder",
          },
        },
      ]);
      return res.status(200).json({ orders, totalOrders: totalOrders.length });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_admin_order_details = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await customerOrderModel.aggregate([
      {
        $match: {
          _id: new ObjectId(orderId),
        },
      },
      {
        $lookup: {
          from: "authorders",
          localField: "_id",
          foreignField: "orderId",
          as: "suborder",
        },
      },
    ]);
    return res.status(200).json({ order: order[0] });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const admin_order_status_update = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    await customerOrderModel.findByIdAndUpdate(orderId, {
      delivery_status: status,
    });
    return res
      .status(200)
      .json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_seller_orders = async (req, res) => {
  const { sellerId } = req.params;
  let { page, perPage, searchValue } = req.query;
  page = parseInt(page);
  perPage = parseInt(perPage);
  const skipPage = perPage * (page - 1);
  try {
    if (searchValue) {
      const orders = await customerOrderModel.aggregate([]);
    } else {
      const orders = await authOrderModel
        .find({
          sellerId: sellerId,
        })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });

      const totalOrders = await authOrderModel
        .find({ sellerId })
        .countDocuments();

      return res.status(200).json({ orders, totalOrders });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_seller_order_details = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await authOrderModel.findById(orderId);
    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const seller_order_status_update = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    await authOrderModel.findByIdAndUpdate(orderId, {
      delivery_status: status,
    });
    return res
      .status(200)
      .json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  place_order,
  get_dashboard_data,
  get_orders,
  get_order_details,
  get_admin_orders,
  get_admin_order_details,
  admin_order_status_update,
  get_seller_orders,
  get_seller_order_details,
  seller_order_status_update,
};
