const User = require('../models/User');

// Sab users ki list get karna (sirf admin ke liye)
exports.getAllUsers = async (req, res) => {
    try {
        // Password ke ilawa tamam user data find karo
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// User ko update karna (Block/Unblock, Calling On/Off)
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Request body se aane wali values se user ko update karo
        // Agar value mojood hai to update karo, warna purani value rehne do
        user.status = req.body.status !== undefined ? req.body.status : user.status;
        user.callingEnabled = req.body.callingEnabled !== undefined ? req.body.callingEnabled : user.callingEnabled;
        
        // Updated user ko save karo
        const updatedUser = await user.save();
        res.json({ 
            message: 'User updated successfully', 
            user: {
                _id: updatedUser._id,
                status: updatedUser.status,
                callingEnabled: updatedUser.callingEnabled
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
