import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Search, Upload, Filter, Heart, Download, Bookmark, Eye } from 'lucide-react';
import api from '@/utils/api';
import { Note } from '@/utils/types';
import { RootState } from '@/store';
import { formatFileSize, getVerificationLabel, timeAgo, categoryColors } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';
import { CardSkeleton, EmptyState, Badge } from '@/components/ui/index';

// ── Notes List ─────────────────────────────────────────────────
export function NotesPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ subject: '', semester: '', fileType: '', sort: 'newest' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotes = async (reset = false) => {
    const p = reset ? 1 : page;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12', sort: filters.sort, ...(search && { search }), ...(filters.subject && { subject: filters.subject }), ...(filters.semester && { semester: filters.semester }), ...(filters.fileType && { fileType: filters.fileType }) });
      const { data } = await api.get(`/notes?${params}`);
      const newNotes = data.data;
      setNotes(reset ? newNotes : (prev) => [...prev, ...newNotes]);
      setHasMore(data.meta?.hasNextPage || false);
      if (!reset) setPage(p + 1);
    } catch { toast.error('Failed to load notes'); }
    setLoading(false);
  };

  useEffect(() => { setPage(1); fetchNotes(true); }, [search, filters]);

  const handleLike = async (noteId: string) => {
    if (!user) return toast.error('Please login to like');
    try {
      const { data } = await api.post(`/notes/${noteId}/like`);
      setNotes((prev) => prev.map((n) => n._id === noteId ? { ...n, isLiked: data.data.isLiked, likesCount: n.likesCount + (data.data.isLiked ? 1 : -1) } : n));
    } catch { toast.error('Failed to like note'); }
  };

  const handleBookmark = async (noteId: string) => {
    if (!user) return toast.error('Please login to bookmark');
    try {
      const { data } = await api.post(`/notes/${noteId}/bookmark`);
      setNotes((prev) => prev.map((n) => n._id === noteId ? { ...n, isBookmarked: data.data.isBookmarked } : n));
      toast.success(data.data.isBookmarked ? 'Bookmarked!' : 'Removed bookmark');
    } catch { toast.error('Failed to bookmark'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notes</h1>
          <p className="text-[#8b949e] text-sm">Discover and share study materials</p>
        </div>
        {user && (
          <Link to="/notes/upload" className="btn-primary flex items-center gap-2 text-sm">
            <Upload size={15} /> Upload Note
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484f58]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes by title, subject, or tags..." className="input pl-9" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input placeholder="Subject (e.g. OS, DBMS)" value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })} className="input text-sm" />
          <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })} className="input text-sm">
            <option value="">All Semesters</option>
            {[...Array(8)].map((_, i) => <option key={i + 1} value={i + 1}>Semester {i + 1}</option>)}
          </select>
          <select value={filters.fileType} onChange={(e) => setFilters({ ...filters, fileType: e.target.value })} className="input text-sm">
            <option value="">All Types</option>
            {['pdf', 'docx', 'ppt', 'pptx', 'zip'].map((t) => <option key={t} value={t}>.{t.toUpperCase()}</option>)}
          </select>
          <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="input text-sm">
            <option value="newest">Newest</option>
            <option value="popular">Most Liked</option>
            <option value="downloads">Most Downloaded</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      {loading && notes.length === 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState icon="📚" title="No notes found" description="Be the first to upload notes for this topic!" action={user ? { label: 'Upload Note', onClick: () => {} } : undefined} />
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => {
              const verif = getVerificationLabel(note.verificationStatus);
              return (
                <div key={note._id} className="card-hover p-4 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{note.fileType === 'pdf' ? '📄' : note.fileType === 'ppt' || note.fileType === 'pptx' ? '📊' : note.fileType === 'docx' ? '📝' : '📦'}</div>
                    <span className={verif.cls + ' badge text-[10px]'}>{verif.label}</span>
                  </div>
                  <Link to={`/notes/${note._id}`} className="flex-1">
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 hover:text-indigo-400 transition-colors">{note.title}</h3>
                    <p className="text-xs text-[#8b949e] mb-2 line-clamp-2">{note.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="badge-ghost text-[10px]">{note.subject}</span>
                      {note.semester && <span className="badge-ghost text-[10px]">Sem {note.semester}</span>}
                      {note.fileType && <span className="badge-ghost text-[10px]">.{note.fileType.toUpperCase()}</span>}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#30363d]">
                    <Avatar src={note.author.avatar} name={note.author.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{note.author.name}</div>
                      <div className="text-[10px] text-[#484f58]">{timeAgo(note.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleLike(note._id)} className={`p-1 rounded transition-colors ${note.isLiked ? 'text-red-400' : 'text-[#484f58] hover:text-red-400'}`}>
                        <Heart size={13} fill={note.isLiked ? 'currentColor' : 'none'} />
                      </button>
                      <span className="text-[10px] text-[#484f58]">{note.likesCount}</span>
                      <button onClick={() => handleBookmark(note._id)} className={`p-1 ml-1 rounded transition-colors ${note.isBookmarked ? 'text-yellow-400' : 'text-[#484f58] hover:text-yellow-400'}`}>
                        <Bookmark size={13} fill={note.isBookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <button onClick={() => fetchNotes()} disabled={loading} className="btn-secondary">
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Upload Note ────────────────────────────────────────────────
export function UploadNotePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', subject: '', semester: '', branch: '', tags: '' });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    if (!form.title || !form.subject) return toast.error('Title and subject are required');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, k === 'tags' ? JSON.stringify(v.split(',').map((t) => t.trim()).filter(Boolean)) : v); });
      await api.post('/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Note uploaded! +50 XP 🎉');
      navigate('/notes');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Upload Note</h1>
        <p className="text-[#8b949e] text-sm">Share your study materials and earn 50 XP</p>
      </div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        {/* File drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-indigo-500 bg-indigo-500/5' : 'border-[#30363d] hover:border-indigo-500/50'}`}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx,.ppt,.pptx,.zip" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <div>
              <div className="text-3xl mb-2">📎</div>
              <div className="text-sm font-medium text-white">{file.name}</div>
              <div className="text-xs text-[#8b949e]">{formatFileSize(file.size)}</div>
            </div>
          ) : (
            <div>
              <Upload size={32} className="mx-auto text-[#484f58] mb-2" />
              <div className="text-sm text-white mb-1">Click to upload or drag & drop</div>
              <div className="text-xs text-[#484f58]">PDF, DOCX, PPT, PPTX, ZIP — up to 50MB</div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-[#8b949e] mb-1.5">Title *</label>
          <input value={form.title} onChange={set('title')} placeholder="e.g. Complete OS Notes - Unit 1-5" className="input" required />
        </div>
        <div>
          <label className="block text-sm text-[#8b949e] mb-1.5">Description</label>
          <textarea value={form.description} onChange={set('description')} placeholder="What does this note cover? Any important topics?" className="input min-h-[80px] resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-[#8b949e] mb-1.5">Subject *</label>
            <input value={form.subject} onChange={set('subject')} placeholder="e.g. Operating Systems" className="input" required />
          </div>
          <div>
            <label className="block text-sm text-[#8b949e] mb-1.5">Branch</label>
            <input value={form.branch} onChange={set('branch')} placeholder="e.g. CSE, ECE" className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-[#8b949e] mb-1.5">Semester</label>
            <select value={form.semester} onChange={set('semester')} className="input">
              <option value="">Select Semester</option>
              {[...Array(8)].map((_, i) => <option key={i + 1} value={i + 1}>Semester {i + 1}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#8b949e] mb-1.5">Tags</label>
            <input value={form.tags} onChange={set('tags')} placeholder="os, memory, processes" className="input" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading || !file} className="btn-primary flex-1">
            {loading ? 'Uploading...' : 'Upload Note ✨'}
          </button>
        </div>
      </form>
    </div>
  );
}
