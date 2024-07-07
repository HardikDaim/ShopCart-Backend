const bcrypt = require("bcrypt");
const { createToken } = require("../utils/tokenCreate");
const adminModel = require("../models/adminModel");
const sellerModel = require("../models/sellerModel");
const sellerCustomerModel = require("../models/chat/sellerCustomerModel");
const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");

const cookieOptions = {
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: "hardikdaim@gmail.com",
    pass: "ybjm lryg iyub caax",
  },
});

const admin_login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({ error: "Incorrect E-mail" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(404).json({ error: "Incorrect Password" });
    }

    const token = await createToken({
      id: admin._id,
      role: admin.role,
    });

    res.cookie("accessToken", token, cookieOptions);

    return res.status(200).json({ message: "Login Successful", token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUser = async (req, res) => {
  const { id, role } = req;
  try {
    if (role === "admin") {
      const admin = await adminModel.findById(id);
      return res.status(200).json({ userInfo: admin });
    } else {
      const seller = await sellerModel.findById(id);
      return res.status(200).json({ userInfo: seller });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const seller_register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const getUser = await sellerModel.findOne({ email });
    if (getUser) {
      return res.status(404).json({ error: "User Already Exists, Login Now" });
    } else {
      const seller = await sellerModel.create({
        name,
        email,
        password: await bcrypt.hash(password, 10),
        method: "manual",
        shopInfo: {},
      });
      await sellerCustomerModel.create({ myId: seller._id });
      const token = await createToken({ id: seller._id, role: seller.role });
      res.cookie("accessToken", token, cookieOptions);
      return res.status(201).json({
        message: "Registered Successfully",
        token,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const seller_login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const seller = await sellerModel.findOne({ email });
    if (!seller) {
      return res.status(404).json({ error: "Incorrect E-Mail" });
    }

    const match = await bcrypt.compare(password, seller.password);
    if (!match) {
      return res.status(404).json({ error: "Incorrect Password" });
    }

    const token = await createToken({
      id: seller._id,
      role: seller.role,
    });

    res.cookie("accessToken", token, cookieOptions);

    return res.status(200).json({ message: "Login Successful", token });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const profile_image_upload = async (req, res) => {
  const { id } = req;
  const form = new formidable.IncomingForm({ multiples: true });

  form.parse(req, async (err, _, files) => {
    if (err) {
      console.error("Error parsing form data:", err);
      return res.status(500).json({ error: "Error parsing form data" });
    }

    const { image } = files;
    if (!image) {
      return res
        .status(400)
        .json({ error: "No image file found in the request" });
    }

    try {
      // Configuration for Cloudinary
      cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        secure: true,
      });

      const result = await cloudinary.uploader.upload(image[0].filepath, {
        folder: "profiles",
      });

      if (result && result.secure_url) {
        await sellerModel.findByIdAndUpdate(id, { image: result.secure_url });
        const userInfo = await sellerModel.findById(id);
        if (!userInfo) {
          return res.status(404).json({ error: "User not found" });
        }
        return res
          .status(200)
          .json({ message: "Profile Image Updated", userInfo });
      } else {
        return res
          .status(500)
          .json({ error: "Error uploading image to Cloudinary" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
};

const add_profile_info = async (req, res) => {
  const { shopName, state, city, country } = req.body;
  const { id } = req;
  try {
    await sellerModel.findByIdAndUpdate(id, {
      shopInfo: { shopName, state, city, country },
    });
    const userInfo = await sellerModel.findById(id);
    res.status(200).json({ message: "Profile Updated Successfully", userInfo });
  } catch (error) {
    res.status(404).json({ error: "Profile Updation Failed" });
  }
};

const seller_profile_update_mail = async (req, res) => {
  const { shopName, state, city, country } = req.body;
  const { id } = req;
  try {
    const userInfo = await sellerModel.findById(id);
    const sellerEmail = userInfo.email;

    // Mail to Admin
    await transporter.sendMail({
      from: '"ShopCart - Seller Dashboard" <hardikdaim@gmail.com>', // sender
      to: "hardikdaim@gmail.com",
      subject: "New Seller Profile Updated",
      html: `
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
              <h2>Seller Profile Update Notification</h2>
              <p>Hello Admin,</p>
              <p>A seller has updated their profile. Please review the details below and update the seller account from pending to active if everything is in order.</p>
              <p><strong>Seller Information:</strong></p>
              <p><strong>Seller Name:</strong> ${userInfo.name}</p>
              <p><strong>Shop Name:</strong> ${shopName}</p>
              <p><strong>Status:</strong> ${userInfo.status}</p>
              <p><strong>Location:</strong> ${city}, ${state}, ${country}</p>
              <p>Thank you for your attention.</p>
              <a href="https://shop-cart-dashboard.vercel.app/admin/dashboard/seller-request" class="btn">Review Seller Profile</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ShopCart. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
      `,
    });

    // Mail to Seller
    await transporter.sendMail({
      from: '"ShopCart - Seller Dashboard" <hardikdaim@gmail.com>', // sender
      to: sellerEmail,
      subject: "Your Seller Profile is Under Review",
      html: `
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
              <h2>Your Profile is Under Review</h2>
              <p>Hello ${userInfo.name},</p>
              <p>Thank you for completing your seller profile. Your profile is currently under review by our admin team. You will be notified once your account is approved and activated.</p>
              <p>In the meantime, please make sure you have added your profile photo and all required data. If you have any questions or need assistance, feel free to contact our support team.</p>
              <a href="https://shop-cart-dashboard.vercel.app/seller/dashboard/profile" class="btn">View Profile</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ShopCart. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
      `,
    });

    res.status(200).json();
  } catch (error) {
    console.error("Error Sending Mail:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



const logout = (req, res) => {
  try {
    res.cookie("accessToken", "", {
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });
    return res.status(200).json({ message: "Logout Successfully" });
  } catch (error) {
    console.error("Error parsing form data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const change_seller_password = async (req, res) => {
  const { email, oldPassword, newPassword, confirmPassword } = req.body;

  try {
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Please fill all the fields" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Password and Confirm Password do not match" });
    }

    const seller = await sellerModel.findOne({ email });
    if (!seller) {
      return res.status(400).json({ error: "Seller does not exist" });
    }

    const isMatch = await bcrypt.compare(oldPassword, seller.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Old Password is incorrect" });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10); 
    seller.password = hashPassword;
    await seller.save();

    return res.status(200).json({ message: "Password Changed Successfully", userInfo: seller });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = {
  admin_login,
  getUser,
  seller_register,
  seller_login,
  profile_image_upload,
  add_profile_info,
  logout,
  seller_profile_update_mail,
  change_seller_password
};
