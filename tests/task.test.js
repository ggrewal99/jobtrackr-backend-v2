const request = require('supertest');
const app = require('../index');
const Task = require('../models/Task');
const Job = require('../models/Job');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Task Endpoints', () => {
  let testUser;
  let testJob;
  let authToken;
  let testTask;

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
      userId: testUser._id
    });
    await testJob.save();

    // Create a test task
    testTask = new Task({
      title: 'Follow up on application',
      dueDateTime: new Date('2024-01-20T10:00:00Z'),
      taskType: 'follow-up',
      notes: 'Call HR department',
      completed: false,
      userId: testUser._id,
      jobId: testJob._id
    });
    await testTask.save();
  });

  describe('GET /api/tasks', () => {
    it('should get all tasks for authenticated user sorted by dueDateTime', async () => {
      // Create another task with different due date
      const anotherTask = new Task({
        title: 'Another task',
        dueDateTime: new Date('2024-01-15T10:00:00Z'), // Earlier date
        taskType: 'research',
        userId: testUser._id
      });
      await anotherTask.save();

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      // Should be sorted by dueDateTime (earliest first)
      expect(response.body[0].title).toBe('Another task');
      expect(response.body[1].title).toBe('Follow up on application');
    });

    it('should return empty array for user with no tasks', async () => {
      // Create another user with no tasks
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
        .get('/api/tasks')
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get specific task for authenticated user', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.title).toBe('Follow up on application');
      expect(response.body.taskType).toBe('follow-up');
      expect(response.body.completed).toBe(false);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const response = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Task not found');
    });

    it('should return 404 for task belonging to another user', async () => {
      // Create another user and task
      const anotherUser = new User({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true
      });
      await anotherUser.save();

      const anotherTask = new Task({
        title: 'Another task',
        dueDateTime: new Date('2024-01-25T10:00:00Z'),
        taskType: 'interview',
        userId: anotherUser._id
      });
      await anotherTask.save();

      const response = await request(app)
        .get(`/api/tasks/${anotherTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Task not found');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
      const taskData = {
        title: 'Prepare for interview',
        dueDateTime: '2024-01-25T14:00:00Z',
        taskType: 'interview',
        notes: 'Review company materials',
        completed: false,
        jobId: testJob._id.toString()
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.message).toBe('Task created successfully');
      expect(response.body.task.title).toBe('Prepare for interview');
      expect(response.body.task.taskType).toBe('interview');

      // Verify task was created in database
      const task = await Task.findOne({ title: 'Prepare for interview' });
      expect(task).toBeTruthy();
      expect(task.userId.toString()).toBe(testUser._id.toString());
    });

    it('should create task with minimal required data', async () => {
      const taskData = {
        title: 'Simple task',
        dueDateTime: '2024-01-25T10:00:00Z',
        taskType: 'other'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.message).toBe('Task created successfully');

      // Verify task was created
      const task = await Task.findOne({ title: 'Simple task' });
      expect(task).toBeTruthy();
      expect(task.completed).toBe(false); // Default value
      expect(task.jobId).toBeUndefined();
    });

    it('should return 400 for invalid date format', async () => {
      const taskData = {
        title: 'Task with invalid date',
        dueDateTime: 'invalid-date',
        taskType: 'other'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.message).toBe('Invalid date format for dueDateTime');
    });

    it('should return 400 for invalid taskType', async () => {
      const taskData = {
        title: 'Task with invalid type',
        dueDateTime: '2024-01-25T10:00:00Z',
        taskType: 'invalid-type' // Invalid enum value
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const taskData = {
        title: 'Incomplete task'
        // Missing dueDateTime and taskType
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);
    });

    it('should return 401 without token', async () => {
      const taskData = {
        title: 'Unauthorized task',
        dueDateTime: '2024-01-25T10:00:00Z',
        taskType: 'other'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update task with valid data', async () => {
      const updateData = {
        title: 'Updated task title',
        completed: true,
        notes: 'Updated notes'
      };

      const response = await request(app)
        .patch(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Task updated successfully');
      expect(response.body.task.title).toBe('Updated task title');
      expect(response.body.task.completed).toBe(true);
      expect(response.body.task.notes).toBe('Updated notes');

      // Verify task was updated in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.title).toBe('Updated task title');
      expect(updatedTask.completed).toBe(true);
    });

    it('should update task dueDateTime', async () => {
      const updateData = {
        dueDateTime: '2024-02-01T15:00:00Z'
      };

      const response = await request(app)
        .patch(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Task updated successfully');

      // Verify date was updated
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.dueDateTime.toISOString()).toBe('2024-02-01T15:00:00.000Z');
    });

    it('should update task type', async () => {
      const updateData = {
        taskType: 'networking'
      };

      const response = await request(app)
        .patch(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Task updated successfully');

      // Verify task type was updated
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.taskType).toBe('networking');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        title: 'Updated title'
      };

      const response = await request(app)
        .patch(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Task not found');
    });

    it('should not update task belonging to another user', async () => {
      // Create another user and task
      const anotherUser = new User({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true
      });
      await anotherUser.save();

      const anotherTask = new Task({
        title: 'Another task',
        dueDateTime: new Date('2024-01-25T10:00:00Z'),
        taskType: 'research',
        userId: anotherUser._id
      });
      await anotherTask.save();

      const updateData = {
        title: 'Updated title'
      };

      const response = await request(app)
        .patch(`/api/tasks/${anotherTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Task not found');
    });

    it('should return 401 without token', async () => {
      const updateData = {
        title: 'Updated title'
      };

      const response = await request(app)
        .patch(`/api/tasks/${testTask._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task for authenticated user', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Task deleted successfully');

      // Verify task was deleted
      const deletedTask = await Task.findById(testTask._id);
      expect(deletedTask).toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Task not found');
    });

    it('should return 404 for task belonging to another user', async () => {
      // Create another user and task
      const anotherUser = new User({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true
      });
      await anotherUser.save();

      const anotherTask = new Task({
        title: 'Another task',
        dueDateTime: new Date('2024-01-25T10:00:00Z'),
        taskType: 'research',
        userId: anotherUser._id
      });
      await anotherTask.save();

      const response = await request(app)
        .delete(`/api/tasks/${anotherTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Task not found');

      // Task should still exist
      const stillExists = await Task.findById(anotherTask._id);
      expect(stillExists).toBeTruthy();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask._id}`)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });

  describe('POST /api/tasks/delete-multiple-tasks', () => {
    let secondTask;

    beforeEach(async () => {
      // Create a second task for testing
      secondTask = new Task({
        title: 'Second task',
        dueDateTime: new Date('2024-01-30T10:00:00Z'),
        taskType: 'research',
        completed: true,
        userId: testUser._id
      });
      await secondTask.save();
    });

    it('should delete multiple tasks with valid IDs', async () => {
      const deleteData = {
        ids: [testTask._id.toString(), secondTask._id.toString()]
      };

      const response = await request(app)
        .post('/api/tasks/delete-multiple-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(200);

      expect(response.body.message).toBe('Tasks deleted successfully');

      // Verify tasks were deleted
      const deletedTask1 = await Task.findById(testTask._id);
      const deletedTask2 = await Task.findById(secondTask._id);
      expect(deletedTask1).toBeNull();
      expect(deletedTask2).toBeNull();
    });

    it('should return 400 for empty IDs array', async () => {
      const deleteData = {
        ids: []
      };

      const response = await request(app)
        .post('/api/tasks/delete-multiple-tasks')
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
        .post('/api/tasks/delete-multiple-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      expect(response.body.message).toBe('IDs must be provided as an array');
    });

    it('should only delete tasks belonging to the user', async () => {
      // Create another user and task
      const anotherUser = new User({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true
      });
      await anotherUser.save();

      const anotherTask = new Task({
        title: 'Another task',
        dueDateTime: new Date('2024-01-25T10:00:00Z'),
        taskType: 'research',
        userId: anotherUser._id
      });
      await anotherTask.save();

      const deleteData = {
        ids: [testTask._id.toString(), anotherTask._id.toString()]
      };

      const response = await request(app)
        .post('/api/tasks/delete-multiple-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(200);

      expect(response.body.message).toBe('Tasks deleted successfully');

      // Verify only user's task was deleted
      const deletedTask = await Task.findById(testTask._id);
      const otherTask = await Task.findById(anotherTask._id);
      expect(deletedTask).toBeNull();
      expect(otherTask).toBeTruthy();
    });

    it('should return 401 without token', async () => {
      const deleteData = {
        ids: [testTask._id.toString()]
      };

      const response = await request(app)
        .post('/api/tasks/delete-multiple-tasks')
        .send(deleteData)
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });
});
