import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../layout/PublicNavbar';
import { sessionService, tutorService } from '../../services/tutorService';
import {
  BookOpen, Calendar, Star, Search, Clock, CheckCircle,
  XCircle, ArrowRight, ChevronRight, AlertCircle, Bell,
  Zap, Video, MessageSquare, ExternalLink, Phone, RefreshCw, X
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────
const STATUS = {
  pending:   { label: 'Awaiting Tutor',  color: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  accepted:  { label: 'Confirmed',        color: 'bg-green-50 text-green-700 border-green-200',   icon: CheckCircle },
  rejected:  { label: 'Declined',         color: 'bg-red-50 text-red-600 border-red-200',         icon: XCircle },
  completed: { label: 'Completed',        color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: CheckCircle },
  cancelled: { label: 'Cancelled',        color: 'bg-gray-50 text-gray-500 border-gray-200',      icon: XCircle },
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

const STAGGER = ['delay-0','delay-75','delay-100','delay-150','delay-200'];

// ── Join class button — activates 5 min before, pulses ─────────
function JoinClassButton({ session, onJoin }) {
  const [canJoin,   setCanJoin]   = useState(false);
  const [minsLeft,  setMinsLeft]  = useState(null);
  const [joining,   setJoining]   = useState(false);
  const [hasJoined, setHasJoined] = useState(!!session.studentJoinedAt);

  useEffect(() => {
    if (!session.meetingLink) return;

    const check = () => {
      const now   = new Date();
      const start = new Date(session.scheduledAt);
      const diff  = (start - now) / 60000; // minutes
      setMinsLeft(Math.round(diff));
      setCanJoin(diff <= 5 && diff > -60); // active from 5 min before to 60 min after start
    };

    check();
    const t = setInterval(check, 30000); // recheck every 30s
    return () => clearInterval(t);
  }, [session.scheduledAt, session.meetingLink]);

  if (!session.meetingLink) return (
    <span className="text-[11px] font-bold text-gray-400 italic">Waiting for tutor's link...</span>
  );

  if (hasJoined) return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-black text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Joined</span>
      <a href={session.meetingLink} target="_blank" rel="noreferrer"
        className="text-[11px] font-black text-blue-600 hover:underline flex items-center gap-1">
        Rejoin <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );

  const handleJoin = async () => {
    setJoining(true);
    try {
      const data = await sessionService.joinSession(session._id);
      setHasJoined(true);
      window.open(data.meetingLink, '_blank');
      onJoin?.(session._id);
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  if (!canJoin) return (
    <span className="text-[11px] font-bold text-gray-400">
      {minsLeft > 0
        ? `Starts in ${minsLeft > 60 ? `${Math.round(minsLeft/60)}h` : `${minsLeft}m`}`
        : 'Session may have started'}
    </span>
  );

  return (
    <button onClick={handleJoin} disabled={joining}
      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-wide rounded-xl shadow-[2px_2px_0px_0px_#93C5FD] active:translate-y-[1px] active:shadow-none transition-all animate-pulse-btn disabled:opacity-60">
      {joining ? '...' : <><Video className="w-3.5 h-3.5" /> Join Class</>}
    </button>
  );
}

// ── Session card ───────────────────────────────────────────────
function SessionCard({ session, onReview, onJoined, onCancelled }) {
  const tutor    = session.tutorProfile;
  const initials = tutor?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const date     = new Date(session.scheduledAt);

  // ── Cancel booking state ──────────────────────────────────────
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelError,  setCancelError]  = useState('');
  const [showConfirm,  setShowConfirm]  = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await sessionService.cancelSession(session._id, 'Cancelled by student');
      onCancelled?.(session._id);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Could not cancel. Please try again.');
      setCancelling(false);
    }
  };

  // ── Expiry urgency calculation ────────────────────────────────
  const getExpiryUrgency = () => {
    if (session.status !== 'pending' || !session.autoExpireAt) return null;
    const now        = new Date();
    const expiry     = new Date(session.autoExpireAt);
    const hoursLeft  = (expiry - now) / 3600000;
    if (hoursLeft <= 0)   return { label: 'Expired', urgent: true, critical: true };
    if (hoursLeft <= 12)  return { label: `Expires in ${Math.round(hoursLeft)}h`, urgent: true, critical: true };
    if (hoursLeft <= 24)  return { label: `Expires in ${Math.round(hoursLeft)}h`, urgent: true, critical: false };
    const daysLeft = Math.floor(hoursLeft / 24);
    const remHours = Math.round(hoursLeft % 24);
    return {
      label: daysLeft > 0 ? `Expires in ${daysLeft}d ${remHours}h` : `Expires in ${Math.round(hoursLeft)}h`,
      urgent: false,
      critical: false,
    };
  };
  const expiry = getExpiryUrgency();

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 flex flex-col gap-3 shadow-[3px_3px_0px_0px_#E5E7EB] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#93C5FD] transition-all duration-200">

      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_#BFDBFE]">
          <span className="text-blue-700 font-black text-sm">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900 truncate">{tutor?.name || 'Unknown Tutor'}</p>
          <p className="text-xs font-bold text-gray-400">{session.subject} ·
            <span className="ml-1 capitalize">{session.mode}</span> ·
            <span className={`ml-1 font-black ${session.type === 'trial' ? 'text-green-600' : 'text-purple-600'}`}>
              {session.type === 'trial' ? 'Free Trial' : `Paid ₹${session.amount}`}
            </span>
          </p>
          <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
            {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
            {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t-2 border-gray-50">
        {/* Accepted: Join + tutor phone */}
        {session.status === 'accepted' && (
          <>
            {session.mode === 'online' && (
              <JoinClassButton session={session} onJoin={onJoined} />
            )}
            {/* WhatsApp handoff — reveal phone after acceptance */}
            {session.tutor?.phone && (
              <a href={`https://wa.me/91${session.tutor.phone.replace(/\D/g, '')}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-black text-green-700 bg-green-50 border-2 border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-all shadow-[1px_1px_0px_0px_#86EFAC]">
                <Phone className="w-3 h-3" /> WhatsApp Tutor
              </a>
            )}
            <Link to={`/tutor/${tutor?._id}`}
              className="flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-800 ml-auto">
              Profile <ChevronRight className="w-3 h-3" />
            </Link>
          </>
        )}

        {/* Completed: review button */}
        {session.status === 'completed' && !session.isReviewed && (
          <button onClick={() => onReview(session)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-black uppercase tracking-wide rounded-xl border-2 border-amber-200 shadow-[2px_2px_0px_0px_#fde68a] active:translate-y-[1px] active:shadow-none transition-all">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Rate & Review
          </button>
        )}

        {session.status === 'completed' && session.isReviewed && (
          <span className="text-[11px] font-black text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Reviewed</span>
        )}

        {/* Pending: expiry indicator + cancel button */}
        {session.status === 'pending' && (
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
            {/* Expiry countdown with urgency */}
            {expiry && (
              <span className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                expiry.critical
                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                  : expiry.urgent
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                <Clock className="w-3 h-3" />
                {expiry.label} if no reply
              </span>
            )}

            {/* Cancel booking button */}
            {!showConfirm ? (
              <button onClick={() => setShowConfirm(true)}
                className="text-[11px] font-black text-gray-400 hover:text-red-600 hover:border-red-200 border-2 border-gray-200 px-3 py-1 rounded-xl transition-all ml-auto">
                Cancel
              </button>
            ) : (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[11px] font-bold text-red-700">Cancel booking?</span>
                <button onClick={() => setShowConfirm(false)}
                  className="text-[11px] font-bold text-gray-500 border-2 border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-all">
                  Keep
                </button>
                <button onClick={handleCancel} disabled={cancelling}
                  className="text-[11px] font-black text-white bg-red-500 hover:bg-red-600 border-2 border-red-600 px-3 py-1 rounded-lg disabled:opacity-50 transition-all shadow-[2px_2px_0px_0px_#FCA5A5] active:translate-y-[1px] active:shadow-none">
                  {cancelling ? '...' : 'Yes, cancel'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* API cancel error */}
        {cancelError && (
          <p className="w-full text-[11px] font-bold text-red-600 mt-1">{cancelError}</p>
        )}
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
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

// ── Review modal (public + private) ───────────────────────────
function ReviewModal({ session, onClose, onSubmit }) {
  const [rating,          setRating]          = useState(0);
  const [comment,         setComment]         = useState('');
  const [privateFeedback, setPrivateFeedback] = useState('');
  const [loading,         setLoading]         = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);
    try {
      await onSubmit(session._id, rating, comment, privateFeedback);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-2 border-gray-200 rounded-3xl p-7 w-full max-w-md shadow-[8px_8px_0px_0px_#D1D5DB] animate-scale-in">
        <h3 className="text-xl font-black text-gray-900 mb-0.5">Rate your session</h3>
        <p className="text-sm text-gray-400 font-medium mb-5">with {session.tutorProfile?.name}</p>

        {/* Stars */}
        <div className="flex items-center gap-2 mb-1">
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => setRating(i)}>
              <Star className={`w-9 h-9 transition-all ${i <= rating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-gray-200 hover:text-amber-200'}`} />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs font-black text-amber-600 mb-4">{LABELS[rating]}</p>
        )}

        {/* Public review */}
        <div className="mb-4">
          <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">
            Public Review <span className="text-[10px] font-normal normal-case text-gray-400">(shown on tutor's profile)</span>
          </label>
          <textarea rows={2} placeholder="What did you like about this session?"
            value={comment} onChange={e => setComment(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 shadow-[2px_2px_0px_0px_#E5E7EB] focus:shadow-[2px_2px_0px_0px_#93C5FD] transition-all" />
        </div>

        {/* Private feedback */}
        <div className="mb-5">
          <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">
            Private Feedback <span className="text-[10px] font-normal normal-case text-gray-400">(only the tutor sees this)</span>
          </label>
          <textarea rows={2} placeholder="Constructive feedback, suggestions for improvement..."
            value={privateFeedback} onChange={e => setPrivateFeedback(e.target.value)}
            className="w-full border-2 border-blue-100 bg-blue-50/50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-400 shadow-[2px_2px_0px_0px_#BFDBFE] transition-all" />
          <p className="text-[10px] text-blue-500 font-bold mt-1 flex items-center gap-1">
            🔒 This message goes directly to the tutor and does not affect their public rating.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-11 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-[2px_2px_0px_0px_#E5E7EB] active:translate-y-[1px] active:shadow-none transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!rating || loading}
            className="flex-[2] h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-black rounded-xl shadow-[3px_3px_0px_0px_#93C5FD] active:translate-y-[2px] active:shadow-none transition-all">
            {loading ? '...' : 'Submit Review'}
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

  const [sessions,        setSessions]        = useState([]);
  const [nearbyTutors,    setNearbyTutors]    = useState([]);
  const [loadingSessions, setLoadingSessions]  = useState(true);
  const [loadingTutors,   setLoadingTutors]   = useState(true);
  const [activeTab,       setActiveTab]       = useState('upcoming');
  const [reviewTarget,    setReviewTarget]    = useState(null);
  const [refreshing,      setRefreshing]      = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await sessionService.getStudentSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  // Smart tutor recommendations
  useEffect(() => {
    const fetchRecs = async () => {
      setLoadingTutors(true);
      try {
        const base = { limit: 4 };
        if (user?.subjects?.length) base.subject = user.subjects[0];

        if (user?.location?.area) {
          const local = await tutorService.getTutors({ ...base, area: user.location.area });
          if (local.tutors?.length) { setNearbyTutors(local.tutors); return; }
        }
        const fallback = await tutorService.getTutors(base);
        setNearbyTutors(fallback.tutors || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTutors(false);
      }
    };
    fetchRecs();
  }, [user]);

  const handleReview = async (sessionId, rating, comment, privateFeedback) => {
    await sessionService.reviewSession(sessionId, rating, comment, privateFeedback);
    setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, isReviewed: true } : s));
  };

  const handleJoined = (sessionId) => {
    setSessions(prev => prev.map(s =>
      s._id === sessionId ? { ...s, studentJoinedAt: new Date().toISOString() } : s
    ));
  };

  const handleCancelled = (sessionId) => {
    setSessions(prev => prev.map(s =>
      s._id === sessionId ? { ...s, status: 'cancelled' } : s
    ));
  };

  // Stats
  const totalSessions  = sessions.length;
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const pendingCount   = sessions.filter(s => s.status === 'pending').length;
  const acceptedCount  = sessions.filter(s => s.status === 'accepted').length;

  // Pending reviews — sessions completed but not yet reviewed
  const pendingReviews = sessions.filter(s => s.status === 'completed' && !s.isReviewed);

  // ── FIX 1: Time-aware session classification ─────────────────
  // An "accepted" session moves to Past automatically once it is
  // more than 4 hours past its scheduled start time.
  const now = new Date();
  const upcomingSessions = sessions.filter(s => {
    if (s.status === 'pending') return true;
    if (s.status === 'accepted') {
      const sessionEnd = new Date(s.scheduledAt);
      sessionEnd.setHours(sessionEnd.getHours() + 4);
      return sessionEnd > now; // still show in upcoming if within 4h window
    }
    return false;
  });
  const pastSessions      = sessions.filter(s => ['completed','cancelled','rejected'].includes(s.status) ||
    (s.status === 'accepted' && (() => { const e = new Date(s.scheduledAt); e.setHours(e.getHours() + 4); return e <= now; })())
  );
  const displayedSessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── PENDING REVIEWS BANNER ─────────────────────────── */}
        {pendingReviews.length > 0 && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-4 shadow-[4px_4px_0px_0px_#fde68a] flex items-center gap-4 animate-fade-up delay-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-amber-600 fill-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-amber-900">
                {pendingReviews.length === 1
                  ? 'You have 1 session waiting for your review!'
                  : `You have ${pendingReviews.length} sessions waiting for your review!`}
              </p>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                Your reviews help other students find great tutors. Takes 30 seconds!
              </p>
            </div>
            <button onClick={() => setActiveTab('past')}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wide rounded-xl shadow-[2px_2px_0px_0px_#d97706] active:translate-y-[1px] active:shadow-none transition-all flex-shrink-0">
              Review now →
            </button>
          </div>
        )}

        {/* ── WELCOME HEADER ──────────────────────────────────── */}
        <div className="mb-8 animate-fade-up delay-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">👋</span>
                <h1 className="text-[28px] font-black text-gray-900 tracking-tight">Hey, {firstName}!</h1>
              </div>
              <p className="text-gray-500 font-medium text-sm">
                {user?.subjects?.length
                  ? `Looking for help in ${user.subjects.slice(0, 2).join(', ')}? We've got verified tutors near you.`
                  : 'Find your perfect tutor and book a free trial today.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleRefresh} disabled={refreshing}
                className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-600 text-xs font-black uppercase tracking-wide rounded-xl shadow-[2px_2px_0px_0px_#E5E7EB] hover:border-gray-300 active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <Link to="/browse"
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase tracking-wide rounded-xl border-2 border-blue-700 shadow-[4px_4px_0px_0px_#1D4ED8] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none transition-all">
                <Search className="w-4 h-4" /> Find a Tutor
              </Link>
            </div>
          </div>
        </div>

        {/* ── STATS ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={BookOpen}    label="Total Sessions"  value={totalSessions}  color="bg-blue-50 border-blue-200 text-blue-600"    delay="delay-50" />
          <StatCard icon={CheckCircle} label="Completed"       value={completedCount} color="bg-green-50 border-green-200 text-green-600"  delay="delay-100" />
          <StatCard icon={Clock}       label="Upcoming"        value={acceptedCount}  color="bg-amber-50 border-amber-200 text-amber-600"  delay="delay-150" />
          <StatCard icon={AlertCircle} label="Awaiting Reply"  value={pendingCount}   color="bg-purple-50 border-purple-200 text-purple-600" delay="delay-200" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── SESSIONS ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 animate-fade-up delay-100">
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-[4px_4px_0px_0px_#D1D5DB] overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b-2 border-gray-100">
                {[
                  { key: 'upcoming', label: 'Upcoming', count: upcomingSessions.length },
                  { key: 'past',     label: 'Past',     count: pastSessions.length },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-4 text-sm font-black uppercase tracking-wide transition-colors flex items-center justify-center gap-2 ${activeTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {tab.count}
                      </span>
                    )}
                    {tab.key === 'past' && pendingReviews.length > 0 && activeTab !== 'past' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-4">
                {loadingSessions && [...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-50 border-2 border-gray-100 rounded-xl shimmer" />
                ))}

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
                      onJoined={handleJoined}
                      onCancelled={handleCancelled}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RECOMMENDED TUTORS ──────────────────────────────── */}
          <div className="animate-fade-up delay-200 space-y-4">
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-[4px_4px_0px_0px_#D1D5DB] overflow-hidden">
              <div className="px-5 py-4 border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Recommended for you</h2>
                </div>
                {user?.location?.area && (
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">Based on your area & subjects</p>
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
                  return (
                    <Link key={tutor._id} to={`/tutor/${tutor._id}`}
                      className={`animate-fade-up ${STAGGER[i % STAGGER.length]} flex items-center gap-3 p-3 border-2 border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-[3px_3px_0px_0px_#BFDBFE] transition-all group`}>
                      <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-black text-sm">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate group-hover:text-blue-700 transition-colors">{tutor.name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold truncate">{tutor.subjects?.slice(0,2).join(' · ')}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] font-bold text-amber-700">{tutor.rating > 0 ? tutor.rating.toFixed(1) : 'New'}</span>
                          <span className="text-[10px] text-gray-300">· {tutor.area}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}

                <Link to="/browse"
                  className="flex items-center justify-center gap-1.5 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[11px] font-black text-gray-400 hover:text-blue-600 hover:border-blue-300 uppercase tracking-wide transition-all">
                  See all tutors <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {(!user?.subjects?.length || !user?.location?.area) && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#fde68a]">
                <div className="flex items-start gap-2.5">
                  <Bell className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-amber-800 mb-0.5">Complete your profile</p>
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                      Add your subjects and location to get personalised tutor recommendations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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