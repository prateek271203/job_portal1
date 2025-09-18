const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  logo: {
    type: String
  },
  description: {
    type: String,
    required: [true, 'Company description is required'],
    minlength: [50, 'Company description must be at least 50 characters'],
    maxlength: [2000, 'Company description cannot exceed 2000 characters']
  },
  website: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Company email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    }
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-10'
  },
  foundedYear: {
    type: Number
  },
  revenue: {
    type: String,
    enum: ['Under $1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M+'],
    default: 'Under $1M'
  },
  type: {
    type: String,
    enum: ['Public', 'Private', 'Non-profit', 'Government'],
    default: 'Private'
  },
  socialMedia: {
    linkedin: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    facebook: {
      type: String,
      trim: true
    },
    instagram: {
      type: String,
      trim: true
    }
  },
  benefits: [{
    type: String,
    trim: true
  }],
  culture: {
    type: String,
    maxlength: [500, 'Culture description cannot exceed 500 characters']
  },
  mission: {
    type: String,
    maxlength: [500, 'Mission statement cannot exceed 500 characters']
  },
  vision: {
    type: String,
    maxlength: [500, 'Vision statement cannot exceed 500 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'active'
  },
  contactPerson: {
    name: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  jobCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ industry: 1 });
companySchema.index({ isVerified: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ status: 1 });
companySchema.index({ createdAt: -1 });
companySchema.index({ 'address.city': 1 });
companySchema.index({ 'address.country': 1 });
companySchema.index({ isFeatured: 1 });

// Virtual for full address
companySchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.country,
    this.address.zipCode
  ].filter(Boolean);
  return parts.join(', ');
});

// Virtual for location
companySchema.virtual('location').get(function() {
  if (!this.address) return '';
  const parts = [this.address.city, this.address.state, this.address.country].filter(Boolean);
  return parts.join(', ');
});

// Virtual for company age
companySchema.virtual('companyAge').get(function() {
  if (!this.foundedYear) return null;
  const currentYear = new Date().getFullYear();
  return currentYear - this.foundedYear;
});

// Pre-save middleware to update job count
companySchema.pre('save', function(next) {
  if (this.jobs) {
    this.jobCount = this.jobs.length;
  }
  next();
});

// Static method to get company statistics
companySchema.statics.getStats = async function() {
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
    console.error('Error getting company stats:', error);
    return [];
  }
};

// Static method to get industry statistics
companySchema.statics.getIndustryStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    return stats;
  } catch (error) {
    console.error('Error getting industry stats:', error);
    return [];
  }
};

// Static method to get monthly company registrations
companySchema.statics.getMonthlyRegistrations = async function(months = 6) {
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
    console.error('Error getting monthly registrations:', error);
    return [];
  }
};

module.exports = mongoose.model('Company', companySchema);
