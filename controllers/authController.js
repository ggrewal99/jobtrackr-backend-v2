const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

const registerUser = async (req, res) => {
	const { firstName, lastName, email, password } = req.body;

	try {
		const existingUser = await User.findOne({ email });
		if (existingUser)
			return res.status(400).json({ message: 'Email already in use' });

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

		res.status(201).json({ message: 'User registered successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error registering user', error });
	}
};

const resendVerificationEmail = async (req, res) => {
	const { email } = req.body;

	try {
		const user = await User.findOne({ email });

		if (!user) return res.status(400).json({ message: 'User not found' });

		if (user.isVerified)
			return res.status(400).json({ message: 'Email already verified' });

		const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
			expiresIn: '1h',
		});

		const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
		await sendEmail({
			email: user.email,
			subject: 'Verify your email',
			message: `<p>Click <a href="${verificationUrl}">here</a> to verify your account</p>`,
		});

		res.json({ message: 'Verification email sent' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

const verifyEmail = async (req, res) => {
	const { token } = req.query;

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findOne({ email: decoded.email });

		if (!user || user.isVerified)
			return res
				.status(400)
				.json({ message: 'Invalid or expired token' });

		user.isVerified = true;
		await user.save();

		res.json({
			message: 'Email verified successfully. You can now log in.',
		});
	} catch (error) {
		res.status(400).json({ message: 'Invalid or expired token' });
	}
};

const loginUser = async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email });

		if (!user) {
			return res
				.status(400)
				.json({ message: 'Invalid email or password' });
		}

		if (!user.isVerified) {
			return res.status(400).json({ message: 'Email not verified' });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res
				.status(400)
				.json({ message: 'Invalid email or password' });
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
	} catch (error) {
		res.status(500).json({ message: 'Error logging in', error });
	}
};

const updateUser = async (req, res) => {
	const userId = req.user.id;

	const updates = {};

	if (req.body.firstName) updates.firstName = req.body.firstName;
	if (req.body.lastName) updates.lastName = req.body.lastName;
	if (req.body.email) updates.email = req.body.email;

	if (req.body.password) {
		const salt = await bcrypt.genSalt(10);
		updates.password = await bcrypt.hash(req.body.password, salt);
	}

	try {
		const updatedUser = await User.findByIdAndUpdate(userId, updates, {
			new: true,
		});

		if (!updatedUser) {
			return res.status(404).json({ message: 'User not found' });
		}

		res.status(200).json({
			message: 'User updated successfully',
			user: updatedUser,
		});
	} catch (error) {
		res.status(500).json({ message: 'Error updating user', error });
	}
};

const requestPasswordReset = async (req, res) => {
	const { email } = req.body;

	try {
		const user = await User.findOne({ email });

		if (!user) return res.status(400).json({ message: 'User not found' });

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
			message: 'Password reset link has been sent to your email.',
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

const resetPassword = async (req, res) => {
	const { token } = req.query;
	const { newPassword } = req.body;
	try {
		const hashedToken = crypto
			.createHash('sha256')
			.update(token)
			.digest('hex');
		const user = await User.findOne({
			resetPasswordToken: hashedToken,
			resetPasswordExpires: { $gt: Date.now() },
		});

		if (!user)
			return res
				.status(400)
				.json({ message: 'Invalid or expired token' });

		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(newPassword, salt);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;

		await user.save();

		res.json({ message: 'Password reset successful. You can now log in.' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

const changePassword = async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	const userId = req.user.id;

	try {
		const user = await User.findById(userId);

		if (!user) return res.status(404).json({ message: 'User not found' });

		const isMatch = await bcrypt.compare(currentPassword, user.password);
		if (!isMatch)
			return res
				.status(400)
				.json({ message: 'Invalid current password' });

		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(newPassword, salt);

		await user.save();

		res.json({ message: 'Password changed successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

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
