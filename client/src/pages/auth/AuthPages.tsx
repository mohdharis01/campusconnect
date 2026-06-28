import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { login, register, clearError } from '@/store/authSlice';
import { RootState, AppDispatch } from '@/store';

// ── Login ──────────────────────────────────────────────────────
export function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((s: RootState) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    await dispatch(login(form));
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your CampusConnect account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#8b949e] mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@college.edu"
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-[#8b949e] mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="input pr-10"
              required
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-white">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
          {loading ? <><Loader size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-[#8b949e]">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create one</Link>
      </div>

      {/* Demo accounts */}
      <div className="mt-4 p-3 bg-[#21262d] rounded-lg">
        <p className="text-xs text-[#8b949e] mb-2 font-medium">Quick demo:</p>
        <div className="space-y-1.5">
          {[
            { label: 'Student', email: 'student@demo.com', pass: 'Demo@123' },
            { label: 'Teacher', email: 'teacher@demo.com', pass: 'Demo@123' },
            { label: 'Admin',   email: 'admin@demo.com',   pass: 'Demo@123' },
          ].map((d) => (
            <button key={d.label} onClick={() => setForm({ email: d.email, password: d.pass })}
              className="text-xs text-indigo-400 hover:text-indigo-300 block">
              {d.label}: {d.email}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}

// ── Register ───────────────────────────────────────────────────
export function RegisterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((s: RootState) => s.auth);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'student' });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    await dispatch(register(form));
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <AuthLayout title="Join CampusConnect" subtitle="Create your account and start your journey">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-[#8b949e] mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="John Doe" className="input" required />
          </div>
          <div>
            <label className="block text-sm text-[#8b949e] mb-1.5">Username</label>
            <input type="text" value={form.username} onChange={set('username')} placeholder="johndoe" className="input" required minLength={3} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-[#8b949e] mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@college.edu" className="input" required />
        </div>
        <div>
          <label className="block text-sm text-[#8b949e] mb-1.5">I am a...</label>
          <select value={form.role} onChange={set('role')} className="input">
            <option value="student">Student</option>
            <option value="teacher">Teacher / Mentor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-[#8b949e] mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="At least 6 characters"
              className="input pr-10"
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-white">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
          {loading ? <><Loader size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
        </button>
      </form>
      <div className="mt-4 text-center text-sm text-[#8b949e]">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
      </div>
    </AuthLayout>
  );
}

// ── Auth Layout ────────────────────────────────────────────────
function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold">
            <span>🎓</span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">CampusConnect</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-1">{title}</h1>
          <p className="text-[#8b949e] text-sm">{subtitle}</p>
        </div>
        <div className="card p-6">{children}</div>
      </motion.div>
    </div>
  );
}
