const sellerModel = require("../../models/sellerModel");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const get_seller_request = async (req, res) => {
  const { page, searchValue, perPage } = req.query;
  const skipPage = parseInt(perPage) * (parseInt(page) - 1);
  try {
    let query = { status: "pending" };

    if (searchValue) {
      // Add search condition to the query
      query = {
        ...query,
        $or: [
          { name: { $regex: searchValue, $options: "i" } }, // case-insensitive search
          { email: { $regex: searchValue, $options: "i" } },
        ],
      };
    }

    const sellers = await sellerModel
      .find(query)
      .skip(skipPage)
      .limit(parseInt(perPage))
      .sort({ createdAt: -1 });
    const totalSeller = await sellerModel.countDocuments(query);

    return res
      .status(200)
      .json({ message: "Seller Info Fetched", sellers, totalSeller });
  } catch (error) {
    console.log(error.message);
    return res.status(404).json({ error: error.message });
  }
};

const get_seller = async (req, res) => {
  const { sellerId } = req.params;
  try {
    const seller = await sellerModel.findById(sellerId);
    res.status(200).json({ message: "Seller Details Fetched", seller });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const seller_status_update = async (req, res) => {
  const { sellerId, status } = req.body;
  try {
    await sellerModel.findByIdAndUpdate(sellerId, { status });
    const seller = await sellerModel.findById(sellerId);
    res
      .status(200)
      .json({ message: "Seller Status Updated Successfully", seller });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const get_active_sellers = async (req, res) => {
  let { page, perPage, searchValue } = req.query;
  page = parseInt(page);
  perPage = parseInt(perPage);
  const skipPage = perPage * (page - 1);
  try {
    if (searchValue) {
      const sellers = await sellerModel
        .find({
          $text: { $search: searchValue },
          status: "active",
        })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });
      const totalSeller = await sellerModel
        .find({ $text: { $search: searchValue }, status: "active" })
        .countDocuments();
      res.status(200).json({ sellers, totalSeller });
    } else {
      const sellers = await sellerModel
        .find({ status: "active" })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });

      const totalSeller = await sellerModel
        .find({ status: "active" })
        .countDocuments();
      res.status(200).json({ sellers, totalSeller });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(404).json({ error: error.message });
  }
};

const get_deactive_sellers = async (req, res) => {
  let { page, perPage, searchValue } = req.query;
  page = parseInt(page);
  perPage = parseInt(perPage);
  const skipPage = perPage * (page - 1);
  try {
    if (searchValue) {
      const sellers = await sellerModel
        .find({
          $text: { $search: searchValue },
          status: "deactive",
        })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });
      const totalSeller = await sellerModel
        .find({ $text: { $search: searchValue }, status: "deactive" })
        .countDocuments();
      res.status(200).json({ sellers, totalSeller });
    } else {
      const sellers = await sellerModel
        .find({ status: "deactive" })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });

      const totalSeller = await sellerModel
        .find({ status: "deactive" })
        .countDocuments();
      res.status(200).json({ sellers, totalSeller });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(404).json({ error: error.message });
  }
};


const mail_seller_status_update = async (req, res) => {
  const { sellerId, status } = req.body;
  try {
    const seller = await sellerModel.findById(sellerId);
    let subject = '';
    let htmlContent = '';

    if (status === 'active') {
      subject = 'Your Seller Account is Now Active';
      htmlContent = `
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap');
              body {
                font-family: 'Roboto', sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }
              .header {
                background-color: #007BFF;
                color: #ffffff;
                padding: 10px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                padding: 20px;
              }
              .content h2 {
                color: #333333;
              }
              .content p {
                color: #666666;
                line-height: 1.5;
              }
              .footer {
                background-color: #007BFF;
                color: #ffffff;
                padding: 10px;
                border-radius: 0 0 8px 8px;
                text-align: center;
              }
              .btn {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                color: #ffffff;
                background-color: #28a745;
                text-decoration: none;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>ShopCart - Seller Dashboard</h1>
              </div>
              <div class="content">
                <h2>Your Seller Account is Now Active</h2>
                <p>Hello,</p>
                <p>Congratulations! Your seller account has been activated. You can now start managing your products and orders on ShopCart.</p>
                <a href="https://shop-cart-dashboard.vercel.app/seller/dashboard" class="btn">Go to Dashboard</a>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ShopCart. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    } else if (status === 'deactive') {
      subject = 'Your Seller Account Has Been Deactivated';
      htmlContent = `
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap');
              body {
                font-family: 'Roboto', sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }
              .header {
                background-color: #FF0000;
                color: #ffffff;
                padding: 10px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                padding: 20px;
              }
              .content h2 {
                color: #333333;
              }
              .content p {
                color: #666666;
                line-height: 1.5;
              }
              .footer {
                background-color: #FF0000;
                color: #ffffff;
                padding: 10px;
                border-radius: 0 0 8px 8px;
                text-align: center;
              }
              .btn {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                color: #ffffff;
                background-color: #007BFF;
                text-decoration: none;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>ShopCart - Seller Dashboard</h1>
              </div>
              <div class="content">
                <h2>Your Seller Account Has Been Deactivated</h2>
                <p>Hello,</p>
                <p>We regret to inform you that your seller account has been deactivated due to non-compliance with our policies. If you believe this is a mistake or need further assistance, please contact our support team.</p>
                <a href="https://shop-cart-dashboard.vercel.app/seller/dashboard/chat-support" class="btn">Contact Support</a>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ShopCart. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    await transporter.sendMail({
      from: '"ShopCart - Seller Dashboard" <hardikdaim@gmail.com>', // sender
      to: seller.email,
      subject: subject,
      html: htmlContent,
    });

    res.status(200).json();
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: error.message });
  }
}


module.exports = {
  get_seller_request,
  get_seller,
  seller_status_update,
  get_active_sellers,
  get_deactive_sellers,
  mail_seller_status_update
};
