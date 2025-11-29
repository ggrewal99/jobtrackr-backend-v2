// Import error classes from errors folder
const {
  ValidationError,
  UnauthorizedError,
  ConflictError
} = require('./errors');

// Error handling middleware
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new ConflictError(message);
};

const handleValidationErrorDB = (err) => {
  if (!err.errors || typeof err.errors !== 'object') {
    return new ValidationError(err.message || 'Validation failed');
  }
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ValidationError(message);
};

const handleJWTError = () =>
  new UnauthorizedError('Invalid token. Please log in again!');

const handleJWTExpiredError = () =>
  new UnauthorizedError('Your token has expired! Please log in again.');

const sendErrorDev = (err, res) => {
  // In development: show full error details including stack trace for debugging
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Does not expose stack traces or internal error details when in production
  // Only send safe, user-friendly messages
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Does not leak error details when in production
    console.error('ERROR ->', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

const globalErrorHandler = (err, _req, res, _next) => {
  const error = {
    statusCode: err.statusCode || 500,
    status: err.status || 'error',
    message: err.message,
    isOperational: err.isOperational,
    name: err.name,
    code: err.code,
    path: err.path,
    value: err.value,
    errors: err.errors,
    errmsg: err.errmsg,
    stack: err.stack
  };

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else if (process.env.NODE_ENV === 'test') {
    // In test mode, handle JWT errors and send simplified error response
    let processedError = error;
    
    if (error.name === 'JsonWebTokenError') processedError = handleJWTError();
    if (error.name === 'TokenExpiredError') processedError = handleJWTExpiredError();
    
    if (processedError.isOperational) {
      res.status(processedError.statusCode).json({
        status: processedError.status,
        message: processedError.message
      });
    } else {
      console.error('ERROR ->', error);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
      });
    }
  } else {
    let processedError = error;

    if (processedError.name === 'CastError') processedError = handleCastErrorDB(processedError);
    if (processedError.code === 11000) processedError = handleDuplicateFieldsDB(processedError);
    if (processedError.name === 'ValidationError') processedError = handleValidationErrorDB(processedError);
    if (processedError.name === 'JsonWebTokenError') processedError = handleJWTError();
    if (processedError.name === 'TokenExpiredError') processedError = handleJWTExpiredError();

    sendErrorProd(processedError, res);
  }
};

// Async error wrapper
const catchAsync = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
  };

module.exports = {
  globalErrorHandler,
  catchAsync
};
