import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doctorService } from '../services/doctorService';
import {
  Search,
  MapPin,
  Stethoscope,
  Award,
  Calendar,
  ArrowRight,
  Activity,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  RotateCcw
} from 'lucide-react';

const DoctorSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState(searchParams.get('name') || '');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const indianCities = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune'];

  const specializationsList = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics',
    'Neurology',
    'ENT',
    'Gynecology',
    'Ophthalmology',
    'Psychiatry',
    'Pulmonology',
    'Gastroenterology',
    'Endocrinology',
    'Urology'
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async (overrideParams = {}) => {
    setIsLoading(true);
    try {
      const queryName = overrideParams.name !== undefined ? overrideParams.name : name;
      const querySpec = overrideParams.specialization !== undefined ? overrideParams.specialization : specialization;
      const queryLoc = overrideParams.location !== undefined ? overrideParams.location : location;

      const data = await doctorService.searchDoctors({
        name: queryName.trim() || undefined,
        specialization: querySpec.trim() || undefined,
        location: queryLoc.trim() || undefined,
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

  const handleCitySelect = (city) => {
    const newLoc = location === city ? '' : city;
    setLocation(newLoc);
    fetchDoctors({ location: newLoc });
  };

  const handleResetFilters = () => {
    setName('');
    setSpecialization('');
    setLocation('');
    fetchDoctors({ name: '', specialization: '', location: '' });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Find Specialist Doctors in India
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              {doctors.length} Available
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Book verified appointments with NMC registered doctors across Apollo, Fortis, Max & Manipal hospitals.
          </p>
        </div>

        {(name || specialization || location) && (
          <button
            onClick={handleResetFilters}
            className="self-start md:self-auto flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-3">
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-3"
        >
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by doctor name (e.g. Dr. Rajesh)..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-none text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
            />
          </div>

          <div className="w-full lg:w-56 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full bg-transparent border-none text-sm text-slate-700 focus:outline-none font-medium"
            >
              <option value="">All Specializations</option>
              {specializationsList.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Hospital, clinic or area (e.g. Indiranagar)..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-transparent border-none text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full lg:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Filter className="w-4 h-4" />
            <span>Search Doctors</span>
          </button>
        </form>

        {/* City Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-teal-600" /> Filter by City:
          </span>
          {indianCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleCitySelect(city)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                location.toLowerCase().includes(city.toLowerCase())
                  ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-slate-200 rounded-2xl shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded-md w-full"></div>
              <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No Doctors Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              No healthcare specialists matched your criteria. Try clearing search filters or searching for another city.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-teal-700 transition-colors"
          >
            Show All Doctors
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doctor) => {
            const initial = doctor.fullName
              ? doctor.fullName.replace('Dr. ', '').trim().charAt(0)
              : 'D';

            return (
              <div
                key={doctor.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:shadow-card-hover hover:border-teal-200 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Doctor Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xl border border-teal-100 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                        {initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                            {doctor.fullName}
                          </h3>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> NMC
                          </span>
                        </div>
                        <p className="text-xs font-bold text-teal-700 mt-0.5">{doctor.specialization}</p>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {doctor.qualifications}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fee</span>
                      <span className="text-base font-extrabold text-slate-900 block leading-tight">
                        ₹{Number(doctor.consultationFee || 500).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Doctor Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{doctor.experienceYears || 5}+ Yrs Clinical Experience</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Slots Available This Week</span>
                    </div>
                    {doctor.location && (
                      <div className="col-span-2 flex items-start gap-1.5 text-slate-500 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{doctor.location}</span>
                      </div>
                    )}
                  </div>

                  {doctor.bio && (
                    <p className="text-xs text-slate-500 line-clamp-2 italic bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      "{doctor.bio}"
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-teal-800">Direct hospital slot lock</span>
                  </div>
                  <button
                    onClick={() => navigate(`/patient/doctors/${doctor.id}`)}
                    className="py-2.5 px-4 bg-teal-50 hover:bg-teal-600 text-teal-800 hover:text-white font-bold text-xs rounded-xl border border-teal-200 hover:border-teal-600 transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>View Slots & Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorSearchPage;
