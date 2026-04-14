import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../layout/PublicNavbar';
import { tutorService } from '../../services/tutorService';
import {
  Search, MapPin, Star, ArrowRight, CheckCircle,
  Lock, ChevronDown, Shield, SlidersHorizontal, X, Eye
} from 'lucide-react';

const SUBJECTS_FILTER = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Computer Science', 'Accountancy', 'Economics', 'Social Studies'];
const AREAS_FILTER    = ['All areas', 'Andheri West', 'Bandra West', 'Borivali', 'Chembur', 'Dadar', 'Goregaon', 'Malad', 'Mulund', 'Powai', 'Santacruz'];
const SORT_OPTIONS    = [
  { value: 'rating',  label: 'Top rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'newest',  label: 'Newest' },
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-100 shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-100 shimmer rounded-lg w-3/4" />
          <div className="h-3 bg-gray-100 shimmer rounded-lg w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 shimmer rounded-lg" />
      <div className="h-3 bg-gray-100 shimmer rounded-lg w-5/6" />
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-gray-100 shimmer rounded-full" />
        <div className="h-6 w-16 bg-gray-100 shimmer rounded-full" />
      </div>
      <div className="h-9 bg-gray-100 shimmer rounded-xl mt-auto" />
    </div>
  );
}

export default function BrowseTutorsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [search,  setSearch]  = useState('');
  const [subject, setSubject] = useState('All');
  const [area,    setArea]    = useState('All areas');
  const [sort,    setSort]    = useState('rating');
  const [page,    setPage]    = useState(1);

  const [tutors,     setTutors]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const buildParams = useCallback(() => {
    const p = { sort, page, limit: 9 };
    if (debouncedSearch)         p.search  = debouncedSearch;
    if (subject !== 'All')       p.subject = subject;
    if (area !== 'All areas')    p.area    = area;
    return p;
  }, [debouncedSearch, subject, area, sort, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    tutorService.getTutors(buildParams())
      .then(data => {
        if (cancelled) return;
        setTutors(data.tutors || []);
        setPagination(data.pagination || null);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to load tutors.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [buildParams]);

  useEffect(() => setPage(1), [debouncedSearch, subject, area, sort]);

  const clearFilters = () => { setSearch(''); setSubject('All'); setArea('All areas'); setSort('rating'); setPage(1); };
  const hasFilters   = search || subject !== 'All' || area !== 'All areas';

  const handleAction = (tutorId) => {
    if (!isAuthenticated) {
      navigate('/register', { state: { from: { pathname: `/tutor/${tutorId}` } } });
    } else {
      navigate(`/tutor/${tutorId}`);
    }
  };

  // Determine role: tutors see "View Profile" instead of "Book Trial"
  const isTutor = isAuthenticated && user?.role === 'tutor';

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PublicNavbar />

      {/* Hero */}
      <div className="bg-white border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="animate-fade-up delay-0">
            <div className="inline-flex items-center gap-2 bg-blue-50 border-2 border-blue-100 rounded-full px-4 py-1.5 mb-5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[12px] font-black text-blue-700 tracking-wide uppercase">Every tutor is background-verified</span>
            </div>
            <h1 className="text-[36px] sm:text-[44px] font-black text-gray-900 tracking-tight leading-[1.1] mb-2">
              Find a verified tutor{' '}
              <span className="text-blue-600">near you</span>
            </h1>
            <p className="text-[15px] text-gray-500 font-medium">
              {isTutor
                ? 'Browse the EduReach tutor community and see how others are presenting themselves.'
                : 'First trial lesson is always free. No commitment required.'}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-7 animate-fade-up delay-100">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Search by name or subject..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-[3px_3px_0px_0px_#E5E7EB] focus:shadow-[3px_3px_0px_0px_#93C5FD] focus:-translate-y-0.5 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="h-12 pl-4 pr-10 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-700 font-semibold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer shadow-[3px_3px_0px_0px_#E5E7EB] transition-all">
                {SUBJECTS_FILTER.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <select value={area} onChange={e => setArea(e.target.value)}
                className="h-12 pl-10 pr-10 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-700 font-semibold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer shadow-[3px_3px_0px_0px_#E5E7EB] transition-all">
                {AREAS_FILTER.map(a => <option key={a}>{a}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="h-12 pl-10 pr-10 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-700 font-semibold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer shadow-[3px_3px_0px_0px_#E5E7EB] transition-all">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Guest CTA — only show to guests/students, not tutors */}
      {!isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 animate-fade-up delay-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-blue-600 border-2 border-blue-700 rounded-2xl px-6 py-4 shadow-[4px_4px_0px_0px_#1D4ED8]">
            <div className="flex-1">
              <p className="text-white font-black text-sm">Browse freely. Sign up to book a trial.</p>
              <p className="text-blue-200 text-xs mt-0.5 font-medium">Create your free account in 60 seconds.</p>
            </div>
            <Link to="/register"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wide rounded-xl transition-all flex-shrink-0 shadow-[2px_2px_0px_0px_#93C5FD] active:translate-y-[1px] active:shadow-none">
              Get started free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Tutor browsing note */}
      {isTutor && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
          <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-3 shadow-[3px_3px_0px_0px_#fde68a]">
            <Eye className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs font-bold text-amber-800">You're browsing as a tutor. Use this to understand how students discover tutors and improve your own profile.</p>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <p className="text-[13px] text-gray-400 font-black uppercase tracking-wider">
              {loading ? '...' : `${pagination?.total ?? tutors.length} tutor${(pagination?.total ?? tutors.length) !== 1 ? 's' : ''} found`}
            </p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full transition-colors">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="text-center py-16 animate-fade-up">
            <p className="text-gray-800 font-black mb-1">Something went wrong</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700">
              Try again
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && tutors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-up">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center mb-4 shadow-[3px_3px_0px_0px_#E5E7EB]">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-900 font-black text-lg mb-1">No tutors found</p>
            <p className="text-gray-400 text-sm mb-5">Try different filters or search terms</p>
            <button onClick={clearFilters} className="px-5 py-2 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700">
              Clear all filters
            </button>
          </div>
        )}

        {!loading && !error && tutors.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {tutors.map((tutor, i) => (
                <TutorCard
                  key={tutor._id}
                  tutor={tutor}
                  index={i}
                  isTutor={isTutor}
                  isAuthenticated={isAuthenticated}
                  onAction={() => handleAction(tutor._id)}
                />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:border-gray-300 disabled:opacity-40 shadow-[2px_2px_0px_0px_#E5E7EB] active:translate-y-[1px] active:shadow-none transition-all">
                  ← Prev
                </button>
                <span className="text-sm font-black text-gray-500 px-3">Page {page} of {pagination.pages}</span>
                <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:border-gray-300 disabled:opacity-40 shadow-[2px_2px_0px_0px_#E5E7EB] active:translate-y-[1px] active:shadow-none transition-all">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const STAGGER = ['delay-0','delay-50','delay-100','delay-150','delay-200','delay-250'];

function TutorCard({ tutor, index, isTutor, isAuthenticated, onAction }) {
  const initials = tutor.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const delay    = STAGGER[index % STAGGER.length];

  return (
    <div className={`animate-fade-up ${delay} bg-white rounded-2xl border-2 border-gray-200 p-6 flex flex-col gap-4 hover:-translate-y-1.5 transition-all duration-300 shadow-[4px_4px_0px_0px_#D1D5DB] hover:shadow-[6px_6px_0px_0px_#93C5FD]`}>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full border-2 border-gray-200 bg-blue-50 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_#D1D5DB]">
          {tutor.avatar
            ? <img src={tutor.avatar} alt={tutor.name} className="w-full h-full rounded-full object-cover" />
            : <span className="text-blue-700 font-black text-xl">{initials}</span>}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="text-base font-black text-gray-900 tracking-tight">{tutor.name}</h3>
            {tutor.isVerified && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-green-200 shadow-[1px_1px_0px_0px_#bbf7d0]">
                <CheckCircle className="w-3 h-3" /> VERIFIED
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-black text-gray-500 uppercase tracking-wide">{tutor.area}, {tutor.city}</span>
          </div>
        </div>

        {/* Rating — only show if has actual reviews */}
        {tutor.totalReviews > 0 ? (
          <div className="flex items-center gap-1 bg-amber-50 border-2 border-amber-200 px-2.5 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#fde68a] flex-shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-sm font-black text-amber-800">{tutor.rating.toFixed(1)}</span>
            <span className="text-[10px] text-amber-600 font-bold">({tutor.totalReviews})</span>
          </div>
        ) : (
          <span className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full flex-shrink-0">New</span>
        )}
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 font-medium leading-relaxed line-clamp-2">{tutor.bio || 'No bio yet.'}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {tutor.subjects?.slice(0, 3).map(s => (
          <span key={s} className="text-[11px] font-black px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border-2 border-blue-200">{s}</span>
        ))}
        {tutor.subjects?.length > 3 && (
          <span className="text-[11px] font-black px-3 py-1.5 rounded-full bg-gray-50 text-gray-500 border-2 border-gray-200">+{tutor.subjects.length - 3}</span>
        )}
        {tutor.experience && (
          <span className="text-[11px] font-black px-3 py-1.5 rounded-full bg-gray-50 text-gray-500 border-2 border-gray-200">{tutor.experience}</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2 mt-auto border-t-2 border-gray-100">
        <div className="flex-1">
          {tutor.trialFree && !isTutor && (
            <span className="text-xs text-green-600 font-black uppercase tracking-wider">✓ Free Trial</span>
          )}
          {tutor.hourlyRate > 0 && (
            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">₹{tutor.hourlyRate}/hr after trial</p>
          )}
        </div>

        {/* ── ROLE-AWARE CTA ── */}
        {isTutor ? (
          <button onClick={onAction}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wide rounded-xl border-2 border-gray-200 transition-all">
            <Eye className="w-3.5 h-3.5" /> View Profile
          </button>
        ) : isAuthenticated ? (
          <button onClick={onAction}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wide rounded-xl border-2 border-transparent shadow-[3px_3px_0px_0px_#93C5FD] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] transition-all">
            Book Trial <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button onClick={onAction}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wide rounded-xl border-2 border-transparent shadow-[3px_3px_0px_0px_#93C5FD] active:shadow-none active:translate-y-[2px] transition-all">
            <Lock className="w-3.5 h-3.5" /> Sign up
          </button>
        )}
      </div>
    </div>
  );
}