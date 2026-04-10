import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, BookOpen, Users,
  Phone, MapPin, BookMarked, ChevronRight,
  ChevronLeft, Check, AlertCircle, Briefcase, FileText
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────
const MUMBAI_AREAS = [
  'Andheri East','Andheri West','Bandra East','Bandra West','Borivali',
  'Chembur','Colaba','Dadar','Dharavi','Ghatkopar','Goregaon','Juhu',
  'Kandivali','Kurla','Malad','Mulund','Powai','Santacruz','Thane',
  'Vashi (Navi Mumbai)','Vikhroli','Worli','Other'
];

const CITIES = ['Mumbai','Navi Mumbai','Thane','Pune','Other'];

const SUBJECTS = [
  'Mathematics','Physics','Chemistry','Biology',
  'English','Hindi','Social Studies','History & Geography',
  'Computer Science','Accountancy','Economics',
  'Sanskrit','Marathi','JEE / NEET Prep','Other'
];

const GRADES = [
  'Class 1 – 4  (Primary)',
  'Class 5 – 7  (Middle)',
  'Class 8 – 10  (Secondary)',
  'Class 11 – 12  (Senior Secondary)',
  'Undergraduate / College',
  'Competitive Exams (JEE / NEET / UPSC)',
];

const BOARDS = ['CBSE','ICSE / ISC','SSC (Maharashtra)','IGCSE','IB','Other'];

const ROLES = [
  {
    id: 'student',
    icon: GraduationCap,
    title: 'Student / Parent',
    desc: 'Looking for a verified tutor',
    color: 'blue',
  },
  {
    id: 'tutor',
    icon: BookOpen,
    title: 'Tutor',
    desc: 'I want to teach students',
    color: 'indigo',
  },
  {
    id: 'ngo',
    icon: Users,
    title: 'NGO / Organisation',
    desc: 'Connect underserved students to tutors',
    color: 'green',
  },
];

// ─── Step indicator ─────────────────────────────────────────
function StepBar({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`
              flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-200
              ${done   ? 'bg-blue-600 text-white'
              : active ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                       : 'bg-gray-100 text-gray-400'}
            `}>
              {done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className={`h-px w-10 sm:w-16 transition-all duration-300 ${done ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Reusable field components ───────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
      <input
        {...props}
        className={`w-full h-11 ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all`}
      />
    </div>
  );
}

function Select({ icon: Icon, children, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />}
      <select
        {...props}
        className={`w-full h-11 ${Icon ? 'pl-10' : 'pl-3.5'} pr-8 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer`}
      >
        {children}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
    </div>
  );
}

// Multi-select pill buttons
function PillSelect({ options, selected, onChange, max }) {
  const toggle = val => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, val]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
              active
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────
export default function OnboardingPage() {
  const { completeOnboarding, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]     = useState(0);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    role: '',
    phone: '',
    // Student/common
    subjects: [],
    grade: '',
    board: '',
    // Tutor extra
    experience: '',
    qualification: '',
    bio: '',
    // Location
    city: '',
    area: '',
  });

  const set = (key, val) => {
    setData(d => ({ ...d, [key]: val }));
    if (error) setError('');
  };

  const isTutor   = data.role === 'tutor';
  const isStudent = data.role === 'student';
  const TOTAL_STEPS = isTutor ? 4 : 3;

  // ── Step validation ────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      if (!data.role) return 'Please select your role to continue.';
    }
    if (step === 1) {
      if (!data.phone.trim()) return 'Phone number is required.';
      if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(data.phone.replace(/\s/g, '')))
        return 'Enter a valid Indian mobile number (10 digits starting with 6-9).';
      if (data.subjects.length === 0) return 'Please select at least one subject.';
      if (isStudent && !data.grade) return 'Please select your grade / class level.';
      if (isStudent && !data.board) return 'Please select your school board.';
    }
    if (step === 2 && isTutor) {
      if (!data.experience) return 'Please select your teaching experience.';
      if (!data.qualification.trim()) return 'Highest qualification is required.';
      if (!data.bio.trim() || data.bio.trim().length < 30)
        return 'Please write a short bio (at least 30 characters).';
    }
    // Location step (last for both)
    const locationStep = isTutor ? 3 : 2;
    if (step === locationStep) {
      if (!data.city) return 'Please select your city.';
      if (!data.area) return 'Please select your area / locality.';
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setError('');
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await completeOnboarding({
        role:          data.role,
        phone:         data.phone.replace(/\s/g, ''),
        subjects:      data.subjects,
        grade:         data.grade,
        board:         data.board,
        experience:    data.experience,
        qualification: data.qualification,
        bio:           data.bio,
        location: {
          city: data.city,
          area: data.area,
        },
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const locationStep = isTutor ? 3 : 2;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-base leading-none">E</span>
          </div>
          <span className="text-gray-900 font-semibold text-base tracking-tight">EduReach</span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          Hi, {user?.name?.split(' ')[0]} 👋
        </span>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-[520px]">

          <StepBar current={step} total={TOTAL_STEPS} />

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ─── STEP 0: Role selection ───────────────────── */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">Who are you joining as?</h2>
              <p className="text-sm text-gray-500 mb-7">This shapes your entire experience. You can change this later.</p>

              <div className="space-y-3 mb-8">
                {ROLES.map(({ id, icon: Icon, title, desc, color }) => {
                  const active = data.role === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => set('role', id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                        active
                          ? 'border-blue-600 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        active ? 'bg-blue-600' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-gray-900'}`}>{title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        active ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {active && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <NavButtons onNext={next} isFirst />
            </div>
          )}

          {/* ─── STEP 1: Profile info (role-adaptive) ─────── */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">
                {isTutor ? 'Your teaching profile' : isStudent ? 'About your studies' : 'Organisation details'}
              </h2>
              <p className="text-sm text-gray-500 mb-7">All fields marked with * are required.</p>

              <div className="space-y-5">
                {/* Phone — required for all */}
                <div>
                  <FieldLabel required>Phone number</FieldLabel>
                  <Input
                    icon={Phone}
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={data.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Used only for secure in-platform communication</p>
                </div>

                {/* Subjects — multi select, max 5 */}
                <div>
                  <FieldLabel required>
                    {isTutor ? 'Subjects you teach' : 'Subjects you need help with'}
                    <span className="ml-1 text-xs font-normal text-gray-400">(select up to 5)</span>
                  </FieldLabel>
                  <PillSelect
                    options={SUBJECTS}
                    selected={data.subjects}
                    onChange={v => set('subjects', v)}
                    max={5}
                  />
                </div>

                {/* Student-only fields */}
                {isStudent && (
                  <>
                    <div>
                      <FieldLabel required>Current class / grade</FieldLabel>
                      <Select
                        icon={BookMarked}
                        value={data.grade}
                        onChange={e => set('grade', e.target.value)}
                      >
                        <option value="">Select class / grade</option>
                        {GRADES.map(g => <option key={g}>{g}</option>)}
                      </Select>
                    </div>
                    <div>
                      <FieldLabel required>School board</FieldLabel>
                      <Select
                        value={data.board}
                        onChange={e => set('board', e.target.value)}
                      >
                        <option value="">Select your board</option>
                        {BOARDS.map(b => <option key={b}>{b}</option>)}
                      </Select>
                    </div>
                  </>
                )}

                {/* NGO-only: organisation name */}
                {data.role === 'ngo' && (
                  <div>
                    <FieldLabel required>Organisation name</FieldLabel>
                    <Input
                      placeholder="e.g. Pratham Mumbai"
                      value={data.qualification}
                      onChange={e => set('qualification', e.target.value)}
                    />
                  </div>
                )}
              </div>

              <NavButtons onNext={next} onBack={back} />
            </div>
          )}

          {/* ─── STEP 2 (tutor only): Experience & Bio ────── */}
          {step === 2 && isTutor && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">Your teaching credentials</h2>
              <p className="text-sm text-gray-500 mb-7">This helps students trust and choose you. Be honest and specific.</p>

              <div className="space-y-5">
                <div>
                  <FieldLabel required>Teaching experience</FieldLabel>
                  <Select
                    icon={Briefcase}
                    value={data.experience}
                    onChange={e => set('experience', e.target.value)}
                  >
                    <option value="">Select years of experience</option>
                    <option>Less than 1 year</option>
                    <option>1 – 2 years</option>
                    <option>3 – 5 years</option>
                    <option>5 – 10 years</option>
                    <option>More than 10 years</option>
                  </Select>
                </div>

                <div>
                  <FieldLabel required>Highest qualification</FieldLabel>
                  <Input
                    icon={BookMarked}
                    placeholder="e.g. B.Tech (IIT Bombay), M.Sc Mathematics"
                    value={data.qualification}
                    onChange={e => set('qualification', e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel required>
                    Short bio
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      ({data.bio.length}/300)
                    </span>
                  </FieldLabel>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                    <textarea
                      rows={4}
                      maxLength={300}
                      placeholder="Tell students about your teaching style, achievements, and what makes your sessions special..."
                      value={data.bio}
                      onChange={e => set('bio', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Minimum 30 characters</p>
                </div>
              </div>

              <NavButtons onNext={next} onBack={back} />
            </div>
          )}

          {/* ─── LOCATION STEP (last for all) ─────────────── */}
          {step === locationStep && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">Where are you located?</h2>
              <p className="text-sm text-gray-500 mb-7">
                {isTutor
                  ? 'Students near you will see your profile first.'
                  : 'We use this to show you tutors closest to your area.'}
              </p>

              <div className="space-y-5">
                <div>
                  <FieldLabel required>City</FieldLabel>
                  <Select
                    icon={MapPin}
                    value={data.city}
                    onChange={e => set('city', e.target.value)}
                  >
                    <option value="">Select your city</option>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </Select>
                </div>

                <div>
                  <FieldLabel required>Area / Locality</FieldLabel>
                  <Select
                    value={data.area}
                    onChange={e => set('area', e.target.value)}
                  >
                    <option value="">Select your area</option>
                    {MUMBAI_AREAS.map(a => <option key={a}>{a}</option>)}
                  </Select>
                </div>

                {/* Summary card */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wider">Profile summary</p>
                  <div className="space-y-2">
                    <SummaryRow label="Role"     value={ROLES.find(r => r.id === data.role)?.title} />
                    <SummaryRow label="Subjects"  value={data.subjects.join(', ') || '—'} />
                    {isStudent && <SummaryRow label="Grade"  value={data.grade || '—'} />}
                    {isStudent && <SummaryRow label="Board"  value={data.board || '—'} />}
                    {isTutor  && <SummaryRow label="Experience" value={data.experience || '—'} />}
                    {isTutor  && <SummaryRow label="Qualification" value={data.qualification || '—'} />}
                    <SummaryRow label="Phone"    value={data.phone || '—'} />
                  </div>
                </div>
              </div>

              <NavButtons onNext={submit} onBack={back} isLast loading={loading} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Nav button row ────────────────────────────────────────────
function NavButtons({ onNext, onBack, isFirst, isLast, loading }) {
  return (
    <div className={`flex gap-3 mt-8 ${isFirst ? 'justify-end' : 'justify-between'}`}>
      {!isFirst && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={loading}
        className="flex items-center gap-2 px-6 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm shadow-blue-200"
      >
        {loading
          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : isLast
            ? <><Check className="w-4 h-4 stroke-[2.5]" /> Complete setup</>
            : <>Continue <ChevronRight className="w-4 h-4" /></>
        }
      </button>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-blue-500/70 font-medium w-24 flex-shrink-0">{label}</span>
      <span className="text-xs text-blue-900 font-medium truncate">{value || '—'}</span>
    </div>
  );
}