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

module.exports = mongoose.model('Task', taskSchema);
