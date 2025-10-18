const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authValidation } = require('../middleware/validation');
const {
	registerUser,
	resendVerificationEmail,
	loginUser,
	updateUser,
	verifyEmail,
	requestPasswordReset,
	resetPassword,
	changePassword,
} = require('../controllers/authController');

router.post('/register', authValidation.register, registerUser);
router.post('/login', authValidation.login, loginUser);
router.put('/update', protect, updateUser);
router.put('/change-password', protect, authValidation.changePassword, changePassword);

router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;
