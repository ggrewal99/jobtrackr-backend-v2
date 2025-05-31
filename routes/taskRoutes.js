const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
	getTasks,
	getTask,
	createTask,
	updateTask,
	deleteTask,
	deleteMultipleTasks,
} = require('../controllers/taskController');

router.route('/').get(protect, getTasks).post(protect, createTask);
router
	.route('/:id')
	.get(protect, getTask)
	.patch(protect, updateTask)
	.delete(protect, deleteTask);
router.route('/delete-multiple-tasks').post(protect, deleteMultipleTasks);
module.exports = router;
