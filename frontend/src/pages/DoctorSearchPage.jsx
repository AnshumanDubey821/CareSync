import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doctorService } from '../services/doctorService';
import { placeService } from '../services/placeService';
import GooglePlacesMap, { MapErrorBoundary } from '../components/GooglePlacesMap';
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
  RotateCcw,
  Star,
  ExternalLink,
  AlertCircle,
  Info,
  ShieldCheck,
  Map as MapIcon,
  Eye,
  EyeOff,
  Navigation
} from 'lucide-react';

const DoctorSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mapSectionRef = useRef(null);
  const doctorResultsRef = useRef(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'places'

  // Map visibility toggle on Doctors tab
  const [showDoctorsMap, setShowDoctorsMap] = useState(true);

  // Selected Place ID for map synchronization
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  // Doctor Search State
  const [name, setName] = useState(searchParams.get('name') || '');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Places Search State
  const [placesQuery, setPlacesQuery] = useState('Hospital');
  const [placesCity, setPlacesCity] = useState('');
  const [placesType, setPlacesType] = useState('hospital');
  const [places, setPlaces] = useState([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState(null);
  const [placesStatus, setPlacesStatus] = useState(null);
  const [placesAttribution, setPlacesAttribution] = useState('');
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(null);

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

  const placeTypesList = [
    { label: 'All Facilities', value: '' },
    { label: 'Hospitals', value: 'hospital' },
    { label: 'Medical Clinics', value: 'medical_clinic' },
    { label: 'Pharmacies', value: 'pharmacy' }
  ];

  useEffect(() => {
    fetchDoctors();
    checkPlacesStatus();
    // Pre-populate places on initial mount so the map renders with live clinic markers
    fetchNearbyPlaces(location || 'Bengaluru', 'Hospital');
  }, []);

  const checkPlacesStatus = async () => {
    try {
      const status = await placeService.getStatus();
      setPlacesStatus(status);
      if (status?.attribution) {
        setPlacesAttribution(status.attribution);
      }
    } catch (err) {
      console.warn('Google Places status endpoint unreachable:', err);
    }
  };

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

  const fetchNearbyPlaces = async (city = 'Bengaluru', query = 'Hospital') => {
    setIsPlacesLoading(true);
    setPlacesError(null);
    try {
      const res = await placeService.searchPlaces({
        query: query || 'Hospital',
        city: city || undefined,
        placeType: 'hospital',
        pageSize: 10
      });
      setPlaces(res.places || []);
      if (res.attribution) setPlacesAttribution(res.attribution);
    } catch (err) {
      console.warn('Could not load live healthcare places:', err);
    } finally {
      setIsPlacesLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
    if (location) {
      fetchNearbyPlaces(location, 'Hospital');
    }
  };

  const handleCitySelect = (city) => {
    const newLoc = location === city ? '' : city;
    setLocation(newLoc);
    fetchDoctors({ location: newLoc });
    if (newLoc) {
      setPlacesCity(newLoc);
      fetchNearbyPlaces(newLoc, 'Hospital');
    } else {
      fetchNearbyPlaces('Bengaluru', 'Hospital');
    }
  };

  const handleResetFilters = () => {
    setName('');
    setSpecialization('');
    setLocation('');
    fetchDoctors({ name: '', specialization: '', location: '' });
    fetchNearbyPlaces('Bengaluru', 'Hospital');
  };

  // Google Places Search Form handler
  const handlePlacesSearch = async (e) => {
    if (e) e.preventDefault();
    if (!placesQuery.trim()) return;

    setIsPlacesLoading(true);
    setPlacesError(null);
    setRetryAfterSeconds(null);

    try {
      const res = await placeService.searchPlaces({
        query: placesQuery.trim(),
        city: placesCity.trim() || undefined,
        placeType: placesType || undefined,
        pageSize: 12
      });
      setPlaces(res.places || []);
      if (res.attribution) setPlacesAttribution(res.attribution);
    } catch (err) {
      if (err.response?.status === 429) {
        const retryHeader = err.response.headers?.['retry-after'];
        const secs = retryHeader ? parseInt(retryHeader, 10) : 60;
        setRetryAfterSeconds(secs);
        setPlacesError(`Per-minute rate limit reached. Please wait ${secs}s before submitting another query.`);
      } else if (err.response?.status === 503) {
        setPlacesError(err.response?.data?.message || 'Google Places integration is currently unavailable.');
      } else if (err.response?.status === 401) {
        setPlacesError('Please log in to search live facilities with Google Places.');
      } else {
        setPlacesError(err.response?.data?.message || 'Unable to retrieve healthcare facilities at this time.');
      }
    } finally {
      setIsPlacesLoading(false);
    }
  };

  const handleSelectFacilityForDoctorSearch = (facilityName) => {
    setLocation(facilityName);
    setActiveTab('doctors');
    fetchDoctors({ location: facilityName });

    // Smooth scroll down to doctor results
    setTimeout(() => {
      if (doctorResultsRef.current) {
        doctorResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSelectPlaceOnMap = (place) => {
    setSelectedPlaceId(place.id);
  };

  const handleScrollToMapAndSelect = (placeId) => {
    setSelectedPlaceId(placeId);
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="section-eyebrow">Healthcare Discovery</span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-navy-900 tracking-tight">
              {activeTab === 'doctors' ? 'Find Specialist Doctors in India' : 'Verified Hospitals & Medical Centers'}
            </h1>
            {activeTab === 'doctors' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200">
                {doctors.length} Verified
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Google Places
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {activeTab === 'doctors'
              ? 'Book verified appointments with NMC registered doctors across Apollo, Fortis, Max & Manipal hospitals.'
              : 'Discover certified hospitals, specialty clinics, and medical centers across Indian metropolitan regions.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('doctors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'doctors'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-primary-600" />
            <span>Specialist Doctors</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('places');
              if (places.length === 0) handlePlacesSearch();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'places'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-primary-600" />
            <span>Hospitals & Clinics</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DOCTORS SEARCH */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="space-y-3">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-card space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-3"
            >
              <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-ice-100/70 rounded-2xl border border-slate-200">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by doctor name (e.g. Dr. Rajesh)..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
                />
              </div>

              <div className="w-full lg:w-56 px-4 py-2.5 bg-ice-100/70 rounded-2xl border border-slate-200">
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-700 focus:outline-none font-medium"
                >
                  <option value="">All Specializations</option>
                  {specializationsList.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-ice-100/70 rounded-2xl border border-slate-200">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Hospital, clinic or area (e.g. Indiranagar)..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full lg:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-md shadow-primary-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Filter className="w-4 h-4" />
                <span>Search Doctors</span>
              </button>
            </form>

            {/* City Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-primary-600" /> Filter by City:
                </span>
                {indianCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className={`text-xs px-3.5 py-1 rounded-full border transition-all ${
                      location.toLowerCase().includes(city.toLowerCase())
                        ? 'bg-primary-600 text-white border-primary-600 font-bold shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-700'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDoctorsMap(!showDoctorsMap)}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-navy-900 px-3.5 py-1 rounded-full border border-primary-200 bg-primary-50/70 hover:bg-primary-100 transition-colors shadow-2xs"
                >
                  <MapIcon className="w-3.5 h-3.5 text-primary-600" />
                  <span>{showDoctorsMap ? 'Hide Map View' : 'Show Interactive Map'}</span>
                </button>

                {(name || specialization || location) && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 px-3 py-1 rounded-full border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Google Map on Doctors Tab */}
          {showDoctorsMap && (
            <div ref={mapSectionRef} className="space-y-2 animate-in fade-in duration-300">
              <MapErrorBoundary>
                <GooglePlacesMap
                  places={places}
                  selectedPlaceId={selectedPlaceId}
                  onSelectPlace={handleSelectPlaceOnMap}
                  onSelectFacilityForDoctorSearch={handleSelectFacilityForDoctorSearch}
                  activeCity={location || 'Bengaluru'}
                  isLoading={isPlacesLoading}
                  error={placesError}
                  height="h-[380px] sm:h-[420px]"
                  title="Partner Hospitals & Clinics (Interactive Map)"
                  subtitle="Click any clinic pin to inspect real coordinates and filter practicing doctors"
                />
              </MapErrorBoundary>
            </div>
          )}

          {/* Doctor Cards Section Header */}
          <div ref={doctorResultsRef} className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-navy-900 tracking-tight">
                Available Specialist Doctors
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                ({doctors.length} doctors found)
              </span>
            </div>
            {location && (
              <span className="text-xs text-primary-600 font-semibold bg-primary-50 px-3 py-1 rounded-full border border-primary-200 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Filtered by: {location}
              </span>
            )}
          </div>

          {/* Doctor Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 animate-pulse">
                  <div className="w-full h-44 bg-slate-200 rounded-2xl"></div>
                  <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                  <div className="h-10 bg-slate-100 rounded-full w-full"></div>
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white space-y-4">
              <div className="w-16 h-16 rounded-full bg-ice-100 text-primary-600 flex items-center justify-center mx-auto border border-primary-200">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900">No Doctors Found</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  No healthcare specialists matched your criteria. Try clearing search filters or searching for another city.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-full shadow-xs hover:bg-primary-700 transition-colors"
              >
                Show All Doctors
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => {
                const photoIndex = ((doctor.id || 1) % 6) + 1;
                const doctorImg = `/images/doc-${photoIndex}.jpg`;

                return (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Doctor Portrait Header */}
                      <div className="relative h-48 bg-slate-100 overflow-hidden">
                        <img
                          src={doctorImg}
                          alt={doctor.fullName}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-navy-900 shadow-xs border border-white/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> NMC Verified
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-navy-900/90 text-white shadow-xs">
                            ₹{Number(doctor.consultationFee || 500).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Doctor Details */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-extrabold text-navy-900 text-base leading-snug group-hover:text-primary-600 transition-colors">
                            {doctor.fullName}
                          </h3>
                          <p className="text-xs font-bold text-primary-600 mt-0.5">{doctor.specialization}</p>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                            {doctor.qualifications}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                            <span>{doctor.experienceYears || 5}+ Yrs Clinical Experience</span>
                          </div>
                          {doctor.location && (
                            <div className="flex items-start gap-1.5 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{doctor.location}</span>
                            </div>
                          )}
                        </div>

                        {doctor.bio && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-ice-100/60 p-2.5 rounded-2xl border border-slate-100">
                            "{doctor.bio}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer with Circular Quick-Action button */}
                    <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                      <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Instant Booking</span>
                      </div>
                      <button
                        onClick={() => navigate(`/patient/doctors/${doctor.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-navy-900 text-white rounded-full font-bold text-xs transition-colors shadow-xs group-hover:shadow-md"
                      >
                        <span>View Slots</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GOOGLE PLACES HEALTHCARE FACILITIES SEARCH */}
      {activeTab === 'places' && (
        <div className="space-y-6">
          {/* Feature Status / Safety Guard Notice */}
          {placesStatus && !placesStatus.enabled && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold">Google Places Integration is in Standby Mode</span>
                <p className="text-amber-700">
                  Live Google Places queries are secured behind server-side rate limits and cost guards. To activate live API lookups, set the <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-900">GOOGLE_PLACES_API_KEY</code> environment variable on your backend server.
                </p>
              </div>
            </div>
          )}

          {/* Error / Rate Limit Warning */}
          {placesError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold">Notice</span>
                <p className="text-rose-700">{placesError}</p>
                {retryAfterSeconds && (
                  <p className="text-[11px] text-rose-500 font-semibold">
                    Automatic protection enabled: Retry in {retryAfterSeconds} seconds.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Places Search Form */}
          <div className="space-y-3">
            <form
              onSubmit={handlePlacesSearch}
              className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-card space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-3"
            >
              <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-ice-100/70 rounded-2xl border border-slate-200">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Hospital or clinic name (e.g. Apollo, Fortis, Manipal)..."
                  value={placesQuery}
                  onChange={(e) => setPlacesQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
                />
              </div>

              <div className="w-full lg:w-48 px-4 py-2.5 bg-ice-100/70 rounded-2xl border border-slate-200">
                <select
                  value={placesType}
                  onChange={(e) => setPlacesType(e.target.value)}
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-700 focus:outline-none font-medium"
                >
                  {placeTypesList.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full lg:w-48 px-4 py-2.5 bg-ice-100/70 rounded-2xl border border-slate-200">
                <select
                  value={placesCity}
                  onChange={(e) => setPlacesCity(e.target.value)}
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-700 focus:outline-none font-medium"
                >
                  <option value="">All Indian Cities</option>
                  {indianCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isPlacesLoading}
                className="w-full lg:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-full shadow-md shadow-primary-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>{isPlacesLoading ? 'Searching...' : 'Find Facilities'}</span>
              </button>
            </form>

            {/* Quick Filter City Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary-600" /> Popular Hubs:
              </span>
              {indianCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    const newCity = placesCity === city ? '' : city;
                    setPlacesCity(newCity);
                    if (newCity) {
                      handlePlacesSearch();
                    }
                  }}
                  className={`text-xs px-3.5 py-1 rounded-full border transition-all ${
                    placesCity === city
                      ? 'bg-primary-600 text-white border-primary-600 font-bold shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-700'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Google Map on Places Tab */}
          <div ref={mapSectionRef} className="space-y-2">
            <MapErrorBoundary>
              <GooglePlacesMap
                places={places}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={handleSelectPlaceOnMap}
                onSelectFacilityForDoctorSearch={handleSelectFacilityForDoctorSearch}
                activeCity={placesCity || 'Bengaluru'}
                isLoading={isPlacesLoading}
                error={placesError}
                height="h-[440px] sm:h-[480px]"
                title="Verified Medical Facilities on Google Maps"
                subtitle="Explore hospital coordinates, ratings, and Google Maps navigation links"
              />
            </MapErrorBoundary>
          </div>

          {/* Places Results Header */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-navy-900 tracking-tight">
                Accredited Medical Centers &amp; Clinics
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                ({places.length} locations)
              </span>
            </div>
          </div>

          {/* Places Results Grid */}
          {isPlacesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 animate-pulse">
                  <div className="w-full h-36 bg-slate-200 rounded-2xl"></div>
                  <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                  <div className="h-9 bg-slate-100 rounded-full w-full"></div>
                </div>
              ))}
            </div>
          ) : places.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white space-y-4">
              <div className="w-16 h-16 rounded-full bg-ice-100 text-primary-600 flex items-center justify-center mx-auto border border-primary-200">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900">Search Healthcare Facilities</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Enter a hospital name or city above to find accredited medical facilities powered by Google Places.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPlacesQuery('Apollo Hospital');
                  handlePlacesSearch();
                }}
                className="px-5 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-full shadow-xs hover:bg-primary-700 transition-colors"
              >
                Search Apollo Hospitals
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((place) => {
                const photoUrl = place.photoUrls && place.photoUrls.length > 0
                  ? place.photoUrls[0]
                  : null;
                const isSelected = selectedPlaceId === place.id;

                return (
                  <div
                    key={place.id}
                    className={`bg-white rounded-3xl border overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group ${
                      isSelected
                        ? 'border-primary-500 ring-2 ring-primary-500/20'
                        : 'border-slate-200/90'
                    }`}
                  >
                    <div>
                      {/* Facility Photo Header or Fallback */}
                      <div className="relative h-40 bg-gradient-to-br from-primary-900 to-navy-900 overflow-hidden">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={place.displayName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // If proxy photo fails or rate-limited, fall back to clean gradient
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-4 text-center">
                            <Building2 className="w-10 h-10 text-primary-300 mb-1" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary-200">
                              {place.primaryType ? place.primaryType.replace(/_/g, ' ') : 'Medical Facility'}
                            </span>
                          </div>
                        )}

                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-xs text-navy-900 shadow-xs border border-white/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Facility
                          </span>
                        </div>

                        {place.rating && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-navy-900/90 text-amber-300 shadow-xs flex items-center gap-1 border border-amber-400/30">
                              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                              <span>{place.rating.toFixed(1)}</span>
                              {place.userRatingCount && (
                                <span className="text-[10px] text-slate-300 font-normal">
                                  ({place.userRatingCount})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Facility Information */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-extrabold text-navy-900 text-base leading-snug group-hover:text-primary-600 transition-colors">
                            {place.displayName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-ice-100 text-primary-700 uppercase">
                              {place.primaryType ? place.primaryType.replace(/_/g, ' ') : 'Hospital'}
                            </span>
                            {typeof place.latitude === 'number' && typeof place.longitude === 'number' && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {place.latitude.toFixed(3)}°, {place.longitude.toFixed(3)}°
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          <div className="flex items-start gap-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{place.formattedAddress}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {place.googleMapsUri ? (
                          <a
                            href={place.googleMapsUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-primary-600 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Google Maps</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">CareSync Network</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleScrollToMapAndSelect(place.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-800 transition-colors"
                        >
                          <MapIcon className="w-3.5 h-3.5" />
                          <span>Pin on Map</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectFacilityForDoctorSearch(place.displayName)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-600 hover:bg-navy-900 text-white rounded-full font-bold text-xs transition-colors shadow-xs"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Find Doctors</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Attribution Notice required by Google Places API Policy */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-[11px] text-slate-400 font-medium">
              {placesAttribution || 'Places data provided by Google Places (New). Powered by CareSync Healthcare Network.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSearchPage;
