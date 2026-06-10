import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, LogOut, Settings, GraduationCap, Check, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

interface AppNavbarProps {
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export default function AppNavbar({ showSearch = false, searchQuery = '', onSearchChange }: AppNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppStore(state => state.currentUser);
  const classrooms = useAppStore(state => state.classrooms);
  const notifications = useAppStore(state => state.notifications);
  const markAsRead = useAppStore(state => state.markNotificationAsRead);
  const clearNotifications = useAppStore(state => state.clearAllNotifications);
  const logout = useAppStore(state => state.logout);
  const addToast = useAppStore(state => state.addToast);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Refs for closing dropdowns on outer click
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOuterClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOuterClick);
    return () => document.removeEventListener('mousedown', handleOuterClick);
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read);

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const firstLetter = currentUser?.name ? currentUser.name[0].toUpperCase() : 'U';

  return (
    <nav className="fixed top-0 inset-x-0 h-16 bg-[#143642] z-40 px-4 md:px-8 flex items-center justify-between shadow-md" id="app-top-navbar">
      
      {/* Left branding */}
      <Link to="/dashboard" className="flex items-center gap-2.5 group shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#0F8B8D] flex items-center justify-center text-white scale-100 group-hover:scale-105 transition-transform shadow-md">
          <GraduationCap className="w-5 h-5" />
        </div>
        <span className="font-display font-black text-lg text-white tracking-wide">
          LearnSphere
        </span>
      </Link>

      {/* Center Search (Expandable on focus, optional) */}
      {showSearch && onSearchChange ? (
        <div className="hidden sm:block max-w-sm w-full mx-4 transition-all duration-300 relative" id="navbar-search-block">
          <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search classrooms..."
            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-white/55 text-xs rounded-full py-2.5 pl-11 pr-4 focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none transition-all focus:max-w-[400px] font-sans"
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right side widgets */}
      <div className="flex items-center gap-4 shrink-0" id="navbar-widgets-right">
        
        {/* Toggle Mode Hint Button */}
        {(() => {
          const match = location.pathname.match(/^\/classroom\/([^/]+)/);
          const classId = match ? match[1] : null;
          const currentClass = classrooms.find(c => c.id === classId);
          if (!classId || !currentClass || !currentUser) return null;
          const isCreator = currentClass.creatorId === currentUser.id;
          const classroomRole = isCreator ? 'creator' : 'member';
          return (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-bold text-white/80 tracking-wider">
              <span>Mode:</span>
              <span className={classroomRole === 'creator' ? 'text-[#0F8B8D]' : 'text-[#EC9A29]'}>
                {classroomRole}
              </span>
            </div>
          );
        })()}



        {/* User profile avatar and controls dropdown */}
        <div className="relative" ref={profileRef} id="navbar-profile-panel">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="w-9 h-9 rounded-full bg-[#0F8B8D] hover:ring-2 hover:ring-[#0F8B8D]/50 text-white font-black text-sm flex items-center justify-center cursor-pointer transition-shadow"
            aria-label="User profile settings"
          >
            {firstLetter}
          </button>

          {/* User popup dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-150 overflow-hidden z-50 text-left font-sans">
              
              {/* Dropdown Header user detail */}
              <div className="p-4 border-b border-gray-150 bg-gray-50 flex flex-col select-none">
                <span className="font-bold text-sm text-brand-dark leading-tight">
                  {currentUser?.name || 'Rahul Sharma'}
                </span>
                <span className="text-xs text-brand-dark/65 truncate mt-0.5">
                  {currentUser?.email || 'rahul@learnsphere.com'}
                </span>
              </div>

              {/* Links menu list */}
              <div className="p-2 space-y-1">
                <button
                  onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                  className="w-full text-left rounded-xl px-3 py-2.5 text-xs text-brand-dark font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-gray-400 shrink-0" />
                  Profile & Settings
                </button>
              </div>

              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left rounded-xl px-3 py-2.5 text-xs font-bold text-[#A8201A] hover:bg-[#A8201A]/10 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-[#A8201A] shrink-0" />
                  Log Out
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
