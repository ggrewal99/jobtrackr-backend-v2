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
const { MESSAGES } = require('../constants/messages');

const registerUser = catchAsync(async (req, res) => {
	const { firstName, lastName, email, password } = req.body;

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		throw new ConflictError(MESSAGES.ERROR.EMAIL_ALREADY_IN_USE);
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
		message: MESSAGES.SUCCESS.USER_REGISTERED 
	});
});

const resendVerificationEmail = catchAsync(async (req, res) => {
	const { email } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		throw new NotFoundError(MESSAGES.ERROR.USER_NOT_FOUND);
	}

	if (user.isVerified) {
		throw new ValidationError(MESSAGES.ERROR.EMAIL_ALREADY_VERIFIED);
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
		message: MESSAGES.SUCCESS.VERIFICATION_EMAIL_SENT 
	});
});

const verifyEmail = catchAsync(async (req, res) => {
	const { token } = req.query;

	const decoded = jwt.verify(token, process.env.JWT_SECRET);
	const user = await User.findOne({ email: decoded.email });

	if (!user) {
		throw new UnauthorizedError(MESSAGES.ERROR.INVALID_OR_EXPIRED_TOKEN);
	}

	if (user.isVerified) {
		throw new ValidationError(MESSAGES.ERROR.EMAIL_ALREADY_VERIFIED);
	}

	user.isVerified = true;
	await user.save();

	res.json({
		status: 'success',
		message: MESSAGES.SUCCESS.EMAIL_VERIFIED,
	});
});

const loginUser = catchAsync(async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		throw new UnauthorizedError(MESSAGES.ERROR.INVALID_CREDENTIALS);
	}

	if (!user.isVerified) {
		throw new UnauthorizedError(MESSAGES.ERROR.EMAIL_NOT_VERIFIED);
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new UnauthorizedError(MESSAGES.ERROR.INVALID_CREDENTIALS);
	}

	const token = jwt.sign(
		{ id: user._id, role: user.role },
		process.env.JWT_SECRET,
		{
			expiresIn: '1h',
		}
	);

	res.status(200).json({
		token,
		user: {
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
		},
		message: MESSAGES.SUCCESS.LOGIN_SUCCESS,
	});
});

const updateUser = catchAsync(async (req, res) => {
	const userId = req.user.id;
	const updates = {};

	if (req.body.firstName !== undefined) updates.firstName = req.body.firstName;
	if (req.body.lastName !== undefined) updates.lastName = req.body.lastName;
	if (req.body.email !== undefined) updates.email = req.body.email;
	if (req.body.password !== undefined) {
		const salt = await bcrypt.genSalt(10);
		updates.password = await bcrypt.hash(req.body.password, salt);
	}

	if (Object.keys(updates).length === 0) {
		const user = await User.findById(userId);
		return res.status(200).json({
		  message: MESSAGES.SUCCESS.USER_UPDATED,
		  user: user,
		});
	}

	const updatedUser = await User.findByIdAndUpdate(userId, updates, {
		new: true,
	});

	if (!updatedUser) {
		throw new NotFoundError(MESSAGES.ERROR.USER_NOT_FOUND);
	}

	res.status(200).json({
		message: MESSAGES.SUCCESS.USER_UPDATED,
		user: updatedUser,
	});
});

const requestPasswordReset = catchAsync(async (req, res) => {
	const { email } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		throw new NotFoundError(MESSAGES.ERROR.USER_NOT_FOUND);
	}

	const resetToken = crypto.randomBytes(32).toString('hex');
	const hashedToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	user.resetPasswordToken = hashedToken;
	user.resetPasswordExpires = Date.now() + 3600000;

	await user.save();

	const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
	await sendEmail({
		email: user.email,
		subject: 'Reset your password',
		message: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
	});

	res.json({
		status: 'success',
		message: MESSAGES.SUCCESS.PASSWORD_RESET_SENT,
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
		throw new UnauthorizedError(MESSAGES.ERROR.INVALID_OR_EXPIRED_TOKEN);
	}

	const salt = await bcrypt.genSalt(10);
	user.password = await bcrypt.hash(newPassword, salt);
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;

	await user.save();

	res.json({ 
		status: 'success',
		message: MESSAGES.SUCCESS.PASSWORD_RESET_SUCCESS,
	});
});

const changePassword = catchAsync(async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	const userId = req.user.id;

	const user = await User.findById(userId);
	if (!user) {
		throw new NotFoundError(MESSAGES.ERROR.USER_NOT_FOUND);
	}

	const isMatch = await bcrypt.compare(currentPassword, user.password);
	if (!isMatch) {
		throw new UnauthorizedError(MESSAGES.ERROR.INVALID_CURRENT_PASSWORD);
	}

	const salt = await bcrypt.genSalt(10);
	user.password = await bcrypt.hash(newPassword, salt);

	await user.save();

	res.json({ 
		status: 'success',
		message: MESSAGES.SUCCESS.PASSWORD_CHANGED,
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
