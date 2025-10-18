const { ValidationError } = require('../utils/errorHandler');

// Job validation schemas
const jobValidation = {
  create: (req, res, next) => {
    const { position, status, company, dateApplied } = req.body;
    
    // Required fields validation
    if (!position || (typeof position === 'string' && !position.trim())) {
      return next(new ValidationError('Position is required'));
    }
    if (!company || (typeof company === 'string' && !company.trim())) {
      return next(new ValidationError('Company is required'));
    }
    if (!status) {
      return next(new ValidationError('Status is required'));
    }
    
    // Status enum validation
    const validStatuses = ['applied', 'interviewing', 'offer', 'rejected'];
    if (!validStatuses.includes(status)) {
      return next(new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`));
    }
    
    // Date validation
    if (dateApplied) {
      const date = new Date(dateApplied);
      if (isNaN(date.getTime())) {
        return next(new ValidationError('Invalid date format for dateApplied'));
      }
    }
    
    next();
  },
  
  update: (req, res, next) => {
    const { status, dateApplied } = req.body;
    
    // Status validation if provided
    if (status) {
      const validStatuses = ['applied', 'interviewing', 'offer', 'rejected'];
      if (!validStatuses.includes(status)) {
        return next(new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`));
      }
    }
    
    // Date validation if provided
    if (dateApplied) {
      const date = new Date(dateApplied);
      if (isNaN(date.getTime())) {
        return next(new ValidationError('Invalid date format for dateApplied'));
      }
    }
    
    next();
  }
};

// Task validation schemas
const taskValidation = {
  create: (req, res, next) => {
    const { title, dueDateTime, taskType } = req.body;
    
    // Required fields validation
    if (!title || (typeof title === 'string' && !title.trim())) {
      return next(new ValidationError('Title is required'));
    }
    
    if (!dueDateTime) {
      return next(new ValidationError('Due date and time is required'));
    }
    
    if (!taskType) {
      return next(new ValidationError('Task type is required'));
    }
    
    // Date validation
    const date = new Date(dueDateTime);
    if (isNaN(date.getTime())) {
      return next(new ValidationError('Invalid date format for dueDateTime'));
    }
    
    // Task type validation
    const validTypes = ['follow-up', 'interview', 'networking', 'research', 'other'];
    if (!validTypes.includes(taskType)) {
      return next(new ValidationError(`Task type must be one of: ${validTypes.join(', ')}`));
    }
    
    next();
  },
  
  update: (req, res, next) => {
    const { dueDateTime, taskType } = req.body;
    
    // Date validation if provided
    if (dueDateTime !== undefined) {
      const date = new Date(dueDateTime);
      if (isNaN(date.getTime())) {
        return next(new ValidationError('Invalid date format for dueDateTime'));
      }
    }
    
    // Task type validation if provided
    if (taskType !== undefined) {
      const validTypes = ['follow-up', 'interview', 'networking', 'research', 'other'];
      if (!validTypes.includes(taskType)) {
        return next(new ValidationError(`Task type must be one of: ${validTypes.join(', ')}`));
      }
    }
    
    next();
  }
};

// Auth validation schemas
const authValidation = {
  register: (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;
    
    // Required fields validation
    if (!firstName || (typeof firstName === 'string' && !firstName.trim())) {
      return next(new ValidationError('First name is required'));
    }
    // lastName is optional, but if provided, it shouldn't be empty
    if (lastName !== undefined && lastName !== null && (typeof lastName === 'string' && !lastName.trim())) {
      return next(new ValidationError('Last name cannot be empty'));
    }
    if (!email || (typeof email === 'string' && !email.trim())) {
      return next(new ValidationError('Email is required'));
    }
    if (!password) {
      return next(new ValidationError('Password is required'));
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ValidationError('Invalid email format'));
    }
    
    // Password strength validation
    if (password.length < 6) {
      return next(new ValidationError('Password must be at least 6 characters long'));
    }
    
    next();
  },
  
  login: (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || (typeof email === 'string' && !email.trim())) {
      return next(new ValidationError('Email is required'));
    }
    if (!password) {
      return next(new ValidationError('Password is required'));
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ValidationError('Invalid email format'));
    }
    
    next();
  },
  
  changePassword: (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword) {
      return next(new ValidationError('Current password is required'));
    }
    if (!newPassword) {
      return next(new ValidationError('New password is required'));
    }
    
    if (newPassword.length < 6) {
      return next(new ValidationError('New password must be at least 6 characters long'));
    }
    
    next();
  }
};

// ID validation middleware
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return next(new ValidationError('Invalid ID format'));
  }
  
  next();
};

// Array validation for bulk operations
const validateIdArray = (req, res, next) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids)) {
    return next(new ValidationError('IDs must be provided as an array'));
  }
  
  if (ids.length === 0) {
    return next(new ValidationError('At least one ID is required'));
  }
  
  // Validate each ID format
  for (const id of ids) {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new ValidationError(`Invalid ID format: ${id}`));
    }
  }
  
  next();
};

module.exports = {
  jobValidation,
  taskValidation,
  authValidation,
  validateObjectId,
  validateIdArray
};
