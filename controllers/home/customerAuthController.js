const customerModel = require("../../models/customerModel");
const bcrypt = require("bcrypt");
const sellerCustomerModel = require("../../models/chat/sellerCustomerModel");
const { createToken } = require("../../utils/tokenCreate");

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

const customer_logout = async (req, res) => {
  res.cookie("customerToken", "", {
    expires: new Date(Date.now()),
  });
  return res.status(200).json({ message: "logout Successfully" });
};

module.exports = {
  customer_register,
  customer_login,
  customer_logout,
};
