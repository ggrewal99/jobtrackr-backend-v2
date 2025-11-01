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
			required: true,
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

// Indexes for analytics optimization
jobSchema.index({ userId: 1, dateApplied: -1 }); // For timeline queries
jobSchema.index({ userId: 1, status: 1 }); // For status breakdown
jobSchema.index({ userId: 1, createdAt: -1 }); // For recent applications
jobSchema.index({ userId: 1, updatedAt: -1 }); // For stage progression

module.exports = mongoose.model('Job', jobSchema);
