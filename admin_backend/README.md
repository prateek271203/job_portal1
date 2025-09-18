# Admin Backend - Job Portal

A robust and secure backend API for the Job Portal admin dashboard.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with role-based access control
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation using express-validator
- **Error Handling**: Centralized error handling with detailed logging
- **Security**: Helmet.js for security headers, CORS protection
- **Performance**: Compression, optimized database queries
- **Monitoring**: Health check endpoints and request logging

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd admin_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp config/env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod
   
   # Create admin user
   npm run create-admin
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/job_portal` |
| `JWT_SECRET` | JWT signing secret | `admin_super_secret_jwt_key_change_this_in_production` |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |
| `ADMIN_EMAIL` | Default admin email | `admin@jobportal.com` |
| `ADMIN_PASSWORD` | Default admin password | `admin123456` |

### Database Models

- **Admin**: Admin users with role-based permissions
- **User**: Job seekers and employers
- **Job**: Job postings
- **Company**: Company information
- **Application**: Job applications
- **Category**: Job categories
- **FAQ**: Frequently asked questions
- **Content**: Dynamic content management

## 🔐 Authentication

### Admin Roles

- **super_admin**: Full access to all features
- **admin**: Standard administrative access
- **moderator**: Limited administrative access

### Permissions

- `manage_users`: User management
- `manage_jobs`: Job posting management
- `manage_companies`: Company management
- `manage_applications`: Application management
- `view_analytics`: Dashboard analytics
- `manage_admins`: Admin user management
- `manage_content`: Content management
- `manage_categories`: Category management
- `manage_faqs`: FAQ management

## 📡 API Endpoints

### Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/auth/profile` - Get admin profile
- `PUT /api/admin/auth/profile` - Update admin profile
- `PUT /api/admin/auth/change-password` - Change password

### Dashboard
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/charts` - Chart data

### Management
- `GET/POST/PUT/DELETE /api/admin/users` - User management
- `GET/POST/PUT/DELETE /api/admin/jobs` - Job management
- `GET/POST/PUT/DELETE /api/admin/companies` - Company management
- `GET/POST/PUT/DELETE /api/admin/categories` - Category management
- `GET/POST/PUT/DELETE /api/admin/faqs` - FAQ management
- `GET/POST/PUT/DELETE /api/admin/content` - Content management

## 🚨 Security Features

- **Rate Limiting**: Prevents brute force attacks
- **JWT Validation**: Secure token-based authentication
- **Input Sanitization**: Protection against injection attacks
- **CORS Protection**: Controlled cross-origin access
- **Security Headers**: Helmet.js for security headers
- **Password Hashing**: Bcrypt with configurable salt rounds

## 📊 Monitoring

### Health Check
```bash
GET /health
```

### Test Endpoint
```bash
GET /test
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **JWT Token Issues**
   - Check JWT_SECRET in `.env`
   - Verify token expiration
   - Ensure proper Authorization header format

3. **CORS Errors**
   - Verify FRONTEND_URL in `.env`
   - Check allowed origins in server configuration
   - Ensure proper CORS headers

4. **Rate Limiting**
   - Check rate limit configuration
   - Verify IP address detection
   - Check for proxy configuration

### Logs

The server provides detailed logging for:
- Request/response details
- Authentication attempts
- Database operations
- Error details
- Performance metrics

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT_SECRET
- [ ] Configure MongoDB with authentication
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Use HTTPS
- [ ] Configure reverse proxy (nginx)

### Docker (Optional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run create-admin` - Create default admin user

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the logs for error details
