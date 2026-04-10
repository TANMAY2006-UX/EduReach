import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { MapPin, Star, CheckCircle, BookOpen, Clock, ArrowLeft, Lock, ArrowRight } from 'lucide-react';

// In Step 3 this will be a real API call using useParams id
const MOCK = {
  id: '1', name: 'Priya Sharma', subjects: ['Mathematics','Physics'],
  area: 'Andheri West', city: 'Mumbai', grade: 'Class 8–12',
  experience: '5–10 years', rating: 4.9, reviews: 47, verified: true,
  qualification: 'B.Tech, IIT Bombay',
  bio: `IIT-B graduate with 7 years of experience helping students crack JEE and board exams. I focus on building deep conceptual understanding rather than rote memorisation. My students consistently score above 90% in boards and clear competitive exams.`,
  availability: ['Mon–Fri: 4 PM – 8 PM', 'Sat–Sun: 9 AM – 6 PM'],
};

export default function TutorProfilePage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const tutor = MOCK; // Replace with API fetch in Step 3

  const initials = tutor.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to browse
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-5">
          {/* Header */}
          <div className="flex items-start gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 font-bold text-2xl">{initials}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-gray-900">{tutor.name}</h1>
                {tutor.verified && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-100">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{tutor.qualification}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold">{tutor.rating}</span>
                  <span className="text-xs text-gray-400">({tutor.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5" /> {tutor.area}, {tutor.city}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{tutor.bio}</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Subjects</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tutor.subjects.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-medium">{s}</span>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Availability</span>
              </div>
              {tutor.availability.map(a => (
                <p key={a} className="text-xs text-gray-600 leading-relaxed">{a}</p>
              ))}
            </div>
          </div>

          {/* Booking CTA */}
          {isAuthenticated ? (
            <button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200">
              Request free trial lesson <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
              <Lock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800 mb-1">Sign up to book a free trial</p>
              <p className="text-xs text-gray-500 mb-4">Create your free account in 60 seconds to connect with {tutor.name.split(' ')[0]}.</p>
              <div className="flex gap-2 justify-center">
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  Create free account
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 rounded-xl transition-all"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}