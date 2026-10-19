import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { appointmentService } from '../services/appointmentService';
import { prescriptionService } from '../services/prescriptionService';
import { Calendar, Users, FileText, Clock, ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    setIsLoading(true);
    try {
      const [appData, prescData] = await Promise.all([
        appointmentService.getDoctorAppointments(),
        prescriptionService.getDoctorPrescriptions(),
      ]);
      setAppointments(appData);
      setPrescriptions(prescData);
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter((a) => a.appointmentDate === todayStr);

  return (
    <div className="space-y-8">
      {/* Header Banner (Doctorate Deep Navy & Royal Blue) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-navy-900 via-slate-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-navy-950/20 border border-slate-800">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-primary-600/25 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-600/30 text-primary-200 text-xs font-semibold border border-primary-500/30">
            <Stethoscope className="w-3.5 h-3.5 text-primary-400" />
            <span>Practicing Physician Console</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, Dr. {user?.fullName?.replace('Dr. ', '')}! 🩺
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Manage your daily appointment queue, publish consultation availability slots, and issue digital prescriptions.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/doctor/availability"
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-full shadow-md shadow-primary-600/25 transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Manage Availability Slots</span>
            </Link>
            <Link
              to="/doctor/appointments"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-full border border-white/20 transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Patient Appointments</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Consultations</p>
            <h3 className="text-3xl font-extrabold text-navy-900 mt-1">{appointments.length}</h3>
            <span className="text-[11px] text-primary-600 font-medium">Recorded in CareSync</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-ice-100 text-primary-600 flex items-center justify-center border border-primary-200/60">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Queue</p>
            <h3 className="text-3xl font-extrabold text-navy-900 mt-1">{todaysAppointments.length}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Patients booked today</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Prescriptions Issued</p>
            <h3 className="text-3xl font-extrabold text-navy-900 mt-1">{prescriptions.length}</h3>
            <span className="text-[11px] text-sky-600 font-medium">Digital Rx recorded</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="section-eyebrow">Patient Queue</span>
            <h2 className="text-base font-extrabold text-navy-900 mt-0.5">Recent Patient Consultations</h2>
          </div>
          <Link to="/doctor/appointments" className="text-xs font-bold text-primary-600 hover:text-navy-900 flex items-center gap-1">
            <span>View Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs sm:text-sm animate-pulse">Loading appointment queue...</div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-navy-900 font-medium">No patient appointments booked yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.slice(0, 5).map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-navy-900 text-sm">{app.patientName}</h4>
                  <p className="text-xs text-slate-500">{app.appointmentDate} • {app.reason || 'General Consult'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{app.startTime} - {app.endTime} IST</span>
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

export default DoctorDashboard;
