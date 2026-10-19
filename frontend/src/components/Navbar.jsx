import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Activity, User, LogOut, Calendar, ShieldCheck, Stethoscope, ChevronDown, MapPin, PhoneCall, Search } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (role === 'PATIENT') return '/patient/dashboard';
    if (role === 'DOCTOR') return '/doctor/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top micro-bar for Indian Healthcare Helpline */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-teal-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
            India's Leading Healthcare Network
          </span>
          <span className="hidden md:inline-block text-slate-400">•</span>
          <span className="hidden md:flex items-center gap-1 text-slate-300">
            <MapPin className="w-3 h-3 text-teal-400" />
            Top Clinics in Bengaluru, Mumbai, Delhi NCR, Hyderabad & Pune
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a href="tel:1800227379" className="flex items-center gap-1 hover:text-white transition-colors">
            <PhoneCall className="w-3 h-3 text-emerald-400" />
            <span>24x7 Helpline: <strong className="text-white">1800-CARE-SYNC</strong></span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/25 group-hover:bg-teal-700 transition-all">
                <Activity className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl text-slate-900 tracking-tight leading-none">
                    Care<span className="text-teal-600">Sync</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    INDIA
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
                  Doctors & Appointment Scheduler
                </span>
              </div>
            </Link>

            {/* Quick search link */}
            <div className="hidden lg:flex items-center">
              <Link
                to="/patient/doctors"
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-full transition-colors border border-slate-200/60"
              >
                <Search className="w-3.5 h-3.5 text-teal-600" />
                <span>Search 50+ Top Indian Specialists</span>
              </Link>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shadow-inner">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-sm font-semibold text-slate-800 leading-tight">
                      {user?.fullName}
                    </span>
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                      {role}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to={getDashboardLink()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-teal-50/50 hover:text-teal-700 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-teal-600" />
                      <span>My Dashboard</span>
                    </Link>

                    {role === 'PATIENT' && (
                      <Link
                        to="/patient/doctors"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50/50 hover:text-teal-700 transition-colors"
                      >
                        <Stethoscope className="w-4 h-4 text-teal-600" />
                        <span>Find Doctors</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/patient/doctors"
                  className="hidden sm:inline-flex items-center text-sm font-medium text-slate-600 hover:text-teal-600 px-3 py-2 transition-colors"
                >
                  Find Doctors
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4.5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all hover:shadow-teal-600/30"
                >
                  Book Appointment
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
