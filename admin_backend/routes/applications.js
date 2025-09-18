const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Company = require('../models/Company');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get application statistics
// @route   GET /api/admin/applications/stats/overview
// @access  Private
router.get('/stats/overview', protect, checkPermission('manage_applications'), async (req, res) => {
  try {
    const [totalApplications, pendingApplications, reviewedApplications, shortlistedApplications, interviewedApplications, hiredApplications, rejectedApplications] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'reviewed' }),
      Application.countDocuments({ status: 'shortlisted' }),
      Application.countDocuments({ status: 'interviewed' }),
      Application.countDocuments({ status: 'hired' }),
      Application.countDocuments({ status: 'rejected' })
    ]);

    // Get monthly applications
    const monthlyApplications = await Application.aggregate([
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

    // Get application status distribution
    const applicationStatus = await Application.getStats();

    // Get applications by company
    const applicationsByCompany = await Application.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'companyInfo'
        }
      },
      {
        $group: {
          _id: '$company',
          companyName: { $first: '$companyInfo.name' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).catch(() => []);

    // Get applications by job
    const applicationsByJob = await Application.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobInfo'
        }
      },
      {
        $group: {
          _id: '$job',
          jobTitle: { $first: '$jobInfo.title' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).catch(() => []);

    res.json({
      success: true,
      data: {
        overview: {
          totalApplications,
          pendingApplications,
          reviewedApplications,
          shortlistedApplications,
          interviewedApplications,
          hiredApplications,
          rejectedApplications
        },
        monthlyApplications,
        applicationStatus,
        applicationsByCompany,
        applicationsByJob
      }
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application statistics'
    });
  }
});

// @desc    Get all applications with pagination, search, and filters
// @route   GET /api/admin/applications
// @access  Private
router.get('/', protect, checkPermission('manage_applications'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['pending', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected']).withMessage('Invalid status'),
  query('job').optional().isString().withMessage('Job must be a string'),
  query('company').optional().isString().withMessage('Company must be a string'),
  query('applicant').optional().isString().withMessage('Applicant must be a string'),
  query('sortBy').optional().isIn(['createdAt', 'status', 'appliedAt', 'reviewedAt']).withMessage('Invalid sort field'),
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
      job = '',
      company = '',
      applicant = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { 'job.title': { $regex: search, $options: 'i' } },
        { 'applicant.firstName': { $regex: search, $options: 'i' } },
        { 'applicant.lastName': { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) filter.status = status;
    if (job) filter.job = job;
    if (company) filter.company = company;
    if (applicant) filter.applicant = applicant;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get applications with pagination
    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('job', 'title companyName location jobType')
        .populate('applicant', 'firstName lastName email phone')
        .populate('company', 'name logo')
        .populate('reviewedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Application.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: applications,
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
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
});

// @desc    Get single application by ID
// @route   GET /api/admin/applications/:id
// @access  Private
router.get('/:id', protect, checkPermission('manage_applications'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title description companyName location jobType requirements skills')
      .populate('applicant', 'firstName lastName email phone address city state country bio skills experience education')
      .populate('company', 'name logo description industry')
      .populate('reviewedBy', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application'
    });
  }
});

// @desc    Update application status
// @route   PUT /api/admin/applications/:id/status
// @access  Private
router.put('/:id/status', protect, checkPermission('manage_applications'), [
  body('status').isIn(['pending', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
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

    const { status, notes } = req.body;

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application status
    await application.updateStatus(status, req.admin.id, notes);

    // Populate references for response
    const updatedApplication = await Application.findById(application._id)
      .populate('job', 'title companyName location jobType')
      .populate('applicant', 'firstName lastName email phone')
      .populate('company', 'name logo')
      .populate('reviewedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status'
    });
  }
});

// @desc    Add notes to application
// @route   PUT /api/admin/applications/:id/notes
// @access  Private
router.put('/:id/notes', protect, checkPermission('manage_applications'), [
  body('notes').isLength({ min: 1, max: 1000 }).withMessage('Notes must be between 1 and 1000 characters')
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

    const { notes } = req.body;

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.notes = notes;
    application.reviewedBy = req.admin.id;
    application.reviewedAt = new Date();
    await application.save();

    // Populate references for response
    const updatedApplication = await Application.findById(application._id)
      .populate('job', 'title companyName location jobType')
      .populate('applicant', 'firstName lastName email phone')
      .populate('company', 'name logo')
      .populate('reviewedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Application notes updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Update application notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application notes'
    });
  }
});

// @desc    Delete application
// @route   DELETE /api/admin/applications/:id
// @access  Private
router.delete('/:id', protect, checkPermission('manage_applications'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await Application.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application'
    });
  }
});

// @desc    Get applications by status
// @route   GET /api/admin/applications/status/:status
// @access  Private
router.get('/status/:status', protect, checkPermission('manage_applications'), async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 50 } = req.query;

    const applications = await Application.find({ status })
      .populate('job', 'title companyName location jobType')
      .populate('applicant', 'firstName lastName email phone')
      .populate('company', 'name logo')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Get applications by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications by status'
    });
  }
});

// @desc    Get applications by job
// @route   GET /api/admin/applications/job/:jobId
// @access  Private
router.get('/job/:jobId', protect, checkPermission('manage_applications'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { limit = 50 } = req.query;

    const applications = await Application.find({ job: jobId })
      .populate('applicant', 'firstName lastName email phone')
      .populate('company', 'name logo')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Get applications by job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications by job'
    });
  }
});

// @desc    Bulk update applications
// @route   PUT /api/admin/applications/bulk/update
// @access  Private
router.put('/bulk/update', protect, checkPermission('manage_applications'), [
  body('applicationIds').isArray({ min: 1 }).withMessage('Application IDs must be an array with at least one ID'),
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

    const { applicationIds, updates } = req.body;

    // Validate updates object
    const allowedFields = ['status', 'notes'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      });
    }

    // Update applications
    const updateData = { ...updates };
    
    if (updates.status) {
      updateData.reviewedBy = req.admin.id;
      updateData.reviewedAt = new Date();
    }

    const result = await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} applications successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update applications'
    });
  }
});

module.exports = router;
