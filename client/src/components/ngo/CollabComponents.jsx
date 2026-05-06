// ── NGO Collaboration Components ─────────────────────────────────
// Extracted to keep NgoDashboard.jsx manageable.
// SendRequestModal, CreateAssignmentModal, CollabRequestsTab, AssignmentsTab

import { useState } from 'react';
import {
  X, AlertCircle, Send, Shield, CheckSquare, GraduationCap,
  RefreshCw, Ban, CheckCircle, XCircle, Clock, PhoneCall,
  Mail, Handshake,
} from 'lucide-react';

const GRADE_OPTIONS = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'Dropout / Non-school',
];
const SUBJECT_OPTIONS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'Hindi', 'History', 'Geography', 'Science', 'Computer Science',
];
const STAGGER = ['delay-0', 'delay-75', 'delay-100', 'delay-150', 'delay-200'];
const COLLAB_STATUS = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: XCircle },
};

// ── Send Collaboration Request Modal ─────────────────────────────
export function SendRequestModal({ tutor, onClose, onSend }) {
  const [subjects, setSubjects] = useState(tutor.subjects?.slice(0, 1) || []);
  const [grade, setGrade] = useState('');
  const [frequency, setFrequency] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = s => setSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleSend = async () => {
    if (!subjects.length) { setError('Select at least one subject.'); return; }
    if (!grade) { setError('Target grade is required.'); return; }
    setLoading(true); setError('');
    try { await onSend(tutor, { subjects, targetGrade: grade, frequency, message }); }
    catch (err) { setError(err.response?.data?.message || 'Failed to send request.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-[480px] sm:rounded-3xl rounded-t-3xl border-2 border-gray-200 shadow-[8px_8px_0px_0px_#D1D5DB] flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-gray-900">Send Collaboration Request</h2>
            <p className="text-[11px] text-gray-400 font-bold mt-0.5">to {tutor.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 [&::-webkit-scrollbar]:hidden">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Target Grade <span className="text-red-400">*</span></label>
            <select value={grade} onChange={e => setGrade(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-500 appearance-none shadow-[2px_2px_0px_0px_#E5E7EB] transition-all">
              <option value="">Select grade</option>
              {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Frequency <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
            <input type="text" value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="e.g. 3 sessions/week, Weekday evenings"
              className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-[2px_2px_0px_0px_#E5E7EB] transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Message <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
            <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Briefly describe your organisation's needs..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 shadow-[2px_2px_0px_0px_#E5E7EB] transition-all" />
          </div>
          <p className="text-[11px] text-blue-600 font-bold bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
            <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Contact details are only shared after the tutor accepts your request.
          </p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t-2 border-gray-100 bg-gray-50/50 flex-shrink-0">
          <button onClick={onClose} className="px-5 h-11 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-[2px_2px_0px_0px_#E5E7EB] transition-all">Cancel</button>
          <button onClick={handleSend} disabled={loading}
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-black uppercase tracking-wide rounded-xl shadow-[4px_4px_0px_0px_#93C5FD] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Send Request</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Assignment Modal ───────────────────────────────────────
export function CreateAssignmentModal({ request, onClose, onCreate }) {
  const [grade, setGrade] = useState(request.targetGrade || '');
  const [studentCount, setStudentCount] = useState(10);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = s => setSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleCreate = async () => {
    if (!grade) { setError('Grade is required.'); return; }
    try {
      await onCreate(request._id, {
        grade,
        studentCount: Number(studentCount),
        notes
      });
    }
    catch (err) { setError(err.response?.data?.message || 'Failed to create assignment.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-2 border-gray-200 rounded-3xl w-full max-w-md shadow-[8px_8px_0px_0px_#D1D5DB] animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-base font-black text-gray-900">Create Assignment</h2>
            <p className="text-[11px] text-gray-400 font-bold mt-0.5">with {request.tutorProfile?.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Grade <span className="text-red-400">*</span></label>
            <select value={grade} onChange={e => setGrade(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:border-green-500 appearance-none shadow-[2px_2px_0px_0px_#E5E7EB] transition-all">
              <option value="">Select grade</option>
              {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Private Notes <span className="text-gray-300 normal-case font-normal">(not shown to tutor)</span></label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes for your records..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-green-500 shadow-[2px_2px_0px_0px_#E5E7EB] transition-all" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t-2 border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="px-5 h-11 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-[2px_2px_0px_0px_#E5E7EB] transition-all">Cancel</button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 h-11 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-black rounded-xl shadow-[4px_4px_0px_0px_#15803d] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckSquare className="w-4 h-4" /> Create Assignment</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Collab Requests Tab ───────────────────────────────────────────
export function CollabRequestsTab({ requests, loading, filter, onFilterChange, onRefresh, onCancel, onCreateAssignment }) {
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-5 animate-fade-up delay-100">
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'pending', 'accepted', 'declined', 'cancelled'].map(f => (
          <button key={f} onClick={() => onFilterChange(f)}
            className={`text-[11px] font-black px-3 py-1.5 rounded-xl border-2 capitalize transition-all ${filter === f ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-[2px_2px_0px_0px_#BFDBFE]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>{f}</button>
        ))}
        <button onClick={onRefresh} className="ml-auto flex items-center gap-1 text-[11px] font-black text-gray-400 hover:text-gray-700 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Send className="w-8 h-8 text-gray-200 mb-3" />
          <p className="text-sm font-bold text-gray-500">No {filter !== 'all' ? filter : ''} requests yet.</p>
          <p className="text-xs text-gray-400 mt-1">Go to My Tutors and click "Send Request" to start a collaboration.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, i) => {
            const cfg = COLLAB_STATUS[req.status] || COLLAB_STATUS.pending;
            const Icon = cfg.icon;
            const daysLeft = req.expiresAt ? Math.ceil((new Date(req.expiresAt) - Date.now()) / 86400000) : null;
            return (
              <div key={req._id}
                className={`bg-white border-2 rounded-2xl p-5 shadow-[3px_3px_0px_0px_#E5E7EB] animate-fade-up ${STAGGER[i % STAGGER.length]}`}
                style={{ borderColor: req.status === 'pending' ? '#FDE68A' : req.status === 'accepted' ? '#BBF7D0' : '#E5E7EB' }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-black text-sm">{req.tutorProfile?.name?.[0] || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{req.tutorProfile?.name || 'Unknown Tutor'}</p>
                      <p className="text-[11px] font-bold text-gray-400">{req.tutorProfile?.area} · {req.targetGrade}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border-2 uppercase tracking-wide ${cfg.color}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                    {req.status === 'pending' && daysLeft > 0 && <span className="text-[10px] font-bold text-gray-400">Expires in {daysLeft}d</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {req.subjects?.map(s => <span key={s} className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">{s}</span>)}
                </div>
                {req.message && <p className="text-xs text-gray-500 italic mb-3">"{req.message}"</p>}
                {req.tutorNote && (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
                    <span className="font-black">Tutor's note:</span> {req.tutorNote}
                  </p>
                )}
                {req.status === 'accepted' && req.tutorContact && (req.tutorContact.phone || req.tutorContact.email) && (
                  <div className="flex flex-wrap items-center gap-4 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-3">
                    <p className="text-[11px] font-black text-green-800">Contact:</p>
                    {req.tutorContact.phone && <a href={`tel:${req.tutorContact.phone}`} className="flex items-center gap-1 text-[11px] font-black text-green-700 hover:text-green-900"><PhoneCall className="w-3 h-3" />{req.tutorContact.phone}</a>}
                    {req.tutorContact.email && <a href={`mailto:${req.tutorContact.email}`} className="flex items-center gap-1 text-[11px] font-black text-green-700 hover:text-green-900"><Mail className="w-3 h-3" />{req.tutorContact.email}</a>}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {req.status === 'pending' && (
                    <button onClick={() => onCancel(req._id)}
                      className="flex items-center gap-1.5 text-[11px] font-black text-red-600 border-2 border-red-200 bg-red-50 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-all">
                      <Ban className="w-3.5 h-3.5" /> Cancel Request
                    </button>
                  )}
                  {req.status === 'accepted' && !req.hasActiveAssignment && (
                    <button onClick={() => onCreateAssignment(req)}
                      className="flex items-center gap-1.5 text-[11px] font-black text-white bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#15803d] active:translate-y-[1px] active:shadow-none transition-all">
                      <CheckSquare className="w-3.5 h-3.5" /> Create Assignment →
                    </button>
                  )}
                  {req.status === 'accepted' && req.hasActiveAssignment && (
                    <span className="text-[11px] font-black text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Assignment Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Assignments Tab ───────────────────────────────────────────────
export function AssignmentsTab({ assignments, loading, onRefresh, onEnd }) {
  const [ending, setEnding] = useState(null);

  const handleEnd = async (id) => {
    if (!confirm('End this assignment? This will clear the assigned tutor from beneficiaries.')) return;
    setEnding(id);
    try { await onEnd(id); } finally { setEnding(null); }
  };

  return (
    <div className="space-y-5 animate-fade-up delay-100">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 font-bold">{assignments.filter(a => a.status === 'active').length} active assignment(s)</p>
        <button onClick={onRefresh} className="flex items-center gap-1 text-[11px] font-black text-gray-400 hover:text-gray-700 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Handshake className="w-8 h-8 text-gray-200 mb-3" />
          <p className="text-sm font-bold text-gray-500">No assignments yet.</p>
          <p className="text-xs text-gray-400 mt-1">Accept a request and click "Create Assignment" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a, i) => (
            <div key={a._id} className={`bg-white border-2 rounded-2xl p-5 animate-fade-up ${STAGGER[i % STAGGER.length]} ${a.status === 'active' ? 'border-green-200 shadow-[3px_3px_0px_0px_#BBF7D0]' : 'border-gray-200 shadow-[3px_3px_0px_0px_#E5E7EB] opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 border-2 border-green-200 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{a.tutorProfile?.name || 'Unknown Tutor'}</p>
                    <p className="text-[11px] font-bold text-gray-400">{a.grade} · {a.studentCount} student{a.studentCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border-2 uppercase tracking-wide ${a.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{a.status}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {a.subjects?.map(s => <span key={s} className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">{s}</span>)}
              </div>
              {a.notes && <p className="text-xs text-gray-400 italic mt-2">Note: {a.notes}</p>}
              {a.status === 'active' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => handleEnd(a._id)} disabled={ending === a._id}
                    className="text-[11px] font-black text-red-500 border-2 border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50">
                    {ending === a._id ? <div className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    End Assignment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
