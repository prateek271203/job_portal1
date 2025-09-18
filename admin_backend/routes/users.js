const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { protect, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user statistics
// @route   GET /api/admin/users/stats/overview
// @access  Private
router.get('/stats/overview', protect, checkPermission('manage_users'), async (req, res) => {
  try {
    const [totalUsers, activeUsers, verifiedUsers, premiumUsers, employerUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ role: 'premium' }),
      User.countDocuments({ role: 'employer' })
    ]);

    // Get monthly registrations
    const monthlyRegistrations = await User.getMonthlyRegistrations(6);

    // Get user roles distribution
    const userRoles = await User.getStats();

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          verifiedUsers,
          premiumUsers,
          employerUsers
        },
        monthlyRegistrations,
        userRoles
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});

// @desc    Get all users with pagination, search, and filters
// @route   GET /api/admin/users
// @access  Private
router.get('/', protect, checkPermission('manage_users'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('role').optional().isIn(['user', 'premium', 'employer', 'admin']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('verified').optional().isBoolean().withMessage('Verified must be a boolean'),
  query('sortBy').optional().isIn(['createdAt', 'firstName', 'lastName', 'email', 'role']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
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

    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      verified = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) filter.role = role;
    if (status) filter.isActive = status === 'active';
    if (verified !== '') filter.isVerified = verified === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private
router.get('/:id', protect, checkPermission('manage_users'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private
router.post('/', protect, checkPermission('manage_users'), [
  body('firstName').isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['user', 'premium', 'employer', 'admin']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
  body('address').optional().isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters'),
  body('city').optional().isLength({ max: 50 }).withMessage('City cannot exceed 50 characters'),
  body('state').optional().isLength({ max: 50 }).withMessage('State cannot exceed 50 characters'),
  body('country').optional().isLength({ max: 50 }).withMessage('Country cannot exceed 50 characters'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('experience').optional().isIn(['Entry Level', 'Mid Level', 'Senior Level', 'Executive']).withMessage('Invalid experience level'),
  body('education').optional().isIn(['High School', 'Associate', 'Bachelor', 'Master', 'PhD']).withMessage('Invalid education level')
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

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      address,
      city,
      state,
      country,
      bio,
      skills,
      experience,
      education
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      address,
      city,
      state,
      country,
      bio,
      skills,
      experience,
      education,
      isVerified: true // Admin created users are verified by default
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private
router.put('/:id', protect, checkPermission('manage_users'), [
  body('firstName').optional().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('role').optional().isIn(['user', 'premium', 'employer', 'admin']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
  body('address').optional().isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters'),
  body('city').optional().isLength({ max: 50 }).withMessage('City cannot exceed 50 characters'),
  body('state').optional().isLength({ max: 50 }).withMessage('State cannot exceed 50 characters'),
  body('country').optional().isLength({ max: 50 }).withMessage('Country cannot exceed 50 characters'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('experience').optional().isIn(['Entry Level', 'Mid Level', 'Senior Level', 'Executive']).withMessage('Invalid experience level'),
  body('education').optional().isIn(['High School', 'Associate', 'Bachelor', 'Master', 'PhD']).withMessage('Invalid education level'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean')
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

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Update user fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'password') { // Don't allow password update through this route
        user[key] = req.body[key];
      }
    });

    const updatedUser = await user.save();

    // Remove password from response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private
router.delete('/:id', protect, checkPermission('manage_users'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is an admin (prevent deleting admin users)
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// @desc    Bulk update users
// @route   PUT /api/admin/users/bulk/update
// @access  Private
router.put('/bulk/update', protect, checkPermission('manage_users'), [
  body('userIds').isArray({ min: 1 }).withMessage('User IDs must be an array with at least one ID'),
  body('updates').isObject().withMessage('Updates must be an object')
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

    const { userIds, updates } = req.body;

    // Validate updates object
    const allowedFields = ['isActive', 'isVerified', 'role', 'status'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      });
    }

    // Update users
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} users successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update users'
    });
  }
});

module.exports = router;
