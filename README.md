# 🎓 CampusConnect

> All-in-one learning, collaboration, and networking platform for college students.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20App-indigo?style=for-the-badge)](https://your-live-url.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/yourusername/campusconnect)

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 Auth | JWT + Refresh Tokens + Google/GitHub OAuth |
| 📚 Notes | Upload, search, filter, like, bookmark, download notes |
| ✍️ Blogs | Rich text editor, markdown, code blocks, categories |
| 🏆 Leaderboard | XP-based ranking — college-wide and global |
| 🗺️ Roadmaps | Curated DSA, Web Dev, Cloud, Placement paths |
| 💬 Discussions | Forum with upvotes, categories, solved answers |
| 🤖 AI Assistant | OpenAI-powered chatbot with session history |
| 💬 Real-time Chat | Socket.io private messaging with typing indicators |
| 🎮 Gamification | XP, Levels, Streaks, Badges |
| 🛡️ Admin Panel | User management, banning, role assignment |
| 📱 Responsive | Mobile-first, dark/light themes |

---

## 🛠 Tech Stack

**Frontend:** React 18 · TypeScript · Tailwind CSS · Redux Toolkit · React Query · Framer Motion · TipTap Editor · Socket.io Client

**Backend:** Node.js · Express.js · MongoDB · Mongoose · Socket.io · JWT · Passport.js

**Services:** Cloudinary (files) · OpenAI API (AI) · MongoDB Atlas (DB)

**Deploy:** Vercel (frontend) · Render (backend)

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/campusconnect.git
cd campusconnect
```

### 2. Install all dependencies
```bash
npm run install:all
```

### 3. Set up environment
```bash
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and secrets
```

**Minimum required for local dev:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/campusconnect
JWT_SECRET=any-secret-string-here
JWT_REFRESH_SECRET=another-secret-string
CLIENT_URL=http://localhost:5173
```

### 4. Run in development
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend:  http://localhost:5000
- API docs: http://localhost:5000/api/health

---

## 🌐 Deployment

### Backend → Render
1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service → Connect repo
3. Set root directory: `server`
4. Build command: `npm install`
5. Start command: `node index.js`
6. Add environment variables from `.env.example`

### Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) → Import repo
2. Set root directory: `client`
3. Add env variable: `VITE_API_URL=https://your-render-url.onrender.com`
4. Deploy!

### Database → MongoDB Atlas
1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Get connection string
3. Add to `MONGO_URI` in Render dashboard

---

## 🔑 Adding API Keys (Later)

All keys are optional — the app runs without them in degraded mode:

| Key | Purpose | Get it |
|---|---|---|
| `CLOUDINARY_*` | File uploads | [cloudinary.com](https://cloudinary.com) |
| `OPENAI_API_KEY` | AI Assistant | [platform.openai.com](https://platform.openai.com) |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth | [console.cloud.google.com](https://console.cloud.google.com) |

---

## 📁 Project Structure

```
campusconnect/
├── server/
│   ├── config/         # DB, Cloudinary setup
│   ├── controllers/    # Business logic
│   ├── middleware/      # Auth, rate limiting
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── socket/         # Socket.io handlers
│   ├── utils/          # JWT, helpers, notifications
│   └── index.js        # Entry point
├── client/
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── hooks/      # Custom React hooks
│       ├── pages/      # All page components
│       ├── store/      # Redux slices
│       └── utils/      # API client, types, helpers
├── render.yaml         # Render deployment config
└── package.json        # Monorepo scripts
```

---

## 🎮 Gamification System

| Action | XP Reward |
|---|---|
| Upload a note | +50 XP |
| Publish a blog | +80 XP |
| Follow someone | +5 XP |
| Enroll in roadmap | +20 XP |
| Complete a topic | +30 XP |
| Complete a level | +100 XP |
| Like content | +1 XP |
| Add comment | +5 XP |

---

## 👨‍💻 Author

Built by **Mohd Haris** as a portfolio project demonstrating full-stack MERN development, real-time features, and production-ready architecture.

- GitHub: [@your-username](https://github.com/your-username)
- LinkedIn: [linkedin.com/in/your-profile](https://linkedin.com/in/your-profile)
- Live Demo: [campusconnect.vercel.app](https://campusconnect.vercel.app)

---

## 📄 License

MIT — free to use and modify.
