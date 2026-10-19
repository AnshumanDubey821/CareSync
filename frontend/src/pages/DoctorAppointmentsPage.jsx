import React, { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import { Calendar, Clock, User, FileText, XCircle, CheckCircle, Search, Filter, AlertCircle, X, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorAppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, TODAY, UPCOMING, BOOKED, CANCELLED
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [toast, setToast] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await appointmentService.getDoctorAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load doctor appointments:', err);
      setToast({ message: 'Failed to fetch appointments schedule.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setIsCancelling(true);
    try {
      await appointmentService.cancelAppointment(id);
      setToast({ message: 'Appointment cancelled successfully.', type: 'success' });
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      console.error('Cancel appointment error:', err);
      const msg = err.response?.data?.message || 'Failed to cancel appointment.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsCancelling(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'TODAY') {
      return app.appointmentDate === todayStr;
    }
    if (filterStatus === 'UPCOMING') {
      return app.appointmentDate >= todayStr && app.status === 'BOOKED';
    }
    if (filterStatus === 'BOOKED') {
      return app.status === 'BOOKED';
    }
    if (filterStatus === 'CANCELLED') {
      return app.status === 'CANCELLED';
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BOOKED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Booked
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Consultation Calendar
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            View upcoming patient visits, review clinical notes, and issue digital prescriptions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'TODAY', label: 'Today' },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'BOOKED', label: 'Confirmed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading appointment records...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Appointments Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {searchTerm || filterStatus !== 'ALL'
              ? 'Try changing your search terms or status filters.'
              : 'Patients will appear here once they book appointments.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg shrink-0">
                  {app.patientName?.charAt(0) || 'P'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-slate-900">{app.patientName}</h3>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      {app.appointmentDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {app.startTime} - {app.endTime}
                    </span>
                  </div>

                  {app.reason && (
                    <p className="text-xs text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 mt-2 inline-block">
                      <strong className="text-slate-700">Reason:</strong> {app.reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                <button
                  onClick={() => setSelectedAppointment(app)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Details
                </button>
                <button
                  onClick={() => navigate('/doctor/prescriptions', { state: { appointment: app } })}
                  className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200 transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Prescribe</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Appointment Details</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Patient</p>
                  <h4 className="text-base font-bold text-slate-900">{selectedAppointment.patientName}</h4>
                  <p className="text-xs text-slate-500">ID #{selectedAppointment.patientId}</p>
                </div>
                <div>{getStatusBadge(selectedAppointment.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500">Date</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedAppointment.appointmentDate}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500">Time Slot</p>
                  <p className="text-sm font-extrabold text-teal-700 mt-0.5">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reason for Visit</p>
                <p className="text-sm bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 font-medium">
                  {selectedAppointment.reason || 'No reason provided.'}
                </p>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient Notes</p>
                  <p className="text-sm bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {selectedAppointment.status === 'BOOKED' ? (
                <button
                  onClick={() => handleCancelAppointment(selectedAppointment.id)}
                  disabled={isCancelling}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const app = selectedAppointment;
                    setSelectedAppointment(null);
                    navigate('/doctor/prescriptions', { state: { appointment: app } });
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Issue Prescription</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentsPage;
