const rateLimit = require('express-rate-limit');

const createLimiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
  });

const authLimiter = createLimiter(15, 10, 'Too many auth attempts. Try again in 15 minutes.');
const apiLimiter = createLimiter(1, 100, 'Too many requests. Please slow down.');
const uploadLimiter = createLimiter(60, 20, 'Upload limit reached. Try again in an hour.');
const aiLimiter = createLimiter(60, 30, 'AI request limit reached. Try again in an hour.');

module.exports = { authLimiter, apiLimiter, uploadLimiter, aiLimiter };
