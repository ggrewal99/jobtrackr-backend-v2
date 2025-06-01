const { mongoose } = require('mongoose');

const jobSchema = new mongoose.Schema(
	{
		position: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			required: true,
			enum: ['applied', 'interviewing', 'offer', 'rejected'],
		},
		company: {
			type: String,
			required: true,
		},
		notes: {
			type: String,
			required: false,
		},
		dateApplied: {
			type: Date,
			default: Date.now,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
