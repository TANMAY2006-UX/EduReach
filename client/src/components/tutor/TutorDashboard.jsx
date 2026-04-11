import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../layout/PublicNavbar';
import { sessionService, tutorService } from '../../services/tutorService';
import {
  Star, Calendar, Users, CheckCircle,
  Clock, XCircle, ChevronRight, BookOpen,
  TrendingUp, Award, MapPin, Edit2,
  AlertCircle, IndianRupee, MessageSquare,
  Shield, X, Briefcase
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

function RequestCard({ session, onAccept, onReject, delay }) {
  const [loading, setLoading] = useState(false);
  const student = session.student;
  const date    = new Date(session.scheduledAt);

  const handle = async (action) => {
    setLoading(true);
    try { await (action === 'accept' ? onAccept : onReject)(session._id); }
    finally { setLoading(false); }
  };

  return (
    <div className={`bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-[3px_3px_0px_0px_#fde68a] animate-fade-up ${delay}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
          <span className="text-amber-700 font-black text-sm">
            {student?.name?.[0]?.toUpperCase() || 'S'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900">{student?.name || 'Student'}</p>
          <p className="text-xs font-bold text-gray-500">{session.subject}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
              {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
              {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="capitalize font-bold">{session.mode}</span>
          </div>
          {session.notes && (
            <p className="text-xs text-gray-500 italic mt-1.5 bg-amber-50/50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
              "{session.notes}"
            </p>
          )}
        </div>
        <span className="text-[10px] font-black bg-green-50 text-green-700 border-2 border-green-200 px-2 py-1 rounded-full shadow-[2px_2px_0px_0px_#bbf7d0]">FREE TRIAL</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handle('reject')} disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black uppercase tracking-wide rounded-xl transition-all disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" /> Decline
        </button>
        <button
          onClick={() => handle('accept')} disabled={loading}
          className="flex-[2] flex items-center justify-center gap-1.5 h-10 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-wide rounded-xl shadow-[3px_3px_0px_0px_#86EFAC] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all disabled:opacity-50"
        >
          {loading ? '...' : <><CheckCircle className="w-3.5 h-3.5" /> Accept Session</>}
        </button>
      </div>
    </div>
  );
}

function SessionRow({ session, onComplete, delay }) {
  const student = session.student;
  const date    = new Date(session.scheduledAt);
  const isPast  = date < new Date();

  return (
    <div className={`flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#E5E7EB] transition-all bg-white animate-fade-up ${delay}`}>
      <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center flex-shrink-0">
        <span className="text-blue-700 font-black text-sm">{student?.name?.[0]?.toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-900 truncate">{student?.name}</p>
        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{session.subject} · {session.mode}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-gray-800">
          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
        <p className="text-xs text-gray-400 font-bold">
          {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="flex-shrink-0">
        {session.status === 'accepted' && isPast ? (
          <button
            onClick={() => onComplete(session._id)}
            className="text-[10px] font-black text-blue-700 hover:text-white border-2 border-blue-200 hover:border-blue-600 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 shadow-[2px_2px_0px_0px_#BFDBFE] transition-all uppercase tracking-wide"
          >
            Mark Done ✓
          </button>
        ) : (
          <StatusBadge status={session.status} />
        )}
      </div>
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
        <p className="text-xs text-amber-700 font-bold mt-0.5">Our team reviews credentials within 48 hours. Students can still book trial lessons with you.</p>
      </div>
    </div>
  );
}

// STAGGER DELAYS ARRAY
const STAGGER = ['delay-0', 'delay-75', 'delay-100', 'delay-150', 'delay-200'];

export default function TutorDashboard() {
  const { user } = useAuth();

  const [sessions,        setSessions]        = useState([]);
  const [profile,         setProfile]         = useState(null);
  const [loadingSessions, setLoadingSessions]  = useState(true);
  const [loadingProfile,  setLoadingProfile]   = useState(true);
  const [activeTab,       setActiveTab]        = useState('requests');

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
    await sessionService.completeSession(id);
    setSessions(prev => prev.map(s => s._id === id ? { ...s, status: 'completed' } : s));
  };

  const pendingRequests  = sessions.filter(s => s.status === 'pending');
  const upcomingSessions = sessions.filter(s => s.status === 'accepted' && new Date(s.scheduledAt) >= new Date());
  const pastSessions     = sessions.filter(s => ['completed','cancelled','rejected'].includes(s.status));
  const earnings         = sessions.filter(s => s.status === 'completed').reduce((acc, s) => acc + (s.amount || 0), 0);

  const TABS = [
    { key: 'requests',  label: 'Requests',  count: pendingRequests.length },
    { key: 'upcoming',  label: 'Schedule',  count: upcomingSessions.length },
    { key: 'past',      label: 'History',   count: pastSessions.length },
  ];

  const tabSessions = activeTab === 'requests'
    ? pendingRequests
    : activeTab === 'upcoming'
      ? upcomingSessions
      : pastSessions;

  const firstName = user?.name?.split(' ')[0] || 'Tutor';

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── HEADER ────────────────────────────────────────────── */}
        <div className="mb-6 animate-fade-up delay-0">
          <h1 className="text-[32px] font-black text-gray-900 tracking-tight mb-1">
            Dashboard
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            Hi {firstName}! {pendingRequests.length > 0
              ? `You have ${pendingRequests.length} new trial request${pendingRequests.length > 1 ? 's' : ''} waiting.`
              : 'All caught up — no pending requests.'}
          </p>
        </div>

        {/* Banners */}
        {!loadingProfile && (
          <div className="space-y-3 mb-6 animate-fade-up delay-50">
            <VerificationBanner isVerified={profile?.isVerified || user?.isVerified} />
            
            {/* NEW: Missing Price Banner */}
            {profile?.hourlyRate === 0 && (
              <div className="flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-2xl px-5 py-4 shadow-[4px_4px_0px_0px_#BFDBFE]">
                <div className="flex items-center gap-3">
                  <IndianRupee className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-black text-blue-900 uppercase tracking-wide">Set your hourly rate</p>
                    <p className="text-xs text-blue-700 font-bold mt-0.5">You are currently listed as free. Set your post-trial hourly rate.</p>
                  </div>
                </div>
                <button onClick={() => alert("Edit Profile modal coming soon!")} className="text-xs font-black bg-blue-600 text-white px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_#60A5FA] active:translate-y-[1px] active:shadow-none">
                  Set Rate
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STATS ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Students" value={profile?.totalStudents || 0} color="bg-blue-50 border-blue-200 text-blue-600" delay="delay-50" />
          <StatCard icon={BookOpen} label="Sessions Done" value={profile?.totalSessions || 0} color="bg-green-50 border-green-200 text-green-600" delay="delay-75" />
          <StatCard icon={Star} label="Rating" value={profile?.rating > 0 ? profile.rating.toFixed(1) : '—'} sub={profile?.totalReviews ? `${profile.totalReviews} reviews` : 'No reviews yet'} color="bg-amber-50 border-amber-200 text-amber-600" delay="delay-100" />
          <StatCard icon={IndianRupee} label="Earnings" value={earnings > 0 ? `₹${earnings.toLocaleString('en-IN')}` : '₹0'} sub="Trial sessions free" color="bg-purple-50 border-purple-200 text-purple-600" delay="delay-150" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: SESSIONS ────────────────────────────────────── */}
          <div className="lg:col-span-2 animate-fade-up delay-100">
            <div className="bg-white border-2 border-gray-200 rounded-3xl shadow-[6px_6px_0px_0px_#D1D5DB] overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b-2 border-gray-200">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                      activeTab === tab.key
                        ? 'text-blue-700 border-b-4 border-blue-600 bg-blue-50/30'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border-2 ${activeTab === tab.key ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-4 bg-[#fcfdfg]">
                {loadingSessions && [...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-2xl shimmer" />
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
                      {activeTab === 'requests' ? 'New trial requests will appear here.' : 'Confirmed sessions will show here.'}
                    </p>
                  </div>
                )}

                {/* Staggered Lists */}
                {!loadingSessions && activeTab === 'requests' && pendingRequests.map((s, i) => (
                  <RequestCard key={s._id} session={s} onAccept={handleAccept} onReject={handleReject} delay={STAGGER[i % STAGGER.length]} />
                ))}

                {!loadingSessions && activeTab !== 'requests' && tabSessions.map((s, i) => (
                  <SessionRow key={s._id} session={s} onComplete={handleComplete} delay={STAGGER[i % STAGGER.length]} />
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: PROFILE CARD ────────────────────────────────── */}
          <div className="animate-fade-up delay-200 space-y-6">

            {/* Profile summary */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl shadow-[6px_6px_0px_0px_#D1D5DB] overflow-hidden">
              <div className="px-6 py-5 border-b-2 border-gray-200 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Your Profile</h2>
                {/* FIXED: Replaced standard link with a button for future modal */}
                <button onClick={() => alert("Edit Profile modal coming soon!")} className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-[2px_2px_0px_0px_#BFDBFE] active:translate-y-[1px] active:shadow-none transition-all">
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
                          <span key={s} className="text-[11px] font-black px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border-2 border-blue-200">
                            {s}
                          </span>
                        ))}
                        {profile.subjects?.length > 4 && (
                          <span className="text-[11px] font-black px-3 py-1.5 rounded-full bg-gray-50 text-gray-500 border-2 border-gray-200">
                            +{profile.subjects.length - 4}
                          </span>
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

                    {/* NEW: Qualification & Experience from Onboarding */}
                    <div className="pt-4 border-t-2 border-dashed border-gray-100">
                      {profile.qualification && (
                        <div className="mb-4">
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
                        <p className="text-xs text-gray-600 leading-relaxed font-semibold italic">"{profile.bio}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 font-bold">Profile not found.</p>
                )}
              </div>
            </div>

            {/* Recent reviews */}
            {profile?.reviews?.length > 0 && (
              <div className="bg-white border-2 border-gray-200 rounded-3xl shadow-[4px_4px_0px_0px_#D1D5DB] overflow-hidden">
                <div className="px-6 py-4 border-b-2 border-gray-100">
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" /> Student Reviews
                  </h2>
                </div>
                <div className="p-5 space-y-3">
                  {profile.reviews.slice(0, 3).map((r, i) => (
                    <div key={i} className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl animate-fade-up" style={{animationDelay: `${i*100}ms`}}>
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
    </div>
  );
}