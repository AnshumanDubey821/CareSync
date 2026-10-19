import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Phone, ShieldCheck, Activity, MapPin, Heart, AlertCircle, Fingerprint } from 'lucide-react';

const PatientProfilePage = () => {
  const { user, role } = useAuth();

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Patient Profile & Health Details
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Registered patient credentials, contact information, and digital health security.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-black text-2xl border border-teal-200 shadow-inner">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">{user?.fullName}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{role} ACCOUNT</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Fingerprint className="w-4 h-4 text-teal-600" />
              <span>ABHA Health ID</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">91-4820-9921-3829</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <Mail className="w-5 h-5 text-teal-600 shrink-0" />
            <div className="truncate">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</span>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate block">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <Phone className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile Number (India)</span>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm">{user?.phoneNumber || '+91 98765 43210'}</span>
            </div>
          </div>
        </div>

        {/* Medical Security & Reminder Preference */}
        <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 space-y-2 text-xs text-teal-900">
          <div className="flex items-center gap-2 font-bold text-teal-950">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Automated 24h Consultation Reminders</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Your CareSync account automatically dispatches email and SMS reminders 24 hours prior to scheduled doctor appointments across partner hospital clinics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientProfilePage;
