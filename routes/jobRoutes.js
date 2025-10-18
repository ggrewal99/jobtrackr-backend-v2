const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
	jobValidation, 
	validateObjectId, 
	validateIdArray 
} = require('../middleware/validation');
const {
	getJobs,
	getJob,
	createJob,
	updateJob,
	deleteJob,
	deleteMultipleJobs,
} = require('../controllers/jobController');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateJobRequest:
 *       type: object
 *       required:
 *         - company
 *         - position
 *         - status
 *       properties:
 *         company:
 *           type: string
 *           description: Company name
 *           example: Google
 *         position:
 *           type: string
 *           description: Job position title
 *           example: Software Engineer
 *         status:
 *           type: string
 *           enum: [applied, interviewing, offer, rejected, withdrawn]
 *           description: Current application status
 *           example: applied
 *         dateApplied:
 *           type: string
 *           format: date
 *           description: Date when application was submitted
 *           example: 2024-01-15
 *         notes:
 *           type: string
 *           description: Additional notes about the job
 *           example: Great company culture, remote work available
 *     
 *     UpdateJobRequest:
 *       type: object
 *       properties:
 *         company:
 *           type: string
 *           description: Company name
 *           example: Google
 *         position:
 *           type: string
 *           description: Job position title
 *           example: Senior Software Engineer
 *         status:
 *           type: string
 *           enum: [applied, interviewing, offer, rejected, withdrawn]
 *           description: Current application status
 *           example: interviewing
 *         dateApplied:
 *           type: string
 *           format: date
 *           description: Date when application was submitted
 *           example: 2024-01-15
 *         notes:
 *           type: string
 *           description: Additional notes about the job
 *           example: Great company culture, remote work available
 *     
 *     DeleteMultipleJobsRequest:
 *       type: object
 *       required:
 *         - jobIds
 *       properties:
 *         jobIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of job IDs to delete
 *           example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     
 *     JobResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Job retrieved successfully
 *         data:
 *           $ref: '#/components/schemas/Job'
 *     
 *     JobsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Jobs retrieved successfully
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Job'
 *           example:
 *             - _id: "507f1f77bcf86cd799439011"
 *               company: "Google"
 *               position: "Software Engineer"
 *               status: "applied"
 *               dateApplied: "2024-01-15"
 *               notes: "Great company culture"
 *               userId: "507f1f77bcf86cd799439010"
 *               createdAt: "2024-01-15T10:30:00.000Z"
 *               updatedAt: "2024-01-15T10:30:00.000Z"
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs for authenticated user
 *     description: Retrieve all job applications for the authenticated user
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobsResponse'
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
 *     summary: Create a new job application
 *     description: Add a new job application for the authenticated user
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJobRequest'
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobResponse'
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
	.get(protect, getJobs)
	.post(protect, jobValidation.create, createJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a specific job by ID
 *     description: Retrieve a single job application by its ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobResponse'
 *       400:
 *         description: Invalid job ID format
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
 *         description: Job not found
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
 *     summary: Update a job application
 *     description: Update an existing job application by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateJobRequest'
 *     responses:
 *       200:
 *         description: Job updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobResponse'
 *       400:
 *         description: Validation error or invalid job ID
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
 *         description: Job not found
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
 *     summary: Delete a job application
 *     description: Delete a job application by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid job ID format
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
 *         description: Job not found
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
	.get(protect, validateObjectId, getJob)
	.patch(protect, validateObjectId, jobValidation.update, updateJob)
	.delete(protect, validateObjectId, deleteJob);

/**
 * @swagger
 * /api/jobs/delete-multiple-jobs:
 *   post:
 *     summary: Delete multiple job applications
 *     description: Delete multiple job applications by their IDs
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteMultipleJobsRequest'
 *     responses:
 *       200:
 *         description: Jobs deleted successfully
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
 *                   example: 2 jobs deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: number
 *                       example: 2
 *       400:
 *         description: Validation error or invalid job IDs
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
router.route('/delete-multiple-jobs')
	.post(protect, validateIdArray, deleteMultipleJobs);

module.exports = router;
