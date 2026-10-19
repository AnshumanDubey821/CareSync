import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { prescriptionService } from '../services/prescriptionService';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import { FileText, Plus, Search, Calendar, User, Pill, Clock, CheckCircle, X } from 'lucide-react';

const DoctorPrescriptionsPage = () => {
  const location = useLocation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // New Prescription Form State
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Pre-fill from navigation state if redirected from appointments page
  useEffect(() => {
    if (location.state?.appointment && appointments.length > 0) {
      const app = location.state.appointment;
      handleSelectAppointment(app.id, appointments);
      setIsModalOpen(true);
    }
  }, [location.state, appointments]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [prescData, appData] = await Promise.all([
        prescriptionService.getDoctorPrescriptions(),
        appointmentService.getDoctorAppointments(),
      ]);
      setPrescriptions(prescData);
      setAppointments(appData);

      // Check if location state appointment is present right away
      if (location.state?.appointment) {
        const app = location.state.appointment;
        handleSelectAppointment(app.id, appData);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load prescription data:', err);
      setToast({ message: 'Failed to load prescriptions or appointments.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAppointment = (appId, appList = appointments) => {
    setSelectedAppointmentId(appId);
    const app = appList.find((a) => String(a.id) === String(appId));
    if (app) {
      setPatientId(app.patientId);
      setPatientName(app.patientName);
    } else {
      setPatientId('');
      setPatientName('');
    }
  };

  const handleCreatePrescriptionSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!selectedAppointmentId || !patientId) {
      setToast({ message: 'Please select a valid patient appointment.', type: 'error' });
      return;
    }

    if (!diagnosis.trim()) {
      setToast({ message: 'Diagnosis is required.', type: 'error' });
      return;
    }

    if (!medicines.trim()) {
      setToast({ message: 'Medicines list is required.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        appointmentId: Number(selectedAppointmentId),
        patientId: Number(patientId),
        diagnosis: diagnosis.trim(),
        medicines: medicines.trim(),
        dosage: dosage.trim() || undefined,
        frequency: frequency.trim() || undefined,
        duration: duration.trim() || undefined,
        instructions: instructions.trim() || undefined,
        doctorNotes: doctorNotes.trim() || undefined,
      };

      await prescriptionService.createPrescription(payload);
      setToast({ message: 'Digital prescription issued successfully!', type: 'success' });
      setIsModalOpen(false);
      resetForm();
      fetchInitialData();
    } catch (err) {
      console.error('Create prescription error:', err);
      const msg = err.response?.data?.message || 'Failed to issue prescription.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedAppointmentId('');
    setPatientId('');
    setPatientName('');
    setDiagnosis('');
    setMedicines('');
    setDosage('');
    setFrequency('');
    setDuration('');
    setInstructions('');
    setDoctorNotes('');
  };

  const filteredPrescriptions = prescriptions.filter((p) => {
    return (
      p.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.medicines?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="section-eyebrow">Digital Pharmacy & Rx</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy-900 tracking-tight mt-0.5">
            Digital Prescriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Issue and manage electronic prescriptions for your consultation patients.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-md shadow-primary-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Prescription</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-card flex items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient, diagnosis, or medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-ice-100/70 border border-slate-200 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 font-medium"
          />
        </div>
      </div>

      {/* Prescriptions List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-xs sm:text-sm animate-pulse">Loading prescription records...</div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-navy-900">No Prescriptions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'No prescriptions match your search criteria.'
              : 'Click "Issue New Prescription" to write a prescription for a patient.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrescriptions.map((presc) => (
            <div
              key={presc.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-ice-100 text-primary-600 border border-primary-200/60 flex items-center justify-center font-bold text-sm">
                      <Pill className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-navy-900">{presc.patientName}</h3>
                      <p className="text-xs text-slate-400">
                        {presc.createdAt ? new Date(presc.createdAt).toLocaleDateString() : 'Issued'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-ice-100 text-navy-900 font-extrabold text-xs rounded-full border border-slate-200">
                    Rx #{presc.id}
                  </span>
                </div>

                <div className="bg-ice-100/50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnosis</span>
                    <p className="text-sm font-bold text-navy-900 mt-0.5">{presc.diagnosis}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Medicines</span>
                    <p className="text-xs text-slate-700 font-medium line-clamp-2 mt-0.5">{presc.medicines}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Visit #{presc.appointmentId}</span>
                <button
                  onClick={() => setSelectedPrescription(presc)}
                  className="px-4 py-1.5 bg-ice-100 text-primary-700 font-bold rounded-full border border-primary-200 hover:bg-primary-600 hover:text-white transition-all shadow-2xs"
                >
                  View Rx
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-navy-900">Issue Digital Prescription</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrescriptionSubmit} className="space-y-4">
              {/* Select Appointment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Select Patient Visit *
                </label>
                <select
                  required
                  value={selectedAppointmentId}
                  onChange={(e) => handleSelectAppointment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                >
                  <option value="">-- Select Appointment --</option>
                  {appointments.map((app) => (
                    <option key={app.id} value={app.id}>
                      #{app.id} - {app.patientName} ({app.appointmentDate} at {app.startTime})
                    </option>
                  ))}
                </select>
              </div>

              {patientName && (
                <div className="p-3 bg-ice-100 rounded-2xl border border-primary-200 text-xs font-semibold text-navy-900 flex items-center justify-between">
                  <span>Selected Patient: <strong>{patientName}</strong></span>
                  <span>Patient ID #{patientId}</span>
                </div>
              )}

              {/* Diagnosis */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Pharyngitis, Hypertension"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                />
              </div>

              {/* Medicines List */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Prescribed Medicines *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Amoxicillin 500mg, Paracetamol 650mg"
                  value={medicines}
                  onChange={(e) => setMedicines(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Tablet"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Twice daily"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Days"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take after meals, Drink plenty of water"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Doctor Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Doctor Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Clinical notes or follow-up recommendation..."
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-full hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-full shadow-md shadow-primary-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing...' : 'Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Detail View Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-ice-100 text-primary-600 flex items-center justify-center">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">Rx #{selectedPrescription.id}</h3>
              </div>
              <button
                onClick={() => setSelectedPrescription(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-ice-100/70 p-4 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient</p>
                <h4 className="text-base font-bold text-navy-900">{selectedPrescription.patientName}</h4>
                <p className="text-xs text-slate-500">
                  Issued on: {selectedPrescription.createdAt ? new Date(selectedPrescription.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Diagnosis</span>
                  <p className="text-sm font-bold text-navy-900 bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-1">
                    {selectedPrescription.diagnosis}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Prescribed Medicines</span>
                  <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-2xl border border-slate-200 whitespace-pre-line mt-1">
                    {selectedPrescription.medicines}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-ice-100/60 p-3 rounded-2xl border border-slate-200 text-center">
                    <span className="text-xs font-bold text-slate-500 block">Dosage</span>
                    <span className="text-xs font-bold text-navy-900 mt-0.5 block">{selectedPrescription.dosage || '—'}</span>
                  </div>
                  <div className="bg-ice-100/60 p-3 rounded-2xl border border-slate-200 text-center">
                    <span className="text-xs font-bold text-slate-500 block">Frequency</span>
                    <span className="text-xs font-bold text-navy-900 mt-0.5 block">{selectedPrescription.frequency || '—'}</span>
                  </div>
                  <div className="bg-ice-100/60 p-3 rounded-2xl border border-slate-200 text-center">
                    <span className="text-xs font-bold text-slate-500 block">Duration</span>
                    <span className="text-xs font-bold text-navy-900 mt-0.5 block">{selectedPrescription.duration || '—'}</span>
                  </div>
                </div>

                {selectedPrescription.instructions && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Instructions</span>
                    <p className="text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-1">
                      {selectedPrescription.instructions}
                    </p>
                  </div>
                )}

                {selectedPrescription.doctorNotes && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Doctor Notes</span>
                    <p className="text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-1">
                      {selectedPrescription.doctorNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedPrescription(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full"
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

export default DoctorPrescriptionsPage;
