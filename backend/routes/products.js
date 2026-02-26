const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Helper: convert relative image path to full backend URL
function fullImageUrl(req, imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const base = process.env.BACKEND_URL || (req.protocol + '://' + req.get('host'));
  return base + (imagePath.startsWith('/') ? imagePath : '/' + imagePath);
}

function formatProduct(req, product) {
  const p = product.toObject();
  p.image = fullImageUrl(req, p.image);
  return p;
}

// @route GET /api/products
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.condition) filter.condition = req.query.condition;
    if (req.query.featured === 'true') filter.featured = true;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, products: products.map(p => formatProduct(req, p)) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: formatProduct(req, product) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;