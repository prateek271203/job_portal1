const express = require('express');
const { body, validationResult, query } = require('express-validator');
const FAQ = require('../models/FAQ');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all active FAQs (public endpoint)
// @route   GET /api/admin/faqs/public
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true })
      .select('question answer category tags sortOrder')
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    console.error('Get public FAQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs'
    });
  }
});

// @desc    Get FAQ statistics
// @route   GET /api/admin/faqs/stats/overview
// @access  Private
router.get('/stats/overview', protect, checkPermission('manage_faqs'), async (req, res) => {
  try {
    const [totalFAQs, activeFAQs, featuredFAQs, totalViews, totalFeedback] = await Promise.all([
      FAQ.countDocuments(),
      FAQ.countDocuments({ isActive: true }),
      FAQ.countDocuments({ isFeatured: true }),
      FAQ.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]).then(result => result[0]?.total || 0),
      FAQ.aggregate([{ $group: { _id: null, total: { $sum: { $add: ['$helpfulCount', '$notHelpfulCount'] } } } }]).then(result => result[0]?.total || 0)
    ]);

    // Get FAQ category distribution
    const faqCategories = await FAQ.getCategoryStats();

    // Get popular FAQs
    const popularFAQs = await FAQ.getPopular(10);

    // Get FAQ statistics
    const faqStats = await FAQ.getStats();

    res.json({
      success: true,
      data: {
        overview: {
          totalFAQs,
          activeFAQs,
          featuredFAQs,
          totalViews,
          totalFeedback
        },
        faqCategories,
        popularFAQs,
        stats: faqStats
      }
    });
  } catch (error) {
    console.error('Get FAQ stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ statistics'
    });
  }
});

// @desc    Get all FAQs with pagination, search, and filters
// @route   GET /api/admin/faqs
// @access  Private
router.get('/', protect, checkPermission('manage_faqs'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('category').optional().isIn(['General', 'Job Search', 'Applications', 'Company', 'Technical', 'Payment', 'Account', 'Other']).withMessage('Invalid category'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('sortBy').optional().isIn(['createdAt', 'question', 'category', 'sortOrder', 'viewCount']).withMessage('Invalid sort field'),
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
      category = '',
      status = '',
      featured = '',
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (category) filter.category = category;
    if (status) filter.isActive = status === 'active';
    if (featured !== '') filter.isFeatured = featured === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get FAQs with pagination
    const [faqs, total] = await Promise.all([
      FAQ.find(filter)
        .populate('createdBy', 'firstName lastName')
        .populate('lastUpdatedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FAQ.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: faqs,
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
    console.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs'
    });
  }
});

// @desc    Get single FAQ by ID
// @route   GET /api/admin/faqs/:id
// @access  Private
router.get('/:id', protect, checkPermission('manage_faqs'), async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error('Get FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ'
    });
  }
});

// @desc    Create new FAQ
// @route   POST /api/admin/faqs
// @access  Private
router.post('/', protect, checkPermission('manage_faqs'), [
  body('question').isLength({ min: 10, max: 200 }).withMessage('Question must be between 10 and 200 characters'),
  body('answer').isLength({ min: 20, max: 2000 }).withMessage('Answer must be between 20 and 2000 characters'),
  body('category').isIn(['General', 'Job Search', 'Applications', 'Company', 'Technical', 'Payment', 'Account', 'Other']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('seoTitle').optional().isLength({ max: 60 }).withMessage('SEO title cannot exceed 60 characters'),
  body('metaDescription').optional().isLength({ max: 160 }).withMessage('Meta description cannot exceed 160 characters'),
  body('keywords').optional().isArray().withMessage('Keywords must be an array')
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

    // Create FAQ
    const faq = await FAQ.create({
      ...req.body,
      createdBy: req.admin.id
    });

    // Populate references
    const populatedFAQ = await FAQ.findById(faq._id)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: populatedFAQ
    });
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create FAQ'
    });
  }
});

// @desc    Update FAQ
// @route   PUT /api/admin/faqs/:id
// @access  Private
router.put('/:id', protect, checkPermission('manage_faqs'), [
  body('question').optional().isLength({ min: 10, max: 200 }).withMessage('Question must be between 10 and 200 characters'),
  body('answer').optional().isLength({ min: 20, max: 2000 }).withMessage('Answer must be between 20 and 2000 characters'),
  body('category').optional().isIn(['General', 'Job Search', 'Applications', 'Company', 'Technical', 'Payment', 'Account', 'Other']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('seoTitle').optional().isLength({ max: 60 }).withMessage('SEO title cannot exceed 60 characters'),
  body('metaDescription').optional().isLength({ max: 160 }).withMessage('Meta description cannot exceed 160 characters'),
  body('keywords').optional().isArray().withMessage('Keywords must be an array')
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

    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Update FAQ fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'createdBy') { // Don't allow changing createdBy
        faq[key] = req.body[key];
      }
    });

    // Set lastUpdatedBy
    faq.lastUpdatedBy = req.admin.id;

    const updatedFAQ = await faq.save();

    // Populate references
    const populatedFAQ = await FAQ.findById(updatedFAQ._id)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: populatedFAQ
    });
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ'
    });
  }
});

// @desc    Delete FAQ
// @route   DELETE /api/admin/faqs/:id
// @access  Private
router.delete('/:id', protect, checkPermission('manage_faqs'), async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    await FAQ.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ'
    });
  }
});

// @desc    Bulk update FAQs
// @route   PUT /api/admin/faqs/bulk/update
// @access  Private
router.put('/bulk/update', protect, checkPermission('manage_faqs'), [
  body('faqIds').isArray({ min: 1 }).withMessage('FAQ IDs must be an array with at least one ID'),
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

    const { faqIds, updates } = req.body;

    // Validate updates object
    const allowedFields = ['isActive', 'isFeatured', 'sortOrder', 'category'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      });
    }

    // Update FAQs
    const result = await FAQ.updateMany(
      { _id: { $in: faqIds } },
      { 
        $set: updates,
        lastUpdatedBy: req.admin.id
      }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} FAQs successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update FAQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update FAQs'
    });
  }
});

// @desc    Toggle FAQ status
// @route   PATCH /api/admin/faqs/:id/toggle-status
// @access  Private
router.patch('/:id/toggle-status', protect, checkPermission('manage_faqs'), async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    faq.isActive = !faq.isActive;
    faq.lastUpdatedBy = req.admin.id;
    await faq.save();

    res.json({
      success: true,
      message: `FAQ ${faq.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: faq._id,
        isActive: faq.isActive
      }
    });
  } catch (error) {
    console.error('Toggle FAQ status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle FAQ status'
    });
  }
});

// @desc    Toggle FAQ featured status
// @route   PATCH /api/admin/faqs/:id/toggle-featured
// @access  Private
router.patch('/:id/toggle-featured', protect, checkPermission('manage_faqs'), async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    faq.isFeatured = !faq.isFeatured;
    faq.lastUpdatedBy = req.admin.id;
    await faq.save();

    res.json({
      success: true,
      message: `FAQ ${faq.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: {
        id: faq._id,
        isFeatured: faq.isFeatured
      }
    });
  } catch (error) {
    console.error('Toggle FAQ featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle FAQ featured status'
    });
  }
});

// @desc    Get FAQs by category
// @route   GET /api/admin/faqs/category/:category
// @access  Private
router.get('/category/:category', protect, checkPermission('manage_faqs'), async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const faqs = await FAQ.getByCategory(category, parseInt(limit));

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    console.error('Get FAQs by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs by category'
    });
  }
});

module.exports = router;
