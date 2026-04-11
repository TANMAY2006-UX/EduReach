import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, User, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function PublicNavbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Browse tutors', to: '/browse' },
    { label: 'How it works',  to: '/#how-it-works' },
    { label: 'For NGOs',      to: '/#ngo' },
  ];

  const isActive = (to) => location.pathname === to;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">

          {/* Logo */}
          <Link to="/browse" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm shadow-blue-200 group-hover:shadow-md group-hover:shadow-blue-200 transition-all duration-200">
              <span className="text-white font-bold text-[13px] leading-none">E</span>
            </div>
            <span className="text-gray-900 font-extrabold text-[15px] tracking-tight">EduReach</span>
          </Link>

          {/* Centre nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className={`px-3.5 py-2 text-[13px] font-semibold rounded-xl transition-all duration-150 ${
                  isActive(to)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border-2 border-gray-100 hover:border-gray-200 bg-white transition-all duration-150 shadow-sm"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-white" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-white text-[11px] font-extrabold">
                        {user?.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-[13px] font-semibold text-gray-700 max-w-[90px] truncate hidden sm:block">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="animate-scale-in absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-black/8 py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-50 mb-1">
                      <p className="text-[12px] font-semibold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gray-400" />
                      Dashboard
                    </Link>
                    <Link
                      to="/browse"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      Browse tutors
                    </Link>
                    <div className="h-px bg-gray-100 mx-3 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors rounded-b-2xl"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <LogIn className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors" />
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-[3px_3px_0px_0px_#93C5FD] active:shadow-[0px_0px_0px_0px_#93C5FD] active:translate-y-[3px] active:translate-x-[3px] transition-all"
                >
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