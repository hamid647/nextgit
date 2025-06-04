const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Adjusted path

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_for_development'; // Use environment variable in production

// Middleware to verify JWT token
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-passwordHash'); // Attach user to request, remove password
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check for 'owner' role
const isOwner = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an owner' });
  }
};

// Middleware to check for 'staff' role (or owner, as owners can do staff tasks)
const isStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'staff' || req.user.role === 'owner')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as staff' });
  }
};


module.exports = { protect, isOwner, isStaff };
