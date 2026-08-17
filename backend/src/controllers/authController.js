const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const { sendPasswordResetEmail, sendOTPEmail } = require('../utils/email');

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

const isStrongPassword = (pass) => {
  if (!pass || pass.length < 6) return false;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasDigit = /[0-9]/.test(pass);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth/refresh',
};

const issueTokens = async (user, res) => {
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  await User.findByIdAndUpdate(user._id, { refreshToken });
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  return accessToken;
};

const userPayload = (user) => ({
  _id:         user._id,
  username:    user.username,
  email:       user.email,
  displayName: user.displayName,
  avatar:      user.avatar,
  bio:         user.bio,
  isVerified:  user.isVerified,
});

// Helper to derive unique username
const generateUniqueUsername = async (baseName) => {
  let cleanBase = (baseName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14);
  if (!cleanBase || cleanBase.length < 3) cleanBase = 'user';

  let candidate = `${cleanBase}_${Math.floor(1000 + Math.random() * 9000)}`;
  let exists = await User.findOne({ username: candidate });
  while (exists) {
    candidate = `${cleanBase}_${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await User.findOne({ username: candidate });
  }
  return candidate;
};

// ─────────────────────────────────────────────
//  Controllers
// ─────────────────────────────────────────────

// @desc    Register Step 1: Request Registration & Send 6-Digit OTP (Data NOT added to DB yet)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { fullName, displayName, email, password, confirmPassword } = req.body;
    const name = fullName || displayName;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email address and password are required' });
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Password & confirmPassword check
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and Confirm Password must match' });
    }

    // Password strength check
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long and include an uppercase letter, lowercase letter, number, and special character.',
      });
    }

    // Check if user already exists in permanent database
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Clear any previous pending registration for this email
    await PendingUser.deleteMany({ email: normalizedEmail });

    // Store in PendingUser temporary collection (NOT User collection)
    await PendingUser.create({
      fullName: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      password, // User pre-save hook will hash it when permanently added to User model
      otp,
      otpExpires,
    });

    // Send 6-digit OTP via email
    await sendOTPEmail(normalizedEmail, otp);

    res.status(200).json({
      message: 'OTP sent to your email address. Please enter the 6-digit code to complete registration.',
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ message: 'Server error during registration request' });
  }
};

// @desc    Register Step 2: Verify OTP & Insert User into Database
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email address and OTP code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find pending user registration record
    const pending = await PendingUser.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(400).json({ message: 'No pending registration found for this email. Please register again.' });
    }

    if (pending.otpExpires < Date.now()) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res.status(400).json({ message: 'OTP code has expired. Please register again to get a new code.' });
    }

    if (pending.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check your email and try again.' });
    }

    // Double check email availability before creating permanent User
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Generate unique username
    const username = await generateUniqueUsername(pending.fullName || normalizedEmail.split('@')[0]);

    // ONLY NOW: Insert user document into permanent MongoDB collection!
    const user = await User.create({
      username,
      email: pending.email,
      password: pending.password, // Mongoose pre-save hook securely hashes password
      displayName: pending.fullName,
      isVerified: true,
    });

    // Remove pending registration record
    await PendingUser.deleteOne({ _id: pending._id });

    // Issue tokens and sign user in
    const accessToken = await issueTokens(user, res);

    res.status(201).json({
      message: 'Account created successfully.',
      accessToken,
      user: userPayload(user),
    });
  } catch (err) {
    console.error('[Auth] verifyOTP error:', err.message);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// @desc    Resend OTP to pending user
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const pending = await PendingUser.findOne({ email: normalizedEmail });

    if (!pending) {
      return res.status(400).json({ message: 'No pending registration found for this email address.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pending.otp = otp;
    pending.otpExpires = Date.now() + 10 * 60 * 1000;
    await pending.save();

    await sendOTPEmail(normalizedEmail, otp);

    res.status(200).json({
      message: 'A new 6-digit OTP code has been sent to your email address.',
    });
  } catch (err) {
    console.error('[Auth] resendOTP error:', err.message);
    res.status(500).json({ message: 'Server error while resending OTP' });
  }
};

// @desc    Login user (Email + Password strictly)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginEmail = (email || identifier || '').trim().toLowerCase();

    if (!loginEmail || !password) {
      return res.status(400).json({ message: 'Please provide email address and password' });
    }

    const user = await User.findOne({
      $or: [
        { email: loginEmail },
        { username: loginEmail },
      ],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
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

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Refresh token invalid or expired' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return res.status(401).json({ message: 'Refresh token reuse detected. Please log in again.' });
    }

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

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('friends', 'username displayName avatar');
  res.status(200).json({ user });
};

// @desc    Update profile
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

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    const rawToken  = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = Date.now() + expiryMinutes * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailErr) {
      console.log('[Email Fallback] Password Reset Link:', resetUrl);
    }

    res.status(200).json({
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (err) {
    console.error('[Auth] forgotPassword error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long and include an uppercase letter, lowercase letter, number, and special character.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });
    }

    user.password             = newPassword;
    user.passwordResetToken   = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('[Auth] resetPassword error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long and include an uppercase letter, lowercase letter, number, and special character.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('[Auth] changePassword error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
};
