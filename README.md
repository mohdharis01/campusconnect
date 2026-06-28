# 🎓 CampusConnect

> All-in-one learning, collaboration, and placement prep platform for college students.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Coming%20Soon-indigo?style=for-the-badge)](https://github.com/mohdharis01/campusconnect)
[![GitHub](https://img.shields.io/badge/GitHub-mohdharis01-black?style=for-the-badge&logo=github)](https://github.com/mohdharis01/campusconnect)

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 Auth | JWT + Refresh Tokens + Email Verification + Google/GitHub OAuth |
| 📚 Notes | Upload, search, filter, like, bookmark, download notes |
| ✍️ Blogs | Rich text editor, markdown, code blocks, categories |
| 🏆 Leaderboard | XP-based ranking — college-wide and global |
| 🗺️ Roadmaps | Curated DSA, Web Dev, Cloud, Placement paths |
| 💬 Discussions | Forum with upvotes, categories, solved answers |
| 🤖 AI Assistant | Groq AI (Llama 3.3) powered chatbot with session history |
| 💬 Real-time Chat | Socket.io private messaging with typing indicators |
| 🎮 Gamification | XP, Levels, Streaks, Badges |
| 🔔 Notifications | Real-time notifications for follows, likes, comments |
| 🛡️ Admin Panel | User management, banning, role assignment |
| 📱 Responsive | Mobile-first, multiple themes (Dark, Light, AMOLED, Hacker) |

---

## 🛠 Tech Stack

**Frontend:** React 18 · TypeScript · Tailwind CSS · Redux Toolkit · React Query · Framer Motion · TipTap Editor · Socket.io Client · Vite

**Backend:** Node.js · Express.js · MongoDB · Mongoose · Socket.io · JWT · Passport.js · Cloudinary

**AI:** Groq API (Llama 3.3 70B)

**Deploy:** Vercel (frontend) · Render (backend) · MongoDB Atlas (database)

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/mohdharis01/campusconnect.git
cd campusconnect
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server
npm install --legacy-peer-deps

# Install client dependencies
cd ../client
npm install --legacy-peer-deps
```

### 3. Set up environment

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb://localhost:27017/campusconnect

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GROQ_API_KEY=your_groq_api_key
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run in development

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Health: http://localhost:5000/api/health

---

## 🌐 Deployment

### Backend → Render
1. Go to [render.com](https://render.com) → New Web Service → Connect repo
2. Set root directory: `server`
3. Build command: `npm install --legacy-peer-deps`
4. Start command: `node index.js`
5. Add all environment variables

### Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) → Import repo
2. Set root directory: `client`
3. Add env variable: `VITE_API_URL=https://your-render-url.onrender.com/api`
4. Deploy!

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
└── README.md
```

---

## 🎮 Gamification System

| Action | XP Reward |
|---|---|
| Upload a note | +50 XP |
| Publish a blog | +80 XP |
| Enroll in roadmap | +20 XP |
| Complete a topic | +30 XP |
| Complete a level | +100 XP |
| Create discussion | +20 XP |

---

## 👨‍💻 Author

Built by **Mohd Haris** — B.Tech CSE 2026, Teerthanker Mahaveer University

- GitHub: [@mohdharis01](https://github.com/mohdharis01)
- LinkedIn: [linkedin.com/in/mohdharis01](https://linkedin.com/in/mohdharis01)

---

## 📄 License

MIT — free to use and modify.
