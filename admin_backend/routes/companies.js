const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Company = require('../models/Company');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get company statistics
// @route   GET /api/admin/companies/stats/overview
// @access  Private
router.get('/stats/overview', protect, checkPermission('manage_companies'), async (req, res) => {
  try {
    const [totalCompanies, activeCompanies, verifiedCompanies, featuredCompanies, pendingCompanies] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true, status: 'active' }),
      Company.countDocuments({ isVerified: true }),
      Company.countDocuments({ isFeatured: true }),
      Company.countDocuments({ status: 'pending' })
    ]);

    // Get monthly company registrations
    const monthlyRegistrations = await Company.getMonthlyRegistrations(6);

    // Get company industry distribution
    const companyIndustries = await Company.getIndustryStats();

    // Get company size distribution
    const companySizes = await Company.aggregate([
      { $group: { _id: '$companySize', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    // Get company type distribution
    const companyTypes = await Company.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    res.json({
      success: true,
      data: {
        overview: {
          totalCompanies,
          activeCompanies,
          verifiedCompanies,
          featuredCompanies,
          pendingCompanies
        },
        monthlyRegistrations,
        companyIndustries,
        companySizes,
        companyTypes
      }
    });
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company statistics'
    });
  }
});

// @desc    Get all companies with pagination, search, and filters
// @route   GET /api/admin/companies
// @access  Private
router.get('/', protect, checkPermission('manage_companies'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('industry').optional().isString().withMessage('Industry must be a string'),
  query('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']).withMessage('Invalid status'),
  query('verified').optional().isBoolean().withMessage('Verified must be a boolean'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('sortBy').optional().isIn(['createdAt', 'name', 'industry', 'status']).withMessage('Invalid sort field'),
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
      industry = '',
      status = '',
      verified = '',
      featured = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (industry) filter.industry = industry;
    if (status) filter.status = status;
    if (verified !== '') filter.isVerified = verified === 'true';
    if (featured !== '') filter.isFeatured = featured === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get companies with pagination
    const [companies, total] = await Promise.all([
      Company.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Company.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: companies,
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
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies'
    });
  }
});

// @desc    Get single company by ID
// @route   GET /api/admin/companies/:id
// @access  Private
router.get('/:id', protect, checkPermission('manage_companies'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company'
    });
  }
});

// @desc    Create new company
// @route   POST /api/admin/companies
// @access  Private
router.post('/', protect, checkPermission('manage_companies'), [
  body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').isLength({ min: 50, max: 2000 }).withMessage('Description must be between 50 and 2000 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('industry').notEmpty().withMessage('Industry is required'),
  body('website').optional().isURL().withMessage('Please enter a valid website URL'),
  body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
  body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).withMessage('Invalid company size'),
  body('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
  body('type').optional().isIn(['Public', 'Private', 'Non-profit', 'Government']).withMessage('Invalid company type')
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

    // Check if company already exists
    const existingCompany = await Company.findOne({ 
      $or: [
        { name: req.body.name },
        { email: req.body.email }
      ]
    });
    
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name or email already exists'
      });
    }

    // Create company
    const company = await Company.create({
      ...req.body,
      isVerified: true, // Admin created companies are verified by default
      status: 'active',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company'
    });
  }
});

// @desc    Update company
// @route   PUT /api/admin/companies/:id
// @access  Private
router.put('/:id', protect, checkPermission('manage_companies'), [
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').optional().isLength({ min: 50, max: 2000 }).withMessage('Description must be between 50 and 2000 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('industry').optional().notEmpty().withMessage('Industry cannot be empty'),
  body('website').optional().isURL().withMessage('Please enter a valid website URL'),
  body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
  body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).withMessage('Invalid company size'),
  body('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
  body('type').optional().isIn(['Public', 'Private', 'Non-profit', 'Government']).withMessage('Invalid company type'),
  body('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']).withMessage('Invalid status'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean')
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

    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if name or email is being changed and if it already exists
    if (req.body.name && req.body.name !== company.name) {
      const existingCompany = await Company.findOne({ 
        name: req.body.name,
        _id: { $ne: req.params.id }
      });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company with this name already exists'
        });
      }
    }

    if (req.body.email && req.body.email !== company.email) {
      const existingCompany = await Company.findOne({ 
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company with this email already exists'
        });
      }
    }

    // Update company fields
    Object.keys(req.body).forEach(key => {
      company[key] = req.body[key];
    });

    const updatedCompany = await company.save();

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company'
    });
  }
});

// @desc    Delete company
// @route   DELETE /api/admin/companies/:id
// @access  Private
router.delete('/:id', protect, checkPermission('manage_companies'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    await Company.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company'
    });
  }
});

// @desc    Bulk update companies
// @route   PUT /api/admin/companies/bulk/update
// @access  Private
router.put('/bulk/update', protect, checkPermission('manage_companies'), [
  body('companyIds').isArray({ min: 1 }).withMessage('Company IDs must be an array with at least one ID'),
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

    const { companyIds, updates } = req.body;

    // Validate updates object
    const allowedFields = ['status', 'isActive', 'isVerified', 'isFeatured'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      });
    }

    // Update companies
    const result = await Company.updateMany(
      { _id: { $in: companyIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} companies successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update companies'
    });
  }
});

// @desc    Toggle company verification
// @route   PATCH /api/admin/companies/:id/toggle-verification
// @access  Private
router.patch('/:id/toggle-verification', protect, checkPermission('manage_companies'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    company.isVerified = !company.isVerified;
    await company.save();

    res.json({
      success: true,
      message: `Company ${company.isVerified ? 'verified' : 'unverified'} successfully`,
      data: {
        id: company._id,
        isVerified: company.isVerified
      }
    });
  } catch (error) {
    console.error('Toggle company verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle company verification'
    });
  }
});

module.exports = router;
