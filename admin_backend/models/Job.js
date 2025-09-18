const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  companyName: {
    type: String,
    required: true,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Job category is required']
  },
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['Full time', 'Part time', 'Contract', 'Internship', 'Freelance']
  },
  experience: {
    type: String,
    required: false,
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
  minSalary: {
    type: Number
  },
  maxSalary: {
    type: Number
  },
  currency: {
    type: String,
    default: 'USD'
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
    enum: ['active', 'inactive', 'expired', 'draft'],
    default: 'active'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAdminPosted: {
    type: Boolean,
    default: false
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
  isRemote: {
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
  applicationCount: {
    type: Number,
    default: 0
  },
  requirements: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  companyLogo: {
    type: String
  },
  contactEmail: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ company: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ location: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ experience: 1 });
jobSchema.index({ isFeatured: 1 });

// Virtual for application count
jobSchema.virtual('applicationCountVirtual').get(function() {
  return this.applications ? this.applications.length : 0;
});

// Virtual for days since posted
jobSchema.virtual('daysSincePosted').get(function() {
  if (!this.createdAt) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is expired
jobSchema.virtual('isExpired').get(function() {
  if (!this.applicationDeadline) return false;
  return new Date() > this.applicationDeadline;
});

// Pre-save middleware to update application count
jobSchema.pre('save', function(next) {
  if (this.applications) {
    this.applicationCount = this.applications.length;
  }
  next();
});

// Static method to get job statistics
jobSchema.statics.getStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    return stats;
  } catch (error) {
    console.error('Error getting job stats:', error);
    return [];
  }
};

// Static method to get category statistics
jobSchema.statics.getCategoryStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: '$categoryName',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    return stats;
  } catch (error) {
    console.error('Error getting category stats:', error);
    return [];
  }
};

// Static method to get monthly job postings
jobSchema.statics.getMonthlyPostings = async function(months = 6) {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const stats = await this.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
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
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    return stats;
  } catch (error) {
    console.error('Error getting monthly postings:', error);
    return [];
  }
};

module.exports = mongoose.model('Job', jobSchema);

