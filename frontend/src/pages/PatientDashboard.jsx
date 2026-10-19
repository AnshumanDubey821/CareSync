import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { appointmentService } from '../services/appointmentService';
import { prescriptionService } from '../services/prescriptionService';
import {
  Calendar,
  FileText,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  Building2,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  PhoneCall
} from 'lucide-react';

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

  const upcomingAppointments = appointments.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');
  const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');

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
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-900/10 border border-teal-600/30">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/60 text-teal-200 text-xs font-semibold border border-teal-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>CareSync India Patient Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Namaste, {user?.fullName || 'Patient'}! 🙏
          </h1>

          <p className="text-teal-100 text-sm leading-relaxed">
            Manage your upcoming doctor consultations, digital prescriptions, and automated reminders across India's top hospitals.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/patient/doctors"
              className="px-5 py-2.5 bg-white text-teal-900 font-bold text-xs rounded-xl shadow-md hover:bg-teal-50 transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-teal-700" />
              <span>Book Doctor Consultation</span>
            </Link>
            <Link
              to="/patient/appointments"
              className="px-5 py-2.5 bg-teal-900/80 hover:bg-teal-900 text-teal-100 font-bold text-xs rounded-xl border border-teal-500/40 transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>My Appointments</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Visits</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{upcomingAppointments.length}</h3>
            <span className="text-[11px] text-teal-600 font-medium">Scheduled & confirmed</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Digital Prescriptions</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{prescriptions.length}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Available to download</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Visits</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {completedAppointments.length}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Past consultations</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Support</p>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">1800-CARE-SYNC</h3>
            <span className="text-[11px] text-teal-600 font-medium">24x7 India Toll-Free</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
            <PhoneCall className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Consultations & Recent Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upcoming Appointments (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-extrabold text-slate-900">Upcoming Consultations</h2>
            </div>
            <Link
              to="/patient/appointments"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View All ({appointments.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-slate-500 text-sm animate-pulse">
              Loading your appointments...
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-700 font-bold">No upcoming appointments scheduled</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Find verified specialist doctors in your city and book your appointment in seconds.
              </p>
              <Link
                to="/patient/doctors"
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-teal-600 px-4 py-2 rounded-xl hover:bg-teal-700 shadow-xs"
              >
                <span>Find Doctors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">{app.doctorName}</h4>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-xs font-semibold text-teal-700">{app.specialization}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{app.doctorLocation || 'Apollo Hospitals, Indiranagar'}</span>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 text-xs text-slate-600 shrink-0">
                    <span className="font-bold text-slate-900 text-xs">{app.appointmentDate}</span>
                    <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {app.startTime} - {app.endTime} IST
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Digital Prescriptions (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-extrabold text-slate-900">Recent Prescriptions (Rx)</h2>
            </div>
            <Link
              to="/patient/prescriptions"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-slate-500 text-sm animate-pulse">
              Loading prescriptions...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-700 font-semibold">No prescriptions issued yet</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                After your doctor completes your consultation, digital prescriptions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptions.slice(0, 3).map((presc) => (
                <div
                  key={presc.id}
                  className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 hover:border-emerald-300 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        Prescription #{presc.id}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{presc.doctorName}</h4>
                      <p className="text-xs text-slate-500">{presc.specialization || 'Consultant'}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {presc.createdAt ? presc.createdAt.split('T')[0] : 'Recent'}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-emerald-100/60 flex items-center justify-between">
                    <p className="text-xs text-slate-700 font-medium truncate max-w-[200px]">
                      <strong>Rx:</strong> {presc.diagnosis || 'Clinical Consultation'}
                    </p>
                    <Link
                      to="/patient/prescriptions"
                      className="text-xs font-bold text-teal-700 hover:text-teal-800"
                    >
                      View Full Rx →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
