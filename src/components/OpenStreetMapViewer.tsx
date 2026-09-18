import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Maximize2, Minimize2, MapPin, Navigation, Compass } from 'lucide-react';
import { JourneyStep, LatLng, UserLocation } from '../types';

interface OpenStreetMapViewerProps {
  steps: JourneyStep[];
  currentStepIndex: number;
  routeGeometry?: [number, number][];
  userLocation?: UserLocation | null;
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  originName?: string;
  destinationName?: string;
  isDisrupted?: boolean;
  alternativeRouteActive?: boolean;
}

export const OpenStreetMapViewer: React.FC<OpenStreetMapViewerProps> = ({
  steps,
  currentStepIndex,
  routeGeometry,
  userLocation,
  originCoords = { lat: 1.3052, lng: 103.7725 },
  destinationCoords = { lat: 1.3040, lng: 103.8318 },
  originName = 'Origin',
  destinationName = 'Destination',
  isDisrupted = false,
  alternativeRouteActive = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Compute dynamic coordinates for route polyline
  const computedGeometry: [number, number][] = React.useMemo(() => {
    if (routeGeometry && routeGeometry.length > 1) {
      return routeGeometry;
    }

    // Try collecting from steps
    const stepPts: [number, number][] = [];
    for (const step of steps) {
      if (step.geometry && step.geometry.length > 0) {
        stepPts.push(...step.geometry);
      }
    }
    if (stepPts.length > 1) {
      return stepPts;
    }

    // Fallback: construct sensible Singapore route line
    const startLat = originCoords.lat || 1.3052;
    const startLng = originCoords.lng || 103.7725;
    const endLat = destinationCoords.lat || 1.3040;
    const endLng = destinationCoords.lng || 103.8318;
    const midLat = (startLat + endLat) / 2 + 0.005;
    const midLng = (startLng + endLng) / 2;

    return [
      [startLat, startLng],
      [midLat, midLng],
      [endLat, endLng],
    ];
  }, [routeGeometry, steps, originCoords, destinationCoords]);

  // Determine active commuter coordinate
  const commuterCoord: [number, number] = React.useMemo(() => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    const activeStep = steps[currentStepIndex];
    if (activeStep?.geometry && activeStep.geometry.length > 0) {
      return activeStep.geometry[0];
    }
    const idx = Math.min(currentStepIndex, computedGeometry.length - 1);
    return computedGeometry[Math.max(0, idx)];
  }, [userLocation, steps, currentStepIndex, computedGeometry]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map centered on Singapore Central
    const map = L.map(mapContainerRef.current, {
      center: [1.32, 103.81],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    // OpenStreetMap Standard Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Load Singapore Rail Station Footprints
    fetch('/data/AmendmenttoMP2014RailStation.geojson')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && mapInstanceRef.current) {
          L.geoJSON(data, {
            style: {
              color: '#059669',
              weight: 2,
              fillColor: '#10b981',
              fillOpacity: 0.25,
            },
            onEachFeature: (feature, layer) => {
              if (feature.properties) {
                const name = feature.properties.STN_NAME || feature.properties.NAME || 'MRT Station';
                layer.bindPopup(`<b>${name}</b><br/>Footprint layer`);
              }
            },
          }).addTo(mapInstanceRef.current);
        }
      })
      .catch((err) => console.warn('Could not load rail station footprints geojson:', err));

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polylines and Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || computedGeometry.length === 0) return;

    // Clear previous dynamic layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // 1. Draw main route polyline
    const routeColor = isDisrupted ? '#ef4444' : alternativeRouteActive ? '#6366f1' : '#059669';
    const mainPolyline = L.polyline(computedGeometry, {
      color: routeColor,
      weight: 6,
      opacity: 0.85,
      dashArray: isDisrupted ? '6, 8' : undefined,
    }).addTo(map);

    // 2. Highlight active step geometry if available
    const activeStep = steps[currentStepIndex];
    if (activeStep?.geometry && activeStep.geometry.length > 1) {
      L.polyline(activeStep.geometry, {
        color: '#fbbf24', // Amber active glow
        weight: 9,
        opacity: 0.9,
      }).addTo(map);
    }

    // 3. Start Marker (Origin)
    const originIcon = L.divIcon({
      className: 'custom-origin-marker',
      html: `
        <div class="px-2 py-1 rounded-md bg-emerald-700 text-white font-bold text-[10px] shadow-md border border-white flex items-center gap-1 whitespace-nowrap">
          <span>🟢</span> <span>${originName}</span>
        </div>
      `,
      iconSize: [80, 24],
      iconAnchor: [40, 24],
    });
    L.marker(computedGeometry[0], { icon: originIcon }).addTo(map);

    // 4. Destination Marker
    const destIcon = L.divIcon({
      className: 'custom-dest-marker',
      html: `
        <div class="px-2 py-1 rounded-md bg-rose-700 text-white font-bold text-[10px] shadow-md border border-white flex items-center gap-1 whitespace-nowrap">
          <span>🏁</span> <span>${destinationName}</span>
        </div>
      `,
      iconSize: [80, 24],
      iconAnchor: [40, 24],
    });
    L.marker(computedGeometry[computedGeometry.length - 1], { icon: destIcon }).addTo(map);

    // 5. Commuter Live Pin
    const commuterIcon = L.divIcon({
      className: 'custom-commuter-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white animate-pulse">
            📍
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker(commuterCoord, { icon: commuterIcon })
      .bindPopup(
        `<b>Current Location:</b> ${activeStep?.title || 'Walking'}<br/><b>Landmark:</b> ${activeStep?.landmark || 'Covered Linkway'}`
      )
      .addTo(map)
      .openPopup();

    // Fit map bounds to encompass route and commuter
    try {
      const bounds = mainPolyline.getBounds();
      bounds.extend(commuterCoord);
      map.fitBounds(bounds, { padding: [35, 35] });
    } catch {
      // Ignore if single point
    }

    setTimeout(() => map.invalidateSize(), 200);
  }, [
    computedGeometry,
    commuterCoord,
    currentStepIndex,
    steps,
    isDisrupted,
    alternativeRouteActive,
    originName,
    destinationName,
  ]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
  };

  return (
    <div
      id="osm-gis-viewer-card"
      className={`relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 ${
        isExpanded
          ? 'fixed inset-4 z-50 bg-white dark:bg-slate-900 flex flex-col shadow-2xl'
          : 'w-full h-56 bg-slate-100 dark:bg-slate-950'
      }`}
    >
      {/* Map Header Controls */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 shadow-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>OpenStreetMap GIS Base</span>
          {isDisrupted && (
            <span className="text-[9px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-1 rounded font-black">
              Disruption
            </span>
          )}
          {userLocation?.isSimulated && (
            <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1 rounded font-bold">
              Simulated GPS
            </span>
          )}
        </div>

        <button
          id="expand-osm-map-button"
          type="button"
          onClick={toggleExpand}
          className="pointer-events-auto p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 shadow-xs cursor-pointer"
          title={isExpanded ? 'Minimize map' : 'Expand full screen'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '180px' }} />

      {/* Status Bar at Bottom of Expanded View */}
      {isExpanded && (
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            Active: {steps[currentStepIndex]?.landmark || 'Sheltered linkway'} ({currentStepIndex + 1}/{steps.length})
          </span>
          <button
            type="button"
            onClick={toggleExpand}
            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close Map
          </button>
        </div>
      )}
    </div>
  );
};
