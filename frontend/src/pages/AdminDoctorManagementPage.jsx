import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import Toast from '../components/Toast';
import { Stethoscope, Search, MapPin, DollarSign, Award, Clock, Mail, Phone, User, X } from 'lucide-react';

const AdminDoctorManagementPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllDoctors();
      setDoctors(data);
    } catch (err) {
      console.error('Failed to load doctors list:', err);
      setToast({ message: 'Failed to fetch doctor directory.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    return (
      doc.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Doctor Management Directory
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Governance and credentials audit for all registered medical practitioners.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, specialization, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading doctor records...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Doctors Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'No registered doctors match your search filters.' : 'No doctors have registered yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-teal-600/20">
                    {doc.fullName?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{doc.fullName}</h3>
                    <p className="text-xs font-bold text-teal-700">{doc.specialization}</p>
                    <p className="text-xs text-slate-500">{doc.qualifications}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.location || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Fee: <strong>${doc.consultationFee ?? 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Experience: <strong>{doc.experienceYears ?? 0} Years</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Doctor ID #{doc.id}</span>
                <button
                  onClick={() => setSelectedDoctor(doc)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Detail Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Doctor Profile Audit</h3>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl">
                  {selectedDoctor.fullName?.charAt(0) || 'D'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedDoctor.fullName}</h4>
                  <p className="text-xs font-bold text-teal-700">{selectedDoctor.specialization}</p>
                  <p className="text-xs text-slate-500">{selectedDoctor.qualifications}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-xs font-bold text-slate-500 uppercase">Consultation Fee</span>
                  <p className="text-sm font-extrabold text-slate-900">${selectedDoctor.consultationFee ?? 0}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-xs font-bold text-slate-500 uppercase">Experience</span>
                  <p className="text-sm font-extrabold text-slate-900">{selectedDoctor.experienceYears ?? 0} Years</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span><strong>Email:</strong> {selectedDoctor.email}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span><strong>Phone:</strong> {selectedDoctor.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span><strong>Practice Location:</strong> {selectedDoctor.location || 'Not provided'}</span>
                </div>
              </div>

              {selectedDoctor.bio && (
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Doctor Bio</span>
                  <p className="text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {selectedDoctor.bio}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoctorManagementPage;
