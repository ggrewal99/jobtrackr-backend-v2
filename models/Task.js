const { mongoose } = require('mongoose');

const taskSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		jobId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Job',
			required: false,
		},
		title: {
			type: String,
			required: true,
		},
		dueDateTime: {
			type: Date,
			required: true,
		},
		taskType: {
			type: String,
			required: true,
			enum: ['follow-up', 'interview', 'networking', 'research', 'other'],
		},
		notes: {
			type: String,
			required: false,
		},
		completed: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

// Indexes for query optimization and analytics
taskSchema.index({ userId: 1 }); // Base index for user queries
taskSchema.index({ userId: 1, dueDateTime: 1 }); // For upcoming tasks and sorting
taskSchema.index({ userId: 1, completed: 1 }); // For completion filtering
taskSchema.index({ userId: 1, taskType: 1 }); // For task type filtering
// Text index for search across multiple fields
taskSchema.index({ title: 'text', notes: 'text' });

module.exports = mongoose.model('Task', taskSchema);
