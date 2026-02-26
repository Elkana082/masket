require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();

// ---- CORS ----
app.use(cors({
  origin: [
    'https://masket-3.onrender.com',
    'http://localhost:5000',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Serve uploaded images ----
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- Serve ALL frontend static files (HTML, CSS, JS, images) ----
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// ---- API Routes ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));

// ---- Health check ----
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ---- Catch-all: serve specific HTML files by name, fallback to index ----
app.get('*', (req, res) => {
  // If it's an API route that wasn't matched, return 404 JSON
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }

  // Try to serve the exact HTML file requested
  // e.g. /product.html -> frontend/product.html
  const requestedFile = path.join(frontendPath, req.path);
  if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    return res.sendFile(requestedFile);
  }

  // Also try with .html extension
  const withHtml = requestedFile.endsWith('.html') ? requestedFile : requestedFile + '.html';
  if (fs.existsSync(withHtml)) {
    return res.sendFile(withHtml);
  }

  // Final fallback: serve index.html
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ---- MongoDB + Start Server ----
mongoose
  .connect(process.env.MONGO_URI || process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () =>
      console.log(`🚀 Masket running at http://localhost:${PORT}`)
    );
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const alt = Number(PORT) + 1;
        console.error(`⚠️  Port ${PORT} busy — trying ${alt}`);
        app.listen(alt, () => console.log(`🚀 Masket running at http://localhost:${alt}`));
      }
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });