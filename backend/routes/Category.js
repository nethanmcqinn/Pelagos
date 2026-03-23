const express = require('express');
const {
  getAllCategories,
  getAllCategoriesAdmin,
  createCategory,
  softDeleteCategory,
} = require('../controllers/Category');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.get('/categories', getAllCategories);

// Admin routes
router.get('/admin/categories', isAuthenticatedUser, isAdmin, getAllCategoriesAdmin);
router.post('/admin/categories', isAuthenticatedUser, isAdmin, createCategory);
router.delete('/admin/categories/:id', isAuthenticatedUser, isAdmin, softDeleteCategory);

module.exports = router;
