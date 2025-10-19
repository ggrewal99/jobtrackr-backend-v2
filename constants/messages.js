const MESSAGES = {
    // SUCCESS MESSAGES
    SUCCESS: {
      // Auth success messages
      USER_REGISTERED: 'User registered successfully',
      EMAIL_VERIFIED: 'Email verified successfully. You can now log in.',
      VERIFICATION_EMAIL_SENT: 'Verification email sent',
      PASSWORD_RESET_SENT: 'Password reset link has been sent to your email.',
      PASSWORD_RESET_SUCCESS: 'Password reset successful. You can now log in.',
      USER_UPDATED: 'User updated successfully',
      PASSWORD_CHANGED: 'Password changed successfully',
      LOGIN_SUCCESS: 'Login successful',
      // Job success messages
      JOB_CREATED: 'Job created successfully',
      JOB_UPDATED: 'Job updated successfully',
      JOB_DELETED: 'Job deleted successfully',
      JOBS_DELETED: 'Jobs deleted successfully',
      
      // Task success messages
      TASK_CREATED: 'Task created successfully',
      TASK_UPDATED: 'Task updated successfully',
      TASK_DELETED: 'Task deleted successfully',
      TASKS_DELETED: 'Tasks deleted successfully'
    },
  
    // ERROR MESSAGES
    ERROR: {
      // Auth errors
      EMAIL_ALREADY_IN_USE: 'Email already in use',
      EMAIL_NOT_VERIFIED: 'Email not verified. Please check your email and verify your account.',
      EMAIL_ALREADY_VERIFIED: 'Email already verified',
      INVALID_CREDENTIALS: 'Invalid email or password',
      INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired token',
      USER_NOT_FOUND: 'User not found',
      INVALID_CURRENT_PASSWORD: 'Invalid current password',
      NOT_AUTHORIZED_NO_TOKEN: 'Not authorized, no token',
      NOT_AUTHORIZED_TOKEN_FAILED: 'Not authorized, token failed',
      
      // Resource errors
      JOB_NOT_FOUND: 'Job not found',
      TASK_NOT_FOUND: 'Task not found',
      RESOURCE_NOT_FOUND: 'Resource not found',
      
      // General errors
      SOMETHING_WENT_WRONG: 'Something went wrong!',
      UNAUTHORIZED_ACCESS: 'Unauthorized access',
      FORBIDDEN_ACCESS: 'Forbidden access',
      RESOURCE_ALREADY_EXISTS: 'Resource already exists',
      INVALID_DATA_PROVIDED: 'Invalid data provided'
    },
  
    // VALIDATION MESSAGES
    VALIDATION: {
      // Field requirements
      FIRST_NAME_REQUIRED: 'First name is required',
      LAST_NAME_EMPTY: 'Last name cannot be empty',
      EMAIL_REQUIRED: 'Email is required',
      PASSWORD_REQUIRED: 'Password is required',
      CURRENT_PASSWORD_REQUIRED: 'Current password is required',
      NEW_PASSWORD_REQUIRED: 'New password is required',
      
      // Job validation
      POSITION_REQUIRED: 'Position is required',
      COMPANY_REQUIRED: 'Company is required',
      STATUS_REQUIRED: 'Status is required',
      TITLE_REQUIRED: 'Title is required',
      DUE_DATE_TIME_REQUIRED: 'Due date and time is required',
      TASK_TYPE_REQUIRED: 'Task type is required',
      JOB_ID_REQUIRED: 'Job ID is required',
      
      // Format validation
      INVALID_EMAIL_FORMAT: 'Invalid email format',
      INVALID_DATE_FORMAT: 'Invalid date format',
      INVALID_DUE_DATE_FORMAT: 'Invalid date format for due date',
      INVALID_ID_FORMAT: 'Invalid ID format',
      INVALID_JOB_ID_FORMAT: 'Invalid job ID format',
      
      // Length validation
      PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
      NEW_PASSWORD_TOO_SHORT: 'New password must be at least 6 characters long',
      
      // Enum validation
      INVALID_STATUS: 'Status must be one of: applied, interviewing, offer, rejected',
      INVALID_TASK_TYPE: 'Task type must be one of: follow-up, interview, networking, research, other',
      
      // Array validation
      IDS_REQUIRED: 'IDs must be provided as an array',
      AT_LEAST_ONE_ID: 'At least one ID is required',
      INVALID_ID_IN_ARRAY: 'Invalid ID format in array',
      
      // General validation
      FIELD_REQUIRED: 'This field is required',
      FIELD_EMPTY: 'This field cannot be empty',
      INVALID_VALUE: 'Invalid value provided'
    }
  };
  
module.exports = { MESSAGES };