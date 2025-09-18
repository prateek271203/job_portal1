const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Content title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Content type is required'],
    enum: [
      'page',
      'blog',
      'announcement',
      'policy',
      'terms',
      'privacy',
      'about',
      'contact',
      'help',
      'custom'
    ],
    default: 'page'
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [50, 'Content must be at least 50 characters']
  },
  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  featuredImage: {
    type: String
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'scheduled'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  categories: [{
    type: String,
    trim: true
  }],
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  keywords: [{
    type: String,
    trim: true
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  template: {
    type: String,
    default: 'default'
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  seoSettings: {
    canonicalUrl: {
      type: String,
      trim: true
    },
    robotsIndex: {
      type: Boolean,
      default: true
    },
    robotsFollow: {
      type: Boolean,
      default: true
    },
    ogTitle: {
      type: String,
      maxlength: [60, 'OG title cannot exceed 60 characters']
    },
    ogDescription: {
      type: String,
      maxlength: [160, 'OG description cannot exceed 160 characters']
    },
    ogImage: {
      type: String
    }
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
contentSchema.index({ title: 'text', content: 'text' });
contentSchema.index({ slug: 1 });
contentSchema.index({ type: 1 });
contentSchema.index({ status: 1 });
contentSchema.index({ isActive: 1 });
contentSchema.index({ isPublic: 1 });
contentSchema.index({ publishDate: -1 });
contentSchema.index({ createdAt: -1 });
contentSchema.index({ author: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ categories: 1 });

// Virtual for is published
contentSchema.virtual('isPublished').get(function() {
  if (this.status !== 'published') return false;
  if (this.publishDate && this.publishDate > new Date()) return false;
  if (this.expiryDate && this.expiryDate < new Date()) return false;
  return true;
});

// Virtual for is expired
contentSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Virtual for reading time (estimated)
contentSchema.virtual('readingTime').get(function() {
  if (!this.content) return 0;
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Virtual for short excerpt
contentSchema.virtual('shortExcerpt').get(function() {
  if (this.excerpt) return this.excerpt;
  if (!this.content) return '';
  return this.content.substring(0, 150).trim() + '...';
});

// Pre-save middleware to generate slug if not provided
contentSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Set publish date if status is published and no publish date
  if (this.status === 'published' && !this.publishDate) {
    this.publishDate = new Date();
  }
  
  next();
});

// Static method to get content statistics
contentSchema.statics.getStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalContent: { $sum: 1 },
          publishedContent: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          draftContent: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          totalViews: { $sum: '$viewCount' },
          featuredContent: { $sum: { $cond: ['$isFeatured', 1, 0] } }
        }
      }
    ]);
    return stats[0] || { 
      totalContent: 0, 
      publishedContent: 0, 
      draftContent: 0, 
      totalViews: 0, 
      featuredContent: 0 
    };
  } catch (error) {
    console.error('Error getting content stats:', error);
    return { 
      totalContent: 0, 
      publishedContent: 0, 
      draftContent: 0, 
      totalViews: 0, 
      featuredContent: 0 
    };
  }
};

// Static method to get content by type
contentSchema.statics.getByType = async function(type, limit = 20) {
  try {
    return await this.find({ 
      type, 
      status: 'published',
      isActive: true,
      isPublic: true,
      publishDate: { $lte: new Date() },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gt: new Date() } }
      ]
    })
    .sort({ publishDate: -1, sortOrder: 1 })
    .limit(limit)
    .populate('author', 'firstName lastName')
    .lean();
  } catch (error) {
    console.error('Error getting content by type:', error);
    return [];
  }
};

// Static method to get featured content
contentSchema.statics.getFeatured = async function(limit = 6) {
  try {
    return await this.find({ 
      isFeatured: true,
      status: 'published',
      isActive: true,
      isPublic: true,
      publishDate: { $lte: new Date() },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gt: new Date() } }
      ]
    })
    .sort({ publishDate: -1, viewCount: -1 })
    .limit(limit)
    .populate('author', 'firstName lastName')
    .lean();
  } catch (error) {
    console.error('Error getting featured content:', error);
    return [];
  }
};

// Instance method to increment view count
contentSchema.methods.incrementView = async function() {
  this.viewCount += 1;
  return await this.save();
};

// Instance method to publish content
contentSchema.methods.publish = async function() {
  this.status = 'published';
  this.publishDate = new Date();
  return await this.save();
};

// Instance method to archive content
contentSchema.methods.archive = async function() {
  this.status = 'archived';
  return await this.save();
};

module.exports = mongoose.model('Content', contentSchema);
