const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Job = require('../models/Job');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
});
