const jwt = require('jsonwebtoken');

module.exports.authMiddleware = async (req, res, next) => {
    const { accessToken } = req.cookies;
    if (!accessToken) {
        console.error('No accessToken found');
        return res.status(401).json({ error: "Please Login First" });
    } else {
        try {
            const decodeToken = await jwt.verify(accessToken, process.env.SECRET);
            req.role = decodeToken.role;
            req.id = decodeToken.id;
            console.log('User authenticated');
            next();
        } catch (error) {
            console.error('JWT Verification Error:', error);
            return res.status(401).json({ error: "Unauthorized" });
        }
    }
};
