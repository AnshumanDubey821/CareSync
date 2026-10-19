import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorService } from '../services/doctorService';
import {
  Activity,
  Search,
  Calendar,
  ShieldCheck,
  Stethoscope,
  Clock,
  ArrowRight,
  UserCheck,
  MapPin,
  Star,
  CheckCircle2,
  Award,
  HeartPulse,
  Users,
  Building2,
  FileText
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const topCities = [
    'Bengaluru',
    'Mumbai',
    'Delhi NCR',
    'Hyderabad',
    'Chennai',
    'Pune'
  ];

  const popularSpecialties = [
    { name: 'General Medicine', icon: Stethoscope, count: '12+ Specialists', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    { name: 'Cardiology', icon: HeartPulse, count: '8+ Specialists', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { name: 'Dermatology', icon: Activity, count: '6+ Specialists', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { name: 'Pediatrics', icon: Users, count: '7+ Specialists', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { name: 'Orthopedics', icon: Award, count: '5+ Specialists', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { name: 'Neurology', icon: ShieldCheck, count: '4+ Specialists', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  useEffect(() => {
    fetchFeaturedDoctors();
  }, []);

  const fetchFeaturedDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.searchDoctors();
      setDoctors(data.slice(0, 4));
    } catch (err) {
      console.error('Failed to load featured doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('name', searchTerm);
    if (specialization) params.append('specialization', specialization);
    if (selectedCity) params.append('location', selectedCity);
    navigate(`/patient/doctors?${params.toString()}`);
  };

  const handleSpecialtyClick = (specName) => {
    navigate(`/patient/doctors?specialization=${encodeURIComponent(specName)}`);
  };

  const handleCityClick = (cityName) => {
    setSelectedCity(cityName === selectedCity ? '' : cityName);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-slate-50/50 to-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-emerald-200/20 blur-2xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 text-teal-800 text-xs font-bold uppercase tracking-wider border border-teal-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
              <span>India's Premier Healthcare Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Consult India's Top <br className="hidden sm:inline" />
              <span className="text-teal-600 underline decoration-teal-300 decoration-wavy decoration-2">Specialist Doctors</span> Online & In-Clinic
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Book verified consultations across <strong>Apollo, Fortis, Manipal & Max</strong> partner hospitals. Real-time slot locking, instant confirmation, and automated 24-hour reminders.
            </p>

            {/* City Quick Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" /> Major Hubs:
              </span>
              {topCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCityClick(city)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    selectedCity === city
                      ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Quick Doctor Search Box */}
            <form
              onSubmit={handleSearch}
              className="bg-white p-3 rounded-2xl shadow-xl shadow-teal-900/5 border border-slate-200/90 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-2"
            >
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Doctor name, hospital or area (e.g. Indiranagar)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
                />
              </div>

              <div className="sm:w-52 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-slate-700 focus:outline-none font-medium"
                >
                  <option value="">All Specializations</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="ENT">ENT</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Psychiatry">Psychiatry</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-600/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Find Doctors</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Trust Highlights */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                100% Verified NMC Registered Doctors
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Zero Booking Fees
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Digital Rx & Reminders
              </span>
            </div>
          </div>

          {/* Hero Feature Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl shadow-teal-900/10 border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-100 shadow-inner">
                    <UserCheck className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">Dr. Rajesh Sharma</h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        NMC Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">MBBS, MD (General Medicine) • 14 Yrs Exp</p>
                    <p className="text-[11px] text-teal-700 font-medium flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" /> Apollo Hospitals, Indiranagar, Bengaluru
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="block text-slate-400 font-medium text-[11px]">Today's Slot</span>
                  <span className="block font-bold text-slate-800 text-sm mt-0.5">10:30 AM</span>
                </div>
                <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 text-teal-900">
                  <span className="block text-teal-700 font-medium text-[11px]">Consultation Fee</span>
                  <span className="block font-extrabold text-teal-800 text-base mt-0.5">₹600</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="block text-slate-400 font-medium text-[11px]">Rating</span>
                  <span className="block font-bold text-slate-800 text-sm mt-0.5 flex items-center justify-center gap-1 text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 4.9/5
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Next available in 35 mins</span>
                </div>
                <Link
                  to="/patient/doctors"
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                >
                  Book Instant <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Patient Review Snippet */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Ananya Verma</span>: "Seamless booking and instant WhatsApp/Email reminders. Highly recommended!"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Find by Department</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Popular Clinical Specialties
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Consult with verified super-specialists across Indian cities.
            </p>
          </div>
          <Link
            to="/patient/doctors"
            className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 shrink-0"
          >
            <span>Explore All 14 Specialties</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularSpecialties.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleSpecialtyClick(item.name)}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-card-hover transition-all text-left group flex flex-col justify-between h-36"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.count}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Top Rated Practitioners</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Doctors Available for Consultation
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Highest rated doctors across Bengaluru, Mumbai, Delhi & Hyderabad.
            </p>
          </div>
          <Link
            to="/patient/doctors"
            className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 shrink-0"
          >
            <span>View All Doctors</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
                <div className="w-14 h-14 bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover hover:border-teal-200 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-100">
                      {doctor.user?.fullName ? doctor.user.fullName.replace('Dr. ', '').charAt(0) : 'D'}
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                      4.8
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {doctor.user?.fullName || 'Specialist Doctor'}
                    </h3>
                    <p className="text-xs font-semibold text-teal-700 mt-0.5">{doctor.specialization}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{doctor.qualifications}</p>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                    <p className="flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {doctor.location || 'Apollo Hospitals, Indiranagar'}
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      {doctor.experienceYears || 10}+ Years Experience
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Fee</span>
                    <p className="text-base font-extrabold text-slate-900 leading-tight">
                      ₹{doctor.consultationFee ? Number(doctor.consultationFee).toLocaleString('en-IN') : '500'}
                    </p>
                  </div>
                  <Link
                    to={`/patient/doctors/${doctor.id}`}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Book Slot
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feature Cards Grid — Why Choose CareSync India */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Digital Health Infrastructure</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Engineered for Patient Safety & Reliability
          </h2>
          <p className="text-slate-600 mt-2 text-sm">
            Everything you need for a modern, stress-free healthcare scheduling experience in India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 hover:border-teal-200 transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Pessimistic Double-Booking Lock</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Never experience duplicate appointments. CareSync locks doctor availability slots with atomic DB transactions and strict concurrency control.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 hover:border-teal-200 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Automated 24h Reminders</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Receive automated email reminders 24 hours prior to your scheduled consultation slot with Google Maps clinic directions.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 hover:border-teal-200 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Encrypted Digital Prescriptions</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Access digital medical prescriptions with dosage, frequency, and doctor instructions anytime. Safe IDOR-protected patient records.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
