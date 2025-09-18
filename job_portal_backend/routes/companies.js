const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Company = require('../models/Company');
const Job = require('../models/Job');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all companies with filters
// @route   GET /api/companies
// @access  Public
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().trim(),
  query('industry').optional().trim(),
  query('size').optional().trim(),
  query('location').optional().trim(),
  query('verified').optional().isBoolean()
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
      search,
      industry,
      size,
      location,
      verified
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }

    if (industry) {
      filter.industry = industry;
    }

    if (size) {
      filter.size = size;
    }

    if (location) {
      filter['location.city'] = { $regex: location, $options: 'i' };
    }

    if (verified === 'true') {
      filter.isVerified = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const companies = await Company.find(filter)
      .populate('owner', 'firstName lastName email')
      .sort({ totalJobs: -1, rating: { average: -1 } })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Company.countDocuments(filter);

    res.json({
      success: true,
      data: companies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCompanies: total,
        hasNextPage: skip + companies.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('employees', 'firstName lastName email role');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (!company.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Company is no longer active'
      });
    }

    // Get company's active jobs
    const jobs = await Job.find({ 
      company: req.params.id, 
      isActive: true 
    })
    .select('title category jobType location salary applicationDeadline')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        ...company.toObject(),
        recentJobs: jobs
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new company
// @route   POST /api/companies
// @access  Private (Employers only)
router.post('/', protect, authorize('employer', 'admin'), [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters'),
  body('description').isLength({ min: 50 }).withMessage('Company description must be at least 50 characters'),
  body('industry').isIn(['Commerce', 'Telecommunications', 'Hotels & Tourism', 'Education', 'Financial Services', 'Media', 'Construction', 'Technology', 'Healthcare', 'Marketing', 'Other']).withMessage('Invalid industry'),
  body('size').isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).withMessage('Invalid company size'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.country').trim().notEmpty().withMessage('Country is required'),
  body('contact.email').isEmail().normalizeEmail().withMessage('Valid contact email is required'),
  body('website').optional().isURL().withMessage('Valid website URL is required')
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

    // Check if company name already exists
    const existingCompany = await Company.findOne({ 
      name: { $regex: new RegExp(req.body.name, 'i') }
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'A company with this name already exists'
      });
    }

    const company = await Company.create({
      ...req.body,
      owner: req.user._id
    });

    const populatedCompany = await Company.findById(company._id)
      .populate('owner', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: populatedCompany
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (Company owner or admin)
router.put('/:id', protect, authorize('employer', 'admin'), [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ min: 50 }),
  body('industry').optional().isIn(['Commerce', 'Telecommunications', 'Hotels & Tourism', 'Education', 'Financial Services', 'Media', 'Construction', 'Technology', 'Healthcare', 'Marketing', 'Other']),
  body('size').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
  body('website').optional().isURL(),
  body('contact.email').optional().isEmail().normalizeEmail()
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

    // Check if user owns the company or is admin
    if (company.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this company'
      });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (Company owner or admin)
router.delete('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if user owns the company or is admin
    if (company.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this company'
      });
    }

    // Check if company has active jobs
    const activeJobs = await Job.countDocuments({ 
      company: req.params.id, 
      isActive: true 
    });

    if (activeJobs > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete company with active jobs. Please deactivate all jobs first.'
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
      message: 'Server error'
    });
  }
});

// @desc    Get user's companies
// @route   GET /api/companies/my-companies
// @access  Private
router.get('/my-companies', protect, async (req, res) => {
  try {
    const companies = await Company.find({ owner: req.user._id })
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Get my companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get top companies
// @route   GET /api/companies/top
// @access  Public
router.get('/top', async (req, res) => {
  try {
    const topCompanies = await Company.find({ isActive: true })
      .populate('owner', 'firstName lastName')
      .sort({ totalJobs: -1, rating: { average: -1 } })
      .limit(6)
      .lean();

    res.json({
      success: true,
      data: topCompanies
    });
  } catch (error) {
    console.error('Get top companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Rate a company
// @route   POST /api/companies/:id/rate
// @access  Private
router.post('/:id/rate', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Review must be between 10 and 500 characters')
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

    const { rating, review } = req.body;

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if user has already rated this company
    const existingRating = company.ratings?.find(r => r.user.toString() === req.user._id.toString());
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this company'
      });
    }

    // Add rating
    if (!company.ratings) company.ratings = [];
    company.ratings.push({
      user: req.user._id,
      rating,
      review,
      date: new Date()
    });

    // Update average rating
    const totalRating = company.ratings.reduce((sum, r) => sum + r.rating, 0);
    company.rating.average = totalRating / company.ratings.length;
    company.rating.count = company.ratings.length;

    await company.save();

    res.json({
      success: true,
      message: 'Company rated successfully',
      data: {
        averageRating: company.rating.average,
        totalRatings: company.rating.count
      }
    });
  } catch (error) {
    console.error('Rate company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
