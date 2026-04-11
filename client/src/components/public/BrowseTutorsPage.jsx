import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../layout/PublicNavbar';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Star, ArrowRight,
  CheckCircle, Lock, ChevronDown, Sparkles, Shield
} from 'lucide-react';

const MOCK_TUTORS = [
  { id: '1', name: 'Priya Sharma',  subjects: ['Mathematics','Physics'],              area: 'Andheri West', city: 'Mumbai', experience: '5–10 years', rating: 4.9, reviews: 47, verified: true,  trialFree: true, bio: 'IIT-B graduate with 7 years of experience helping students crack JEE and board exams.',           accent: 'blue' },
  { id: '2', name: 'Rahul Desai',   subjects: ['Chemistry','Biology'],                area: 'Bandra West',  city: 'Mumbai', experience: '3–5 years',  rating: 4.7, reviews: 28, verified: true,  trialFree: true, bio: 'MBBS (Grant Medical College). Specialise in NEET preparation and conceptual clarity.',           accent: 'emerald' },
  { id: '3', name: 'Sneha Patel',   subjects: ['English','Hindi'],                    area: 'Borivali',     city: 'Mumbai', experience: '1–2 years',  rating: 4.8, reviews: 19, verified: true,  trialFree: true, bio: 'MA English (Mumbai University). Passionate about building strong language foundations.',          accent: 'violet' },
  { id: '4', name: 'Arjun Mehta',   subjects: ['Computer Science','Mathematics'],     area: 'Powai',        city: 'Mumbai', experience: '3–5 years',  rating: 4.6, reviews: 33, verified: true,  trialFree: true, bio: 'Software engineer by day, tutor by passion. Focus on logical thinking and coding skills.',       accent: 'orange' },
  { id: '5', name: 'Kavitha Rao',   subjects: ['Social Studies','History & Geography'], area: 'Dadar',      city: 'Mumbai', experience: '5–10 years', rating: 4.9, reviews: 52, verified: true,  trialFree: true, bio: 'M.Ed from Tata Institute. 8 years teaching Social Sciences with storytelling methods.',          accent: 'pink' },
  { id: '6', name: 'Nikhil Joshi',  subjects: ['Mathematics','Accountancy'],          area: 'Mulund',       city: 'Mumbai', experience: '3–5 years',  rating: 4.5, reviews: 21, verified: false, trialFree: true, bio: 'CA Final student with strong grip on Commerce and Mathematics for board examinations.',          accent: 'amber' },
];

const SUBJECTS_FILTER = ['All', 'Mathematics', 'Science', 'English', 'Hindi', 'Computer Science', 'Commerce'];
const AREAS_FILTER    = ['All areas', 'Andheri', 'Bandra', 'Borivali', 'Dadar', 'Powai', 'Mulund'];

// Accent color config per tutor
const ACCENT = {
  blue:    { avatar: 'from-blue-500 to-blue-700',     ring: 'ring-blue-200',   badge: 'bg-blue-50 text-blue-700 border-blue-100',   dot: 'bg-blue-500' },
  emerald: { avatar: 'from-emerald-500 to-teal-600',  ring: 'ring-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  violet:  { avatar: 'from-violet-500 to-purple-700', ring: 'ring-violet-200', badge: 'bg-violet-50 text-violet-700 border-violet-100', dot: 'bg-violet-500' },
  orange:  { avatar: 'from-orange-400 to-red-500',    ring: 'ring-orange-200', badge: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500' },
  pink:    { avatar: 'from-pink-500 to-rose-600',     ring: 'ring-pink-200',   badge: 'bg-pink-50 text-pink-700 border-pink-100',   dot: 'bg-pink-500' },
  amber:   { avatar: 'from-amber-400 to-orange-500',  ring: 'ring-amber-200',  badge: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
};

export default function BrowseTutorsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [search,  setSearch]  = useState('');
  const [subject, setSubject] = useState('All');
  const [area,    setArea]    = useState('All areas');

  const filtered = MOCK_TUTORS.filter(t => {
    const ms = !search  || t.name.toLowerCase().includes(search.toLowerCase()) || t.subjects.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const mj = subject === 'All' || t.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()));
    const ma = area === 'All areas' || t.area.toLowerCase().includes(area.toLowerCase());
    return ms && mj && ma;
  });

  const handleBook = (id) => {
    if (!isAuthenticated) {
      navigate('/register', { state: { from: { pathname: `/tutor/${id}` } } });
    } else {
      navigate(`/tutor/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PublicNavbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">

          {/* Headline */}
          <div className="max-w-2xl animate-fade-up delay-0">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3.5 py-1.5 mb-5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[12px] font-semibold text-blue-700 tracking-wide">Every tutor is background-verified</span>
            </div>
            <h1 className="text-[38px] sm:text-[48px] font-extrabold text-gray-900 tracking-[-1.5px] leading-[1.1] mb-3">
              Find a verified tutor{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                near you
              </span>
            </h1>
            <p className="text-[15px] text-gray-400 font-medium">
              First trial lesson is always free. No commitment required.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-8 animate-fade-up delay-100">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search by name or subject..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-2xl border-2 border-gray-100 bg-white text-[14px] text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 transition-all shadow-sm"
              />
            </div>
            <div className="relative">
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-12 pl-4 pr-10 rounded-2xl border-2 border-gray-100 bg-white text-[14px] text-gray-600 font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 cursor-pointer transition-all shadow-sm min-w-[140px]"
              >
                {SUBJECTS_FILTER.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none z-10" />
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className="h-12 pl-10 pr-10 rounded-2xl border-2 border-gray-100 bg-white text-[14px] text-gray-600 font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 cursor-pointer transition-all shadow-sm min-w-[150px]"
              >
                {AREAS_FILTER.map(a => <option key={a}>{a}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── GUEST BANNER ─────────────────────────────────────── */}
      {!isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 animate-fade-up delay-100">
          <div className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-blue-50 border-2 border-blue-200 rounded-2xl px-6 py-5 shadow-[4px_4px_0px_0px_#bfdbfe]">
            <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-blue-900 font-bold text-[15px]">Browse freely. Sign up to book a trial.</p>
              <p className="text-blue-700 text-[13px] mt-0.5 font-medium">Create your free account in 60 seconds to connect with verified tutors.</p>
            </div>
            <Link to="/register"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold uppercase tracking-wide rounded-xl border-2 border-transparent shadow-[3px_3px_0px_0px_#93C5FD] active:shadow-[0px_0px_0px_0px_#93C5FD] active:translate-y-[3px] active:translate-x-[3px] transition-all flex-shrink-0"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── GRID ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-[13px] text-gray-400 font-semibold mb-6 uppercase tracking-wider">
          {filtered.length} tutor{filtered.length !== 1 ? 's' : ''} found
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-up delay-0">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-900 font-semibold text-[16px] mb-1">No tutors match your search</p>
            <p className="text-gray-400 text-[14px]">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((tutor, i) => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                index={i}
                isAuthenticated={isAuthenticated}
                onBook={() => handleBook(tutor.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stagger delays based on index
const STAGGER = ['delay-0','delay-50','delay-100','delay-150','delay-200','delay-250'];

function TutorCard({ tutor, isAuthenticated, onBook }) {
  const initials = tutor.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div 
      // PURE TAILWIND ANIMATION & SOFT TACTILE STYLE
      className="animate-fade-up bg-white rounded-2xl border-2 border-gray-200 p-6 flex flex-col gap-5 hover:-translate-y-1.5 transition-all duration-300 shadow-[4px_4px_0px_0px_#D1D5DB] hover:shadow-[6px_6px_0px_0px_#93C5FD] group"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full border-2 border-gray-200 bg-blue-50 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_#D1D5DB]">
          <span className="text-blue-700 font-bold text-xl tracking-tight">{initials}</span>
        </div>
        
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{tutor.name}</h3>
            {tutor.verified && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-green-200 shadow-[1px_1px_0px_0px_#bbf7d0]">
                <CheckCircle className="w-3 h-3" /> VERIFIED
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{tutor.area}, {tutor.city}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-amber-50 border-2 border-amber-200 px-2 py-1 rounded-lg shadow-[2px_2px_0px_0px_#fde68a]">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-sm font-bold text-amber-700">{tutor.rating}</span>
        </div>
      </div>

      <p className="text-sm text-gray-600 font-medium leading-relaxed line-clamp-2">
        {tutor.bio}
      </p>

      <div className="flex flex-wrap gap-2">
        {tutor.subjects.map(s => (
          <span key={s} className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border-2 border-blue-200">
            {s}
          </span>
        ))}
        <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 border-2 border-gray-200">
          {tutor.experience}
        </span>
      </div>

      <div className="flex items-center gap-3 pt-2 mt-auto">
        {tutor.trialFree && (
          <span className="text-xs text-green-600 font-bold flex-1 uppercase tracking-wider">
            ✓ Free Trial
          </span>
        )}
        <button
          onClick={onBook}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold uppercase tracking-wide rounded-xl border-2 border-transparent shadow-[3px_3px_0px_0px_#93C5FD] active:shadow-[0px_0px_0px_0px_#93C5FD] active:translate-y-[3px] active:translate-x-[3px] transition-all"
        >
          {isAuthenticated ? (
            <>Book <ArrowRight className="w-4 h-4" /></>
          ) : (
            <><Lock className="w-4 h-4" /> Sign up</>
          )}
        </button>
      </div>
    </div>
  );
}