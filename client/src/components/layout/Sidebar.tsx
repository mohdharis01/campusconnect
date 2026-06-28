import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  LayoutDashboard, FileText, BookOpen, Trophy, MessageSquare,
  Map, Bot, Users, Shield, X, Flame, Star, Compass
} from 'lucide-react';

interface SidebarProps { isOpen: boolean; onClose: () => void; }

const studentLinks = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/notes',        icon: FileText,         label: 'Notes' },
  { to: '/blogs',        icon: BookOpen,         label: 'Blogs' },
  { to: '/roadmaps',     icon: Map,              label: 'Roadmaps' },
  { to: '/discussions',  icon: MessageSquare,    label: 'Discussions' },
  { to: '/leaderboard',  icon: Trophy,           label: 'Leaderboard' },
  { to: '/chat',         icon: MessageSquare,    label: 'Messages' },
  { to: '/ai',           icon: Bot,              label: 'AI Assistant' },
];

const teacherLinks = [
  { to: '/teacher',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/notes',        icon: FileText,         label: 'Notes' },
  { to: '/blogs',        icon: BookOpen,         label: 'Blogs' },
  { to: '/roadmaps',     icon: Map,              label: 'Roadmaps' },
  { to: '/discussions',  icon: MessageSquare,    label: 'Discussions' },
];

const adminLinks = [
  { to: '/admin',        icon: Shield,           label: 'Admin Panel' },
  { to: '/notes',        icon: FileText,         label: 'Notes' },
  { to: '/blogs',        icon: BookOpen,         label: 'Blogs' },
  { to: '/discussions',  icon: MessageSquare,    label: 'Discussions' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useSelector((s: RootState) => s.auth);
  const links = user?.role === 'admin' ? adminLinks : user?.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <>
      {/* Overlay (mobile) */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed top-14 left-0 h-[calc(100vh-56px)] w-56 z-30
        bg-[#0d1117] border-r border-[#30363d]
        transform transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 flex flex-col
      `}>
        {/* Mobile close */}
        <div className="flex items-center justify-between p-3 lg:hidden border-b border-[#30363d]">
          <span className="font-bold text-white text-sm">Menu</span>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white"><X size={18} /></button>
        </div>

        {/* User quick stats */}
        {user && (
          <div className="p-3 border-b border-[#30363d]">
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <Flame size={12} className="text-orange-400" />
              <span>{user.streak} day streak</span>
              <Star size={12} className="text-yellow-400 ml-auto" />
              <span>Lv.{user.level}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link mb-0.5 ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="p-2 border-t border-[#30363d]">
          <NavLink to="/explore" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Compass size={16} />
            Explore
          </NavLink>
        </div>
      </aside>
    </>
  );
}
