const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Job = require('../models/Job');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  UnprocessableEntityError,
  globalErrorHandler,
  catchAsync 
} = require('../utils/errorHandler');

// Mock the email utility
jest.mock('../utils/sendEmail', () => jest.fn(() => Promise.resolve()));

describe('Error Handler Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: hashedPassword,
      isVerified: true
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser._id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Custom Error Classes', () => {
    it('should handle ValidationError correctly', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: '',
          lastName: 'Doe',
          email: 'invalid-email',
          password: '123'
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('First name is required');
    });

    it('should handle NotFoundError correctly', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Job not found');
    });

    it('should handle UnauthorizedError correctly', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });

    it('should handle ConflictError correctly', async () => {
      // Try to register with existing email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com', // Already exists
          password: 'password123'
        })
        .expect(409);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Email already in use');
    });
  });

  describe('Error Class Unit Tests', () => {
    it('should create AppError with 4xx status as fail', () => {
      const error = new AppError('Test error', 400);
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
      expect(error.message).toBe('Test error');
    });

    it('should create AppError with 5xx status as error', () => {
      const error = new AppError('Test error', 500);
      expect(error.statusCode).toBe(500);
      expect(error.status).toBe('error');
      expect(error.isOperational).toBe(true);
      expect(error.message).toBe('Test error');
    });

    it('should create ValidationError', () => {
      const error = new ValidationError('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.status).toBe('fail');
    });

    it('should create NotFoundError with default message', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('NotFoundError');
      expect(error.status).toBe('fail');
    });

    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('Custom not found');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Custom not found');
      expect(error.name).toBe('NotFoundError');
    });

    it('should create UnauthorizedError with default message', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized access');
      expect(error.name).toBe('UnauthorizedError');
      expect(error.status).toBe('fail');
    });

    it('should create UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Custom unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Custom unauthorized');
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should create ForbiddenError with default message', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden access');
      expect(error.name).toBe('ForbiddenError');
      expect(error.status).toBe('fail');
    });

    it('should create ForbiddenError with custom message', () => {
      const error = new ForbiddenError('Custom forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Custom forbidden');
      expect(error.name).toBe('ForbiddenError');
    });

    it('should create ConflictError with default message', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
      expect(error.name).toBe('ConflictError');
      expect(error.status).toBe('fail');
    });

    it('should create ConflictError with custom message', () => {
      const error = new ConflictError('Custom conflict');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Custom conflict');
      expect(error.name).toBe('ConflictError');
    });

    it('should create UnprocessableEntityError with default message', () => {
      const error = new UnprocessableEntityError();
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Invalid data provided');
      expect(error.name).toBe('UnprocessableEntityError');
      expect(error.status).toBe('fail');
    });

    it('should create UnprocessableEntityError with custom message', () => {
      const error = new UnprocessableEntityError('Custom unprocessable');
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Custom unprocessable');
      expect(error.name).toBe('UnprocessableEntityError');
    });
  });

  describe('JWT Error Handling', () => {
    it('should handle invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });

    it('should handle expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });

    it('should handle malformed JWT token', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle CastError for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/jobs/invalid-object-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Invalid ID format');
    });

    it('should handle duplicate key error', async () => {
      // This test might not trigger a duplicate key error in test environment
      // but we can test the error handling structure
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com', // Already exists
          password: 'password123'
        })
        .expect(409);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Email already in use');
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle multiple validation errors', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          password: '123'
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('First name is required');
    });

    it('should handle job validation errors', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          position: '',
          status: 'invalid-status',
          company: ''
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Position is required');
    });

    it('should handle task validation errors', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          dueDateTime: 'invalid-date',
          taskType: 'invalid-type'
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Title is required');
    });
  });

  describe('Async Error Handling', () => {
    it('should handle async errors in controllers', async () => {
      // Test with invalid job ID that will cause a database error
      const response = await request(app)
        .get('/api/jobs/000000000000000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Job not found');
    });

    it('should handle errors in password reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password?token=invalid-token')
        .send({ newPassword: 'newpassword123' })
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error response format', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('should not expose sensitive information in error messages', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).not.toContain('JsonWebTokenError');
      expect(response.body.message).not.toContain('stack');
      expect(response.body.message).not.toContain('at ');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('First name is required');
    });

    it('should handle null values in request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: null,
          lastName: null,
          email: null,
          password: null
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('First name is required');
    });

    it('should handle undefined values in request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: undefined,
          lastName: undefined,
          email: undefined,
          password: undefined
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('First name is required');
    });

    it('should handle very long input strings', async () => {
      const longString = 'a'.repeat(1000);
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: longString,
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(409); // Should fail due to duplicate email from previous test

      expect(response.body.message).toContain('Email already in use');
    });
  });

  describe('Middleware Error Propagation', () => {
    it('should propagate errors from validation middleware', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          position: 'Software Engineer',
          status: 'invalid-status',
          company: 'Tech Corp'
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Status must be one of');
    });

    it('should propagate errors from authentication middleware', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });
  });

  describe('catchAsync Wrapper', () => {
    it('should catch async errors and pass to next', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrappedFn = catchAsync(asyncFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await wrappedFn(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass through successful async functions', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = catchAsync(asyncFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await wrappedFn(req, res, next);
      
      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Global Error Handler - Test Environment', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle operational errors in test mode', () => {
      const error = new ValidationError('Test error');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Test error'
      });
    });

    it('should handle JWT errors in test mode', () => {
      const error = new Error('JWT Error');
      error.name = 'JsonWebTokenError';
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid token. Please log in again!'
      });
    });

    it('should handle TokenExpiredError in test mode', () => {
      const error = new Error('Token Expired');
      error.name = 'TokenExpiredError';
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Your token has expired! Please log in again.'
      });
    });

    it('should handle non-operational errors in test mode', () => {
      const error = new Error('Unknown error');
      error.isOperational = false;
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong!'
      });
    });
  });

  describe('Global Error Handler - Development Environment', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should send detailed error in development mode', () => {
      const error = new ValidationError('Test error');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        error: error,
        message: 'Test error',
        stack: error.stack
      });
    });
  });

  describe('Global Error Handler - Production Environment', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle CastError in production', () => {
      const error = new Error('Cast to ObjectId failed');
      error.name = 'CastError';
      error.path = 'id';
      error.value = 'invalid-id';
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid id: invalid-id'
      });
    });

    it('should handle duplicate key error in production', () => {
      const error = new Error('Duplicate key error');
      error.code = 11000;
      error.errmsg = 'E11000 duplicate key error collection: users index: email_1 dup key: { email: "test@example.com" }';
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Duplicate field value: "test@example.com". Please use another value!'
      });
    });

    it('should handle Mongoose validation error in production', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        email: { message: 'Email is required' },
        password: { message: 'Password is too short' }
      };
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid input data. Email is required. Password is too short'
      });
    });

    it('should handle JWT errors in production', () => {
      const error = new Error('JWT Error');
      error.name = 'JsonWebTokenError';
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid token. Please log in again!'
      });
    });

    it('should handle TokenExpiredError in production', () => {
      const error = new Error('Token Expired');
      error.name = 'TokenExpiredError';
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Your token has expired! Please log in again.'
      });
    });

    it('should handle operational errors in production', () => {
      const error = new ValidationError('Test error');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Test error'
      });
    });

    it('should handle non-operational errors in production', () => {
      const error = new Error('Unknown error');
      error.isOperational = false;
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong!'
      });
    });
  });
});
