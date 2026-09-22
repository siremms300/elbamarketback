const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    // Basic Info
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    
    // SEO Fields
    metaTitle: {
      type: String,
      maxlength: [70, 'Meta title should be under 70 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [200, 'Meta description should be under 200 characters'],
    },
    focusKeyword: String,
    keywords: [String],
    
    // Media
    coverImage: {
      url: String,
      publicId: String,
      altText: String,
    },
    images: [{
      url: String,
      publicId: String,
      altText: String,
      caption: String,
    }],
    
    // Categorization
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogCategory',
      required: true,
      index: true,
    },
    tags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogTag',
    }],
    
    // Author
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    
    // Publishing
    publishedAt: Date,
    
    // SEO & Analytics
    canonicalUrl: String,
    structuredData: {
      type: Object,
      default: {},
    },
    readingTime: Number,
    wordCount: Number,
    
    // Social
    socialTitle: String,
    socialDescription: String,
    socialImage: String,
    
    // Engagement
    views: {
      type: Number,
      default: 0,
    },
    uniqueViews: {
      type: Number,
      default: 0,
    },
    shares: {
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      whatsapp: { type: Number, default: 0 },
    },
    likes: {
      type: Number,
      default: 0,
    },
    
    // SEO Technical
    isIndexed: {
      type: Boolean,
      default: true,
    },
    nofollow: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7,
    },
    changeFrequency: {
      type: String,
      enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'],
      default: 'weekly',
    },
    
    // Related Content
    relatedPosts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogPost',
    }],
    
    // Internal Linking
    internalLinks: [{
      url: String,
      anchorText: String,
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for SEO and performance
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, status: 1 });
blogPostSchema.index({ tags: 1, status: 1 });
blogPostSchema.index({ author: 1, status: 1 });
blogPostSchema.index({ focusKeyword: 1 });
blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

// Pre-save hook to generate slug
blogPostSchema.pre('save', function () {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Calculate reading time (average 200 words per minute)
  if (this.isModified('content')) {
    this.wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(this.wordCount / 200);
  }
  
  // Set meta title if not provided
  if (!this.metaTitle) {
    this.metaTitle = this.title.length > 70 ? this.title.substring(0, 67) + '...' : this.title;
  }
  
  // Set meta description if not provided
  if (!this.metaDescription) {
    this.metaDescription = this.excerpt.length > 200 ? this.excerpt.substring(0, 197) + '...' : this.excerpt;
  }
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost;