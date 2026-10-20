import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Maximize2,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck
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
  India: { lat: 20.5937, lng: 78.9629, zoom: 5 }
};

/**
 * Custom SVG Marker Icon Generator for Google Maps
 * Creates a healthcare-branded teardrop pin with a medical cross
 */
const createMarkerIcon = (isSelected = false) => {
  const pinColor = isSelected ? '#e11d48' : '#1e60f2'; // Rose-600 when selected, Primary-600 default
  const strokeColor = isSelected ? '#881337' : '#0d213f'; // Dark outline
  const scale = isSelected ? 1.25 : 1.0;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${36 * scale}" height="${48 * scale}" viewBox="0 0 36 48">
      <defs>
        <filter id="pin-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M18 0 C8.06 0 0 8.06 0 18 C0 29.5 18 48 18 48 C18 48 36 29.5 36 18 C36 8.06 27.94 0 18 0 Z"
            fill="${pinColor}" stroke="${strokeColor}" stroke-width="1.5" filter="url(#pin-shadow)" />
      <circle cx="18" cy="18" r="11" fill="#ffffff" />
      <!-- Medical Cross -->
      <rect x="15.5" y="10" width="5" height="16" rx="1.5" fill="${pinColor}" />
      <rect x="10" y="15.5" width="16" height="5" rx="1.5" fill="${pinColor}" />
    </svg>
  `;

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
  subtitle = 'Real-time healthcare facility markers powered by Google Maps JavaScript API'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptLoadError, setScriptLoadError] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [activePlace, setActivePlace] = useState(null);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Synchronize internal activePlace when selectedPlaceId prop changes
  useEffect(() => {
    if (selectedPlaceId) {
      const match = places.find((p) => p.id === selectedPlaceId);
      if (match) setActivePlace(match);
    }
  }, [selectedPlaceId, places]);

  // Load Google Maps JavaScript API script dynamically
  useEffect(() => {
    if (!apiKey) {
      // No browser key configured
      return;
    }

    // Register global auth failure listener if not already attached
    window.gm_authFailure = () => {
      console.warn('Google Maps API authentication failed: Check API key restrictions or billing.');
      setAuthError(true);
    };

    if (window.google?.maps) {
      setIsScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-js-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsScriptLoaded(true));
      existingScript.addEventListener('error', () =>
        setScriptLoadError('Failed to load Google Maps SDK')
      );
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsScriptLoaded(true);
    };

    script.onerror = (e) => {
      console.error('Error loading Google Maps JavaScript API:', e);
      setScriptLoadError('Unable to connect to Google Maps servers. Check network connection.');
    };

    document.head.appendChild(script);

    return () => {
      // Keep script in head to prevent reload loops
    };
  }, [apiKey]);

  // Initialize Map Instance
  useEffect(() => {
    if (!isScriptLoaded || !mapContainerRef.current || !window.google?.maps || authError) {
      return;
    }

    if (!mapInstanceRef.current) {
      const cityKey = activeCity || 'Bengaluru';
      const initialCenter = CITY_COORDINATES[cityKey] || CITY_COORDINATES.Bengaluru;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: initialCenter.lat, lng: initialCenter.lng },
        zoom: initialCenter.zoom,
        styles: MAP_STYLES,
        mapTypeId: mapType,
        mapTypeControl: false, // We use custom toggle button
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM
        },
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP
        }
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();

      // Close floating card / info window when clicking elsewhere on map canvas
      map.addListener('click', () => {
        setActivePlace(null);
        if (infoWindowRef.current) infoWindowRef.current.close();
      });
    }
  }, [isScriptLoaded, authError]);

  // Handle Map Type Toggle (Roadmap vs Satellite)
  const toggleMapType = () => {
    if (!mapInstanceRef.current) return;
    const nextType = mapType === 'roadmap' ? 'hybrid' : 'roadmap';
    mapInstanceRef.current.setMapTypeId(nextType);
    setMapType(nextType);
  };

  // Center map on specified coordinates
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const cityKey = activeCity || 'Bengaluru';
    const coords = CITY_COORDINATES[cityKey] || CITY_COORDINATES.Bengaluru;
    mapInstanceRef.current.panTo({ lat: coords.lat, lng: coords.lng });
    mapInstanceRef.current.setZoom(coords.zoom);
  }, [activeCity]);

  // Render & Update Markers when Places change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps || !isScriptLoaded || authError) {
      return;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Filter places that have genuine latitude and longitude
    const validPlaces = places.filter(
      (p) =>
        typeof p.latitude === 'number' &&
        typeof p.longitude === 'number' &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
    );

    if (validPlaces.length === 0) {
      // If city is specified, center on known city coordinates
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
        icon: createMarkerIcon(isSelected),
        zIndex: isSelected ? 999 : 10,
        animation: isSelected ? window.google.maps.Animation.BOUNCE : undefined
      });

      if (isSelected) {
        setTimeout(() => marker.setAnimation(null), 1400);
      }

      // Marker Click Event
      marker.addListener('click', () => {
        setActivePlace(place);
        onSelectPlace(place);

        map.panTo(position);
        map.setZoom(Math.max(map.getZoom(), 15));
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Auto-fit bounds to display all valid markers
    if (validPlaces.length === 1) {
      map.setCenter({ lat: validPlaces[0].latitude, lng: validPlaces[0].longitude });
      map.setZoom(15);
    } else if (validPlaces.length > 1) {
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [places, activePlace, isScriptLoaded, authError, activeCity, onSelectPlace]);

  // Valid places count
  const validPlacesCount = places.filter(
    (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
  ).length;

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
              {validPlacesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700 border border-primary-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary-600" />
                  {validPlacesCount} Pins Plotted
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>
          </div>
        </div>

        {/* Map Control Actions */}
        <div className="flex items-center gap-2">
          {apiKey && !authError && isScriptLoaded && (
            <>
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
              <button
                type="button"
                onClick={handleRecenter}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors"
                title="Recenter Map"
              >
                <Navigation className="w-3.5 h-3.5 text-primary-600" />
                <span className="hidden sm:inline">Recenter</span>
              </button>
            </>
          )}
          {activeCity && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {activeCity}
            </span>
          )}
        </div>
      </div>

      {/* Main Map Canvas / State Area */}
      <div className={`relative w-full ${height} bg-slate-100 overflow-hidden`}>
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-navy-900">
              Updating clinic markers from Google Places...
            </span>
          </div>
        )}

        {/* Case 1: Missing Browser API Key Banner & Fallback Coordinate Explorer */}
        {!apiKey && (
          <div className="h-full w-full overflow-y-auto p-6 flex flex-col justify-between bg-gradient-to-b from-ice-50 to-white">
            <div className="max-w-xl mx-auto text-center space-y-3 py-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-navy-900">
                Google Maps JavaScript API Key Required
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                To render the live interactive map canvas directly in your browser, configure your
                dedicated browser API key in <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">frontend/.env</code>.
              </p>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-left space-y-2 text-xs">
                <span className="font-bold text-navy-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Recommended Setup Steps:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px] leading-relaxed">
                  <li>
                    Open <strong>Google Cloud Console &gt; APIs &amp; Services &gt; Credentials</strong>.
                  </li>
                  <li>
                    Create an API key with <strong>HTTP Referrer restriction</strong> set to{' '}
                    <code className="bg-slate-100 px-1 rounded text-primary-700">http://localhost:5173/*</code>.
                  </li>
                  <li>
                    Under API Restrictions, enable <strong>Maps JavaScript API</strong>.
                  </li>
                  <li>
                    Add <code className="bg-slate-100 px-1 rounded text-primary-700">VITE_GOOGLE_MAPS_API_KEY=your_key</code> to{' '}
                    <code className="bg-slate-100 px-1 rounded">frontend/.env</code> and restart Vite.
                  </li>
                </ol>
              </div>
            </div>

            {/* Live Facility Coordinates List as graceful functional fallback */}
            {validPlacesCount > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Retrieved Clinic Coordinates ({validPlacesCount} live locations):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {places.slice(0, 6).map((place) => (
                    <div
                      key={place.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-primary-300 transition-colors flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-navy-900 text-xs truncate block">
                          {place.displayName}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {place.latitude?.toFixed(4)}° N, {place.longitude?.toFixed(4)}° E
                        </div>
                      </div>
                      {place.googleMapsUri && (
                        <a
                          href={place.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-navy-900 p-1"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Case 2: Authentication Error (gm_authFailure) */}
        {apiKey && authError && (
          <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-rose-50/50 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-navy-900">
                Google Maps Authentication Notice
              </h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto mt-1 leading-relaxed">
                Google Maps JS API rejected the current key. Ensure the <strong>Maps JavaScript API</strong> is
                enabled in your Google Cloud Project and that your HTTP referrer matches{' '}
                <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">http://localhost:5173/*</code>.
              </p>
            </div>
          </div>
        )}

        {/* Case 3: Script Load Error */}
        {apiKey && !authError && scriptLoadError && (
          <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <h3 className="text-sm font-bold text-navy-900">Map Loading Error</h3>
            <p className="text-xs text-slate-500 max-w-sm">{scriptLoadError}</p>
          </div>
        )}

        {/* Case 4: Google Maps Canvas Div */}
        {apiKey && !authError && (
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />
        )}

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
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
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
          {validPlacesCount > 0 && (
            <span className="text-slate-400">
              • Showing {validPlacesCount} facilities
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[10px]">
            Maps JavaScript API • Places API (New)
          </span>
        </div>
      </div>
    </div>
  );
};

export default GooglePlacesMap;
