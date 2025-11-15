const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mock the email utility
jest.mock('../utils/sendEmail', () => jest.fn(() => Promise.resolve()));

describe('Auth Endpoints', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create a test user for login tests
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: hashedPassword,
      isVerified: true
    });
    await testUser.save();

    // Generate auth token for protected routes
    authToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.isVerified).toBe(false);
    });

    it('should register user with only first name (lastName optional)', async () => {
      const userData = {
        firstName: 'Jane',
        email: 'jane@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBeUndefined();
    });

    it('should return 409 if email already exists', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com', // Already exists
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.message).toBe('Email already in use');
    });

    it('should return 400 if required fields are missing', async () => {
      const userData = {
        firstName: 'John',
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Invalid email format');
    });

    it('should return 400 for password too short', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'shortpass@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Password must be at least 6 characters long');
    });

    it('should return 400 for empty first name', async () => {
      const userData = {
        firstName: '',
        lastName: 'Doe',
        email: 'emptyfirst@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('First name is required');
    });

    it('should return 400 for empty last name', async () => {
      const userData = {
        firstName: 'John',
        lastName: '',
        email: 'emptylast@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Last name cannot be empty');
    });

    it('should return 400 for empty email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Email is required');
    });

    it('should return 400 for empty password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'emptypass@example.com',
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Password is required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.firstName).toBe('Test');
      expect(response.body.user.lastName).toBe('User');
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for unverified email', async () => {
      // Create unverified user
      const unverifiedUser = new User({
        firstName: 'Unverified',
        lastName: 'User',
        email: 'unverified@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: false
      });
      await unverifiedUser.save();

      const loginData = {
        email: 'unverified@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Email not verified. Please check your email and verify your account.');
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain('Invalid email format');
    });

    it('should return 400 for empty email', async () => {
      const loginData = {
        email: '',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain('Email is required');
    });

    it('should return 400 for empty password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain('Password is required');
    });

    it('should return 400 for missing email', async () => {
      const loginData = {
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain('Email is required');
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain('Password is required');
    });
  });

  describe('GET /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      // Create unverified user
      const unverifiedUser = new User({
        firstName: 'Unverified',
        lastName: 'User',
        email: 'unverified@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: false
      });
      await unverifiedUser.save();

      const token = jwt.sign(
        { email: unverifiedUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get(`/api/auth/verify-email?token=${token}`)
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully. You can now log in.');

      // Verify user is now verified
      const updatedUser = await User.findById(unverifiedUser._id);
      expect(updatedUser.isVerified).toBe(true);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email?token=invalidtoken')
        .expect(401);

      expect(response.body.message).toBe('Invalid token. Please log in again!');
    });

    it('should return 400 for already verified user', async () => {
      const token = jwt.sign(
        { email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get(`/api/auth/verify-email?token=${token}`)
        .expect(400);

      expect(response.body.message).toBe('Email already verified');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should resend verification email for unverified user', async () => {
      const unverifiedUser = new User({
        firstName: 'Unverified',
        lastName: 'User',
        email: 'unverified@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: false
      });
      await unverifiedUser.save();

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'unverified@example.com' })
        .expect(200);

      expect(response.body.message).toBe('Verification email sent');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for already verified user', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.message).toBe('Email already verified');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.message).toBe('Password reset link has been sent to your email.');

      // Verify reset token was set
      const user = await User.findById(testUser._id);
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      // Set up reset token for test user
      const crypto = require('crypto');
      resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      testUser.resetPasswordToken = hashedToken;
      testUser.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await testUser.save();
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post(`/api/auth/reset-password?token=${resetToken}`)
        .send({ newPassword: 'newpassword123' })
        .expect(200);

      expect(response.body.message).toBe('Password reset successful. You can now log in.');

      // Verify password was changed
      const updatedUser = await User.findById(testUser._id);
      const isMatch = await bcrypt.compare('newpassword123', updatedUser.password);
      expect(isMatch).toBe(true);
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.resetPasswordExpires).toBeUndefined();
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password?token=invalidtoken')
        .send({ newPassword: 'newpassword123' })
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('should return 401 for expired token', async () => {
      // Set expired token
      testUser.resetPasswordExpires = Date.now() - 1000; // 1 second ago
      await testUser.save();

      const response = await request(app)
        .post(`/api/auth/reset-password?token=${resetToken}`)
        .send({ newPassword: 'newpassword123' })
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired token');
    });
  });

  describe('PUT /api/auth/update', () => {
    it('should update user profile with valid token', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put('/api/auth/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.user.firstName).toBe('Updated');
      expect(response.body.user.lastName).toBe('Name');

      // Verify user was updated in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
    });

    it('should update only firstName', async () => {
      const updateData = {
        firstName: 'OnlyFirst'
      };

      const response = await request(app)
        .put('/api/auth/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.user.firstName).toBe('OnlyFirst');
      expect(response.body.user.lastName).toBe('User'); // Should remain unchanged

      // Verify user was updated in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe('OnlyFirst');
      expect(updatedUser.lastName).toBe('User');
    });

    it('should update only lastName', async () => {
      const updateData = {
        lastName: 'OnlyLast'
      };

      const response = await request(app)
        .put('/api/auth/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.user.firstName).toBe('Test'); // Should remain unchanged
      expect(response.body.user.lastName).toBe('OnlyLast');

      // Verify user was updated in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe('Test');
      expect(updatedUser.lastName).toBe('OnlyLast');
    });

    it('should update email', async () => {
      const updateData = {
        email: 'newemail@example.com'
      };

      const response = await request(app)
        .put('/api/auth/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.user.email).toBe('newemail@example.com');

      // Verify user was updated in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.email).toBe('newemail@example.com');
    });

    it('should update password when provided', async () => {
      const updateData = {
        password: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');

      // Verify password was updated in database
      const updatedUser = await User.findById(testUser._id);
      const isMatch = await bcrypt.compare('newpassword123', updatedUser.password);
      expect(isMatch).toBe(true);
    });

    it('should handle empty update data', async () => {
      const updateData = {};

      const response = await request(app)
        .put('/api/auth/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.user.firstName).toBe('Test');
      expect(response.body.user.lastName).toBe('User');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/auth/update')
        .send({ firstName: 'Updated' })
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .put('/api/auth/update')
        .set('Authorization', 'Bearer invalidtoken')
        .send({ firstName: 'Updated' })
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const passwordData = {
        currentPassword: 'testpassword123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');

      // Verify password was changed
      const updatedUser = await User.findById(testUser._id);
      const isMatch = await bcrypt.compare('newpassword123', updatedUser.password);
      expect(isMatch).toBe(true);
    });

    it('should return 401 for invalid current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.message).toBe('Invalid current password');
    });

    it('should return 400 for missing current password', async () => {
      const passwordData = {
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.message).toContain('Current password is required');
    });

    it('should return 400 for missing new password', async () => {
      const passwordData = {
        currentPassword: 'testpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.message).toContain('New password is required');
    });

    it('should return 400 for new password too short', async () => {
      const passwordData = {
        currentPassword: 'testpassword123',
        newPassword: '123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.message).toContain('New password must be at least 6 characters long');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({ currentPassword: 'testpassword123', newPassword: 'newpassword123' })
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });
});
