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
  FileText,
  PhoneCall,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Headphones,
  Check
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
    {
      name: 'Cardiologist',
      specParam: 'Cardiology',
      icon: HeartPulse,
      desc: 'Expert care for hypertension, arrhythmias, heart health, and preventive cardiovascular wellness.',
    },
    {
      name: 'Pulmonology',
      specParam: 'Pulmonology',
      icon: Activity,
      desc: 'Comprehensive diagnostic treatment for asthma, respiratory allergies, and lung wellness.',
    },
    {
      name: 'General Medicine',
      specParam: 'General Medicine',
      icon: Stethoscope,
      desc: 'Primary clinical care, routine seasonal illnesses, lifestyle disease management, and family health.',
    },
    {
      name: 'Pediatrics',
      specParam: 'Pediatrics',
      icon: Users,
      desc: 'Compassionate pediatric consultations, immunizations, and child developmental milestones.',
    },
    {
      name: 'Orthopedics',
      specParam: 'Orthopedics',
      icon: Award,
      desc: 'Specialized bone, joint replacement, sports injury evaluations, and arthritis rehabilitation.',
    },
    {
      name: 'Neurology',
      specParam: 'Neurology',
      icon: ShieldCheck,
      desc: 'Advanced treatment for migraine, nerve conditions, neurological assessments, and spine health.',
    },
    {
      name: 'Dermatology',
      specParam: 'Dermatology',
      icon: Sparkles,
      desc: 'Clinical skin therapy, acne treatments, hair health, and allergy patch diagnostics.',
    },
    {
      name: 'Urology',
      specParam: 'Urology',
      icon: FileText,
      desc: 'Advanced kidney, urinary tract health, and comprehensive urological wellness consultations.',
    },
  ];

  // Curated doctor portrait images to map to doctors
  const doctorImages = [
    '/images/doc-1.jpg',
    '/images/doc-2.jpg',
    '/images/doc-3.jpg',
    '/images/doc-4.jpg',
    '/images/doc-5.jpg',
    '/images/doc-6.jpg',
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
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* 1. HERO SECTION — Inspired by Doctorate Reference */}
      <section className="relative bg-gradient-to-b from-ice-100/90 via-ice-50/50 to-white pt-10 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="section-eyebrow justify-center lg:justify-start">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-primary-700 text-xs font-extrabold uppercase tracking-widest border border-blue-200">
                  <Activity className="w-3.5 h-3.5 text-primary-600 animate-pulse" />
                  <span>Serving the Community with Care</span>
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight leading-[1.12]">
                On a Pursuit of <br className="hidden sm:inline" />
                <span className="text-primary-600">Better Medicine</span> & Care
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                CareSync connects you with India's top certified specialist doctors across Apollo, Fortis, Max, and Manipal hospitals. Book verified appointments in real-time with automated 24-hour reminders.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1">
                <Link
                  to="/patient/doctors"
                  className="btn-doctorate-primary text-sm uppercase tracking-wider"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book an Appointment</span>
                </Link>
                <Link
                  to="/patient/doctors"
                  className="btn-doctorate-secondary text-sm uppercase tracking-wider"
                >
                  <Search className="w-4 h-4 text-primary-600" />
                  <span>Find a Doctor</span>
                </Link>
              </div>

              {/* Quick Search Bar */}
              <div className="pt-2">
                <form
                  onSubmit={handleSearch}
                  className="bg-white p-3 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-200 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5 max-w-2xl mx-auto lg:mx-0"
                >
                  <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Doctor name, hospital or area..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
                    />
                  </div>

                  <div className="sm:w-48 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-700 focus:outline-none font-medium"
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
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* City quick filter pills */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-3 text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-600" /> Cities:
                  </span>
                  {topCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleCityClick(city)}
                      className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                        selectedCity === city
                          ? 'bg-primary-600 text-white border-primary-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-600'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Doctor Hero Image */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Background soft circular glow */}
                <div className="absolute inset-0 bg-blue-200/40 rounded-3xl blur-2xl transform -rotate-3 scale-95"></div>

                {/* Main Hero Doctor Card */}
                <div className="relative bg-white rounded-3xl p-3 shadow-2xl border border-slate-200/80 overflow-hidden">
                  <img
                    src="/images/hero-doctor.jpg"
                    alt="Healthcare specialist doctor"
                    className="w-full h-[400px] object-cover rounded-2xl"
                    loading="eager"
                  />

                  {/* Overlaid Badge */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-navy-900 text-xs sm:text-sm">50+ Specialist Doctors</h4>
                        <p className="text-[11px] text-slate-500 font-medium">NMC Certified & Hospital Verified</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-primary-700 border border-blue-200">
                      Active Slots
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 FLOATING OVERLAPPING FEATURE CARDS (Directly inspired by Doctorate reference image) */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Card 1 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-600/30 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-navy-900">Our Doctors</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed font-normal">
                    Connect with leading medical specialists across Bengaluru, Mumbai, Delhi NCR, and Hyderabad hospitals.
                  </p>
                </div>
              </div>
              <div className="pt-5 border-t border-slate-100 mt-4">
                <Link
                  to="/patient/doctors"
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider"
                >
                  <span>+ Find a Doctor</span>
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-600/30 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-navy-900">Health Foundation</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed font-normal">
                    Pessimistic slot lock guarantees double-booking prevention with instant digital prescription access.
                  </p>
                </div>
              </div>
              <div className="pt-5 border-t border-slate-100 mt-4">
                <a
                  href="#services-section"
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider"
                >
                  <span>+ View All Departments</span>
                </a>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-600/30 group-hover:scale-110 transition-transform">
                  <Headphones className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-navy-900">24/7 Services</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed font-normal">
                    Round-the-clock booking support and automated 24-hour appointment email and SMS reminders.
                  </p>
                </div>
              </div>
              <div className="pt-5 border-t border-slate-100 mt-4">
                <a
                  href="tel:1800227379"
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider"
                >
                  <span>+ 1800-CARE-SYNC</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT CARESYNC / CENTRAL HOSPITAL SECTION (Mirroring Reference Image Middle Section) */}
      <section id="about-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Full Standing Doctor holding Clipboard */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 bg-blue-100/60 rounded-3xl -rotate-2 transform scale-95"></div>
              <div className="relative bg-white rounded-3xl p-3 shadow-xl border border-slate-200 overflow-hidden">
                <img
                  src="/images/about-doctor.jpg"
                  alt="Senior Physician in Lab Coat"
                  className="w-full h-[460px] object-cover rounded-2xl"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Right: Hospital Info + Dark Navy 4-point Box */}
          <div className="lg:col-span-7 space-y-6">
            <div className="section-eyebrow">
              <span className="flex items-center gap-1 text-primary-600 font-bold text-xs uppercase tracking-widest">
                ~ ABOUT CARESYNC ~
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight leading-snug">
              Welcome To CareSync <br />
              Healthcare Network
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Our network of verified medical professionals uses cutting-edge scheduling technology to provide painless, instant healthcare access across leading hospital clinics in India.
            </p>

            {/* Deep Navy Box (Exactly as in Reference) */}
            <div className="bg-navy-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center shrink-0 border border-primary-500/30">
                    <Check className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">20+ Years Clinical Expertise</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center shrink-0 border border-primary-500/30">
                    <Check className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">Multi-Specialty Network</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center shrink-0 border border-primary-500/30">
                    <Check className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">24-Hour Automated Reminders</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center shrink-0 border border-primary-500/30">
                    <Check className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">NMC Certified Medical Experts</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/patient/doctors"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary-600/40 transition-all"
                >
                  <span>Book an Appointment</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE OUR SERVICES (DEPARTMENTS GRID — Directly inspired by Reference) */}
      <section id="services-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="section-eyebrow text-primary-600">~ DEPARTMENTS ~</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Explore Our Services
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Consult with leading super-specialists across 14 clinical departments.
            </p>
          </div>

          <Link
            to="/patient/doctors"
            className="btn-doctorate-primary text-xs uppercase tracking-wider shrink-0"
          >
            <span>View All Services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3-Column Service Cards in Pale Ice Blue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularSpecialties.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="service-card flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Circular Blue Icon Badge */}
                  <div className="w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-600/25 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-navy-900 group-hover:text-primary-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/60 mt-4">
                  <button
                    onClick={() => handleSpecialtyClick(item.specParam)}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider"
                  >
                    <span>+ Book Specialist</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. TRUST & STATISTICS SECTION (Inspired by Doctorate Reference Right Panel) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-ice-100/60 p-6 sm:p-10 rounded-3xl border border-blue-100">
          {/* Medical Team Photograph and Checklist */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-4">
              <img
                src="/images/doctor-team.jpg"
                alt="CareSync Medical Team"
                className="w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-2xl shadow-md border border-white"
              />
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-primary-600">~ VERIFIED NETWORK ~</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-navy-900">
                  India's Trusted Digital Healthcare Network
                </h3>
                <p className="text-xs text-slate-600 max-w-md">
                  Delivering seamless clinical consultations across partner hospitals with real-time slot synchronization.
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 pt-2 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary-600 shrink-0" />
                <span>Over 50+ leading hospital clinics</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary-600 shrink-0" />
                <span>NMC certified medical specialists</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary-600 shrink-0" />
                <span>Zero double-booking guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary-600 shrink-0" />
                <span>Encrypted digital medical prescriptions</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary-600 shrink-0" />
                <span>Automated 24h SMS & email reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary-600 shrink-0" />
                <span>Standardized INR consultation fees</span>
              </div>
            </div>
          </div>

          {/* Right: Deep Navy Metric Counters (Reference Image Component) */}
          <div className="lg:col-span-5 bg-navy-900 text-white rounded-3xl p-8 shadow-xl space-y-6 text-center sm:text-left">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center mb-2 mx-auto sm:mx-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-white">1,800+</h4>
                <p className="text-xs font-semibold text-slate-300">Appointments Booked</p>
              </div>

              <div className="space-y-1">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center mb-2 mx-auto sm:mx-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-white">50+</h4>
                <p className="text-xs font-semibold text-slate-300">Certified Specialists</p>
              </div>

              <div className="space-y-1 border-t border-slate-700/80 pt-4">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center mb-2 mx-auto sm:mx-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-white">14</h4>
                <p className="text-xs font-semibold text-slate-300">Clinical Departments</p>
              </div>

              <div className="space-y-1 border-t border-slate-700/80 pt-4">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center mb-2 mx-auto sm:mx-0">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-white">24h</h4>
                <p className="text-xs font-semibold text-slate-300">Reminder Alerts</p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/patient/doctors"
                className="w-full block text-center py-3 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
              >
                Schedule Consultation Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HEALTHCARE SPECIALISTS (DOCTOR CARDS — Inspired by Reference) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="section-eyebrow text-primary-600">~ MEDICAL TEAM ~</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Healthcare Specialists
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Verified practitioners currently open for in-clinic and telehealth consultations.
            </p>
          </div>

          <Link
            to="/patient/doctors"
            className="btn-doctorate-primary text-xs uppercase tracking-wider shrink-0"
          >
            <span>View All Doctors</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse space-y-4">
                <div className="h-48 bg-slate-200 rounded-2xl w-full"></div>
                <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doctor, index) => {
              const photo = doctorImages[index % doctorImages.length];

              return (
                <div
                  key={doctor.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Doctor Portrait Image Container */}
                    <div className="relative h-56 bg-ice-100 overflow-hidden">
                      <img
                        src={photo}
                        alt={doctor.user?.fullName || 'Specialist Doctor'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Floating quick action buttons like in Doctorate reference */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                        <Link
                          to={`/patient/doctors/${doctor.id}`}
                          className="w-8 h-8 rounded-full bg-white text-primary-600 flex items-center justify-center shadow-md hover:bg-primary-600 hover:text-white transition-colors"
                          title="View Profile & Slots"
                        >
                          <Calendar className="w-4 h-4" />
                        </Link>
                        <a
                          href="tel:1800227379"
                          className="w-8 h-8 rounded-full bg-white text-primary-600 flex items-center justify-center shadow-md hover:bg-primary-600 hover:text-white transition-colors"
                          title="Call Clinic"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Specialization Tag */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-navy-900/80 text-white backdrop-blur-xs">
                          {doctor.specialization}
                        </span>
                      </div>
                    </div>

                    {/* Doctor Details */}
                    <div className="p-5 space-y-2">
                      <h3 className="font-extrabold text-navy-900 text-base group-hover:text-primary-600 transition-colors">
                        {doctor.user?.fullName || 'Doctor'}
                      </h3>
                      <p className="text-xs font-semibold text-primary-600">{doctor.qualifications}</p>

                      <p className="text-[11px] text-slate-500 flex items-start gap-1 pt-1 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{doctor.location || 'Hospital Clinic, Bengaluru'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Fee & Booking Button */}
                  <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-3">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Consultation Fee</span>
                      <p className="text-base font-black text-navy-900">
                        ₹{doctor.consultationFee ? Number(doctor.consultationFee).toLocaleString('en-IN') : '600'}
                      </p>
                    </div>

                    <Link
                      to={`/patient/doctors/${doctor.id}`}
                      className="px-4 py-2 rounded-full bg-ice-200 text-primary-700 hover:bg-primary-600 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Book Slot
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. CALLOUT BANNER (Inspired by Doctorate Reference Bottom Section) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-400">
              ~ QUICK APPOINTMENT RESERVATIONS ~
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Online and In-Clinic Consultations with Certified Doctors
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-normal">
              Need assistance selecting the right specialist or rescheduling a booking? Contact our helpline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <a
              href="tel:1800227379"
              className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 flex items-center gap-2 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-primary-400" />
              <span>Call: 1800-CARE-SYNC</span>
            </a>
            <Link
              to="/patient/doctors"
              className="px-6 py-3.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary-600/40 transition-all"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* 7. PROFESSIONAL FOOTER (Doctorate Visual Architecture) */}
      <footer className="border-t border-slate-200 pt-16 pb-12 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-xl text-navy-900 tracking-tight">
                  Care<span className="text-primary-600">Sync</span>
                </span>
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed">
                India's modern healthcare appointment scheduler. Real-time slot locking, verified hospital networks, and automated reminders.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-navy-900 text-xs uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
                <li><Link to="/patient/doctors" className="hover:text-primary-600 transition-colors">Find Doctors</Link></li>
                <li><a href="#services-section" className="hover:text-primary-600 transition-colors">Clinical Departments</a></li>
                <li><Link to="/patient/appointments" className="hover:text-primary-600 transition-colors">My Consultations</Link></li>
              </ul>
            </div>

            {/* Col 3: Specializations */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-navy-900 text-xs uppercase tracking-wider">Departments</h4>
              <ul className="space-y-2">
                <li><Link to="/patient/doctors?specialization=General+Medicine" className="hover:text-primary-600">General Medicine</Link></li>
                <li><Link to="/patient/doctors?specialization=Cardiology" className="hover:text-primary-600">Cardiology</Link></li>
                <li><Link to="/patient/doctors?specialization=Dermatology" className="hover:text-primary-600">Dermatology</Link></li>
                <li><Link to="/patient/doctors?specialization=Pediatrics" className="hover:text-primary-600">Pediatrics</Link></li>
              </ul>
            </div>

            {/* Col 4: Support & Legal */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-navy-900 text-xs uppercase tracking-wider">24/7 Helpline</h4>
              <p className="text-xs text-slate-600">Toll-free emergency booking assistance across India:</p>
              <p className="text-sm font-extrabold text-primary-600">1800-CARE-SYNC (1800-227-379)</p>
              <p className="text-[11px] text-slate-400">Apollo / Fortis / Max / Manipal Partner Network</p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} CareSync Healthcare Technologies. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Pessimistic Concurrency Protected • IDOR Secured
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
