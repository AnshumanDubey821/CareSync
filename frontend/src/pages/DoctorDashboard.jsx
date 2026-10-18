import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { appointmentService } from '../services/appointmentService';
import { prescriptionService } from '../services/prescriptionService';
import { Calendar, Users, FileText, Clock, ArrowRight } from 'lucide-react';

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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-teal-600/15">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Welcome, {user?.fullName}! 🩺
        </h1>
        <p className="text-teal-100 text-sm mt-1 max-w-xl">
          Manage your consultation calendar, publish availability slots, and issue digital prescriptions.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/doctor/availability"
            className="px-4 py-2.5 bg-white text-teal-800 font-bold text-sm rounded-xl shadow-md hover:bg-teal-50 transition-all flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>Manage Availability</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Scheduled Visits</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{appointments.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Queue</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{todaysAppointments.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Prescriptions Issued</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{prescriptions.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Patient Appointments</h2>
          <Link to="/doctor/appointments" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1">
            <span>View Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading appointment queue...</div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-600 font-medium">No patient appointments booked yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.slice(0, 4).map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{app.patientName}</h4>
                  <p className="text-xs text-slate-500">{app.appointmentDate} • {app.reason || 'General Consult'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
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

export default DoctorDashboard;
