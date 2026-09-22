const mongoose = require('mongoose');

const blogCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: String,
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    coverImage: {
      url: String,
      altText: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogCategory',
    },
    postCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

blogCategorySchema.pre('save', function () {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
});

module.exports = mongoose.model('BlogCategory', blogCategorySchema);