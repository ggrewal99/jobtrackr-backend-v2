const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
	taskValidation, 
	validateObjectId, 
	validateIdArray 
} = require('../middleware/validation');
const {
	getTasks,
	getTask,
	createTask,
	updateTask,
	deleteTask,
	deleteMultipleTasks,
} = require('../controllers/taskController');

router.route('/')
	.get(protect, getTasks)
	.post(protect, taskValidation.create, createTask);

router
	.route('/:id')
	.get(protect, validateObjectId, getTask)
	.patch(protect, validateObjectId, taskValidation.update, updateTask)
	.delete(protect, validateObjectId, deleteTask);

router.route('/delete-multiple-tasks')
	.post(protect, validateIdArray, deleteMultipleTasks);
module.exports = router;
