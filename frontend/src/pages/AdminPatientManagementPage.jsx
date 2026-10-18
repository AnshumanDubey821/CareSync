import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import Toast from '../components/Toast';
import { Users, Search, Mail, Phone, Calendar, Heart, Shield, FileText, X } from 'lucide-react';

const AdminPatientManagementPage = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patient records:', err);
      setToast({ message: 'Failed to fetch patient directory.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    return (
      p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Management Directory
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Governance and record inspection for all registered system patients.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, email, blood group..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-600/20"
          />
        </div>
      </div>

      {/* Patient Cards Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading patient directory...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Patient Records Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'No registered patients match your search criteria.' : 'No patient accounts exist in the system.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-sky-600/20">
                    {patient.fullName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{patient.fullName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{patient.email}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold rounded-full">
                      Blood Group: {patient.bloodGroup || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{patient.phoneNumber || 'No phone number'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>DOB: <strong>{patient.dateOfBirth || 'Not provided'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Patient ID #{patient.id}</span>
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  View Record
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Patient Profile Audit</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl">
                  {selectedPatient.fullName?.charAt(0) || 'P'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedPatient.fullName}</h4>
                  <p className="text-xs text-slate-500">{selectedPatient.email}</p>
                  <p className="text-xs text-slate-500">{selectedPatient.phoneNumber || 'No phone'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-500 block">Gender</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">{selectedPatient.gender || 'N/A'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-500 block">Blood Group</span>
                  <span className="text-xs font-bold text-sky-700 mt-0.5 block">{selectedPatient.bloodGroup || 'N/A'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-500 block">DOB</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">{selectedPatient.dateOfBirth || 'N/A'}</span>
                </div>
              </div>

              {selectedPatient.emergencyContact && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs font-semibold text-rose-900">
                  <strong>Emergency Contact:</strong> {selectedPatient.emergencyContact}
                </div>
              )}

              {selectedPatient.medicalHistory && (
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Medical History</span>
                  <p className="text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-line">
                    {selectedPatient.medicalHistory}
                  </p>
                </div>
              )}

              <div className="pt-2 text-xs text-slate-400">
                Registered: {selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedPatient(null)}
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

export default AdminPatientManagementPage;
