import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doctorService } from '../services/doctorService';
import { Search, MapPin, Stethoscope, Award, Calendar, DollarSign, ArrowRight, Activity, Filter } from 'lucide-react';

const DoctorSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState(searchParams.get('name') || '');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
  const [location, setLocation] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.searchDoctors({
        name: name.trim() || undefined,
        specialization: specialization.trim() || undefined,
        location: location.trim() || undefined,
      });
      setDoctors(data);
    } catch (err) {
      console.error('Failed to search doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Specialist Doctors
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Search qualified healthcare providers and book real-time consultation time slots.
        </p>
      </div>

      {/* Filter Toolbar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 md:space-y-0 md:flex md:items-center md:gap-3">
        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
          <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by doctor name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-slate-900 focus:outline-none placeholder-slate-400"
          />
        </div>

        <div className="w-full md:w-52 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-slate-700 focus:outline-none font-medium"
          >
            <option value="">All Specializations</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="General Practice">General Practice</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Surgeon">Surgeon</option>
          </select>
        </div>

        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
          <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Location / Hospital..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-slate-900 focus:outline-none placeholder-slate-400"
          />
        </div>

        <button
          type="submit"
          className="w-full md:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Filter className="w-4 h-4" />
          <span>Apply Filters</span>
        </button>
      </form>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
              <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Doctors Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, specialization filter, or location keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-sky-200 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg">
                      {doctor.fullName ? doctor.fullName.charAt(4) || doctor.fullName.charAt(0) : 'D'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{doctor.fullName}</h3>
                      <p className="text-xs font-semibold text-sky-600">{doctor.specialization}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    ${parseFloat(doctor.consultationFee).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doctor.qualifications}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doctor.experienceYears || 0} Yrs Experience</span>
                  </div>
                  {doctor.location && (
                    <div className="col-span-2 flex items-center gap-1.5 text-slate-500 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doctor.location}</span>
                    </div>
                  )}
                </div>

                {doctor.bio && (
                  <p className="text-xs text-slate-600 line-clamp-2 pt-1 italic">
                    "{doctor.bio}"
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate(`/patient/doctors/${doctor.id}`)}
                className="w-full py-2.5 px-4 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white font-bold text-sm rounded-xl border border-sky-100 hover:border-sky-600 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Calendar className="w-4 h-4" />
                <span>View Profile & Available Slots</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorSearchPage;
