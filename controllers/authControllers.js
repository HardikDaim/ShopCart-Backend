const bcrypt = require("bcrypt");
const { createToken } = require("../utils/tokenCreate");
const adminModel = require("../models/adminModel");
const sellerModel = require("../models/sellerModel");
const sellerCustomerModel = require("../models/chat/sellerCustomerModel");
const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;

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

    res.cookie("accessToken", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      domain: process.env.COOKIE_DOMAIN || 'localhost', 
      secure: process.env.NODE_ENV === "production", 
      httpOnly: true, 
    });

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
      res.cookie("accessToken", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
        domain: process.env.COOKIE_DOMAIN || 'localhost', 
        secure: process.env.NODE_ENV === "production", 
        httpOnly: true, 
      });
      return res.status(201).json({
        message: "Registered Successfully, Login to Get Started",
        token,
      });
    }
  } catch (error) {
    return res.statue(500).json({ error: "Internal Server Error" });
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

    res.cookie("accessToken", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      domain: process.env.COOKIE_DOMAIN || 'localhost', 
      secure: process.env.NODE_ENV === "production", 
      httpOnly: true, 
    });

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

      if (result && result.secure_url ) {
        await sellerModel.findByIdAndUpdate(id, { image: result.secure_url  });
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
  const {shopName, state,city,country} = req.body;
  const {id} = req;
  try {
    await sellerModel.findByIdAndUpdate(id, {shopInfo: {shopName,state,city,country}});
    const userInfo = await sellerModel.findById(id);
    res.status(200).json({message: "Profile Updated Successfully", userInfo})
  } catch (error) {
    res.status(404).json({error: "Profile Updation Failed"})
  }
};

const logout = (req,res) => {
  try {
    res.cookie('accessToken', '', {
      expires: new Date(0)
    });
    return res.status(200).json({message: 'Logout Successfully'})
  } catch (error) {
    console.error("Error parsing form data:", err);
    return res.status(500).json({ error: "Error parsing form data" });
  }
}

module.exports = {
  admin_login,
  getUser,
  seller_register,
  seller_login,
  profile_image_upload,
  add_profile_info,
  logout
};
