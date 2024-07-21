const customerModel = require("../../models/customerModel");
const bcrypt = require("bcrypt");
const sellerCustomerModel = require("../../models/chat/sellerCustomerModel");
const { createToken } = require("../../utils/tokenCreate");
const nodemailer = require("nodemailer");

const customer_register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const customer = await customerModel.findOne({ email });
    if (customer) {
      return res
        .status(404)
        .json({ error: "E-Mail Already Exists, Login Now!" });
    } else {
      const createCustomer = await customerModel.create({
        name: name.trim(),
        email: email.trim(),
        password: await bcrypt.hash(password, 10),
        method: "manual",
      });
      await sellerCustomerModel.create({ myId: createCustomer.id });
      const token = await createToken({
        id: createCustomer.id,
        name: createCustomer.name,
        email: createCustomer.email,
        method: createCustomer.method,
      });
      res.cookie("customerToken", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
      });
      res.status(200).json({ message: "User Registered Successfully", token });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: "hardikdaim@gmail.com",
    pass: "ybjm lryg iyub caax",
  },
});

const register_Mail = async (req, res) => {
  const { email, name } = req.body;
  try {
    await transporter.sendMail({
      from: '"ShopCart" <hardikdaim@gmail.com>', // sender
      to: email,
      subject: "Welcome to ShopCart!",
      html: `
      <html>
        <head>
          <style>
            /* External CSS file link or styles */
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap');
            /* Additional CSS styles */
            body {
              font-family: 'Roboto', sans-serif;
              line-height: 1.6;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #007bff;
              color: #ffffff;
              padding: 10px;
              text-align: center;
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
            }
            .content {
              padding: 20px;
            }
            .cta-button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #007bff;
              color: #ffffff;
              text-decoration: none;
              border-radius: 4px;
            }
            .cta-button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ShopCart!</h1>
            </div>
           <div class="content">
  <p>Hi ${name},</p>
  <p>Thank you for registering with ShopCart! We're thrilled to have you join our community of shoppers.</p>
  <p>Discover the latest trends and must-have items curated just for you.</p>
  <p>Shop confidently with our secure payment gateway and fast delivery options.</p>
  <p>Don't miss out on our exclusive offers and seasonal discounts.</p>
  <p>Enjoy your shopping experience with us!</p>
  <a href="https://shop-cart-ten-chi.vercel.app" class="cta-button">Start Shopping</a>
</div>

          </div>
        </body>
      </html>
    `,
    });
    res.status(200).json();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send email" });
  }
};

const customer_login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const customer = await customerModel.findOne({ email });
    if (!customer) {
      return res.status(404).json({ error: "User not found, Register now" });
    }

    const match = await bcrypt.compare(password, customer.password);

    if (!match) {
      return res.status(404).json({ error: "Incorrect Password" });
    }

    const token = await createToken({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      method: customer.method,
    });
    res.cookie("customerToken", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    return res.status(200).json({ message: "Login Successful", token });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const login_Mail = async (req, res) => {
  const { email } = req.body;
  try {
    await transporter.sendMail({
      from: '"ShopCart" <hardikdaim@gmail.com>', 
      to: email,
      subject: "Welcome to ShopCart!",
      html: `
     <html>
  <head>
    <style>
      /* External CSS file link or styles */
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap');
      /* Additional CSS styles */
      body {
        font-family: 'Roboto', sans-serif;
        line-height: 1.6;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: #007bff;
        color: #ffffff;
        padding: 10px;
        text-align: center;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }
      .content {
        padding: 20px;
      }
      .cta-button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: #ffffff;
        text-decoration: none;
        border-radius: 4px;
      }
      .cta-button:hover {
        background-color: #0056b3;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome back to ShopCart!</h1>
      </div>
     <div class="content">
  <p>Hi Customer,</p>
  <p>Welcome back to ShopCart! You've successfully logged into your account.</p>
  <p>Explore our latest collections and find great deals just for you.</p>
  <p>Don't forget to check out our featured products and seasonal offers.</p>
  <p>Have questions or need assistance? Our customer support team is here to help you!</p>
  <a href="https://shop-cart-ten-chi.vercel.app" class="cta-button">Start Shopping</a>
</div>
    </div>
  </body>
</html>

    `,
    });
    res.status(200).json();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send email" });
  }
};

const customer_logout = async (req, res) => {
  res.cookie("customerToken", "", {
    expires: new Date(Date.now()),
  });
  return res.status(200).json({ message: "logout Successfully" });
};

const change_customer_password = async(req, res) => {
  const { email, oldPassword, newPassword, confirmPassword } = req.body;
  try {
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Please fill all the fields" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Password and Confirm Password do not match" });
    }

    const customer = await customerModel.findOne({ email });
    if (!customer) {
      return res.status(400).json({ error: "Customer does not exist" });
    }

    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current Password is incorrect" });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10); 
    customer.password = hashPassword;
    await customer.save();

    return res.status(200).json({ message: "Password Changed Successfully", userInfo: customer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = {
  customer_register,
  customer_login,
  customer_logout,
  register_Mail,
  login_Mail,
  change_customer_password
};
