const Job = require('../models/Job');
const { NotFoundError, catchAsync } = require('../utils/errorHandler');

const getJobs = catchAsync(async (req, res) => {
	const jobs = await Job.find({ userId: req.user.id });
	res.status(200).json(jobs);
});

const getJob = catchAsync(async (req, res) => {
	const job = await Job.findOne({
		_id: req.params.id,
		userId: req.user.id,
	});

	if (!job) {
		throw new NotFoundError('Job not found');
	}

	res.status(200).json(job);
});

const createJob = catchAsync(async (req, res) => {
	const { position, status, company, notes, dateApplied } = req.body;

	const newJob = new Job({
		position,
		status,
		company,
		notes,
		dateApplied: dateApplied ? new Date(dateApplied) : new Date(),
		userId: req.user.id,
	});

	await newJob.save();
	
	res.status(201).json({ message: 'Job created successfully' });
});

const updateJob = catchAsync(async (req, res) => {
	const job = await Job.findOne({
		_id: req.params.id,
		userId: req.user.id,
	});

	if (!job) {
		throw new NotFoundError('Job not found');
	}

	// Update only provided fields
	if (req.body.position !== undefined) job.position = req.body.position;
	if (req.body.status !== undefined) job.status = req.body.status;
	if (req.body.company !== undefined) job.company = req.body.company;
	if (req.body.notes !== undefined) job.notes = req.body.notes;
	if (req.body.dateApplied !== undefined) {
		job.dateApplied = new Date(req.body.dateApplied);
	}

	await job.save();
	
	res.status(200).json({
		message: 'Job updated successfully',
		job: job
	});
});

const deleteJob = catchAsync(async (req, res) => {
	const job = await Job.findOneAndDelete({ 
		_id: req.params.id, 
		userId: req.user.id 
	});

	if (!job) {
		throw new NotFoundError('Job not found');
	}

	res.status(200).json({ message: 'Job deleted successfully' });
});

const deleteMultipleJobs = catchAsync(async (req, res) => {
	const { ids } = req.body;
	
	const result = await Job.deleteMany({ 
		_id: { $in: ids }, 
		userId: req.user.id 
	});

	if (result.deletedCount === 0) {
		throw new NotFoundError('No jobs found to delete');
	}

	res.status(200).json({ message: 'Jobs deleted successfully' });
});

module.exports = {
	getJobs,
	getJob,
	createJob,
	updateJob,
	deleteJob,
	deleteMultipleJobs,
};
