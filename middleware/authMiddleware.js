const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
	let token;

	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		try {
			[, token] = req.headers.authorization.split(' ');
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			req.user = decoded;
			return next();
		} catch (error) {
			// Distinguish between different JWT errors
			if (error.name === 'TokenExpiredError') {
				return res.status(401).json({
					message: 'Token expired',
					code: 'TOKEN_EXPIRED',
					expiredAt: error.expiredAt,
				});
			}
			if (error.name === 'JsonWebTokenError') {
				return res.status(401).json({
					message: 'Invalid token',
					code: 'INVALID_TOKEN',
				});
			}
			return res.status(401).json({
				message: 'Not authorized, token failed',
				code: 'AUTH_FAILED',
			});
		}
	}
	if (!token) {
		return res.status(401).json({
			message: 'Not authorized, no token',
			code: 'NO_TOKEN',
		});
	}
	return next();
};

module.exports = { protect };
