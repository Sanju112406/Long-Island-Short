import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Maximize2, Minimize2, MapPin, Layers, AlertTriangle } from 'lucide-react';
import { JourneyStep } from '../types';

interface OpenStreetMapViewerProps {
  steps: JourneyStep[];
  currentStepIndex: number;
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  isDisrupted?: boolean;
  alternativeRouteActive?: boolean;
}

export const OpenStreetMapViewer: React.FC<OpenStreetMapViewerProps> = ({
  steps,
  currentStepIndex,
  originCoords = { lat: 1.3052, lng: 103.7725 }, // Default NUS/Central
  destinationCoords = { lat: 1.3040, lng: 103.8318 }, // Default Orchard
  isDisrupted = false,
  alternativeRouteActive = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasStationLayer, setHasStationLayer] = useState(true);

  // Singapore coordinates fallback coordinates for steps
  const stepCoordinates: [number, number][] = [
    [originCoords.lat, originCoords.lng],
    [1.312, 103.795],
    [1.306, 103.818],
    [destinationCoords.lat, destinationCoords.lng],
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map centered on Singapore Central
    const map = L.map(mapContainerRef.current, {
      center: [1.32, 103.81],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    // OpenStreetMap Standard Tiles (with required attribution)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Load Singapore Rail Station Footprints from public/data/AmendmenttoMP2014RailStation.geojson
    let geojsonLayer: L.GeoJSON | null = null;
    fetch('/data/AmendmenttoMP2014RailStation.geojson')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && mapInstanceRef.current) {
          geojsonLayer = L.geoJSON(data, {
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

  // Update Route Polylines and Current Commuter Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous vector layers (except tile and geojson)
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Draw route polyline
    const routeColor = isDisrupted ? '#ef4444' : alternativeRouteActive ? '#6366f1' : '#059669';
    const polyline = L.polyline(stepCoordinates, {
      color: routeColor,
      weight: 5,
      opacity: 0.85,
      dashArray: isDisrupted ? '6, 8' : undefined,
    }).addTo(map);

    // Add marker for active step location
    const activeCoord = stepCoordinates[Math.min(currentStepIndex, stepCoordinates.length - 1)];
    const activeStep = steps[currentStepIndex] || steps[0];

    const commuterIcon = L.divIcon({
      className: 'custom-commuter-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white animate-bounce">
            📍
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker(activeCoord, { icon: commuterIcon })
      .bindPopup(
        `<b>Active Step:</b> ${activeStep.title}<br/><b>Landmark:</b> ${activeStep.landmark}`
      )
      .addTo(map)
      .openPopup();

    map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    setTimeout(() => map.invalidateSize(), 200);
  }, [currentStepIndex, steps, isDisrupted, alternativeRouteActive]);

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
            Active: {steps[currentStepIndex]?.landmark || 'Sheltered linkway'}
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
