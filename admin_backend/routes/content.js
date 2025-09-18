const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Content = require('../models/Content');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all published content (public endpoint)
// @route   GET /api/admin/content/public
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const content = await Content.find({ 
      status: 'published', 
      isActive: true,
      isPublic: true 
    })
      .select('title content type slug metaDescription tags')
      .sort({ publishDate: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get public content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

// @desc    Get published content by type (public endpoint)
// @route   GET /api/admin/content/public/type/:type
// @access  Public
router.get('/public/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    const content = await Content.findOne({ 
      type,
      status: 'published', 
      isActive: true,
      isPublic: true 
    })
      .select('title content type slug metaDescription tags')
      .lean();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get public content by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

// @desc    Get published content by ID (public endpoint)
// @route   GET /api/admin/content/public/:id
// @access  Public
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const content = await Content.findOne({ 
      _id: id,
      status: 'published', 
      isActive: true,
      isPublic: true 
    })
      .select('title content type slug metaDescription tags')
      .lean();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get public content by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

// @desc    Get content statistics
// @route   GET /api/admin/content/stats/overview
// @access  Private
router.get('/stats/overview', protect, checkPermission('manage_content'), async (req, res) => {
  try {
    const [totalContent, publishedContent, draftContent, totalViews, featuredContent] = await Promise.all([
      Content.countDocuments(),
      Content.countDocuments({ status: 'published', isActive: true }),
      Content.countDocuments({ status: 'draft' }),
      Content.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]).then(result => result[0]?.total || 0),
      Content.countDocuments({ isFeatured: true, isActive: true })
    ]);

    // Get content type distribution
    const contentTypes = await Content.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    // Get content status distribution
    const contentStatus = await Content.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    // Get monthly content creation
    const monthlyContent = await Content.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).catch(() => []);

    // Get content statistics
    const contentStats = await Content.getStats();

    res.json({
      success: true,
      data: {
        overview: {
          totalContent,
          publishedContent,
          draftContent,
          totalViews,
          featuredContent
        },
        contentTypes,
        contentStatus,
        monthlyContent,
        stats: contentStats
      }
    });
  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content statistics'
    });
  }
});

// @desc    Get all content with pagination, search, and filters
// @route   GET /api/admin/content
// @access  Private
router.get('/', protect, checkPermission('manage_content'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('type').optional().isIn(['page', 'blog', 'announcement', 'policy', 'terms', 'privacy', 'about', 'contact', 'help', 'custom']).withMessage('Invalid content type'),
  query('status').optional().isIn(['draft', 'published', 'archived', 'scheduled']).withMessage('Invalid status'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('public').optional().isBoolean().withMessage('Public must be a boolean'),
  query('sortBy').optional().isIn(['createdAt', 'title', 'type', 'status', 'publishDate', 'viewCount']).withMessage('Invalid sort field'),
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
      type = '',
      status = '',
      featured = '',
      public = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (featured !== '') filter.isFeatured = featured === 'true';
    if (public !== '') filter.isPublic = public === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get content with pagination
    const [content, total] = await Promise.all([
      Content.find(filter)
        .populate('author', 'firstName lastName')
        .populate('lastUpdatedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Content.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: content,
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
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

// @desc    Get single content by ID
// @route   GET /api/admin/content/:id
// @access  Private
router.get('/:id', protect, checkPermission('manage_content'), async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('author', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

// @desc    Create new content
// @route   POST /api/admin/content
// @access  Private
router.post('/', protect, checkPermission('manage_content'), [
  body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('type').isIn(['page', 'blog', 'announcement', 'policy', 'terms', 'privacy', 'about', 'contact', 'help', 'custom']).withMessage('Invalid content type'),
  body('content').isLength({ min: 50, max: 10000 }).withMessage('Content must be between 50 and 10000 characters'),
  body('excerpt').optional().isLength({ max: 300 }).withMessage('Excerpt cannot exceed 300 characters'),
  body('featuredImage').optional().isString().withMessage('Featured image must be a string'),
  body('status').optional().isIn(['draft', 'published', 'archived', 'scheduled']).withMessage('Invalid status'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('publishDate').optional().isISO8601().withMessage('Invalid publish date'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
  body('metaTitle').optional().isLength({ max: 60 }).withMessage('Meta title cannot exceed 60 characters'),
  body('metaDescription').optional().isLength({ max: 160 }).withMessage('Meta description cannot exceed 160 characters'),
  body('keywords').optional().isArray().withMessage('Keywords must be an array'),
  body('template').optional().isString().withMessage('Template must be a string'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer')
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

    // Check if content with same title already exists
    const existingContent = await Content.findOne({ 
      title: { $regex: new RegExp(`^${req.body.title}$`, 'i') }
    });
    
    if (existingContent) {
      return res.status(400).json({
        success: false,
        message: 'Content with this title already exists'
      });
    }

    // Create content
    const content = await Content.create({
      ...req.body,
      author: req.admin.id
    });

    // Populate references
    const populatedContent = await Content.findById(content._id)
      .populate('author', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: populatedContent
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create content'
    });
  }
});

// @desc    Update content
// @route   PUT /api/admin/content/:id
// @access  Private
router.put('/:id', protect, checkPermission('manage_content'), [
  body('title').optional().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('type').optional().isIn(['page', 'blog', 'announcement', 'policy', 'terms', 'privacy', 'about', 'contact', 'help', 'custom']).withMessage('Invalid content type'),
  body('content').optional().isLength({ min: 50, max: 10000 }).withMessage('Content must be between 50 and 10000 characters'),
  body('excerpt').optional().isLength({ max: 300 }).withMessage('Excerpt cannot exceed 300 characters'),
  body('featuredImage').optional().isString().withMessage('Featured image must be a string'),
  body('status').optional().isIn(['draft', 'published', 'archived', 'scheduled']).withMessage('Invalid status'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('publishDate').optional().isISO8601().withMessage('Invalid publish date'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
  body('metaTitle').optional().isLength({ max: 60 }).withMessage('Meta title cannot exceed 60 characters'),
  body('metaDescription').optional().isLength({ max: 160 }).withMessage('Meta description cannot exceed 160 characters'),
  body('keywords').optional().isArray().withMessage('Keywords must be an array'),
  body('template').optional().isString().withMessage('Template must be a string'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer')
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

    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Check if title is being changed and if it already exists
    if (req.body.title && req.body.title !== content.title) {
      const existingContent = await Content.findOne({ 
        title: { $regex: new RegExp(`^${req.body.title}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingContent) {
        return res.status(400).json({
          success: false,
          message: 'Content with this title already exists'
        });
      }
    }

    // Update content fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'author') { // Don't allow changing author
        content[key] = req.body[key];
      }
    });

    // Set lastUpdatedBy
    content.lastUpdatedBy = req.admin.id;

    const updatedContent = await content.save();

    // Populate references
    const populatedContent = await Content.findById(updatedContent._id)
      .populate('author', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: populatedContent
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update content'
    });
  }
});

// @desc    Delete content
// @route   DELETE /api/admin/content/:id
// @access  Private
router.delete('/:id', protect, checkPermission('manage_content'), async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await Content.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete content'
    });
  }
});

// @desc    Bulk update content
// @route   PUT /api/admin/content/bulk/update
// @access  Private
router.put('/bulk/update', protect, checkPermission('manage_content'), [
  body('contentIds').isArray({ min: 1 }).withMessage('Content IDs must be an array with at least one ID'),
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

    const { contentIds, updates } = req.body;

    // Validate updates object
    const allowedFields = ['status', 'isActive', 'isFeatured', 'isPublic', 'sortOrder'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      });
    }

    // Update content
    const result = await Content.updateMany(
      { _id: { $in: contentIds } },
      { 
        $set: updates,
        lastUpdatedBy: req.admin.id
      }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} content items successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update content'
    });
  }
});

// @desc    Publish content
// @route   PATCH /api/admin/content/:id/publish
// @access  Private
router.patch('/:id/publish', protect, checkPermission('manage_content'), async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await content.publish();
    content.lastUpdatedBy = req.admin.id;
    await content.save();

    res.json({
      success: true,
      message: 'Content published successfully',
      data: {
        id: content._id,
        status: content.status,
        publishDate: content.publishDate
      }
    });
  } catch (error) {
    console.error('Publish content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish content'
    });
  }
});

// @desc    Archive content
// @route   PATCH /api/admin/content/:id/archive
// @access  Private
router.patch('/:id/archive', protect, checkPermission('manage_content'), async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await content.archive();
    content.lastUpdatedBy = req.admin.id;
    await content.save();

    res.json({
      success: true,
      message: 'Content archived successfully',
      data: {
        id: content._id,
        status: content.status
      }
    });
  } catch (error) {
    console.error('Archive content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive content'
    });
  }
});

// @desc    Get content by type
// @route   GET /api/admin/content/type/:type
// @access  Private
router.get('/type/:type', protect, checkPermission('manage_content'), async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 20 } = req.query;

    const content = await Content.getByType(type, parseInt(limit));

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content by type'
    });
  }
});

// @desc    Get featured content
// @route   GET /api/admin/content/featured/list
// @access  Private
router.get('/featured/list', protect, checkPermission('manage_content'), async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const content = await Content.getFeatured(parseInt(limit));

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get featured content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured content'
    });
  }
});

module.exports = router;
