import { formatDistanceToNow, format } from 'date-fns';

export const timeAgo = (date: string) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatDate = (date: string) =>
  format(new Date(date), 'MMM d, yyyy');

export const formatFileSize = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getVerificationLabel = (status: string) => {
  switch (status) {
    case 'teacher_verified': return { label: '✓ Teacher Verified', cls: 'verify-teacher' };
    case 'admin_verified':   return { label: '✓ Admin Verified',   cls: 'verify-admin' };
    default:                 return { label: 'Community',           cls: 'verify-community' };
  }
};

export const getLevelTitle = (level: number) => {
  const titles = ['', 'Newbie', 'Learner', 'Explorer', 'Coder', 'Developer',
    'Engineer', 'Architect', 'Expert', 'Master', 'Legend', 'God'];
  return titles[Math.min(level, 11)] || 'Legend';
};

export const getXPForNextLevel = (level: number) => {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, Infinity];
  return thresholds[Math.min(level, 11)];
};

export const getXPProgress = (xp: number, level: number) => {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  const current = thresholds[level - 1] || 0;
  const next = thresholds[level] || 5500;
  return Math.round(((xp - current) / (next - current)) * 100);
};

export const avatarFallback = (name: string) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'CC';

export const categoryColors: Record<string, string> = {
  dsa:        'bg-blue-500/20 text-blue-400',
  'web-dev':  'bg-green-500/20 text-green-400',
  frontend:   'bg-cyan-500/20 text-cyan-400',
  backend:    'bg-orange-500/20 text-orange-400',
  cloud:      'bg-sky-500/20 text-sky-400',
  'ai-ml':    'bg-purple-500/20 text-purple-400',
  placement:  'bg-yellow-500/20 text-yellow-400',
  college:    'bg-pink-500/20 text-pink-400',
  other:      'bg-gray-500/20 text-gray-400',
};

export const fileTypeIcon: Record<string, string> = {
  pdf: '📄', docx: '📝', ppt: '📊', pptx: '📊', zip: '📦',
};

export const truncate = (str: string, n: number) =>
  str?.length > n ? str.slice(0, n) + '…' : str;

export const cn = (...classes: (string | undefined | false | null)[]) =>
  classes.filter(Boolean).join(' ');
