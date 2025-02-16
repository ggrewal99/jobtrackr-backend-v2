const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
	registerUser,
	loginUser,
	updateUser,
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/update', protect, updateUser);

module.exports = router;
