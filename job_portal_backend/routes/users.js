const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/resumes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().trim(),
  body('skills').optional().isArray(),
  body('experience').optional().isIn(['No-experience', 'Fresher', 'Intermediate', 'Expert']),
  body('location.city').optional().trim(),
  body('location.state').optional().trim(),
  body('location.country').optional().trim(),
  body('location.address').optional().trim(),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('education.degree').optional().trim(),
  body('education.institution').optional().trim(),
  body('education.year').optional().isInt({ min: 1950, max: new Date().getFullYear() }),
  body('education.field').optional().trim(),
  body('socialLinks.linkedin').optional().isURL(),
  body('socialLinks.github').optional().isURL(),
  body('socialLinks.portfolio').optional().isURL()
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

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    const fieldsToUpdate = ['firstName', 'lastName', 'phone', 'skills', 'experience', 'location', 'bio', 'education', 'socialLinks'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Upload resume
// @route   POST /api/users/resume
// @access  Private
router.post('/resume', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old resume file if exists
    if (user.resume && user.resume.path && fs.existsSync(user.resume.path)) {
      fs.unlinkSync(user.resume.path);
    }

    // Update user resume info
    user.resume = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      uploadedAt: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        filename: user.resume.filename,
        originalName: user.resume.originalName,
        uploadedAt: user.resume.uploadedAt
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resume upload'
    });
  }
});

// @desc    Get user applications
// @route   GET /api/users/applications
// @access  Private
router.get('/applications', protect, async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job', 'title company location jobType salaryRange')
      .populate('company', 'name logo')
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get application by ID
// @route   GET /api/users/applications/:id
// @access  Private
router.get('/applications/:id', protect, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      applicant: req.user._id
    }).populate('job', 'title company location jobType salaryRange description')
      .populate('company', 'name logo');

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
      message: 'Server error'
    });
  }
});

// @desc    Download resume
// @route   GET /api/users/resume
// @access  Private
router.get('/resume', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resume || !user.resume.path) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (!fs.existsSync(user.resume.path)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found'
      });
    }

    res.download(user.resume.path, user.resume.originalName);
  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete resume
// @route   DELETE /api/users/resume
// @access  Private
router.delete('/resume', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.resume && user.resume.path && fs.existsSync(user.resume.path)) {
      fs.unlinkSync(user.resume.path);
    }

    user.resume = {
      filename: '',
      originalName: '',
      path: '',
      uploadedAt: null
    };

    await user.save();

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
