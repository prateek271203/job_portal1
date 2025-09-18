const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Category = require('../models/Category');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get category statistics
// @route   GET /api/admin/categories/stats/overview
// @access  Private
router.get('/stats/overview', protect, checkPermission('manage_categories'), async (req, res) => {
  try {
    const [totalCategories, activeCategories, featuredCategories, parentCategories, subCategories] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Category.countDocuments({ isFeatured: true }),
      Category.countDocuments({ parentCategory: null }),
      Category.countDocuments({ parentCategory: { $ne: null } })
    ]);

    // Get category statistics
    const categoryStats = await Category.getStats();

    // Get featured categories
    const featuredCategoriesList = await Category.getFeatured(6);

    // Get category tree
    const categoryTree = await Category.getCategoryTree();

    res.json({
      success: true,
      data: {
        overview: {
          totalCategories,
          activeCategories,
          featuredCategories,
          parentCategories,
          subCategories
        },
        stats: categoryStats,
        featuredCategories: featuredCategoriesList,
        categoryTree
      }
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category statistics'
    });
  }
});

// @desc    Get all categories with pagination, search, and filters
// @route   GET /api/admin/categories
// @access  Private
router.get('/', protect, checkPermission('manage_categories'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('parent').optional().isString().withMessage('Parent must be a string'),
  query('sortBy').optional().isIn(['createdAt', 'name', 'sortOrder', 'jobCount']).withMessage('Invalid sort field'),
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
      status = '',
      featured = '',
      parent = '',
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) filter.isActive = status === 'active';
    if (featured !== '') filter.isFeatured = featured === 'true';
    if (parent === 'none') filter.parentCategory = null;
    else if (parent) filter.parentCategory = parent;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get categories with pagination
    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate('parentCategory', 'name')
        .populate('subCategories', 'name jobCount')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Category.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: categories,
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
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// @desc    Get single category by ID
// @route   GET /api/admin/categories/:id
// @access  Private
router.get('/:id', protect, checkPermission('manage_categories'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name description')
      .populate('subCategories', 'name description jobCount');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
});

// @desc    Create new category
// @route   POST /api/admin/categories
// @access  Private
router.post('/', protect, checkPermission('manage_categories'), [
  body('name').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('description').isLength({ min: 20, max: 500 }).withMessage('Description must be between 20 and 500 characters'),
  body('slug').optional().isLength({ min: 2, max: 50 }).withMessage('Slug must be between 2 and 50 characters'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('image').optional().isString().withMessage('Image must be a string'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('parentCategory').optional().isMongoId().withMessage('Parent category must be a valid MongoDB ID'),
  body('keywords').optional().isArray().withMessage('Keywords must be an array'),
  body('metaDescription').optional().isLength({ max: 160 }).withMessage('Meta description cannot exceed 160 characters'),
  body('seoTitle').optional().isLength({ max: 60 }).withMessage('SEO title cannot exceed 60 characters')
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

    // Check if category name already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') }
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Check if slug already exists
    if (req.body.slug) {
      const existingSlug = await Category.findOne({ slug: req.body.slug });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: 'Category with this slug already exists'
        });
      }
    }

    // Verify parent category exists if provided
    if (req.body.parentCategory) {
      const parentCategory = await Category.findById(req.body.parentCategory);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    // Create category
    const category = await Category.create(req.body);

    // Populate references
    const populatedCategory = await Category.findById(category._id)
      .populate('parentCategory', 'name description')
      .populate('subCategories', 'name description jobCount');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private
router.put('/:id', protect, checkPermission('manage_categories'), [
  body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('description').optional().isLength({ min: 20, max: 500 }).withMessage('Description must be between 20 and 500 characters'),
  body('slug').optional().isLength({ min: 2, max: 50 }).withMessage('Slug must be between 2 and 50 characters'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('image').optional().isString().withMessage('Image must be a string'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('parentCategory').optional().isMongoId().withMessage('Parent category must be a valid MongoDB ID'),
  body('keywords').optional().isArray().withMessage('Keywords must be an array'),
  body('metaDescription').optional().isLength({ max: 160 }).withMessage('Meta description cannot exceed 160 characters'),
  body('seoTitle').optional().isLength({ max: 60 }).withMessage('SEO title cannot exceed 60 characters')
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

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Check if slug is being changed and if it already exists
    if (req.body.slug && req.body.slug !== category.slug) {
      const existingSlug = await Category.findOne({ 
        slug: req.body.slug,
        _id: { $ne: req.params.id }
      });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: 'Category with this slug already exists'
        });
      }
    }

    // Verify parent category exists if being changed
    if (req.body.parentCategory && req.body.parentCategory !== category.parentCategory?.toString()) {
      // Prevent setting parent to itself
      if (req.body.parentCategory === req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }

      const parentCategory = await Category.findById(req.body.parentCategory);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    // Update category fields
    Object.keys(req.body).forEach(key => {
      category[key] = req.body[key];
    });

    const updatedCategory = await category.save();

    // Populate references
    const populatedCategory = await Category.findById(updatedCategory._id)
      .populate('parentCategory', 'name description')
      .populate('subCategories', 'name description jobCount');

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: populatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private
router.delete('/:id', protect, checkPermission('manage_categories'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has subcategories
    const subCategories = await Category.find({ parentCategory: req.params.id });
    if (subCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please delete subcategories first.'
      });
    }

    // Check if category has jobs
    if (category.jobCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with jobs. Please reassign or delete jobs first.'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

// @desc    Bulk update categories
// @route   PUT /api/admin/categories/bulk/update
// @access  Private
router.put('/bulk/update', protect, checkPermission('manage_categories'), [
  body('categoryIds').isArray({ min: 1 }).withMessage('Category IDs must be an array with at least one ID'),
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

    const { categoryIds, updates } = req.body;

    // Validate updates object
    const allowedFields = ['isActive', 'isFeatured', 'sortOrder'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      });
    }

    // Update categories
    const result = await Category.updateMany(
      { _id: { $in: categoryIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} categories successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update categories'
    });
  }
});

// @desc    Update category job count
// @route   PATCH /api/admin/categories/:id/update-job-count
// @access  Private
router.patch('/:id/update-job-count', protect, checkPermission('manage_categories'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const updatedJobCount = await category.updateJobCount();

    res.json({
      success: true,
      message: 'Job count updated successfully',
      data: {
        id: category._id,
        jobCount: updatedJobCount
      }
    });
  } catch (error) {
    console.error('Update category job count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category job count'
    });
  }
});

module.exports = router;
