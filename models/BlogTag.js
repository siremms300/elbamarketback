const mongoose = require('mongoose');

const blogTagSchema = new mongoose.Schema(
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
    postCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

blogTagSchema.pre('save', function () {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
});

module.exports = mongoose.model('BlogTag', blogTagSchema);