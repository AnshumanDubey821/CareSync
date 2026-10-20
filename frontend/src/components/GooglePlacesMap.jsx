import React, { useEffect, useRef, useState, useCallback, Component } from 'react';
import {
  MapPin,
  Building2,
  Star,
  ExternalLink,
  Stethoscope,
  X,
  Navigation,
  Compass,
  AlertTriangle,
  Info,
  Layers,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

/**
 * City coordinate defaults across major Indian metropolitan regions.
 */
const CITY_COORDINATES = {
  Bengaluru: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  Bangalore: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  Mumbai: { lat: 19.0760, lng: 72.8777, zoom: 12 },
  'Delhi NCR': { lat: 28.6139, lng: 77.2090, zoom: 11 },
  Delhi: { lat: 28.6139, lng: 77.2090, zoom: 11 },
  Hyderabad: { lat: 17.3850, lng: 78.4867, zoom: 12 },
  Chennai: { lat: 13.0827, lng: 80.2707, zoom: 12 },
  Pune: { lat: 18.5204, lng: 73.8567, zoom: 12 },
  Kolkata: { lat: 22.5726, lng: 88.3639, zoom: 12 },
  India: { lat: 20.5937, lng: 78.9629, zoom: 5 }
};

/**
 * Custom SVG Marker Icon Generator for Google Maps & Leaflet
 */
const createMarkerSvgString = (isSelected = false) => {
  const pinColor = isSelected ? '#e11d48' : '#1e60f2'; // Rose-600 when selected, Primary-600 default
  const strokeColor = isSelected ? '#881337' : '#0d213f'; // Dark outline
  const scale = isSelected ? 1.25 : 1.0;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${36 * scale}" height="${48 * scale}" viewBox="0 0 36 48">
      <defs>
        <filter id="pin-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M18 0 C8.06 0 0 8.06 0 18 C0 29.5 18 48 18 48 C18 48 36 29.5 36 18 C36 8.06 27.94 0 18 0 Z"
            fill="${pinColor}" stroke="${strokeColor}" stroke-width="1.5" filter="url(#pin-shadow)" />
      <circle cx="18" cy="18" r="11" fill="#ffffff" />
      <rect x="15.5" y="10" width="5" height="16" rx="1.5" fill="${pinColor}" />
      <rect x="10" y="15.5" width="16" height="5" rx="1.5" fill="${pinColor}" />
    </svg>
  `;
};

const createGoogleMarkerIcon = (isSelected = false) => {
  const svg = createMarkerSvgString(isSelected);
  const scale = isSelected ? 1.25 : 1.0;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: window.google?.maps?.Size
      ? new window.google.maps.Size(36 * scale, 48 * scale)
      : undefined,
    anchor: window.google?.maps?.Point
      ? new window.google.maps.Point(18 * scale, 48 * scale)
      : undefined
  };
};

/**
 * Modern Google Maps styling with gentle healthcare-friendly contrast
 */
const MAP_STYLES = [
  {
    featureType: 'poi.medical',
    elementType: 'geometry',
    stylers: [{ color: '#e8f4fd' }]
  },
  {
    featureType: 'poi.medical',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1e60f2' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#d9e8fb' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }]
  }
];

/**
 * Error boundary component to prevent map rendering issues from breaking the entire page
 */
export class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MapErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-navy-900">Healthcare Map View Temporarily Unavailable</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The interactive map canvas encountered a browser initialization issue. You can still browse and select doctors and verified clinics normally below.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const GooglePlacesMap = ({
  places = [],
  selectedPlaceId = null,
  onSelectPlace = () => {},
  onSelectFacilityForDoctorSearch = () => {},
  activeCity = '',
  isLoading = false,
  error = null,
  height = 'h-[440px]',
  title = 'Interactive Clinic & Hospital Map',
  subtitle = 'Real-time healthcare facility markers powered by Google Places (New) coordinates'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null); // google.maps.Map OR L.Map
  const markersRef = useRef([]); // google.maps.Marker[] OR L.Marker[]
  const infoWindowRef = useRef(null);

  const [activeEngine, setActiveEngine] = useState('detecting'); // 'google' | 'leaflet' | 'detecting'
  const [createdMarkersCount, setCreatedMarkersCount] = useState(0);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [scriptLoadError, setScriptLoadError] = useState(null);
  const [initError, setInitError] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [apiNotActivated, setApiNotActivated] = useState(false);
  const [activePlace, setActivePlace] = useState(null);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Intercept Google Maps error messages (e.g. ApiNotActivatedMapError) to switch to fallback tile engine
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = args.map((a) => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
      if (
        msg.includes('ApiNotActivatedMapError') ||
        msg.includes('This API is not activated on your API project')
      ) {
        setApiNotActivated(true);
        setActiveEngine('leaflet');
      } else if (msg.includes('RefererNotAllowedMapError') || msg.includes('InvalidKeyMapError')) {
        setAuthError(true);
        setActiveEngine('leaflet');
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Synchronize internal activePlace when selectedPlaceId prop changes
  useEffect(() => {
    if (selectedPlaceId) {
      const match = places.find((p) => p.id === selectedPlaceId);
      if (match) setActivePlace(match);
    }
  }, [selectedPlaceId, places]);

  // Load Google Maps JavaScript API script
  useEffect(() => {
    if (!apiKey) {
      setActiveEngine('leaflet');
      return;
    }

    window.gm_authFailure = () => {
      console.warn('Google Maps API authentication failed.');
      setAuthError(true);
      setActiveEngine('leaflet');
    };

    if (window.google?.maps?.Map) {
      setIsScriptLoaded(true);
      setActiveEngine((prev) => (prev === 'detecting' ? 'google' : prev));
      return;
    }

    const existingScript = document.getElementById('google-maps-js-sdk');
    if (existingScript) {
      if (window.google?.maps?.Map) {
        setIsScriptLoaded(true);
        setActiveEngine((prev) => (prev === 'detecting' ? 'google' : prev));
      } else {
        existingScript.addEventListener('load', () => {
          if (window.google?.maps?.Map) {
            setIsScriptLoaded(true);
            setActiveEngine((prev) => (prev === 'detecting' ? 'google' : prev));
          }
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps?.Map) {
        setIsScriptLoaded(true);
        setActiveEngine((prev) => (prev === 'detecting' ? 'google' : prev));
      } else {
        const checkTimer = setInterval(() => {
          if (window.google?.maps?.Map) {
            clearInterval(checkTimer);
            setIsScriptLoaded(true);
            setActiveEngine((prev) => (prev === 'detecting' ? 'google' : prev));
          }
        }, 50);
        setTimeout(() => clearInterval(checkTimer), 3000);
      }
    };

    script.onerror = () => {
      setScriptLoadError('Unable to load Google Maps SDK');
      setActiveEngine('leaflet');
    };

    document.head.appendChild(script);
  }, [apiKey]);

  // Dynamically load Leaflet for guaranteed tile rendering fallback
  useEffect(() => {
    if (activeEngine !== 'leaflet') return;

    if (window.L) {
      setIsLeafletLoaded(true);
      return;
    }

    // Add Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Add Leaflet JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setIsLeafletLoaded(true);
      script.onerror = () => setInitError('Could not load map tile engine.');
      document.head.appendChild(script);
    } else {
      const existing = document.getElementById('leaflet-js');
      existing.addEventListener('load', () => setIsLeafletLoaded(true));
    }
  }, [activeEngine]);

  // Initialize Map Instance (Google Maps or Leaflet)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map instance if engine switches
    if (mapInstanceRef.current && typeof mapInstanceRef.current.remove === 'function') {
      try {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      } catch (e) {
        // ignore
      }
    }

    const cityKey = activeCity || 'Bengaluru';
    const initialCenter = CITY_COORDINATES[cityKey] || CITY_COORDINATES.Bengaluru;

    // ENGINE A: GOOGLE MAPS
    if (activeEngine === 'google' && isScriptLoaded && window.google?.maps?.Map && !authError && !apiNotActivated) {
      try {
        mapContainerRef.current.innerHTML = '';
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: initialCenter.lat, lng: initialCenter.lng },
          zoom: initialCenter.zoom,
          styles: MAP_STYLES,
          mapTypeId: mapType,
          mapTypeControl: false,
          streetViewControl: true,
          zoomControl: true,
          fullscreenControl: true
        });

        mapInstanceRef.current = map;
        if (window.google?.maps?.InfoWindow) {
          infoWindowRef.current = new window.google.maps.InfoWindow();
        }

        map.addListener('click', () => {
          setActivePlace(null);
          if (infoWindowRef.current) infoWindowRef.current.close();
        });

        // Trigger resize after mounting to ensure full tile rendering
        setTimeout(() => {
          if (window.google?.maps?.event) {
            window.google.maps.event.trigger(map, 'resize');
          }
        }, 200);
      } catch (err) {
        console.warn('Google Maps init threw error, switching to OpenStreetMap tiles:', err);
        setActiveEngine('leaflet');
      }
    }

    // ENGINE B: LEAFLET (GUARANTEED OPENSTREETMAP REAL TILES)
    if (activeEngine === 'leaflet' && isLeafletLoaded && window.L) {
      try {
        mapContainerRef.current.innerHTML = '';
        const L = window.L;
        const map = L.map(mapContainerRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom: initialCenter.zoom,
          zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors • CareSync Healthcare Network'
        }).addTo(map);

        map.on('click', () => {
          setActivePlace(null);
        });

        mapInstanceRef.current = map;

        // Invalidate size to guarantee immediate full canvas tile coverage
        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      } catch (err) {
        console.error('Leaflet initialization failed:', err);
        setInitError('Failed to initialize map canvas.');
      }
    }
  }, [activeEngine, isScriptLoaded, isLeafletLoaded, authError, apiNotActivated, activeCity]);

  // Handle Map Type Toggle (Roadmap vs Satellite) for Google Maps
  const toggleMapType = () => {
    if (!mapInstanceRef.current) return;
    if (activeEngine === 'google' && typeof mapInstanceRef.current.setMapTypeId === 'function') {
      const nextType = mapType === 'roadmap' ? 'hybrid' : 'roadmap';
      mapInstanceRef.current.setMapTypeId(nextType);
      setMapType(nextType);
    }
  };

  // Center map on specified coordinates
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const cityKey = activeCity || 'Bengaluru';
    const coords = CITY_COORDINATES[cityKey] || CITY_COORDINATES.Bengaluru;

    try {
      if (activeEngine === 'google' && typeof mapInstanceRef.current.panTo === 'function') {
        mapInstanceRef.current.panTo({ lat: coords.lat, lng: coords.lng });
        mapInstanceRef.current.setZoom(coords.zoom);
      } else if (activeEngine === 'leaflet' && typeof mapInstanceRef.current.setView === 'function') {
        mapInstanceRef.current.setView([coords.lat, coords.lng], coords.zoom);
      }
    } catch (e) {
      console.warn('Could not recenter map:', e);
    }
  }, [activeCity, activeEngine]);

  // Render & Update Markers when Places change (Strictly track createdMarkersCount)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Filter places that have genuine numeric latitude and longitude
    const validPlaces = places.filter(
      (p) =>
        typeof p.latitude === 'number' &&
        typeof p.longitude === 'number' &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
    );

    // MODE 1: GOOGLE MAPS MARKERS
    if (activeEngine === 'google' && window.google?.maps?.Marker && window.google?.maps?.LatLngBounds) {
      try {
        const map = mapInstanceRef.current;

        // Clear existing markers
        markersRef.current.forEach((m) => {
          if (m && typeof m.setMap === 'function') m.setMap(null);
        });
        markersRef.current = [];

        if (validPlaces.length === 0) {
          setCreatedMarkersCount(0);
          if (activeCity && CITY_COORDINATES[activeCity]) {
            const c = CITY_COORDINATES[activeCity];
            map.panTo({ lat: c.lat, lng: c.lng });
            map.setZoom(c.zoom);
          }
          return;
        }

        const bounds = new window.google.maps.LatLngBounds();

        validPlaces.forEach((place) => {
          const position = { lat: place.latitude, lng: place.longitude };
          const isSelected = activePlace?.id === place.id;

          const marker = new window.google.maps.Marker({
            position,
            map,
            title: place.displayName,
            icon: createGoogleMarkerIcon(isSelected),
            zIndex: isSelected ? 999 : 10
          });

          marker.addListener('click', () => {
            setActivePlace(place);
            onSelectPlace(place);
            map.panTo(position);
            map.setZoom(Math.max(map.getZoom(), 15));
          });

          markersRef.current.push(marker);
          bounds.extend(position);
        });

        // Set actual count of markers successfully created
        setCreatedMarkersCount(markersRef.current.length);

        if (markersRef.current.length === 1) {
          map.setCenter({ lat: validPlaces[0].latitude, lng: validPlaces[0].longitude });
          map.setZoom(15);
        } else if (markersRef.current.length > 1) {
          map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
        }
      } catch (err) {
        console.error('Error updating Google Map markers:', err);
      }
    }

    // MODE 2: LEAFLET MARKERS (REAL OPENSTREETMAP TILES)
    if (activeEngine === 'leaflet' && window.L && typeof mapInstanceRef.current.addLayer === 'function') {
      try {
        const L = window.L;
        const map = mapInstanceRef.current;

        // Clear existing markers
        markersRef.current.forEach((m) => {
          if (m && typeof m.remove === 'function') m.remove();
        });
        markersRef.current = [];

        if (validPlaces.length === 0) {
          setCreatedMarkersCount(0);
          if (activeCity && CITY_COORDINATES[activeCity]) {
            const c = CITY_COORDINATES[activeCity];
            map.setView([c.lat, c.lng], c.zoom);
          }
          return;
        }

        const latLngs = [];

        validPlaces.forEach((place) => {
          const latLng = [place.latitude, place.longitude];
          const isSelected = activePlace?.id === place.id;

          const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: createMarkerSvgString(isSelected),
            iconSize: isSelected ? [45, 60] : [36, 48],
            iconAnchor: isSelected ? [22, 60] : [18, 48]
          });

          const marker = L.marker(latLng, { icon: customIcon, title: place.displayName });

          marker.on('click', () => {
            setActivePlace(place);
            onSelectPlace(place);
            map.setView(latLng, Math.max(map.getZoom(), 15));
          });

          marker.addTo(map);
          markersRef.current.push(marker);
          latLngs.push(latLng);
        });

        // Set actual count of markers successfully created
        setCreatedMarkersCount(markersRef.current.length);

        if (latLngs.length === 1) {
          map.setView(latLngs[0], 15);
        } else if (latLngs.length > 1) {
          const bounds = L.latLngBounds(latLngs);
          map.fitBounds(bounds, { padding: [50, 50] });
        }

        map.invalidateSize();
      } catch (err) {
        console.error('Error updating Leaflet markers:', err);
      }
    }
  }, [places, activePlace, activeEngine, activeCity, onSelectPlace]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
      {/* Map Card Header Toolbar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-ice-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200 shadow-xs shrink-0">
            <Compass className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-navy-900 tracking-tight">
                {title}
              </h2>
              {createdMarkersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700 border border-primary-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary-600" />
                  {createdMarkersCount} Pins Plotted
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>
          </div>
        </div>

        {/* Map Control Actions */}
        <div className="flex items-center gap-2">
          {activeEngine === 'google' && (
            <button
              type="button"
              onClick={toggleMapType}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors"
              title="Toggle Satellite Imagery"
            >
              <Layers className="w-3.5 h-3.5 text-primary-600" />
              <span className="hidden sm:inline">
                {mapType === 'roadmap' ? 'Satellite' : 'Map'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRecenter}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors"
            title="Recenter Map"
          >
            <Navigation className="w-3.5 h-3.5 text-primary-600" />
            <span className="hidden sm:inline">Recenter</span>
          </button>

          {activeCity && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {activeCity}
            </span>
          )}
        </div>
      </div>

      {/* GCP Setup Alert when Maps JavaScript API needs activation */}
      {(apiNotActivated || authError) && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Google Cloud Notice: </span>
            <span>
              <strong>Places API (New)</strong> is active and delivering verified medical facility coordinates. To enable Google vector tiles instead of OpenStreetMap tiles, activate{' '}
              <a
                href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1"
              >
                Maps JavaScript API in Google Cloud Console
                <ExternalLink className="w-3 h-3 inline" />
              </a>
              .
            </span>
          </div>
        </div>
      )}

      {/* Main Map Canvas Area with guaranteed non-zero measurable dimensions */}
      <div
        className={`relative w-full ${height} bg-slate-100 overflow-hidden`}
        style={{ minHeight: '420px' }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-navy-900">
              Updating clinic markers from Google Places...
            </span>
          </div>
        )}

        {/* Map Canvas Div with explicit absolute stretch to prevent grey collapse */}
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            minHeight: '420px',
            zIndex: 1
          }}
        />

        {/* Floating Active Place Details Card (Overlay) */}
        {activePlace && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-card-hover p-4 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {activePlace.photoUrls && activePlace.photoUrls.length > 0 ? (
                  <img
                    src={activePlace.photoUrls[0]}
                    alt={activePlace.displayName}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-ice-100 text-primary-600 flex items-center justify-center shrink-0 border border-primary-200">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                      {activePlace.primaryType ? activePlace.primaryType.replace(/_/g, ' ') : 'Clinic'}
                    </span>
                    {activePlace.rating && (
                      <span className="text-[11px] font-extrabold text-amber-600 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {activePlace.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-navy-900 text-xs sm:text-sm mt-1 leading-snug line-clamp-1">
                    {activePlace.displayName}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {activePlace.formattedAddress}
                  </p>
                  {typeof activePlace.latitude === 'number' && typeof activePlace.longitude === 'number' && (
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      {activePlace.latitude.toFixed(4)}° N, {activePlace.longitude.toFixed(4)}° E
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePlace(null)}
                className="text-slate-400 hover:text-navy-900 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions inside Floating Card */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {activePlace.googleMapsUri ? (
                <a
                  href={activePlace.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-primary-600 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                </a>
              ) : (
                <span className="text-[10px] text-slate-400">CareSync Partner</span>
              )}

              <button
                type="button"
                onClick={() => {
                  onSelectFacilityForDoctorSearch(activePlace.displayName);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-600 hover:bg-navy-900 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Stethoscope className="w-3 h-3" />
                <span>Filter Doctors Here</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty Places Notice (when loaded with 0 results) */}
        {!isLoading && places.length === 0 && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 z-10">
            <div className="bg-white/95 backdrop-blur-xs p-4 rounded-2xl border border-slate-200 shadow-md text-center max-w-sm pointer-events-auto space-y-1">
              <Building2 className="w-6 h-6 text-slate-400 mx-auto" />
              <h4 className="text-xs font-bold text-navy-900">No Facilities in Current View</h4>
              <p className="text-[11px] text-slate-500">
                Select a popular city chip or search for a hospital to view map markers.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Map Card Footer with Live Coordinates & Powered By Badge */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> NMC &amp; Google Verified Coordinates
          </span>
          {createdMarkersCount > 0 && (
            <span className="text-slate-400">
              • {createdMarkersCount} live locations plotted
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[10px]">
            {activeEngine === 'google'
              ? 'Maps JavaScript API • Places API (New)'
              : 'Interactive OpenStreetMap Tiles • Places API (New)'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GooglePlacesMap;
