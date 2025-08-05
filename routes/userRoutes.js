const express = require('express');
const router = express.Router();
const { searchUsers, sendFriendRequest, respondToRequest, getFriends, getPendingRequests } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Yeh sab routes protected hain, yani sirf logged-in user hi inko access kar sakta hai
router.use(protect);

router.get('/search', searchUsers);
router.get('/friends', getFriends);
router.get('/friend-requests/pending', getPendingRequests);
router.post('/friend-requests/send', sendFriendRequest);
router.post('/friend-requests/respond', respondToRequest);

module.exports = router;
