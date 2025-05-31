const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
	getJobs,
	getJob,
	createJob,
	updateJob,
	deleteJob,
	deleteMultipleJobs,
} = require('../controllers/jobController');

router.route('/').get(protect, getJobs).post(protect, createJob);

router
	.route('/:id')
	.get(protect, getJob)
	.patch(protect, updateJob)
	.delete(protect, deleteJob);

router.route('/delete-multiple-jobs').post(protect, deleteMultipleJobs);

module.exports = router;
