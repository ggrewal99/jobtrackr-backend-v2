const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Job = require('../models/Job');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mock the email utility
jest.mock('../utils/sendEmail', () => jest.fn(() => Promise.resolve()));

describe('Integration Tests - Complete Workflows', () => {
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

  describe('Complete User Registration and Verification Workflow', () => {
    it('should complete full user registration and verification process', async () => {
      // Step 1: Register new user
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.message).toBe('User registered successfully');

      // Step 2: Verify user is created but not verified
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.isVerified).toBe(false);

      // Step 3: Generate verification token
      const verificationToken = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Step 4: Verify email
      const verifyResponse = await request(app)
        .get(`/api/auth/verify-email?token=${verificationToken}`)
        .expect(200);

      expect(verifyResponse.body.message).toBe('Email verified successfully. You can now log in.');

      // Step 5: Verify user is now verified
      const verifiedUser = await User.findById(user._id);
      expect(verifiedUser.isVerified).toBe(true);

      // Step 6: Login with verified account
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user.email).toBe(userData.email);
    });
  });

  describe('Complete Job Management Workflow', () => {
    it('should complete full job lifecycle from creation to deletion', async () => {
      // Step 1: Create a job
      const jobData = {
        position: 'Senior Software Engineer',
        status: 'applied',
        company: 'Tech Corp',
        notes: 'Great opportunity with excellent benefits',
        dateApplied: '2024-01-15'
      };

      const createResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(createResponse.body.message).toBe('Job created successfully');

      // Step 2: Verify job was created
      const job = await Job.findOne({ position: jobData.position });
      expect(job).toBeTruthy();
      expect(job.company).toBe(jobData.company);
      expect(job.status).toBe(jobData.status);

      // Step 3: Get all jobs
      const getJobsResponse = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(getJobsResponse.body)).toBe(true);
      expect(getJobsResponse.body.length).toBe(1);
      expect(getJobsResponse.body[0].position).toBe(jobData.position);

      // Step 4: Get specific job
      const getJobResponse = await request(app)
        .get(`/api/jobs/${job._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getJobResponse.body.position).toBe(jobData.position);
      expect(getJobResponse.body.company).toBe(jobData.company);

      // Step 5: Update job status
      const updateResponse = await request(app)
        .patch(`/api/jobs/${job._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'interviewing',
          notes: 'Updated: Interview scheduled for next week'
        })
        .expect(200);

      expect(updateResponse.body.message).toBe('Job updated successfully');
      expect(updateResponse.body.job.status).toBe('interviewing');

      // Step 6: Verify job was updated
      const updatedJob = await Job.findById(job._id);
      expect(updatedJob.status).toBe('interviewing');
      expect(updatedJob.notes).toBe('Updated: Interview scheduled for next week');

      // Step 7: Delete job
      const deleteResponse = await request(app)
        .delete(`/api/jobs/${job._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.message).toBe('Job deleted successfully');

      // Step 8: Verify job was deleted
      const deletedJob = await Job.findById(job._id);
      expect(deletedJob).toBeNull();
    });

    it('should handle multiple jobs workflow', async () => {
      // Step 1: Create multiple jobs
      const jobsData = [
        {
          position: 'Frontend Developer',
          status: 'applied',
          company: 'Web Corp',
          notes: 'React position'
        },
        {
          position: 'Backend Developer',
          status: 'interviewing',
          company: 'API Corp',
          notes: 'Node.js position'
        },
        {
          position: 'Full Stack Developer',
          status: 'offer',
          company: 'Full Corp',
          notes: 'Complete stack position'
        }
      ];

      const createdJobs = [];
      for (const jobData of jobsData) {
        const response = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(201);

        expect(response.body.message).toBe('Job created successfully');
      }

      // Step 2: Get all jobs
      const getJobsResponse = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getJobsResponse.body.length).toBe(3);

      // Step 3: Get jobs from database to get IDs
      const jobs = await Job.find({ userId: testUser._id });
      expect(jobs.length).toBe(3);

      // Step 4: Delete multiple jobs
      const jobIds = jobs.map(job => job._id.toString());
      const deleteMultipleResponse = await request(app)
        .post('/api/jobs/delete-multiple-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: jobIds })
        .expect(200);

      expect(deleteMultipleResponse.body.message).toBe('Jobs deleted successfully');

      // Step 5: Verify all jobs were deleted
      const remainingJobs = await Job.find({ userId: testUser._id });
      expect(remainingJobs.length).toBe(0);
    });
  });

  describe('Complete Task Management Workflow', () => {
    let testJob;

    beforeEach(async () => {
      // Create a test job for task workflow
      testJob = new Job({
        position: 'Software Engineer',
        status: 'applied',
        company: 'Tech Corp',
        userId: testUser._id
      });
      await testJob.save();
    });

    it('should complete full task lifecycle from creation to deletion', async () => {
      // Step 1: Create a task
      const taskData = {
        title: 'Follow up on application',
        dueDateTime: '2024-01-25T10:00:00Z',
        taskType: 'follow-up',
        notes: 'Call HR department',
        jobId: testJob._id.toString()
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(createResponse.body.message).toBe('Task created successfully');
      expect(createResponse.body.task.title).toBe(taskData.title);

      // Step 2: Verify task was created
      const task = await Task.findOne({ title: taskData.title });
      expect(task).toBeTruthy();
      expect(task.taskType).toBe(taskData.taskType);
      expect(task.jobId.toString()).toBe(testJob._id.toString());

      // Step 3: Get all tasks
      const getTasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(getTasksResponse.body)).toBe(true);
      expect(getTasksResponse.body.length).toBe(1);
      expect(getTasksResponse.body[0].title).toBe(taskData.title);

      // Step 4: Get specific task
      const getTaskResponse = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getTaskResponse.body.title).toBe(taskData.title);
      expect(getTaskResponse.body.taskType).toBe(taskData.taskType);

      // Step 5: Update task
      const updateResponse = await request(app)
        .patch(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completed: true,
          notes: 'Completed: Called HR and scheduled interview'
        })
        .expect(200);

      expect(updateResponse.body.message).toBe('Task updated successfully');
      expect(updateResponse.body.task.completed).toBe(true);

      // Step 6: Verify task was updated
      const updatedTask = await Task.findById(task._id);
      expect(updatedTask.completed).toBe(true);
      expect(updatedTask.notes).toBe('Completed: Called HR and scheduled interview');

      // Step 7: Delete task
      const deleteResponse = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.message).toBe('Task deleted successfully');

      // Step 8: Verify task was deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('should handle multiple tasks workflow', async () => {
      // Step 1: Create multiple tasks
      const tasksData = [
        {
          title: 'Research company',
          dueDateTime: '2024-01-20T09:00:00Z',
          taskType: 'research',
          notes: 'Look up company culture and values'
        },
        {
          title: 'Prepare for interview',
          dueDateTime: '2024-01-22T14:00:00Z',
          taskType: 'interview',
          notes: 'Review technical questions',
          jobId: testJob._id.toString()
        },
        {
          title: 'Network with employees',
          dueDateTime: '2024-01-24T16:00:00Z',
          taskType: 'networking',
          notes: 'Connect on LinkedIn'
        }
      ];

      const createdTasks = [];
      for (const taskData of tasksData) {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(201);

        expect(response.body.message).toBe('Task created successfully');
      }

      // Step 2: Get all tasks (should be sorted by dueDateTime)
      const getTasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getTasksResponse.body.length).toBe(3);
      // Should be sorted by dueDateTime (earliest first)
      expect(getTasksResponse.body[0].title).toBe('Research company');
      expect(getTasksResponse.body[1].title).toBe('Prepare for interview');
      expect(getTasksResponse.body[2].title).toBe('Network with employees');

      // Step 3: Get tasks from database to get IDs
      const tasks = await Task.find({ userId: testUser._id });
      expect(tasks.length).toBe(3);

      // Step 4: Delete multiple tasks
      const taskIds = tasks.map(task => task._id.toString());
      const deleteMultipleResponse = await request(app)
        .post('/api/tasks/delete-multiple-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: taskIds })
        .expect(200);

      expect(deleteMultipleResponse.body.message).toBe('Tasks deleted successfully');

      // Step 5: Verify all tasks were deleted
      const remainingTasks = await Task.find({ userId: testUser._id });
      expect(remainingTasks.length).toBe(0);
    });
  });

  describe('Complete User Profile Management Workflow', () => {
    it('should complete full user profile management workflow', async () => {
      // Step 1: Update user profile
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com'
      };

      const updateResponse = await request(app)
        .put('/api/auth/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.message).toBe('User updated successfully');
      expect(updateResponse.body.user.firstName).toBe('Updated');
      expect(updateResponse.body.user.lastName).toBe('Name');
      expect(updateResponse.body.user.email).toBe('updated@example.com');

      // Step 2: Verify user was updated in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
      expect(updatedUser.email).toBe('updated@example.com');

      // Step 3: Change password
      const passwordData = {
        currentPassword: 'testpassword123',
        newPassword: 'newpassword123'
      };

      const changePasswordResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(changePasswordResponse.body.message).toBe('Password changed successfully');

      // Step 4: Verify password was changed
      const userWithNewPassword = await User.findById(testUser._id);
      const isMatch = await bcrypt.compare('newpassword123', userWithNewPassword.password);
      expect(isMatch).toBe(true);

      // Step 5: Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'updated@example.com',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user.email).toBe('updated@example.com');
    });
  });

  describe('Complete Password Reset Workflow', () => {
    it('should complete full password reset workflow', async () => {
      // Step 1: Request password reset
      const resetRequestResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(resetRequestResponse.body.message).toBe('Password reset link has been sent to your email.');

      // Step 2: Verify reset token was set
      const user = await User.findById(testUser._id);
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeDefined();

      // Step 3: Generate reset token (simulating the token from email)
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Update user with the token
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Step 4: Reset password
      const resetResponse = await request(app)
        .post(`/api/auth/reset-password?token=${resetToken}`)
        .send({ newPassword: 'newpassword123' })
        .expect(200);

      expect(resetResponse.body.message).toBe('Password reset successful. You can now log in.');

      // Step 5: Verify password was changed and tokens cleared
      const updatedUser = await User.findById(testUser._id);
      const isMatch = await bcrypt.compare('newpassword123', updatedUser.password);
      expect(isMatch).toBe(true);
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.resetPasswordExpires).toBeUndefined();

      // Step 6: Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user.email).toBe('test@example.com');
    });
  });

  describe('Cross-User Data Isolation Workflow', () => {
    let secondUser;
    let secondUserToken;

    beforeEach(async () => {
      // Create second user
      const hashedPassword = await bcrypt.hash('password123', 10);
      secondUser = new User({
        firstName: 'Second',
        lastName: 'User',
        email: 'second@example.com',
        password: hashedPassword,
        isVerified: true
      });
      await secondUser.save();

      secondUserToken = jwt.sign(
        { id: secondUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should ensure data isolation between users', async () => {
      // Step 1: First user creates a job
      const jobData = {
        position: 'Software Engineer',
        status: 'applied',
        company: 'Tech Corp'
      };

      const createJobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(createJobResponse.body.message).toBe('Job created successfully');

      // Step 2: Second user creates a job
      const secondJobData = {
        position: 'Data Scientist',
        status: 'interviewing',
        company: 'Data Corp'
      };

      const createSecondJobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send(secondJobData)
        .expect(201);

      expect(createSecondJobResponse.body.message).toBe('Job created successfully');

      // Step 3: First user should only see their job
      const firstUserJobsResponse = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(firstUserJobsResponse.body.length).toBe(1);
      expect(firstUserJobsResponse.body[0].position).toBe('Software Engineer');
      expect(firstUserJobsResponse.body[0].company).toBe('Tech Corp');

      // Step 4: Second user should only see their job
      const secondUserJobsResponse = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(200);

      expect(secondUserJobsResponse.body.length).toBe(1);
      expect(secondUserJobsResponse.body[0].position).toBe('Data Scientist');
      expect(secondUserJobsResponse.body[0].company).toBe('Data Corp');

      // Step 5: First user cannot access second user's job
      const jobs = await Job.find({ userId: secondUser._id });
      const secondUserJobId = jobs[0]._id;

      const unauthorizedAccessResponse = await request(app)
        .get(`/api/jobs/${secondUserJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(unauthorizedAccessResponse.body.message).toBe('Job not found');

      // Step 6: Second user cannot access first user's job
      const firstUserJobs = await Job.find({ userId: testUser._id });
      const firstUserJobId = firstUserJobs[0]._id;

      const unauthorizedAccessResponse2 = await request(app)
        .get(`/api/jobs/${firstUserJobId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(404);

      expect(unauthorizedAccessResponse2.body.message).toBe('Job not found');
    });
  });
});
