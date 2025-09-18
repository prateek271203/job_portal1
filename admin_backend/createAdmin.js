const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const config = require('./config/config');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB successfully');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: config.ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Role:', existingAdmin.role);
      console.log('🔐 Permissions:', existingAdmin.permissions.join(', '));
      console.log('📅 Created:', existingAdmin.createdAt);
      process.exit(0);
    }

    // Create admin user with correct permissions
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: config.ADMIN_EMAIL,
      password: config.ADMIN_PASSWORD,
      role: 'super_admin',
      permissions: [
        'manage_users',
        'manage_jobs', 
        'manage_companies',
        'manage_applications',
        'view_analytics',
        'manage_admins',
        'manage_content',
        'manage_categories',
        'manage_faqs'
      ],
      isActive: true
    };

    const admin = await Admin.create(adminData);
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', config.ADMIN_PASSWORD);
    console.log('👤 Role:', admin.role);
    console.log('🔐 Permissions:', admin.permissions.join(', '));
    console.log('📅 Created:', admin.createdAt);
    console.log('🆔 ID:', admin._id);

    // Verify the admin was created correctly
    const verifyAdmin = await Admin.findById(admin._id).select('-password');
    if (verifyAdmin) {
      console.log('✅ Admin verification successful');
      console.log('🔍 Full name:', verifyAdmin.fullName);
      console.log('🔄 Is active:', verifyAdmin.isActive);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 11000) {
      console.error('💡 Duplicate key error - admin might already exist');
    } else if (error.name === 'ValidationError') {
      console.error('💡 Validation error - check the data format');
      console.error('Details:', error.message);
    } else if (error.name === 'MongoNetworkError') {
      console.error('💡 Network error - check MongoDB connection');
    }
    
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Process interrupted, closing MongoDB connection...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Process terminated, closing MongoDB connection...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

createAdminUser();
