const paymentModel = require("../../models/paypalModel");
const sellerModel = require("../../models/sellerModel");
const QRCode = require('qrcode');

const create_paypal_connect_account = async (req, res) => {
  const { id } = req.id;
  try {
    await sellerModel.findByIdAndUpdate(req.id, {
      payment: "active",
    });
    const seller = await sellerModel.findById(req.id);

    res
      .status(200)
      .json({ message: "Seller Account Activated Successfully.", seller });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const generate_qr = async (req, res) => {
  const {orderId , amount, upiId } = req.body;
  try {
    const qrData = `upi://pay?pa=${upiId}&am=${amount}&cu=INR&mode=02&purpose=00&orgid=189999&orderid=${orderId}`;
    const qrImage = await QRCode.toDataURL(qrData);
    res.json({ qrImage, message: "QR code generated successfully" });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}

const payment_callback = async (req, res) => {
  const { orderId, status } = req.body;
  
  try {
    // const order = await Order.findById(orderId);
    // if (!order) {
    //   return res.status(404).json({ error: 'Order not found' });
    // }

    if (status === 'SUCCESS') {
      order.paymentStatus = 'paid';
      await order.save();
      return res.status(200).json({ message: 'Payment successful' });
    } else {
      return res.status(400).json({ error: 'Payment failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Payment processing failed' });
  }
}
module.exports = {
  create_paypal_connect_account,
  generate_qr,payment_callback
};
