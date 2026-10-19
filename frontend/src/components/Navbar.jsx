import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Activity,
  User,
  LogOut,
  Calendar,
  ShieldCheck,
  Stethoscope,
  ChevronDown,
  PhoneCall,
  Clock,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/#about-section' },
    { label: 'Services', to: '/#services-section' },
    { label: 'Find Doctors', to: '/patient/doctors' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-xs border-b border-slate-100">
      {/* Top Micro-bar inspired by reference */}
      <div className="hidden sm:block bg-white border-b border-slate-100/80 py-2 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a
              href="tel:1800227379"
              className="flex items-center gap-2 hover:text-primary-600 transition-colors font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-primary-600" />
              <span>Call Us: <strong className="text-slate-800">1800-CARE-SYNC (+91)</strong></span>
            </a>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Mon - Sun: 8:00 AM - 10:00 PM (IST)</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary-700 font-bold border border-blue-100">
              National Health Network (India)
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo Brand: Doctorate-style healthcare emblem */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-600/30 group-hover:scale-105 transition-transform">
              <div className="relative">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl text-navy-900 tracking-tight leading-none">
                Care<span className="text-primary-600">Sync</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
                Healthcare & Doctor Scheduler
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`transition-colors hover:text-primary-600 ${
                  location.pathname === item.to ? 'text-primary-600 font-bold' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated && (
              <Link
                to={getDashboardLink()}
                className="transition-colors hover:text-primary-600 text-primary-700 font-bold"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Action / Profile Button */}
          <div className="hidden sm:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 px-3.5 py-2 rounded-full hover:bg-slate-50 transition-colors border border-slate-200"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-navy-900 leading-tight">{user?.fullName}</p>
                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">{role}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Signed In</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-ice-100 hover:text-primary-600"
                    >
                      <Calendar className="w-4 h-4 text-primary-600" />
                      <span>My Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100"
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
                  to="/login"
                  className="px-4 py-2.5 text-sm font-bold text-slate-700 hover:text-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/patient/doctors"
                  className="px-6 py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-primary-600/30 transition-all hover:shadow-blue-glow"
                >
                  Book Appointment
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
            <div className="space-y-1">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-primary-600 hover:bg-blue-50"
                >
                  Dashboard
                </Link>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/patient/doctors"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3 rounded-full bg-primary-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-primary-600/30"
                  >
                    Book Appointment
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
