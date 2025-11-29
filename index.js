const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const connectDB = require('./config/db');
const { globalErrorHandler } = require('./utils/errorHandler');

dotenv.config();

const app = express();

app.use(helmet());

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again later.',
	standardHeaders: true,
	legacyHeaders: false,
});

const corsOptions = {
	origin (origin, callback) {
		if (!origin){
			return callback(null, true);
		} 
		
		const allowedOrigins = process.env.ALLOWED_ORIGINS 
			? process.env.ALLOWED_ORIGINS.split(',').map(orig => orig.trim())
			: ['http://localhost:3000', 'http://localhost:3001'];
		
		if (allowedOrigins.indexOf(origin) !== -1) {
			return callback(null, true);
		}
		return callback(new Error('Not allowed by CORS'));
	},
	credentials: true,
	optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use('/api/', limiter);
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
app.use(hpp());
app.use(xss());

const jobRoutes = require('./routes/jobRoutes');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Swagger Documentation
app.use('/api-docs', limiter, swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'JobTrackr API Documentation'
}));

// API Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
	const PORT = process.env.PORT || 5000;
	app.listen(PORT, async () => {
		try {
			await connectDB();
			console.log(`Server is running on port ${PORT}`);
		} catch (err) {
			console.error(err.message);
			throw err;
		}
	});
}

module.exports = app;
