const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Job = require('../models/Job');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mock the email utility
jest.mock('../utils/sendEmail', () => jest.fn(() => Promise.resolve()));

describe('Edge Cases and Boundary Conditions', () => {
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

  describe('String Length Boundary Tests', () => {
    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(1000);
      
      const jobData = {
        position: longString,
        status: 'applied',
        company: 'Tech Corp',
        notes: longString
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');

      // Verify the long strings were stored
      const job = await Job.findOne({ position: longString });
      expect(job.position).toBe(longString);
      expect(job.notes).toBe(longString);
    });

    it('should handle very short strings', async () => {
      const jobData = {
        position: 'A',
        status: 'applied',
        company: 'B'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');
    });

    it('should handle empty strings in optional fields', async () => {
      const jobData = {
        position: 'Software Engineer',
        status: 'applied',
        company: 'Tech Corp',
        notes: ''
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');

      const job = await Job.findOne({ position: 'Software Engineer' });
      expect(job.notes).toBe('');
    });
  });

  describe('Date Boundary Tests', () => {
    it('should handle very old dates', async () => {
      const jobData = {
        position: 'Software Engineer',
        status: 'applied',
        company: 'Tech Corp',
        dateApplied: '1900-01-01'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');
    });

    it('should handle future dates', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      
      const jobData = {
        position: 'Software Engineer',
        status: 'applied',
        company: 'Tech Corp',
        dateApplied: futureDate.toISOString()
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');
    });

    it('should handle edge case dates', async () => {
      const edgeDates = [
        '1970-01-01T00:00:00.000Z', // Unix epoch
        '2038-01-19T03:14:07.000Z', // 32-bit signed integer max
        '9999-12-31T23:59:59.999Z'  // Far future
      ];

      for (const date of edgeDates) {
        const jobData = {
          position: `Job for ${date}`,
          status: 'applied',
          company: 'Tech Corp',
          dateApplied: date
        };

        const response = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(201);

        expect(response.body.message).toBe('Job created successfully');
      }
    });
  });

  describe('Special Character Tests', () => {
    it('should handle special characters in strings', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      
      const jobData = {
        position: `Engineer ${specialChars}`,
        status: 'applied',
        company: `Company ${specialChars}`,
        notes: `Notes with ${specialChars}`
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');

      const job = await Job.findOne({ position: `Engineer ${specialChars}` });
      expect(job.position).toBe(`Engineer ${specialChars}`);
      expect(job.company).toBe(`Company ${specialChars}`);
      expect(job.notes).toBe(`Notes with ${specialChars}`);
    });

    it('should handle unicode characters', async () => {
      const unicodeChars = '🚀💻🎯🔥⭐️🌟✨💫⚡️';
      
      const jobData = {
        position: `Engineer ${unicodeChars}`,
        status: 'applied',
        company: `Company ${unicodeChars}`,
        notes: `Notes with ${unicodeChars}`
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');
    });

    it('should handle newlines and tabs in strings', async () => {
      const multilineString = 'Line 1\nLine 2\tTabbed\nLine 3';
      
      const jobData = {
        position: 'Software Engineer',
        status: 'applied',
        company: 'Tech Corp',
        notes: multilineString
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');

      const job = await Job.findOne({ position: 'Software Engineer' });
      expect(job.notes).toBe(multilineString);
    });
  });

  describe('Numeric Boundary Tests', () => {
    it('should handle very large numbers in ObjectId format', async () => {
      const largeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/jobs/${largeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Job not found');
    });

    it('should handle zero and negative numbers', async () => {
      // Test with invalid ObjectId that contains zeros
      const zeroId = '000000000000000000000000';
      
      const response = await request(app)
        .get(`/api/jobs/${zeroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Job not found');
    });
  });

  describe('Array Boundary Tests', () => {
    it('should handle empty arrays in bulk operations', async () => {
      const deleteData = {
        ids: []
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.message).toContain('At least one ID is required');
    });

    it('should handle very large arrays in bulk operations', async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => `507f1f77bcf86cd7994390${i.toString().padStart(2, '0')}`);
      
      const deleteData = {
        ids: largeArray
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.message).toContain('Invalid ID format');
    });

    it('should handle arrays with mixed valid and invalid IDs', async () => {
      const mixedArray = [
        '507f1f77bcf86cd799439011', // Valid
        'invalid-id',                // Invalid
        '507f1f77bcf86cd799439012'  // Valid
      ];
      
      const deleteData = {
        ids: mixedArray
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.message).toContain('Invalid ID format: invalid-id');
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle concurrent job creation', async () => {
      const jobPromises = [];
      
      for (let i = 0; i < 10; i++) {
        const jobData = {
          position: `Concurrent Job ${i}`,
          status: 'applied',
          company: `Company ${i}`
        };
        
        jobPromises.push(
          request(app)
            .post('/api/jobs')
            .set('Authorization', `Bearer ${authToken}`)
            .send(jobData)
        );
      }

      const responses = await Promise.all(jobPromises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Job created successfully');
      });

      // Verify all jobs were created
      const jobs = await Job.find({ userId: testUser._id });
      expect(jobs.length).toBe(10);
    });

    it('should handle concurrent task creation', async () => {
      const taskPromises = [];
      
      for (let i = 0; i < 10; i++) {
        const taskData = {
          title: `Concurrent Task ${i}`,
          dueDateTime: new Date(Date.now() + i * 60000).toISOString(),
          taskType: 'other'
        };
        
        taskPromises.push(
          request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send(taskData)
        );
      }

      const responses = await Promise.all(taskPromises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Task created successfully');
      });

      // Verify all tasks were created
      const tasks = await Task.find({ userId: testUser._id });
      expect(tasks.length).toBe(10);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle large number of jobs efficiently', async () => {
      // Create 100 jobs
      for (let i = 0; i < 100; i++) {
        const jobData = {
          position: `Job ${i}`,
          status: 'applied',
          company: `Company ${i}`
        };
        
        await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(201);
      }

      // Get all jobs should still work efficiently
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(100);
    });

    it('should handle large number of tasks efficiently', async () => {
      // Create 100 tasks
      for (let i = 0; i < 100; i++) {
        const taskData = {
          title: `Task ${i}`,
          dueDateTime: new Date(Date.now() + i * 60000).toISOString(),
          taskType: 'other'
        };
        
        await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(201);
      }

      // Get all tasks should still work efficiently and be sorted
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(100);
      
      // Verify sorting by dueDateTime
      for (let i = 1; i < response.body.length; i++) {
        const prevDate = new Date(response.body[i - 1].dueDateTime);
        const currDate = new Date(response.body[i].dueDateTime);
        expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
      }
    });
  });

  describe('Database Constraint Edge Cases', () => {
    it('should handle duplicate email registration attempts', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com', // Same as existing user
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.message).toBe('Email already in use');
    });

    it('should handle case sensitivity in email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'TEST@EXAMPLE.COM', // Uppercase version of existing email
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
    });
  });

  describe('Token Edge Cases', () => {
    it('should handle malformed JWT tokens', async () => {
      const malformedTokens = [
        'not-a-token',
        'Bearer',
        'Bearer ',
        'Bearer not.a.token',
        'Bearer not-a-token',
        'not.bearer.token',
        'Bearer not.a.valid.jwt.token'
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/jobs')
          .set('Authorization', token)
          .expect(401);

        expect(['Not authorized, token failed', 'Not authorized, no token']).toContain(response.body.message);
      }
    });

    it('should handle expired tokens', async () => {
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

    it('should handle tokens with invalid signature', async () => {
      const invalidToken = jwt.sign(
        { id: testUser._id, role: testUser.role },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });
  });

  describe('Request Body Edge Cases', () => {
    it('should handle null values in request body', async () => {
      const jobData = {
        position: null,
        status: 'applied',
        company: 'Tech Corp'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(400);

      expect(response.body.message).toContain('Position is required');
    });

    it('should handle undefined values in request body', async () => {
      const jobData = {
        position: undefined,
        status: 'applied',
        company: 'Tech Corp'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(400);

      expect(response.body.message).toContain('Position is required');
    });

    it('should handle boolean values in string fields', async () => {
      const jobData = {
        position: true,
        status: 'applied',
        company: false
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(400);

      expect(response.body.message).toContain('Company is required');
    });

    it('should handle numeric values in string fields', async () => {
      const jobData = {
        position: 123,
        status: 'applied',
        company: 456
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');

      const job = await Job.findOne({ position: '123' });
      expect(job.position).toBe('123');
      expect(job.company).toBe('456');
    });
  });
});
