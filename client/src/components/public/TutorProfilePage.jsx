import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../layout/PublicNavbar';
import { tutorService, sessionService } from '../../services/tutorService';
import {
  MapPin, Star, CheckCircle, BookOpen, Clock,
  ArrowLeft, Lock, ArrowRight, Shield, Calendar, MessageSquare,
  Monitor, Home, X, Users, Zap, Award, IndianRupee,
  AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';

const ICEBREAKERS = [
  "I need help preparing for my upcoming board exams.",
  "I'm struggling with core concepts and need guidance.",
  "Looking for consistent, long-term coaching.",
  "Can we focus on solving past papers?",
];

const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getNext14Days() {
  const days = [];
  const today = new Date();
  today.setHours(0,0,0,0);
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
      const hh = h.toString().padStart(2,'0');
      const mm = m.toString().padStart(2,'0');
      const ampm = h < 12 ? 'AM' : 'PM';
      const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      slots.push({ value: `${hh}:${mm}`, label: `${dh}:${mm} ${ampm}` });
    }
  }
  return slots;
}

function isDayAvailable(date, availability) {
  if (!availability?.length) return true;
  const dayName = DAYS_SHORT[date.getDay()];
  return availability.some(s => s.day === dayName);
}

function getSlotsForDay(date, availability) {
  const ALL = getHalfHourSlots();
  if (!availability?.length) return ALL;
  const dayName = DAYS_SHORT[date.getDay()];
  const daySlots = availability.filter(s => s.day === dayName);
  if (!daySlots.length) return [];
  return ALL.filter(slot => {
    const [h, m] = slot.value.split(':').map(Number);
    const slotMins = h * 60 + m;
    return daySlots.some(ds => {
      const [sh, sm] = ds.start.split(':').map(Number);
      const [eh, em] = ds.end.split(':').map(Number);
      return slotMins >= sh * 60 + sm && slotMins < eh * 60 + em;
    });
  });
}

function StarRow({ rating, size = 'sm' }) {
  const w = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${w} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

const DAYS_14 = getNext14Days();

// ── Booking Modal ──────────────────────────────────────────────
function BookingModal({ tutor, onClose, onSuccess }) {
  const [step,         setStep]        = useState(1);
  const [bookingType,  setBookingType] = useState('trial');
  const [subject,      setSubject]     = useState(tutor.subjects?.[0] || '');
  const [mode,         setMode]        = useState('online');
  const [selectedDay,  setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime]= useState('');
  const [note,         setNote]        = useState('');
  const [loading,      setLoading]     = useState(false);
  const [error,        setError]       = useState('');
  const [dayOffset,    setDayOffset]   = useState(0);

  const VISIBLE = 5;
  const visibleDays    = DAYS_14.slice(dayOffset, dayOffset + VISIBLE);
  const availableSlots = selectedDay ? getSlotsForDay(selectedDay, tutor.availability) : [];

  useEffect(() => {
    if (bookingType === 'trial') setMode('online');
  }, [bookingType]);

  const isFree = bookingType === 'trial';

  const canNext = () => {
    if (step === 1) return !!bookingType;
    if (step === 2) return !!subject;
    if (step === 3) return !!selectedDay;
    if (step === 4) return !!selectedTime;
    return true;
  };

  const handleBook = async () => {
    setLoading(true);
    setError('');
    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const dt = new Date(selectedDay);
      dt.setHours(h, m, 0, 0);

      await sessionService.requestSession({
        tutorProfileId: tutor._id,
        subject,
        scheduledAt:    dt.toISOString(),
        mode,
        notes:          note,
        type:           bookingType,
      });
      onSuccess();
    } catch (err) {
      const code = err.response?.data?.code;
      const msg  = err.response?.data?.message;
      if (code === 'DUPLICATE_TRIAL') {
        setError(msg || 'You already have an active trial with this tutor. Check your dashboard.');
      } else {
        setError(msg || 'Booking failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const STEP_LABELS = ['Session type','Subject & mode','Choose date','Choose time','Confirm'];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-[500px] sm:rounded-3xl rounded-t-3xl border-2 border-gray-200 shadow-[0_-8px_40px_rgba(0,0,0,0.15)] sm:shadow-[8px_8px_0px_0px_#D1D5DB] flex flex-col max-h-[94vh] animate-scale-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-gray-900">Book a session</h2>
            <p className="text-[11px] text-gray-400 font-bold mt-0.5">with {tutor.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-[2px_2px_0px_0px_#E5E7EB] active:translate-y-[1px] active:shadow-none transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-blue-600' : i === step ? 'bg-blue-400' : 'bg-gray-100'}`} />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
            Step {step} of 5 · {STEP_LABELS[step-1]}
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* Step 1 — type */}
          {step === 1 && (
            <div className="animate-fade-up space-y-3">
              <p className="text-sm font-black text-gray-900 mb-3">What kind of session would you like?</p>

              <button onClick={() => setBookingType('trial')}
                className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${bookingType === 'trial' ? 'border-green-500 bg-green-50 shadow-[3px_3px_0px_0px_#86EFAC] -translate-y-0.5' : 'border-gray-200 bg-white hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#E5E7EB]'}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 flex-shrink-0 ${bookingType === 'trial' ? 'bg-green-500 border-green-600' : 'bg-gray-50 border-gray-200'}`}>
                  <Zap className={`w-5 h-5 ${bookingType === 'trial' ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-black ${bookingType === 'trial' ? 'text-green-800' : 'text-gray-900'}`}>Free Trial Lesson</p>
                    <span className="text-[10px] font-black bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">₹0</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">One free session to see if this tutor is the right fit for you.</p>
                  <p className="text-[10px] text-amber-600 font-black mt-1.5">⚡ Tutors only accept limited trials. Book now to secure your spot.</p>
                </div>
                {bookingType === 'trial' && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />}
              </button>

              {tutor.hourlyRate > 0 && (
                <button onClick={() => setBookingType('regular')}
                  className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${bookingType === 'regular' ? 'border-blue-600 bg-blue-50 shadow-[3px_3px_0px_0px_#93C5FD] -translate-y-0.5' : 'border-gray-200 bg-white hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#E5E7EB]'}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 flex-shrink-0 ${bookingType === 'regular' ? 'bg-blue-600 border-blue-700' : 'bg-gray-50 border-gray-200'}`}>
                    <IndianRupee className={`w-5 h-5 ${bookingType === 'regular' ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-black ${bookingType === 'regular' ? 'text-blue-800' : 'text-gray-900'}`}>Paid Session</p>
                      <span className="text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">₹{tutor.hourlyRate}/hr</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Jump straight into regular lessons at the tutor's hourly rate.</p>
                  </div>
                  {bookingType === 'regular' && <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                </button>
              )}
            </div>
          )}

          {/* Step 2 — Subject + Mode */}
          {step === 2 && (
            <div className="animate-fade-up space-y-5">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject *</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer shadow-[2px_2px_0px_0px_#E5E7EB] transition-all">
                  {tutor.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Teaching Mode *</label>
                <div className="grid grid-cols-2 gap-3">
                  {tutor.online && (
                    <button onClick={() => !isFree && setMode('online')} disabled={isFree}
                      className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-sm font-black transition-all ${mode === 'online' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-[3px_3px_0px_0px_#93C5FD]' : 'border-gray-200 bg-white text-gray-500'}`}>
                      <Monitor className="w-4 h-4" /> Online
                    </button>
                  )}
                  {tutor.offline && (
                    <button onClick={() => !isFree && setMode('offline')} disabled={isFree}
                      className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-sm font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed ${mode === 'offline' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-[3px_3px_0px_0px_#93C5FD]' : 'border-gray-200 bg-white text-gray-500'}`}>
                      <Home className="w-4 h-4" /> In-Person
                    </button>
                  )}
                </div>
                {isFree && (
                  <p className="text-[11px] text-amber-600 font-bold mt-2 flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Shield className="w-3 h-3 flex-shrink-0" />
                    For safety, all free trials must be conducted online.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Date */}
          {step === 3 && (
            <div className="animate-fade-up">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Pick a date *</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setDayOffset(o => Math.max(0, o - 1))} disabled={dayOffset === 0}
                  className="w-8 h-8 rounded-lg border-2 border-gray-200 bg-white flex items-center justify-center disabled:opacity-30 hover:border-gray-300 transition-all flex-shrink-0">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <div className="flex gap-1.5 flex-1">
                  {visibleDays.map(day => {
                    const isSelected = selectedDay?.toDateString() === day.toDateString();
                    const hasAvail   = isDayAvailable(day, tutor.availability);
                    const dayName    = DAYS_SHORT[day.getDay()];
                    return (
                      <button key={day.toISOString()} onClick={() => { setSelectedDay(day); setSelectedTime(''); }}
                        disabled={!hasAvail}
                        className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 transition-all disabled:opacity-25 disabled:cursor-not-allowed ${isSelected ? 'border-blue-600 bg-blue-50 shadow-[3px_3px_0px_0px_#93C5FD] -translate-y-0.5' : 'border-gray-200 bg-white hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#E5E7EB]'}`}>
                        <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>{dayName}</span>
                        <span className={`text-xl font-black mt-0.5 ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{day.getDate()}</span>
                        <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-blue-400' : 'text-gray-300'}`}>{day.toLocaleString('en-IN', { month: 'short' })}</span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setDayOffset(o => Math.min(DAYS_14.length - VISIBLE, o + 1))} disabled={dayOffset + VISIBLE >= DAYS_14.length}
                  className="w-8 h-8 rounded-lg border-2 border-gray-200 bg-white flex items-center justify-center disabled:opacity-30 hover:border-gray-300 transition-all flex-shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {selectedDay && (
                <p className="text-[11px] text-gray-400 font-bold mt-2">
                  {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {!tutor.availability?.length && (
                <p className="text-[11px] text-blue-600 font-bold mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  No fixed schedule set — pick any day and the tutor will confirm if it works.
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Time + note */}
          {step === 4 && (
            <div className="animate-fade-up space-y-5">
              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Time slot *</p>
                {availableSlots.length === 0 && tutor.availability?.length > 0 ? (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-red-700">No slots available on this day. Go back and pick a different date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-0.5">
                    {(availableSlots.length ? availableSlots : getHalfHourSlots()).map(slot => (
                      <button key={slot.value} onClick={() => setSelectedTime(slot.value)}
                        className={`py-2.5 text-[12px] font-black rounded-xl border-2 transition-all ${selectedTime === slot.value ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-[2px_2px_0px_0px_#93C5FD]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Message to tutor <span className="font-normal normal-case text-gray-300">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {ICEBREAKERS.map((text, i) => (
                    <button key={i} onClick={() => setNote(text)}
                      className={`text-[10px] font-black px-3 py-1.5 rounded-lg border-2 transition-all text-left ${note === text ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      "{text}"
                    </button>
                  ))}
                </div>
                <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Introduce yourself and explain what you need help with..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 shadow-[2px_2px_0px_0px_#E5E7EB] focus:shadow-[2px_2px_0px_0px_#93C5FD] transition-all" />
              </div>
            </div>
          )}

          {/* Step 5 — Confirm */}
          {step === 5 && (
            <div className="animate-fade-up space-y-4">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 shadow-[3px_3px_0px_0px_#E5E7EB]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Booking Summary</p>
                <div className="space-y-3">
                  {[
                    { icon: Users,        label: 'Tutor',   val: tutor.name },
                    { icon: BookOpen,     label: 'Subject', val: subject },
                    { icon: mode === 'online' ? Monitor : Home, label: 'Mode', val: mode === 'online' ? 'Online' : 'In-Person' },
                    { icon: Calendar,     label: 'Date',    val: selectedDay?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
                    { icon: Clock,        label: 'Time',    val: getHalfHourSlots().find(s => s.value === selectedTime)?.label },
                    { icon: IndianRupee,  label: 'Amount',  val: isFree ? '₹0 (Free Trial)' : `₹${tutor.hourlyRate}` },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <div className="flex items-baseline justify-between flex-1 gap-3">
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
                        <span className="text-xs font-black text-gray-900 text-right">{val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {note && (
                <div className="bg-blue-50 border-2 border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Your message</p>
                  <p className="text-xs text-blue-800 font-medium italic">"{note}"</p>
                </div>
              )}

              {mode === 'online' && (
                <div className="flex items-start gap-2.5 bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3">
                  <Monitor className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-green-800 font-bold leading-relaxed">
                    Once confirmed, the tutor will add a Google Meet / Zoom link to your dashboard.
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-bold">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t-2 border-gray-100 bg-gray-50/50 flex-shrink-0">
          {step > 1 && (
            <button onClick={() => { setStep(s => s - 1); setError(''); }}
              className="px-4 h-11 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-[2px_2px_0px_0px_#E5E7EB] active:translate-y-[1px] active:shadow-none transition-all">
              Back
            </button>
          )}
          <button
            disabled={loading || (step === 4 && availableSlots.length === 0 && tutor.availability?.length > 0)}
            onClick={() => {
              if (!canNext()) { setError('Please complete this step first.'); return; }
              setError('');
              if (step < 5) setStep(s => s + 1);
              else handleBook();
            }}
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black uppercase tracking-wide rounded-xl shadow-[3px_3px_0px_0px_#93C5FD] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all flex items-center justify-center gap-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : step === 5
                ? <><CheckCircle className="w-4 h-4" /> Confirm Booking</>
                : <>Next <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// Success modal
function SuccessModal({ tutorName, onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 w-full max-w-sm text-center shadow-[8px_8px_0px_0px_#D1D5DB] animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center mx-auto mb-5 shadow-[3px_3px_0px_0px_#86EFAC]">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Request Sent! 🎉</h3>
        <p className="text-sm text-gray-500 font-medium mb-1">Sent to <strong className="text-gray-800">{tutorName}</strong>.</p>
        <p className="text-sm text-gray-500 font-medium mb-6">Tutors typically respond within a few hours. Check your dashboard for updates.</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/student/dashboard')}
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-xl shadow-[3px_3px_0px_0px_#93C5FD] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" /> View my dashboard
          </button>
          <button onClick={onClose}
            className="w-full h-11 border-2 border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-50 shadow-[2px_2px_0px_0px_#E5E7EB] active:translate-y-[1px] active:shadow-none transition-all">
            Browse more tutors
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────
export default function TutorProfilePage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [tutor,           setTutor]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [showModal,       setShowModal]       = useState(false);
  const [showSuccess,     setShowSuccess]     = useState(false);
  const [activeTab,       setActiveTab]       = useState('about');
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  // Check if this student already has an active trial with this tutor
  const [alreadyTrialed, setAlreadyTrialed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    tutorService.getTutorById(id)
      .then(data => setTutor(data.tutor))
      .catch(() => setError('Tutor not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Check student's sessions to see if they already have an active trial here
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'student' || !id) return;
    sessionService.getStudentSessions()
      .then(data => {
        const active = (data.sessions || []).find(s =>
          s.tutorProfile?._id === id &&
          s.type === 'trial' &&
          ['pending', 'accepted'].includes(s.status)
        );
        setAlreadyTrialed(!!active);
      })
      .catch(() => {});
  }, [isAuthenticated, user, id]);

  if (loading) return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PublicNavbar />
      <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-500 font-bold">Loading profile...</p>
      </div>
    </div>
  );

  if (error || !tutor) return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PublicNavbar />
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Profile Unavailable</h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/browse" className="px-6 py-3 bg-blue-600 text-white font-black uppercase tracking-wide rounded-xl shadow-[3px_3px_0px_0px_#93C5FD]">
          Back to Browse
        </Link>
      </div>
    </div>
  );

  const initials       = tutor.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const isTutorRole    = isAuthenticated && user?.role === 'tutor';
  const canBook        = isAuthenticated && user?.role === 'student';
  const displayReviews = reviewsExpanded ? tutor.reviews : tutor.reviews?.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 lg:pb-8">
      <PublicNavbar />

      <div className="bg-white border-b-2 border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/browse" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400 hover:text-gray-800 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to search
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT */}
          <div className="flex-1 space-y-6 min-w-0">

            <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#D1D5DB] animate-fade-up delay-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-3xl border-2 border-gray-200 bg-blue-50 flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0px_0px_#D1D5DB]">
                  {tutor.avatar
                    ? <img src={tutor.avatar} alt={tutor.name} className="w-full h-full rounded-3xl object-cover" />
                    : <span className="text-blue-700 font-black text-4xl">{initials}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{tutor.name}</h1>
                    {tutor.isVerified && (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border-2 border-green-200 shadow-[2px_2px_0px_0px_#bbf7d0]">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-500 mb-3">{tutor.qualification || 'Professional Educator'}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                      <MapPin className="w-3.5 h-3.5" /> {tutor.area}, {tutor.city}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                      <Users className="w-3.5 h-3.5 text-blue-500" /> {tutor.totalSessions || 0} sessions taught
                    </span>
                    {tutor.isVerified && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                        <Shield className="w-3.5 h-3.5" /> ID Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats bar — only show rating if has reviews */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-t-2 border-b-2 border-gray-100 mb-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rating</p>
                  {tutor.totalReviews > 0
                    ? <div className="flex items-center gap-1"><Star className="w-5 h-5 text-amber-400 fill-amber-400" /><span className="text-lg font-black">{tutor.rating.toFixed(1)}</span></div>
                    : <span className="text-sm font-black text-gray-400">No reviews yet</span>}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reviews</p>
                  <p className="text-lg font-black text-gray-900">{tutor.totalReviews || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Experience</p>
                  <p className="text-base font-black text-gray-900">{tutor.experience || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mode</p>
                  <div className="flex items-center gap-2 mt-1">
                    {tutor.online  && <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100" title="Online"><Monitor className="w-3.5 h-3.5" /></span>}
                    {tutor.offline && <span className="w-6 h-6 rounded-md bg-green-50 text-green-600 flex items-center justify-center border border-green-100" title="In-Person"><MapPin className="w-3.5 h-3.5" /></span>}
                  </div>
                </div>
              </div>

              {/* Subjects */}
              <div className="mb-6">
                <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Subjects Offered</h2>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects?.map(s => (
                    <span key={s} className="text-xs font-black px-3 py-1.5 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-xl">{s}</span>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-t-2 border-gray-100 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8">
                {[
                  { key: 'about',        label: 'About' },
                  { key: 'availability', label: 'Availability' },
                  { key: 'reviews',      label: `Reviews (${tutor.totalReviews || 0})` },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wide transition-colors ${activeTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#D1D5DB] animate-fade-up delay-100">

              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" /> About Me
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                      {tutor.bio || 'No biography provided.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: Users,    label: 'Students',   value: tutor.totalStudents || 0 },
                      { icon: BookOpen, label: 'Sessions',   value: tutor.totalSessions || 0 },
                      { icon: Award,    label: 'Experience', value: tutor.experience?.split(' ')[0] || '—' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 text-center shadow-[2px_2px_0px_0px_#E5E7EB]">
                        <Icon className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                        <p className="text-xl font-black text-gray-900">{value}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'availability' && (
                <div>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">Weekly Schedule</h2>
                  {tutor.availability?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => {
                        const daySlots = tutor.availability.filter(s => s.day === day);
                        if (!daySlots.length) return null;
                        return (
                          <div key={day} className="flex items-start gap-3 px-4 py-3 border-2 border-green-200 bg-green-50 rounded-xl">
                            <span className="text-xs font-black uppercase tracking-wider text-green-700 w-8 flex-shrink-0 pt-0.5">{day}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {daySlots.map((s, i) => (
                                <span key={i} className="text-xs font-bold bg-white text-green-800 border border-green-200 px-2.5 py-1 rounded-lg">
                                  {s.start} – {s.end}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-5 text-center">
                      <p className="text-sm font-bold text-blue-700">Flexible schedule — discuss timing with the tutor after booking.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {tutor.reviews?.length ? (
                    <>
                      <div className="flex items-center gap-6 mb-6 p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl shadow-[3px_3px_0px_0px_#E5E7EB]">
                        <div className="text-center flex-shrink-0">
                          <p className="text-4xl font-black text-gray-900">{tutor.rating.toFixed(1)}</p>
                          <StarRow rating={tutor.rating} size="md" />
                          <p className="text-xs text-gray-400 font-bold mt-1">{tutor.totalReviews} reviews</p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[5,4,3,2,1].map(n => {
                            const count = tutor.reviews.filter(r => r.rating === n).length;
                            const pct   = tutor.reviews.length ? (count / tutor.reviews.length) * 100 : 0;
                            return (
                              <div key={n} className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-400 w-3">{n}</span>
                                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 w-4">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {displayReviews.map((review, idx) => (
                          <div key={idx} className="p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-xs font-black text-gray-900">{review.studentName}</span>
                                <div className="mt-0.5"><StarRow rating={review.rating} /></div>
                              </div>
                              {review.createdAt && (
                                <p className="text-[10px] text-gray-300 font-bold">
                                  {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                            {review.comment && <p className="text-sm text-gray-600 font-medium leading-relaxed mt-2">"{review.comment}"</p>}
                          </div>
                        ))}
                      </div>
                      {tutor.reviews.length > 4 && (
                        <button onClick={() => setReviewsExpanded(v => !v)}
                          className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-black text-gray-400 hover:text-blue-600 hover:border-blue-300 uppercase tracking-wide transition-all">
                          {reviewsExpanded ? 'Show fewer' : `Show all ${tutor.reviews.length} reviews`}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-bold">No reviews yet</p>
                      <p className="text-sm text-gray-400 mt-0.5">Be the first to book a session and leave a review.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT sticky sidebar */}
          <div className="lg:w-[320px] flex-shrink-0 animate-fade-up delay-150">
            <div className="sticky top-24 bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-[8px_8px_0px_0px_#D1D5DB]">

              <div className="mb-5">
                {tutor.trialFree && !isTutorRole && (
                  <div className="bg-green-50 border-2 border-green-200 text-green-700 text-xs font-black uppercase tracking-wide px-4 py-2 rounded-xl mb-3 flex items-center gap-2 shadow-[2px_2px_0px_0px_#bbf7d0]">
                    <Zap className="w-4 h-4" /> Free Trial Available
                  </div>
                )}
                {tutor.hourlyRate > 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900">₹{tutor.hourlyRate}</span>
                    <span className="text-sm font-bold text-gray-400">/ hour</span>
                  </div>
                ) : (
                  <p className="text-xl font-black text-green-700">Free Sessions</p>
                )}
                <p className="text-[10px] font-bold text-gray-400 mt-1">Rate applies after your free trial.</p>
              </div>

              {tutor.availability?.length > 0 && (
                <div className="mb-5 pb-5 border-b-2 border-gray-100">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Available</h3>
                  <ul className="space-y-1.5">
                    {tutor.availability.slice(0, 4).map((slot, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{slot.day}: {slot.start}–{slot.end}</span>
                      </li>
                    ))}
                    {tutor.availability.length > 4 && (
                      <li className="text-[11px] font-bold text-blue-500 cursor-pointer hover:underline" onClick={() => setActiveTab('availability')}>
                        +{tutor.availability.length - 4} more →
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* CTA — role aware */}
              {isTutorRole ? (
                <div className="bg-gray-50 border-2 border-gray-200 text-gray-500 text-xs font-bold px-4 py-3 rounded-xl text-center">
                  You're viewing this as a tutor. Students can book this session.
                </div>
              ) : canBook ? (
                <>
                  {alreadyTrialed ? (
                    <div className="space-y-3">
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3 text-center">
                        <p className="text-xs font-black text-amber-800 mb-0.5">⏳ Trial already requested</p>
                        <p className="text-[11px] text-amber-700 font-medium">You have an active trial session with this tutor. Check your dashboard for its status.</p>
                      </div>
                      {tutor.hourlyRate > 0 && (
                        <button onClick={() => setShowModal(true)}
                          className="w-full h-12 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-black uppercase tracking-wide rounded-xl shadow-[3px_3px_0px_0px_#93C5FD] active:translate-y-[2px] active:shadow-none transition-all text-sm flex items-center justify-center gap-2">
                          <IndianRupee className="w-4 h-4" /> Book Paid Session
                        </button>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => setShowModal(true)}
                      className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wide rounded-xl shadow-[4px_4px_0px_0px_#93C5FD] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none transition-all flex items-center justify-center gap-2">
                      Request Session <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <button onClick={() => navigate('/register', { state: { from: { pathname: `/tutor/${id}` } } })}
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white text-sm font-black uppercase tracking-wide rounded-xl shadow-[3px_3px_0px_0px_#6B7280] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" /> Get started free
                  </button>
                  <p className="text-center text-[11px] text-gray-400 font-bold">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
                  </p>
                </div>
              )}

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Shield className="w-3 h-3" /> Secure booking via EduReach
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {canBook && !isTutorRole && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t-2 border-gray-100 lg:hidden z-40">
          {alreadyTrialed ? (
            <div className="text-center">
              <p className="text-xs font-black text-amber-700">⏳ Active trial in progress — check your dashboard</p>
            </div>
          ) : (
            <button onClick={() => setShowModal(true)}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase tracking-wide rounded-xl shadow-[3px_3px_0px_0px_#93C5FD] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2">
              {tutor.trialFree && <Zap className="w-4 h-4" />} Request Session
            </button>
          )}
        </div>
      )}

      {showModal && (
        <BookingModal tutor={tutor} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); setShowSuccess(true); }} />
      )}
      {showSuccess && (
        <SuccessModal tutorName={tutor.name} onClose={() => setShowSuccess(false)} />
      )}
    </div>
  );
}