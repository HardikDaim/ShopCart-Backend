const jwt = require('jsonwebtoken');

module.exports.createToken = async (data) => {
    try {
        const token = await jwt.sign(data, process.env.SECRET, { expiresIn: '7d' });
        return token;
    } catch (error) {
        throw new Error('Token generation failed');
    }
}
