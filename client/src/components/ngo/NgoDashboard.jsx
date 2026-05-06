import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../layout/PublicNavbar';
import { ngoService } from '../../services/tutorService';
import {
  Users, Calendar, CheckCircle, Search, Star,
  Plus, X, Clock, AlertCircle, RefreshCw, Download,
  ChevronLeft, ChevronRight, BookOpen, MapPin,
  ArrowRight, BarChart2, Filter, XCircle,
  MessageSquare, Award, Trash2, Send, Handshake,
} from 'lucide-react';
import {
  SendRequestModal, CreateAssignmentModal, CollabRequestsTab, AssignmentsTab,
} from './CollabComponents';

// ── Design Tokens ─────────────────────────────────────────────────
const STATUS = {
  pending: { label: 'Awaiting Tutor', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  accepted: { label: 'Confirmed', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  rejected: { label: 'Declined', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: XCircle },
};

const COLLAB_STATUS = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: XCircle },
};

const STAGGER = ['delay-0', 'delay-75', 'delay-100', 'delay-150', 'delay-200'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GRADE_OPTIONS = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'Dropout / Non-school',
];


// ── Calendar helpers ──────────────────────────────────────────────
function getNext14Days() {
  const days = [], today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}
function getHalfHourSlots() {
  const slots = [];
  for (let h = 7; h < 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      const ampm = h < 12 ? 'AM' : 'PM';
      const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      slots.push({ value: `${hh}:${mm}`, label: `${dh}:${mm} ${ampm}` });
    }
  }
  return slots;
}
const DAYS_14 = getNext14Days();
const TIME_SLOTS = getHalfHourSlots();

// ── Helpers ───────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Shared Components ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border-2 uppercase tracking-wide ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, delay }) {
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

function StarDisplay({ rating, size = 'sm' }) {
  const w = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${w} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
    </span>
  );
}

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i}
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${i <= (hover || value)
              ? 'border-amber-400 bg-amber-50 text-amber-500 shadow-[2px_2px_0px_0px_#FCD34D]'
              : 'border-gray-200 text-gray-300 hover:border-gray-300'
            }`}>
          <Star className={`w-5 h-5 ${i <= (hover || value) ? 'fill-amber-400' : ''}`} />
        </button>
      ))}
    </div>
  );
}

// ── Empty States ──────────────────────────────────────────────────
function EmptyBeneficiaries({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
      <div className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center mb-5 shadow-[4px_4px_0px_0px_#bbf7d0]">
        <Users className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-lg font-black text-gray-900 mb-2">No beneficiaries yet</h3>
      <p className="text-sm text-gray-500 font-medium max-w-sm mb-6 leading-relaxed">
        Add your first beneficiary student to start tracking their learning journey.
      </p>
      <button onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-black rounded-xl shadow-[4px_4px_0px_0px_#15803d] active:translate-y-[2px] active:shadow-none transition-all uppercase tracking-wide">
        <Plus className="w-4 h-4" /> Add First Beneficiary
      </button>
    </div>
  );
}

function EmptySessions({ filter }) {
  const msg = filter === 'upcoming'
    ? 'No upcoming sessions. Use "Book Session" from the My Tutors tab to schedule one.'
    : 'No past sessions found for this period.';
  return (
    <div className="flex flex-col items-center text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
      <Calendar className="w-10 h-10 text-gray-200 mb-3" />
      <p className="text-sm font-bold text-gray-500 max-w-xs">{msg}</p>
    </div>
  );
}

function EmptyTutors() {
  return (
    <div className="flex flex-col items-center text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center mb-5 shadow-[4px_4px_0px_0px_#BFDBFE]">
        <BookOpen className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-black text-gray-900 mb-2">Start by browsing tutors and building your trusted teaching network.
        Once added, you can send collaboration requests.</h3>
      <p className="text-sm text-gray-500 font-medium max-w-sm mb-6 leading-relaxed">
        Browse the tutor marketplace and click "Add to My Tutors" on any profile to build your trusted pool.
      </p>
      <Link to="/browse"
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-xl shadow-[4px_4px_0px_0px_#93C5FD] active:translate-y-[2px] active:shadow-none transition-all uppercase tracking-wide">
        Browse Tutors <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ── Empanelled Tutor Card ─────────────────────────────────────────
function EmpanelledTutorCard({ entry, onSendRequest, onRemove, delay }) {
  const { tutorProfile, sessionsWithNgo, addedAt } = entry;
  const [removing, setRemoving] = useState(false);
  const initials = tutorProfile.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const handleRemove = async () => {
    if (!confirm(`Remove ${tutorProfile.name} from your tutor pool? Existing sessions are unaffected.`)) return;
    setRemoving(true);
    try {
      await onRemove(tutorProfile._id);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#E5E7EB] transition-all animate-fade-up ${delay}`}>

      {/* Avatar + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_#BFDBFE]">
          <span className="text-blue-700 font-black text-sm">{initials}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-black text-gray-900 truncate">{tutorProfile.name}</p>
            {tutorProfile.isVerified && (
              <span className="text-[9px] font-black bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">Verified</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {tutorProfile.area && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-400">
                <MapPin className="w-2.5 h-2.5" /> {tutorProfile.area}
              </span>
            )}
            {tutorProfile.rating > 0 && (
              <span className="flex items-center gap-0.5">
                <StarDisplay rating={tutorProfile.rating} />
                <span className="text-[10px] font-bold text-gray-400 ml-0.5">{tutorProfile.rating.toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="flex flex-wrap gap-1.5 sm:w-40 flex-shrink-0">
        {tutorProfile.subjects?.slice(0, 3).map(s => (
          <span key={s} className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">{s}</span>
        ))}
        {(tutorProfile.subjects?.length || 0) > 3 && (
          <span className="text-[10px] font-black text-gray-400">+{tutorProfile.subjects.length - 3}</span>
        )}
      </div>

      {/* NGO stats */}
      <div className="flex items-center gap-2 sm:w-32 flex-shrink-0">
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center">
          <p className="text-sm font-black text-gray-900 leading-none">{sessionsWithNgo}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Assignments</p>
        </div>
        <div className="text-[10px] font-bold text-gray-300">
          Added {timeAgo(addedAt)}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onSendRequest(tutorProfile)}
          className="flex items-center gap-1.5 text-[11px] font-black text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-xl transition-all shadow-[2px_2px_0px_0px_#93C5FD] active:translate-y-[1px] active:shadow-none">
          <Send className="w-3.5 h-3.5" /> Send Request
        </button>
        <button onClick={handleRemove} disabled={removing}
          className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${removing ? 'border-gray-100 text-gray-300' : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50'}`}
          title="Remove from pool">
          {removing ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ── Beneficiary Row ───────────────────────────────────────────────
function BeneficiaryRow({ beneficiary, delay, onBookSession }) {
  const { name, grade, subjects, location, lastActivity, sessionStats } = beneficiary;
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const statusTag = () => {
    if (!sessionStats || sessionStats.total === 0) return { label: 'No sessions yet', style: 'bg-gray-50 text-gray-400 border-gray-200' };
    if (sessionStats.accepted > 0 || sessionStats.pending > 0) return { label: 'Active', style: 'bg-green-50 text-green-700 border-green-200' };
    if (sessionStats.completed > 0) return { label: 'Sessions completed', style: 'bg-blue-50 text-blue-600 border-blue-200' };
    return { label: 'No active sessions', style: 'bg-amber-50 text-amber-700 border-amber-200' };
  };
  const tag = statusTag();

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#E5E7EB] transition-all animate-fade-up ${delay}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_#bbf7d0]">
          <span className="text-green-700 font-black text-sm">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-gray-900 truncate">{name}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {grade && <span className="text-[10px] font-bold text-gray-400">{grade}</span>}
            {location?.area && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-400">
                <MapPin className="w-2.5 h-2.5" /> {location.area}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:w-40 flex-shrink-0">
        {subjects?.length > 0
          ? subjects.slice(0, 3).map(s => <span key={s} className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">{s}</span>)
          : <span className="text-[10px] text-gray-300 font-bold">No subjects</span>}
        {subjects?.length > 3 && <span className="text-[10px] font-black text-gray-400">+{subjects.length - 3}</span>}
      </div>
      <div className="flex items-center gap-4 sm:w-36 flex-shrink-0">
        <div className="text-center">
          <p className="text-base font-black text-gray-900 leading-none">{sessionStats?.total || 0}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Sessions</p>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-green-700 leading-none">{sessionStats?.completed || 0}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Done</p>
        </div>
      </div>
      <div className="flex flex-col items-start sm:items-end gap-1.5 sm:w-36 flex-shrink-0">
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border-2 uppercase tracking-wide ${tag.style}`}>{tag.label}</span>
        <span className="text-[10px] font-bold text-gray-300">Activity: {timeAgo(lastActivity)}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link to={`/browse?area=${encodeURIComponent(location?.area || '')}`}
          className="flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-800 border-2 border-blue-200 hover:border-blue-400 bg-blue-50 px-3 py-1.5 rounded-xl transition-all shadow-[2px_2px_0px_0px_#BFDBFE]">
          Find Tutor <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// ── Session Feed Card (with NGO feedback) ─────────────────────────
function SessionFeedCard({ session, delay, onFeedbackSaved }) {
  const student = session.student;
  const tutor = session.tutorProfile;
  const date = new Date(session.scheduledAt);

  // Inline feedback state
  const isNgoSession = session.bookedBy === 'ngo';
  const isCompleted = session.status === 'completed';
  const canGiveFeedback = isNgoSession && isCompleted;

  const [localFeedback, setLocalFeedback] = useState(
    session.ngoFeedback?.rating ? session.ngoFeedback : null
  );
  const [showForm, setShowForm] = useState(false);
  const [fbRating, setFbRating] = useState(0);
  const [fbComment, setFbComment] = useState('');
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState('');

  const handleFeedbackSubmit = async () => {
    if (!fbRating) { setFbError('Please select a rating.'); return; }
    setFbLoading(true);
    setFbError('');
    try {
      await ngoService.addFeedback(session._id, fbRating, fbComment);
      const saved = { rating: fbRating, comment: fbComment, submittedAt: new Date().toISOString() };
      setLocalFeedback(saved);
      setShowForm(false);
      onFeedbackSaved?.(session._id, saved);
    } catch (err) {
      setFbError(err.response?.data?.message || 'Failed to save. Try again.');
      console.error('[NGO] feedback error:', err.response?.data || err.message);
    } finally {
      setFbLoading(false);
    }
  };

  return (
    <div className={`p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 transition-all animate-fade-up ${delay}`}>
      <div className="flex items-center gap-3">
        {/* Student avatar */}
        <div className="w-9 h-9 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center flex-shrink-0">
          <span className="text-green-700 font-black text-xs">{student?.name?.[0]?.toUpperCase() || '?'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-black text-gray-900 truncate">{student?.name}</p>
            <span className="text-[10px] text-gray-400 font-bold">→</span>
            <p className="text-sm font-bold text-gray-500 truncate">{tutor?.name || 'Unassigned'}</p>
            {isNgoSession && (
              <span className="text-[9px] font-black bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">NGO</span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 font-bold mt-0.5">
            {session.subject} · {session.mode} ·{' '}
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at{' '}
            {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      {/* NGO feedback section — only for NGO-booked completed sessions */}
      {canGiveFeedback && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {localFeedback ? (
            // Feedback already given
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StarDisplay rating={localFeedback.rating} />
                <span className="text-xs font-black text-gray-600">{localFeedback.rating}/5</span>
                {localFeedback.comment && (
                  <span className="text-[11px] text-gray-400 font-medium italic truncate max-w-[160px]">"{localFeedback.comment}"</span>
                )}
              </div>
              <button onClick={() => { setFbRating(localFeedback.rating); setFbComment(localFeedback.comment || ''); setShowForm(true); }}
                className="text-[10px] font-black text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Edit
              </button>
            </div>
          ) : !showForm ? (
            // Invite to rate
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-[11px] font-black text-amber-600 hover:text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all">
              <Star className="w-3.5 h-3.5" /> Rate this tutor (private)
            </button>
          ) : null}

          {showForm && (
            <div className="space-y-3 mt-2">
              {fbError && (
                <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fbError}
                </p>
              )}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your private rating</p>
                <StarInput value={fbRating} onChange={setFbRating} />
              </div>
              <textarea rows={2} value={fbComment} onChange={e => setFbComment(e.target.value)}
                placeholder="Private notes about this tutor's performance... (optional)"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-amber-400 shadow-[2px_2px_0px_0px_#E5E7EB] transition-all" />
              <div className="flex gap-2">
                <button onClick={() => { setShowForm(false); setFbError(''); }}
                  className="px-3 h-8 text-xs font-bold border-2 border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleFeedbackSubmit} disabled={fbLoading}
                  className="flex-1 h-8 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5">
                  {fbLoading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Award className="w-3 h-3" /> Save Evaluation</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────
function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages } = pagination;
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}
        className="w-8 h-8 rounded-lg border-2 border-gray-200 bg-white flex items-center justify-center disabled:opacity-30 hover:border-gray-300 transition-all">
        <ChevronLeft className="w-4 h-4 text-gray-500" />
      </button>
      <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Page {page} of {pages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= pages}
        className="w-8 h-8 rounded-lg border-2 border-gray-200 bg-white flex items-center justify-center disabled:opacity-30 hover:border-gray-300 transition-all">
        <ChevronRight className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function NgoDashboard() {
  const { user } = useAuth();

  // ── UI state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');
  const [sessionFilter, setSessionFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [sendReqTutor, setSendReqTutor] = useState(null); // tutor to send collab request to

  // ── Stats ─────────────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Beneficiaries ─────────────────────────────────────────────
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [benPagination, setBenPagination] = useState(null);
  const [benLoading, setBenLoading] = useState(true);
  const [benPage, setBenPage] = useState(1);

  // ── Sessions ──────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [sesPagination, setSesPagination] = useState(null);
  const [sesLoading, setSesLoading] = useState(true);
  const [sesPage, setSesPage] = useState(1);

  // ── Empanelled Tutors (lazy — fetched when tab opens) ─────────
  const [tutors, setTutors] = useState([]);
  const [tutorsLoading, setTutorsLoading] = useState(false);
  const [tutorsFetched, setTutorsFetched] = useState(false);

  // ── Collab Requests (lazy) ────────────────────────────────────
  const [collabReqs, setCollabReqs] = useState([]);
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabFetched, setCollabFetched] = useState(false);
  const [collabFilter, setCollabFilter] = useState('all');

  // ── Assignments (lazy) ────────────────────────────────────────
  const [assignments, setAssignments] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignFetched, setAssignFetched] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null); // accepted request

  // ── Fetchers ──────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await ngoService.getStats();
      setStats(data.stats);
    } catch (err) {
      console.error('[NGO] stats error:', err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchBeneficiaries = useCallback(async (page = 1, search = '') => {
    setBenLoading(true);
    try {
      const data = await ngoService.getBeneficiaries({ page, limit: 15, search: search || undefined });
      setBeneficiaries(data.beneficiaries);
      setBenPagination(data.pagination);
    } catch (err) {
      console.error('[NGO] beneficiaries error:', err.message);
    } finally {
      setBenLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async (page = 1, filter = 'upcoming') => {
    setSesLoading(true);
    try {
      const data = await ngoService.getSessions({ page, limit: 20, filter });
      setSessions(data.sessions);
      setSesPagination(data.pagination);
    } catch (err) {
      console.error('[NGO] sessions error:', err.message);
    } finally {
      setSesLoading(false);
    }
  }, []);

  const fetchTutors = useCallback(async () => {
    setTutorsLoading(true);
    try {
      const data = await ngoService.getEmpanelledTutors();
      setTutors(data.tutors || []);
      setTutorsFetched(true);
    } catch (err) {
      console.error('[NGO] empanelled tutors error:', err.message);
    } finally {
      setTutorsLoading(false);
    }
  }, []);

  const fetchCollabRequests = useCallback(async () => {
    setCollabLoading(true);
    try {
      const data = await ngoService.getCollabRequests('all');
      setCollabReqs(data.requests || []);
      setCollabFetched(true);
    } catch (err) {
      console.error('[NGO] collab requests error:', err.message);
    } finally {
      setCollabLoading(false);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    setAssignLoading(true);
    try {
      const data = await ngoService.getAssignments('all');
      setAssignments(data.assignments || []);
      setAssignFetched(true);
    } catch (err) {
      console.error('[NGO] assignments error:', err.message);
    } finally {
      setAssignLoading(false);
    }
  }, []);

  // Initial loads
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchSessions(1, sessionFilter); setSesPage(1); }, [fetchSessions, sessionFilter]);
  useEffect(() => { fetchBeneficiaries(1, ''); }, [fetchBeneficiaries]);

  // Lazy load tabs
  useEffect(() => {
    if (activeTab === 'tutors' && !tutorsFetched) fetchTutors();
    if (activeTab === 'requests' && !collabFetched) fetchCollabRequests();
    if (activeTab === 'assignments' && !assignFetched) fetchAssignments();
  }, [activeTab, tutorsFetched, fetchTutors, collabFetched, fetchCollabRequests, assignFetched, fetchAssignments]);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => { fetchBeneficiaries(1, searchQuery); setBenPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, fetchBeneficiaries]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleBeneficiaryCreated = (data) => {
    setShowAddModal(false);
    setSuccessData(data);
    fetchStats();
    fetchBeneficiaries(1, searchQuery);
  };

  const handleExport = async () => {
    setExporting(true);
    try { await ngoService.exportCsv(); }
    catch (err) { console.error('[NGO] export error:', err.message); }
    finally { setExporting(false); }
  };

  const handleRemoveTutor = async (tutorProfileId) => {
    try {
      await ngoService.removeEmpanelment(tutorProfileId);
      setTutors(prev => prev.filter(e => e.tutorProfile._id !== tutorProfileId));
      fetchStats();
    } catch (err) {
      console.error('[NGO] remove tutor error:', err.message);
    }
  };

  const handleFeedbackSaved = (sessionId, feedback) => {
    setSessions(prev => prev.map(s =>
      s._id === sessionId ? { ...s, ngoFeedback: feedback } : s
    ));
  };

  const handleSendRequest = async (tutorProfile, payload) => {
    try {
      await ngoService.sendCollabRequest({ tutorProfileId: tutorProfile._id, ...payload });
      setSendReqTutor(null);
      setCollabFetched(false); // force refresh on next visit
      if (activeTab === 'requests') fetchCollabRequests();
    } catch (err) {
      throw err; // let modal handle error display
    }
  };

  const handleCancelRequest = async (requestId) => {
    await ngoService.cancelCollabRequest(requestId);
    setCollabReqs(prev => prev.map(r => r._id === requestId ? { ...r, status: 'cancelled' } : r));
  };

  const handleCreateAssignment = async (requestId, payload) => {
    await ngoService.createAssignment({ collabRequestId: requestId, ...payload });
    setShowAssignModal(null);
    setCollabReqs(prev => prev.map(r => r._id === requestId ? { ...r, hasActiveAssignment: true } : r));
    setAssignFetched(false);
    if (activeTab === 'assignments') fetchAssignments();
  };

  const handleEndAssignment = async (assignmentId) => {
    await ngoService.endAssignment(assignmentId);
    setAssignments(prev => prev.map(a => a._id === assignmentId ? { ...a, status: 'ended' } : a));
  };

  const orgName = user?.qualification || user?.name || 'Your Organisation';
  const firstName = user?.name?.split(' ')[0] || 'NGO';

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 animate-fade-up delay-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black bg-green-100 text-green-700 border-2 border-green-200 px-2.5 py-1 rounded-full uppercase tracking-widest">
                NGO Partner
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{orgName}</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Welcome back, {firstName} - Manage tutors, send requests, and assign them to your learning groups.</p>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <KpiCard icon={Users} label="Active Tutors" value={statsLoading ? '—' : stats?.activeTutors ?? 0} sub="in your network" color="bg-amber-50 border-amber-200 text-amber-600" delay="delay-150" />
          <KpiCard
            icon={Clock}
            label="Pending Requests"
            value={statsLoading ? '—' : stats?.pendingRequests ?? 0}
            sub="awaiting tutor response"
            color="bg-red-50 border-red-200 text-red-500"
            delay="delay-200"
          />
        </div>
        {/* ── Tabs ── */}
        <div className="flex flex-wrap border-b-2 border-gray-200 mb-6 animate-fade-up delay-100">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart2, count: null },
            { key: 'tutors', label: 'My Tutors', icon: BookOpen, count: tutorsFetched ? tutors.length : null },
            { key: 'requests', label: 'Requests', icon: Send, count: collabFetched ? collabReqs.filter(r => r.status === 'pending').length : null },
            { key: 'assignments', label: 'Assignments', icon: Handshake, count: assignFetched ? assignments.filter(a => a.status === 'active').length : null },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wide transition-colors border-b-2 -mb-px ${activeTab === tab.key
                  ? 'text-green-700 border-green-600 bg-green-50/50'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className={`ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border ${activeTab === tab.key ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-up delay-100">

            {/* Primary Action Card */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-[4px_4px_0px_0px_#E5E7EB]">
              <h2 className="text-lg font-black text-gray-900 mb-2">
                Get started with tutor collaboration
              </h2>
              <p className="text-sm text-gray-500 font-medium mb-4">
                Build your tutor pool and start sending collaboration requests.
              </p>

              <div className="flex gap-3 flex-wrap">
                <Link
                  to="/browse"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-xl shadow-[3px_3px_0px_0px_#93C5FD]"
                >
                  Browse Tutors <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => setActiveTab('tutors')}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-700 text-sm font-black rounded-xl hover:border-gray-300"
                >
                  View My Tutors
                </button>
              </div>
            </div>

            {/* Stats Insight Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
                <p className="text-sm font-bold text-gray-500 mb-1">Tutor Pool</p>
                <p className="text-xl font-black text-gray-900">{tutors.length}</p>
                <p className="text-xs text-gray-400">Saved tutors</p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
                <p className="text-sm font-bold text-gray-500 mb-1">Pending Requests</p>
                <p className="text-xl font-black text-gray-900">
                  {collabReqs.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-xs text-gray-400">Waiting for tutor response</p>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB: My Tutors ── */}
        {activeTab === 'tutors' && (
          <div className="space-y-5 animate-fade-up delay-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 font-bold">
                {tutorsFetched ? `${tutors.length} trusted tutor${tutors.length !== 1 ? 's' : ''} in your pool` : ''}
              </p>
              <div className="flex gap-2">
                <button onClick={fetchTutors}
                  className="flex items-center gap-1 text-[11px] font-black text-gray-400 hover:text-gray-700 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
                <Link to="/browse"
                  className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 hover:text-blue-800 border-2 border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xl transition-all shadow-[2px_2px_0px_0px_#BFDBFE]">
                  Browse Tutors <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {tutorsLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
              </div>
            ) : tutors.length === 0 ? (
              <EmptyTutors />
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[1fr_160px_144px_auto] gap-3 px-4 mb-1">
                  {['Tutor', 'Subjects','Assignments', 'Actions'].map(h => (
                    <p key={h} className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</p>
                  ))}
                </div>
                <div className="space-y-2">
                  {tutors.map((entry, i) => (
                    <EmpanelledTutorCard
                      key={entry.empanelmentId}
                      entry={entry}
                      delay={STAGGER[i % STAGGER.length]}
                      onSendRequest={setSendReqTutor}
                      onRemove={handleRemoveTutor}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB: Requests ── */}
        {activeTab === 'requests' && (
          <CollabRequestsTab
            requests={collabReqs}
            loading={collabLoading}
            filter={collabFilter}
            onFilterChange={setCollabFilter}
            onRefresh={fetchCollabRequests}
            onCancel={handleCancelRequest}
            onCreateAssignment={req => setShowAssignModal(req)}
          />
        )}

        {/* ── TAB: Assignments ── */}
        {activeTab === 'assignments' && (
          <AssignmentsTab
            assignments={assignments}
            loading={assignLoading}
            onRefresh={fetchAssignments}
            onEnd={handleEndAssignment}
          />
        )}

      </div>

      {/* ── Modals ── */}
      {showAddModal && (
        <AddBeneficiaryModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleBeneficiaryCreated}
        />
      )}
      {successData && (
        <SuccessModal data={successData} onClose={() => setSuccessData(null)} />
      )}
      {sendReqTutor && (
        <SendRequestModal
          tutor={sendReqTutor}
          onClose={() => setSendReqTutor(null)}
          onSend={handleSendRequest}
        />
      )}
      {showAssignModal && (
        <CreateAssignmentModal
          request={showAssignModal}
          onClose={() => setShowAssignModal(null)}
          onCreate={handleCreateAssignment}
        />
      )}
    </div>
  );
}