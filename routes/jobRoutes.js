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

router.route('/')
	.get(protect, getJobs)
	.post(protect, jobValidation.create, createJob);

router
	.route('/:id')
	.get(protect, validateObjectId, getJob)
	.patch(protect, validateObjectId, jobValidation.update, updateJob)
	.delete(protect, validateObjectId, deleteJob);

router.route('/delete-multiple-jobs')
	.post(protect, validateIdArray, deleteMultipleJobs);

module.exports = router;
