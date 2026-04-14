import { useState } from 'react';
import { X, IndianRupee, Book, User as UserIcon, Monitor, MapPin, Plus, Trash2, Clock } from 'lucide-react';
import { tutorService } from '../../services/tutorService';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Quick time presets
const TIME_PRESETS = [
  { label: 'Morning (8–12)', start: '08:00', end: '12:00' },
  { label: 'Afternoon (12–4)', start: '12:00', end: '16:00' },
  { label: 'Evening (4–8)', start: '16:00', end: '20:00' },
  { label: 'Night (8–10)', start: '20:00', end: '22:00' },
];

export default function EditProfileModal({ profile, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const [form, setForm] = useState({
    hourlyRate: profile.hourlyRate || 0,
    bio:        profile.bio || '',
    subjects:   profile.subjects?.join(', ') || '',
    online:     profile.online ?? true,
    offline:    profile.offline ?? true,
  });

  // Availability state — array of { day, start, end }
  const [slots, setSlots] = useState(
    profile.availability?.length ? [...profile.availability] : []
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const addSlot = (day) => {
    // Check if this day already has 3 slots
    const dayCount = slots.filter(s => s.day === day).length;
    if (dayCount >= 3) return;
    setSlots(prev => [...prev, { day, start: '16:00', end: '20:00' }]);
  };

  const removeSlot = (idx) => {
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx, field, value) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const applyPreset = (day, preset) => {
    // Remove all slots for this day first, then add preset
    const filtered = slots.filter(s => s.day !== day);
    setSlots([...filtered, { day, start: preset.start, end: preset.end }]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const formattedSubjects = form.subjects
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Validate slots
      for (const slot of slots) {
        if (slot.start >= slot.end) {
          setError(`On ${slot.day}: End time must be after start time.`);
          setLoading(false);
          return;
        }
      }

      const updateData = {
        hourlyRate:   Number(form.hourlyRate),
        bio:          form.bio,
        subjects:     formattedSubjects,
        online:       form.online,
        offline:      form.offline,
        availability: slots,
      };

      const { profile: updated } = await tutorService.updateMyProfile(updateData);
      onSuccess(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-2 border-gray-200 rounded-3xl w-full max-w-lg shadow-[8px_8px_0px_0px_#D1D5DB] overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">

        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Edit Profile</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-[2px_2px_0px_0px_#E5E7EB] active:translate-y-[1px] active:shadow-none transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inner tabs */}
        <div className="flex border-b-2 border-gray-100 flex-shrink-0">
          {[
            { key: 'profile',      label: 'Profile & Pricing' },
            { key: 'availability', label: 'My Availability' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wide transition-colors ${activeTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 flex-shrink-0 bg-red-50 border-2 border-red-200 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="space-y-5">

              {/* Hourly Rate */}
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1.5">Hourly Rate (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" name="hourlyRate" min="0" step="50"
                    value={form.hourlyRate} onChange={handleChange}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-[3px_3px_0px_0px_#E5E7EB] focus:shadow-[3px_3px_0px_0px_#93C5FD] transition-all" />
                </div>
                <p className="text-[10px] font-bold text-gray-400 mt-1.5">Trial session is always free. This rate applies after the trial.</p>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1.5">Subjects (comma separated)</label>
                <div className="relative">
                  <Book className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <textarea name="subjects" rows={2} placeholder="Mathematics, Physics, Chemistry..."
                    value={form.subjects} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-[3px_3px_0px_0px_#E5E7EB] focus:shadow-[3px_3px_0px_0px_#93C5FD] transition-all resize-none" />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1.5">
                  Bio <span className="text-[10px] font-normal text-gray-400 tracking-normal normal-case">({form.bio.length}/500 chars)</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <textarea name="bio" rows={4} maxLength={500}
                    placeholder="Tell students about your teaching style, experience and achievements..."
                    value={form.bio} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-[3px_3px_0px_0px_#E5E7EB] focus:shadow-[3px_3px_0px_0px_#93C5FD] transition-all resize-none" />
                </div>
              </div>

              {/* Teaching Mode */}
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-2">Teaching Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="online" checked={form.online} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> Online</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="offline" checked={form.offline} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> In-Person</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── AVAILABILITY TAB ── */}
          {activeTab === 'availability' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border-2 border-blue-100 rounded-xl px-4 py-3">
                <p className="text-[11px] font-bold text-blue-700 leading-relaxed">
                  Set the days and times you're available to teach. Students will only be able to book slots within these windows.
                </p>
              </div>

              {DAYS.map(day => {
                const daySlots = slots.filter(s => s.day === day);
                return (
                  <div key={day} className="border-2 border-gray-100 rounded-2xl overflow-hidden">
                    {/* Day header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b-2 border-gray-100">
                      <span className="text-sm font-black text-gray-900">{day}</span>
                      <div className="flex items-center gap-2">
                        {/* Quick presets */}
                        <select
                          onChange={e => {
                            if (!e.target.value) return;
                            const preset = TIME_PRESETS.find(p => p.label === e.target.value);
                            if (preset) applyPreset(day, preset);
                            e.target.value = '';
                          }}
                          className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                          defaultValue="">
                          <option value="">Quick add...</option>
                          {TIME_PRESETS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                        </select>
                        <button
                          onClick={() => addSlot(day)}
                          disabled={daySlots.length >= 3}
                          className="flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-800 disabled:opacity-30 disabled:cursor-not-allowed border-2 border-blue-200 bg-blue-50 rounded-lg px-2 py-1 transition-all">
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>

                    {/* Slots */}
                    {daySlots.length === 0 ? (
                      <div className="px-4 py-3 text-[11px] font-bold text-gray-300 italic">Not available — click Add to set hours</div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {slots.map((slot, idx) => slot.day !== day ? null : (
                          <div key={idx} className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <input type="time" value={slot.start}
                              onChange={e => updateSlot(idx, 'start', e.target.value)}
                              className="h-8 px-2 rounded-lg border-2 border-gray-200 bg-gray-50 text-[12px] font-bold focus:outline-none focus:border-blue-500 transition-all" />
                            <span className="text-[11px] font-black text-gray-400">to</span>
                            <input type="time" value={slot.end}
                              onChange={e => updateSlot(idx, 'end', e.target.value)}
                              className="h-8 px-2 rounded-lg border-2 border-gray-200 bg-gray-50 text-[12px] font-bold focus:outline-none focus:border-blue-500 transition-all" />
                            <button onClick={() => removeSlot(idx)}
                              className="ml-auto w-7 h-7 rounded-lg border-2 border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 transition-all">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {slots.length === 0 && (
                <p className="text-center text-[11px] text-gray-400 font-bold py-2">
                  No availability set. Students will see "Flexible schedule — discuss with tutor."
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-gray-100 bg-gray-50/50 flex justify-end gap-3 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="px-5 h-11 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-[2px_2px_0px_0px_#E5E7EB] active:translate-y-[1px] active:shadow-none transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-6 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black tracking-wide uppercase shadow-[3px_3px_0px_0px_#93C5FD] active:translate-y-[2px] active:shadow-none disabled:opacity-60 transition-all flex items-center gap-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Save Changes'
            }
          </button>
        </div>
      </div>
    </div>
  );
}