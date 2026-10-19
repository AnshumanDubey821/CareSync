import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/25 group-hover:bg-teal-700 transition-colors">
            <Activity className="w-7 h-7" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl text-slate-900 tracking-tight leading-none">
                Care<span className="text-teal-600">Sync</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                INDIA
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Healthcare Network
            </span>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 shadow-card sm:rounded-3xl sm:px-10 border border-slate-200/80">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
