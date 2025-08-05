const User = require('../models/User');
const bcrypt = 'bcryptjs';
const jwt = require('jsonwebtoken');

// Naya function: Token generate karne ke liye
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d' // Token 30 din me expire hoga
    });
};

// Pehle se mojood registerUser function...
exports.registerUser = async (req, res) => {
    // ... aapka pichla code ...
};

// Naya login function
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // User ko email se dhoondein
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' }); // User nahi mila
        }

        // Password compare karein
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' }); // Password ghalat hai
        }

        // Agar user block hai to login na karne dein
        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Aapka account block kar dia gaya hai.' });
        }
        
        // Token generate karein aur response me bhejein
        const token = generateToken(user._id);
        
        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                username: user.username
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
