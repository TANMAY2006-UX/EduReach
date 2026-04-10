import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import {
  ProtectedRoute,
  GuestRoute,
  OnboardingRoute,
  PublicRoute,
  RoleRedirect,
} from '../components/shared/ProtectedRoute';

// Auth
import LoginPage      from '../features/auth/LoginPage';
import RegisterPage   from '../features/auth/RegisterPage';
import OnboardingPage from '../features/auth/OnboardingPage';
import OAuthCallback  from '../features/auth/OAuthCallback';

// Public (guest-accessible) pages
import BrowseTutorsPage from '../features/public/BrowseTutorsPage';
import TutorProfilePage from '../features/public/TutorProfilePage';

// Protected dashboards
import StudentDashboard from '../features/student/StudentDashboard';
import TutorDashboard   from '../features/tutor/TutorDashboard';
import NgoDashboard     from '../features/ngo/NgoDashboard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public landing ─────────────────────────────── */}
          <Route path="/" element={<Navigate to="/browse" replace />} />

          {/* ── Guest only (redirect if logged in) ─────────── */}
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* ── OAuth callback ─────────────────────────────── */}
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* ── Onboarding (logged in, profile incomplete) ─── */}
          <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

          {/* ── PUBLIC pages (guests + logged-in users) ─────── */}
          {/* Guests can browse tutors. Login required to book. */}
          <Route path="/browse"         element={<PublicRoute><BrowseTutorsPage /></PublicRoute>} />
          <Route path="/tutor/:id"      element={<PublicRoute><TutorProfilePage /></PublicRoute>} />

          {/* ── Role-based redirect hub ─────────────────────── */}
          <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

          {/* ── Protected dashboards ────────────────────────── */}
          <Route
            path="/student/*"
            element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>}
          />
          <Route
            path="/tutor/*"
            element={<ProtectedRoute allowedRoles={['tutor']}><TutorDashboard /></ProtectedRoute>}
          />
          <Route
            path="/ngo/*"
            element={<ProtectedRoute allowedRoles={['ngo','admin']}><NgoDashboard /></ProtectedRoute>}
          />

          {/* ── 404 ─────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/browse" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}