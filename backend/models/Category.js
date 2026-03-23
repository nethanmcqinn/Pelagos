const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter category name'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    normalizedName: {
      type: String,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre('validate', function (next) {
  if (this.name && typeof this.name === 'string') {
    this.name = this.name.replace(/\s+/g, ' ').trim();
    this.normalizedName = this.name.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
