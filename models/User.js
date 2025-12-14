const { mongoose } = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: false,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		resetPasswordToken: {
			type: String,
		},
		resetPasswordExpires: {
			type: Date,
		},
		failedLoginAttempts: {
			type: Number,
			default: 0,
		},
		accountLockedUntil: {
			type: Date,
		},
		refreshToken: {
			type: String,
		},
		refreshTokenExpires: {
			type: Date,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
