const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Adjusted path

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_for_development'; // Use environment variable in production
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // For simplicity, first user registered is owner, others are staff
    // A more robust system would handle owner creation separately.
    const userCount = await User.countDocuments();
    const assignedRole = role || (userCount === 0 ? 'owner' : 'staff');

    // If a role is provided in the request, ensure it's valid.
    // This part can be enhanced for security, e.g., only an existing owner can create another owner.
    if (role && !['owner', 'staff'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified.' });
    }

    const newUser = new User({
      username,
      passwordHash,
      role: assignedRole
    });

    await newUser.save();

    // Do not send token on register, user should login separately
    res.status(201).json({
      message: 'User registered successfully. Please login.',
      userId: newUser._id,
      username: newUser.username,
      role: newUser.role
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials (user not found)' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials (password mismatch)' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

module.exports = router;
