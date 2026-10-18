import React, { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import { Calendar, Clock, MapPin, AlertCircle, XCircle, CheckCircle2, RefreshCw } from 'lucide-react';

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

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            View your consultation history and upcoming appointments.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl self-start md:self-auto text-xs font-bold">
          {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === tab ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Appointments Found</h3>
          <p className="text-sm text-slate-500">No appointments matching the selected filter status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      app.status === 'SCHEDULED' || app.status === 'CONFIRMED'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : app.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {app.status}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Ref #{app.id}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{app.doctorName}</h3>
                <p className="text-xs font-semibold text-sky-600">{app.specialization}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {app.appointmentDate}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {app.startTime} - {app.endTime}
                  </span>
                </div>

                {app.reason && (
                  <p className="text-xs text-slate-600 pt-1">
                    <strong>Reason:</strong> {app.reason}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {(app.status === 'SCHEDULED' || app.status === 'CONFIRMED') && (
                <div className="shrink-0">
                  <button
                    onClick={() => setCancellingAppId(app.id)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Appointment</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      {cancellingAppId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Appointment?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel appointment Ref #{cancellingAppId}? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCancellingAppId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                No, Keep It
              </button>
              <button
                onClick={() => handleCancelAppointment(cancellingAppId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Yes, Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointmentsPage;
