import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { MessageSquare, UserPlus, UserMinus, Github, Linkedin, Globe, Edit, Send, Shield, Users, FileText, BookOpen, BarChart2, Trash2, CheckCircle } from 'lucide-react';
import api from '@/utils/api';
import { RootState, AppDispatch } from '@/store';
import { updateProfile } from '@/store/authSlice';
import { User, Note, Blog, Discussion, Message } from '@/utils/types';
import { timeAgo, getLevelTitle, getXPProgress, categoryColors } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';
import { XPBar, StatCard, CardSkeleton, EmptyState, Tabs, Modal, Spinner } from '@/components/ui/index';
import { getSocket } from '@/hooks/useSocket';

// ════════════════════════════════════════════════════
// PROFILE PAGE
// ════════════════════════════════════════════════════
export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [profile, setProfile] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('notes');
  const [following, setFollowing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const isOwn = currentUser?.username === username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/${username}/profile`);
        setProfile(data.data);
        setFollowing(data.data.isFollowing || false);

        const [notesRes, blogsRes] = await Promise.all([
          api.get(`/notes?limit=6&sort=newest`),
          api.get(`/blogs?limit=6&sort=newest&author=${data.data._id}`),
        ]);
        setNotes(notesRes.data.data.filter((n: Note) => n.author._id === data.data._id || n.author === data.data._id));
        setBlogs(blogsRes.data.data);
      } catch { toast.error('Profile not found'); }
      setLoading(false);
    };
    if (username) load();
  }, [username]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error('Please login');
    try {
      await api.post(`/users/${profile!._id}/follow`);
      setFollowing(!following);
      setProfile((p) => p ? { ...p, followersCount: p.followersCount + (following ? -1 : 1) } : p);
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!profile) return <EmptyState icon="👤" title="Profile not found" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Cover + Avatar */}
      <div className="card overflow-hidden">
        <div className="h-36 bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-pink-600/40 relative">
          {profile.coverImage && <img src={profile.coverImage} alt="cover" className="w-full h-full object-cover" />}
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <Avatar src={profile.avatar} name={profile.name} size="xl" className="ring-4 ring-[#0d1117]" />
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-[#0d1117]">
                {profile.level}
              </div>
            </div>
            <div className="flex gap-2 mt-14">
              {isOwn ? (
                <button onClick={() => setEditOpen(true)} className="btn-secondary flex items-center gap-2 text-sm">
                  <Edit size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={handleFollow} className={`flex items-center gap-2 text-sm ${following ? 'btn-secondary' : 'btn-primary'}`}>
                    {following ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
                  </button>
                  <Link to={`/chat/${profile._id}`} className="btn-secondary flex items-center gap-2 text-sm">
                    <MessageSquare size={14} /> Message
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
            <div className="text-[#8b949e] text-sm">@{profile.username} • <span className="text-indigo-400 capitalize">{profile.role}</span> • {getLevelTitle(profile.level)}</div>
            {profile.bio && <p className="text-[#c9d1d9] text-sm mt-2 max-w-2xl">{profile.bio}</p>}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-[#8b949e] mb-4">
            {profile.college && <span>🎓 {profile.college}</span>}
            {profile.branch && <span>📚 {profile.branch}</span>}
            {profile.semester && <span>📅 Sem {profile.semester}</span>}
          </div>

          <div className="flex gap-6 mb-4">
            {[['Notes', profile.notesCount], ['Blogs', profile.blogsCount], ['Followers', profile.followersCount], ['Following', profile.followingCount]].map(([label, val]) => (
              <div key={label as string} className="text-center">
                <div className="font-bold text-white">{(val as number).toLocaleString()}</div>
                <div className="text-xs text-[#8b949e]">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mb-4">
            {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="text-[#8b949e] hover:text-white"><Github size={18} /></a>}
            {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-[#8b949e] hover:text-blue-400"><Linkedin size={18} /></a>}
            {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="text-[#8b949e] hover:text-green-400"><Globe size={18} /></a>}
          </div>

          {/* XP bar */}
          <div className="max-w-sm">
            <XPBar xp={profile.xp} level={profile.level} showLabel />
          </div>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((skill) => <span key={skill} className="badge-ghost text-xs">{skill}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="XP Earned" value={profile.xp} icon="⭐" color="yellow" />
        <StatCard label="Day Streak" value={profile.streak} icon="🔥" color="orange" />
        <StatCard label="Badges" value={profile.badges?.length || 0} icon="🏅" color="purple" />
        <StatCard label="Level" value={profile.level} icon="🎮" color="blue" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[{ id: 'notes', label: 'Notes', icon: '📚' }, { id: 'blogs', label: 'Blogs', icon: '✍️' }, { id: 'badges', label: 'Badges', icon: '🏅' }]}
        active={tab}
        onChange={setTab}
      />

      {/* Tab content */}
      {tab === 'notes' && (
        <div className="grid md:grid-cols-2 gap-4">
          {notes.length === 0 ? <EmptyState icon="📚" title="No notes yet" /> : notes.map((n) => (
            <Link key={n._id} to={`/notes/${n._id}`} className="card-hover p-4">
              <div className="font-medium text-white text-sm mb-1 line-clamp-1">{n.title}</div>
              <div className="text-xs text-[#8b949e]">{n.subject} • {timeAgo(n.createdAt)}</div>
              <div className="flex gap-3 mt-2 text-xs text-[#484f58]">
                <span>❤️ {n.likesCount}</span><span>⬇️ {n.downloadsCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'blogs' && (
        <div className="space-y-3">
          {blogs.length === 0 ? <EmptyState icon="✍️" title="No blogs yet" /> : blogs.map((b) => (
            <Link key={b._id} to={`/blogs/${b.slug}`} className="card-hover p-4 block">
              <div className="font-medium text-white mb-1 line-clamp-1">{b.title}</div>
              <div className="text-xs text-[#8b949e]">{timeAgo(b.publishedAt || b.createdAt)} • {b.readTime} min read</div>
              <div className="flex gap-3 mt-2 text-xs text-[#484f58]">
                <span>❤️ {b.likesCount}</span><span>👁️ {b.viewsCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(!profile.badges || profile.badges.length === 0) ? <EmptyState icon="🏅" title="No badges yet" /> : profile.badges.map((b: any) => (
            <div key={b._id} className="card p-4 text-center">
              <div className="text-4xl mb-2">{b.icon}</div>
              <div className="font-medium text-white text-sm">{b.name}</div>
              {b.description && <div className="text-xs text-[#8b949e] mt-1">{b.description}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditProfileModal isOpen={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

function EditProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const [form, setForm] = useState({
    name: user?.name || '', bio: user?.bio || '', college: user?.college || '',
    degree: user?.degree || '', branch: user?.branch || '', semester: user?.semester || '',
    skills: user?.skills?.join(', ') || '', github: user?.github || '',
    linkedin: user?.linkedin || '', website: user?.website || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      await dispatch(updateProfile({
        ...form,
        semester: form.semester ? Number(form.semester) : undefined,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      }));
      toast.success('Profile updated!');
      onClose();
    } catch { toast.error('Failed to update'); }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <div className="space-y-3">
        <div><label className="block text-xs text-[#8b949e] mb-1">Name</label><input value={form.name} onChange={set('name')} className="input text-sm" /></div>
        <div><label className="block text-xs text-[#8b949e] mb-1">Bio</label><textarea value={form.bio} onChange={set('bio')} className="input text-sm min-h-[80px] resize-none" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-[#8b949e] mb-1">College</label><input value={form.college} onChange={set('college')} className="input text-sm" /></div>
          <div><label className="block text-xs text-[#8b949e] mb-1">Branch</label><input value={form.branch} onChange={set('branch')} className="input text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-[#8b949e] mb-1">Degree</label><input value={form.degree} onChange={set('degree')} className="input text-sm" /></div>
          <div><label className="block text-xs text-[#8b949e] mb-1">Semester</label>
            <select value={form.semester} onChange={set('semester')} className="input text-sm">
              <option value="">Select</option>
              {[...Array(8)].map((_, i) => <option key={i+1} value={i+1}>Sem {i+1}</option>)}
            </select>
          </div>
        </div>
        <div><label className="block text-xs text-[#8b949e] mb-1">Skills (comma separated)</label><input value={form.skills} onChange={set('skills')} placeholder="React, Node.js, DSA" className="input text-sm" /></div>
        <div><label className="block text-xs text-[#8b949e] mb-1">GitHub URL</label><input value={form.github} onChange={set('github')} className="input text-sm" /></div>
        <div><label className="block text-xs text-[#8b949e] mb-1">LinkedIn URL</label><input value={form.linkedin} onChange={set('linkedin')} className="input text-sm" /></div>
        <div><label className="block text-xs text-[#8b949e] mb-1">Website</label><input value={form.website} onChange={set('website')} className="input text-sm" /></div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════
// DISCUSSIONS PAGE
// ════════════════════════════════════════════════════
export function DiscussionsPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', sort: 'newest', search: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', tags: '' });
  const [creating, setCreating] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: filters.sort, ...(filters.category && { category: filters.category }), ...(filters.search && { search: filters.search }) });
      const { data } = await api.get(`/discussions?${params}`);
      setDiscussions(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [filters]);

  const createDiscussion = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content required');
    setCreating(true);
    try {
      const { data } = await api.post('/discussions', { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) });
      setDiscussions((prev) => [data.data, ...prev]);
      setShowCreate(false);
      setForm({ title: '', content: '', category: 'general', tags: '' });
      toast.success('Discussion created! +20 XP');
    } catch { toast.error('Failed to create'); }
    setCreating(false);
  };

  const vote = async (id: string, v: 'up' | 'down') => {
    if (!user) return toast.error('Login required');
    try {
      await api.post(`/discussions/${id}/vote`, { vote: v });
      fetch();
    } catch {}
  };

  const categories = ['dsa', 'web-dev', 'cloud', 'ai-ml', 'projects', 'placement', 'college', 'general'];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">💬 Discussions</h1>
          <p className="text-[#8b949e] text-sm">Ask questions, share knowledge</p>
        </div>
        {user && <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ Ask Question</button>}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-5 space-y-3 animate-slide-down">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Your question..." className="input" />
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Describe your question in detail..." className="input min-h-[100px] resize-none text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input text-sm">
              {categories.map((c) => <option key={c} value={c}>{c.replace('-', ' ')}</option>)}
            </select>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags: react, bfs, sql" className="input text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={createDiscussion} disabled={creating} className="btn-primary text-sm">{creating ? 'Posting...' : 'Post Question'}</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['', ...categories].map((c) => (
          <button key={c} onClick={() => setFilters({ ...filters, category: c })}
            className={`badge cursor-pointer capitalize ${filters.category === c ? 'badge-primary' : 'badge-ghost'}`}>
            {c || 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : discussions.length === 0 ? (
        <EmptyState icon="💬" title="No discussions yet" action={user ? { label: 'Ask First Question', onClick: () => setShowCreate(true) } : undefined} />
      ) : (
        <div className="space-y-3">
          {discussions.map((d) => (
            <div key={d._id} className="card-hover p-4 flex gap-4">
              {/* Vote */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button onClick={() => vote(d._id, 'up')} className="text-[#484f58] hover:text-green-400 transition-colors text-lg">▲</button>
                <span className={`text-sm font-bold ${d.upvoteCount > 0 ? 'text-green-400' : d.upvoteCount < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>{d.upvoteCount}</span>
                <button onClick={() => vote(d._id, 'down')} className="text-[#484f58] hover:text-red-400 transition-colors text-lg">▼</button>
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {d.isSolved && <span className="badge-success text-[10px]">✓ Solved</span>}
                  <span className={`badge text-[10px] ${categoryColors[d.category] || 'badge-ghost'}`}>{d.category}</span>
                  {d.tags?.map((t) => <span key={t} className="badge-ghost text-[10px]">{t}</span>)}
                </div>
                <h3 className="font-semibold text-white mb-1 hover:text-indigo-400 cursor-pointer line-clamp-2">{d.title}</h3>
                <p className="text-sm text-[#8b949e] line-clamp-2 mb-2">{d.content}</p>
                <div className="flex items-center gap-3 text-xs text-[#484f58]">
                  <div className="flex items-center gap-1">
                    <Avatar src={d.author.avatar} name={d.author.name} size="sm" />
                    <span>{d.author.name}</span>
                  </div>
                  <span>💬 {d.commentsCount}</span>
                  <span>{timeAgo(d.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// CHAT PAGE
// ════════════════════════════════════════════════════
export function ChatPage() {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useSelector((s: RootState) => s.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [receiver, setReceiver] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!userId) return;
    const loadChat = async () => {
      setLoading(true);
      try {
        const [profileRes] = await Promise.all([api.get(`/users/${userId}/profile`)]);
        setReceiver(profileRes.data.data);
      } catch {}
      setLoading(false);
    };
    loadChat();
  }, [userId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('message:receive', (msg: Message) => {
      if (msg.sender._id === userId || (msg.sender as any) === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('typing:start', ({ senderId }: any) => {
      if (senderId === userId) setIsTyping(true);
    });

    socket.on('typing:stop', ({ senderId }: any) => {
      if (senderId === userId) setIsTyping(false);
    });

    return () => {
      socket.off('message:receive');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [userId]);

  const handleInputChange = (val: string) => {
    setInput(val);
    const socket = getSocket();
    if (socket && userId) {
      socket.emit('typing:start', { receiverId: userId });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => socket.emit('typing:stop', { receiverId: userId }), 1500);
    }
  };

  const send = () => {
    const socket = getSocket();
    if (!socket || !input.trim() || !userId) return;
    const optimisticMsg: any = { _id: Date.now().toString(), sender: user!, content: input.trim(), createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimisticMsg]);
    socket.emit('message:send', { receiverId: userId, content: input.trim() });
    setInput('');
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <EmptyState icon="💬" title="Select a conversation" description="Choose someone to message" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-120px)] card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#30363d]">
        {receiver ? (
          <>
            <Avatar src={receiver.avatar} name={receiver.name} size="md" />
            <div>
              <div className="font-semibold text-white">{receiver.name}</div>
              <div className="text-xs text-[#8b949e]">@{receiver.username}</div>
            </div>
          </>
        ) : <Spinner />}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <div className="flex justify-center"><Spinner /></div>}
        {messages.length === 0 && !loading && (
          <div className="text-center text-[#484f58] text-sm py-8">
            No messages yet. Say hi! 👋
          </div>
        )}
        {messages.map((msg) => {
          const isMe = (msg.sender as any)?._id === user?._id || (msg.sender as any) === user?._id;
          return (
            <div key={msg._id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              <Avatar src={isMe ? user?.avatar : receiver?.avatar} name={isMe ? user?.name || '' : receiver?.name || ''} size="sm" />
              <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#21262d] text-white rounded-tl-sm'}`}>
                {msg.content}
                <div className={`text-[10px] mt-0.5 ${isMe ? 'text-indigo-200' : 'text-[#484f58]'}`}>{timeAgo(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex gap-2">
            <Avatar src={receiver?.avatar} name={receiver?.name || ''} size="sm" />
            <div className="bg-[#21262d] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">{[...Array(3)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#484f58] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#30363d] flex gap-2">
        <input
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="input flex-1 text-sm"
        />
        <button onClick={send} disabled={!input.trim()} className="btn-primary p-2.5">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// ADMIN PANEL
// ════════════════════════════════════════════════════
export function AdminPanel() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, usersRes] = await Promise.all([api.get('/admin/stats'), api.get('/admin/users?limit=20')]);
        setStats(statsRes.data.data);
        setUsers(usersRes.data.data);
      } catch { toast.error('Failed to load admin data'); }
      setLoading(false);
    };
    load();
  }, []);

  const banUser = async (id: string, isBanned: boolean) => {
    try {
      await api.put(`/admin/users/${id}/${isBanned ? 'unban' : 'ban'}`, { reason: 'Policy violation' });
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBanned: !isBanned } : u));
      toast.success(isBanned ? 'User unbanned' : 'User banned');
    } catch { toast.error('Failed'); }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-[#8b949e] text-sm">Manage the CampusConnect platform</p>
        </div>
      </div>

      <Tabs
        tabs={[{ id: 'overview', label: 'Overview', icon: '📊' }, { id: 'users', label: 'Users', icon: '👥' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && stats && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="blue" />
            <StatCard label="Notes Shared" value={stats.totalNotes} icon="📚" color="green" />
            <StatCard label="Blogs Published" value={stats.totalBlogs} icon="✍️" color="purple" />
            <StatCard label="Discussions" value={stats.totalDiscussions} icon="💬" color="orange" />
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-4">Recent Users</h2>
            <div className="space-y-3">
              {stats.recentUsers?.map((u: any) => (
                <div key={u._id} className="flex items-center gap-3">
                  <Avatar src={u.avatar} name={u.name} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{u.name}</div>
                    <div className="text-xs text-[#8b949e]">{u.email} • {u.role}</div>
                  </div>
                  <div className="text-xs text-[#484f58]">{timeAgo(u.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[#30363d]">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input text-sm" />
          </div>
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : (
            <div className="divide-y divide-[#30363d]">
              {users.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).map((u) => (
                <div key={u._id} className="flex items-center gap-3 p-4">
                  <Avatar src={u.avatar} name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{u.name}</div>
                    <div className="text-xs text-[#8b949e] truncate">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                      className="input text-xs py-1 w-24"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => banUser(u._id, u.isBanned)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${u.isBanned ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// SETTINGS PAGE
// ════════════════════════════════════════════════════
export function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const [tab, setTab] = useState('profile');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
    if (passwords.newPassword.length < 6) return toast.error('Minimum 6 characters');
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  const updateTheme = async (theme: string) => {
    try {
      await dispatch(updateProfile({ theme } as any));
      toast.success('Theme updated');
    } catch {}
  };

  const themes = [
    { id: 'dark', label: 'Dark', color: '#0d1117' },
    { id: 'light', label: 'Light', color: '#f6f8fa' },
    { id: 'amoled', label: 'AMOLED', color: '#000000' },
    { id: 'github', label: 'GitHub', color: '#161b22' },
    { id: 'hacker', label: 'Hacker', color: '#0d0d0d' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>

      <Tabs
        tabs={[{ id: 'profile', label: 'Account' }, { id: 'security', label: 'Security' }, { id: 'appearance', label: 'Appearance' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'profile' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white">Account Info</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#8b949e]">Name</span><div className="text-white mt-0.5">{user?.name}</div></div>
            <div><span className="text-[#8b949e]">Username</span><div className="text-white mt-0.5">@{user?.username}</div></div>
            <div><span className="text-[#8b949e]">Email</span><div className="text-white mt-0.5">{user?.email}</div></div>
            <div><span className="text-[#8b949e]">Role</span><div className="text-white mt-0.5 capitalize">{user?.role}</div></div>
            <div><span className="text-[#8b949e]">Level</span><div className="text-white mt-0.5">{user?.level} — {getLevelTitle(user?.level || 1)}</div></div>
            <div><span className="text-[#8b949e]">Total XP</span><div className="text-white mt-0.5">{user?.xp.toLocaleString()}</div></div>
          </div>
          <p className="text-xs text-[#484f58]">To edit profile details, go to your profile page and click Edit Profile.</p>
        </div>
      )}

      {tab === 'security' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white">Change Password</h2>
          <div>
            <label className="block text-xs text-[#8b949e] mb-1">Current Password</label>
            <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8b949e] mb-1">New Password</label>
            <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8b949e] mb-1">Confirm New Password</label>
            <input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="input text-sm" />
          </div>
          <button onClick={changePassword} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white">Theme</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {themes.map((t) => (
              <button key={t.id} onClick={() => updateTheme(t.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${user?.theme === t.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#30363d] hover:border-indigo-500/50'}`}>
                <div className="w-8 h-8 rounded-full border border-[#30363d]" style={{ background: t.color }} />
                <span className="text-xs text-white">{t.label}</span>
                {user?.theme === t.id && <CheckCircle size={12} className="text-indigo-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
