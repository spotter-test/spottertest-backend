const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/user',userRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});


// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


// Start server
app.listen(PORT, async () => {
  try {
    await mongoose.connect(process.env.mongodb_uri);
    console.log(`Server running on port ${PORT}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
});