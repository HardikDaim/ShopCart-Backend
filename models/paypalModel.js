const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paypalSchema = new Schema({
    sellerId: {
        type: Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    },

}, { timestamps: true });

module.exports = mongoose.model('PayPal', paypalSchema);
