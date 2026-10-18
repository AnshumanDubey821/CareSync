import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import Toast from '../components/Toast';
import {
  ShieldCheck,
  Users,
  Stethoscope,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, appData] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getAllAppointments(),
      ]);
      setStats(statsData);
      setRecentAppointments(appData.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch admin statistics:', err);
      setToast({ message: 'Failed to load system statistics.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-slate-900/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-sky-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Admin Governance & Analytics
            </h1>
          </div>
          <p className="text-slate-300 text-sm max-w-xl">
            Real-time platform metrics, provider directory, patient management, and appointment monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>System Operational</span>
          </div>
        </div>
      </div>

      {/* Primary System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Total Doctors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Doctors</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              {isLoading ? '...' : stats?.totalDoctors ?? 0}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Verified Practitioners</p>
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Patients</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              {isLoading ? '...' : stats?.totalPatients ?? 0}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Registered Users</p>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Visits</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              {isLoading ? '...' : stats?.totalAppointments ?? 0}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">All Time Bookings</p>
          </div>
        </div>

        {/* Completed Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-emerald-700">
              {isLoading ? '...' : stats?.completedAppointments ?? 0}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">Fulfilled Consults</p>
          </div>
        </div>

        {/* Cancelled Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cancelled</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-rose-700">
              {isLoading ? '...' : stats?.cancelledAppointments ?? 0}
            </h3>
            <p className="text-xs text-rose-600 font-semibold mt-0.5">Cancelled / Voided</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments Queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Platform Appointments</h2>
              <p className="text-xs text-slate-500">Real-time system booking stream</p>
            </div>
            <Link
              to="/admin/appointments"
              className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading activity...</div>
          ) : recentAppointments.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-sm text-slate-500">No appointments recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAppointments.map((app) => (
                <div key={app.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{app.patientName}</h4>
                      <span className="text-xs text-slate-400">with</span>
                      <span className="font-semibold text-slate-700 text-xs">{app.doctorName}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {app.appointmentDate} • {app.startTime} - {app.endTime} ({app.specialization})
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                      app.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : app.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Administration Shortcuts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Governance Tools
          </h2>

          <div className="space-y-3">
            <Link
              to="/admin/doctors"
              className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700">Doctor Directory</h4>
                  <p className="text-xs text-slate-500">View and inspect registered doctors</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition-colors" />
            </Link>

            <Link
              to="/admin/patients"
              className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-700">Patient Management</h4>
                  <p className="text-xs text-slate-500">Inspect registered patient profiles</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-700 transition-colors" />
            </Link>

            <Link
              to="/admin/appointments"
              className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700">System Appointments</h4>
                  <p className="text-xs text-slate-500">Global audit & status modification</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
