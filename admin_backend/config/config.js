require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/job_portal',
  JWT_SECRET: process.env.JWT_SECRET || 'admin_super_secret_jwt_key_change_this_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@jobportal.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123456'
};
