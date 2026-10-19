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
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></div>
            <span className="text-xs font-bold text-teal-950 uppercase tracking-wider">
              {role} Portal
            </span>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white text-teal-700 border border-teal-100 shadow-2xs">
            Active
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
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 shadow-xs border border-teal-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-teal-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
          CareSync Support
        </p>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          Toll-free 1800-CARE-SYNC (24/7) for emergency booking assistance.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
