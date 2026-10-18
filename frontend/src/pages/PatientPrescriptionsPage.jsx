import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../services/prescriptionService';
import Toast from '../components/Toast';
import { FileText, Stethoscope, Calendar, Pill, Clock, FileCheck, X, Eye } from 'lucide-react';

const PatientPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    try {
      const data = await prescriptionService.getPatientPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      console.error('Failed to fetch patient prescriptions:', err);
      setToast({ message: 'Failed to load prescriptions.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Digital Prescriptions
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Secure digital medical prescriptions issued by your CareSync doctors.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Prescriptions Issued</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Digital prescriptions created by your doctor after consultations will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{p.doctorName}</h3>
                      <p className="text-xs text-slate-500">{p.doctorSpecialization}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <p>
                    <strong className="text-slate-900">Diagnosis:</strong> {p.diagnosis}
                  </p>
                  <p className="line-clamp-2">
                    <strong className="text-slate-900">Medicines:</strong> {p.medicines}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPrescription(p)}
                className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-bold text-xs rounded-xl border border-purple-100 transition-all flex items-center justify-center gap-2 mt-3"
              >
                <Eye className="w-4 h-4" />
                <span>View Full Prescription Details</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Full Prescription Details Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Digital Medical Prescription</h3>
              </div>
              <button onClick={() => setSelectedPrescription(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 space-y-1.5 text-xs text-slate-700">
              <p><strong>Doctor:</strong> {selectedPrescription.doctorName} ({selectedPrescription.doctorSpecialization})</p>
              <p><strong>Patient:</strong> {selectedPrescription.patientName}</p>
              <p><strong>Issued Date:</strong> {selectedPrescription.createdAt ? new Date(selectedPrescription.createdAt).toLocaleDateString() : ''}</p>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1">Diagnosis</h4>
                <p className="text-sm font-semibold text-slate-900">{selectedPrescription.diagnosis}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1">Prescribed Medicines</h4>
                <p className="text-sm font-bold text-purple-700">{selectedPrescription.medicines}</p>
                {selectedPrescription.dosage && <p><strong>Dosage:</strong> {selectedPrescription.dosage}</p>}
                {selectedPrescription.frequency && <p><strong>Frequency:</strong> {selectedPrescription.frequency}</p>}
                {selectedPrescription.duration && <p><strong>Duration:</strong> {selectedPrescription.duration}</p>}
              </div>

              {selectedPrescription.instructions && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1">Usage Instructions</h4>
                  <p>{selectedPrescription.instructions}</p>
                </div>
              )}

              {selectedPrescription.doctorNotes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1">Doctor Notes</h4>
                  <p className="italic text-slate-600">{selectedPrescription.doctorNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedPrescription(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptionsPage;
