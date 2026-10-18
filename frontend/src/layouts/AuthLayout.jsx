import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
            <Activity className="w-7 h-7" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">
            Care<span className="text-sky-600">Sync</span>
          </span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
