const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const jobRoutes = require('./routes/jobRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/jobs', jobRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	connectDB();
	console.log(`Server is running on port ${PORT}`);
});
