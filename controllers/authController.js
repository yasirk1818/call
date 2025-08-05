const User = require('../models/User');

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password, whatsappNumber, city } = req.body;

        // Check karein ke user pehle se exist to nahi karta
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'Email ya Username pehle se istemaal me hai' });
        }

        // Naya user banayein
        const user = new User({
            username,
            email,
            password,
            whatsappNumber,
            city
        });

        // User ko database me save karein
        await user.save();
        
        // Registration successful hone par login page par redirect karein
        res.status(201).redirect('/login');

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
