import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Activity } from 'lucide-react';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <span className="font-bold text-slate-800">CareSync Healthcare Platform</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} CareSync Inc. Production-Grade Medical Scheduler. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
