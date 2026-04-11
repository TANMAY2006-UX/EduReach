import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import {
  ProtectedRoute,
  GuestRoute,
  OnboardingRoute,
  PublicRoute,
  RoleRedirect,
} from '../components/shared/ProtectedRoute';

// Auth pages  (in features/auth/)
import LoginPage      from '../features/auth/LoginPage';
import RegisterPage   from '../features/auth/RegisterPage';
import OnboardingPage from '../features/auth/OnboardingPage';
import OAuthCallback  from '../features/auth/OAuthCallback';

// Public pages — NOTE: these files are in components/public/ in your repo
import BrowseTutorsPage from '../components/public/BrowseTutorsPage';
import TutorProfilePage from '../components/public/TutorProfilePage';

// Protected dashboards — in components/student|tutor|ngo/
import StudentDashboard from '../components/student/StudentDashboard';
import TutorDashboard   from '../components/tutor/TutorDashboard';
import NgoDashboard     from '../components/ngo/NgoDashboard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root → browse */}
          <Route path="/" element={<Navigate to="/browse" replace />} />

          {/* Guest only */}
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* OAuth callback */}
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

          {/* Public (guest + logged-in) */}
          <Route path="/browse"    element={<PublicRoute><BrowseTutorsPage /></PublicRoute>} />
          <Route path="/tutor/:id" element={<PublicRoute><TutorProfilePage /></PublicRoute>} />

          {/* Role redirect hub */}
          <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

          {/* Protected dashboards */}
          <Route path="/student/*" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/tutor-dash/*" element={<ProtectedRoute allowedRoles={['tutor']}><TutorDashboard /></ProtectedRoute>} />
          <Route path="/ngo/*"     element={<ProtectedRoute allowedRoles={['ngo','admin']}><NgoDashboard /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/browse" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}