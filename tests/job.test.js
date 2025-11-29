const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../index');
const Job = require('../models/Job');
const User = require('../models/User');

describe('Job Endpoints', () => {
  let testUser;
  let authToken;
  let testJob;

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

    // Create a test job
    testJob = new Job({
      position: 'Software Engineer',
      status: 'applied',
      company: 'Tech Corp',
      notes: 'Great opportunity',
      dateApplied: new Date('2024-01-15'),
      userId: testUser._id
    });
    await testJob.save();
  });

  describe('GET /api/jobs', () => {
    it('should get all jobs for authenticated user', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].position).toBe('Software Engineer');
      expect(response.body[0].company).toBe('Tech Corp');
    });

    it('should return empty array for user with no jobs', async () => {
      // Create another user with no jobs
      const anotherUser = new User({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true
      });
      await anotherUser.save();

      const anotherToken = jwt.sign(
        { id: anotherUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should get specific job for authenticated user', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.position).toBe('Software Engineer');
      expect(response.body.company).toBe('Tech Corp');
      expect(response.body.status).toBe('applied');
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const response = await request(app)
        .get(`/api/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Job not found');
    });

    it('should return 404 for job belonging to another user', async () => {
      // Create another user and job
      const anotherUser = new User({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true
      });
      await anotherUser.save();

      const anotherJob = new Job({
        position: 'Another Position',
        status: 'interviewing',
        company: 'Another Corp',
        userId: anotherUser._id
      });
      await anotherJob.save();

      const response = await request(app)
        .get(`/api/jobs/${anotherJob._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Job not found');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJob._id}`)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });

  describe('POST /api/jobs', () => {
    it('should create a new job with valid data', async () => {
      const jobData = {
        position: 'Frontend Developer',
        status: 'applied',
        company: 'Web Solutions',
        notes: 'Remote position',
        dateApplied: '2024-01-20'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');

      // Verify job was created in database
      const job = await Job.findOne({ position: 'Frontend Developer' });
      expect(job).toBeTruthy();
      expect(job.company).toBe('Web Solutions');
      expect(job.userId.toString()).toBe(testUser._id.toString());
    });

    it('should create job with minimal required data', async () => {
      const jobData = {
        position: 'Backend Developer',
        status: 'applied',
        company: 'API Corp'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.message).toBe('Job created successfully');

      // Verify job was created
      const job = await Job.findOne({ position: 'Backend Developer' });
      expect(job).toBeTruthy();
      expect(job.notes).toBeUndefined();
      expect(job.dateApplied).toBeDefined(); // Should have default value
    });

    it('should return 400 for invalid status', async () => {
      const jobData = {
        position: 'Developer',
        status: 'invalid-status', // Invalid enum value
        company: 'Tech Corp'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(400);

        expect(response.body.message).toContain('Status must be one of: applied, interviewing, offer, rejected');
    });
    

    it('should return 400 for missing required fields', async () => {
      const jobData = {
        position: 'Developer'
        // Missing status and company
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(400);

        expect(response.body.message).toContain('Company is required');
    });

    it('should return 401 without token', async () => {
      const jobData = {
        position: 'Developer',
        status: 'applied',
        company: 'Tech Corp'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(jobData)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });

  describe('PATCH /api/jobs/:id', () => {
    it('should update job with valid data', async () => {
      const updateData = {
        status: 'interviewing',
        notes: 'Updated notes'
      };

      const response = await request(app)
        .patch(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Job updated successfully');
      expect(response.body.job.status).toBe('interviewing');
      expect(response.body.job.notes).toBe('Updated notes');

      // Verify job was updated in database
      const updatedJob = await Job.findById(testJob._id);
      expect(updatedJob.status).toBe('interviewing');
      expect(updatedJob.notes).toBe('Updated notes');
    });

    it('should update job with dateApplied', async () => {
      const updateData = {
        dateApplied: '2024-02-01'
      };

      const response = await request(app)
        .patch(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Job updated successfully');

      // Verify date was updated
      const updatedJob = await Job.findById(testJob._id);
      expect(new Date(updatedJob.dateApplied).toISOString().split('T')[0]).toBe('2024-02-01');
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        status: 'interviewing'
      };

      const response = await request(app)
        .patch(`/api/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Job not found');
    });

    it('should not update job belonging to another user', async () => {
      // Create another user and job
      const anotherUser = new User({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true
      });
      await anotherUser.save();

      const anotherJob = new Job({
        position: 'Another Position',
        status: 'applied',
        company: 'Another Corp',
        userId: anotherUser._id
      });
      await anotherJob.save();

      const updateData = {
        status: 'interviewing'
      };

      const response = await request(app)
        .patch(`/api/jobs/${anotherJob._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Job not found');
    });

    it('should return 401 without token', async () => {
      const updateData = {
        status: 'interviewing'
      };

      const response = await request(app)
        .patch(`/api/jobs/${testJob._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    it('should delete job for authenticated user', async () => {
      const response = await request(app)
        .delete(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Job deleted successfully');

      // Verify job was deleted
      const deletedJob = await Job.findById(testJob._id);
      expect(deletedJob).toBeNull();
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Job not found');
    });

    it('should return 404 for job belonging to another user', async () => {
      // Create another user and job
      const anotherUser = new User({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true
      });
      await anotherUser.save();

      const anotherJob = new Job({
        position: 'Another Position',
        status: 'applied',
        company: 'Another Corp',
        userId: anotherUser._id
      });
      await anotherJob.save();

      const response = await request(app)
        .delete(`/api/jobs/${anotherJob._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Job not found');

      // Job should still exist
      const stillExists = await Job.findById(anotherJob._id);
      expect(stillExists).toBeTruthy();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .delete(`/api/jobs/${testJob._id}`)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });

  describe('POST /api/jobs/delete-multiple-jobs', () => {
    let secondJob;

    beforeEach(async () => {
      // Create a second job for testing
      secondJob = new Job({
        position: 'DevOps Engineer',
        status: 'rejected',
        company: 'Cloud Corp',
        userId: testUser._id
      });
      await secondJob.save();
    });

    it('should delete multiple jobs with valid IDs', async () => {
      const deleteData = {
        ids: [testJob._id.toString(), secondJob._id.toString()]
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(200);

      expect(response.body.message).toBe('Jobs deleted successfully');

      // Verify jobs were deleted
      const deletedJob1 = await Job.findById(testJob._id);
      const deletedJob2 = await Job.findById(secondJob._id);
      expect(deletedJob1).toBeNull();
      expect(deletedJob2).toBeNull();
    });

    it('should return 400 for empty IDs array', async () => {
      const deleteData = {
        ids: []
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.message).toBe('At least one ID is required');
    });

    it('should return 400 for non-array IDs', async () => {
      const deleteData = {
        ids: 'not-an-array'
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.message).toBe('IDs must be provided as an array');
    });

    it('should only delete jobs belonging to the user', async () => {
      // Create another user and job
      const anotherUser = new User({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true
      });
      await anotherUser.save();

      const anotherJob = new Job({
        position: 'Another Position',
        status: 'applied',
        company: 'Another Corp',
        userId: anotherUser._id
      });
      await anotherJob.save();

      const deleteData = {
        ids: [testJob._id.toString(), anotherJob._id.toString()]
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(200);

      expect(response.body.message).toBe('Jobs deleted successfully');

      // Verify only user's job was deleted
      const deletedJob = await Job.findById(testJob._id);
      const otherJob = await Job.findById(anotherJob._id);
      expect(deletedJob).toBeNull();
      expect(otherJob).toBeTruthy();
    });

    it('should return 401 without token', async () => {
      const deleteData = {
        ids: [testJob._id.toString()]
      };

      const response = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .send(deleteData)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });
});
