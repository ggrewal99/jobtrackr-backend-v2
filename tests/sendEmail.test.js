const sendEmail = require('../utils/sendEmail');

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('SendEmail Utility Tests', () => {
  let mockTransporter;
  let mockSendMail;

  beforeEach(() => {
    mockSendMail = jest.fn();
    mockTransporter = {
      sendMail: mockSendMail,
    };
    
    const nodemailer = require('nodemailer');
    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Email Sending', () => {
    it('should send email successfully', async () => {
      const mockMessageId = 'test-message-id-123';
      mockSendMail.mockResolvedValue({ messageId: mockMessageId });

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: '<p>Test message</p>'
      };

      const result = await sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Jobtrackr" <no-reply@jobtrackr.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test message</p>'
      });

      expect(result).toEqual({
        success: true,
        messageId: mockMessageId
      });
    });

    it('should use correct transporter configuration', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      await sendEmail(emailOptions);

      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    });

    it('should handle different email formats', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      const testCases = [
        {
          email: 'user@example.com',
          subject: 'Simple Email',
          message: 'Plain text message'
        },
        {
          email: 'user+tag@example.com',
          subject: 'Email with Tag',
          message: '<h1>HTML Message</h1>'
        },
        {
          email: 'user.name@example.com',
          subject: 'Email with Dots',
          message: '<div>Complex HTML</div>'
        }
      ];

      for (const testCase of testCases) {
        const result = await sendEmail(testCase);
        expect(result.success).toBe(true);
        expect(mockTransporter.sendMail).toHaveBeenCalledWith({
          from: '"Jobtrackr" <no-reply@jobtrackr.com>',
          to: testCase.email,
          subject: testCase.subject,
          html: testCase.message
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle transporter creation error', async () => {
      const nodemailer = require('nodemailer');
      nodemailer.createTransport.mockImplementation(() => {
        throw new Error('Transporter creation failed');
      });

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const result = await sendEmail(emailOptions);

      expect(result).toEqual({
        success: false,
        error: 'Transporter creation failed'
      });
    });

    it('should handle sendMail error', async () => {
      const sendError = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValue(sendError);

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const result = await sendEmail(emailOptions);

      expect(result).toEqual({
        success: false,
        error: 'SMTP connection failed'
      });
    });

    it('should handle network timeout error', async () => {
      const timeoutError = new Error('Connection timeout');
      mockSendMail.mockRejectedValue(timeoutError);

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const result = await sendEmail(emailOptions);

      expect(result).toEqual({
        success: false,
        error: 'Connection timeout'
      });
    });

    it('should handle authentication error', async () => {
      const authError = new Error('Invalid credentials');
      mockSendMail.mockRejectedValue(authError);

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const result = await sendEmail(emailOptions);

      expect(result).toEqual({
        success: false,
        error: 'Invalid credentials'
      });
    });

    it('should handle invalid email address error', async () => {
      const invalidEmailError = new Error('Invalid email address');
      mockSendMail.mockRejectedValue(invalidEmailError);

      const emailOptions = {
        email: 'invalid-email',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const result = await sendEmail(emailOptions);

      expect(result).toEqual({
        success: false,
        error: 'Invalid email address'
      });
    });
  });

  describe('Input Validation', () => {
    it('should handle missing email option', async () => {
      const emailOptions = {
        subject: 'Test Subject',
        message: 'Test message'
      };

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing subject option', async () => {
      const emailOptions = {
        email: 'test@example.com',
        message: 'Test message'
      };

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing message option', async () => {
      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject'
      };

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty email options object', async () => {
      const result = await sendEmail({});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null email options', async () => {
      const result = await sendEmail(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle undefined email options', async () => {
      const result = await sendEmail(undefined);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Environment Variables', () => {
    it('should use environment variables for email configuration', async () => {
      const originalEmailUser = process.env.EMAIL_USER;
      const originalEmailPass = process.env.EMAIL_PASS;

      process.env.EMAIL_USER = 'test@jobtrackr.com';
      process.env.EMAIL_PASS = 'test-password';

      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      await sendEmail(emailOptions);

      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: 'Gmail',
        auth: {
          user: 'test@jobtrackr.com',
          pass: 'test-password',
        },
      });

      // Restore original values
      process.env.EMAIL_USER = originalEmailUser;
      process.env.EMAIL_PASS = originalEmailPass;
    });
  });

  describe('Console Logging', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log successful email sending', async () => {
      const mockMessageId = 'test-message-id-123';
      mockSendMail.mockResolvedValue({ messageId: mockMessageId });

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      await sendEmail(emailOptions);

      expect(consoleSpy).toHaveBeenCalledWith('Email sent:', mockMessageId);
    });

    it('should log error when email sending fails', async () => {
      const sendError = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValue(sendError);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      await sendEmail(emailOptions);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending email:', sendError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Return Value Consistency', () => {
    it('should always return an object with success property', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const result = await sendEmail(emailOptions);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should return messageId on success', async () => {
      const mockMessageId = 'test-message-id-123';
      mockSendMail.mockResolvedValue({ messageId: mockMessageId });

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const result = await sendEmail(emailOptions);

      expect(result).toHaveProperty('messageId');
      expect(result.messageId).toBe(mockMessageId);
    });

    it('should return error on failure', async () => {
      const sendError = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValue(sendError);

      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const result = await sendEmail(emailOptions);

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('SMTP connection failed');
    });
  });
});
