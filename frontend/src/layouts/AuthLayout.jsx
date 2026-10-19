import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity, ShieldCheck, HeartPulse, Award } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-ice-100 flex flex-col justify-between">
      {/* Top micro-bar */}
      <header className="w-full bg-white border-b border-slate-200/80 py-4 px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-600/25 group-hover:bg-primary-700 transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-navy-900 tracking-tight leading-none">
                Care<span className="text-primary-600">Sync</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
                INDIA
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Doctor Appointment Network
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs font-bold text-slate-600 hover:text-primary-600 transition-colors hidden sm:block"
        >
          &larr; Back to CareSync Home
        </Link>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-6">
          {/* Left Decorative Healthcare Side (Doctorate Royal Blue & Navy theme) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-navy-900 via-slate-900 to-navy-950 text-white p-8 flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary-600/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-primary-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600/30 text-primary-200 text-xs font-semibold border border-primary-500/30">
                <HeartPulse className="w-3.5 h-3.5 text-primary-400" />
                <span>Modern Healthcare</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight leading-snug">
                On a Pursuit of Better Medicine & Patient Care.
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Seamlessly connect with top NMC-certified specialists, schedule hospital visits, and manage digital prescriptions with ease.
              </p>
            </div>

            <div className="relative z-10 my-6">
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                <img
                  src="/images/doctor-team.jpg"
                  alt="CareSync Healthcare Team"
                  className="w-full h-44 object-cover"
                />
              </div>
            </div>

            <div className="relative z-10 space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>NMC Certified Doctors & Hospitals</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary-400 shrink-0" />
                <span>DISHA Aligned & 256-Bit Encrypted</span>
              </div>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200/60 bg-white">
        &copy; {new Date().getFullYear()} CareSync India. Inspired by Doctorate healthcare design standards.
      </footer>
    </div>
  );
};

export default AuthLayout;
