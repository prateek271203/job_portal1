# Job Portal Backend API

A comprehensive backend API for a job portal with JWT authentication, job management, and application tracking.

## Features

- 🔐 JWT Authentication & Authorization
- 👥 User Management (Job Seekers, Employers, Admins)
- 💼 Job Posting & Management
- 🏢 Company Management
- 📝 Job Applications & Tracking
- 🔍 Advanced Search & Filtering
- 📊 Statistics & Analytics
- 📧 Contact Form Handling
- 🛡️ Security & Validation

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **compression** - Response compression

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd job_portal_backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job_portal
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Email configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# File upload configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user profile | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |
| POST | `/api/auth/logout` | Logout user | Private |

### Jobs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/jobs` | Get all jobs with filters | Public |
| GET | `/api/jobs/:id` | Get single job | Public |
| POST | `/api/jobs` | Create new job | Private (Employer) |
| PUT | `/api/jobs/:id` | Update job | Private (Owner/Admin) |
| DELETE | `/api/jobs/:id` | Delete job | Private (Owner/Admin) |
| GET | `/api/jobs/featured` | Get featured jobs | Public |
| GET | `/api/jobs/recent` | Get recent jobs | Public |

### Applications

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/applications` | Apply for job | Private (Job Seeker) |
| GET | `/api/applications/my-applications` | Get user's applications | Private |
| GET | `/api/applications/job/:jobId` | Get job applications | Private (Employer) |
| PUT | `/api/applications/:id/status` | Update application status | Private (Employer) |
| PUT | `/api/applications/:id/withdraw` | Withdraw application | Private (Owner) |
| GET | `/api/applications/stats` | Get application statistics | Private |

### Companies

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/companies` | Get all companies | Public |
| GET | `/api/companies/:id` | Get single company | Public |
| POST | `/api/companies` | Create new company | Private (Employer) |
| PUT | `/api/companies/:id` | Update company | Private (Owner/Admin) |
| DELETE | `/api/companies/:id` | Delete company | Private (Owner/Admin) |
| GET | `/api/companies/my-companies` | Get user's companies | Private |
| GET | `/api/companies/top` | Get top companies | Public |
| POST | `/api/companies/:id/rate` | Rate company | Private |

### Categories

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/categories` | Get all categories with counts | Public |
| GET | `/api/categories/:category` | Get jobs by category | Public |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Get all users | Private (Admin) |
| GET | `/api/users/:id` | Get user by ID | Private |
| PUT | `/api/users/:id` | Update user | Private (Admin) |
| DELETE | `/api/users/:id` | Delete user | Private (Admin) |
| GET | `/api/users/stats` | Get user statistics | Private (Admin) |

### Contact

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/contact` | Submit contact form | Public |

## Data Models

### User
```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: 'jobseeker' | 'employer' | 'admin',
  phone: String,
  avatar: String,
  resume: String,
  skills: [String],
  experience: 'No-experience' | 'Fresher' | 'Intermediate' | 'Expert',
  education: {
    degree: String,
    institution: String,
    year: Number
  },
  location: {
    city: String,
    state: String,
    country: String
  },
  isEmailVerified: Boolean,
  isActive: Boolean
}
```

### Job
```javascript
{
  title: String,
  company: ObjectId,
  description: String,
  requirements: [String],
  responsibilities: [String],
  category: String,
  jobType: String,
  experience: String,
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  location: {
    city: String,
    state: String,
    country: String,
    isRemote: Boolean
  },
  skills: [String],
  tags: [String],
  benefits: [String],
  applicationDeadline: Date,
  isActive: Boolean,
  isFeatured: Boolean,
  views: Number,
  applications: [ObjectId],
  postedBy: ObjectId
}
```

### Company
```javascript
{
  name: String,
  description: String,
  logo: String,
  website: String,
  industry: String,
  size: String,
  founded: Number,
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contact: {
    email: String,
    phone: String
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  benefits: [String],
  isVerified: Boolean,
  isActive: Boolean,
  owner: ObjectId,
  employees: [ObjectId],
  totalJobs: Number,
  rating: {
    average: Number,
    count: Number
  }
}
```

### Application
```javascript
{
  job: ObjectId,
  applicant: ObjectId,
  company: ObjectId,
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interviewed' | 'hired' | 'rejected',
  coverLetter: String,
  resume: String,
  expectedSalary: Number,
  availability: String,
  interviewDate: Date,
  interviewLocation: String,
  interviewNotes: String,
  rejectionReason: String,
  isWithdrawn: Boolean,
  withdrawnAt: Date,
  appliedAt: Date
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Validation errors if any
}
```

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Input validation with express-validator
- CORS protection
- Security headers with helmet
- Rate limiting
- Role-based authorization

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Environment Variables
Make sure to set up all required environment variables in your `.env` file before running the application.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
