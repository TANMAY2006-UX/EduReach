import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import OnboardingWizard from '../features/auth/OnboardingWizard';
import StudentDashboard from '../features/student/StudentDashboard';
import TutorDashboard from '../features/tutor/TutorDashboard';
import NgoDashboard from '../features/ngo/NgoDashboard';
import LoadingSpinner from '../components/shared/LoadingSpinner';

// Redirects to correct dashboard based on role
const RoleRoute = () => {
  const { user } = useAuth();
  if (!user.isProfileComplete) return <Navigate to="/onboarding" replace />;
  const map = { student: '/student', tutor: '/tutor', ngo: '/ngo', admin: '/admin' };
  return <Navigate to={map[user.role] || '/onboarding'} replace />;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isProfileComplete) return <Navigate to="/onboarding" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function AppRouter() {
  const { loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="/dashboard" element={<ProtectedRoute><RoleRoute /></ProtectedRoute>} />
        <Route path="/student/*" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/tutor/*" element={<ProtectedRoute allowedRoles={['tutor']}><TutorDashboard /></ProtectedRoute>} />
        <Route path="/ngo/*" element={<ProtectedRoute allowedRoles={['ngo', 'admin']}><NgoDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}