const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JobTrackr API',
      version: '1.0.0',
      description: 'A comprehensive job tracking API for managing job applications, tasks, and analytics',
      contact: {
        name: 'Developer',
        email: 'guruvindergrewal98@gmail.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.BASE_URL,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the user',
              example: '507f1f77bcf86cd799439011'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Doe'
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Whether the user email is verified',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
              example: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        Job: {
          type: 'object',
          required: ['company', 'position', 'status'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the job',
              example: '507f1f77bcf86cd799439011'
            },
            company: {
              type: 'string',
              description: 'Company name',
              example: 'Google'
            },
            position: {
              type: 'string',
              description: 'Job position title',
              example: 'Software Engineer'
            },
            status: {
              type: 'string',
              enum: ['applied', 'interviewing', 'offer', 'rejected', 'withdrawn'],
              description: 'Current application status',
              example: 'applied'
            },
            dateApplied: {
              type: 'string',
              format: 'date',
              description: 'Date when application was submitted',
              example: '2024-01-15'
            },
            location: {
              type: 'string',
              description: 'Job location',
              example: 'San Francisco, CA'
            },
            salary: {
              type: 'number',
              description: 'Expected or offered salary',
              example: 120000
            },
            notes: {
              type: 'string',
              description: 'Additional notes about the job',
              example: 'Great company culture, remote work available'
            },
            userId: {
              type: 'string',
              description: 'ID of the user who owns this job',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Job creation timestamp',
              example: '2024-01-15T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Job last update timestamp',
              example: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        Task: {
          type: 'object',
          required: ['title', 'jobId', 'dueDate'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the task',
              example: '507f1f77bcf86cd799439011'
            },
            title: {
              type: 'string',
              description: 'Task title',
              example: 'Prepare for technical interview'
            },
            description: {
              type: 'string',
              description: 'Task description',
              example: 'Review data structures and algorithms'
            },
            jobId: {
              type: 'string',
              description: 'ID of the associated job',
              example: '507f1f77bcf86cd799439011'
            },
            dueDate: {
              type: 'string',
              format: 'date',
              description: 'Task due date',
              example: '2024-01-20'
            },
            completed: {
              type: 'boolean',
              description: 'Whether the task is completed',
              example: false
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Task priority level',
              example: 'high'
            },
            userId: {
              type: 'string',
              description: 'ID of the user who owns this task',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task creation timestamp',
              example: '2024-01-15T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task last update timestamp',
              example: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Email is required'
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'], // Path to the API files
};

const specs = swaggerJSDoc(options);

module.exports = specs;
