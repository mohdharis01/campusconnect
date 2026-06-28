// ─── Auth Routes ───────────────────────────────────────────────
const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const authRouter = express.Router();
authRouter.post('/register', authLimiter, authController.register);
authRouter.post('/login', authLimiter, authController.login);
authRouter.post('/logout', protect, authController.logout);
authRouter.post('/refresh', authController.refreshToken);
authRouter.get('/me', protect, authController.getMe);
authRouter.get('/verify-email/:token', authController.verifyEmail);
authRouter.post('/forgot-password', authLimiter, authController.forgotPassword);
authRouter.post('/reset-password/:token', authLimiter, authController.resetPassword);
authRouter.put('/change-password', protect, authController.changePassword);

// OAuth routes (only if configured)
if (process.env.GOOGLE_CLIENT_ID) {
  const passport = require('passport');
  authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  authRouter.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), authController.oauthSuccess);
}
if (process.env.GITHUB_CLIENT_ID) {
  const passport = require('passport');
  authRouter.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
  authRouter.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/login' }), authController.oauthSuccess);
}

// ─── User Routes ───────────────────────────────────────────────
const userController = require('../controllers/userController');
const { uploadProfile } = require('../config/cloudinary');
const { optionalAuth, protect: auth } = require('../middleware/auth');

const userRouter = express.Router();
userRouter.get('/search', userController.searchUsers);
userRouter.get('/leaderboard', userController.getLeaderboard);
userRouter.get('/:username/profile', optionalAuth, userController.getProfile);
userRouter.get('/:userId/followers', userController.getFollowers);
userRouter.get('/:userId/following', userController.getFollowing);
userRouter.get('/:userId/stats', userController.getUserStats);
userRouter.put('/profile', auth, userController.updateProfile);
userRouter.put('/avatar', auth, uploadProfile.single('avatar'), userController.updateAvatar);
userRouter.post('/:userId/follow', auth, userController.toggleFollow);
userRouter.get('/bookmarks', auth, userController.getBookmarks);

// ─── Note Routes ───────────────────────────────────────────────
const noteController = require('../controllers/noteController');
const { uploadNotes } = require('../config/cloudinary');
const { uploadLimiter } = require('../middleware/rateLimiter');

const noteRouter = express.Router();
noteRouter.get('/', optionalAuth, noteController.getNotes);
noteRouter.post('/', auth, uploadLimiter, uploadNotes.single('file'), noteController.uploadNote);
noteRouter.get('/:id', optionalAuth, noteController.getNoteById);
noteRouter.delete('/:id', auth, noteController.deleteNote);
noteRouter.post('/:id/like', auth, noteController.toggleLike);
noteRouter.post('/:id/bookmark', auth, noteController.toggleBookmark);
noteRouter.get('/:id/download', auth, noteController.downloadNote);
noteRouter.put('/:id/verify', auth, noteController.verifyNote); // teacher/admin
noteRouter.get('/:id/comments', noteController.getNoteComments);
noteRouter.post('/:id/comments', auth, noteController.addComment);

// ─── Blog Routes ───────────────────────────────────────────────
const blogController = require('../controllers/blogController');
const { uploadBlogImage } = require('../config/cloudinary');

const blogRouter = express.Router();
blogRouter.get('/', optionalAuth, blogController.getBlogs);
blogRouter.post('/', auth, uploadBlogImage.single('coverImage'), blogController.createBlog);
blogRouter.get('/my-drafts', auth, blogController.getMyDrafts);
blogRouter.get('/:slug', optionalAuth, blogController.getBlogBySlug);
blogRouter.put('/:id', auth, uploadBlogImage.single('coverImage'), blogController.updateBlog);
blogRouter.delete('/:id', auth, blogController.deleteBlog);
blogRouter.post('/:id/like', auth, blogController.toggleLike);
blogRouter.post('/:id/bookmark', auth, blogController.toggleBookmark);
blogRouter.get('/:id/comments', blogController.getBlogComments);
blogRouter.post('/:id/comments', auth, blogController.addComment);

// ─── Notification Routes ───────────────────────────────────────
const miscControllers = require('../controllers/miscControllers');

const notifRouter = express.Router();
notifRouter.get('/', auth, miscControllers.getNotifications);
notifRouter.put('/read', auth, miscControllers.markNotificationsRead);
notifRouter.delete('/:id', auth, miscControllers.deleteNotification);

// ─── Roadmap Routes ────────────────────────────────────────────
const roadmapRouter = express.Router();
roadmapRouter.get('/', optionalAuth, miscControllers.getRoadmaps);
roadmapRouter.post('/', auth, miscControllers.createRoadmap);
roadmapRouter.get('/:slug', optionalAuth, miscControllers.getRoadmapBySlug);
roadmapRouter.post('/:id/enroll', auth, miscControllers.enrollRoadmap);
roadmapRouter.put('/:id/progress', auth, miscControllers.updateProgress);

// ─── AI Routes ─────────────────────────────────────────────────
const { aiLimiter } = require('../middleware/rateLimiter');

const aiRouter = express.Router();
aiRouter.get('/sessions', auth, miscControllers.getAIChatSessions);
aiRouter.get('/sessions/:sessionId', auth, miscControllers.getChatSession);
aiRouter.post('/chat', auth, aiLimiter, miscControllers.sendAIMessage);
aiRouter.delete('/sessions/:sessionId', auth, miscControllers.deleteAISession);

// ─── Discussion Routes ─────────────────────────────────────────
const discussionRouter = express.Router();
discussionRouter.get('/', optionalAuth, miscControllers.getDiscussions);
discussionRouter.post('/', auth, miscControllers.createDiscussion);
discussionRouter.post('/:id/vote', auth, miscControllers.voteDiscussion);

// ─── Admin Routes ──────────────────────────────────────────────
const { adminOnly } = require('../middleware/auth');

const adminRouter = express.Router();
adminRouter.use(auth, adminOnly);
adminRouter.get('/stats', miscControllers.getAdminStats);
adminRouter.get('/users', miscControllers.getAllUsers);
adminRouter.put('/users/:id/ban', miscControllers.banUser);
adminRouter.put('/users/:id/unban', miscControllers.unbanUser);
adminRouter.put('/users/:id/role', miscControllers.updateUserRole);

module.exports = { authRouter, userRouter, noteRouter, blogRouter, notifRouter, roadmapRouter, aiRouter, discussionRouter, adminRouter };
