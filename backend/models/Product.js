const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    price: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: ['shoes', 'jewelry', 'clothes', 'electronics']
    },
    condition: {
      type: String,
      required: true,
      enum: ['brand_new', 'refurbished'],
      default: 'brand_new'
    },
    image: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    featuredCaption: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);