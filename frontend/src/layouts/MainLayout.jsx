import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Activity } from 'lucide-react';

const MainLayout = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-ice-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isLandingPage && (
        <footer className="bg-navy-900 text-slate-300 border-t border-slate-800 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-white">CareSync Healthcare Platform</span>
            </div>
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} CareSync India. Professional Doctor & Medical Scheduling System.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;
