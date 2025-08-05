const express = require('express');
const router = express.Router();
// loginUser ko import karein
const { registerUser, loginUser } = require('../controllers/authController');

// Register route (pehle se mojood)
router.post('/register', registerUser);

// Naya Login route
router.post('/login', loginUser);

module.exports = router;
