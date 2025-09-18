const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Category = require('../models/Category');
const FAQ = require('../models/FAQ');
const Content = require('../models/Content');

const router = express.Router();

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // Get counts with error handling
    const [totalUsers, totalJobs, totalCompanies, totalApplications, totalCategories, totalFAQs, totalContent] = await Promise.all([
      User.countDocuments().catch(() => 0),
      Job.countDocuments().catch(() => 0),
      Company.countDocuments().catch(() => 0),
      Application.countDocuments().catch(() => 0),
      Category.countDocuments().catch(() => 0),
      FAQ.countDocuments().catch(() => 0),
      Content.countDocuments().catch(() => 0)
    ]);

    // Get active counts
    const [activeUsers, activeJobs, activeCompanies, activeCategories, activeFAQs, publishedContent] = await Promise.all([
      User.countDocuments({ isActive: true }).catch(() => 0),
      Job.countDocuments({ isActive: true, status: 'active' }).catch(() => 0),
      Company.countDocuments({ isActive: true, status: 'active' }).catch(() => 0),
      Category.countDocuments({ isActive: true }).catch(() => 0),
      FAQ.countDocuments({ isActive: true }).catch(() => 0),
      Content.countDocuments({ isActive: true, status: 'published' }).catch(() => 0)
    ]);

    // Get recent data with error handling
    const [recentUsers, recentJobs, recentApplications] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5).lean().catch(() => []),
      Job.find().populate('company').sort({ createdAt: -1 }).limit(5).lean().catch(() => []),
      Application.find()
        .populate('job')
        .populate('applicant')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .catch(() => [])
    ]);

    // Get monthly stats
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [monthlyUsers, monthlyJobs, monthlyApplications, monthlyCompanies] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }).catch(() => 0),
      Job.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }).catch(() => 0),
      Application.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }).catch(() => 0),
      Company.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }).catch(() => 0)
    ]);

    // Get job categories stats
    const jobCategories = await Job.aggregate([
      { $group: { _id: '$categoryName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    // Get user roles stats
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    // Get application status stats
    const applicationStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    // Get company industry stats
    const companyIndustries = await Company.aggregate([
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    // Get FAQ category stats
    const faqCategories = await FAQ.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    // Get content type stats
    const contentTypes = await Content.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).catch(() => []);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalJobs,
          totalCompanies,
          totalApplications,
          totalCategories,
          totalFAQs,
          totalContent
        },
        active: {
          users: activeUsers,
          jobs: activeJobs,
          companies: activeCompanies,
          categories: activeCategories,
          faqs: activeFAQs,
          content: publishedContent
        },
        monthly: {
          users: monthlyUsers,
          jobs: monthlyJobs,
          applications: monthlyApplications,
          companies: monthlyCompanies
        },
        recent: {
          users: recentUsers,
          jobs: recentJobs,
          applications: recentApplications
        },
        analytics: {
          jobCategories,
          userRoles,
          applicationStatus,
          companyIndustries,
          faqCategories,
          contentTypes
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// @desc    Get chart data
// @route   GET /api/admin/dashboard/charts
// @access  Private
router.get('/charts', protect, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter. Must be between 1 and 365 days.'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Users chart data
    const usersData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).catch(() => []);

    // Jobs chart data
    const jobsData = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).catch(() => []);

    // Applications chart data
    const applicationsData = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).catch(() => []);

    // Companies chart data
    const companiesData = await Company.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).catch(() => []);

    res.json({
      success: true,
      data: {
        users: usersData,
        jobs: jobsData,
        applications: applicationsData,
        companies: companiesData
      }
    });
  } catch (error) {
    console.error('Dashboard charts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chart data'
    });
  }
});

// @desc    Get quick actions data
// @route   GET /api/admin/dashboard/quick-actions
// @access  Private
router.get('/quick-actions', protect, async (req, res) => {
  try {
    // Get pending applications
    const pendingApplications = await Application.countDocuments({ status: 'pending' }).catch(() => 0);
    
    // Get unverified companies
    const unverifiedCompanies = await Company.countDocuments({ isVerified: false }).catch(() => 0);
    
    // Get draft content
    const draftContent = await Content.countDocuments({ status: 'draft' }).catch(() => 0);
    
    // Get inactive jobs
    const inactiveJobs = await Job.countDocuments({ isActive: false }).catch(() => 0);
    
    // Get unverified users
    const unverifiedUsers = await User.countDocuments({ isVerified: false }).catch(() => 0);

    res.json({
      success: true,
      data: {
        pendingApplications,
        unverifiedCompanies,
        draftContent,
        inactiveJobs,
        unverifiedUsers
      }
    });
  } catch (error) {
    console.error('Quick actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick actions data'
    });
  }
});

// @desc    Get system health
// @route   GET /api/admin/dashboard/system-health
// @access  Private
router.get('/system-health', protect, async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const dbStatus = await User.countDocuments().then(() => 'healthy').catch(() => 'unhealthy');
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get uptime
    const uptime = process.uptime();
    
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        database: dbStatus,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
        },
        uptime: Math.round(uptime / 60) + ' minutes',
        responseTime: responseTime + ' ms',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health data'
    });
  }
});

module.exports = router;
