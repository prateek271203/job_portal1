const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [200, 'Question cannot exceed 200 characters']
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    minlength: [20, 'Answer must be at least 20 characters'],
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'General',
      'Job Search',
      'Applications',
      'Company',
      'Technical',
      'Payment',
      'Account',
      'Other'
    ],
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  keywords: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
faqSchema.index({ question: 'text', answer: 'text' });
faqSchema.index({ category: 1 });
faqSchema.index({ isActive: 1 });
faqSchema.index({ isFeatured: 1 });
faqSchema.index({ sortOrder: 1 });
faqSchema.index({ createdAt: -1 });
faqSchema.index({ viewCount: -1 });

// Virtual for helpful percentage
faqSchema.virtual('helpfulPercentage').get(function() {
  const total = this.helpfulCount + this.notHelpfulCount;
  if (total === 0) return 0;
  return Math.round((this.helpfulCount / total) * 100);
});

// Virtual for total feedback count
faqSchema.virtual('totalFeedback').get(function() {
  return this.helpfulCount + this.notHelpfulCount;
});

// Virtual for is popular
faqSchema.virtual('isPopular').get(function() {
  return this.viewCount > 100 || this.helpfulCount > 10;
});

// Pre-save middleware to update lastUpdatedBy
faqSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdatedBy = this.createdBy; // This will be updated by the route
  }
  next();
});

// Static method to get FAQ statistics
faqSchema.statics.getStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalFAQs: { $sum: 1 },
          activeFAQs: { $sum: { $cond: ['$isActive', 1, 0] } },
          featuredFAQs: { $sum: { $cond: ['$isFeatured', 1, 0] } },
          totalViews: { $sum: '$viewCount' },
          totalFeedback: { $sum: { $add: ['$helpfulCount', '$notHelpfulCount'] } }
        }
      }
    ]);
    return stats[0] || { 
      totalFAQs: 0, 
      activeFAQs: 0, 
      featuredFAQs: 0, 
      totalViews: 0, 
      totalFeedback: 0 
    };
  } catch (error) {
    console.error('Error getting FAQ stats:', error);
    return { 
      totalFAQs: 0, 
      activeFAQs: 0, 
      featuredFAQs: 0, 
      totalViews: 0, 
      totalFeedback: 0 
    };
  }
};

// Static method to get category statistics
faqSchema.statics.getCategoryStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' }
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

// Static method to get popular FAQs
faqSchema.statics.getPopular = async function(limit = 10) {
  try {
    return await this.find({ isActive: true })
      .sort({ viewCount: -1, helpfulCount: -1 })
      .limit(limit)
      .select('question answer category viewCount helpfulCount')
      .lean();
  } catch (error) {
    console.error('Error getting popular FAQs:', error);
    return [];
  }
};

// Static method to get FAQs by category
faqSchema.statics.getByCategory = async function(category, limit = 20) {
  try {
    return await this.find({ 
      category, 
      isActive: true 
    })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  } catch (error) {
    console.error('Error getting FAQs by category:', error);
    return [];
  }
};

// Instance method to increment view count
faqSchema.methods.incrementView = async function() {
  this.viewCount += 1;
  return await this.save();
};

// Instance method to mark as helpful
faqSchema.methods.markHelpful = async function() {
  this.helpfulCount += 1;
  return await this.save();
};

// Instance method to mark as not helpful
faqSchema.methods.markNotHelpful = async function() {
  this.notHelpfulCount += 1;
  return await this.save();
};

module.exports = mongoose.model('FAQ', faqSchema);
