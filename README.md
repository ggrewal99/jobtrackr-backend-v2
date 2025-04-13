# JobTracker Backend

This is the backend for the **JobTracker** application, a full-stack web app designed to help users manage and track their job applications. The backend is built with Node.js and Express, and it handles user authentication, job application management, and provides an API for the frontend.

## 🚀 Features

- User authentication (JWT-based)
- CRUD operations for job applications (add, update, delete, view)
- Secure password storage (bcrypt)
- MongoDB integration for data storage
- Email services (email verification, password reset)

## 🔧 Tech Stack

**Backend:**  
- Node.js  
- Express.js  
- MongoDB (with Mongoose)  
- JWT for authentication  
- Bcrypt for password hashing  

## 🛠 Installation & Setup

### Prerequisites

Make sure you have the following installed:
- Node.js (v16+)
- npm or yarn
- MongoDB (local instance or MongoDB Atlas for cloud hosting)

### Step-by-Step Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/your-username/jobtracker-backend.git
   cd jobtracker-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_password
   FRONTEND_URL=http://localhost:3000
   ```

   Note:
   - `EMAIL_USER` and `EMAIL_PASS` are used for the email service to handle email verification and password reset functionality
   - `FRONTEND_URL` points to your frontend application for proper redirection

4. Start the server in development mode:

   ```bash
   npm run dev
   ```

The server will now be running at `http://localhost:5000`.

## 📄 API Endpoints

### Authentication
* `POST /api/auth/register` - Register a new user
* `POST /api/auth/login` - User login and JWT token generation
* `POST /api/auth/update` - Update user details
* `POST /api/auth/change-password` - Change user password
* `POST /api/auth/verify-email` - Verify user email
* `POST /api/auth/forgot-password` - Request password reset
* `POST /api/auth/reset-password` - Reset user password
* `POST /api/auth/resend-verification` - Resend verification email

### Job Applications
* `GET /api/jobs` - Get all job applications (admin only)
* `POST /api/jobs` - Add a new job application
* `PATCH /api/jobs/:id` - Update an existing job application
* `DELETE /api/jobs/:id` - Delete a job application
* `GET /api/jobs/:id` - Get a specific job application

## 🌐 Deployment

* The backend is deployed on **Render**.
* Ensure to update the `.env` file for production deployment with your production MongoDB URI, JWT secret, and email credentials.

## 🔒 Security Considerations

* All passwords are hashed using **bcrypt** before storing them in the database.
* Authentication is handled with **JWT** to provide secure and stateless login sessions.
* Email functionality uses dedicated credentials that should be kept secure.

## 💡 Testing

To test the API locally, you can use tools like Postman or Insomnia. Make sure to send the `Authorization` header with your JWT token for protected routes.
