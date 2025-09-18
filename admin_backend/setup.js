#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Admin Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'config', 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  if (fs.existsSync(envExamplePath)) {
    try {
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env file created successfully');
    } catch (error) {
      console.error('❌ Failed to create .env file:', error.message);
      process.exit(1);
    }
  } else {
    console.log('⚠️  .env.example not found, creating basic .env file...');
    
    const basicEnv = `# Admin Backend Environment Configuration
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/job_portal
JWT_SECRET=admin_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@jobportal.com
ADMIN_PASSWORD=admin123456
`;
    
    try {
      fs.writeFileSync(envPath, basicEnv);
      console.log('✅ Basic .env file created successfully');
    } catch (error) {
      console.error('❌ Failed to create .env file:', error.message);
      process.exit(1);
    }
  }
} else {
  console.log('✅ .env file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Check MongoDB connection
console.log('\n🔍 Checking MongoDB connection...');
try {
  const mongoose = require('mongoose');
  const config = require('./config/config');
  
  mongoose.connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  }).then(() => {
    console.log('✅ MongoDB connection successful');
    mongoose.connection.close();
    
    // Create admin user
    console.log('\n👤 Creating admin user...');
    try {
      execSync('npm run create-admin', { stdio: 'inherit', cwd: __dirname });
      console.log('✅ Admin user created successfully');
    } catch (error) {
      console.log('⚠️  Admin user creation failed (may already exist)');
    }
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Open http://localhost:5001/health to verify');
    console.log('3. Login with admin@jobportal.com / admin123456');
    
  }).catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n💡 Make sure MongoDB is running:');
    console.log('   - Start MongoDB service');
    console.log('   - Check connection string in .env');
    console.log('   - Verify network connectivity');
  });
  
} catch (error) {
  console.error('❌ Failed to check MongoDB:', error.message);
  console.log('\n💡 Please check your MongoDB installation and .env configuration');
}

console.log('\n📚 For more information, see README.md');
