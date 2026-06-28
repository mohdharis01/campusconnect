import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Flame, Zap, FileText, BookOpen, Trophy, ArrowRight, TrendingUp } from 'lucide-react';
import { RootState } from '@/store';
import api from '@/utils/api';
import { Note, Blog } from '@/utils/types';
import { XPBar, StatCard, CardSkeleton } from '@/components/ui/index';
import { getLevelTitle, timeAgo } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';

export default function Dashboard() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [recentBlogs, setRecentBlogs] = useState<Blog[]>([]);
  const [topUsers, setTopUsers]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [notesRes, blogsRes, lbRes] = await Promise.all([
          api.get('/notes?limit=4&sort=newest'),
          api.get('/blogs?limit=4&sort=newest'),
          api.get('/users/leaderboard?limit=5'),
        ]);
        setRecentNotes(notesRes.data.data);
        setRecentBlogs(blogsRes.data.data);
        setTopUsers(lbRes.data.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome back, {user.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-[#8b949e] text-sm">
              {user.streak > 0 ? `🔥 ${user.streak} day streak! Keep it up!` : 'Start your learning journey today!'}
            </p>
          </div>
          <div className="flex-shrink-0 text-center">
            <div className="text-4xl font-extrabold text-white">Lv.{user.level}</div>
            <div className="text-xs text-indigo-400">{getLevelTitle(user.level)}</div>
          </div>
        </div>
        <div className="mt-4">
          <XPBar xp={user.xp} level={user.level} showLabel />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total XP" value={user.xp} icon="⭐" color="yellow" />
        <StatCard label="Day Streak" value={`${user.streak} 🔥`} icon="🔥" color="orange" />
        <StatCard label="Notes Shared" value={user.notesCount} icon="📚" color="blue" />
        <StatCard label="Blogs Written" value={user.blogsCount} icon="✍️" color="green" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Upload Note', icon: '📤', to: '/notes/upload', color: 'from-blue-600/20 to-blue-700/20 border-blue-500/30' },
          { label: 'Write Blog', icon: '✍️', to: '/blogs/new', color: 'from-green-600/20 to-green-700/20 border-green-500/30' },
          { label: 'Explore Roadmaps', icon: '🗺️', to: '/roadmaps', color: 'from-purple-600/20 to-purple-700/20 border-purple-500/30' },
          { label: 'Ask AI', icon: '🤖', to: '/ai', color: 'from-orange-600/20 to-orange-700/20 border-orange-500/30' },
        ].map((a) => (
          <Link key={a.label} to={a.to}
            className={`card border bg-gradient-to-br ${a.color} p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform text-center`}>
            <span className="text-2xl">{a.icon}</span>
            <span className="text-xs font-medium text-white">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Notes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2"><FileText size={16} /> Recent Notes</h2>
            <Link to="/notes" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <Link key={note._id} to={`/notes/${note._id}`}
                  className="card-hover p-4 flex items-start gap-3 block">
                  <div className="text-2xl flex-shrink-0">📄</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{note.title}</div>
                    <div className="text-xs text-[#8b949e]">{note.subject} • {timeAgo(note.createdAt)}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#484f58]">
                      <span>❤️ {note.likesCount}</span>
                      <span>⬇️ {note.downloadsCount}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Recent Blogs */}
          <div className="flex items-center justify-between mt-6">
            <h2 className="font-semibold text-white flex items-center gap-2"><BookOpen size={16} /> Recent Blogs</h2>
            <Link to="/blogs" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(2)].map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : (
            <div className="space-y-3">
              {recentBlogs.map((blog) => (
                <Link key={blog._id} to={`/blogs/${blog.slug}`}
                  className="card-hover p-4 flex items-start gap-3 block">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm mb-1 line-clamp-1">{blog.title}</div>
                    <div className="flex items-center gap-2">
                      <Avatar src={blog.author.avatar} name={blog.author.name} size="sm" />
                      <span className="text-xs text-[#8b949e]">{blog.author.name} • {blog.readTime} min read</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#484f58]">
                      <span>❤️ {blog.likesCount}</span>
                      <span>💬 {blog.commentsCount}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard sidebar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><Trophy size={16} /> Top Students</h2>
            <Link to="/leaderboard" className="text-xs text-indigo-400 hover:text-indigo-300">
              Full board
            </Link>
          </div>
          <div className="card divide-y divide-[#30363d]">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}</div>
            ) : (
              topUsers.map((u, i) => (
                <Link key={u._id} to={`/profile/${u.username}`}
                  className="flex items-center gap-3 p-3 hover:bg-[#21262d] transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-600 text-white' : 'bg-[#21262d] text-[#8b949e]'
                  }`}>{i + 1}</div>
                  <Avatar src={u.avatar} name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{u.name}</div>
                    <div className="text-xs text-[#8b949e]">Lv.{u.level} • {u.xp.toLocaleString()} XP</div>
                  </div>
                  {i === 0 && <span>👑</span>}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
