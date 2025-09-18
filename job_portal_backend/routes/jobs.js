const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Job = require('../models/Job');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().trim(),
  query('category').optional().trim(),
  query('jobType').optional().trim(),
  query('experience').optional().trim(),
  query('location').optional().trim(),
  query('salaryMin').optional().isInt({ min: 0 }),
  query('salaryMax').optional().isInt({ min: 0 }),
  query('sortBy').optional().isIn(['latest', 'oldest', 'salary-high', 'salary-low']),
  query('featured').optional().isBoolean()
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
      category,
      jobType,
      experience,
      location,
      salaryMin,
      salaryMax,
      sortBy = 'latest',
      featured
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = category;
    }

    if (jobType) {
      filter.jobType = jobType;
    }

    if (experience) {
      filter.experience = experience;
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (salaryMin || salaryMax) {
      filter.salary = {};
      if (salaryMin) filter.salary.$gte = parseInt(salaryMin);
      if (salaryMax) filter.salary.$lte = parseInt(salaryMax);
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'latest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'salary-high':
        sort = { salaryRange: -1 };
        break;
      case 'salary-low':
        sort = { salaryRange: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(filter)
      .populate('postedBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Job.countDocuments(filter);

    // Add meta information for each job
    const jobsWithMeta = jobs.map(job => ({
      ...job,
      meta: [
        { text: job.category },
        { text: job.jobType },
        { text: job.salaryRange },
        { text: job.location }
      ]
    }));

    res.json({
      success: true,
      data: jobsWithMeta,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalJobs: total,
        hasNextPage: skip + jobs.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get recent jobs
// @route   GET /api/jobs/recent
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const recentJobs = await Job.find({ isActive: true })
      .populate('postedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    const jobsWithMeta = recentJobs.map(job => ({
      ...job,
      meta: [
        { text: job.category },
        { text: job.jobType },
        { text: job.salaryRange },
        { text: job.location }
      ]
    }));

    res.json({
      success: true,
      data: jobsWithMeta
    });
  } catch (error) {
    console.error('Get recent jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'firstName lastName')
      .populate({
        path: 'applications',
        select: 'status appliedAt',
        populate: {
          path: 'applicant',
          select: 'firstName lastName email'
        }
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (!job.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Job is no longer active'
      });
    }

    // Increment views
    job.views += 1;
    await job.save();

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employers only)
router.post('/', protect, authorize('employer', 'admin'), [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Job title must be between 5 and 100 characters'),
  body('description').isLength({ min: 50 }).withMessage('Job description must be at least 50 characters'),
  body('company').isMongoId().withMessage('Valid company ID is required'),
  body('category').isIn(['Commerce', 'Telecommunications', 'Hotels & Tourism', 'Education', 'Financial Services', 'Media', 'Construction', 'Technology', 'Healthcare', 'Marketing']).withMessage('Invalid category'),
  body('jobType').isIn(['Full time', 'Part time', 'Freelance', 'Seasonal', 'Fixed-Price', 'Contract', 'Internship']).withMessage('Invalid job type'),
  body('experience').isIn(['No-experience', 'Fresher', 'Intermediate', 'Expert']).withMessage('Invalid experience level'),
  body('salaryRange').trim().notEmpty().withMessage('Salary range is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('applicationDeadline').isISO8601().withMessage('Valid application deadline is required')
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

    // Company is now a string, no need to validate against Company collection
    // const company = await Company.findById(req.body.company);
    // if (!company) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Company not found'
    //   });
    // }

    // if (company.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to post jobs for this company'
    //   });
    // }

    const job = await Job.create({
      ...req.body,
      postedBy: req.user._id
    });

    // No need to update company's total jobs count since company is now a string
    // company.totalJobs += 1;
    // await company.save();

    const populatedJob = await Job.findById(job._id)
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
      message: 'Server error'
    });
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Job owner or admin)
router.put('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user owns the job or is admin
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('postedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Job owner or admin)
router.delete('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user owns the job or is admin
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    // Company is now a string, no need to update company's total jobs count
    // const company = await Company.findById(job.company);
    // if (company) {
    //   company.totalJobs = Math.max(0, company.totalJobs - 1);
    //   await company.save();
    // }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get featured jobs
// @route   GET /api/jobs/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredJobs = await Job.find({ isActive: true, isFeatured: true })
      .populate('postedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const jobsWithMeta = featuredJobs.map(job => ({
      ...job,
      meta: [
        { text: job.category },
        { text: job.jobType },
        { text: job.salaryRange },
        { text: job.location }
      ]
    }));

    res.json({
      success: true,
      data: jobsWithMeta
    });
  } catch (error) {
    console.error('Get featured jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
