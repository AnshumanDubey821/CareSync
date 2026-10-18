import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorService } from '../services/doctorService';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import {
  Calendar,
  Clock,
  MapPin,
  Award,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

const DoctorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Default tomorrow
  );
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isDoctorLoading, setIsDoctorLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);

  // Booking Modal State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchDoctorProfile();
  }, [id]);

  useEffect(() => {
    if (doctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [doctor, selectedDate]);

  const fetchDoctorProfile = async () => {
    setIsDoctorLoading(true);
    try {
      const data = await doctorService.getDoctorById(id);
      setDoctor(data);
    } catch (err) {
      console.error('Failed to fetch doctor profile:', err);
      setToast({ message: 'Doctor profile not found.', type: 'error' });
    } finally {
      setIsDoctorLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    setIsSlotsLoading(true);
    try {
      const slots = await doctorService.getAvailableSlots(id, selectedDate);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Failed to fetch available slots:', err);
      setAvailableSlots([]);
    } finally {
      setIsSlotsLoading(false);
    }
  };

  const handleBookAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setIsBooking(true);
    try {
      const bookingPayload = {
        doctorId: doctor.id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: reason.trim() || 'General Consultation',
        notes: notes.trim() || undefined,
      };

      const response = await appointmentService.bookAppointment(bookingPayload);
      setConfirmedBooking(response);
      setSelectedSlot(null);
      setReason('');
      setNotes('');
      setToast({ message: 'Appointment booked successfully!', type: 'success' });
      fetchAvailableSlots(); // Refresh remaining slots
    } catch (err) {
      console.error('Booking error:', err);
      const status = err.response?.status;
      
      // CRITICAL REQUIREMENT: 409 CONFLICT HANDLER
      if (status === 409) {
        setToast({
          message: 'This appointment slot is no longer available.',
          type: 'error',
        });
        setSelectedSlot(null);
        fetchAvailableSlots(); // Refresh slots immediately from backend
      } else {
        const msg = err.response?.data?.message || 'Failed to book appointment. Please try again.';
        setToast({ message: msg, type: 'error' });
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (isDoctorLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Doctor Profile Not Found</h2>
        <button
          onClick={() => navigate('/patient/doctors')}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold"
        >
          Back to Doctor Search
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Back Button */}
      <button
        onClick={() => navigate('/patient/doctors')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Doctors</span>
      </button>

      {/* Doctor Profile Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-sky-600/20">
              {doctor.fullName ? doctor.fullName.charAt(4) || doctor.fullName.charAt(0) : 'D'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{doctor.fullName}</h1>
              <p className="text-sm font-bold text-sky-600">{doctor.specialization}</p>
              <p className="text-xs text-slate-500 mt-0.5">{doctor.qualifications} • {doctor.experienceYears || 0} Years Experience</p>
            </div>
          </div>

          <div className="bg-sky-50/80 border border-sky-100 p-4 rounded-xl text-center md:text-right shrink-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Consultation Fee</span>
            <span className="text-2xl font-extrabold text-sky-700">${parseFloat(doctor.consultationFee).toFixed(2)}</span>
          </div>
        </div>

        {doctor.location && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{doctor.location}</span>
          </div>
        )}

        {doctor.bio && (
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">About Doctor</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{doctor.bio}</p>
          </div>
        )}
      </div>

      {/* Date & Interactive Time Slot Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Select Appointment Date & Time</h2>
            <p className="text-xs text-slate-500">Available consultation slots are generated dynamically by CareSync</p>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            />
          </div>
        </div>

        {/* Time Slots Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Available Slots for {selectedDate}
          </h3>

          {isSlotsLoading ? (
            <div className="py-8 text-center text-sm text-slate-500">Fetching available time slots...</div>
          ) : availableSlots.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No available slots for this date</p>
              <p className="text-xs text-slate-500">Please select another date on the calendar above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {availableSlots.map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSlot(slot)}
                  className="p-3 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 rounded-xl font-bold text-xs transition-all text-center flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{slot.startTime} - {slot.endTime}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Confirmation Dialog / Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Confirm Appointment Booking</h3>
              <button onClick={() => setSelectedSlot(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 space-y-2 text-xs text-slate-700">
              <p><strong>Doctor:</strong> {doctor.fullName} ({doctor.specialization})</p>
              <p><strong>Date:</strong> {selectedDate}</p>
              <p><strong>Time Slot:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
              <p><strong>Fee:</strong> ${parseFloat(doctor.consultationFee).toFixed(2)}</p>
            </div>

            <form onSubmit={handleBookAppointmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Visit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual physical checkup, headache evaluation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Prior medical history or specific concerns..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBooking}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {isBooking ? 'Processing Booking...' : 'Confirm & Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Success Confirmation Card Modal */}
      {confirmedBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border border-slate-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Appointment Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1">Booking Ref #{confirmedBooking.id}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2 text-slate-700">
              <p><strong>Doctor:</strong> {confirmedBooking.doctorName}</p>
              <p><strong>Date:</strong> {confirmedBooking.appointmentDate}</p>
              <p><strong>Time:</strong> {confirmedBooking.startTime} - {confirmedBooking.endTime}</p>
              <p><strong>Status:</strong> <span className="text-emerald-700 font-bold">{confirmedBooking.status}</span></p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setConfirmedBooking(null);
                  navigate('/patient/appointments');
                }}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md"
              >
                Go to My Appointments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDetailPage;
