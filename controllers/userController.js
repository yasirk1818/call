const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// 1. Username se user search karna
exports.searchUsers = async (req, res) => {
    try {
        const query = req.query.username || '';
        if (!query) {
            return res.json([]);
        }
        // Users dhoondein jo logged-in user na ho aur pehle se friend na ho
        const users = await User.find({
            username: { $regex: query, $options: 'i' }, // Case-insensitive search
            _id: { $ne: req.user._id } // Khud ko search result me na dikhayein
        }).select('username city'); // Sirf username aur city return karein

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. Friend request bhejna
exports.sendFriendRequest = async (req, res) => {
    const { toUserId } = req.body;
    const fromUserId = req.user._id;

    try {
        // Check karein ke request pehle se to nahi bheji
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { from: fromUserId, to: toUserId },
                { from: toUserId, to: fromUserId }
            ]
        });
        if (existingRequest) {
            return res.status(400).json({ message: 'Request pehle hi bhej di gayi hai ya aap pehle se dost hain.' });
        }
        
        const newRequest = new FriendRequest({ from: fromUserId, to: toUserId });
        await newRequest.save();

        // Real-time notification ke liye (hum isay baad me add karenge)
        
        res.status(201).json({ message: 'Friend request bhej di gayi' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 3. Friend request ko respond karna (Accept/Reject)
exports.respondToRequest = async (req, res) => {
    const { requestId, status } = req.body; // status 'accepted' ya 'rejected' hoga

    try {
        const request = await FriendRequest.findById(requestId);
        if (!request || request.to.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Request nahi mili' });
        }

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            // Dono users ko aik doosre ki friend list me add karein
            await User.findByIdAndUpdate(request.from, { $push: { friends: request.to } });
            await User.findByIdAndUpdate(request.to, { $push: { friends: request.from } });
        }

        res.json({ message: `Request ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 4. User ke friends ki list get karna
exports.getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends', 'username status');
        res.json(user.friends);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 5. Pending friend requests get karna
exports.getPendingRequests = async (req, res) => {
     try {
        const requests = await FriendRequest.find({ to: req.user._id, status: 'pending' })
            .populate('from', 'username city'); // Bhejne wale ka naam aur shehar bhi sath bhejein
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}
