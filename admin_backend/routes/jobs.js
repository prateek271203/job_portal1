const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Category = require('../models/Category');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get job statistics
// @route   GET /api/admin/jobs/stats/overview
// @access  Private
router.get('/stats/overview', protect, checkPermission('manage_jobs'), async (req, res) => {
  try {
    const [totalJobs, activeJobs, inactiveJobs, expiredJobs, draftJobs, featuredJobs] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ isActive: true, status: 'active' }),
      Job.countDocuments({ isActive: false }),
      Job.countDocuments({ status: 'expired' }),
      Job.countDocuments({ status: 'draft' }),
      Job.countDocuments({ isFeatured: true })
    ]);

    // Get monthly job postings
    const monthlyPostings = await Job.getMonthlyPostings(6);

    // Get job categories distribution
    const jobCategories = await Job.getCategoryStats();

    // Get job types distribution
    const jobTypes = await Job.aggregate([
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    // Get experience levels distribution
    const experienceLevels = await Job.aggregate([
      { $group: { _id: '$experience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    res.json({
      success: true,
      data: {
        overview: {
          totalJobs,
          activeJobs,
          inactiveJobs,
          expiredJobs,
          draftJobs,
          featuredJobs
        },
        monthlyPostings,
        jobCategories,
        jobTypes,
        experienceLevels
      }
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job statistics'
    });
  }
});

// @desc    Get all jobs with pagination, search, and filters
// @route   GET /api/admin/jobs
// @access  Private
router.get('/', protect, checkPermission('manage_jobs'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('company').optional().isString().withMessage('Company must be a string'),
  query('status').optional().isIn(['active', 'inactive', 'expired', 'draft']).withMessage('Invalid status'),
  query('jobType').optional().isIn(['Full time', 'Part time', 'Contract', 'Internship', 'Freelance']).withMessage('Invalid job type'),
  query('experience').optional().isIn(['Entry Level', 'Mid Level', 'Senior Level', 'Executive']).withMessage('Invalid experience level'),
  query('location').optional().isString().withMessage('Location must be a string'),
  query('sortBy').optional().isIn(['createdAt', 'title', 'company', 'location', 'status']).withMessage('Invalid sort field'),
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
      company = '',
      status = '',
      jobType = '',
      experience = '',
      location = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (category) filter.categoryName = category;
    if (company) filter.companyName = { $regex: company, $options: 'i' };
    if (status) filter.status = status;
    if (jobType) filter.jobType = jobType;
    if (experience) filter.experience = experience;
    if (location) filter.location = { $regex: location, $options: 'i' };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get jobs with pagination
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('company', 'name logo')
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Job.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: jobs,
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
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs'
    });
  }
});

// @desc    Get single job by ID
// @route   GET /api/admin/jobs/:id
// @access  Private
router.get('/:id', protect, checkPermission('manage_jobs'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logo description industry')
      .populate('category', 'name description')
      .populate('postedBy', 'firstName lastName email');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job'
    });
  }
});

// @desc    Create new job
// @route   POST /api/admin/jobs
// @access  Private
router.post('/', protect, checkPermission('manage_jobs'), [
  body('title').isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('company').notEmpty().withMessage('Company is required'),
  body('description').isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array'),
  body('responsibilities').optional().isArray().withMessage('Responsibilities must be an array'),
  body('category').notEmpty().withMessage('Category is required'),
  body('jobType').isIn(['Full time', 'Part time', 'Contract', 'Internship', 'Freelance']).withMessage('Invalid job type'),
  body('experience').optional().isIn(['Entry Level', 'Mid Level', 'Senior Level', 'Executive']).withMessage('Invalid experience level'),
  body('location').notEmpty().withMessage('Location is required'),
  body('salaryRange').notEmpty().withMessage('Salary range is required'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('benefits').optional().isArray().withMessage('Benefits must be an array'),
  body('education').optional().isIn(['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Any']).withMessage('Invalid education level'),
  body('applicationDeadline').optional().isISO8601().withMessage('Invalid deadline date'),
  body('isRemote').optional().isBoolean().withMessage('isRemote must be a boolean'),
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

    // Handle company - if it's a string, create or find company
    let companyId = req.body.company;
    let companyName = req.body.company;
    
    if (typeof req.body.company === 'string' && req.body.company.trim()) {
      // Check if company exists by name
      let company = await Company.findOne({ name: { $regex: new RegExp(`^${req.body.company}$`, 'i') } });
      
      if (!company) {
        // Create new company if it doesn't exist
        company = await Company.create({
          name: req.body.company,
          email: `contact@${req.body.company.toLowerCase().replace(/\s+/g, '')}.com`,
          description: `This company was automatically created when posting the job: ${req.body.title}. Please update with more details.`,
          industry: 'General',
          companySize: '1-10',
          type: 'Private',
          revenue: 'Under $1M',
          status: 'active',
          isActive: true,
          isVerified: true,
          createdBy: req.admin.id
        });
      }
      
      companyId = company._id;
      companyName = company.name;
    }

    // Handle category - if it's a string, create or find category
    let categoryId = req.body.category;
    let categoryName = req.body.category;
    
    if (typeof req.body.category === 'string' && req.body.category.trim()) {
      // Check if category exists by name
      let category = await Category.findOne({ name: { $regex: new RegExp(`^${req.body.category}$`, 'i') } });
      
      if (!category) {
        // Create new category if it doesn't exist
        category = await Category.create({
          name: req.body.category,
          description: `This category was automatically created when posting the job: ${req.body.title}. It represents jobs in the ${req.body.category} field.`,
          slug: req.body.category.toLowerCase().replace(/\s+/g, '-'),
          isActive: true,
          isFeatured: false,
          sortOrder: 999
        });
      }
      
      categoryId = category._id;
      categoryName = category.name;
    }

    // Create job
    const jobData = {
      ...req.body,
      company: companyId,
      companyName: companyName,
      category: categoryId,
      categoryName: categoryName,
      requirements: req.body.requirements || [],
      responsibilities: req.body.responsibilities || [],
      skills: req.body.skills || [],
      tags: req.body.tags || [],
      benefits: req.body.benefits || [],
      postedBy: req.admin.id,
      isAdminPosted: true,
      status: 'active',
      isActive: true
    };

    const job = await Job.create(jobData);

    // Populate references
    const populatedJob = await Job.findById(job._id)
      .populate('company', 'name logo')
      .populate('category', 'name')
      .populate('postedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: populatedJob
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job'
    });
  }
});

// @desc    Update job
// @route   PUT /api/admin/jobs/:id
// @access  Private
router.put('/:id', protect, checkPermission('manage_jobs'), [
  body('title').optional().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array'),
  body('responsibilities').optional().isArray().withMessage('Responsibilities must be an array'),
  body('jobType').optional().isIn(['Full time', 'Part time', 'Contract', 'Internship', 'Freelance']).withMessage('Invalid job type'),
  body('experience').optional().isIn(['Entry Level', 'Mid Level', 'Senior Level', 'Executive']).withMessage('Invalid experience level'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty'),
  body('salaryRange').optional().notEmpty().withMessage('Salary range cannot be empty'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('benefits').optional().isArray().withMessage('Benefits must be an array'),
  body('education').optional().isIn(['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Any']).withMessage('Invalid education level'),
  body('applicationDeadline').optional().isISO8601().withMessage('Invalid deadline date'),
  body('status').optional().isIn(['active', 'inactive', 'expired', 'draft']).withMessage('Invalid status'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isRemote').optional().isBoolean().withMessage('isRemote must be a boolean'),
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

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Handle company updates if provided
    if (req.body.company && typeof req.body.company === 'string' && req.body.company.trim()) {
      let company = await Company.findOne({ name: { $regex: new RegExp(`^${req.body.company}$`, 'i') } });
      
      if (!company) {
        company = await Company.create({
          name: req.body.company,
          email: `contact@${req.body.company.toLowerCase().replace(/\s+/g, '')}.com`,
          description: `This company was automatically created when updating the job: ${job.title}. Please update with more details.`,
          industry: 'General',
          companySize: '1-10',
          type: 'Private',
          revenue: 'Under $1M',
          status: 'active',
          isActive: true,
          isVerified: true,
          createdBy: req.admin.id
        });
      }
      
      job.company = company._id;
      job.companyName = company.name;
    }

    // Handle category updates if provided
    if (req.body.category && typeof req.body.category === 'string' && req.body.category.trim()) {
      let category = await Category.findOne({ name: { $regex: new RegExp(`^${req.body.category}$`, 'i') } });
      
      if (!category) {
        category = await Category.create({
          name: req.body.category,
          description: `This category was automatically created when updating the job: ${job.title}. It represents jobs in the ${req.body.category} field.`,
          slug: req.body.category.toLowerCase().replace(/\s+/g, '-'),
          isActive: true,
          isFeatured: false,
          sortOrder: 999
        });
      }
      
      job.category = category._id;
      job.categoryName = category.name;
    }

    // Update other job fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'postedBy' && key !== 'isAdminPosted' && key !== 'company' && key !== 'category') {
        job[key] = req.body[key];
      }
    });

    // Ensure arrays are properly set
    if (req.body.requirements) job.requirements = req.body.requirements;
    if (req.body.responsibilities) job.responsibilities = req.body.responsibilities;
    if (req.body.skills) job.skills = req.body.skills;
    if (req.body.tags) job.tags = req.body.tags;
    if (req.body.benefits) job.benefits = req.body.benefits;

    const updatedJob = await job.save();

    // Populate references
    const populatedJob = await Job.findById(updatedJob._id)
      .populate('company', 'name logo')
      .populate('category', 'name')
      .populate('postedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: populatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job'
    });
  }
});

// @desc    Delete job
// @route   DELETE /api/admin/jobs/:id
// @access  Private
router.delete('/:id', protect, checkPermission('manage_jobs'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job'
    });
  }
});

// @desc    Bulk update jobs
// @route   PUT /api/admin/jobs/bulk/update
// @access  Private
router.put('/bulk/update', protect, checkPermission('manage_jobs'), [
  body('jobIds').isArray({ min: 1 }).withMessage('Job IDs must be an array with at least one ID'),
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

    const { jobIds, updates } = req.body;

    // Validate updates object
    const allowedFields = ['status', 'isActive', 'isFeatured', 'isRemote'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      });
    }

    // Update jobs
    const result = await Job.updateMany(
      { _id: { $in: jobIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} jobs successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update jobs'
    });
  }
});

// @desc    Toggle job status
// @route   PATCH /api/admin/jobs/:id/toggle-status
// @access  Private
router.patch('/:id/toggle-status', protect, checkPermission('manage_jobs'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Toggle between active and inactive
    job.isActive = !job.isActive;
    
    // If deactivating, also set status to inactive
    if (!job.isActive) {
      job.status = 'inactive';
    } else if (job.status === 'inactive') {
      job.status = 'active';
    }

    await job.save();

    res.json({
      success: true,
      message: `Job ${job.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: job._id,
        isActive: job.isActive,
        status: job.status
      }
    });
  } catch (error) {
    console.error('Toggle job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle job status'
    });
  }
});

module.exports = router;
