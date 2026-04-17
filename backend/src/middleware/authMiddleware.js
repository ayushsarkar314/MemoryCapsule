const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Validates the short-lived ACCESS token.
 * Reads from Authorization: Bearer <token> header (sent by frontend on every request).
 * Does NOT accept the refresh token cookie — that is handled exclusively by /auth/refresh.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    next();
  } catch (err) {
    // Distinguish expired from tampered so the client can react appropriately
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };
