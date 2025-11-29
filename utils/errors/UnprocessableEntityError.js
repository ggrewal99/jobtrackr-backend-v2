const AppError = require('./AppError');

class UnprocessableEntityError extends AppError {
  constructor(message = 'Invalid data provided') {
    super(message, 422);
    this.name = 'UnprocessableEntityError';
  }
}

module.exports = UnprocessableEntityError;

