const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    default: 'General'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: false
  },
  createdByModel: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Index for better search performance
faqSchema.index({ question: 'text', answer: 'text', category: 1 });
faqSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('FAQ', faqSchema);

