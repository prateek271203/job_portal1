const express = require('express');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');
const { protect, authorize } = require('../middleware/auth');
const config = require('../config/config');

const router = express.Router();

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    console.log('🔐 Login attempt received:', { email: req.body.email, timestamp: new Date().toISOString() });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('📧 Looking for admin with email:', email);

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ Admin found:', { id: admin._id, role: admin.role, isActive: admin.isActive });

    if (!admin.isActive) {
      console.log('❌ Admin account is deactivated');
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Check password
    console.log('🔑 Checking password...');
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      console.log('❌ Password mismatch for admin:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ Password verified successfully');

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id);
    console.log('🎉 Login successful for admin:', email, 'Token generated');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: token,
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          profileImage: admin.profileImage,
          fullName: admin.fullName
        }
      }
    });
  } catch (error) {
    console.error('💥 Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get admin profile
// @route   GET /api/admin/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.admin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update admin profile
// @route   PUT /api/admin/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('firstName').optional().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
  body('department').optional().isLength({ min: 2, max: 50 }).withMessage('Department must be between 2 and 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, phone, department, profileImage } = req.body;

    const admin = await Admin.findById(req.admin.id);

    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (email) admin.email = email;
    if (phone) admin.phone = phone;
    if (department) admin.department = department;
    if (profileImage) admin.profileImage = profileImage;

    const updatedAdmin = await admin.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Change admin password
// @route   PUT /api/admin/auth/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin.id).select('+password');

    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Logout admin
// @route   POST /api/admin/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get admin permissions
// @route   GET /api/admin/auth/permissions
// @access  Private
router.get('/permissions', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        permissions: req.admin.permissions,
        role: req.admin.role,
        isSuperAdmin: req.admin.role === 'super_admin'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Refresh token
// @route   POST /api/admin/auth/refresh
// @access  Private
router.post('/refresh', protect, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found or inactive'
      });
    }

    const token = generateToken(admin._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: token,
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          profileImage: admin.profileImage,
          fullName: admin.fullName
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
