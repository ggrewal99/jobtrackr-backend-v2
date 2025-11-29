const Job = require('../models/Job');
const { NotFoundError } = require('../utils/errors');
const { catchAsync } = require('../utils/errorHandler');
const { MESSAGES } = require('../constants/messages');

const getJobs = catchAsync(async (req, res) => {
	const { page, limit, sortBy, sortOrder, search, status, company, position } = req.query;

	const query = { userId: req.user.id };

	if (status) {
		query.status = status;
	}

	if (company) {
		query.company = company;
	}

	if (position) {
		query.position = position;
	}

	if (search) {
		query.$or = [
			{ position: { $regex: search, $options: 'i' } },
			{ company: { $regex: search, $options: 'i' } },
			{ notes: { $regex: search, $options: 'i' } },
		];
	}

	const pageNum = parseInt(page, 10) || 1;
	const limitNum = parseInt(limit, 10) || 20;
	const skip = (pageNum - 1) * limitNum;

	const sortOptions = {};
	if (sortBy) {
		const sortFields = ['dateApplied', 'createdAt', 'updatedAt', 'position', 'company', 'status'];
		if (sortFields.includes(sortBy)) {
			sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
		}
	} else {
		sortOptions.dateApplied = -1;
	}

	const jobs = await Job.find(query)
		.sort(sortOptions)
		.skip(skip)
		.limit(limitNum)
		.select('position company status notes dateApplied createdAt updatedAt');

	const totalJobs = await Job.countDocuments(query);

	res.status(200).json({
		jobs,
		pagination: {
			totalItems: totalJobs,
			itemsPerPage: limitNum,
			currentPage: pageNum,
			totalPages: Math.ceil(totalJobs / limitNum),
			hasNextPage: pageNum < Math.ceil(totalJobs / limitNum),
			hasPreviousPage: pageNum > 1,
		},
	});
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
		job,
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
