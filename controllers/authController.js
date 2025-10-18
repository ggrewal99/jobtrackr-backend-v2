const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { 
	NotFoundError, 
	UnauthorizedError, 
	ConflictError, 
	ValidationError,
	catchAsync 
} = require('../utils/errorHandler');

const registerUser = catchAsync(async (req, res) => {
	const { firstName, lastName, email, password } = req.body;

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		throw new ConflictError('Email already in use');
	}

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	const newUser = new User({
		firstName,
		lastName,
		email,
		password: hashedPassword,
	});

	const token = jwt.sign(
		{ email: newUser.email },
		process.env.JWT_SECRET,
		{ expiresIn: '1h' }
	);

	await newUser.save();

	const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
	await sendEmail({
		email: newUser.email,
		subject: 'Verify your email',
		message: `<p>Click <a href="${verificationUrl}">here</a> to verify your account</p>`,
	});

	res.status(201).json({ 
		status: 'success',
		message: 'User registered successfully' 
	});
});

const resendVerificationEmail = catchAsync(async (req, res) => {
	const { email } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		throw new NotFoundError('User not found');
	}

	if (user.isVerified) {
		throw new ValidationError('Email already verified');
	}

	const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
		expiresIn: '1h',
	});

	const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
	await sendEmail({
		email: user.email,
		subject: 'Verify your email',
		message: `<p>Click <a href="${verificationUrl}">here</a> to verify your account</p>`,
	});

	res.json({ 
		status: 'success',
		message: 'Verification email sent' 
	});
});

const verifyEmail = catchAsync(async (req, res) => {
	const { token } = req.query;

	const decoded = jwt.verify(token, process.env.JWT_SECRET);
	const user = await User.findOne({ email: decoded.email });

	if (!user) {
		throw new UnauthorizedError('Invalid or expired token');
	}

	if (user.isVerified) {
		throw new ValidationError('Email already verified');
	}

	user.isVerified = true;
	await user.save();

	res.json({
		status: 'success',
		message: 'Email verified successfully. You can now log in.',
	});
});

const loginUser = catchAsync(async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		throw new UnauthorizedError('Invalid email or password');
	}

	if (!user.isVerified) {
		throw new UnauthorizedError('Email not verified. Please check your email and verify your account.');
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new UnauthorizedError('Invalid email or password');
	}

	const token = jwt.sign(
		{ id: user._id, role: user.role },
		process.env.JWT_SECRET,
		{
			expiresIn: '1h',
		}
	);

	// await sendEmail({
	// 	email: user.email,
	// 	subject: 'Login Alert',
	// 	message: `Your account was just logged into from ${req.ip}`,
	// });

	res.status(200).json({
		token,
		user: {
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
		},
	});
});

const updateUser = catchAsync(async (req, res) => {
	const userId = req.user.id;
	const updates = {};

	if (req.body.firstName) updates.firstName = req.body.firstName;
	if (req.body.lastName) updates.lastName = req.body.lastName;
	if (req.body.email) updates.email = req.body.email;

	if (req.body.password) {
		const salt = await bcrypt.genSalt(10);
		updates.password = await bcrypt.hash(req.body.password, salt);
	}

	const updatedUser = await User.findByIdAndUpdate(userId, updates, {
		new: true,
	});

	if (!updatedUser) {
		throw new NotFoundError('User not found');
	}

	res.status(200).json({
		message: 'User updated successfully',
		user: updatedUser,
	});
});

const requestPasswordReset = catchAsync(async (req, res) => {
	const { email } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		throw new NotFoundError('User not found');
	}

	const resetToken = crypto.randomBytes(32).toString('hex');
	const hashedToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	user.resetPasswordToken = hashedToken;
	user.resetPasswordExpires = Date.now() + 3600000; // Expires in 1 hour

	await user.save();

	const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
	await sendEmail({
		email: user.email,
		subject: 'Reset your password',
		message: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
	});

	res.json({
		status: 'success',
		message: 'Password reset link has been sent to your email.',
	});
});

const resetPassword = catchAsync(async (req, res) => {
	const { token } = req.query;
	const { newPassword } = req.body;

	const hashedToken = crypto
		.createHash('sha256')
		.update(token)
		.digest('hex');
	const user = await User.findOne({
		resetPasswordToken: hashedToken,
		resetPasswordExpires: { $gt: Date.now() },
	});

	if (!user) {
		throw new UnauthorizedError('Invalid or expired token');
	}

	const salt = await bcrypt.genSalt(10);
	user.password = await bcrypt.hash(newPassword, salt);
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;

	await user.save();

	res.json({ 
		status: 'success',
		message: 'Password reset successful. You can now log in.' 
	});
});

const changePassword = catchAsync(async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	const userId = req.user.id;

	const user = await User.findById(userId);
	if (!user) {
		throw new NotFoundError('User not found');
	}

	const isMatch = await bcrypt.compare(currentPassword, user.password);
	if (!isMatch) {
		throw new UnauthorizedError('Invalid current password');
	}

	const salt = await bcrypt.genSalt(10);
	user.password = await bcrypt.hash(newPassword, salt);

	await user.save();

	res.json({ 
		status: 'success',
		message: 'Password changed successfully' 
	});
});

module.exports = {
	registerUser,
	resendVerificationEmail,
	verifyEmail,
	loginUser,
	updateUser,
	requestPasswordReset,
	resetPassword,
	changePassword,
};
