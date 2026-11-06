import React, { createContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { doctorService } from '../services/doctorService';
import { placeService } from '../services/placeService';
import { CURATED_MEDICAL_FACILITIES, getCuratedPlaces } from '../constants/medicalFacilities';

export const DoctorSearchContext = createContext(null);

const CACHE_KEY = 'caresync_doctor_search_state_v1';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes expiration strategy

/**
 * Safely hydrate previous search and map state from sessionStorage.
 * Validates expiration, structure, and integrity to prevent corrupted crashes.
 */
const loadInitialState = () => {
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
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      sessionStorage.removeItem(CACHE_KEY);
      return defaultState;
    }

    // Check cache expiration
    const now = Date.now();
    if (!parsed.timestamp || now - parsed.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return defaultState;
    }

    // Validate and sanitize data types
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
  } catch (err) {
    console.warn('Failed to parse cached doctor search state from sessionStorage:', err);
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // ignore
    }
    return defaultState;
  }
};

export const DoctorSearchProvider = ({ children }) => {
  const initial = useMemo(() => loadInitialState(), []);

  // UI Tab State: 'doctors' | 'places'
  const [activeTab, setActiveTab] = useState(initial.activeTab);

  // Doctors Tab Search State
  const [name, setName] = useState(initial.name);
  const [specialization, setSpecialization] = useState(initial.specialization);
  const [location, setLocation] = useState(initial.location);
  const [doctors, setDoctors] = useState(initial.doctors);
  const [hasDoctorsFetched, setHasDoctorsFetched] = useState(initial.hasDoctorsFetched);
  const [isLoading, setIsLoading] = useState(false);

  // Places Tab Search State
  const [placesQuery, setPlacesQuery] = useState(initial.placesQuery);
  const [placesCity, setPlacesCity] = useState(initial.placesCity);
  const [placesType, setPlacesType] = useState(initial.placesType);
  const [places, setPlaces] = useState(initial.places);
  const [hasPlacesFetched, setHasPlacesFetched] = useState(initial.hasPlacesFetched);
  const [nextPageToken, setNextPageToken] = useState(initial.nextPageToken);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [placesError, setPlacesError] = useState(null);
  const [placesStatus, setPlacesStatus] = useState(null);
  const [placesAttribution, setPlacesAttribution] = useState('');
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(null);

  // Map Navigation & Highlight State
  const [selectedPlaceId, setSelectedPlaceId] = useState(initial.selectedPlaceId);
  const [mapCenter, setMapCenter] = useState(initial.mapCenter);
  const [mapZoom, setMapZoom] = useState(initial.mapZoom);

  // Search Metadata
  const [lastSearchedAt, setLastSearchedAt] = useState(initial.lastSearchedAt);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sequence Request IDs to prevent race conditions from asynchronous overwrites
  const doctorsRequestIdRef = useRef(0);
  const placesRequestIdRef = useRef(0);

  // Save non-sensitive search state to sessionStorage whenever it updates
  useEffect(() => {
    try {
      const stateToPersist = {
        activeTab,
        name,
        specialization,
        location,
        doctors,
        hasDoctorsFetched,
        placesQuery,
        placesCity,
        placesType,
        places,
        hasPlacesFetched,
        nextPageToken,
        selectedPlaceId,
        mapCenter,
        mapZoom,
        lastSearchedAt,
        timestamp: Date.now()
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(stateToPersist));
    } catch (err) {
      console.warn('Unable to persist doctor search state to sessionStorage:', err);
    }
  }, [
    activeTab,
    name,
    specialization,
    location,
    doctors,
    hasDoctorsFetched,
    placesQuery,
    placesCity,
    placesType,
    places,
    hasPlacesFetched,
    nextPageToken,
    selectedPlaceId,
    mapCenter,
    mapZoom,
    lastSearchedAt
  ]);

  /**
   * Status check to see if Google Places backend integration is active.
   */
  const checkPlacesStatus = useCallback(async () => {
    try {
      const status = await placeService.getStatus();
      setPlacesStatus(status);
      if (status?.attribution) {
        setPlacesAttribution(status.attribution);
      }
    } catch (err) {
      console.warn('Google Places status endpoint unreachable:', err);
    }
  }, []);

  /**
   * Search doctors with race condition protection and optional cache bypass.
   */
  const fetchDoctors = useCallback(
    async (overrideParams = {}, forceRefetch = false) => {
      const reqId = ++doctorsRequestIdRef.current;
      setIsLoading(true);

      const queryName = overrideParams.name !== undefined ? overrideParams.name : name;
      const querySpec = overrideParams.specialization !== undefined ? overrideParams.specialization : specialization;
      const queryLoc = overrideParams.location !== undefined ? overrideParams.location : location;

      try {
        const data = await doctorService.searchDoctors({
          name: queryName.trim() || undefined,
          specialization: querySpec.trim() || undefined,
          location: queryLoc.trim() || undefined
        });

        // Ignore out-of-order responses
        if (reqId === doctorsRequestIdRef.current) {
          setDoctors(data || []);
          setHasDoctorsFetched(true);
          setLastSearchedAt(Date.now());
        }
      } catch (err) {
        console.error('Failed to search doctors:', err);
      } finally {
        if (reqId === doctorsRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [name, specialization, location]
  );

  /**
   * Search Google Places healthcare facilities with curated fallback and race protection.
   */
  const fetchPlaces = useCallback(
    async (query, city, placeType, pageToken = null, append = false, forceRefetch = false) => {
      const reqId = ++placesRequestIdRef.current;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsPlacesLoading(true);
        setPlacesError(null);
        setRetryAfterSeconds(null);
      }

      const q = query !== undefined ? query : placesQuery;
      const c = city !== undefined ? city : placesCity;
      const t = placeType !== undefined ? placeType : placesType;

      const curated = getCuratedPlaces(q, c);

      try {
        const res = await placeService.searchPlaces({
          query: q.trim() || 'Hospital',
          city: c.trim() || undefined,
          placeType: t || undefined,
          pageToken: pageToken || undefined,
          pageSize: 20
        });

        if (reqId !== placesRequestIdRef.current) return;

        const returnedPlaces = res.places || [];

        // Merge Google Places results with verified curated healthcare network
        const merged = [...returnedPlaces];
        const existingNames = new Set(
          returnedPlaces.map((p) => (p.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, ''))
        );

        curated.forEach((cp) => {
          const cleanName = (cp.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!existingNames.has(cleanName)) {
            merged.push(cp);
            existingNames.add(cleanName);
          }
        });

        if (append) {
          setPlaces((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const unique = merged.filter((p) => !existingIds.has(p.id));
            return [...prev, ...unique];
          });
        } else {
          setPlaces(merged.length > 0 ? merged : curated);
        }

        setNextPageToken(res.nextPageToken || null);
        if (res.attribution) setPlacesAttribution(res.attribution);
        setHasPlacesFetched(true);
        setLastSearchedAt(Date.now());
      } catch (err) {
        if (reqId !== placesRequestIdRef.current) return;

        // Gracefully fall back to the 42 curated verified hospital locations
        if (!append) {
          setPlaces(curated);
        }

        if (err.response?.status === 429) {
          const retryHeader = err.response.headers?.['retry-after'];
          const secs = retryHeader ? parseInt(retryHeader, 10) : 60;
          setRetryAfterSeconds(secs);
          setPlacesError(
            `Per-minute rate limit reached. Displaying ${curated.length} verified hospital locations across India.`
          );
        } else if (err.response?.status === 503) {
          setPlacesAttribution('Showing verified CareSync partner healthcare network across India.');
        } else if (err.response?.status === 401) {
          setPlacesAttribution('Showing verified CareSync partner healthcare network across India.');
        } else {
          setPlacesAttribution('Showing verified CareSync partner healthcare network across India.');
        }
        setHasPlacesFetched(true);
      } finally {
        if (reqId === placesRequestIdRef.current) {
          setIsPlacesLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [placesQuery, placesCity, placesType]
  );

  /**
   * Manual refresh action to fetch fresh results for both doctors and places.
   */
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchDoctors({}, true),
        fetchPlaces(placesQuery, placesCity, placesType, null, false, true),
        checkPlacesStatus()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchDoctors, fetchPlaces, checkPlacesStatus, placesQuery, placesCity, placesType]);

  const refreshDoctors = useCallback(async () => {
    return fetchDoctors({}, true);
  }, [fetchDoctors]);

  const refreshPlaces = useCallback(async () => {
    return fetchPlaces(placesQuery, placesCity, placesType, null, false, true);
  }, [fetchPlaces, placesQuery, placesCity, placesType]);

  /**
   * Filter resets
   */
  const resetDoctorFilters = useCallback(() => {
    setName('');
    setSpecialization('');
    setLocation('');
    fetchDoctors({ name: '', specialization: '', location: '' }, true);
  }, [fetchDoctors]);

  const resetPlacesFilters = useCallback(() => {
    setPlacesQuery('Hospital');
    setPlacesCity('');
    setPlacesType('hospital');
    fetchPlaces('Hospital', '', 'hospital', null, false, true);
  }, [fetchPlaces]);

  /**
   * Save map center and zoom level so view remains preserved on navigation.
   */
  const setMapPosition = useCallback((center, zoom) => {
    if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      setMapCenter(center);
    }
    if (typeof zoom === 'number') {
      setMapZoom(zoom);
    }
  }, []);

  /**
   * Group verified doctors by hospital GPS coordinates into map-renderable facilities.
   */
  const doctorPracticePlaces = useMemo(() => {
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
  }, [doctors]);

  /**
   * Find doctors associated with a Google Place facility.
   */
  const findMatchingDoctorsForPlace = useCallback(
    (place) => {
      if (!doctors || doctors.length === 0 || !place.displayName) return [];
      const placeNameLower = place.displayName.toLowerCase();

      return doctors.filter((doc) => {
        const docHospital = (doc.hospitalName || '').toLowerCase();
        if (docHospital && (placeNameLower.includes(docHospital) || docHospital.includes(placeNameLower))) {
          return true;
        }
        return false;
      });
    },
    [doctors]
  );

  /**
   * Determine currently active place object from ID.
   */
  const activePlace = useMemo(() => {
    if (!selectedPlaceId) return null;
    if (activeTab === 'doctors') {
      return doctorPracticePlaces.find((p) => p.id === selectedPlaceId) || null;
    }
    return places.find((p) => p.id === selectedPlaceId) || null;
  }, [selectedPlaceId, activeTab, doctorPracticePlaces, places]);

  const value = {
    // Navigation / Tab
    activeTab,
    setActiveTab,

    // Doctor Search
    name,
    setName,
    specialization,
    setSpecialization,
    location,
    setLocation,
    doctors,
    setDoctors,
    doctorPracticePlaces,
    hasDoctorsFetched,
    isLoading,
    fetchDoctors,
    resetDoctorFilters,
    findMatchingDoctorsForPlace,

    // Places Search
    placesQuery,
    setPlacesQuery,
    placesCity,
    setPlacesCity,
    placesType,
    setPlacesType,
    places,
    setPlaces,
    hasPlacesFetched,
    nextPageToken,
    isPlacesLoading,
    isLoadingMore,
    placesError,
    placesStatus,
    placesAttribution,
    retryAfterSeconds,
    fetchPlaces,
    checkPlacesStatus,
    resetPlacesFilters,

    // Map & Location State
    selectedPlaceId,
    setSelectedPlaceId,
    activePlace,
    mapCenter,
    mapZoom,
    setMapPosition,

    // Manual Refresh & Metadata
    lastSearchedAt,
    isRefreshing,
    refreshAll,
    refreshDoctors,
    refreshPlaces
  };

  return <DoctorSearchContext.Provider value={value}>{children}</DoctorSearchContext.Provider>;
};
