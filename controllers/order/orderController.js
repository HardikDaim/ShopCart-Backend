const nodemailer = require("nodemailer");
const moment = require("moment");
const authOrderModel = require("../../models/authOrder");
const customerOrderModel = require("../../models/customerOrder");
const customerModel = require("../../models/customerModel");
const sellerModel = require("../../models/sellerModel.js");
const cartModel = require("../../models/cartModel");
const {
  mongo: { ObjectId },
} = require("mongoose");


const place_order = async (req, res) => {
  const { price, products, shipping_fee, shippingInfo, customerId, sellerId } =
    req.body;
 
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
    // Extract customer email
    const customer = await customerModel.findById(customerId);
    if (!customer) {
      return res.status(400).json({ message: "Customer not found" });
    }
    var customerEmail = customer.email;
    if (customer.email !== shippingInfo.email) {
      customerEmail = shippingInfo.email;
    }

    // 2. Extract seller emails (from multiple sellerIds)
    const sellers = await sellerModel.find({ _id: { $in: sellerId } });
    if (!sellers || sellers.length === 0) {
      return res.status(400).json({ message: "No sellers found" });
    }

    // Extract the emails of all the sellers
    const sellerEmails = sellers.map((seller) => seller.email);
    // 3. Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const customerMailOptions = {
      from: 'ShopCart - Seller Dashboard" <hardikdaim@gmail.com>', // sender address
      to: customerEmail, // customer email
      subject: "Order Confirmation - Please Complete Your Payment",
      html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f9;
            }
            .email-container {
              max-width: 100%;
              margin: 0 auto;
              padding: 2px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background-color: #3b82f6;
              color: #ffffff;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 20px;
              color: #333;
            }
            .content p {
              line-height: 1.5;
            }
            .order-details {
              margin: 20px 0;
              padding: 10px;
              background-color: #f9fafb;
              border-radius: 5px;
              border: 1px solid #e5e7eb;
            }
            .product-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .product-item img {
              max-width: 150px;
              height: auto;
              border-radius: 8px;
              margin-bottom: 10px;
            }
            .product-info {
              flex: 1;
            }
            .pay-now-button {
              text-align: center;
              margin-top: 20px;
            }
            .pay-now-button a {
              display: inline-block;
              background-color: #3b82f6;
              color: white;
              padding: 15px 30px;
              border-radius: 50px;
              font-size: 18px;
              text-decoration: none;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
            @media (max-width: 600px) {
              .product-item {
                flex-direction: column;
                align-items: center;
              }
              .product-item img {
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>ShopCart - Order Confirmation Complete your Payment</h1>
            </div>
            <div class="content">
              <p>Dear ${shippingInfo.firstName} ${shippingInfo.lastName},</p>
              <p>Thank you for your order! To confirm and complete your order, please make the payment. Here are the details:</p>
      
              <div class="order-details">
                <p><strong>Order Details:</strong></p>
                <p><strong>Price:</strong> ₹${price}</p>
                <p><strong>Shipping Fee:</strong> ₹${shipping_fee}</p>
                <p><strong>Shipping Information:</strong></p>
                <p>${shippingInfo.firstName} ${shippingInfo.lastName},<br>
                  ${shippingInfo.address}, ${shippingInfo.city}, ${
        shippingInfo.state
      }, ${shippingInfo.postalCode},<br>
                  ${shippingInfo.country}<br>
                  Phone: ${shippingInfo.phone}<br>
                  Email: ${shippingInfo.email}
                </p>
      
                <p><strong>Products:</strong></p>
      
                ${products
                  .map(
                    (seller) => `
                  <div>
                    <h3 style="text-align: center; color: #3b82f6;">Seller: ${
                      seller.shopName
                    }</h3>
                    ${seller.products
                      .map(
                        (product) => `
                      <div style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f9fafb;">
                      <a href="https://shop-cart-ten-chi.vercel.app/product/details/${
                        product.productInfo.slug
                      }">
                        <div style="text-align: center;">
                            <img src="${product.productInfo.images[0]}" alt="${
                          product.productInfo.name
                        }" style="max-width: 100%; height: auto; border-radius: 8px;">
                        </div>
                        </a>
                        <div style="padding-top: 15px; color: #333;">
                          <p><strong style="font-size: 16px;">${
                            product.productInfo.name
                          }</strong></p>
                          <p><strong>Brand:</strong> ${
                            product.productInfo.brand
                          }</p>
                          <p><strong>Quantity:</strong> ${product.quantity}</p>
                          <p><strong>Total:</strong> ₹${
                            product.productInfo.price -
                            Math.floor(
                              (product.productInfo.price *
                                product.productInfo.discount) /
                                100
                            )
                          }</p>
                        </div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                `
                  )
                  .join("")}
              </div>
      
              <p>Please click the button below to complete your payment and finalize your order:</p>
      
              <div class="pay-now-button">
                <a href="https://shop-cart-ten-chi.vercel.app/dashboard">Pay Now</a>
              </div>
      
              <p>We will notify you once your order is shipped.</p>
              <p>Best regards,<br>Your ShopCart Team</p>
            </div>
            <div class="footer">
              <p>ShopCart | All rights reserved &copy; ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
      </html>
      `,
    };

    const sellerMailOptions = {
      from: 'ShopCart - Seller Dashboard" <hardikdaim@gmail.com>', // sender address
      to: sellerEmails.join(","), // seller emails (separated by commas)
      subject: "New Order Pending Payment",
      html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f9;
            }
            .email-container {
              max-width: 100%;
              margin: 0 auto;
              padding: 2px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background-color: #3b82f6;
              color: #ffffff;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 20px;
              color: #333;
            }
            .content p {
              line-height: 1.5;
            }
            .order-details {
              margin: 20px 0;
              padding: 10px;
              background-color: #f9fafb;
              border-radius: 5px;
              border: 1px solid #e5e7eb;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
            @media (max-width: 600px) {
              .product-item {
                flex-direction: column;
                align-items: center;
              }
              .product-item img {
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>ShopCart - New Order Pending Payment</h1>
            </div>
            <div class="content">
              <p>Dear Seller(s),</p>
              <p>You have received a new order that has not yet been paid. The customer is attempting to place an order, but the payment is still pending. Please review the order details below:</p>
      
              <div class="order-details">
                <p><strong>Order Details:</strong></p>
                <p><strong>Customer:</strong> ${shippingInfo.firstName} ${
        shippingInfo.lastName
      }</p>
                <p><strong>Order Total:</strong> ₹${price}</p>
                <p><strong>Shipping Information:</strong></p>
                <p>${shippingInfo.firstName} ${shippingInfo.lastName},<br>
                  ${shippingInfo.address}, ${shippingInfo.city}, ${
        shippingInfo.state
      }, ${shippingInfo.postalCode},<br>
                  ${shippingInfo.country}<br>
                  Phone: ${shippingInfo.phone}<br>
                  Email: ${shippingInfo.email}
                </p>
      
                <p><strong>Products:</strong></p>
      
                ${products
                  .map(
                    (seller) => `
                  <div>
                    <h3 style="text-align: center; color: #3b82f6;">Seller: ${
                      seller.shopName
                    }</h3>
                    ${seller.products
                      .map(
                        (product) => `
                      <div style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f9fafb;">
                      <a href="https://shop-cart-ten-chi.vercel.app/product/details/${
                        product.productInfo.slug
                      }">
                        <div style="text-align: center;">
  <img src="${product.productInfo.images[0]}" alt="${
                          product.productInfo.name
                        }" style="max-width: 100%; height: auto; border-radius: 8px;">
                        </div>
                        </a>
                        <div style="padding-top: 15px; color: #333;">
                          <p><strong style="font-size: 16px;">${
                            product.productInfo.name
                          }</strong></p>
                          <p><strong>Brand:</strong> ${
                            product.productInfo.brand
                          }</p>
                          <p><strong>Quantity:</strong> ${product.quantity}</p>
                          <p><strong>Total:</strong> ₹${
                            product.productInfo.price -
                            Math.floor(
                              (product.productInfo.price *
                                product.productInfo.discount) /
                                100
                            )
                          }</p>
                        </div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                `
                  )
                  .join("")}
              </div>
      
              <p>Please wait for the payment confirmation from the customer. The order will be processed once the payment is successful.</p>
              <p>Best regards,<br>Your ShopCart Team</p>
            </div>
            <div class="footer">
              <p>ShopCart | All rights reserved &copy; ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
      </html>
      `,
    };

    await transporter.sendMail(customerMailOptions);

    await transporter.sendMail(sellerMailOptions);


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

    return res
      .status(200)
      .json({ orderId: order._id });
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
      .limit(5)
      .sort({ createdAt: -1 });
    const pendingOrders = await customerOrderModel
      .find({
        customerId: new ObjectId(customerId),
        delivery_status: "pending",
      })
      .countDocuments()
      .sort({ createdAt: -1 });
    const cancelledOrders = await customerOrderModel
      .find({
        customerId: new ObjectId(customerId),
        delivery_status: "cancelled",
      })
      .countDocuments()
      .sort({ createdAt: -1 });
    const totalOrders = await customerOrderModel
      .find({ customerId: new ObjectId(customerId) })
      .countDocuments()
      .sort({ createdAt: -1 });
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
      orders = await customerOrderModel
        .find({
          customerId: new ObjectId(customerId),
          delivery_status: status,
        })
        .sort({ createdAt: -1 });
    } else {
      orders = await customerOrderModel
        .find({
          customerId: new ObjectId(customerId),
        })
        .sort({ createdAt: -1 });
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
