import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../layout/PublicNavbar';
import { sessionService, tutorService } from '../../services/tutorService';
import EditProfileModal from './EditProfileModal';
import {
  Star, Calendar, Users, CheckCircle, Clock, XCircle,
  AlertCircle, IndianRupee, MessageSquare, Shield, X,
  Briefcase, Award, MapPin, Edit2, Phone, Video,
  ExternalLink, Link2, RefreshCw, CalendarClock, AlertTriangle
} from 'lucide-react';

const STATUS = {
  pending:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  accepted:  { label: 'Confirmed', color: 'bg-green-50 text-green-700 border-green-200',   icon: CheckCircle },
  rejected:  { label: 'Declined',  color: 'bg-red-50 text-red-600 border-red-200',         icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-50 text-gray-500 border-gray-200',      icon: XCircle },
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

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <div className={`animate-fade-up ${delay} bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-[4px_4px_0px_0px_#E5E7EB]`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border-2 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-300 font-semibold mt-0.5">{sub}</p>}
    </div>
  );
}

const STAGGER = ['delay-0','delay-75','delay-100','delay-150','delay-200'];

// ── Meeting link input ─────────────────────────────────────────
function MeetingLinkInput({ session, onSaved }) {
  const [link,    setLink]    = useState(session.meetingLink || '');
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(!!session.meetingLink);
  const [error,   setError]   = useState('');

  const handleSave = async () => {
    if (!link.trim()) return;
    setLoading(true);
    setError('');
    try {
      await sessionService.updateMeetingLink(session._id, link.trim());
      setSaved(true);
      onSaved?.(session._id, link.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid link');
    } finally {
      setLoading(false);
    }
  };

  if (saved) return (
    <div className="flex items-center gap-2">
      <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
      <a href={link} target="_blank" rel="noreferrer"
        className="text-[11px] font-black text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[140px]">
        Link set <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
      </a>
      <button onClick={() => setSaved(false)} className="text-[10px] text-gray-400 hover:text-gray-600 font-bold border border-gray-200 px-1.5 py-0.5 rounded-md">
        Edit
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="url" value={link} onChange={e => setLink(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="w-full h-8 pl-8 pr-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-[11px] font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <button onClick={handleSave} disabled={loading || !link.trim()}
          className="h-8 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-black rounded-lg shadow-[2px_2px_0px_0px_#93C5FD] active:translate-y-[1px] active:shadow-none transition-all flex-shrink-0">
          {loading ? '...' : 'Save'}
        </button>
      </div>
      {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}
    </div>
  );
}

// ── Reschedule modal ───────────────────────────────────────────
function RescheduleModal({ session, onClose, onSaved }) {
  const student  = session.student;
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  const handleSubmit = async () => {
    if (!newDate || !newTime) { setError('Please select a date and time.'); return; }
    setLoading(true);
    try {
      const dt = new Date(`${newDate}T${newTime}:00`);
      await sessionService.rescheduleSession(session._id, dt.toISOString(), note);
      onSaved?.(session._id, dt);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-2 border-gray-200 rounded-3xl p-7 w-full max-w-md shadow-[8px_8px_0px_0px_#D1D5DB] animate-scale-in">
        <h3 className="text-lg font-black text-gray-900 mb-0.5">Reschedule Session</h3>
        <p className="text-sm text-gray-400 font-medium mb-5">with {student?.name}</p>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold px-4 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">New Date</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                min={minDate.toISOString().split('T')[0]}
                className="w-full h-11 px-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:border-blue-500 shadow-[2px_2px_0px_0px_#E5E7EB] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">New Time</label>
              <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:border-blue-500 shadow-[2px_2px_0px_0px_#E5E7EB] transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Note to student <span className="normal-case font-normal text-gray-400">(optional)</span>
            </label>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. I have an appointment, can we shift to Wednesday 5 PM?"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 shadow-[2px_2px_0px_0px_#E5E7EB] transition-all" />
          </div>

          <p className="text-[11px] text-blue-600 font-bold bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            💡 The student will see the updated time on their dashboard. Notify them on WhatsApp as well for a smooth handoff.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 h-11 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-[2px_2px_0px_0px_#E5E7EB] active:translate-y-[1px] active:shadow-none transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-[2] h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-black rounded-xl shadow-[3px_3px_0px_0px_#93C5FD] active:translate-y-[2px] active:shadow-none transition-all">
            {loading ? '...' : 'Save New Time'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Request card ───────────────────────────────────────────────
function RequestCard({ session, onAccept, onReject, delay }) {
  const [loading,   setLoading]   = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const student = session.student;
  const date    = new Date(session.scheduledAt);
  const isTrial = session.type === 'trial';

  const handle = async (action) => {
    if (action === 'reject') setRejecting(true); else setLoading(true);
    try { await (action === 'accept' ? onAccept : onReject)(session._id); }
    finally { setLoading(false); setRejecting(false); }
  };

  return (
    <div className={`bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-[3px_3px_0px_0px_#fde68a] animate-fade-up ${delay}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_#fde68a]">
          <span className="text-amber-700 font-black text-sm">{student?.name?.[0]?.toUpperCase() || 'S'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-black text-gray-900">{student?.name || 'Student'}</p>
            {/* Trial vs Paid badge */}
            {isTrial ? (
              <span className="text-[10px] font-black bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full">FREE TRIAL · ₹0</span>
            ) : (
              <span className="text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-300 px-2 py-0.5 rounded-full">PAID · ₹{session.amount}</span>
            )}
          </div>
          <p className="text-xs font-bold text-gray-500">{session.subject}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400 font-semibold">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
              {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
              {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
            <span className="capitalize font-bold">{session.mode}</span>
          </div>
          {session.notes && (
            <p className="text-xs text-gray-500 italic mt-2 bg-amber-50/70 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
              "{session.notes}"
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={() => handle('reject')} disabled={loading || rejecting}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black uppercase tracking-wide rounded-xl transition-all disabled:opacity-50">
          <X className="w-3.5 h-3.5" /> {rejecting ? '...' : 'Decline'}
        </button>
        <button onClick={() => handle('accept')} disabled={loading || rejecting}
          className="flex-[2] flex items-center justify-center gap-1.5 h-10 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-wide rounded-xl shadow-[3px_3px_0px_0px_#86EFAC] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all disabled:opacity-50">
          {loading ? '...' : <><CheckCircle className="w-3.5 h-3.5" /> Accept Session</>}
        </button>
      </div>
    </div>
  );
}

// ── Session row (schedule / history) ──────────────────────────
function SessionRow({ session, onComplete, onReschedule, onMeetingLinkSaved, delay }) {
  const student  = session.student;
  const date     = new Date(session.scheduledAt);
  const isPast   = date < new Date();
  const isTrial  = session.type === 'trial';

  // ── FIX 2: studentJoinedAt UX state ─────────────────────────────
  const [completeWarning, setCompleteWarning] = useState('');
  const [completing,      setCompleting]      = useState(false);

  const handleMarkDone = async () => {
    // For online sessions, the student must have joined via EduReach.
    // This guards the UX — the backend will also reject the call if
    // this check is bypassed (e.g. via direct API call).
    if (session.mode === 'online' && !session.studentJoinedAt) {
      setCompleteWarning(
        'The student has not joined via EduReach yet. Ask them to click “Join Class” on their dashboard first.'
      );
      return;
    }
    setCompleteWarning('');
    setCompleting(true);
    try {
      await onComplete(session._id);
    } catch (err) {
      // Backend STUDENT_NOT_JOINED error — surface clearly
      const code = err.response?.data?.code;
      const msg  = err.response?.data?.message;
      if (code === 'STUDENT_NOT_JOINED') {
        setCompleteWarning(msg || 'Student has not joined yet.');
      } else {
        setCompleteWarning(msg || 'Could not mark done. Try again.');
      }
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 p-4 border-2 border-gray-100 rounded-2xl hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#E5E7EB] transition-all bg-white animate-fade-up ${delay}`}>
      {/* Main row */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-700 font-black text-sm">{student?.name?.[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-gray-900 truncate">{student?.name}</p>
            {isTrial
              ? <span className="text-[9px] font-black bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">TRIAL</span>
              : <span className="text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full">PAID ₹{session.amount}</span>
            }
          </div>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">{session.subject} · {session.mode}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black text-gray-800">
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
          <p className="text-xs text-gray-400 font-bold">
            {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
        <div className="flex-shrink-0">
          {session.status === 'accepted' && isPast ? (
            <button onClick={handleMarkDone} disabled={completing}
              className="text-[10px] font-black text-blue-700 hover:text-white border-2 border-blue-200 hover:border-blue-600 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 shadow-[2px_2px_0px_0px_#BFDBFE] transition-all uppercase tracking-wide disabled:opacity-60">
              {completing ? '...' : 'Mark Done ✓'}
            </button>
          ) : (
            <StatusBadge status={session.status} />
          )}
        </div>
      </div>

      {/* FIX 2: studentJoinedAt warning banner — shows below the row */}
      {completeWarning && (
        <div className="flex items-start gap-2.5 bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[11px] font-black text-amber-800 leading-relaxed">{completeWarning}</p>
          </div>
          <button onClick={() => setCompleteWarning('')} className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Accepted session extras */}
      {session.status === 'accepted' && (
        <div className="flex flex-col gap-2 pt-2 border-t-2 border-gray-50">
          {/* Meeting link */}
          {session.mode === 'online' && (
            <div className="flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <MeetingLinkInput session={session} onSaved={onMeetingLinkSaved} />
            </div>
          )}

          {/* Student WhatsApp */}
          {student?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              <a href={`https://wa.me/91${student.phone.replace(/\D/g,'')}`}
                target="_blank" rel="noreferrer"
                className="text-[11px] font-black text-green-700 hover:text-green-900 flex items-center gap-1">
                WhatsApp {student.name?.split(' ')[0]} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}

          {/* Reschedule */}
          {!isPast && (
            <button onClick={() => onReschedule(session)}
              className="flex items-center gap-1.5 text-[11px] font-black text-gray-400 hover:text-blue-600 transition-colors self-start">
              <CalendarClock className="w-3.5 h-3.5" /> Reschedule
            </button>
          )}

          {/* Student joined indicator (online sessions) */}
          {session.mode === 'online' && (
            <span className={`text-[10px] font-bold flex items-center gap-1 ${
              session.studentJoinedAt ? 'text-green-600' : 'text-gray-300'
            }`}>
              {session.studentJoinedAt
                ? <><CheckCircle className="w-3 h-3" /> Student joined via EduReach</>
                : <><Clock className="w-3 h-3" /> Waiting for student to join…</>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function VerificationBanner({ isVerified }) {
  if (isVerified) return (
    <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-2xl px-5 py-4 shadow-[4px_4px_0px_0px_#86EFAC]">
      <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-black text-green-800 uppercase tracking-wide">Verified Tutor ✓</p>
        <p className="text-xs text-green-600 font-bold mt-0.5">Your credentials have been approved by EduReach.</p>
      </div>
    </div>
  );
  return (
    <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-4 shadow-[4px_4px_0px_0px_#fde68a]">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-black text-amber-800 uppercase tracking-wide">Verification Pending</p>
        <p className="text-xs text-amber-700 font-bold mt-0.5">Our team reviews credentials within 48 hours. Students can still book trials with you.</p>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function TutorDashboard() {
  const { user } = useAuth();

  const [sessions,        setSessions]        = useState([]);
  const [profile,         setProfile]         = useState(null);
  const [loadingSessions, setLoadingSessions]  = useState(true);
  const [loadingProfile,  setLoadingProfile]   = useState(true);
  const [activeTab,       setActiveTab]        = useState('requests');
  const [isEditingProfile,setIsEditingProfile] = useState(false);
  const [rescheduleTarget,setRescheduleTarget] = useState(null);

  useEffect(() => {
    sessionService.getTutorSessions()
      .then(data => setSessions(data.sessions || []))
      .catch(console.error)
      .finally(() => setLoadingSessions(false));

    tutorService.getMyProfile()
      .then(data => setProfile(data.profile))
      .catch(console.error)
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleAccept = async (id) => {
    await sessionService.respondToSession(id, 'accept');
    setSessions(prev => prev.map(s => s._id === id ? { ...s, status: 'accepted' } : s));
  };
  const handleReject = async (id) => {
    await sessionService.respondToSession(id, 'reject');
    setSessions(prev => prev.map(s => s._id === id ? { ...s, status: 'rejected' } : s));
  };
  const handleComplete = async (id) => {
    // Note: The actual studentJoinedAt check is now handled inside SessionRow
    // for UX feedback. This function is only called after that guard passes.
    // The backend also enforces this for online sessions as a second layer.
    await sessionService.completeSession(id);
    setSessions(prev => prev.map(s => s._id === id ? { ...s, status: 'completed' } : s));
  };
  const handleMeetingLinkSaved = (id, link) => {
    setSessions(prev => prev.map(s => s._id === id ? { ...s, meetingLink: link } : s));
  };
  const handleRescheduleSaved = (id, newDt) => {
    setSessions(prev => prev.map(s => s._id === id ? { ...s, scheduledAt: newDt.toISOString() } : s));
  };

  const pendingRequests  = sessions.filter(s => s.status === 'pending');
  const upcomingSessions = sessions.filter(s => s.status === 'accepted' && new Date(s.scheduledAt) >= new Date());
  const pastSessions     = sessions.filter(s => ['completed','cancelled','rejected'].includes(s.status));
  const earnings         = sessions.filter(s => s.status === 'completed').reduce((a, s) => a + (s.amount || 0), 0);

  const TABS = [
    { key: 'requests',  label: 'Requests',  count: pendingRequests.length },
    { key: 'upcoming',  label: 'Schedule',  count: upcomingSessions.length },
    { key: 'past',      label: 'History',   count: pastSessions.length },
  ];

  const tabSessions = activeTab === 'requests' ? pendingRequests
    : activeTab === 'upcoming' ? upcomingSessions : pastSessions;

  const firstName = user?.name?.split(' ')[0] || 'Tutor';

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-6 animate-fade-up delay-0">
          <h1 className="text-[32px] font-black text-gray-900 tracking-tight mb-1">Dashboard</h1>
          <p className="text-gray-500 font-bold text-sm">
            Hi {firstName}! {pendingRequests.length > 0
              ? `You have ${pendingRequests.length} new trial request${pendingRequests.length > 1 ? 's' : ''} waiting.`
              : 'All caught up — no pending requests.'}
          </p>
        </div>

        {!loadingProfile && (
          <div className="mb-6 animate-fade-up delay-50">
            <VerificationBanner isVerified={profile?.isVerified || user?.isVerified} />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}       label="Total Students"  value={profile?.totalStudents || 0}                                             color="bg-blue-50 border-blue-200 text-blue-600"    delay="delay-50" />
          <StatCard icon={CheckCircle} label="Sessions Done"   value={profile?.totalSessions || 0}                                             color="bg-green-50 border-green-200 text-green-600" delay="delay-100" />
          <StatCard icon={Star}        label="Rating"          value={profile?.rating > 0 ? profile.rating.toFixed(1) : '—'} sub={profile?.totalReviews ? `${profile.totalReviews} reviews` : undefined} color="bg-amber-50 border-amber-200 text-amber-600" delay="delay-150" />
          <StatCard icon={IndianRupee} label="Earnings"        value={earnings > 0 ? `₹${earnings.toLocaleString('en-IN')}` : '₹0'} sub="Trials are free" color="bg-purple-50 border-purple-200 text-purple-600" delay="delay-200" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sessions panel */}
          <div className="lg:col-span-2 animate-fade-up delay-100">
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-[4px_4px_0px_0px_#D1D5DB] overflow-hidden">
              <div className="flex border-b-2 border-gray-100">
                {TABS.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 ${activeTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {tab.count}
                      </span>
                    )}
                    {tab.key === 'requests' && tab.count > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-4">
                {loadingSessions && [...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-50 border-2 border-gray-100 rounded-xl shimmer" />
                ))}

                {!loadingSessions && tabSessions.length === 0 && (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-gray-50 border-2 border-gray-200 flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_#E5E7EB]">
                      <Calendar className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-900 font-black text-lg mb-1">
                      {activeTab === 'requests' ? 'No pending requests' : activeTab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
                    </p>
                    <p className="text-gray-400 text-sm font-bold">
                      {activeTab === 'requests' ? 'New trial requests will appear here.' : 'Sessions will appear here.'}
                    </p>
                  </div>
                )}

                {!loadingSessions && activeTab === 'requests' && pendingRequests.map((s, i) => (
                  <RequestCard key={s._id} session={s} onAccept={handleAccept} onReject={handleReject} delay={STAGGER[i % STAGGER.length]} />
                ))}

                {!loadingSessions && activeTab !== 'requests' && tabSessions.map((s, i) => (
                  <SessionRow key={s._id} session={s}
                    onComplete={handleComplete}
                    onReschedule={setRescheduleTarget}
                    onMeetingLinkSaved={handleMeetingLinkSaved}
                    delay={STAGGER[i % STAGGER.length]} />
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="animate-fade-up delay-200 space-y-6">

            {/* Profile card */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl shadow-[6px_6px_0px_0px_#D1D5DB] overflow-hidden">
              <div className="px-6 py-5 border-b-2 border-gray-200 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Your Profile</h2>
                <button onClick={() => setIsEditingProfile(true)}
                  className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-[2px_2px_0px_0px_#BFDBFE] active:translate-y-[1px] active:shadow-none transition-all">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="p-6">
                {loadingProfile ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-100 shimmer rounded-lg w-1/2" />
                    <div className="h-4 bg-gray-100 shimmer rounded-lg w-3/4" />
                    <div className="h-16 bg-gray-100 shimmer rounded-xl" />
                  </div>
                ) : profile ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subjects</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.subjects?.slice(0, 4).map(s => (
                          <span key={s} className="text-[11px] font-black px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border-2 border-blue-200">{s}</span>
                        ))}
                        {profile.subjects?.length > 4 && (
                          <span className="text-[11px] font-black px-3 py-1.5 rounded-full bg-gray-50 text-gray-500 border-2 border-gray-200">+{profile.subjects.length - 4}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Location</p>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-bold text-gray-700">{profile.area}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Hourly Rate</p>
                        <p className="text-sm font-black text-gray-900">
                          {profile.hourlyRate > 0 ? `₹${profile.hourlyRate}/hr` : <span className="text-amber-500">Not set</span>}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t-2 border-dashed border-gray-100">
                      {profile.qualification && (
                        <div className="mb-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Qualification</p>
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-purple-500" />
                            <p className="text-xs font-bold text-gray-800">{profile.qualification}</p>
                          </div>
                        </div>
                      )}
                      {profile.experience && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Experience</p>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-blue-500" />
                            <p className="text-xs font-bold text-gray-800">{profile.experience}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {profile.bio && (
                      <div className="pt-4 border-t-2 border-dashed border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bio</p>
                        <p className="text-xs text-gray-600 leading-relaxed font-semibold italic line-clamp-3">"{profile.bio}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 font-bold">Profile not found.</p>
                )}
              </div>
            </div>

            {/* Reviews + private feedback */}
            {profile?.reviews?.length > 0 && (
              <div className="bg-white border-2 border-gray-200 rounded-3xl shadow-[4px_4px_0px_0px_#D1D5DB] overflow-hidden">
                <div className="px-6 py-4 border-b-2 border-gray-100">
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" /> Student Reviews
                  </h2>
                </div>
                <div className="p-5 space-y-3">
                  {profile.reviews.slice(0, 3).map((r, i) => (
                    <div key={i} className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{r.studentName}</span>
                      </div>
                      {r.comment && <p className="text-[12px] text-gray-700 font-medium leading-relaxed">"{r.comment}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditingProfile && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditingProfile(false)}
          onSuccess={updated => { setProfile(updated); setIsEditingProfile(false); }}
        />
      )}

      {rescheduleTarget && (
        <RescheduleModal
          session={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSaved={handleRescheduleSaved}
        />
      )}
    </div>
  );
}