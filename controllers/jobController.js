const Job = require('../models/Job');
const { NotFoundError, catchAsync } = require('../utils/errorHandler');
const { MESSAGES } = require('../constants/messages');

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
		throw new NotFoundError(MESSAGES.ERROR.JOB_NOT_FOUND);
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
	
	res.status(201).json({ message: MESSAGES.SUCCESS.JOB_CREATED });
});

const updateJob = catchAsync(async (req, res) => {
	const job = await Job.findOne({
		_id: req.params.id,
		userId: req.user.id,
	});

	if (!job) {
		throw new NotFoundError(MESSAGES.ERROR.JOB_NOT_FOUND);
	}

	if (req.body.position !== undefined) job.position = req.body.position;
	if (req.body.status !== undefined) job.status = req.body.status;
	if (req.body.company !== undefined) job.company = req.body.company;
	if (req.body.notes !== undefined) job.notes = req.body.notes;
	if (req.body.dateApplied !== undefined) {
		job.dateApplied = new Date(req.body.dateApplied);
	}

	await job.save();
	
	res.status(200).json({
		message: MESSAGES.SUCCESS.JOB_UPDATED,
		job: job
	});
});

const deleteJob = catchAsync(async (req, res) => {
	const job = await Job.findOneAndDelete({ 
		_id: req.params.id, 
		userId: req.user.id 
	});

	if (!job) {
		throw new NotFoundError(MESSAGES.ERROR.JOB_NOT_FOUND);
	}

	res.status(200).json({ message: MESSAGES.SUCCESS.JOB_DELETED });
});

const deleteMultipleJobs = catchAsync(async (req, res) => {
	const { ids } = req.body;
	
	const result = await Job.deleteMany({ 
		_id: { $in: ids }, 
		userId: req.user.id 
	});

	if (result.deletedCount === 0) {
		throw new NotFoundError(MESSAGES.ERROR.NO_JOBS_FOUND_TO_DELETE);
	}

	res.status(200).json({ message: MESSAGES.SUCCESS.JOBS_DELETED });
});

module.exports = {
	getJobs,
	getJob,
	createJob,
	updateJob,
	deleteJob,
	deleteMultipleJobs,
};
