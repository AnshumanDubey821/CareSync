import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Building2,
  Stethoscope,
  Plus
} from 'lucide-react';

const PatientAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [cancellingAppId, setCancellingAppId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await appointmentService.getPatientAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch patient appointments:', err);
      setToast({ message: 'Failed to load appointments.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    try {
      await appointmentService.cancelAppointment(id);
      setToast({ message: 'Appointment cancelled successfully.', type: 'success' });
      setCancellingAppId(null);
      fetchAppointments();
    } catch (err) {
      console.error('Cancel appointment error:', err);
      const msg = err.response?.data?.message || 'Failed to cancel appointment.';
      setToast({ message: msg, type: 'error' });
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    if (filter === 'UPCOMING') return app.status === 'SCHEDULED' || app.status === 'CONFIRMED';
    if (filter === 'COMPLETED') return app.status === 'COMPLETED';
    if (filter === 'CANCELLED') return app.status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="badge-confirmed">{status}</span>;
      case 'COMPLETED':
        return <span className="badge-completed">{status}</span>;
      case 'CANCELLED':
        return <span className="badge-cancelled">{status}</span>;
      default:
        return <span className="badge-scheduled">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Doctor Appointments
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track and manage your scheduled hospital visits and digital consultations in India.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
            {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === tab
                    ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Link
            to="/patient/doctors"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Appointments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any appointments matching the "{filter}" filter.
          </p>
          <div className="pt-2">
            <Link
              to="/patient/doctors"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 shadow-xs"
            >
              <span>Explore Specialist Doctors</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card hover:shadow-card-hover hover:border-teal-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  {getStatusBadge(app.status)}
                  <span className="text-xs text-slate-400 font-semibold">Ref #{app.id}</span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{app.doctorName}</h3>
                  <p className="text-xs font-bold text-teal-700">{app.specialization}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    {app.appointmentDate}
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Clock className="w-4 h-4 text-teal-600" />
                    {app.startTime} - {app.endTime} IST
                  </span>
                  {app.doctorLocation && (
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {app.doctorLocation}
                    </span>
                  )}
                </div>

                {app.reason && (
                  <p className="text-xs text-slate-600 pt-1">
                    <strong className="text-slate-700">Reason for visit:</strong> {app.reason}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {(app.status === 'SCHEDULED' || app.status === 'CONFIRMED') && (
                <div className="shrink-0 flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => setCancellingAppId(app.id)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Slot</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      {cancellingAppId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Appointment?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to cancel booking Ref #{cancellingAppId}? The time slot will immediately be released for other patients.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCancellingAppId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelAppointment(cancellingAppId)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointmentsPage;
