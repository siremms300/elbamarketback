const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/blogController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// ============================================
// PUBLIC ROUTES
// ============================================

// Get published posts
router.get('/posts', getPublishedPosts);

// Get single post
router.get('/posts/:slug', getPostBySlug);

// Get related posts
router.get('/posts/:slug/related', getRelatedPosts);

// Get categories
router.get('/categories', getCategories);

// Get tags
router.get('/tags', getTags);

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// Create post
router.post('/posts', protect, authorize('admin', 'super_admin'), createPost);

// Get all posts (including drafts)
router.get('/admin/posts', protect, authorize('admin', 'super_admin'), getAllPosts);

// Update post
router.put('/posts/:id', protect, authorize('admin', 'super_admin'), updatePost);

// Delete post
router.delete('/posts/:id', protect, authorize('admin', 'super_admin'), deletePost);

// Create category
router.post('/categories', protect, authorize('admin', 'super_admin'), createCategory);

// Create tag
router.post('/tags', protect, authorize('admin', 'super_admin'), createTag);

router.delete('/categories/:id', protect, authorize('admin', 'super_admin'), deleteCategory);
router.delete('/tags/:id', protect, authorize('admin', 'super_admin'), deleteTag);

module.exports = router;