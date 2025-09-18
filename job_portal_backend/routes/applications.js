const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private (Job seekers only)
router.post('/', protect, authorize('jobseeker'), [
  body('job').isMongoId().withMessage('Valid job ID is required'),
  body('coverLetter').isLength({ min: 100 }).withMessage('Cover letter must be at least 100 characters'),
  body('resume').notEmpty().withMessage('Resume is required'),
  body('expectedSalary').isInt({ min: 0 }).withMessage('Expected salary must be a positive number'),
  body('availability').isIn(['immediately', '2-weeks', '1-month', '3-months', 'negotiable']).withMessage('Invalid availability')
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

    const { job: jobId, coverLetter, resume, expectedSalary, availability } = req.body;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (!job.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }

    // Check if application deadline has passed
    if (new Date() > job.applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create application
    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      company: job.company,
      coverLetter,
      resume,
      expectedSalary,
      availability
    });

    // Add application to job's applications array
    job.applications.push(application._id);
    await job.save();

    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company')
      .populate('applicant', 'firstName lastName email')
      .populate('company', 'name');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: populatedApplication
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's applications
// @route   GET /api/applications/my-applications
// @access  Private
router.get('/my-applications', protect, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'reviewing', 'shortlisted', 'interviewed', 'hired', 'rejected'])
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

    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { applicant: req.user._id };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('job', 'title company category jobType location salary')
      .populate('company', 'name logo industry')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    res.json({
      success: true,
      data: applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalApplications: total,
        hasNextPage: skip + applications.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get applications for a job (employer only)
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer or admin)
router.get('/job/:jobId', protect, authorize('employer', 'admin'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'reviewing', 'shortlisted', 'interviewed', 'hired', 'rejected'])
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

    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if job exists and user owns it
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job'
      });
    }

    // Build filter
    const filter = { job: req.params.jobId };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('applicant', 'firstName lastName email phone skills experience location')
      .populate('job', 'title')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    res.json({
      success: true,
      data: applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalApplications: total,
        hasNextPage: skip + applications.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Employer or admin)
router.put('/:id/status', protect, authorize('employer', 'admin'), [
  body('status').isIn(['pending', 'reviewing', 'shortlisted', 'interviewed', 'hired', 'rejected']).withMessage('Invalid status'),
  body('interviewDate').optional().isISO8601().withMessage('Invalid interview date'),
  body('interviewLocation').optional().trim(),
  body('interviewNotes').optional().trim(),
  body('rejectionReason').optional().trim()
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

    const { status, interviewDate, interviewLocation, interviewNotes, rejectionReason } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns the job or is admin
    const job = await Job.findById(application.job);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    // Update application
    application.status = status;
    if (interviewDate) application.interviewDate = interviewDate;
    if (interviewLocation) application.interviewLocation = interviewLocation;
    if (interviewNotes) application.interviewNotes = interviewNotes;
    if (rejectionReason) application.rejectionReason = rejectionReason;

    await application.save();

    const updatedApplication = await Application.findById(application._id)
      .populate('applicant', 'firstName lastName email')
      .populate('job', 'title')
      .populate('company', 'name');

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Withdraw application
// @route   PUT /api/applications/:id/withdraw
// @access  Private (Application owner)
router.put('/:id/withdraw', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns the application
    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to withdraw this application'
      });
    }

    if (application.isWithdrawn) {
      return res.status(400).json({
        success: false,
        message: 'Application is already withdrawn'
      });
    }

    application.isWithdrawn = true;
    application.withdrawnAt = new Date();
    await application.save();

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get application statistics
// @route   GET /api/applications/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role === 'jobseeker') {
      filter.applicant = req.user._id;
    } else if (req.user.role === 'employer') {
      // Get jobs posted by this employer
      const jobs = await Job.find({ postedBy: req.user._id }).select('_id');
      const jobIds = jobs.map(job => job._id);
      filter.job = { $in: jobIds };
    }

    const stats = await Application.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await Application.countDocuments(filter);
    const pendingApplications = await Application.countDocuments({ ...filter, status: 'pending' });
    const shortlistedApplications = await Application.countDocuments({ ...filter, status: 'shortlisted' });
    const hiredApplications = await Application.countDocuments({ ...filter, status: 'hired' });

    res.json({
      success: true,
      data: {
        total: totalApplications,
        pending: pendingApplications,
        shortlisted: shortlistedApplications,
        hired: hiredApplications,
        breakdown: stats
      }
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
