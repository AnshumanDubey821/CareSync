import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Lock, Phone, Stethoscope, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState('PATIENT');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'O+',
    specialization: 'General Medicine',
    qualifications: 'MBBS, MD',
    experienceYears: 5,
    consultationFee: 600.00,
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = { ...formData, role };
      const response = await register(payload);
      
      if (role === 'PATIENT') {
        navigate('/patient/dashboard');
      } else {
        navigate('/doctor/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const message = err.response?.data?.message || 'Failed to complete registration. Please check your details.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <span className="section-eyebrow">Get Started</span>
        <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">Create CareSync Account</h2>
        <p className="text-xs text-slate-500">Join India's trusted doctor appointment & healthcare platform</p>
      </div>

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-ice-100 rounded-full border border-slate-200">
        <button
          type="button"
          onClick={() => setRole('PATIENT')}
          className={`py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            role === 'PATIENT'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Patient</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('DOCTOR')}
          className={`py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            role === 'DOCTOR'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Doctor</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder={role === 'PATIENT' ? 'Rahul Sharma' : 'Dr. Rajesh Sharma'}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Mobile Number (India)</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 font-medium"
          />
        </div>

        {/* Doctor Specific Fields */}
        {role === 'DOCTOR' && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  required
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="Cardiology / General Medicine"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary-600/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Qualifications</label>
                <input
                  type="text"
                  name="qualifications"
                  required
                  value={formData.qualifications}
                  onChange={handleChange}
                  placeholder="MBBS, MD, DNB"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary-600/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Experience (Yrs)</label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  placeholder="10"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary-600/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Consultation Fee (₹)</label>
                <input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  placeholder="600"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary-600/20"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full shadow-md shadow-primary-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-4"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
