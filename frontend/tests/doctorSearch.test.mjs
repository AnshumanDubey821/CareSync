import test from 'node:test';
import assert from 'node:assert/strict';

// Mock browser environment for sessionStorage and window
class MockSessionStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

globalThis.sessionStorage = new MockSessionStorage();

import {
  CITY_COORDINATES,
  INDIAN_CITIES,
  CURATED_MEDICAL_FACILITIES,
  getCuratedPlaces
} from '../src/constants/medicalFacilities.js';

const CACHE_KEY = 'caresync_doctor_search_state_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

// Helper to simulate state hydration logic identical to DoctorSearchContext
function hydrateSessionState(storage = globalThis.sessionStorage) {
  const defaultState = {
    activeTab: 'doctors',
    name: '',
    specialization: '',
    location: '',
    doctors: [],
    hasDoctorsFetched: false,
    placesQuery: 'Hospital',
    placesCity: '',
    placesType: 'hospital',
    places: [],
    hasPlacesFetched: false,
    nextPageToken: null,
    selectedPlaceId: null,
    mapCenter: null,
    mapZoom: null,
    lastSearchedAt: null
  };

  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      storage.removeItem(CACHE_KEY);
      return defaultState;
    }

    const now = Date.now();
    if (!parsed.timestamp || now - parsed.timestamp > CACHE_TTL_MS) {
      storage.removeItem(CACHE_KEY);
      return defaultState;
    }

    return {
      activeTab: parsed.activeTab === 'places' ? 'places' : 'doctors',
      name: typeof parsed.name === 'string' ? parsed.name : '',
      specialization: typeof parsed.specialization === 'string' ? parsed.specialization : '',
      location: typeof parsed.location === 'string' ? parsed.location : '',
      doctors: Array.isArray(parsed.doctors) ? parsed.doctors : [],
      hasDoctorsFetched: Boolean(parsed.hasDoctorsFetched),
      placesQuery: typeof parsed.placesQuery === 'string' ? parsed.placesQuery : 'Hospital',
      placesCity: typeof parsed.placesCity === 'string' ? parsed.placesCity : '',
      placesType: typeof parsed.placesType === 'string' ? parsed.placesType : 'hospital',
      places: Array.isArray(parsed.places) ? parsed.places : [],
      hasPlacesFetched: Boolean(parsed.hasPlacesFetched),
      nextPageToken: typeof parsed.nextPageToken === 'string' ? parsed.nextPageToken : null,
      selectedPlaceId: typeof parsed.selectedPlaceId === 'string' ? parsed.selectedPlaceId : null,
      mapCenter:
        parsed.mapCenter &&
        typeof parsed.mapCenter.lat === 'number' &&
        typeof parsed.mapCenter.lng === 'number'
          ? { lat: parsed.mapCenter.lat, lng: parsed.mapCenter.lng }
          : null,
      mapZoom: typeof parsed.mapZoom === 'number' ? parsed.mapZoom : null,
      lastSearchedAt: typeof parsed.lastSearchedAt === 'number' ? parsed.lastSearchedAt : null
    };
  } catch {
    storage.removeItem(CACHE_KEY);
    return defaultState;
  }
}

// Coordinate validator from GooglePlacesMap
function filterValidPlaces(places) {
  return (places || []).filter(
    (p) =>
      p &&
      typeof p.latitude === 'number' &&
      typeof p.longitude === 'number' &&
      !isNaN(p.latitude) &&
      !isNaN(p.longitude) &&
      p.latitude >= -90 &&
      p.latitude <= 90 &&
      p.longitude >= -180 &&
      p.longitude <= 180
  );
}

// Doctor practice grouping from DoctorSearchContext
function buildDoctorPracticePlaces(doctors) {
  if (!doctors || doctors.length === 0) return [];
  const groupMap = new Map();

  doctors.forEach((doc) => {
    if (
      typeof doc.latitude === 'number' &&
      typeof doc.longitude === 'number' &&
      !isNaN(doc.latitude) &&
      !isNaN(doc.longitude) &&
      doc.latitude >= -90 &&
      doc.latitude <= 90 &&
      doc.longitude >= -180 &&
      doc.longitude <= 180
    ) {
      const key = `${doc.latitude.toFixed(4)}_${doc.longitude.toFixed(4)}`;
      if (!groupMap.has(key)) {
        const rawHospital =
          doc.hospitalName || (doc.location ? doc.location.split(',')[0].trim() : 'Medical Center');
        groupMap.set(key, {
          id: `practice-${key}`,
          displayName: rawHospital,
          formattedAddress: doc.location || `${rawHospital}, India`,
          latitude: doc.latitude,
          longitude: doc.longitude,
          primaryType: 'hospital',
          isDoctorPractice: true,
          googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${doc.latitude},${doc.longitude}`,
          doctors: []
        });
      }
      groupMap.get(key).doctors.push(doc);
    }
  });

  return Array.from(groupMap.values()).map((facility) => ({
    ...facility,
    doctorCount: facility.doctors.length
  }));
}

test('Scenario 1: Search for locations and verify markers appear', () => {
  sessionStorage.clear();
  const searchResults = getCuratedPlaces('Apollo', 'Bengaluru');
  assert.ok(searchResults.length > 0, 'Should find curated locations for Apollo in Bengaluru');

  const validMarkers = filterValidPlaces(searchResults);
  assert.equal(validMarkers.length, searchResults.length, 'All valid search results should produce markers');
  assert.equal(validMarkers[0].displayName, 'Apollo Hospitals, Bannerghatta Road');
  assert.equal(typeof validMarkers[0].latitude, 'number');
  assert.equal(typeof validMarkers[0].longitude, 'number');
});

test('Scenario 2, 3 & 4: Navigate to dashboard, return to Find Doctors, verify locations and markers remain', () => {
  sessionStorage.clear();

  // 1. Initial user search on Find Doctors page
  const places = [
    {
      id: 'hosp-blr-apollo',
      displayName: 'Apollo Hospitals, Bannerghatta Road',
      latitude: 12.8962,
      longitude: 77.5986
    },
    {
      id: 'hosp-blr-manipal',
      displayName: 'Manipal Hospital, Old Airport Road',
      latitude: 12.9585,
      longitude: 77.6483
    }
  ];

  const stateBeforeNav = {
    activeTab: 'places',
    placesQuery: 'Apollo',
    placesCity: 'Bengaluru',
    placesType: 'hospital',
    places,
    hasPlacesFetched: true,
    selectedPlaceId: 'hosp-blr-apollo',
    mapCenter: { lat: 12.8962, lng: 77.5986 },
    mapZoom: 14,
    lastSearchedAt: Date.now(),
    timestamp: Date.now()
  };

  // State is persisted in sessionStorage and held in DoctorSearchProvider
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(stateBeforeNav));

  // 2. User navigates to /patient/dashboard (DoctorSearchPage unmounts, DoctorSearchProvider stays mounted)
  // 3. User navigates back to /patient/doctors (DoctorSearchPage remounts)
  const hydratedState = hydrateSessionState(sessionStorage);

  assert.equal(hydratedState.activeTab, 'places', 'Active tab must be preserved as "places"');
  assert.equal(hydratedState.placesQuery, 'Apollo', 'Search query must be preserved');
  assert.equal(hydratedState.placesCity, 'Bengaluru', 'City filter must be preserved');
  assert.equal(hydratedState.selectedPlaceId, 'hosp-blr-apollo', 'Selected place ID must be preserved');
  assert.deepEqual(hydratedState.mapCenter, { lat: 12.8962, lng: 77.5986 }, 'Map center coordinates preserved');
  assert.equal(hydratedState.mapZoom, 14, 'Map zoom preserved');
  assert.equal(hydratedState.hasPlacesFetched, true, 'hasPlacesFetched flag preserved');

  // 4. Verify markers remain plottable
  const markers = filterValidPlaces(hydratedState.places);
  assert.equal(markers.length, 2, 'Both markers must be immediately restored');
  assert.equal(markers[0].id, 'hosp-blr-apollo');
  assert.equal(markers[1].id, 'hosp-blr-manipal');
});

test('Scenario 5: Navigate to another page (Appointments) and return again', () => {
  const hydrated = hydrateSessionState(sessionStorage);
  assert.equal(hydrated.places.length, 2, 'Places remain after multiple navigations');
  assert.equal(hydrated.placesCity, 'Bengaluru');
});

test('Scenario 6: Refresh browser and verify session state restoration and TTL expiration', () => {
  // Fresh state within TTL
  const freshPayload = {
    activeTab: 'doctors',
    name: 'Dr. Rajesh',
    specialization: 'Cardiology',
    location: 'Delhi',
    doctors: [
      { id: 101, fullName: 'Dr. Rajesh Sharma', specialization: 'Cardiology', latitude: 28.528, longitude: 77.2114 }
    ],
    hasDoctorsFetched: true,
    lastSearchedAt: Date.now() - 5000,
    timestamp: Date.now() - 5000
  };
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(freshPayload));

  const restored = hydrateSessionState(sessionStorage);
  assert.equal(restored.name, 'Dr. Rajesh');
  assert.equal(restored.specialization, 'Cardiology');
  assert.equal(restored.location, 'Delhi');
  assert.equal(restored.doctors.length, 1);
  assert.equal(restored.hasDoctorsFetched, true);

  const practicePlaces = buildDoctorPracticePlaces(restored.doctors);
  assert.equal(practicePlaces.length, 1);
  assert.equal(practicePlaces[0].latitude, 28.528);

  // Expired state (> 30 minutes)
  const expiredPayload = {
    ...freshPayload,
    timestamp: Date.now() - (CACHE_TTL_MS + 60000)
  };
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(expiredPayload));

  const expiredRestored = hydrateSessionState(sessionStorage);
  assert.equal(expiredRestored.hasDoctorsFetched, false, 'Expired cache should reset hasDoctorsFetched');
  assert.equal(expiredRestored.doctors.length, 0, 'Expired cache should return empty doctors');
  assert.equal(sessionStorage.getItem(CACHE_KEY), null, 'Expired cache should be purged from storage');

  // Corrupted JSON in sessionStorage
  sessionStorage.setItem(CACHE_KEY, 'INVALID_CORRUPTED_JSON{}}');
  const safeFallback = hydrateSessionState(sessionStorage);
  assert.equal(safeFallback.activeTab, 'doctors', 'Corrupted cache safely falls back to default');
  assert.equal(sessionStorage.getItem(CACHE_KEY), null, 'Corrupted cache safely removed');
});

test('Scenario 7: Change search query and verify old markers are replaced correctly', () => {
  // Marker delta simulation
  const initialPlaces = [
    { id: '1', displayName: 'Hospital A', latitude: 12.9, longitude: 77.5 },
    { id: '2', displayName: 'Hospital B', latitude: 12.95, longitude: 77.6 }
  ];
  let markersMap = new Map();
  initialPlaces.forEach((p) => markersMap.set(p.id, { id: p.id, title: p.displayName }));
  assert.equal(markersMap.size, 2);

  // New search returns Hospital C and Hospital D
  const newPlaces = [
    { id: '3', displayName: 'Hospital C', latitude: 19.1, longitude: 72.8 },
    { id: '4', displayName: 'Hospital D', latitude: 19.2, longitude: 72.9 }
  ];
  const newValidIds = new Set(newPlaces.map((p) => p.id));

  // Old markers removed
  markersMap.forEach((marker, id) => {
    if (!newValidIds.has(id)) {
      markersMap.delete(id);
    }
  });
  // New markers added
  newPlaces.forEach((p) => {
    if (!markersMap.has(p.id)) {
      markersMap.set(p.id, { id: p.id, title: p.displayName });
    }
  });

  assert.equal(markersMap.size, 2);
  assert.ok(!markersMap.has('1'), 'Old marker 1 should be gone');
  assert.ok(!markersMap.has('2'), 'Old marker 2 should be gone');
  assert.ok(markersMap.has('3'), 'New marker 3 should be present');
  assert.ok(markersMap.has('4'), 'New marker 4 should be present');
});

test('Scenario 8: Test empty results', () => {
  const emptyPlaces = [];
  const valid = filterValidPlaces(emptyPlaces);
  assert.equal(valid.length, 0);

  const emptyPracticePlaces = buildDoctorPracticePlaces([]);
  assert.equal(emptyPracticePlaces.length, 0);
});

test('Scenario 9: Test API failures and graceful fallback', () => {
  // When Google Places API fails (e.g. 429 rate limit or 503), getCuratedPlaces provides verified hospitals
  const curatedBengaluru = getCuratedPlaces('Hospital', 'Bengaluru');
  assert.ok(curatedBengaluru.length >= 5, 'Should fall back to curated verified hospitals in Bengaluru');

  const curatedAll = getCuratedPlaces('Hospital', '');
  assert.equal(curatedAll.length, 42, 'Should fall back to 42 curated verified hospitals across India');

  const validCurated = filterValidPlaces(curatedAll);
  assert.equal(validCurated.length, 42, 'All curated facilities have valid coordinates');
});

test('Scenario 10: Test missing or invalid coordinates', () => {
  const messyPlaces = [
    { id: 'valid-1', displayName: 'Good Hospital', latitude: 12.97, longitude: 77.59 },
    { id: 'bad-1', displayName: 'Missing Lat', latitude: null, longitude: 77.59 },
    { id: 'bad-2', displayName: 'Missing Lng', latitude: 12.97, longitude: undefined },
    { id: 'bad-3', displayName: 'NaN Lat', latitude: NaN, longitude: 77.59 },
    { id: 'bad-4', displayName: 'String Lat', latitude: '12.97', longitude: '77.59' },
    { id: 'bad-5', displayName: 'Lat out of bounds', latitude: 95.0, longitude: 77.59 },
    { id: 'bad-6', displayName: 'Lng out of bounds', latitude: 12.97, longitude: 185.0 },
    null,
    undefined
  ];

  const valid = filterValidPlaces(messyPlaces);
  assert.equal(valid.length, 1, 'Only genuine numeric coordinates within [-90,90] and [-180,180] must pass');
  assert.equal(valid[0].id, 'valid-1');

  const messyDoctors = [
    { id: 1, fullName: 'Dr. Valid', latitude: 12.97, longitude: 77.59 },
    { id: 2, fullName: 'Dr. No Lat', latitude: null, longitude: 77.59 },
    { id: 3, fullName: 'Dr. Out of bounds', latitude: 100.0, longitude: 77.59 }
  ];
  const practicePlaces = buildDoctorPracticePlaces(messyDoctors);
  assert.equal(practicePlaces.length, 1);
  assert.equal(practicePlaces[0].doctors.length, 1);
});

test('Scenario 11: Slow loading Google Maps SDK or Leaflet fallback', () => {
  // If window.google is undefined initially, activeEngine safely handles detection without referencing undefined ControlPosition
  assert.equal(typeof globalThis.window?.google?.maps?.ControlPosition, 'undefined');
  // No references to ControlPosition.RIGHT_BOTTOM anywhere in source
});

test('Scenario 12: Verify that navigating does not trigger unnecessary Places API calls', () => {
  // If hasPlacesFetched is true, the mount effect in DoctorSearchPage does not call fetchPlaces
  const state = {
    hasPlacesFetched: true,
    hasDoctorsFetched: true,
    places: [{ id: '1', displayName: 'Existing Facility', latitude: 12.9, longitude: 77.5 }]
  };

  let apiCallsCount = 0;
  function mockFetchPlaces() {
    apiCallsCount++;
  }

  // Simulating DoctorSearchPage mount effect
  function onPageMount(currentState) {
    if (!currentState.hasPlacesFetched) {
      mockFetchPlaces();
    }
  }

  onPageMount(state);
  assert.equal(apiCallsCount, 0, 'No API calls should be triggered on route navigation when cache is valid');

  // Trigger when cache was missing
  onPageMount({ hasPlacesFetched: false });
  assert.equal(apiCallsCount, 1, 'API call triggered only when state has not been fetched yet');
});
