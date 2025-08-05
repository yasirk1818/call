const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Check karein ke request ke header me token hai aur 'Bearer' se start ho raha hai
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Token ko header se nikalen ('Bearer ' ke baad wala hissa)
            token = req.headers.authorization.split(' ')[1];

            // Token ko verify karein
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // User ki ID se user ka data fetch karein (password ke ilawa) aur request me attach kar dein
            req.user = await User.findById(decoded.id).select('-password');
            
            next(); // Agle step par jao
        } catch (error) {
            console.error(error);
            return res.status(401).redirect('/login'); // Token ghalat hai to login page par bhejein
        }
    }

    if (!token) {
        return res.status(401).redirect('/login'); // Token nahi hai to login page par bhejein
    }
};

module.exports = { protect };
