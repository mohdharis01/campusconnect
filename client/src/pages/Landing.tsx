import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Trophy, Bot, Users, Star, Zap } from 'lucide-react';

const features = [
  { icon: '📚', title: 'Notes Sharing', desc: 'Upload and discover verified study materials from peers and teachers.' },
  { icon: '✍️', title: 'Blog Platform', desc: 'Write technical blogs, tutorials, and share your knowledge with the community.' },
  { icon: '🗺️', title: 'Learning Roadmaps', desc: 'Follow curated roadmaps for DSA, Web Dev, Cloud, and more.' },
  { icon: '🏆', title: 'Leaderboards', desc: 'Compete with peers, earn XP, and climb college and global rankings.' },
  { icon: '🤖', title: 'AI Assistant', desc: 'Get instant help with concepts, code, resume reviews, and study plans.' },
  { icon: '💬', title: 'Discussions', desc: 'Ask questions, share experiences, and get help from the community.' },
];

const stats = [
  { value: '10K+', label: 'Students', icon: Users },
  { value: '5K+', label: 'Notes Shared', icon: BookOpen },
  { value: '2K+', label: 'Blogs Published', icon: Star },
  { value: '500+', label: 'Roadmap Topics', icon: Zap },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Navbar */}
      <nav className="border-b border-[#30363d] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🎓</span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">CampusConnect</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-[#8b949e] hover:text-white transition-colors text-sm font-medium">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-sm text-indigo-400 mb-6">
            <Zap size={14} /> The all-in-one student platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Learn. Share.
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent block">
              Grow Together.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[#8b949e] max-w-2xl mx-auto mb-10">
            CampusConnect combines notes sharing, blogging, roadmaps, leaderboards, and AI assistance — everything a college student needs to ace placements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary flex items-center gap-2 justify-center text-base px-8 py-3">
              Start Learning Free <ArrowRight size={18} />
            </Link>
            <Link to="/notes" className="btn-secondary flex items-center gap-2 justify-center text-base px-8 py-3">
              Browse Notes
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#30363d] py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label, icon: Icon }) => (
            <motion.div key={label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="space-y-1">
              <Icon size={20} className="mx-auto text-indigo-400 mb-2" />
              <div className="text-3xl font-bold text-white">{value}</div>
              <div className="text-[#8b949e] text-sm">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything you need to succeed</h2>
            <p className="text-[#8b949e] text-lg">One platform for your entire academic journey</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-hover p-6"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[#8b949e] text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification section */}
      <section className="py-24 px-6 bg-[#161b22]/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">Level up your learning 🎮</h2>
            <p className="text-[#8b949e] mb-6">Earn XP for every contribution, unlock badges, maintain streaks, and compete on leaderboards with students from your college and around the world.</p>
            <div className="space-y-3">
              {['🔥 Daily Streaks — keep your momentum going', '⭐ XP & Levels — track your growth', '🏅 Badges — earn recognition for achievements', '🏆 Leaderboards — compete college-wide & globally'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-[#c9d1d9]">{item}</div>
              ))}
            </div>
          </div>
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg">H</div>
              <div>
                <div className="font-semibold text-white">Haris</div>
                <div className="text-xs text-[#8b949e]">Level 7 • Engineer</div>
              </div>
              <div className="ml-auto badge-primary">🔥 14 days</div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-[#8b949e] mb-1"><span>Engineer → Architect</span><span>2,450 / 2,800 XP</span></div>
              <div className="xp-bar"><div className="xp-bar-fill" style={{ width: '87%' }} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[['12', 'Notes'], ['8', 'Blogs'], ['#3', 'Rank']].map(([val, lbl]) => (
                <div key={lbl} className="bg-[#21262d] rounded-lg p-2">
                  <div className="font-bold text-white">{val}</div>
                  <div className="text-xs text-[#8b949e]">{lbl}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {['🏆 Top 10', '📝 Notes Master', '🔥 30 Day Streak'].map((b) => (
                <span key={b} className="badge-primary text-xs">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-[#8b949e] mb-8">Join thousands of students already leveling up on CampusConnect.</p>
          <Link to="/register" className="btn-primary text-base px-10 py-3 inline-flex items-center gap-2">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#30363d] py-8 px-6 text-center text-[#8b949e] text-sm">
        <div className="flex items-center justify-center gap-2 mb-3 font-bold text-white">
          <span>🎓</span> CampusConnect
        </div>
        <p>Built for students, by students. © 2024 CampusConnect</p>
      </footer>
    </div>
  );
}
