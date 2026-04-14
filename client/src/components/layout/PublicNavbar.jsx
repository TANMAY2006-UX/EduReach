import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, LogOut, ChevronDown, LayoutDashboard, BookOpen, Search, Eye } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function PublicNavbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef   = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const isActive = (to) => location.pathname === to;

  // ── Role-aware centre nav links ──────────────────────────────
  // Tutors don't see "How it works" / "For NGOs" — irrelevant to them
  const getNavLinks = () => {
    if (user?.role === 'tutor') {
      return [
        { label: 'Browse tutors', to: '/browse' },
        { label: 'My dashboard',  to: '/tutor-dash/dashboard' },
      ];
    }
    if (user?.role === 'ngo') {
      return [
        { label: 'Browse tutors', to: '/browse' },
        { label: 'NGO Dashboard', to: '/ngo/dashboard' },
      ];
    }
    if (user?.role === 'student') {
      return [
        { label: 'Browse tutors', to: '/browse' },
        { label: 'My sessions',   to: '/student/dashboard' },
      ];
    }
    // Guest
    return [
      { label: 'Browse tutors', to: '/browse' },
      { label: 'How it works',  to: '/browse#how-it-works' },
      { label: 'For NGOs',      to: '/browse#ngo' },
    ];
  };

  // ── Role-aware dropdown links ────────────────────────────────
  const getDropdownLinks = () => {
    if (user?.role === 'tutor') return [
      { to: '/tutor-dash/dashboard', icon: LayoutDashboard, label: 'Tutor Dashboard' },
      { to: '/browse',               icon: Eye,             label: 'Browse Tutors' },
    ];
    if (user?.role === 'ngo') return [
      { to: '/ngo/dashboard', icon: LayoutDashboard, label: 'NGO Dashboard' },
      { to: '/browse',        icon: Search,          label: 'Browse Tutors' },
    ];
    // Student
    return [
      { to: '/student/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
      { to: '/student/dashboard', icon: BookOpen,        label: 'My Sessions' },
    ];
  };

  const navLinks     = getNavLinks();
  const dropdownLinks = getDropdownLinks();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">

          {/* Logo */}
          <Link to="/browse" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm shadow-blue-200 group-hover:shadow-md transition-all duration-200 border-2 border-blue-700">
              <span className="text-white font-black text-[13px] leading-none">E</span>
            </div>
            <span className="text-gray-900 font-black text-[15px] tracking-tight">EduReach</span>
          </Link>

          {/* Centre nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ label, to }) => (
              <Link key={label} to={to}
                className={`px-3.5 py-2 text-[13px] font-black rounded-xl transition-all duration-150 ${isActive(to) ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border-2 border-gray-200 hover:border-gray-300 bg-white transition-all shadow-[2px_2px_0px_0px_#E5E7EB] hover:shadow-[2px_2px_0px_0px_#D1D5DB]">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-white" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-white text-[11px] font-black">{user?.name?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-[13px] font-black text-gray-700 max-w-[90px] truncate hidden sm:block">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="animate-scale-in absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border-2 border-gray-100 shadow-xl shadow-black/[0.08] py-1.5 z-50">
                    {/* User info */}
                    <div className="px-4 py-2.5 border-b-2 border-gray-50 mb-1">
                      <p className="text-[12px] font-black text-gray-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                      {user?.role && (
                        <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          user.role === 'tutor'   ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : user.role === 'ngo'   ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>{user.role}</span>
                      )}
                    </div>
                    {dropdownLinks.map(({ to, icon: Icon, label }) => (
                      <Link key={label} to={to} onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                        <Icon className="w-4 h-4 text-gray-400" /> {label}
                      </Link>
                    ))}
                    <div className="h-px bg-gray-100 mx-3 my-1" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors rounded-b-2xl">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-[13px] font-black text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
                  <LogIn className="w-3.5 h-3.5" /> Sign in
                </Link>
                <Link to="/register"
                  className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-black uppercase tracking-wide text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-[3px_3px_0px_0px_#93C5FD] active:shadow-none active:translate-y-[3px] active:translate-x-[3px] transition-all">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}