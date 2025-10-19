const Joi = require('joi');
const { ValidationError } = require('../utils/errorHandler');
const { MESSAGES } = require('../constants/messages');

// Auth validation schemas
const authValidation = {
  register: (req, res, next) => {
    const schema = Joi.object({
      firstName: Joi.string().trim().required()
        .messages({
          'string.empty': MESSAGES.VALIDATION.FIRST_NAME_REQUIRED,
          'any.required': MESSAGES.VALIDATION.FIRST_NAME_REQUIRED,
        }),
      lastName: Joi.string().trim().min(1).optional()
        .messages({
          'string.empty': MESSAGES.VALIDATION.LAST_NAME_EMPTY,
          'string.min': MESSAGES.VALIDATION.LAST_NAME_EMPTY
        }),
      email: Joi.string().email().required()
        .messages({
          'string.email': MESSAGES.VALIDATION.INVALID_EMAIL_FORMAT,
          'string.empty': MESSAGES.VALIDATION.EMAIL_REQUIRED,
          'any.required': MESSAGES.VALIDATION.EMAIL_REQUIRED
        }),
      password: Joi.string().min(6).required()
        .messages({
          'string.min': MESSAGES.VALIDATION.PASSWORD_TOO_SHORT,
          'string.empty': MESSAGES.VALIDATION.PASSWORD_REQUIRED,
          'any.required': MESSAGES.VALIDATION.PASSWORD_REQUIRED
        })
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  },

  login: (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required()
        .messages({
          'string.email': MESSAGES.VALIDATION.INVALID_EMAIL_FORMAT,
          'string.empty': MESSAGES.VALIDATION.EMAIL_REQUIRED,
          'any.required': MESSAGES.VALIDATION.EMAIL_REQUIRED
        }),
      password: Joi.string().required()
        .messages({
          'string.empty': MESSAGES.VALIDATION.PASSWORD_REQUIRED,
          'any.required': MESSAGES.VALIDATION.PASSWORD_REQUIRED
        })
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  },

  resendVerification: (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required()
        .messages({
          'string.email': MESSAGES.VALIDATION.INVALID_EMAIL_FORMAT,
          'string.empty': MESSAGES.VALIDATION.EMAIL_REQUIRED,
          'any.required': MESSAGES.VALIDATION.EMAIL_REQUIRED
        })
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  },

  requestPasswordReset: (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required()
        .messages({
          'string.email': MESSAGES.VALIDATION.INVALID_EMAIL_FORMAT,
          'string.empty': MESSAGES.VALIDATION.EMAIL_REQUIRED,
          'any.required': MESSAGES.VALIDATION.EMAIL_REQUIRED
        })
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  },

  resetPassword: (req, res, next) => {
    const schema = Joi.object({
      newPassword: Joi.string().min(6).required()
        .messages({
          'string.min': MESSAGES.VALIDATION.PASSWORD_TOO_SHORT,
          'string.empty': MESSAGES.VALIDATION.PASSWORD_REQUIRED,
          'any.required': MESSAGES.VALIDATION.PASSWORD_REQUIRED
        })
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  },

  changePassword: (req, res, next) => {
    const schema = Joi.object({
      currentPassword: Joi.string().required()
        .messages({
          'string.empty': MESSAGES.VALIDATION.CURRENT_PASSWORD_REQUIRED,
          'any.required': MESSAGES.VALIDATION.CURRENT_PASSWORD_REQUIRED
        }),
      newPassword: Joi.string().min(6).required()
        .messages({
          'string.min': MESSAGES.VALIDATION.NEW_PASSWORD_TOO_SHORT,
          'string.empty': MESSAGES.VALIDATION.NEW_PASSWORD_REQUIRED,
          'any.required': MESSAGES.VALIDATION.NEW_PASSWORD_REQUIRED
        })
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  },

  updateUser: (req, res, next) => {
    const schema = Joi.object({
      firstName: Joi.string().trim()
        .messages({
          'string.empty': MESSAGES.VALIDATION.FIRST_NAME_REQUIRED
        }),
      lastName: Joi.string().trim().allow('')
        .messages({
          'string.empty': MESSAGES.VALIDATION.LAST_NAME_EMPTY
        }),
      email: Joi.string().email()
        .messages({
          'string.email': MESSAGES.VALIDATION.INVALID_EMAIL_FORMAT,
          'string.empty': MESSAGES.VALIDATION.EMAIL_REQUIRED
        }),
      password: Joi.string().min(6)
        .messages({
          'string.min': MESSAGES.VALIDATION.PASSWORD_TOO_SHORT,
          'string.empty': MESSAGES.VALIDATION.PASSWORD_REQUIRED
        })
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  }
};

// Job validation schemas
const jobValidation = {
  create: (req, res, next) => {
    const schema = Joi.object({
      position: Joi.string().trim().required()
        .messages({
          'string.empty': MESSAGES.VALIDATION.POSITION_REQUIRED,
          'any.required': MESSAGES.VALIDATION.POSITION_REQUIRED,
        }),
      company: Joi.string().trim().required()
        .messages({
          'string.empty': MESSAGES.VALIDATION.COMPANY_REQUIRED,
          'any.required': MESSAGES.VALIDATION.COMPANY_REQUIRED,
        }),
      status: Joi.string().valid('applied', 'interviewing', 'offer', 'rejected').required()
        .messages({
          'any.only': MESSAGES.VALIDATION.INVALID_STATUS,
          'any.required': MESSAGES.VALIDATION.STATUS_REQUIRED
        }),
      dateApplied: Joi.date().iso().optional()
        .messages({
          'date.format': MESSAGES.VALIDATION.INVALID_DATE_FORMAT
        }),
      notes: Joi.string().trim().allow('')
        .messages({
          'string.empty': MESSAGES.VALIDATION.NOTES_EMPTY
        })
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  },

  update: (req, res, next) => {
    const schema = Joi.object({
      position: Joi.string().trim()
        .messages({
          'string.empty': MESSAGES.VALIDATION.POSITION_REQUIRED
        }),
      company: Joi.string().trim()
        .messages({
          'string.empty': MESSAGES.VALIDATION.COMPANY_REQUIRED
        }),
      status: Joi.string().valid('applied', 'interviewing', 'offer', 'rejected')
        .messages({
          'any.only': MESSAGES.VALIDATION.INVALID_STATUS
        }),
      dateApplied: Joi.date().iso()
        .messages({
          'date.format': MESSAGES.VALIDATION.INVALID_DATE_FORMAT
        }),
      notes: Joi.string().trim().allow('')
        .messages({
          'string.empty': MESSAGES.VALIDATION.NOTES_EMPTY
        })
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  }
};

// Task validation schemas
const taskValidation = {
  create: (req, res, next) => {
    const schema = Joi.object({
      title: Joi.string().trim().required()
        .messages({
          'string.empty': MESSAGES.VALIDATION.TITLE_REQUIRED,
          'any.required': MESSAGES.VALIDATION.TITLE_REQUIRED
        }),
      dueDateTime: Joi.date().iso().required()
        .messages({
          'date.format': MESSAGES.VALIDATION.INVALID_DUE_DATE_FORMAT,
          'any.required': MESSAGES.VALIDATION.DUE_DATE_TIME_REQUIRED
        }),
      taskType: Joi.string().valid('follow-up', 'interview', 'networking', 'research', 'other').required()
        .messages({
          'any.only': MESSAGES.VALIDATION.INVALID_TASK_TYPE,
          'any.required': MESSAGES.VALIDATION.TASK_TYPE_REQUIRED
        }),
      jobId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
        .messages({
          'string.pattern.base': MESSAGES.VALIDATION.INVALID_JOB_ID
        }),
      notes: Joi.string().trim().allow(''),
      completed: Joi.boolean().default(false)
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  },

  update: (req, res, next) => {
    const schema = Joi.object({
      title: Joi.string().trim()
        .messages({
          'string.empty': MESSAGES.VALIDATION.TITLE_REQUIRED
        }),
      dueDateTime: Joi.date().iso()
        .messages({
          'date.format': MESSAGES.VALIDATION.INVALID_DUE_DATE_FORMAT
        }),
      taskType: Joi.string().valid('follow-up', 'interview', 'networking', 'research', 'other')
        .messages({
          'any.only': MESSAGES.VALIDATION.INVALID_TASK_TYPE
        }),
      jobId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': MESSAGES.VALIDATION.INVALID_JOB_ID
        }),
      notes: Joi.string().trim().allow(''),
      completed: Joi.boolean()
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    next();
  }
};

// ID validation middleware
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return next(new ValidationError(MESSAGES.VALIDATION.INVALID_ID_FORMAT));
  }
  
  next();
};

// Array validation for bulk operations
const validateIdArray = (req, res, next) => {
  const schema = Joi.object({
    ids: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).min(1).required()
      .messages({
        'array.min': MESSAGES.VALIDATION.AT_LEAST_ONE_ID,
        'any.required': MESSAGES.VALIDATION.IDS_REQUIRED,
        'string.pattern.base': MESSAGES.VALIDATION.INVALID_ID_IN_ARRAY
      })
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    // Handle specific error cases
    if (error.details[0].type === 'array.base') {
      return next(new ValidationError(MESSAGES.VALIDATION.IDS_REQUIRED));
    }
    if (error.details[0].type === 'string.pattern.base') {
      return next(new ValidationError(`Invalid ID format: ${error.details[0].context.value}`));
    }
    return next(new ValidationError(error.details[0].message));
  }
  next();
};

module.exports = {
  authValidation,
  jobValidation,
  taskValidation,
  validateObjectId,
  validateIdArray
};