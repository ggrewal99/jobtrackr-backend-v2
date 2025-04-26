const Job = require('../models/Job');

const getJobs = async (req, res) => {
	try {
		const jobs = await Job.find({ createdBy: req.user.id });
		res.status(200).json(jobs);
	} catch (error) {
		res.status(500).json({ message: 'Error getting jobs', error });
	}
};

const getJob = async (req, res) => {
	try {
		const job = await Job.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});
		res.status(200).json(job);
	} catch (error) {
		res.status(500).json({ message: 'Error getting job', error });
	}
};

const createJob = async (req, res) => {
	const { position, status, company, notes } = req.body;

	try {
		const newJob = new Job({
			position,
			status,
			company,
			notes,
		});

		await newJob.save();
		res.status(201).json({ message: 'Job created successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error creating job', error });
	}
};

const updateJob = async (req, res) => {
	try {
		const job = await Job.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!job) {
			return res.status(404).json({ message: 'Job not found' });
		}

		if (req.body.position !== undefined) job.position = req.body.position;
		if (req.body.status !== undefined) job.status = req.body.status;
		if (req.body.company !== undefined) job.company = req.body.company;
		if (req.body.notes !== undefined) job.notes = req.body.notes;

		await job.save();
		res.status(200).json({ message: 'Job updated successfully', job });
	} catch (error) {
		res.status(500).json({ message: 'Error updating job', error });
	}
};

const deleteJob = async (req, res) => {
	const { id } = req.params;
	try {
		await Job.findOneAndDelete({ _id: id, createdBy: req.user.id });
		res.status(200).json({ message: 'Job deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error deleting job', error });
	}
};

module.exports = {
	getJobs,
	getJob,
	createJob,
	updateJob,
	deleteJob,
};
