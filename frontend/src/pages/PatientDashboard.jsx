import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { appointmentService } from '../services/appointmentService';
import { prescriptionService } from '../services/prescriptionService';
import { Calendar, FileText, Search, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [appData, prescData] = await Promise.all([
        appointmentService.getPatientAppointments(),
        prescriptionService.getPatientPrescriptions(),
      ]);
      setAppointments(appData);
      setPrescriptions(prescData);
    } catch (err) {
      console.error('Failed to load patient dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingAppointments = appointments.filter((a) => a.status !== 'CANCELLED');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-sky-600/15">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Welcome back, {user?.fullName}! 👋
        </h1>
        <p className="text-sky-100 text-sm mt-1 max-w-xl">
          Manage your upcoming consultations, view prescriptions, or schedule a new appointment with our specialist care providers.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/patient/doctors"
            className="px-4 py-2.5 bg-white text-sky-700 font-bold text-sm rounded-xl shadow-md hover:bg-sky-50 transition-all flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Book New Appointment</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Consultations</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{upcomingAppointments.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Digital Prescriptions</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{prescriptions.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Visits</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
              {appointments.filter((a) => a.status === 'COMPLETED').length}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Upcoming Appointments Preview List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Upcoming Scheduled Visits</h2>
          <Link to="/patient/appointments" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading appointments...</div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-600 font-medium">No upcoming appointments scheduled</p>
            <Link
              to="/patient/doctors"
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-sky-600 px-4 py-2 rounded-xl hover:bg-sky-700"
            >
              <span>Find a Doctor</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingAppointments.slice(0, 3).map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{app.doctorName}</h4>
                  <p className="text-xs text-slate-500">{app.specialization} • {app.appointmentDate}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{app.startTime} - {app.endTime}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
