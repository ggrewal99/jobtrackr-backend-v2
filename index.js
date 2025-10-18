const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { globalErrorHandler } = require('./utils/errorHandler');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const jobRoutes = require('./routes/jobRoutes');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

app.use('/api/jobs', jobRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
	const PORT = process.env.PORT || 5000;
	app.listen(PORT, () => {
		connectDB();
		console.log(`Server is running on port ${PORT}`);
	});
}

module.exports = app;
