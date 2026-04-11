import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ── Loading screen ────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">E</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ── ProtectedRoute — must be logged in + profile complete ─────
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user.isProfileComplete) return <Navigate to="/onboarding" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// ── OnboardingRoute — logged in but profile NOT complete ──────
export function OnboardingRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (user.isProfileComplete) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── GuestRoute — only for logged-out users ───────────────────
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (user) {
    if (!user.isProfileComplete) return <Navigate to="/onboarding" replace />;
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }
  return children;
}

// ── PublicRoute — accessible by everyone ────────────────────
export function PublicRoute({ children }) {
  return children;
}

// ── RoleRedirect — routes user to their dashboard ───────────
export function RoleRedirect() {
  const { user } = useAuth();
  const map = {
    student: '/student/dashboard',
    tutor:   '/tutor-dash/dashboard',
    ngo:     '/ngo/dashboard',
    admin:   '/ngo/dashboard',
  };
  return <Navigate to={map[user?.role] || '/onboarding'} replace />;
}