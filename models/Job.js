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
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
