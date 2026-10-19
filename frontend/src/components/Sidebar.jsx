import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Search,
  Calendar,
  FileText,
  Clock,
  User,
  Settings,
  Users,
  Stethoscope,
  ShieldAlert
} from 'lucide-react';

const Sidebar = () => {
  const { role } = useAuth();

  const patientLinks = [
    { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patient/doctors', label: 'Find Doctors', icon: Search },
    { to: '/patient/appointments', label: 'My Appointments', icon: Calendar },
    { to: '/patient/prescriptions', label: 'My Prescriptions', icon: FileText },
    { to: '/patient/profile', label: 'Profile & Settings', icon: User },
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/availability', label: 'Availability Schedule', icon: Clock },
    { to: '/doctor/appointments', label: 'Appointment Calendar', icon: Calendar },
    { to: '/doctor/prescriptions', label: 'Issued Prescriptions', icon: FileText },
    { to: '/doctor/profile', label: 'Doctor Profile', icon: Stethoscope },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/doctors', label: 'Doctor Management', icon: Stethoscope },
    { to: '/admin/patients', label: 'Patient Records', icon: Users },
    { to: '/admin/appointments', label: 'All Appointments', icon: Calendar },
  ];

  const links = role === 'PATIENT' ? patientLinks : role === 'DOCTOR' ? doctorLinks : adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Role Badge Indicator */}
        <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-ice-100 border border-blue-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse"></div>
            <span className="text-xs font-extrabold text-navy-900 uppercase tracking-wider">
              {role} Portal
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-primary-700 border border-blue-200 shadow-2xs">
            Verified
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-2xs border border-blue-200/90 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5 text-primary-600" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-ice-100 border border-blue-100/80 rounded-2xl text-xs text-navy-900 space-y-1.5">
        <p className="font-bold flex items-center gap-1.5 text-navy-900">
          <span className="w-2 h-2 rounded-full bg-primary-600"></span>
          24/7 Helpline Support
        </p>
        <p className="text-slate-500 leading-relaxed text-[11px]">
          Toll-free <strong>1800-CARE-SYNC</strong> for emergency booking assistance.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
