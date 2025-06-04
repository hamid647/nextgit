const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const serviceRoutes = require('./routes/services');
app.use('/api/services', serviceRoutes);
const billingRoutes = require('./routes/billing');
app.use('/api/billing', billingRoutes);
// Import models (example - will be used in routes later)
// const { User, Service, Billing } = require('./models');

// Placeholder for DB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash_db';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/api', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the app for potential testing or other uses (though not strictly necessary for this setup)
module.exports = app;
