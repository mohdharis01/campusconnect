require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { errorHandler } = require('./utils/helpers');
const { apiLimiter } = require('./middleware/rateLimiter');
const {
  authRouter, userRouter, noteRouter, blogRouter,
  notifRouter, roadmapRouter, aiRouter, discussionRouter, adminRouter,
} = require('./routes');

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io Setup ───────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
initSocket(io);

// Make io available in controllers
app.set('io', io);

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Passport (OAuth) ──────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID || process.env.GITHUB_CLIENT_ID) {
  const passport = require('passport');
  const User = require('./models/User');

  app.use(passport.initialize());

  if (process.env.GOOGLE_CLIENT_ID) {
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            await user.save({ validateBeforeSave: false });
          } else {
            const username = profile.displayName.toLowerCase().replace(/\s/g, '') + Date.now().toString().slice(-4);
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              username,
              googleId: profile.id,
              avatar: profile.photos[0]?.value,
              isEmailVerified: true,
            });
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }));
  }

  if (process.env.GITHUB_CLIENT_ID) {
    const GitHubStrategy = require('passport-github2').Strategy;
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });
        if (!user) {
          const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
          user = await User.findOne({ email });
          if (user) {
            user.githubId = profile.id;
            await user.save({ validateBeforeSave: false });
          } else {
            user = await User.create({
              name: profile.displayName || profile.username,
              email,
              username: profile.username + Date.now().toString().slice(-4),
              githubId: profile.id,
              avatar: profile.photos[0]?.value,
              github: profile.profileUrl,
              isEmailVerified: true,
            });
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }));
  }
}

// ─── Rate Limiting ─────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/notes', noteRouter);
app.use('/api/blogs', blogRouter);
app.use('/api/notifications', notifRouter);
app.use('/api/roadmaps', roadmapRouter);
app.use('/api/ai', aiRouter);
app.use('/api/discussions', discussionRouter);
app.use('/api/admin', adminRouter);

// ─── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`
🚀 CampusConnect Server Running
   Port:        ${PORT}
   Environment: ${process.env.NODE_ENV || 'development'}
   API Base:    http://localhost:${PORT}/api
   Health:      http://localhost:${PORT}/api/health
    `);
  });
};

start();

module.exports = app;
