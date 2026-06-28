const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { sendTokenResponse, verifyRefreshToken, generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { AppError, asyncHandler, sendResponse } = require('../utils/helpers');

// ─── Register ──────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res, next) => {
  const { name, username, email, password, role } = req.body;

  const existingEmail = await User.findOne({ email });
  if (existingEmail) return next(new AppError('Email already registered', 409));

  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) return next(new AppError('Username already taken', 409));

  // Only allow student/teacher registration; admin is set manually
  const allowedRole = ['student', 'teacher'].includes(role) ? role : 'student';

  const user = await User.create({ name, username: username.toLowerCase(), email, password, role: allowedRole });

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email when email is configured
  // await sendVerificationEmail(user.email, verificationToken);

  sendTokenResponse(user, 201, res, 'Account created successfully! Please verify your email.');
});

// ─── Login ─────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) return next(new AppError('Please provide email and password', 400));

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user) return next(new AppError('Invalid credentials', 401));
  if (user.isBanned) return next(new AppError('Account suspended. Contact support.', 403));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new AppError('Invalid credentials', 401));

  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, 'Logged in successfully');
});

// ─── Refresh Token ─────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) return next(new AppError('No refresh token provided', 401));

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return next(new AppError('Invalid refresh token', 401));
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    return next(new AppError('Refresh token revoked', 401));
  }

  // Rotate refresh token
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  const newRefreshToken = generateRefreshToken(user._id);
  user.refreshTokens.push(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  const accessToken = generateAccessToken(user._id, user.role);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, 200, 'Token refreshed', { accessToken });
});

// ─── Logout ────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (token) {
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      await user.save({ validateBeforeSave: false });
    }
  }

  res.clearCookie('refreshToken');
  sendResponse(res, 200, 'Logged out successfully');
});

// ─── Get Me ────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('badges', 'name icon color');
  sendResponse(res, 200, 'User fetched', user);
});

// ─── Verify Email ──────────────────────────────────────────────
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Invalid or expired verification link', 400));

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  sendResponse(res, 200, 'Email verified successfully');
});

// ─── Forgot Password ───────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No account with that email', 404));

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // TODO: Send reset email when email is configured
  // await sendResetEmail(user.email, resetToken);

  sendResponse(res, 200, 'Password reset link sent to your email (configure email to receive it)', {
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
  });
});

// ─── Reset Password ────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Invalid or expired reset token', 400));

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successfully');
});

// ─── Change Password ───────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(req.body.currentPassword);
  if (!isMatch) return next(new AppError('Current password is incorrect', 400));

  user.password = req.body.newPassword;
  user.refreshTokens = []; // Invalidate all other sessions
  await user.save();

  sendTokenResponse(user, 200, res, 'Password changed successfully');
});

// ─── OAuth Success Handler ─────────────────────────────────────
exports.oauthSuccess = asyncHandler(async (req, res) => {
  // Called after passport strategy succeeds, req.user is set
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const accessToken = generateAccessToken(req.user._id, req.user.role);
  const refreshToken = generateRefreshToken(req.user._id);

  req.user.refreshTokens.push(refreshToken);
  await req.user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Redirect to frontend with token
  res.redirect(`${clientUrl}/oauth-callback?token=${accessToken}`);
});
