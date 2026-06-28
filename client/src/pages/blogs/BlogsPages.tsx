import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link2 from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import toast from 'react-hot-toast';
import { Heart, Bookmark, Clock, Eye, MessageSquare, Plus } from 'lucide-react';
import api from '@/utils/api';
import { Blog } from '@/utils/types';
import { RootState } from '@/store';
import { timeAgo, categoryColors, truncate } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';
import { CardSkeleton, EmptyState, Badge } from '@/components/ui/index';

const lowlight = createLowlight(common);

// ── Blogs List ─────────────────────────────────────────────────
export function BlogsPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', sort: 'newest', search: '' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBlogs = async (reset = false) => {
    const p = reset ? 1 : page;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '10', sort: filters.sort, ...(filters.category && { category: filters.category }), ...(filters.search && { search: filters.search }) });
      const { data } = await api.get(`/blogs?${params}`);
      setBlogs(reset ? data.data : (prev) => [...prev, ...data.data]);
      setHasMore(data.meta?.hasNextPage || false);
      if (!reset) setPage(p + 1);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { setPage(1); fetchBlogs(true); }, [filters]);

  const handleLike = async (blogId: string) => {
    if (!user) return toast.error('Please login');
    try {
      const { data } = await api.post(`/blogs/${blogId}/like`);
      setBlogs((prev) => prev.map((b) => b._id === blogId ? { ...b, isLiked: data.data.isLiked, likesCount: b.likesCount + (data.data.isLiked ? 1 : -1) } : b));
    } catch {}
  };

  const categories = ['dsa', 'web-dev', 'cloud', 'ai-ml', 'projects', 'placement', 'college', 'other'];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blogs</h1>
          <p className="text-[#8b949e] text-sm">Read and write technical content</p>
        </div>
        {user && (
          <Link to="/blogs/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Write Blog
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search blogs..." className="input text-sm" />
        </div>
        <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="input text-sm w-36">
          <option value="newest">Newest</option>
          <option value="popular">Most Liked</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilters({ ...filters, category: '' })} className={`badge cursor-pointer transition-colors ${!filters.category ? 'badge-primary' : 'badge-ghost hover:badge-primary'}`}>
          All
        </button>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilters({ ...filters, category: c })}
            className={`badge cursor-pointer transition-colors capitalize ${filters.category === c ? 'badge-primary' : 'badge-ghost'}`}>
            {c.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Blog list */}
      {loading && blogs.length === 0 ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : blogs.length === 0 ? (
        <EmptyState icon="✍️" title="No blogs yet" description="Be the first to share your knowledge!" />
      ) : (
        <>
          <div className="space-y-4">
            {blogs.map((blog) => (
              <div key={blog._id} className="card-hover p-5 flex flex-col md:flex-row gap-4">
                {blog.coverImage && (
                  <img src={blog.coverImage} alt={blog.title} className="w-full md:w-40 h-32 md:h-24 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge text-[10px] ${categoryColors[blog.category] || 'badge-ghost'}`}>
                      {blog.category?.replace('-', ' ')}
                    </span>
                    <span className="text-xs text-[#484f58]">{blog.readTime} min read</span>
                  </div>
                  <Link to={`/blogs/${blog.slug}`}>
                    <h2 className="font-semibold text-white hover:text-indigo-400 transition-colors line-clamp-2 mb-1">{blog.title}</h2>
                  </Link>
                  {blog.excerpt && <p className="text-sm text-[#8b949e] line-clamp-2 mb-3">{blog.excerpt}</p>}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar src={blog.author.avatar} name={blog.author.name} size="sm" />
                      <div>
                        <Link to={`/profile/${blog.author.username}`} className="text-xs font-medium text-white hover:text-indigo-400">{blog.author.name}</Link>
                        <div className="text-[10px] text-[#484f58]">{timeAgo(blog.publishedAt || blog.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[#484f58]">
                      <button onClick={() => handleLike(blog._id)} className={`flex items-center gap-1 text-xs transition-colors ${blog.isLiked ? 'text-red-400' : 'hover:text-red-400'}`}>
                        <Heart size={12} fill={blog.isLiked ? 'currentColor' : 'none'} /> {blog.likesCount}
                      </button>
                      <span className="flex items-center gap-1 text-xs"><Eye size={12} /> {blog.viewsCount}</span>
                      <span className="flex items-center gap-1 text-xs"><MessageSquare size={12} /> {blog.commentsCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <button onClick={() => fetchBlogs()} disabled={loading} className="btn-secondary">
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Blog Editor ────────────────────────────────────────────────
export function BlogEditorPage() {
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const [meta, setMeta] = useState({ title: '', category: 'other', tags: '', excerpt: '' });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your blog post...' }),
      Image,
      Link2.configure({ openOnClick: false }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
  });

  const save = async (status: 'draft' | 'published') => {
    if (!meta.title.trim()) return toast.error('Please add a title');
    const content = editor?.getHTML() || '';
    if (content.length < 50 && status === 'published') return toast.error('Blog content is too short');

    const fn = status === 'draft' ? setSaving : setPublishing;
    fn(true);
    try {
      const fd = new FormData();
      fd.append('title', meta.title);
      fd.append('content', content);
      fd.append('category', meta.category);
      fd.append('tags', JSON.stringify(meta.tags.split(',').map((t) => t.trim()).filter(Boolean)));
      fd.append('excerpt', meta.excerpt);
      fd.append('status', status);
      const { data } = await api.post('/blogs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(status === 'published' ? 'Blog published! +80 XP 🎉' : 'Draft saved');
      navigate(status === 'published' ? `/blogs/${data.data.slug}` : '/blogs');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
    fn(false);
  };

  const categories = ['dsa', 'web-dev', 'cloud', 'ai-ml', 'projects', 'placement', 'college', 'other'];

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Write a Blog</h1>
        <div className="flex gap-2">
          <button onClick={() => save('draft')} disabled={saving} className="btn-secondary text-sm">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => save('published')} disabled={publishing} className="btn-primary text-sm">
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="card p-5 space-y-4">
        <input
          value={meta.title}
          onChange={(e) => setMeta({ ...meta, title: e.target.value })}
          placeholder="Your blog title..."
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-[#484f58] outline-none"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <select value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })} className="input text-sm capitalize">
            {categories.map((c) => <option key={c} value={c}>{c.replace('-', ' ')}</option>)}
          </select>
          <input value={meta.tags} onChange={(e) => setMeta({ ...meta, tags: e.target.value })} placeholder="Tags: react, dsa, tips" className="input text-sm" />
          <input value={meta.excerpt} onChange={(e) => setMeta({ ...meta, excerpt: e.target.value })} placeholder="Short excerpt (optional)" className="input text-sm md:col-span-1" />
        </div>
      </div>

      {/* Editor toolbar */}
      <div className="card overflow-hidden">
        {editor && (
          <div className="flex flex-wrap gap-1 p-2 border-b border-[#30363d]">
            {[
              { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
              { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
              { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
              { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
              { label: '•', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
              { label: '1.', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
              { label: '<>', action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
              { label: '❝', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
            ].map(({ label, action, active }) => (
              <button key={label} onClick={action}
                className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'}`}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="min-h-[400px]">
          <EditorContent editor={editor} className="prose-sm" />
        </div>
      </div>
    </div>
  );
}
