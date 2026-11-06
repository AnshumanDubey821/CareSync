/**
 * City coordinate defaults across major Indian metropolitan regions.
 */
export const CITY_COORDINATES = {
  Bengaluru: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  Bangalore: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  Mumbai: { lat: 19.0760, lng: 72.8777, zoom: 12 },
  'Delhi NCR': { lat: 28.6139, lng: 77.2090, zoom: 11 },
  Delhi: { lat: 28.6139, lng: 77.2090, zoom: 11 },
  Hyderabad: { lat: 17.3850, lng: 78.4867, zoom: 12 },
  Chennai: { lat: 13.0827, lng: 80.2707, zoom: 12 },
  Pune: { lat: 18.5204, lng: 73.8567, zoom: 12 },
  Kolkata: { lat: 22.5726, lng: 88.3639, zoom: 12 },
  Gurugram: { lat: 28.4595, lng: 77.0266, zoom: 12 },
  Mohali: { lat: 30.7046, lng: 76.7179, zoom: 12 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714, zoom: 12 },
  Jaipur: { lat: 26.9124, lng: 75.7873, zoom: 12 },
  Lucknow: { lat: 26.8467, lng: 80.9462, zoom: 12 },
  Kochi: { lat: 9.9312, lng: 76.2673, zoom: 12 },
  Chandigarh: { lat: 30.7333, lng: 76.7794, zoom: 12 },
  Indore: { lat: 22.7196, lng: 75.8577, zoom: 12 },
  India: { lat: 20.5937, lng: 78.9629, zoom: 5 }
};

export const INDIAN_CITIES = [
  { label: 'All India', value: '' },
  { label: 'Bengaluru', value: 'Bengaluru' },
  { label: 'Delhi NCR', value: 'Delhi' },
  { label: 'Mumbai', value: 'Mumbai' },
  { label: 'Hyderabad', value: 'Hyderabad' },
  { label: 'Chennai', value: 'Chennai' },
  { label: 'Pune', value: 'Pune' },
  { label: 'Kolkata', value: 'Kolkata' },
  { label: 'Gurugram', value: 'Gurugram' },
  { label: 'Mohali / Chd', value: 'Mohali' },
  { label: 'Chandigarh', value: 'Chandigarh' },
  { label: 'Ahmedabad', value: 'Ahmedabad' },
  { label: 'Jaipur', value: 'Jaipur' },
  { label: 'Lucknow', value: 'Lucknow' },
  { label: 'Kochi', value: 'Kochi' },
  { label: 'Indore', value: 'Indore' }
];

export const SPECIALIZATIONS_LIST = [
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

export const PLACE_TYPES_LIST = [
  { label: 'All Facilities', value: '' },
  { label: 'Hospitals', value: 'hospital' },
  { label: 'Medical Clinics', value: 'medical_clinic' },
  { label: 'Pharmacies', value: 'pharmacy' }
];

/**
 * 42 Prestigious accredited hospital facilities across major Indian metropolitan hubs.
 * Provides rich metadata, verified GPS coordinates, and reliable fallback.
 */
export const CURATED_MEDICAL_FACILITIES = [
  // Bengaluru (5)
  {
    id: 'hosp-blr-apollo',
    displayName: 'Apollo Hospitals, Bannerghatta Road',
    formattedAddress: '154/11 Bannerghatta Road, Opposite IIMB, Bengaluru, Karnataka 560076',
    latitude: 12.8962,
    longitude: 77.5986,
    rating: 4.6,
    city: 'Bengaluru',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=12.8962,77.5986'
  },
  {
    id: 'hosp-blr-manipal',
    displayName: 'Manipal Hospital, Old Airport Road',
    formattedAddress: '98 HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka 560017',
    latitude: 12.9585,
    longitude: 77.6483,
    rating: 4.5,
    city: 'Bengaluru',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=12.9585,77.6483'
  },
  {
    id: 'hosp-blr-narayana',
    displayName: 'Narayana Institute of Cardiac Sciences',
    formattedAddress: '258/A Bommasandra Industrial Area, Anekal Taluk, Bengaluru, Karnataka 560099',
    latitude: 12.8174,
    longitude: 77.6917,
    rating: 4.7,
    city: 'Bengaluru',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=12.8174,77.6917'
  },
  {
    id: 'hosp-blr-fortis',
    displayName: 'Fortis Hospital, Bannerghatta Road',
    formattedAddress: '154/9 Bannerghatta Road, Opposite IIMB, Bengaluru, Karnataka 560076',
    latitude: 12.8943,
    longitude: 77.5978,
    rating: 4.4,
    city: 'Bengaluru',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=12.8943,77.5978'
  },
  {
    id: 'hosp-blr-aster',
    displayName: 'Aster CMI Hospital, Hebbal',
    formattedAddress: 'No. 43/42 NH 44, Sahakar Nagar, Hebbal, Bengaluru, Karnataka 560092',
    latitude: 13.0560,
    longitude: 77.5921,
    rating: 4.6,
    city: 'Bengaluru',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=13.0560,77.5921'
  },

  // Delhi NCR (7)
  {
    id: 'hosp-del-max',
    displayName: 'Max Super Speciality Hospital, Saket',
    formattedAddress: '1, 2 Press Enclave Road, Mandir Marg, Saket, New Delhi 110017',
    latitude: 28.5280,
    longitude: 77.2114,
    rating: 4.6,
    city: 'Delhi',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=28.5280,77.2114'
  },
  {
    id: 'hosp-del-gangaram',
    displayName: 'Sir Ganga Ram Hospital, Rajinder Nagar',
    formattedAddress: 'Sir Ganga Ram Hospital Marg, Old Rajinder Nagar, New Delhi 110060',
    latitude: 28.6389,
    longitude: 77.1897,
    rating: 4.5,
    city: 'Delhi',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=28.6389,77.1897'
  },
  {
    id: 'hosp-del-aiims',
    displayName: 'All India Institute of Medical Sciences (AIIMS)',
    formattedAddress: 'Sri Aurobindo Marg, Ansari Nagar East, New Delhi 110029',
    latitude: 28.5672,
    longitude: 77.2100,
    rating: 4.8,
    city: 'Delhi',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=28.5672,77.2100'
  },
  {
    id: 'hosp-del-apollo',
    displayName: 'Indraprastha Apollo Hospitals, Sarita Vihar',
    formattedAddress: 'Delhi-Mathura Road, Sarita Vihar, New Delhi 110076',
    latitude: 28.5385,
    longitude: 77.2847,
    rating: 4.5,
    city: 'Delhi',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=28.5385,77.2847'
  },
  {
    id: 'hosp-del-blkmax',
    displayName: 'BLK-Max Super Speciality Hospital, Karol Bagh',
    formattedAddress: 'Pusa Road, Radha Soami Satsang, Karol Bagh, New Delhi 110005',
    latitude: 28.6441,
    longitude: 77.1793,
    rating: 4.5,
    city: 'Delhi',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=28.6441,77.1793'
  },
  {
    id: 'hosp-ggn-fortis',
    displayName: 'Fortis Memorial Research Institute, Gurugram',
    formattedAddress: 'Sector 44, Opposite HUDA City Centre, Gurugram, Haryana 122002',
    latitude: 28.4554,
    longitude: 77.0722,
    rating: 4.5,
    city: 'Gurugram',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=28.4554,77.0722'
  },
  {
    id: 'hosp-ggn-medanta',
    displayName: 'Medanta - The Medicity, Gurugram',
    formattedAddress: 'CH Bakhtawar Singh Road, Sector 38, Gurugram, Haryana 122001',
    latitude: 28.4393,
    longitude: 77.0427,
    rating: 4.6,
    city: 'Gurugram',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=28.4393,77.0427'
  },

  // Mumbai (4)
  {
    id: 'hosp-mum-kokilaben',
    displayName: 'Kokilaben Dhirubhai Ambani Hospital',
    formattedAddress: 'Rao Saheb Patwardhan Marg, Four Bungalows, Andheri West, Mumbai, Maharashtra 400053',
    latitude: 19.1312,
    longitude: 72.8252,
    rating: 4.6,
    city: 'Mumbai',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=19.1312,72.8252'
  },
  {
    id: 'hosp-mum-lilavati',
    displayName: 'Lilavati Hospital and Research Centre',
    formattedAddress: 'A-791 Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050',
    latitude: 19.0518,
    longitude: 72.8294,
    rating: 4.5,
    city: 'Mumbai',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=19.0518,72.8294'
  },
  {
    id: 'hosp-mum-tata',
    displayName: 'Tata Memorial Hospital, Parel',
    formattedAddress: 'Dr. E Borges Road, Parel, Mumbai, Maharashtra 400012',
    latitude: 19.0047,
    longitude: 72.8431,
    rating: 4.7,
    city: 'Mumbai',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=19.0047,72.8431'
  },
  {
    id: 'hosp-mum-reliance',
    displayName: 'Sir H.N. Reliance Foundation Hospital',
    formattedAddress: 'Raja Ram Mohan Roy Road, Prarthana Samaj, Girgaon, Mumbai, Maharashtra 400004',
    latitude: 18.9586,
    longitude: 72.8194,
    rating: 4.6,
    city: 'Mumbai',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=18.9586,72.8194'
  },

  // Hyderabad (4)
  {
    id: 'hosp-hyd-apollo',
    displayName: 'Apollo Health City, Jubilee Hills',
    formattedAddress: 'Road No 72, Film Nagar, Jubilee Hills, Hyderabad, Telangana 500033',
    latitude: 17.4193,
    longitude: 78.4116,
    rating: 4.6,
    city: 'Hyderabad',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=17.4193,78.4116'
  },
  {
    id: 'hosp-hyd-yashoda',
    displayName: 'Yashoda Hospitals, Somajiguda',
    formattedAddress: 'Raj Bhavan Road, Matha Nagar, Somajiguda, Hyderabad, Telangana 500082',
    latitude: 17.4260,
    longitude: 78.4539,
    rating: 4.5,
    city: 'Hyderabad',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=17.4260,78.4539'
  },
  {
    id: 'hosp-hyd-kims',
    displayName: 'KIMS Hospitals, Secunderabad',
    formattedAddress: '1-8-31/1 Minister Road, Krishna Nagar Colony, Secunderabad, Telangana 500003',
    latitude: 17.4385,
    longitude: 78.4877,
    rating: 4.5,
    city: 'Hyderabad',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=17.4385,78.4877'
  },
  {
    id: 'hosp-hyd-care',
    displayName: 'Care Hospitals, Banjara Hills',
    formattedAddress: 'Road No 1, Prem Nagar, Banjara Hills, Hyderabad, Telangana 500034',
    latitude: 17.4161,
    longitude: 78.4483,
    rating: 4.4,
    city: 'Hyderabad',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=17.4161,78.4483'
  },

  // Chennai (4)
  {
    id: 'hosp-chn-apollo',
    displayName: 'Apollo Speciality Hospitals, Chennai',
    formattedAddress: '320 Mount Road, Teynampet, Chennai, Tamil Nadu 600035',
    latitude: 13.0368,
    longitude: 80.2483,
    rating: 4.5,
    city: 'Chennai',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=13.0368,80.2483'
  },
  {
    id: 'hosp-chn-gleneagles',
    displayName: 'Gleneagles Global Health City',
    formattedAddress: '439 Cheran Nagar, Perumbakkam, Chennai, Tamil Nadu 600100',
    latitude: 12.9067,
    longitude: 80.1983,
    rating: 4.5,
    city: 'Chennai',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=12.9067,80.1983'
  },
  {
    id: 'hosp-chn-fortis',
    displayName: 'Fortis Malar Hospital, Adyar',
    formattedAddress: 'No. 52 1st Main Road, Gandhi Nagar, Adyar, Chennai, Tamil Nadu 600020',
    latitude: 13.0067,
    longitude: 80.2569,
    rating: 4.3,
    city: 'Chennai',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=13.0067,80.2569'
  },
  {
    id: 'hosp-chn-miot',
    displayName: 'MIOT International Hospital',
    formattedAddress: '4/112 Mount Poonamallee High Road, Manapakkam, Chennai, Tamil Nadu 600089',
    latitude: 13.0232,
    longitude: 80.1772,
    rating: 4.5,
    city: 'Chennai',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=13.0232,80.1772'
  },

  // Pune (3)
  {
    id: 'hosp-pne-ruby',
    displayName: 'Ruby Hall Clinic, Pune',
    formattedAddress: '40 Sassoon Road, Sangamvadi, Pune, Maharashtra 411001',
    latitude: 18.5332,
    longitude: 73.8767,
    rating: 4.5,
    city: 'Pune',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=18.5332,73.8767'
  },
  {
    id: 'hosp-pne-jehangir',
    displayName: 'Jehangir Hospital, Pune',
    formattedAddress: '32 Sasoon Road, Opposite Railway Station, Pune, Maharashtra 411001',
    latitude: 18.5283,
    longitude: 73.8760,
    rating: 4.4,
    city: 'Pune',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=18.5283,73.8760'
  },
  {
    id: 'hosp-pne-sahyadri',
    displayName: 'Sahyadri Super Speciality Hospital, Deccan',
    formattedAddress: 'Plot No. 30 C, Erandwane, Deccan Gymkhana, Pune, Maharashtra 411004',
    latitude: 18.5134,
    longitude: 73.8378,
    rating: 4.4,
    city: 'Pune',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=18.5134,73.8378'
  },

  // Kolkata (3)
  {
    id: 'hosp-kol-manipal',
    displayName: 'Manipal Hospital, Salt Lake',
    formattedAddress: 'Broadway, IB Block, Sector III, Bidhannagar, Kolkata, West Bengal 700098',
    latitude: 22.5701,
    longitude: 88.4068,
    rating: 4.5,
    city: 'Kolkata',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=22.5701,88.4068'
  },
  {
    id: 'hosp-kol-apollo',
    displayName: 'Apollo Multispeciality Hospitals, Kolkata',
    formattedAddress: '58 Canal Circular Road, Kadapara, Phool Bagan, Kolkata, West Bengal 700054',
    latitude: 22.5732,
    longitude: 88.3995,
    rating: 4.5,
    city: 'Kolkata',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=22.5732,88.3995'
  },
  {
    id: 'hosp-kol-fortis',
    displayName: 'Fortis Hospital Anandapur, Kolkata',
    formattedAddress: '730 Anandapur, E.M. Bypass Road, Kolkata, West Bengal 700107',
    latitude: 22.5186,
    longitude: 88.4011,
    rating: 4.4,
    city: 'Kolkata',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=22.5186,88.4011'
  },

  // Ahmedabad (3)
  {
    id: 'hosp-ahd-zydus',
    displayName: 'Zydus Hospital, Thaltej',
    formattedAddress: 'Zydus Hospital Road, Near Sola Bridge, Thaltej, Ahmedabad, Gujarat 380054',
    latitude: 23.0575,
    longitude: 72.5152,
    rating: 4.6,
    city: 'Ahmedabad',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=23.0575,72.5152'
  },
  {
    id: 'hosp-ahd-apollo',
    displayName: 'Apollo Hospitals International, Gandhinagar',
    formattedAddress: 'Plot No. 1A, Gandhinagar Highway, Bhat, Ahmedabad, Gujarat 382428',
    latitude: 23.1092,
    longitude: 72.6105,
    rating: 4.5,
    city: 'Ahmedabad',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=23.1092,72.6105'
  },
  {
    id: 'hosp-ahd-cims',
    displayName: 'Marengo CIMS Hospital, Sola',
    formattedAddress: 'Off Science City Road, Sola, Ahmedabad, Gujarat 380060',
    latitude: 23.0760,
    longitude: 72.5085,
    rating: 4.6,
    city: 'Ahmedabad',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=23.0760,72.5085'
  },

  // Jaipur (2)
  {
    id: 'hosp-jpr-fortis',
    displayName: 'Fortis Escorts Hospital, Jaipur',
    formattedAddress: 'Jawaharlal Nehru Marg, Sector 5, Malviya Nagar, Jaipur, Rajasthan 302017',
    latitude: 26.8488,
    longitude: 75.8038,
    rating: 4.5,
    city: 'Jaipur',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=26.8488,75.8038'
  },
  {
    id: 'hosp-jpr-manipal',
    displayName: 'Manipal Hospital, Vidhyadhar Nagar',
    formattedAddress: 'Sector 5, Main Sikar Road, Vidhyadhar Nagar, Jaipur, Rajasthan 302039',
    latitude: 26.9698,
    longitude: 75.7761,
    rating: 4.4,
    city: 'Jaipur',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=26.9698,75.7761'
  },

  // Lucknow (2)
  {
    id: 'hosp-lko-medanta',
    displayName: 'Medanta Hospital, Lucknow',
    formattedAddress: 'Sector 2, Pocket B, Amar Shaheed Path, Golf City, Lucknow, Uttar Pradesh 226030',
    latitude: 26.7909,
    longitude: 80.9780,
    rating: 4.6,
    city: 'Lucknow',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=26.7909,80.9780'
  },
  {
    id: 'hosp-lko-apollo',
    displayName: 'Apollomedics Super Speciality Hospital',
    formattedAddress: 'Sector B, Bargawan, LDA Colony, Kanpur Road, Lucknow, Uttar Pradesh 226012',
    latitude: 26.7915,
    longitude: 80.8953,
    rating: 4.5,
    city: 'Lucknow',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=26.7915,80.8953'
  },

  // Kochi (2)
  {
    id: 'hosp-cok-aster',
    displayName: 'Aster Medcity, Kochi',
    formattedAddress: 'Kuttisahib Road, South Chittoor, Cheranalloor, Kochi, Kerala 682027',
    latitude: 10.0536,
    longitude: 76.2697,
    rating: 4.7,
    city: 'Kochi',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=10.0536,76.2697'
  },
  {
    id: 'hosp-cok-amrita',
    displayName: 'Amrita Institute of Medical Sciences (AIMS)',
    formattedAddress: 'AIMS Ponekkara P.O., Edappally, Kochi, Kerala 682041',
    latitude: 10.0326,
    longitude: 76.2917,
    rating: 4.6,
    city: 'Kochi',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=10.0326,76.2917'
  },

  // Chandigarh / Mohali (2)
  {
    id: 'hosp-chd-fortis',
    displayName: 'Fortis Hospital, Mohali',
    formattedAddress: 'Sector 62, Phase VIII, SAS Nagar, Mohali, Punjab 160062',
    latitude: 30.7046,
    longitude: 76.7179,
    rating: 4.5,
    city: 'Mohali',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=30.7046,76.7179'
  },
  {
    id: 'hosp-chd-pgimer',
    displayName: 'Post Graduate Institute of Medical Education & Research (PGIMER)',
    formattedAddress: 'Madhya Marg, Sector 12, Chandigarh 160012',
    latitude: 30.7651,
    longitude: 76.7758,
    rating: 4.8,
    city: 'Chandigarh',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=30.7651,76.7758'
  },

  // Indore (1)
  {
    id: 'hosp-idr-medanta',
    displayName: 'Medanta Super Speciality Hospital, Indore',
    formattedAddress: 'Scheme No 54, PU4, Commercial Complex, Vijay Nagar, Indore, Madhya Pradesh 452010',
    latitude: 22.7533,
    longitude: 75.8937,
    rating: 4.5,
    city: 'Indore',
    primaryType: 'hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=22.7533,75.8937'
  }
];

export const getCuratedPlaces = (query = '', city = '') => {
  let list = CURATED_MEDICAL_FACILITIES;
  if (city && city.trim()) {
    const c = city.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.city?.toLowerCase().includes(c) ||
        p.formattedAddress?.toLowerCase().includes(c) ||
        (c === 'delhi' && (p.city === 'Delhi' || p.city === 'Gurugram'))
    );
  }
  if (query && query.trim() && !query.toLowerCase().includes('hospital')) {
    const q = query.trim().toLowerCase();
    const filtered = list.filter(
      (p) =>
        p.displayName?.toLowerCase().includes(q) ||
        p.formattedAddress?.toLowerCase().includes(q)
    );
    if (filtered.length > 0) return filtered;
  }
  return list;
};
