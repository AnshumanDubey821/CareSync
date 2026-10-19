import React, { useState, useEffect } from 'react';
import { doctorService } from '../services/doctorService';
import Toast from '../components/Toast';
import { Clock, Calendar, Plus, Trash2, AlertCircle, CheckCircle2, X } from 'lucide-react';

const DoctorAvailabilityPage = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [availabilityType, setAvailabilityType] = useState('DATE'); // 'DATE' or 'WEEKDAY'
  const [availableDate, setAvailableDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [dayOfWeek, setDayOfWeek] = useState('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getDoctorAvailability();
      setAvailabilities(data);
    } catch (err) {
      console.error('Failed to fetch availability schedule:', err);
      setToast({ message: 'Failed to load availability schedule.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAvailabilitySubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    // Front-end Time Validation
    if (startTime >= endTime) {
      setToast({ message: 'End time must be after start time.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        startTime,
        endTime,
        slotDurationMinutes: parseInt(slotDurationMinutes, 10),
        active: true,
      };

      if (availabilityType === 'DATE') {
        payload.availableDate = availableDate;
      } else {
        payload.dayOfWeek = dayOfWeek;
      }

      await doctorService.addAvailability(payload);
      setToast({ message: 'Availability schedule added successfully!', type: 'success' });
      setIsModalOpen(false);
      fetchAvailabilities();
    } catch (err) {
      console.error('Add availability error:', err);
      const msg = err.response?.data?.message || 'Failed to add availability schedule.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAvailability = async (id) => {
    try {
      await doctorService.deleteAvailability(id);
      setToast({ message: 'Availability schedule deleted.', type: 'success' });
      fetchAvailabilities();
    } catch (err) {
      console.error('Delete availability error:', err);
      setToast({ message: 'Failed to delete availability.', type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="section-eyebrow">Consultation Hours</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy-900 tracking-tight mt-0.5">
            Availability Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish your consultation hours so CareSync can dynamically generate booking time slots.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-md shadow-primary-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Availability Slot</span>
        </button>
      </div>

      {/* Availabilities Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-xs sm:text-sm animate-pulse">Loading schedule...</div>
      ) : availabilities.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-navy-900">No Availability Slots Published</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Add Availability Slot" above to define your daily or weekly consultation hours.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availabilities.map((avail) => (
            <div
              key={avail.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-ice-100 text-primary-700 border border-primary-200 text-xs font-extrabold rounded-full uppercase tracking-wider">
                    {avail.availableDate ? `Date: ${avail.availableDate}` : `Weekly: ${avail.dayOfWeek}`}
                  </span>
                  <button
                    onClick={() => handleDeleteAvailability(avail.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                    title="Delete Availability"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-navy-900 font-bold text-base">
                    <Clock className="w-4 h-4 text-primary-600" />
                    <span>{avail.startTime} - {avail.endTime} IST</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    Slot Duration: {avail.slotDurationMinutes} Minutes
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Status: <strong className="text-emerald-600 font-bold">Active</strong></span>
                <span>Ref #{avail.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Availability Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-navy-900">Add Availability Schedule</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAvailabilitySubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-ice-100 rounded-full text-xs font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAvailabilityType('DATE')}
                  className={`py-2 rounded-full transition-all ${
                    availabilityType === 'DATE' ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  Specific Date
                </button>
                <button
                  type="button"
                  onClick={() => setAvailabilityType('WEEKDAY')}
                  className={`py-2 rounded-full transition-all ${
                    availabilityType === 'WEEKDAY' ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  Recurring Weekday
                </button>
              </div>

              {availabilityType === 'DATE' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Available Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={availableDate}
                    onChange={(e) => setAvailableDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Day of Week *
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 font-medium"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                    <option value="SUNDAY">Sunday</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Slot Duration (Minutes)
                </label>
                <select
                  value={slotDurationMinutes}
                  onChange={(e) => setSlotDurationMinutes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailabilityPage;
