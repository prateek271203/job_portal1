const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    minlength: [20, 'Category description must be at least 20 characters'],
    maxlength: [500, 'Category description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    default: 'briefcase'
  },
  color: {
    type: String,
    default: '#667eea'
  },
  image: {
    type: String
  },
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
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  jobCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  keywords: [{
    type: String,
    trim: true
  }],
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isFeatured: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ jobCount: -1 });

// Virtual for total job count including subcategories
categorySchema.virtual('totalJobCount').get(function() {
  if (this.subCategories && this.subCategories.length > 0) {
    return this.jobCount + this.subCategories.reduce((total, sub) => total + (sub.jobCount || 0), 0);
  }
  return this.jobCount;
});

// Virtual for is parent category
categorySchema.virtual('isParent').get(function() {
  return !this.parentCategory;
});

// Virtual for is subcategory
categorySchema.virtual('isSubcategory').get(function() {
  return !!this.parentCategory;
});

// Pre-save middleware to generate slug if not provided
categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Static method to get category statistics
categorySchema.statics.getStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          totalJobs: { $sum: '$jobCount' },
          featuredCategories: { $sum: { $cond: ['$isFeatured', 1, 0] } }
        }
      }
    ]);
    return stats[0] || { totalCategories: 0, totalJobs: 0, featuredCategories: 0 };
  } catch (error) {
    console.error('Error getting category stats:', error);
    return { totalCategories: 0, totalJobs: 0, featuredCategories: 0 };
  }
};

// Static method to get featured categories
categorySchema.statics.getFeatured = async function(limit = 6) {
  try {
    return await this.find({ 
      isActive: true, 
      isFeatured: true 
    })
    .sort({ sortOrder: 1, jobCount: -1 })
    .limit(limit)
    .lean();
  } catch (error) {
    console.error('Error getting featured categories:', error);
    return [];
  }
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  try {
    const categories = await this.find({ isActive: true })
      .populate('subCategories', 'name slug jobCount')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const parentCategories = categories.filter(cat => !cat.parentCategory);
    
    return parentCategories.map(parent => ({
      ...parent,
      subCategories: categories.filter(cat => cat.parentCategory && cat.parentCategory.toString() === parent._id.toString())
    }));
  } catch (error) {
    console.error('Error getting category tree:', error);
    return [];
  }
};

// Instance method to update job count
categorySchema.methods.updateJobCount = async function() {
  try {
    const Job = mongoose.model('Job');
    const count = await Job.countDocuments({ 
      category: this._id, 
      isActive: true,
      status: 'active'
    });
    
    this.jobCount = count;
    await this.save();
    return count;
  } catch (error) {
    console.error('Error updating job count:', error);
    return this.jobCount;
  }
};

module.exports = mongoose.model('Category', categorySchema);
