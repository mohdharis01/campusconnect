import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Search, Menu, X, LogOut, Settings, User as UserIcon, Zap } from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { logout } from '@/store/authSlice';
import { markAllRead } from '@/store/notifSlice';
import Avatar from '@/components/ui/Avatar';
import { timeAgo } from '@/utils/helpers';
import { XPBar } from '@/components/ui/index';

interface NavbarProps { onMenuClick: () => void; }

export default function Navbar({ onMenuClick }: NavbarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const { notifications, unreadCount } = useSelector((s: RootState) => s.notifications);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#161b22]/95 backdrop-blur-md border-b border-[#30363d] flex items-center px-4 gap-3">
      {/* Mobile menu button */}
      <button onClick={onMenuClick} className="lg:hidden text-[#8b949e] hover:text-white p-1">
        <Menu size={20} />
      </button>

      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 font-bold text-white mr-4 flex-shrink-0">
        <span className="text-2xl">🎓</span>
        <span className="hidden sm:block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          CampusConnect
        </span>
      </Link>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484f58]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, blogs, users..."
            className="input pl-9 py-1.5 text-sm h-9"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); if (unreadCount) dispatch(markAllRead()); }}
            className="relative p-2 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 card shadow-card-dark animate-slide-down max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-[#30363d] font-semibold text-sm">Notifications</div>
              {notifications.length === 0 ? (
                <p className="text-[#8b949e] text-sm p-4 text-center">No notifications yet</p>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div
                    key={n._id}
                    className={`p-3 hover:bg-[#21262d] cursor-pointer border-b border-[#30363d]/50 transition-colors ${!n.isRead ? 'bg-indigo-500/5' : ''}`}
                    onClick={() => { setShowNotifs(false); if (n.link) navigate(n.link); }}
                  >
                    <div className="flex items-start gap-2">
                      {n.sender && <Avatar src={n.sender.avatar} name={n.sender.name} size="sm" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{n.title}</p>
                        <p className="text-xs text-[#8b949e] truncate">{n.message}</p>
                        <p className="text-xs text-[#484f58] mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1 flex-shrink-0" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        {user && (
          <div className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#21262d] transition-colors"
            >
              <Avatar src={user.avatar} name={user.name} size="sm" />
              <div className="hidden md:block text-left">
                <div className="text-xs font-medium text-white leading-none">{user.name.split(' ')[0]}</div>
                <div className="text-[10px] text-[#8b949e] flex items-center gap-1">
                  <Zap size={9} className="text-yellow-400" />
                  {user.xp.toLocaleString()} XP
                </div>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-11 w-64 card shadow-card-dark animate-slide-down">
                <div className="p-4 border-b border-[#30363d]">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar src={user.avatar} name={user.name} size="md" />
                    <div>
                      <div className="font-semibold text-white text-sm">{user.name}</div>
                      <div className="text-xs text-[#8b949e]">@{user.username}</div>
                      <div className="text-xs text-indigo-400 capitalize">{user.role}</div>
                    </div>
                  </div>
                  <XPBar xp={user.xp} level={user.level} showLabel />
                </div>
                <div className="p-2">
                  <Link to={`/profile/${user.username}`} onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors">
                    <UserIcon size={15} /> Profile
                  </Link>
                  <Link to="/settings" onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors">
                    <Settings size={15} /> Settings
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {(showNotifs || showProfile) && (
        <div className="fixed inset-0 z-[-1]" onClick={() => { setShowNotifs(false); setShowProfile(false); }} />
      )}
    </nav>
  );
}
