const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../index');
const User = require('../models/User');
const Job = require('../models/Job');
const Task = require('../models/Task');

// Mock the email utility
jest.mock('../utils/sendEmail', () => jest.fn(() => Promise.resolve()));

describe('Middleware Tests', () => {
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
      { id: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Authentication Middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired token
      );

      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });
  });

  describe('Job Validation Middleware', () => {
    describe('Create Job Validation', () => {
      it('should pass validation with valid job data', async () => {
        const jobData = {
          position: 'Software Engineer',
          status: 'applied',
          company: 'Tech Corp',
          notes: 'Great opportunity',
          dateApplied: '2024-01-15'
        };

        const response = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(201);

        expect(response.body.message).toBe('Job created successfully');
      });

      it('should fail validation with missing position', async () => {
        const jobData = {
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

      it('should fail validation with empty position', async () => {
        const jobData = {
          position: '',
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

      it('should fail validation with missing company', async () => {
        const jobData = {
          position: 'Software Engineer',
          status: 'applied'
        };

        const response = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(400);

        expect(response.body.message).toContain('Company is required');
      });

      it('should fail validation with empty company', async () => {
        const jobData = {
          position: 'Software Engineer',
          status: 'applied',
          company: ''
        };

        const response = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(400);

        expect(response.body.message).toContain('Company is required');
      });

      it('should fail validation with missing status', async () => {
        const jobData = {
          position: 'Software Engineer',
          company: 'Tech Corp'
        };

        const response = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(400);

        expect(response.body.message).toContain('Status is required');
      });

      it('should fail validation with invalid status', async () => {
        const jobData = {
          position: 'Software Engineer',
          status: 'invalid-status',
          company: 'Tech Corp'
        };

        const response = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(400);

        expect(response.body.message).toContain('Status must be one of: applied, interviewing, offer, rejected');
      });

      it('should fail validation with invalid date format', async () => {
        const jobData = {
          position: 'Software Engineer',
          status: 'applied',
          company: 'Tech Corp',
          dateApplied: 'invalid-date'
        };

        const response = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(400);

        expect(response.body.message).toContain('Invalid date format for dateApplied');
      });

      it('should pass validation with valid date format', async () => {
        const jobData = {
          position: 'Software Engineer',
          status: 'applied',
          company: 'Tech Corp',
          dateApplied: '2024-01-15T10:30:00Z'
        };

        const response = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(201);

        expect(response.body.message).toBe('Job created successfully');
      });
    });

    describe('Update Job Validation', () => {
      let testJob;

      beforeEach(async () => {
        testJob = new Job({
          position: 'Software Engineer',
          status: 'applied',
          company: 'Tech Corp',
          userId: testUser._id
        });
        await testJob.save();
      });

      it('should pass validation with valid update data', async () => {
        const updateData = {
          status: 'interviewing',
          dateApplied: '2024-01-20'
        };

        const response = await request(app)
          .patch(`/api/jobs/${testJob._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.message).toBe('Job updated successfully');
      });

      it('should fail validation with invalid status', async () => {
        const updateData = {
          status: 'invalid-status'
        };

        const response = await request(app)
          .patch(`/api/jobs/${testJob._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.message).toContain('Status must be one of: applied, interviewing, offer, rejected');
      });

      it('should fail validation with invalid date format', async () => {
        const updateData = {
          dateApplied: 'invalid-date'
        };

        const response = await request(app)
          .patch(`/api/jobs/${testJob._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.message).toContain('Invalid date format for dateApplied');
      });

      it('should pass validation with no update data', async () => {
        const updateData = {};

        const response = await request(app)
          .patch(`/api/jobs/${testJob._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.message).toBe('Job updated successfully');
      });
    });
  });

  describe('Task Validation Middleware', () => {
    describe('Create Task Validation', () => {
      it('should pass validation with valid task data', async () => {
        const taskData = {
          title: 'Follow up on application',
          dueDateTime: '2024-01-25T10:00:00Z',
          taskType: 'follow-up',
          notes: 'Call HR department'
        };

        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(201);

        expect(response.body.message).toBe('Task created successfully');
      });

      it('should fail validation with missing title', async () => {
        const taskData = {
          dueDateTime: '2024-01-25T10:00:00Z',
          taskType: 'follow-up'
        };

        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(400);

        expect(response.body.message).toContain('Title is required');
      });

      it('should fail validation with empty title', async () => {
        const taskData = {
          title: '',
          dueDateTime: '2024-01-25T10:00:00Z',
          taskType: 'follow-up'
        };

        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(400);

        expect(response.body.message).toContain('Title is required');
      });

      it('should fail validation with missing dueDateTime', async () => {
        const taskData = {
          title: 'Follow up on application',
          taskType: 'follow-up'
        };

        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(400);

        expect(response.body.message).toContain('Due date and time is required');
      });

      it('should fail validation with missing taskType', async () => {
        const taskData = {
          title: 'Follow up on application',
          dueDateTime: '2024-01-25T10:00:00Z'
        };

        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(400);

        expect(response.body.message).toContain('Task type is required');
      });

      it('should fail validation with invalid date format', async () => {
        const taskData = {
          title: 'Follow up on application',
          dueDateTime: 'invalid-date',
          taskType: 'follow-up'
        };

        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(400);

        expect(response.body.message).toContain('Invalid date format for dueDateTime');
      });

      it('should fail validation with invalid taskType', async () => {
        const taskData = {
          title: 'Follow up on application',
          dueDateTime: '2024-01-25T10:00:00Z',
          taskType: 'invalid-type'
        };

        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(400);

        expect(response.body.message).toContain('Task type must be one of: follow-up, interview, networking, research, other');
      });

      it('should pass validation with all valid task types', async () => {
        const taskTypes = ['follow-up', 'interview', 'networking', 'research', 'other'];
        
        await Promise.all(taskTypes.map(async (taskType) => {
          const taskData = {
            title: `Task for ${taskType}`,
            dueDateTime: '2024-01-25T10:00:00Z',
            taskType
          };

          const response = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send(taskData)
            .expect(201);

          expect(response.body.message).toBe('Task created successfully');
        }));
      });
    });

    describe('Update Task Validation', () => {
      let testTask;

      beforeEach(async () => {
        testTask = new Task({
          title: 'Follow up on application',
          dueDateTime: new Date('2024-01-25T10:00:00Z'),
          taskType: 'follow-up',
          userId: testUser._id
        });
        await testTask.save();
      });

      it('should pass validation with valid update data', async () => {
        const updateData = {
          title: 'Updated task',
          taskType: 'interview'
        };

        const response = await request(app)
          .patch(`/api/tasks/${testTask._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.message).toBe('Task updated successfully');
      });

      it('should fail validation with invalid date format', async () => {
        const updateData = {
          dueDateTime: 'invalid-date'
        };

        const response = await request(app)
          .patch(`/api/tasks/${testTask._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.message).toContain('Invalid date format for dueDateTime');
      });

      it('should fail validation with invalid taskType', async () => {
        const updateData = {
          taskType: 'invalid-type'
        };

        const response = await request(app)
          .patch(`/api/tasks/${testTask._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.message).toContain('Task type must be one of: follow-up, interview, networking, research, other');
      });

      it('should pass validation with no update data', async () => {
        const updateData = {};

        const response = await request(app)
          .patch(`/api/tasks/${testTask._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.message).toBe('Task updated successfully');
      });
    });
  });

  describe('ID Validation Middleware', () => {
    it('should pass validation with valid ObjectId', async () => {
      const validId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/jobs/${validId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // Job not found, but ID validation passed

      expect(response.body.message).toBe('Job not found');
    });

    it('should fail validation with invalid ObjectId format', async () => {
      const invalidId = 'invalid-id';
      
      const response = await request(app)
        .get(`/api/jobs/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid ID format');
    });

    it('should fail validation with empty ID', async () => {
      const response = await request(app)
        .get('/api/jobs/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Route exists but returns empty array

        expect(response.body.message).toContain('Invalid ID format');
    });

    it('should fail validation with too short ID', async () => {
      const shortId = '123';
      
      const response = await request(app)
        .get(`/api/jobs/${shortId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid ID format');
    });

    it('should fail validation with too long ID', async () => {
      const longId = '507f1f77bcf86cd799439011123456789';
      
      const response = await request(app)
        .get(`/api/jobs/${longId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid ID format');
    });
  });

  describe('ID Array Validation Middleware', () => {
    it('should pass validation with valid ID array', async () => {
      // Create some jobs first
      const job1 = new Job({
        position: 'Job 1',
        status: 'applied',
        company: 'Company 1',
        userId: testUser._id
      });
      await job1.save();

      const job2 = new Job({
        position: 'Job 2',
        status: 'applied',
        company: 'Company 2',
        userId: testUser._id
      });
      await job2.save();

      const deleteData = {
        ids: [job1._id.toString(), job2._id.toString()]
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(200);

      expect(response.body.message).toBe('Jobs deleted successfully');
    });

    it('should fail validation with non-array IDs', async () => {
      const deleteData = {
        ids: 'not-an-array'
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.message).toContain('IDs must be provided as an array');
    });

    it('should fail validation with empty array', async () => {
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

    it('should fail validation with invalid ID in array', async () => {
      const deleteData = {
        ids: ['507f1f77bcf86cd799439011', 'invalid-id']
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.message).toContain('Invalid ID format: invalid-id');
    });

    it('should fail validation with missing ids field', async () => {
      const deleteData = {};

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.message).toContain('IDs must be provided as an array');
    });
  });
});
