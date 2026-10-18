import React, { useState, useEffect } from 'react';
import { doctorService } from '../services/doctorService';
import Toast from '../components/Toast';
import { User, Stethoscope, Award, MapPin, DollarSign, Clock, FileText, CheckCircle } from 'lucide-react';

const DoctorProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [specialization, setSpecialization] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [consultationFee, setConsultationFee] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getDoctorProfile();
      setProfile(data);
      setSpecialization(data.specialization || '');
      setQualifications(data.qualifications || '');
      setExperienceYears(data.experienceYears ?? '');
      setBio(data.bio || '');
      setLocation(data.location || '');
      setConsultationFee(data.consultationFee ?? '');
    } catch (err) {
      console.error('Failed to load doctor profile:', err);
      setToast({ message: 'Failed to fetch doctor profile.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!specialization.trim()) {
      setToast({ message: 'Specialization is required.', type: 'error' });
      return;
    }
    if (!qualifications.trim()) {
      setToast({ message: 'Qualifications are required.', type: 'error' });
      return;
    }
    if (consultationFee === '' || Number(consultationFee) < 0) {
      setToast({ message: 'Valid consultation fee is required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        specialization: specialization.trim(),
        qualifications: qualifications.trim(),
        experienceYears: experienceYears === '' ? 0 : Number(experienceYears),
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        consultationFee: Number(consultationFee),
      };

      const updated = await doctorService.updateDoctorProfile(payload);
      setProfile(updated);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      console.error('Update doctor profile error:', err);
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500 text-sm">Loading doctor profile...</div>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Doctor Profile Settings
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Keep your professional specialization, credentials, and consultation details up to date.
        </p>
      </div>

      {/* Account Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-teal-600/20">
            {profile?.fullName?.charAt(0) || 'D'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile?.fullName}</h2>
            <p className="text-xs text-slate-500 font-medium">{profile?.email} • {profile?.phoneNumber || 'No phone'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold rounded-full">
              Doctor Account (ID #{profile?.id})
            </span>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Professional Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Specialization */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Specialization *
            </label>
            <div className="relative">
              <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Cardiology, Neurology"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 font-medium"
              />
            </div>
          </div>

          {/* Qualifications */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Qualifications *
            </label>
            <div className="relative">
              <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. MBBS, MD (Cardiology)"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 font-medium"
              />
            </div>
          </div>

          {/* Experience Years */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Years of Experience
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                placeholder="e.g. 10"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 font-medium"
              />
            </div>
          </div>

          {/* Consultation Fee */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Consultation Fee ($) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 150.00"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Practice / Clinic Location
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. San Francisco General Hospital, Suite 400"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 font-medium"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Doctor Bio & Overview
          </label>
          <textarea
            rows={4}
            placeholder="Share details about your medical background, treatment philosophy, or specialized research..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 font-medium"
          />
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorProfilePage;
