const express = require('express');
const Job = require('../models/Job');

const router = express.Router();

// @desc    Get all job categories with counts
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = [
      'Commerce',
      'Telecommunications', 
      'Hotels & Tourism',
      'Education',
      'Financial Services',
      'Media',
      'Construction',
      'Technology',
      'Healthcare',
      'Marketing'
    ];

    // Get job counts for each category
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const count = await Job.countDocuments({ 
          category, 
          isActive: true 
        });
        return {
          name: category,
          count,
          slug: category.toLowerCase().replace(/\s+/g, '-')
        };
      })
    );

    res.json({
      success: true,
      data: categoryStats
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get jobs by category
// @route   GET /api/categories/:category
// @access  Public
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find({ 
      category, 
      isActive: true 
    })
    .populate('postedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

    const total = await Job.countDocuments({ 
      category, 
      isActive: true 
    });

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
    console.error('Get category jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
