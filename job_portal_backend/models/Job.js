const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    minlength: [50, 'Job description must be at least 50 characters']
  },
  requirements: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: [true, 'Job category is required'],
    enum: ['Commerce', 'Telecommunications', 'Hotels & Tourism', 'Education', 'Financial Services', 'Media', 'Construction', 'Technology', 'Healthcare', 'Marketing']
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['Full time', 'Part time', 'Contract', 'Internship']
  },
  experience: {
    type: String,
    required: [false, 'Experience level is not required'],
    enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'],
    default: 'Entry Level'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  salaryRange: {
    type: String,
    required: [true, 'Salary range is required'],
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  education: {
    type: String,
    required: false,
    enum: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Any'],
    default: 'Any'
  },
  status: {
    type: String,
    required: false,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  isAdminPosted: {
    type: Boolean,
    default: true
  },
  applicationDeadline: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'postedByModel',
    required: false
  },
  postedByModel: {
    type: String,
    required: false,
    enum: ['User', 'Admin'],
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Index for search functionality
jobSchema.index({ 
  title: 'text', 
  description: 'text', 
  skills: 'text',
  location: 'text',
  company: 'text'
});

// Virtual for time posted
jobSchema.virtual('timePosted').get(function() {
  const now = new Date();
  const posted = this.createdAt;
  const diffInMinutes = Math.floor((now - posted) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
});

// Ensure virtuals are serialized
jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
