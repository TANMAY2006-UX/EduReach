import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../../components/layout/PublicNavbar';
import {
  Search, MapPin, BookOpen, Star, Filter,
  Lock, ArrowRight, CheckCircle
} from 'lucide-react';

// ── Mock tutor data (replace with API call in Step 3) ─────────────────────
const MOCK_TUTORS = [
  { id: '1', name: 'Priya Sharma', avatar: null, subjects: ['Mathematics','Physics'], area: 'Andheri West', city: 'Mumbai', grade: 'Class 8–12', experience: '5–10 years', rating: 4.9, reviews: 47, verified: true, trialFree: true, bio: 'IIT-B graduate with 7 years of experience helping students crack JEE.' },
  { id: '2', name: 'Rahul Desai', avatar: null, subjects: ['Chemistry','Biology'], area: 'Bandra West', city: 'Mumbai', grade: 'Class 11–12', experience: '3–5 years', rating: 4.7, reviews: 28, verified: true, trialFree: true, bio: 'MBBS (Grant Medical College). Specialise in NEET preparation and conceptual clarity.' },
  { id: '3', name: 'Sneha Patel', avatar: null, subjects: ['English','Hindi'], area: 'Borivali', city: 'Mumbai', grade: 'Class 5–10', experience: '1–2 years', rating: 4.8, reviews: 19, verified: true, trialFree: true, bio: 'MA English (Mumbai University). Passionate about building strong language foundations.' },
  { id: '4', name: 'Arjun Mehta', avatar: null, subjects: ['Computer Science','Mathematics'], area: 'Powai', city: 'Mumbai', grade: 'Undergraduate', experience: '3–5 years', rating: 4.6, reviews: 33, verified: true, trialFree: true, bio: 'Software engineer by day, tutor by passion. Focus on logical thinking and coding.' },
  { id: '5', name: 'Kavitha Rao', avatar: null, subjects: ['Social Studies','History & Geography'], area: 'Dadar', city: 'Mumbai', grade: 'Class 5–10', experience: '5–10 years', rating: 4.9, reviews: 52, verified: true, trialFree: true, bio: 'M.Ed from Tata Institute. 8 years teaching Social Sciences with storytelling methods.' },
  { id: '6', name: 'Nikhil Joshi', avatar: null, subjects: ['Mathematics','Accountancy'], area: 'Mulund', city: 'Mumbai', grade: 'Class 11–12', experience: '3–5 years', rating: 4.5, reviews: 21, verified: false, trialFree: true, bio: 'CA Final student with strong grip on Commerce and Math for boards.' },
];

const SUBJECTS_FILTER = ['All', 'Mathematics', 'Science', 'English', 'Hindi', 'Computer Science', 'Commerce'];
const AREAS_FILTER    = ['All areas', 'Andheri', 'Bandra', 'Borivali', 'Dadar', 'Powai', 'Mulund'];

export default function BrowseTutorsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [search,  setSearch]  = useState('');
  const [subject, setSubject] = useState('All');
  const [area,    setArea]    = useState('All areas');

  const filtered = MOCK_TUTORS.filter(t => {
    const matchSearch  = !search  || t.name.toLowerCase().includes(search.toLowerCase()) || t.subjects.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchSubject = subject === 'All' || t.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()));
    const matchArea    = area === 'All areas' || t.area.toLowerCase().includes(area.toLowerCase());
    return matchSearch && matchSubject && matchArea;
  });

  const handleBookTrial = (tutorId) => {
    if (!isAuthenticated) {
      navigate('/register', { state: { from: { pathname: `/tutor/${tutorId}` } } });
    } else {
      navigate(`/tutor/${tutorId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />

      {/* Hero / Search bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
            Find a verified tutor{' '}
            <span className="text-blue-600">near you</span>
          </h1>
          <p className="text-gray-500 text-base mb-7">
            Every tutor on EduReach is background-verified. First trial lesson is always free.
          </p>

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or subject..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="h-11 px-4 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all"
            >
              {SUBJECTS_FILTER.map(s => <option key={s}>{s}</option>)}
            </select>
            <select
              value={area}
              onChange={e => setArea(e.target.value)}
              className="h-11 px-4 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all"
            >
              {AREAS_FILTER.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Guest CTA banner */}
      {!isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">Browse freely. Sign up to book.</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Create a free account to request trial lessons and connect with verified tutors.
              </p>
            </div>
            <Link
              to="/register"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all flex-shrink-0"
            >
              Get started free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-500 mb-5 font-medium">
          {filtered.length} tutor{filtered.length !== 1 ? 's' : ''} found
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-base">No tutors match your search. Try different filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(tutor => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                isAuthenticated={isAuthenticated}
                onBook={() => handleBookTrial(tutor.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TutorCard({ tutor, isAuthenticated, onBook }) {
  const initials = tutor.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 group">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-700 font-bold text-base">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">{tutor.name}</h3>
            {tutor.verified && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-100">
                <CheckCircle className="w-2.5 h-2.5" /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{tutor.area}, {tutor.city}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-sm font-semibold text-gray-900">{tutor.rating}</span>
          <span className="text-xs text-gray-400">({tutor.reviews})</span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{tutor.bio}</p>

      {/* Subjects */}
      <div className="flex flex-wrap gap-1.5">
        {tutor.subjects.map(s => (
          <span key={s} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            {s}
          </span>
        ))}
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 border border-gray-100">
          {tutor.experience}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        {tutor.trialFree && (
          <span className="text-[11px] text-green-600 font-semibold flex-1">
            ✓ Free trial lesson
          </span>
        )}
        <button
          onClick={onBook}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all"
        >
          {isAuthenticated ? (
            <>Book trial <ArrowRight className="w-3 h-3" /></>
          ) : (
            <><Lock className="w-3 h-3" /> Sign up to book</>
          )}
        </button>
      </div>
    </div>
  );
}