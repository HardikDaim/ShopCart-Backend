const paymentModel = require('../../models/paypalModel');
const sellerModel = require('../../models/sellerModel')

const create_paypal_connect_account = async (req, res) => {
    const { id } = req.id;
    try {
      await sellerModel.findByIdAndUpdate(req.id, {
        payment: 'active'
      });
  const seller = await sellerModel.findById(req.id)

      res.status(200).json({ message: "Seller Account Activated Successfully.",seller  });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

module.exports = {
    create_paypal_connect_account
}