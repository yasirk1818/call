const express = require('express');
const router = express.Router();
const { getAllUsers, updateUser } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Tamam admin routes pehle 'protect' (logged-in) aur phir 'admin' middleware se guzrenge
router.use(protect, admin);

router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

module.exports = router;
