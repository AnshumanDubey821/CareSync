import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorService } from '../services/doctorService';
import { Activity, Search, Calendar, ShieldCheck, Stethoscope, Clock, ArrowRight, UserCheck } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFeaturedDoctors();
  }, []);

  const fetchFeaturedDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.searchDoctors();
      setDoctors(data.slice(0, 4));
    } catch (err) {
      console.error('Failed to load featured doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/patient/doctors?name=${encodeURIComponent(searchTerm)}&specialization=${encodeURIComponent(specialization)}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner Section */}
      <section className="bg-gradient-to-b from-sky-50/80 to-slate-50 pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Smart Healthcare Scheduling</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Seamless Doctor Appointments & <span className="text-sky-600">Care Synchronization</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
              Book real-time doctor consultation slots, manage digital prescriptions, and receive automated 24-hour appointment reminders safely.
            </p>

            {/* Quick Doctor Search Box */}
            <form onSubmit={handleSearch} className="bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Doctor name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-slate-900 focus:outline-none placeholder-slate-400"
                />
              </div>
              <div className="sm:w-48 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-slate-700 focus:outline-none"
                >
                  <option value="">All Specialties</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="General Practice">General Practice</option>
                  <option value="Dermatology">Dermatology</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Hero Feature Visual */}
          <div className="relative">
            <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-sky-900/10 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Dr. Sarah Jenkins</h3>
                    <p className="text-xs text-slate-500">Cardiology Specialist • 12 Yrs Exp</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                  Available Today
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-slate-400 font-medium">Slot</span>
                  <span className="block font-bold text-slate-800">09:30 AM</span>
                </div>
                <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-sky-700">
                  <span className="block font-medium">Fee</span>
                  <span className="block font-bold">$150.00</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-slate-400 font-medium">Type</span>
                  <span className="block font-bold text-slate-800">In-Person</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Built for Patients & Care Providers</h2>
          <p className="text-slate-600 mt-2">Everything you need for a modern healthcare scheduling experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Real-Time Slot Lock</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Guaranteed double-booking prevention backed by DB-level pessimistic write locking and status checks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">24h Automated Reminders</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Never miss a appointment with automated email reminders scheduled 24 hours in advance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Digital Prescriptions</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              IDOR-protected digital prescription records securely accessible only by authorized patients and doctors.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
