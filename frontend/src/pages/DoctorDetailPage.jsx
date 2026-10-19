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
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Sun,
  Sunset,
  Moon,
  Sparkles
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
      console.error('Failed to book appointment:', err);
      const errMsg = err.response?.data?.message || 'Booking failed. Slot may no longer be available.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setIsBooking(false);
    }
  };

  // Group slots by Morning / Afternoon / Evening
  const morningSlots = availableSlots.filter((slot) => {
    const hour = parseInt(slot.startTime.split(':')[0], 10);
    return hour < 12;
  });

  const afternoonSlots = availableSlots.filter((slot) => {
    const hour = parseInt(slot.startTime.split(':')[0], 10);
    return hour >= 12 && hour < 17;
  });

  const eveningSlots = availableSlots.filter((slot) => {
    const hour = parseInt(slot.startTime.split(':')[0], 10);
    return hour >= 17;
  });

  if (isDoctorLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-28"></div>
        <div className="h-48 bg-slate-200 rounded-3xl"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-navy-900">Doctor Profile Not Found</h2>
        <button
          onClick={() => navigate('/patient/doctors')}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-full text-xs font-semibold hover:bg-primary-700"
        >
          Return to Doctors List
        </button>
      </div>
    );
  }

  const photoIndex = ((doctor.id || 1) % 6) + 1;
  const doctorImg = `/images/doc-${photoIndex}.jpg`;

  return (
    <div className="space-y-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Navigation Breadcrumb */}
      <button
        onClick={() => navigate('/patient/doctors')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Specialist Doctors</span>
      </button>

      {/* Doctor Profile Banner Card (Doctorate Design) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-200 shadow-md shrink-0">
              <img
                src={doctorImg}
                alt={doctor.fullName}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                  {doctor.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> NMC Verified
                </span>
              </div>
              <p className="text-sm font-bold text-primary-600 mt-1">{doctor.specialization}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {doctor.qualifications} • {doctor.experienceYears || 5}+ Years Clinical Experience
              </p>
            </div>
          </div>

          <div className="bg-ice-100 border border-primary-200/60 p-4 rounded-2xl text-center md:text-right shrink-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-primary-700">Consultation Fee</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-navy-900">
              ₹{Number(doctor.consultationFee || 500).toLocaleString('en-IN')}
            </span>
            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">Pay at hospital or UPI</span>
          </div>
        </div>

        {doctor.location && (
          <div className="flex items-start gap-2 text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
            <Building2 className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <span>Clinic / Hospital: {doctor.location}</span>
          </div>
        )}

        {doctor.bio && (
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Professional Overview</h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-ice-100/50 p-4 rounded-2xl border border-slate-100">
              {doctor.bio}
            </p>
          </div>
        )}
      </div>

      {/* Date & Interactive Time Slot Selector */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="section-eyebrow">Real-Time Scheduling</span>
            <h2 className="text-lg font-bold text-navy-900 mt-0.5">Select Consultation Slot (IST)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant slot locking with CareSync double-booking prevention.
            </p>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2 bg-ice-100 p-2 px-3.5 rounded-full border border-slate-200">
            <Calendar className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-bold text-slate-700">Date:</span>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Grouped Time Slots */}
        {isSlotsLoading ? (
          <div className="py-12 text-center text-xs sm:text-sm text-slate-500 animate-pulse">
            Checking real-time doctor availability...
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-navy-900">No Consultation Slots Available for {selectedDate}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Dr. {doctor.fullName?.replace('Dr. ', '')} has no open slots on this date. Please pick another date.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Morning Slots */}
            {morningSlots.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Morning Slots ({morningSlots.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {morningSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSlot(slot)}
                      className="p-3 bg-ice-100 hover:bg-primary-600 text-navy-900 hover:text-white border border-primary-200/60 rounded-2xl font-bold text-xs transition-all text-center flex flex-col items-center justify-center gap-1 shadow-2xs hover:shadow-xs group"
                    >
                      <Clock className="w-3.5 h-3.5 text-primary-600 group-hover:text-white" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Afternoon Slots */}
            {afternoonSlots.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                  <Sunset className="w-4 h-4 text-primary-600" />
                  <span>Afternoon Slots ({afternoonSlots.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {afternoonSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSlot(slot)}
                      className="p-3 bg-ice-100 hover:bg-primary-600 text-navy-900 hover:text-white border border-primary-200/60 rounded-2xl font-bold text-xs transition-all text-center flex flex-col items-center justify-center gap-1 shadow-2xs hover:shadow-xs group"
                    >
                      <Clock className="w-3.5 h-3.5 text-primary-600 group-hover:text-white" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Evening Slots */}
            {eveningSlots.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Evening Slots ({eveningSlots.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {eveningSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSlot(slot)}
                      className="p-3 bg-ice-100 hover:bg-primary-600 text-navy-900 hover:text-white border border-primary-200/60 rounded-2xl font-bold text-xs transition-all text-center flex flex-col items-center justify-center gap-1 shadow-2xs hover:shadow-xs group"
                    >
                      <Clock className="w-3.5 h-3.5 text-primary-600 group-hover:text-white" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Confirmation Dialog / Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-ice-100 text-primary-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy-900">Confirm Appointment</h3>
                  <span className="text-[11px] text-slate-500">CareSync Instant Slot Reservation</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-ice-100/70 p-4 rounded-2xl border border-primary-100 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Doctor:</span>
                <span className="font-bold text-navy-900">{doctor.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Specialization:</span>
                <span className="font-bold text-primary-600">{doctor.specialization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Date & Time:</span>
                <span className="font-bold text-navy-900">{selectedDate} ({selectedSlot.startTime} - {selectedSlot.endTime} IST)</span>
              </div>
              <div className="flex justify-between border-t border-primary-100 pt-2 text-sm">
                <span className="text-slate-600 font-semibold">Consultation Fee:</span>
                <span className="font-extrabold text-navy-900">₹{Number(doctor.consultationFee || 500).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleBookAppointmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Reason for Visit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest pain evaluation, follow-up, general health checkup..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Symptoms or Medical Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mention any existing conditions, allergies or previous medication..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBooking}
                  className="px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/25 disabled:opacity-50 transition-all"
                >
                  {isBooking ? 'Locking Slot...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Success Confirmation Modal */}
      {confirmedBooking && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-navy-900">Appointment Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1">Booking Ref #{confirmedBooking.id}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-navy-900">{confirmedBooking.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-navy-900">{confirmedBooking.appointmentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-bold text-navy-900">{confirmedBooking.startTime} - {confirmedBooking.endTime} IST</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Status:</span>
                <span className="badge-confirmed">{confirmedBooking.status}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              A confirmation email has been dispatched. You will also receive an automated reminder 24 hours prior to your consultation.
            </p>

            <div className="pt-2">
              <button
                onClick={() => {
                  setConfirmedBooking(null);
                  navigate('/patient/appointments');
                }}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-md shadow-primary-600/20 transition-all"
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
