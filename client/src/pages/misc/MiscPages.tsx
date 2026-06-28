import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Send, Bot, Trash2, Plus } from 'lucide-react';
import api from '@/utils/api';
import { RootState } from '@/store';
import { timeAgo } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';
import { CardSkeleton, EmptyState, Spinner, Tabs } from '@/components/ui/index';

// ════════════════════════════════════════════════════
// LEADERBOARD
// ════════════════════════════════════════════════════
export function LeaderboardPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'xp', college: '', semester: '' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchLeaderboard = async (reset = false) => {
    const p = reset ? 1 : page;
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: filters.type, page: String(p), limit: '20', ...(filters.college && { college: filters.college }), ...(filters.semester && { semester: filters.semester }) });
      const { data } = await api.get(`/users/leaderboard?${params}`);
      setUsers(reset ? data.data : (prev: any[]) => [...prev, ...data.data]);
      setHasMore(data.meta?.hasNextPage || false);
      if (!reset) setPage(p + 1);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { setPage(1); fetchLeaderboard(true); }, [filters]);

  const rankEmoji = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

  const tabs = [
    { id: 'xp', label: 'XP', icon: '⭐' },
    { id: 'notes', label: 'Notes', icon: '📚' },
    { id: 'blogs', label: 'Blogs', icon: '✍️' },
    { id: 'streak', label: 'Streak', icon: '🔥' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">🏆 Leaderboard</h1>
        <p className="text-[#8b949e] text-sm">Compete with students worldwide</p>
      </div>

      <Tabs tabs={tabs} active={filters.type} onChange={(id) => setFilters({ ...filters, type: id })} />

      <div className="flex gap-3">
        <input value={filters.college} onChange={(e) => setFilters({ ...filters, college: e.target.value })} placeholder="Filter by college..." className="input text-sm flex-1" />
        <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })} className="input text-sm w-36">
          <option value="">All Semesters</option>
          {[...Array(8)].map((_, i) => <option key={i+1} value={i+1}>Sem {i+1}</option>)}
        </select>
      </div>

      <div className="card divide-y divide-[#30363d]">
        {loading && users.length === 0 ? (
          <div className="p-4 space-y-3">{[...Array(10)].map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : users.length === 0 ? (
          <EmptyState icon="🏆" title="No data yet" description="Be the first to earn XP!" />
        ) : (
          users.map((u, i) => (
            <Link key={u._id} to={`/profile/${u.username}`}
              className={`flex items-center gap-4 p-4 hover:bg-[#21262d] transition-colors ${u._id === user?._id ? 'bg-indigo-500/5' : ''}`}>
              <div className={`text-lg font-bold w-10 text-center ${i < 3 ? 'text-2xl' : 'text-[#8b949e]'}`}>
                {rankEmoji(i)}
              </div>
              <Avatar src={u.avatar} name={u.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{u.name}</span>
                  {u._id === user?._id && <span className="badge-primary text-[10px]">You</span>}
                </div>
                <div className="text-xs text-[#8b949e]">@{u.username} • {u.college || 'Unknown College'}</div>
                <div className="text-xs text-[#484f58]">Lv.{u.level} • Sem {u.semester || '?'}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">
                  {filters.type === 'xp' && `${u.xp.toLocaleString()} XP`}
                  {filters.type === 'notes' && `${u.notesCount} Notes`}
                  {filters.type === 'blogs' && `${u.blogsCount} Blogs`}
                  {filters.type === 'streak' && `${u.streak} Days 🔥`}
                </div>
                <div className="text-xs text-[#484f58]">{u.streak > 0 ? `🔥 ${u.streak}d` : ''}</div>
              </div>
            </Link>
          ))
        )}
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <button onClick={() => fetchLeaderboard()} disabled={loading} className="btn-secondary">
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// AI ASSISTANT
// ════════════════════════════════════════════════════
export function AIAssistantPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<string>(() => uuidv4());
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await api.get('/ai/sessions');
        setSessions(data.data);
      } catch {}
    };
    fetchSessions();
  }, []);

  const loadSession = async (sessionId: string) => {
    setSessionLoading(true);
    setCurrentSession(sessionId);
    try {
      const { data } = await api.get(`/ai/sessions/${sessionId}`);
      setMessages(data.data.messages || []);
    } catch {}
    setSessionLoading(false);
  };

  const newChat = () => {
    setCurrentSession(uuidv4());
    setMessages([]);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { message: userMsg, sessionId: currentSession });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.data.message, timestamp: new Date() }]);
      // Refresh sessions list
      const sessRes = await api.get('/ai/sessions');
      setSessions(sessRes.data.data);
    } catch {
      toast.error('AI request failed');
    }
    setLoading(false);
  };

  const suggestions = [
    'Explain time complexity of quicksort',
    'Create a DSA study plan for 3 months',
    'Review my resume for a software engineer role',
    'What are common interview questions at Amazon?',
    'Explain the difference between BFS and DFS',
    'Suggest projects for a MERN stack developer',
  ];

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)] animate-fade-in">
      {/* Session sidebar */}
      <div className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-2">
        <button onClick={newChat} className="btn-primary flex items-center gap-2 text-sm w-full justify-center">
          <Plus size={14} /> New Chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map((s) => (
            <button key={s.sessionId} onClick={() => loadSession(s.sessionId)}
              className={`w-full text-left p-2.5 rounded-lg text-sm transition-colors ${s.sessionId === currentSession ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-[#8b949e] hover:bg-[#21262d] hover:text-white'}`}>
              <div className="truncate font-medium">{s.title || 'Untitled'}</div>
              <div className="text-[10px] text-[#484f58] mt-0.5">{timeAgo(s.updatedAt)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[#30363d]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot size={16} />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">CampusConnect AI</div>
            <div className="text-xs text-green-400 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Online</div>
          </div>
          <button onClick={newChat} className="ml-auto btn-ghost text-xs"><Plus size={14} className="inline mr-1" />New</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !sessionLoading && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="font-semibold text-white mb-2">CampusConnect AI</h3>
              <p className="text-[#8b949e] text-sm mb-6">Ask me anything about DSA, web dev, placement prep, or coding!</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg mx-auto">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setInput(s)}
                    className="text-left p-2.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs text-[#8b949e] hover:text-white transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sessionLoading && <div className="flex justify-center py-8"><Spinner /></div>}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${msg.role === 'assistant' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-green-500 to-teal-600'}`}>
                {msg.role === 'assistant' ? '🤖' : user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user?.name[0]}
              </div>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' ? 'bg-[#21262d] text-white rounded-tl-sm' : 'bg-indigo-600 text-white rounded-tr-sm'}`}>
                  {msg.content}
                </div>
                <div className="text-[10px] text-[#484f58]">{msg.timestamp ? timeAgo(msg.timestamp) : ''}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs">🤖</div>
              <div className="bg-[#21262d] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => <div key={i} className="w-2 h-2 bg-[#484f58] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#30363d]">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask anything..."
              className="input flex-1 text-sm"
              disabled={loading}
            />
            <button onClick={send} disabled={loading || !input.trim()} className="btn-primary p-2.5">
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-[#484f58] mt-1.5">Configure OPENAI_API_KEY for full AI responses</p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// ROADMAPS
// ════════════════════════════════════════════════════
export function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', difficulty: '' });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ ...(filters.category && { category: filters.category }), ...(filters.difficulty && { difficulty: filters.difficulty }) });
        const { data } = await api.get(`/roadmaps?${params}`);
        setRoadmaps(data.data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [filters]);

  const categories = ['dsa', 'web-dev', 'frontend', 'backend', 'cloud', 'ai-ml', 'placement'];
  const catIcons: Record<string, string> = { dsa: '🧠', 'web-dev': '🌐', frontend: '🎨', backend: '⚙️', cloud: '☁️', 'ai-ml': '🤖', placement: '💼' };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">🗺️ Roadmaps</h1>
        <p className="text-[#8b949e] text-sm">Follow curated learning paths and track your progress</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilters({ ...filters, category: '' })} className={`badge cursor-pointer ${!filters.category ? 'badge-primary' : 'badge-ghost'}`}>All</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilters({ ...filters, category: c })}
            className={`badge cursor-pointer ${filters.category === c ? 'badge-primary' : 'badge-ghost'}`}>
            {catIcons[c]} {c.replace('-', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : roadmaps.length === 0 ? (
        <EmptyState icon="🗺️" title="No roadmaps yet" description="Check back soon!" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roadmaps.map((r) => (
            <Link key={r._id} to={`/roadmaps/${r.slug}`} className="card-hover p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{catIcons[r.category] || '📚'}</div>
                {r.isOfficial && <span className="badge-primary text-[10px]">⭐ Official</span>}
              </div>
              <h3 className="font-semibold text-white mb-1">{r.title}</h3>
              <p className="text-sm text-[#8b949e] line-clamp-2 mb-3 flex-1">{r.description}</p>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`badge text-[10px] ${r.difficulty === 'beginner' ? 'badge-success' : r.difficulty === 'intermediate' ? 'badge-warning' : 'badge-danger'}`}>
                  {r.difficulty}
                </span>
                <span className="badge-ghost text-[10px]">~{r.estimatedWeeks}w</span>
                <span className="badge-ghost text-[10px]">{r.levels?.length || 0} levels</span>
              </div>
              {r.userProgress && (
                <div>
                  <div className="flex justify-between text-xs text-[#8b949e] mb-1">
                    <span>Progress</span><span>{r.userProgress.progressPercent}%</span>
                  </div>
                  <div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${r.userProgress.progressPercent}%` }} /></div>
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 text-xs text-[#484f58]">
                <span>👥 {r.enrolledCount} enrolled</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
