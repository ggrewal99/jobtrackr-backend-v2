const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
	registerUser,
	loginUser,
	updateUser,
	verifyEmail,
	requestPasswordReset,
	resetPassword,
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/update', protect, updateUser);

router.get('/verify-email', verifyEmail);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;
