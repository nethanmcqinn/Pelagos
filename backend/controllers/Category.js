const Category = require('../models/Category');

// Get all active categories => /api/v1/categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name createdAt')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all categories for admin => /api/v1/admin/categories
exports.getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name isActive createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create category => /api/v1/admin/categories
exports.createCategory = async (req, res) => {
  try {
    const name = req.body?.name;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const cleanedName = name.replace(/\s+/g, ' ').trim();
    const normalizedName = cleanedName.toLowerCase();

    const existingCategory = await Category.findOne({ normalizedName });

    if (existingCategory) {
      if (existingCategory.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Category already exists',
        });
      }

      existingCategory.name = cleanedName;
      existingCategory.isActive = true;
      await existingCategory.save();

      return res.status(200).json({
        success: true,
        message: 'Category restored successfully',
        category: existingCategory,
      });
    }

    const category = await Category.create({ name: cleanedName });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete category permanently => /api/v1/admin/categories/:id
exports.softDeleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category removed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
