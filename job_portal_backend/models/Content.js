const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true,
    enum: ['about', 'contact', 'home', 'privacy', 'terms', 'general']
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    keywords: [String],
    description: String,
    author: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: false
  },
  createdByModel: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'Admin'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'lastUpdatedByModel',
    required: false
  },
  lastUpdatedByModel: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Index for better search performance
contentSchema.index({ type: 1, section: 1, isActive: 1 });
contentSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Content', contentSchema);

