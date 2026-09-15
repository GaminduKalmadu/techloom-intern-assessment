const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all product categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products',
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          productCount: { $size: '$products' },
        },
      },
      { $sort: { name: 1 } },
    ]);

    return ApiResponse.success(res, 'Categories retrieved successfully.', { categories }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product category
 * @route   POST /api/categories
 * @access  Protected (Admin only)
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, slug } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw ApiError.badRequest('Category name is required.');
    }

    const trimmedName = name.trim();
    const targetSlug =
      (slug && slug.trim()) ||
      trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const existingCategory = await Category.findOne({
      $or: [{ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } }, { slug: targetSlug }],
    });

    if (existingCategory) {
      throw ApiError.conflict(`A category with the name "${trimmedName}" or slug "${targetSlug}" already exists.`);
    }

    const category = await Category.create({
      name: trimmedName,
      slug: targetSlug,
      description: description ? description.trim() : '',
    });

    return ApiResponse.success(res, 'Category created successfully.', { category }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing category
 * @route   PUT /api/categories/:id
 * @access  Protected (Admin only)
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, slug } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    if (name && typeof name === 'string' && name.trim()) {
      const trimmedName = name.trim();
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      });

      if (duplicate) {
        throw ApiError.conflict(`A category with the name "${trimmedName}" already exists.`);
      }

      category.name = trimmedName;
    }

    if (slug && typeof slug === 'string' && slug.trim()) {
      const targetSlug = slug.toLowerCase().trim();
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        slug: targetSlug,
      });

      if (duplicate) {
        throw ApiError.conflict(`A category with the slug "${targetSlug}" already exists.`);
      }

      category.slug = targetSlug;
    }

    if (typeof description === 'string') {
      category.description = description.trim();
    }

    await category.save();

    return ApiResponse.success(res, 'Category updated successfully.', { category }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a category (prevents deletion if products belong to it)
 * @route   DELETE /api/categories/:id
 * @access  Protected (Admin only)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category "${category.name}" because ${productCount} product(s) belong to it. Reassign or delete those products first.`
      );
    }

    await Category.findByIdAndDelete(id);

    return ApiResponse.success(res, `Category "${category.name}" deleted successfully.`, null, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
