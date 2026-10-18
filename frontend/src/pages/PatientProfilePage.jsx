import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Phone, ShieldCheck, Activity } from 'lucide-react';

const PatientProfilePage = () => {
  const { user, role } = useAuth();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Account Profile
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Personal account settings and patient identity details.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-sky-600/20">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{user?.fullName}</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{role} ACCOUNT</span>
            </span>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <Mail className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <Phone className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</span>
              <span className="font-semibold text-slate-800">{user?.phoneNumber || 'Not provided'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfilePage;
