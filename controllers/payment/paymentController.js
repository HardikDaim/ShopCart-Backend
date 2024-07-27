const qr = require('qr-image');

const generate_qr = async (req, res) => {
  const { orderId, amount, upiId } = req.body;
  if (!orderId || !amount || !upiId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const upiString = `upi://pay?pa=${upiId}&pn=ShopCart%20-%20An%20E-Commerce%20Platform&mc=0000&tid=${orderId}&tr=${orderId}&tn=Payment for order ${orderId}&am=${amount}&cu=INR`;
    const qrCode = qr.imageSync(upiString, { type: 'png' });
    const qrImage = `data:image/png;base64,${qrCode.toString('base64')}`;
    res.json({ qrImage });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

// Function to check payment status
const check_payment_status = async (req, res) => {
  const { orderId } = req.params;
  console.log("test")
 
};

module.exports = {
  generate_qr,
  check_payment_status
};
