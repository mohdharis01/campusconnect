const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('../utils/helpers');
const User = require('../models/User');

// Protect routes - requires valid JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password -refreshTokens -resetPasswordToken -emailVerificationToken');

    if (!user) return next(new AppError('User not found', 401));
    if (user.isBanned) return next(new AppError('Your account has been suspended', 403));
    if (!user.isActive) return next(new AppError('Account deactivated', 403));

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

// Optional auth - attaches user if token exists but doesn't block
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password -refreshTokens');
      if (user && !user.isBanned) req.user = user;
    }
  } catch {}
  next();
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required role: ${roles.join(' or ')}`, 403));
    }
    next();
  };
};

// Alias for common role checks
const studentOnly = restrictTo('student', 'teacher', 'admin');
const teacherOnly = restrictTo('teacher', 'admin');
const adminOnly = restrictTo('admin');

module.exports = { protect, optionalAuth, restrictTo, studentOnly, teacherOnly, adminOnly };
