const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../config/sendEmail');

const registerUser = async (req, res) => {
	const { firstName, lastName, email, password } = req.body;

	const existingUser = await User.findOne({ email });
	if (existingUser)
		return res.status(400).json({ message: 'Email already in use' });

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	try {
		const newUser = new User({
			firstName,
			lastName,
			email,
			password: hashedPassword,
		});

		await newUser.save();
		res.status(201).json({ message: 'User registered successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error registering user', error });
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

		await sendEmail({
			email: user.email,
			subject: 'Login Alert',
			message: `Your account was just logged into from ${req.ip}`,
		});

		res.status(200).json({ token });
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

module.exports = {
	registerUser,
	loginUser,
	updateUser,
};
