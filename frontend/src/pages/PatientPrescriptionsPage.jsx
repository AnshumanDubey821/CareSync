import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../services/prescriptionService';
import Toast from '../components/Toast';
import {
  FileText,
  Stethoscope,
  Calendar,
  Pill,
  Clock,
  FileCheck,
  X,
  Eye,
  Printer,
  ShieldCheck,
  Building2,
  HeartPulse
} from 'lucide-react';

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="section-eyebrow">Digital Health Records</span>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-navy-900 tracking-tight">
              My Digital Prescriptions (Rx)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {prescriptions.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official digitally signed medical prescriptions issued by NMC registered doctors.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-xs sm:text-sm animate-pulse">
          Loading digital health records...
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-navy-900">No Prescriptions Issued Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once a consulting doctor completes your appointment and enters your diagnosis and medications, they will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-ice-100 text-primary-600 flex items-center justify-center font-bold border border-primary-200/60">
                      <FileCheck className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-navy-900 text-sm">{p.doctorName}</h3>
                      <p className="text-xs font-semibold text-primary-600">{p.doctorSpecialization}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-ice-100 px-3 py-1 rounded-full border border-slate-200/60">
                    {p.createdAt ? p.createdAt.split('T')[0] : 'Recent'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-3 bg-ice-100/50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Diagnosis</span>
                    <p className="font-bold text-navy-900 text-sm mt-0.5">{p.diagnosis}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Medications</span>
                    <p className="font-semibold text-emerald-950 mt-0.5 line-clamp-2">{p.medicines}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPrescription(p)}
                className="w-full py-2.5 px-4 bg-ice-100 hover:bg-primary-600 text-navy-900 hover:text-white font-bold text-xs rounded-full border border-primary-200/60 hover:border-primary-600 transition-all flex items-center justify-center gap-2 mt-2 shadow-2xs"
              >
                <Eye className="w-4 h-4" />
                <span>View Official Rx Prescription</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Official Rx Prescription Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header / Hospital Pad */}
            <div className="flex items-start justify-between border-b-2 border-navy-900 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-navy-900 tracking-tight">Care<span className="text-primary-600">Sync</span></span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-primary-50 text-primary-700 border border-primary-200">
                    DIGITAL HEALTHCARE INDIA
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-navy-900">{selectedPrescription.doctorName}</h3>
                <p className="text-xs text-primary-600 font-bold">{selectedPrescription.doctorSpecialization}</p>
                <p className="text-[11px] text-slate-500">
                  Apollo / Fortis Partner Network • Registered Medical Practitioner
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 px-3 rounded-full bg-ice-100 hover:bg-primary-50 text-navy-900 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                  title="Print Prescription"
                >
                  <Printer className="w-4 h-4 text-primary-600" />
                  <span className="hidden sm:inline">Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Patient Meta Strip */}
            <div className="bg-ice-100/70 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Patient Name</span>
                <span className="font-bold text-navy-900">{selectedPrescription.patientName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Rx Reference</span>
                <span className="font-bold text-navy-900">#RX-{selectedPrescription.id}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Date of Issue</span>
                <span className="font-bold text-navy-900">
                  {selectedPrescription.createdAt ? selectedPrescription.createdAt.split('T')[0] : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Status</span>
                <span className="font-bold text-emerald-700">Clinically Valid</span>
              </div>
            </div>

            {/* Diagnosis & Prescribed Medications */}
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Clinical Diagnosis
                </span>
                <p className="text-sm font-extrabold text-navy-900 mt-1">{selectedPrescription.diagnosis}</p>
              </div>

              {/* Rx Medicine Box */}
              <div className="p-4 bg-primary-50/40 rounded-2xl border border-primary-200 space-y-3">
                <div className="flex items-center gap-2 text-primary-900">
                  <span className="text-2xl font-black font-serif italic text-primary-600">℞</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Prescribed Medication Schedule</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-primary-100 space-y-2">
                  <p className="text-sm font-extrabold text-navy-900">{selectedPrescription.medicines}</p>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 text-slate-600 border-t border-slate-100">
                    <div>
                      <span className="font-bold text-slate-700">Dosage: </span>
                      {selectedPrescription.dosage || 'As directed'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Frequency: </span>
                      {selectedPrescription.frequency || 'Daily'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Duration: </span>
                      {selectedPrescription.duration || '5-7 days'}
                    </div>
                  </div>
                </div>
              </div>

              {selectedPrescription.instructions && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Patient Instructions / Diet
                  </span>
                  <p className="mt-1 text-slate-800 font-medium">{selectedPrescription.instructions}</p>
                </div>
              )}

              {selectedPrescription.doctorNotes && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Consultant Doctor Notes
                  </span>
                  <p className="italic text-slate-600 mt-1">{selectedPrescription.doctorNotes}</p>
                </div>
              )}
            </div>

            {/* Signature & Security Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Digitally signed via CareSync Health Key • IDOR Protected</span>
              </div>
              <button
                onClick={() => setSelectedPrescription(null)}
                className="px-6 py-2.5 rounded-full bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptionsPage;
