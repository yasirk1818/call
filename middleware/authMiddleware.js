const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Yeh middleware check karta hai ke user logged-in hai ya nahi
const protect = async (req, res, next) => {
    let token;

    // Request ke header se 'Bearer' token nikalta hai
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // User ki details (password ke ilawa) request object me daal deta hai
            req.user = await User.findById(decoded.id).select('-password');
            
            next(); // Agle step par jane ki ijazat deta hai
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Yeh middleware check karta hai ke logged-in user admin hai ya nahi
const admin = (req, res, next) => {
    // 'protect' middleware se req.user pehle hi set ho chuka hota hai
    if (req.user && req.user.isAdmin) {
        next(); // Agar user admin hai, to aage jao
    } else {
        // Agar admin nahi, to error bhejo
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
