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

// Indexes for query optimization and analytics
jobSchema.index({ userId: 1 }); // Base index for user queries
jobSchema.index({ userId: 1, dateApplied: -1 }); // For timeline queries and sorting
jobSchema.index({ userId: 1, status: 1 }); // For status filtering and breakdown
jobSchema.index({ userId: 1, company: 1 }); // For company filtering
jobSchema.index({ userId: 1, position: 1 }); // For position search
jobSchema.index({ userId: 1, createdAt: -1 }); // For recent applications
jobSchema.index({ userId: 1, updatedAt: -1 }); // For stage progression
// Text index for search across multiple fields
jobSchema.index({ company: 'text', position: 'text', notes: 'text' });

module.exports = mongoose.model('Job', jobSchema);
