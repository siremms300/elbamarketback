const BlogPost = require('../models/BlogPost');
const BlogCategory = require('../models/BlogCategory');
const BlogTag = require('../models/BlogTag');

// ============================================
// PUBLIC ENDPOINTS
// ============================================

// Get published posts with pagination and filters
const getPublishedPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      tag,
      search,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = req.query;

    const queryObj = { status: 'published' };

    if (category) {
      const cat = await BlogCategory.findOne({ slug: category });
      if (cat) queryObj.category = cat._id;
    }

    if (tag) {
      const tagDoc = await BlogTag.findOne({ slug: tag });
      if (tagDoc) queryObj.tags = tagDoc._id;
    }

    if (search) {
      queryObj.$text = { $search: search };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [posts, total] = await Promise.all([
      BlogPost.find(queryObj)
        .select('-content -internalLinks -structuredData')
        .populate('category', 'name slug')
        .populate('tags', 'name slug')
        .populate('author', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BlogPost.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: posts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single published post by slug
const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await BlogPost.findOne({ slug, status: 'published' })
      .populate('category', 'name slug description')
      .populate('tags', 'name slug')
      .populate('author', 'firstName lastName avatar')
      .populate('relatedPosts', 'title slug excerpt coverImage')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Increment view count
    BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } }).exec();

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all tags
const getTags = async (req, res) => {
  try {
    const tags = await BlogTag.find().sort({ name: 1 }).lean();
    res.status(200).json({ success: true, count: tags.length, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get related posts
const getRelatedPosts = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await BlogPost.findOne({ slug, status: 'published' });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const related = await BlogPost.find({
      _id: { $ne: post._id },
      status: 'published',
      $or: [
        { category: post.category },
        { tags: { $in: post.tags } },
        { focusKeyword: post.focusKeyword },
      ],
    })
      .select('title slug excerpt coverImage readingTime publishedAt')
      .populate('category', 'name slug')
      .limit(4)
      .lean();

    res.status(200).json({ success: true, data: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Create post
const createPost = async (req, res) => {
  try {
    const postData = {
      ...req.body,
      author: req.user._id,
    };

    const post = await BlogPost.create(postData);

    // Update category post count
    await BlogCategory.findByIdAndUpdate(post.category, { $inc: { postCount: 1 } });

    // Update tag post counts
    if (post.tags && post.tags.length > 0) {
      await BlogTag.updateMany(
        { _id: { $in: post.tags } },
        { $inc: { postCount: 1 } }
      );
    }

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Update category post count
    await BlogCategory.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });

    // Update tag post counts
    if (post.tags && post.tags.length > 0) {
      await BlogTag.updateMany(
        { _id: { $in: post.tags } },
        { $inc: { postCount: -1 } }
      );
    }

    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all posts (admin)
const getAllPosts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const queryObj = {};
    if (status) queryObj.status = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      BlogPost.find(queryObj)
        .populate('category', 'name slug')
        .populate('author', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BlogPost.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: posts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const category = await BlogCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Create tag
const createTag = async (req, res) => {
  try {
    const tag = await BlogTag.create(req.body);
    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// Delete category
const deleteCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete tag
const deleteTag = async (req, res) => {
  try {
    const tag = await BlogTag.findByIdAndDelete(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }
    res.status(200).json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};










module.exports = {
  getPublishedPosts,
  getPostBySlug,
  getCategories,
  getTags,
  getRelatedPosts,
  createPost,
  updatePost,
  deletePost,
  getAllPosts,
  createCategory,
  createTag,
  deleteCategory,
  deleteTag
};