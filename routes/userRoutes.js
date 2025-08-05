const express = require('express');
const router = express.Router();
const { 
    searchUsers, 
    sendFriendRequest, 
    respondToRequest, 
    getFriends, 
    getPendingRequests,
    getChatHistory // getChatHistory ko import karein
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Sab routes par middleware lagayein

router.get('/search', searchUsers);
router.get('/friends', getFriends);
router.get('/friend-requests/pending', getPendingRequests);
router.post('/friend-requests/send', sendFriendRequest);
router.post('/friend-requests/respond', respondToRequest);
router.get('/chat-history/:friendId', getChatHistory); // Naya route

module.exports = router;
