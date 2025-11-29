const Task = require('../models/Task');
const { NotFoundError } = require('../utils/errors');
const { catchAsync } = require('../utils/errorHandler');
const { MESSAGES } = require('../constants/messages');

const getTasks = catchAsync(async (req, res) => {
	const tasks = await Task.find({ userId: req.user.id }).sort({
		dueDateTime: 1,
	});
	res.status(200).json(tasks);
});

const getTask = catchAsync(async (req, res) => {
	const task = await Task.findOne({
		_id: req.params.id,
		userId: req.user.id,
	});

	if (!task) {
		throw new NotFoundError(MESSAGES.ERROR.TASK_NOT_FOUND);
	}

	res.status(200).json(task);
});

const createTask = catchAsync(async (req, res) => {
	const { jobId, title, dueDateTime, taskType, notes, completed } = req.body;

	const newTask = new Task({
		jobId,
		title,
		dueDateTime: new Date(dueDateTime),
		taskType,
		notes,
		userId: req.user.id,
		completed: completed || false,
	});

	await newTask.save();
	res.status(201).json({
		message: MESSAGES.SUCCESS.TASK_CREATED,
		task: newTask,
	});
});

const updateTask = catchAsync(async (req, res) => {
	const task = await Task.findOne({
		_id: req.params.id,
		userId: req.user.id,
	});

	if (!task) {
		throw new NotFoundError(MESSAGES.ERROR.TASK_NOT_FOUND);
	}

	if (req.body.title !== undefined) task.title = req.body.title;
	if (req.body.dueDateTime !== undefined) {
		task.dueDateTime = new Date(req.body.dueDateTime);
	}
	if (req.body.taskType !== undefined) task.taskType = req.body.taskType;
	if (req.body.notes !== undefined) task.notes = req.body.notes;
	if (req.body.completed !== undefined) task.completed = req.body.completed;

	await task.save();
	res.status(200).json({
		message: MESSAGES.SUCCESS.TASK_UPDATED,
		task,
	});
});

const deleteTask = catchAsync(async (req, res) => {
	const task = await Task.findOneAndDelete({
		_id: req.params.id,
		userId: req.user.id,
	});

	if (!task) {
		throw new NotFoundError(MESSAGES.ERROR.TASK_NOT_FOUND);
	}

	res.status(200).json({ message: MESSAGES.SUCCESS.TASK_DELETED });
});

const deleteMultipleTasks = catchAsync(async (req, res) => {
	const { ids } = req.body;

	const result = await Task.deleteMany({
		_id: { $in: ids },
		userId: req.user.id,
	});

	if (result.deletedCount === 0) {
		throw new NotFoundError(MESSAGES.ERROR.NO_TASKS_FOUND_TO_DELETE);
	}

	res.status(200).json({ message: MESSAGES.SUCCESS.TASKS_DELETED });
});

module.exports = {
	getTasks,
	getTask,
	createTask,
	updateTask,
	deleteTask,
	deleteMultipleTasks,
};
