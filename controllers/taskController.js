const Task = require('../models/Task');

const getTasks = async (req, res) => {
	try {
		const tasks = await Task.find({ userId: req.user.id });
		res.status(200).json(tasks);
	} catch (error) {
		res.status(500).json({ message: 'Error getting tasks', error });
	}
};

const getTask = async (req, res) => {
	try {
		const task = await Task.findOne({
			_id: req.params.id,
			userId: req.user.id,
		});
		res.status(200).json(task);
	} catch (error) {
		res.status(500).json({ message: 'Error getting task', error });
	}
};

const createTask = async (req, res) => {
	const { jobId, title, dueDateTime, taskType, notes, completed } = req.body;

	const dateTime = new Date(dueDateTime);
	if (isNaN(dateTime.getTime())) {
		return res.status(400).json({ message: 'Invalid date format' });
	}
	try {
		const newTask = new Task({
			jobId,
			title,
			dueDateTime: dateTime,
			taskType,
			notes,
			userId: req.user.id,
			completed: completed || false,
		});

		await newTask.save();
		res.status(201).json({
			message: 'Task created successfully',
			task: newTask,
		});
	} catch (error) {
		res.status(500).json({ message: 'Error creating task', error });
	}
};
const updateTask = async (req, res) => {
	try {
		const task = await Task.findOne({
			_id: req.params.id,
			userId: req.user.id,
		});

		if (!task) {
			return res.status(404).json({ message: 'Task not found' });
		}

		if (req.body.title !== undefined) task.title = req.body.title;
		if (req.body.dueDateTime !== undefined)
			task.dueDateTime = req.body.dueDateTime;
		if (req.body.taskType !== undefined) task.taskType = req.body.taskType;
		if (req.body.notes !== undefined) task.notes = req.body.notes;
		if (req.body.completed !== undefined)
			task.completed = req.body.completed;

		await task.save();
		res.status(200).json({
			message: 'Task updated successfully',
			task,
		});
	} catch (error) {
		res.status(500).json({ message: 'Error updating task', error });
	}
};
const deleteTask = async (req, res) => {
	try {
		await Task.findOneAndDelete({
			_id: req.params.id,
			userId: req.user.id,
		});
		res.status(200).json({ message: 'Task deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error deleting task', error });
	}
};
module.exports = {
	getTasks,
	getTask,
	createTask,
	updateTask,
	deleteTask,
};
