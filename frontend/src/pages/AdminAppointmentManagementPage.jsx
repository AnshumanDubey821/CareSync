import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import Toast from '../components/Toast';
import { Calendar, Clock, User, Stethoscope, Search, CheckCircle2, XCircle, AlertCircle, X, Edit3 } from 'lucide-react';

const AdminAppointmentManagementPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setToast({ message: 'Failed to fetch platform appointments.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await adminService.updateAppointmentStatus(id, newStatus);
      setToast({ message: `Appointment status updated to ${newStatus}.`, type: 'success' });
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      console.error('Failed to update appointment status:', err);
      const msg = err.response?.data?.message || 'Failed to update appointment status.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    return app.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'SCHEDULED':
      case 'CONFIRMED':
      case 'BOOKED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5" /> {status}
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Appointment Audit
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Global monitoring and status administration across all healthcare consultations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, doctor, specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Visits' },
            { id: 'SCHEDULED', label: 'Scheduled' },
            { id: 'CONFIRMED', label: 'Confirmed' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List Table / Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading system appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Appointments Match Filter</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Try adjusting search terms or changing your status selection filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Visit #{app.id}
                  </span>
                  {getStatusBadge(app.status)}
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <User className="w-4 h-4 text-sky-600" />
                    <span>{app.patientName}</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>Dr. {app.doctorName}</span>
                    <span className="text-xs text-slate-500 font-normal">({app.specialization})</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span>📅 {app.appointmentDate}</span>
                  <span>⏰ {app.startTime} - {app.endTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  onClick={() => setSelectedAppointment(app)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Inspect / Update</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Audit & Status Edit Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Manage Appointment #{selectedAppointment.id}</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Patient</span>
                  <span className="text-sm font-bold text-slate-900">{selectedAppointment.patientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Doctor</span>
                  <span className="text-sm font-bold text-slate-900">Dr. {selectedAppointment.doctorName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Specialization</span>
                  <span className="text-xs font-bold text-teal-700">{selectedAppointment.specialization}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Schedule</span>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedAppointment.appointmentDate} ({selectedAppointment.startTime} - {selectedAppointment.endTime})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Reason</span>
                <p className="text-xs font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedAppointment.reason || 'No reason provided.'}
                </p>
              </div>

              {/* Status Update Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Override Appointment Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={isUpdatingStatus || selectedAppointment.status === 'COMPLETED'}
                    onClick={() => handleStatusChange(selectedAppointment.id, 'COMPLETED')}
                    className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Set Completed</span>
                  </button>

                  <button
                    disabled={isUpdatingStatus || selectedAppointment.status === 'CANCELLED'}
                    onClick={() => handleStatusChange(selectedAppointment.id, 'CANCELLED')}
                    className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Set Cancelled</span>
                  </button>

                  <button
                    disabled={isUpdatingStatus || selectedAppointment.status === 'CONFIRMED'}
                    onClick={() => handleStatusChange(selectedAppointment.id, 'CONFIRMED')}
                    className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>Set Confirmed</span>
                  </button>

                  <button
                    disabled={isUpdatingStatus || selectedAppointment.status === 'SCHEDULED'}
                    onClick={() => handleStatusChange(selectedAppointment.id, 'SCHEDULED')}
                    className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>Set Scheduled</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointmentManagementPage;
