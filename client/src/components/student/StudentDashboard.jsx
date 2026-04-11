import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../layout/PublicNavbar';
import { sessionService, tutorService } from '../../services/tutorService';
import {
  BookOpen, Calendar, Star, Search,
  Clock, CheckCircle, XCircle, ArrowRight,
  MapPin, ChevronRight, AlertCircle, TrendingUp,
  GraduationCap, Bell, Zap
} from 'lucide-react';

// ── Status badge ───────────────────────────────────────────────
const STATUS = {
  pending: { label: 'Awaiting Tutor', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  accepted: { label: 'Confirmed', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  rejected: { label: 'Declined', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-full border-2 uppercase tracking-wide ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// STAGGER DELAYS ARRAY
const STAGGER = ['delay-0', 'delay-75', 'delay-100', 'delay-150', 'delay-200'];

// ── Session card ───────────────────────────────────────────────
function SessionCard({ session, onReview }) {
  const tutor = session.tutorProfile;
  const initials = tutor?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const date = new Date(session.scheduledAt);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 shadow-[3px_3px_0px_0px_#E5E7EB] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#93C5FD] transition-all duration-200">
      {/* Tutor avatar */}
      <div className="flex items-start gap-3 flex-1">
        <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_#BFDBFE]">
          <span className="text-blue-700 font-black text-base">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900 truncate">{tutor?.name || 'Unknown Tutor'}</p>
          <p className="text-xs font-semibold text-gray-500 mb-1">{session.subject}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="capitalize">{session.mode}</span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 flex-shrink-0">
        <StatusBadge status={session.status} />
        {session.status === 'completed' && !session.isReviewed && (
          <button
            onClick={() => onReview(session)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-wide rounded-xl shadow-[2px_2px_0px_0px_#93C5FD] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Star className="w-3 h-3" /> Rate session
          </button>
        )}
        {session.status === 'accepted' && (
          <Link
            to={`/tutor/${tutor?._id}`}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            View profile <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Quick stat card ─────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <div className={`animate-fade-up ${delay} bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-[4px_4px_0px_0px_#E5E7EB]`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border-2 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

// ── Review modal ───────────────────────────────────────────────
function ReviewModal({ session, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);
    try {
      await onSubmit(session._id, rating, comment);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-gray-200 rounded-3xl p-7 w-full max-w-md shadow-[8px_8px_0px_0px_#D1D5DB] animate-scale-in">
        <h3 className="text-xl font-black text-gray-900 mb-1">Rate your session</h3>
        <p className="text-sm text-gray-500 mb-6">with {session.tutorProfile?.name}</p>

        {/* Stars */}
        <div className="flex gap-2 mb-5">
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} onClick={() => setRating(i)}>
              <Star className={`w-8 h-8 transition-all ${i <= rating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-gray-200'}`} />
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          placeholder="What did you like? (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 shadow-[3px_3px_0px_0px_#E5E7EB] focus:shadow-[3px_3px_0px_0px_#93C5FD] transition-all mb-5"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-300 shadow-[2px_2px_0px_0px_#E5E7EB] active:translate-y-[1px] active:shadow-none transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!rating || loading}
            className="flex-[2] h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-black rounded-xl shadow-[3px_3px_0px_0px_#93C5FD] active:translate-y-[2px] active:shadow-none transition-all">
            {loading ? '...' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [nearbyTutors, setNearbyTutors] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [reviewTarget, setReviewTarget] = useState(null);

  // Fetch student sessions
  useEffect(() => {
    sessionService.getStudentSessions()
      .then(data => setSessions(data.sessions || []))
      .catch(console.error)
      .finally(() => setLoadingSessions(false));
  }, []);

  // Fetch recommended tutors based on student's subjects and area
  useEffect(() => {
    const params = { limit: 4 };
    if (user?.subjects?.length) params.subject = user.subjects[0];
    if (user?.location?.area) params.area = user.location.area;
    tutorService.getTutors(params)
      .then(data => setNearbyTutors(data.tutors || []))
      .catch(console.error)
      .finally(() => setLoadingTutors(false));
  }, [user]);

  const handleReview = async (sessionId, rating, comment) => {
    await sessionService.reviewSession(sessionId, rating, comment);
    setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, isReviewed: true } : s));
  };

  // Stats
  const totalSessions = sessions.length;
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const pendingCount = sessions.filter(s => s.status === 'pending').length;
  const acceptedCount = sessions.filter(s => s.status === 'accepted').length;

  // Tab filtering
  const upcomingSessions = sessions.filter(s => ['pending', 'accepted'].includes(s.status));
  const pastSessions = sessions.filter(s => ['completed', 'cancelled', 'rejected'].includes(s.status));
  const displayedSessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── WELCOME HEADER ──────────────────────────────────── */}
        <div className="mb-8 animate-fade-up delay-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">👋</span>
                <h1 className="text-[28px] font-black text-gray-900 tracking-tight">
                  Hey, {firstName}!
                </h1>
              </div>
              <p className="text-gray-500 font-medium text-sm">
                {user?.subjects?.length
                  ? `Looking for help in ${user.subjects.slice(0, 2).join(', ')}? We've got verified tutors near you.`
                  : 'Find your perfect tutor and book a free trial today.'}
              </p>
            </div>
            <Link
              to="/browse"
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase tracking-wide rounded-xl border-2 border-blue-700 shadow-[4px_4px_0px_0px_#1D4ED8] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none transition-all"
            >
              <Search className="w-4 h-4" />
              Find a Tutor
            </Link>
          </div>
        </div>

        {/* ── STATS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={BookOpen} label="Total Sessions" value={totalSessions} color="bg-blue-50 border-blue-200 text-blue-600" delay="delay-50" />
          <StatCard icon={CheckCircle} label="Completed" value={completedCount} color="bg-green-50 border-green-200 text-green-600" delay="delay-100" />
          <StatCard icon={Clock} label="Upcoming" value={acceptedCount} color="bg-amber-50 border-amber-200 text-amber-600" delay="delay-150" />
          <StatCard icon={AlertCircle} label="Awaiting Reply" value={pendingCount} color="bg-purple-50 border-purple-200 text-purple-600" delay="delay-200" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: SESSIONS ─────────────────────────────────── */}
          <div className="lg:col-span-2 animate-fade-up delay-100">
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-[4px_4px_0px_0px_#D1D5DB] overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b-2 border-gray-100">
                {[
                  { key: 'upcoming', label: 'Upcoming', count: upcomingSessions.length },
                  { key: 'past', label: 'Past', count: pastSessions.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-4 text-sm font-black uppercase tracking-wide transition-colors flex items-center justify-center gap-2 ${activeTab === tab.key
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Session list */}
              <div className="p-5 space-y-4">
                {loadingSessions && (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-50 border-2 border-gray-100 rounded-xl shimmer" />
                  ))
                )}

                {!loadingSessions && displayedSessions.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border-2 border-gray-200 flex items-center justify-center mb-3 shadow-[3px_3px_0px_0px_#E5E7EB]">
                      <Calendar className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-700 font-bold mb-1">
                      {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      {activeTab === 'upcoming' ? 'Book a free trial with a verified tutor!' : 'Your completed sessions will appear here.'}
                    </p>
                    {activeTab === 'upcoming' && (
                      <Link to="/browse" className="px-5 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-wide rounded-xl hover:bg-blue-500 shadow-[2px_2px_0px_0px_#93C5FD] active:translate-y-[1px] active:shadow-none transition-all">
                        Browse tutors →
                      </Link>
                    )}
                  </div>
                )}

                {!loadingSessions && displayedSessions.map((session, i) => (
                  <div key={session._id} className={`animate-fade-up ${STAGGER[i % STAGGER.length]}`}>
                    <SessionCard
                      session={session}
                      onReview={setReviewTarget}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: RECOMMENDED TUTORS ──────────────────────── */}
          <div className="animate-fade-up delay-200">
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-[4px_4px_0px_0px_#D1D5DB] overflow-hidden">
              <div className="px-5 py-4 border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Recommended for you</h2>
                </div>
                {user?.location?.area && (
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    Based on your area & subjects
                  </p>
                )}
              </div>

              <div className="p-4 space-y-3">
                {loadingTutors && [...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-50 border border-gray-100 rounded-xl shimmer" />
                ))}

                {!loadingTutors && nearbyTutors.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-6 font-medium">No recommendations yet</p>
                )}

                {!loadingTutors && nearbyTutors.map((tutor, i) => {
                  const initials = tutor.name.split(' ').map(n => n[0]).join('').toUpperCase();
                  const delay = STAGGER[i % STAGGER.length];
                  return (
                    <Link
                      key={tutor._id}
                      to={`/tutor/${tutor._id}`}
                      className={`animate-fade-up ${delay} flex items-center gap-3 p-3 border-2 border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-[3px_3px_0px_0px_#BFDBFE] transition-all group`}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-black text-sm">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate group-hover:text-blue-700 transition-colors">{tutor.name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold truncate">{tutor.subjects?.slice(0, 2).join(' · ')}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] font-bold text-amber-700">{tutor.rating > 0 ? tutor.rating.toFixed(1) : 'New'}</span>
                          <span className="text-[10px] text-gray-300 font-medium">· {tutor.area}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}

                <Link
                  to="/browse"
                  className="flex items-center justify-center gap-1.5 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[11px] font-black text-gray-400 hover:text-blue-600 hover:border-blue-300 uppercase tracking-wide transition-all"
                >
                  See all tutors <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Profile completeness hint */}
            {(!user?.subjects?.length || !user?.location?.area) && (
              <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#fde68a]">
                <div className="flex items-start gap-2.5">
                  <Bell className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-amber-800 mb-0.5">Complete your profile</p>
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                      Add your subjects and location to get tutor recommendations tailored for you.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          session={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
}