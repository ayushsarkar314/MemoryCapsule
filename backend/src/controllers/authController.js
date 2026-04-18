const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/email');

// ─────────────────────────────────────────────
//  Token helpers
// ─────────────────────────────────────────────

/**
 * Access token: short-lived (15 min), sent in response body.
 * The client keeps this in memory or localStorage and attaches it
 * as a Bearer header on every request.
 */
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });
};

/**
 * Refresh token: long-lived (7 days), sent as an httpOnly cookie.
 * Used ONLY to issue a new access token via the /refresh endpoint.
 * Also stored in the DB so we can invalidate it on logout.
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,                                         // JS cannot read it
  secure: process.env.NODE_ENV === 'production',          // HTTPS only in prod
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,                       // 7 days in ms
  path: '/api/auth/refresh',                              // Only sent to refresh endpoint
};

/**
 * Issue both tokens, persist refresh token in DB, set cookie.
 */
const issueTokens = async (user, res) => {
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Persist refresh token (overwrites any existing one — single active session)
  await User.findByIdAndUpdate(user._id, { refreshToken });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  return accessToken;
};

// ─────────────────────────────────────────────
//  Shared user response shape
// ─────────────────────────────────────────────
const userPayload = (user) => ({
  _id:         user._id,
  username:    user.username,
  email:       user.email,
  displayName: user.displayName,
  avatar:      user.avatar,
  bio:         user.bio,
});

// ─────────────────────────────────────────────
//  Controllers
// ─────────────────────────────────────────────

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email and password' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username';
      return res.status(400).json({ message: `${field} is already taken` });
    }

    const user = await User.create({
      username,
      email,
      password,
      displayName: displayName || username,
    });

    const accessToken = await issueTokens(user, res);

    res.status(201).json({
      message: 'Account created successfully',
      accessToken,
      user: userPayload(user),
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} is already taken` });
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email OR username

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = await issueTokens(user, res);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: userPayload(user),
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/auth/refresh
// @access  Public (requires valid refresh token cookie)
const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    // Verify the token signature / expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Refresh token invalid or expired' });
    }

    // Validate that this token matches what is stored in the DB (single-session check)
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      // Token reuse — potential theft. Clear cookie.
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return res.status(401).json({ message: 'Refresh token reuse detected. Please log in again.' });
    }

    // Issue a new access token (refresh token stays the same until it expires)
    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      accessToken: newAccessToken,
      user: userPayload(user),
    });
  } catch (err) {
    console.error('[Auth] Refresh error:', err.message);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
};

// @desc    Logout — invalidate refresh token
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Wipe refresh token from DB
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    // Clear the cookie
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('friends', 'username displayName avatar');
  res.status(200).json({ user });
};

// @desc    Update profile (displayName, bio, avatar)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { displayName, bio } = req.body;
    const avatarUrl = req.file ? req.file.path : undefined;

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl) updateData.avatar = avatarUrl;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true, runValidators: true,
    });

    res.status(200).json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Forgot password — generate reset token & send email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always respond the same way to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    // Generate a secure random token (raw = sent in email, hashed = stored in DB)
    const rawToken  = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Store hashed token + expiry (configurable via env, defaults to 10 min)
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = Date.now() + expiryMinutes * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Build reset URL using CLIENT_URL env var (works in dev & production)
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailErr) {
      // Roll back token fields if email fails
      user.passwordResetToken   = null;
      user.passwordResetExpires = null;
      await user.save({ validateBeforeSave: false });
      console.error('[Auth] Failed to send reset email:', emailErr.message);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    res.status(200).json({
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (err) {
    console.error('[Auth] forgotPassword error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// @desc    Reset password using token from email
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the incoming raw token to compare with the stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // not expired yet
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });
    }

    // Update password and clear reset fields
    user.password             = newPassword; // pre-save hook will hash it
    user.passwordResetToken   = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('[Auth] resetPassword error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// @desc    Change password (logged-in user)
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Fetch user with their hashed password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update — pre-save hook will hash the new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('[Auth] changePassword error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { register, login, refresh, logout, getMe, updateProfile, forgotPassword, resetPassword, changePassword };
