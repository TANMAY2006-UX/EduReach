import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`;

function getStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

const STRENGTH = [
  { label: 'Too short', color: 'bg-red-400', text: 'text-red-500' },
  { label: 'Weak', color: 'bg-orange-400', text: 'text-orange-500' },
  { label: 'Fair', color: 'bg-yellow-400', text: 'text-yellow-600' },
  { label: 'Good', color: 'bg-blue-400', text: 'text-blue-600' },
  { label: 'Strong ✓', color: 'bg-emerald-400', text: 'text-emerald-600' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getStrength(form.password);
  const si = STRENGTH[Math.min(strength, 4)];

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('All fields are required.');
      return;
    }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!agreed) { setError('Please accept our Terms to continue.'); return; }

    setLoading(true);
    try {
      await register(`${form.firstName.trim()} ${form.lastName.trim()}`, form.email, form.password);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#f8f9fc] flex overflow-hidden">

      {/* ── LEFT SIDE: AMBIENT GLOW DESIGN ── */}
      <div className="hidden lg:flex w-1/2 bg-[#0B0F19] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">E</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">EduReach</span>
        </Link>

        <div className="relative z-10 max-w-md animate-fade-up">
          <h1 className="text-[44px] font-black text-white leading-[1.1] tracking-tight mb-5">
            Your learning <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              journey starts.
            </span>
          </h1>
          <p className="text-slate-400 text-[15px] font-medium leading-relaxed">
            Join 500+ tutors and students building a better education story. Create your free account in seconds.
          </p>
        </div>

        <div className="relative z-10 text-slate-600 text-sm font-medium">
          © {new Date().getFullYear()} EduReach. All rights reserved.
        </div>
      </div>

      {/* ── RIGHT SIDE: ULTRA-COMPACT TACTILE FORM ── */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] bg-white border-2 border-gray-200 rounded-3xl p-7 shadow-[8px_8px_0px_0px_#D1D5DB] animate-fade-up">

          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Create account</h2>
            <p className="text-xs font-bold text-gray-500">
              Already have one?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 transition-colors">Sign in</Link>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-2 mb-4 shadow-[3px_3px_0px_0px_#fca5a5]">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.location.href = GOOGLE_AUTH_URL}
            className="w-full flex items-center justify-center gap-3 h-[42px] rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-bold text-gray-700 uppercase tracking-wide transition-all shadow-[3px_3px_0px_0px_#D1D5DB] hover:shadow-[3px_3px_0px_0px_#9CA3AF] hover:-translate-y-0.5 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-[2px] flex-1 bg-gray-100"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">OR</span>
            <div className="h-[2px] flex-1 bg-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* First & Last Name Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">First name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" name="firstName" required placeholder="John"
                    value={form.firstName} onChange={handleChange}
                    className="w-full h-[42px] pl-9 pr-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white shadow-[3px_3px_0px_0px_#D1D5DB] focus:shadow-[3px_3px_0px_0px_#93C5FD] focus:-translate-y-0.5 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Last name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" name="lastName" required placeholder="Doe"
                    value={form.lastName} onChange={handleChange}
                    className="w-full h-[42px] pl-9 pr-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white shadow-[3px_3px_0px_0px_#D1D5DB] focus:shadow-[3px_3px_0px_0px_#93C5FD] focus:-translate-y-0.5 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" name="email" required placeholder="you@example.com"
                  value={form.email} onChange={handleChange}
                  className="w-full h-[42px] pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white shadow-[3px_3px_0px_0px_#D1D5DB] focus:shadow-[3px_3px_0px_0px_#93C5FD] focus:-translate-y-0.5 transition-all"
                />
              </div>
            </div>

            {/* Password & Strength Meter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'} name="password" required placeholder="Min. 8 characters"
                  value={form.password} onChange={handleChange}
                  className="w-full h-[42px] pl-10 pr-10 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white shadow-[3px_3px_0px_0px_#D1D5DB] focus:shadow-[3px_3px_0px_0px_#93C5FD] focus:-translate-y-0.5 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Indicator */}
              {form.password && (
                <div className="mt-1.5 pl-1">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? si.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${si.text}`}>{si.label}</span>
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer group mt-2">
              <div className="relative flex-shrink-0 mt-0.5">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only peer" />
                <div className="w-[16px] h-[16px] rounded border-2 border-gray-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-colors group-hover:border-blue-400">
                  {agreed && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-500 leading-tight pt-0.5">
                I agree to EduReach's <a href="#" className="text-blue-600 hover:text-blue-800">Terms</a> and <a href="#" className="text-blue-600 hover:text-blue-800">Privacy</a>
              </span>
            </label>

            <button
              type="submit" disabled={loading}
              className="w-full h-[42px] mt-1 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[12px] font-bold uppercase tracking-wide transition-all duration-150 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#93C5FD] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create account <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>

            {/* ── GUEST ESCAPE HATCH ── */}
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 h-[42px] mt-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wide transition-all shadow-[3px_3px_0px_0px_#E5E7EB] hover:shadow-[3px_3px_0px_0px_#D1D5DB] hover:-translate-y-0.5 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
            >
              Browse as guest <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            
          </form>
        </div>
      </div>
    </div>
  );
}