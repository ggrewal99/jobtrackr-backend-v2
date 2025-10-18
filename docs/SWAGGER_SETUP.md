# Swagger API Documentation Setup

## Overview

This project uses Swagger (OpenAPI 3.0) for comprehensive API documentation. The documentation is automatically generated from JSDoc comments in the route files.

## Accessing the Documentation

Once the server is running, you can access the interactive API documentation at:

**Local Development:**
```
http://localhost:5000/api-docs
```

**Production:**
```
https://your-production-url.com/api-docs
```

## Features

- **Interactive API Explorer**: Test endpoints directly from the browser
- **Authentication Support**: Built-in JWT token authentication testing
- **Request/Response Examples**: Comprehensive examples for all endpoints
- **Schema Validation**: Detailed request and response schemas
- **Error Documentation**: Complete error response documentation

## API Endpoints Documented

### Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login user
- `PUT /update` - Update user profile
- `PUT /change-password` - Change user password
- `GET /verify-email` - Verify email address
- `POST /resend-verification` - Resend verification email
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password

### Jobs (`/api/jobs`)
- `GET /` - Get all jobs for authenticated user
- `POST /` - Create a new job application
- `GET /{id}` - Get a specific job by ID
- `PATCH /{id}` - Update a job application
- `DELETE /{id}` - Delete a job application
- `POST /delete-multiple-jobs` - Delete multiple jobs

### Tasks (`/api/tasks`)
- `GET /` - Get all tasks for authenticated user
- `POST /` - Create a new task
- `GET /{id}` - Get a specific task by ID
- `PATCH /{id}` - Update a task
- `DELETE /{id}` - Delete a task
- `POST /delete-multiple-tasks` - Delete multiple tasks

## Authentication

Most endpoints require JWT authentication. To test protected endpoints:

1. First, register a new user or login using the `/api/auth/register` or `/api/auth/login` endpoints
2. Copy the JWT token from the response
3. Click the "Authorize" button in the Swagger UI
4. Enter the token in the format: `Bearer your-jwt-token-here`
5. Click "Authorize" to authenticate

## Testing Endpoints

The Swagger UI allows you to:
- View all available endpoints organized by category
- See detailed request/response schemas
- Test endpoints directly with sample data
- View example requests and responses
- Test authentication flows

## Configuration

The Swagger configuration is located in `config/swagger.js` and includes:
- API metadata (title, version, description)
- Server configurations for different environments
- Reusable schemas for requests and responses
- Security definitions for JWT authentication

## Adding New Endpoints

To document new endpoints:

1. Add JSDoc comments above your route definitions
2. Use the `@swagger` tag to define the endpoint
3. Include request/response schemas
4. Add example data
5. Document error responses

Example:
```javascript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Example endpoint
 *     description: This is an example endpoint
 *     tags: [Example]
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExampleResponse'
 */
```

## Dependencies

- `swagger-jsdoc`: Generates OpenAPI specification from JSDoc comments
- `swagger-ui-express`: Serves the Swagger UI interface

## Customization

The Swagger UI can be customized by modifying the options in `index.js`:
- Custom CSS styling
- Site title
- Explorer settings
- Additional configuration options
