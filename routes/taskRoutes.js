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

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTaskRequest:
 *       type: object
 *       required:
 *         - title
 *         - jobId
 *         - dueDate
 *       properties:
 *         title:
 *           type: string
 *           description: Task title
 *           example: Prepare for technical interview
 *         description:
 *           type: string
 *           description: Task description
 *           example: Review data structures and algorithms
 *         jobId:
 *           type: string
 *           description: ID of the associated job
 *           example: 507f1f77bcf86cd799439011
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Task due date
 *           example: 2024-01-20
 *     
 *     UpdateTaskRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Task title
 *           example: Prepare for technical interview
 *         description:
 *           type: string
 *           description: Task description
 *           example: Review data structures and algorithms
 *         jobId:
 *           type: string
 *           description: ID of the associated job
 *           example: 507f1f77bcf86cd799439011
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Task due date
 *           example: 2024-01-25
 *         completed:
 *           type: boolean
 *           description: Whether the task is completed
 *           example: false
 *     
 *     DeleteMultipleTasksRequest:
 *       type: object
 *       required:
 *         - taskIds
 *       properties:
 *         taskIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of task IDs to delete
 *           example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     
 *     TaskResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Task retrieved successfully
 *         data:
 *           $ref: '#/components/schemas/Task'
 *     
 *     TasksResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Tasks retrieved successfully
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Task'
 *           example:
 *             - _id: "507f1f77bcf86cd799439011"
 *               title: "Prepare for technical interview"
 *               description: "Review data structures and algorithms"
 *               jobId: "507f1f77bcf86cd799439010"
 *               dueDate: "2024-01-20"
 *               completed: false
 *               userId: "507f1f77bcf86cd799439009"
 *               createdAt: "2024-01-15T10:30:00.000Z"
 *               updatedAt: "2024-01-15T10:30:00.000Z"
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for authenticated user
 *     description: Retrieve all tasks for the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TasksResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new task
 *     description: Add a new task for the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/')
	.get(protect, getTasks)
	.post(protect, taskValidation.create, createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a specific task by ID
 *     description: Retrieve a single task by its ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       400:
 *         description: Invalid task ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Update a task
 *     description: Update an existing task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       400:
 *         description: Validation error or invalid task ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete a task
 *     description: Delete a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid task ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router
	.route('/:id')
	.get(protect, validateObjectId, getTask)
	.patch(protect, validateObjectId, taskValidation.update, updateTask)
	.delete(protect, validateObjectId, deleteTask);

/**
 * @swagger
 * /api/tasks/delete-multiple-tasks:
 *   post:
 *     summary: Delete multiple tasks
 *     description: Delete multiple tasks by their IDs
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteMultipleTasksRequest'
 *     responses:
 *       200:
 *         description: Tasks deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 2 tasks deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: number
 *                       example: 2
 *       400:
 *         description: Validation error or invalid task IDs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/delete-multiple-tasks')
	.post(protect, validateIdArray, deleteMultipleTasks);
module.exports = router;
