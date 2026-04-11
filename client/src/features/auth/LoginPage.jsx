import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#f8f9fc] flex overflow-hidden">
      
      {/* ── LEFT SIDE: YOUR ORIGINAL CONTENT STYLED PREMIUM ── */}
      <div className="hidden lg:flex w-1/2 bg-[#0a0f1c] relative flex-col justify-between p-10 xl:p-14 overflow-hidden">
        
        {/* Subtle Background Accents */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Top Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <span className="text-white font-black text-xl leading-none">E</span>
          </div>
          <span className="text-white font-black text-2xl tracking-tight">EduReach</span>
        </Link>

        {/* Vertically Centered Main Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-[460px] mt-8">
          <h1 className="text-[40px] xl:text-[46px] font-black text-white leading-[1.1] tracking-tight mb-5 animate-fade-up">
            Welcome back to <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              your journey.
            </span>
          </h1>
          <p className="text-slate-400 text-[15px] font-medium leading-relaxed mb-10 animate-fade-up delay-75">
            Log in to manage your lessons, connect with tutors, and continue growing your skills.
          </p>

          {/* Premium Checklist */}
          <div className="space-y-4 mb-12 animate-fade-up delay-150">
            {[
              'Secure, background-verified platform',
              'Manage your upcoming sessions easily',
              'Connect with NGO-subsidised programs',
              'In-platform scheduling — no WhatsApp chaos'
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 text-[10px] font-black">✓</span>
                </div>
                <span className="text-slate-300 text-[13.5px] font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-slate-600 text-sm font-medium mt-8">
          © {new Date().getFullYear()} EduReach. All rights reserved.
        </div>
      </div>

      {/* ── RIGHT SIDE: TACTILE FORM WITH GUEST BUTTON ── */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-[8px_8px_0px_0px_#D1D5DB] animate-fade-up">
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Sign in</h2>
            <p className="text-xs font-bold text-gray-500 mt-1.5">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 transition-colors">Create one free</Link>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-2 mb-5 shadow-[3px_3px_0px_0px_#fca5a5]">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.location.href = GOOGLE_AUTH_URL}
            className="w-full flex items-center justify-center gap-3 h-[42px] rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-bold text-gray-700 uppercase tracking-wide transition-all shadow-[3px_3px_0px_0px_#D1D5DB] hover:shadow-[3px_3px_0px_0px_#9CA3AF] hover:-translate-y-0.5 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none mb-5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-[2px] flex-1 bg-gray-100"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">OR</span>
            <div className="h-[2px] flex-1 bg-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" required placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[42px] pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white shadow-[3px_3px_0px_0px_#D1D5DB] focus:shadow-[3px_3px_0px_0px_#93C5FD] focus:-translate-y-0.5 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">Password</label>
                <a href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-800">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password" required placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[42px] pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white shadow-[3px_3px_0px_0px_#D1D5DB] focus:shadow-[3px_3px_0px_0px_#93C5FD] focus:-translate-y-0.5 transition-all"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-[42px] mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[12px] font-bold uppercase tracking-wide transition-all duration-150 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#93C5FD] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
            
            {/* Guest Option 2 */}
            <Link to="/" className="w-full flex items-center justify-center gap-2 h-[42px] mt-3 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wide transition-all shadow-[3px_3px_0px_0px_#E5E7EB] hover:shadow-[3px_3px_0px_0px_#D1D5DB] hover:-translate-y-0.5 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
              Browse as guest <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}