const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Message = require('../models/Message'); // Message model import karein

// 1. Username se user search karna
exports.searchUsers = async (req, res) => {
    try {
        const query = req.query.username || '';
        if (!query) return res.json([]);
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user._id }
        }).select('username city');
        res.json(users);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// 2. Friend request bhejna
exports.sendFriendRequest = async (req, res) => {
    const { toUserId } = req.body;
    const fromUserId = req.user._id;
    try {
        const existingRequest = await FriendRequest.findOne({ $or: [{ from: fromUserId, to: toUserId }, { from: toUserId, to: fromUserId }] });
        if (existingRequest) return res.status(400).json({ message: 'Request pehle hi bhej di gayi hai ya aap pehle se dost hain.' });
        const newRequest = new FriendRequest({ from: fromUserId, to: toUserId });
        await newRequest.save();
        res.status(201).json({ message: 'Friend request bhej di gayi' });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// 3. Friend request ko respond karna
exports.respondToRequest = async (req, res) => {
    const { requestId, status } = req.body;
    try {
        const request = await FriendRequest.findById(requestId);
        if (!request || request.to.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Request nahi mili' });
        request.status = status;
        await request.save();
        if (status === 'accepted') {
            await User.findByIdAndUpdate(request.from, { $push: { friends: request.to } });
            await User.findByIdAndUpdate(request.to, { $push: { friends: request.from } });
        }
        res.json({ message: `Request ${status}` });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// 4. User ke friends ki list get karna
exports.getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends', 'username status');
        res.json(user.friends);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// 5. Pending friend requests get karna
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({ to: req.user._id, status: 'pending' }).populate('from', 'username city');
        res.json(requests);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// 6. Get Chat History with a friend (Naya function)
exports.getChatHistory = async (req, res) => {
    try {
        const friendId = req.params.friendId;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: friendId },
                { sender: friendId, receiver: myId }
            ]
        }).sort({ createdAt: 'asc' });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
