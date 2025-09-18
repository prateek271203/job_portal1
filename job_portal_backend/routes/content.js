const express = require('express');
const Content = require('../models/Content');

const router = express.Router();

// @desc    Get all active content
// @route   GET /api/content
// @access  Public
router.get('/', async (req, res) => {
  try {
    const content = await Content.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get content by type (e.g., 'about', 'contact', 'home')
// @route   GET /api/content/type/:type
// @access  Public
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const content = await Content.findOne({ 
      type, 
      isActive: true 
    }).lean();

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
    console.error('Get content by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get content by ID
// @route   GET /api/content/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .where({ isActive: true })
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
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
