/**
 * Deterministic Singapore Routing & Landmark Context Service
 * Computes exact transport truth, routes, coordinates, and OpenStreetMap landmark anchors.
 * Supports multi-modal transit (walk, MRT, bus, cycle) and commuter personas.
 * Integrates OneMap Public Transport API with fallback to deterministic curated Singapore routing.
 */

import { Journey, JourneyStep, RouteSource, TransportType } from '../../src/types';
import {
  findNearestLandmark,
  calculateDistanceMeters,
  getLandmarkContext,
  VERIFIED_SINGAPORE_LANDMARKS,
} from './landmarkContextService';
import {
  searchOneMapLocation,
  getOneMapPublicTransportRoute,
  hasOneMapPassword,
} from './oneMapService';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteLeg {
  id: string;
  type: TransportType;
  title: string;
  distanceMeters: number;
  durationMins: number;
  landmark: string;
  landmarkDetail: string;
  guidance: {
    full: string;
    medium: string;
    light: string;
  };
  coordinates: LatLng[];
  substeps?: string[];
  boardingStop?: string;
  alightingStop?: string;
  lineName?: string;
  lineBadge?: string;
  stopsCount?: number;
}

export interface SingaporeRoute {
  id: string;
  title: string;
  origin: string;
  originCoords: LatLng;
  destination: string;
  destinationCoords: LatLng;
  totalDurationMins: number;
  calculatedETA: string;
  desiredArrivalTime: string;
  personaTarget?: 'Rachel' | 'Arjun' | 'Mdm Lim' | 'General';
  legs: RouteLeg[];
  polyline: LatLng[];
}

export interface PlanJourneyInput {
  origin: string;
  destination: string;
  preferences?: {
    avoidLines?: string[];
    avoidStops?: string[];
    preferredModes?: string[];
    accessibilityRequirements?: boolean;
    minimiseTransfers?: boolean;
    minimiseWalking?: boolean;
  };
  currentLocation?: LatLng;
  desiredArrivalTime?: string;
}

export interface RecalculateJourneyInput {
  currentLocation: LatLng;
  destination: string;
  avoidLines?: string[];
  avoidStops?: string[];
  preferredModes?: string[];
  accessibilityRequirements?: boolean;
  minimiseTransfers?: boolean;
  minimiseWalking?: boolean;
  weatherContext?: string;
  reason?: string;
}

// Preset Singapore Routes (Preserved as Fallback & Quick Demo Scenarios)
export const SINGAPORE_ROUTES: Record<string, SingaporeRoute> = {
  'rachel-tampines-raffles': {
    id: 'rachel-tampines-raffles',
    title: 'Tampines Central to Raffles Place (EWL)',
    origin: 'Tampines Central (Our Tampines Hub)',
    originCoords: { lat: 1.3533, lng: 103.9388 },
    destination: 'Raffles Place (Republic Plaza)',
    destinationCoords: { lat: 1.2830, lng: 103.8510 },
    totalDurationMins: 38,
    calculatedETA: '8:18 AM',
    desiredArrivalTime: '8:45 AM',
    personaTarget: 'Rachel',
    polyline: [
      { lat: 1.3533, lng: 103.9388 },
      { lat: 1.3526, lng: 103.9452 },
      { lat: 1.3200, lng: 103.8900 },
      { lat: 1.3000, lng: 103.8600 },
      { lat: 1.2830, lng: 103.8510 },
    ],
    legs: [
      {
        id: 'rachel-1',
        type: 'walk',
        title: 'Walk via covered linkway to Tampines MRT',
        distanceMeters: 200,
        durationMins: 3,
        landmark: 'Past Tampines 1 taxi stand to Exit A gantries',
        landmarkDetail: 'Wide sheltered pedestrian concourse with clear overhead direction boards',
        guidance: {
          full: 'Walk along the covered linkway past Tampines 1. Enter Tampines MRT through the green fare gantries at Exit A.',
          medium: 'Walk past Tampines 1 into Exit A fare gantries.',
          light: 'Head to Tampines MRT Exit A.',
        },
        coordinates: [
          { lat: 1.3533, lng: 103.9388 },
          { lat: 1.3526, lng: 103.9452 },
        ],
      },
      {
        id: 'rachel-2',
        type: 'mrt',
        title: 'East-West Line (Towards Tuas Link) - 13 Stops',
        distanceMeters: 16500,
        durationMins: 31,
        landmark: 'Platform B towards City, alight at Raffles Place',
        landmarkDetail: 'Board train carriages 3 or 4 for fastest access to Republic Plaza escalators at Raffles Place',
        guidance: {
          full: 'Board East-West Line towards Tuas Link. Ride 13 stops to Raffles Place. On-time buffer is 27 minutes.',
          medium: 'EWL to Raffles Place (13 stops).',
          light: 'EWL to Raffles Place.',
        },
        coordinates: [
          { lat: 1.3526, lng: 103.9452 },
          { lat: 1.3000, lng: 103.8600 },
          { lat: 1.2830, lng: 103.8510 },
        ],
      },
      {
        id: 'rachel-3',
        type: 'walk',
        title: 'Take Exit D to Republic Plaza',
        distanceMeters: 150,
        durationMins: 4,
        landmark: 'Exit D underground passage directly into Republic Plaza lobby',
        landmarkDetail: 'Underground air-conditioned passage avoiding morning rain and traffic lights',
        guidance: {
          full: 'Tap out at Raffles Place Exit D. Walk through the air-conditioned tunnel directly into the Republic Plaza lobby.',
          medium: 'Exit D directly into Republic Plaza.',
          light: 'Exit D to Republic Plaza.',
        },
        coordinates: [
          { lat: 1.2830, lng: 103.8510 },
          { lat: 1.2825, lng: 103.8515 },
        ],
      },
    ],
  },
  'arjun-punggol-onenorth': {
    id: 'arjun-punggol-onenorth',
    title: 'Punggol Oasis to one-north (PCN + CCL)',
    origin: 'Punggol Drive (Oasis Terraces)',
    originCoords: { lat: 1.4024, lng: 103.9126 },
    destination: 'one-north (Fusionopolis)',
    destinationCoords: { lat: 1.2990, lng: 103.7872 },
    totalDurationMins: 42,
    calculatedETA: '9:12 AM',
    desiredArrivalTime: '9:45 AM',
    personaTarget: 'Arjun',
    polyline: [
      { lat: 1.4024, lng: 103.9126 },
      { lat: 1.4050, lng: 103.9020 },
      { lat: 1.3506, lng: 103.8488 },
      { lat: 1.2990, lng: 103.7872 },
    ],
    legs: [
      {
        id: 'arjun-1',
        type: 'cycle',
        title: 'Cycle along Punggol Waterway PCN to Punggol MRT',
        distanceMeters: 1200,
        durationMins: 5,
        landmark: 'Punggol Waterway Park Connector alongside Oasis Terraces',
        landmarkDetail: 'Smooth concrete path, folding bikes permitted outside peak crowds',
        guidance: {
          full: 'Ride your folding bicycle along Punggol Waterway PCN towards Punggol MRT. Dismount and fold before the station concourse.',
          medium: 'PCN to Punggol MRT. Fold bike before entering.',
          light: 'PCN to Punggol MRT.',
        },
        coordinates: [
          { lat: 1.4024, lng: 103.9126 },
          { lat: 1.4050, lng: 103.9020 },
        ],
      },
      {
        id: 'arjun-2',
        type: 'mrt',
        title: 'North East Line (Towards HarbourFront) to Serangoon',
        distanceMeters: 9200,
        durationMins: 14,
        landmark: 'Serangoon MRT CCL Transfer travelator',
        landmarkDetail: 'Follow yellow Circle Line signs across the air-conditioned underpass',
        guidance: {
          full: 'Take the North East Line to Serangoon. Transfer to the Circle Line towards HarbourFront.',
          medium: 'NEL to Serangoon, transfer to Circle Line.',
          light: 'Transfer at Serangoon.',
        },
        coordinates: [
          { lat: 1.4050, lng: 103.9020 },
          { lat: 1.3506, lng: 103.8488 },
        ],
      },
      {
        id: 'arjun-3',
        type: 'mrt',
        title: 'Circle Line (Towards HarbourFront) to one-north',
        distanceMeters: 11000,
        durationMins: 19,
        landmark: 'one-north MRT Exit B escalator bank',
        landmarkDetail: 'Ascend to Fusionopolis basement level with bike-friendly wide fare gates',
        guidance: {
          full: 'Ride Circle Line to one-north. Take Exit B up to Fusionopolis concourse.',
          medium: 'Circle Line to one-north Exit B.',
          light: 'Exit B at one-north.',
        },
        coordinates: [
          { lat: 1.3506, lng: 103.8488 },
          { lat: 1.2990, lng: 103.7872 },
        ],
      },
      {
        id: 'arjun-4',
        type: 'walk',
        title: 'Walk into Fusionopolis atrium',
        distanceMeters: 100,
        durationMins: 2,
        landmark: 'Fusionopolis Starbucks and lift lobby',
        landmarkDetail: 'Sheltered ground floor atrium connecting directly to Symbiosis and Connexis',
        guidance: {
          full: 'Walk past Starbucks into the Fusionopolis main lift lobby. You have arrived 33 minutes ahead of your meeting.',
          medium: 'Walk past Starbucks into Fusionopolis.',
          light: 'Enter Fusionopolis.',
        },
        coordinates: [
          { lat: 1.2990, lng: 103.7872 },
          { lat: 1.2995, lng: 103.7878 },
        ],
      },
    ],
  },
  'lim-bedok-sgh': {
    id: 'lim-bedok-sgh',
    title: 'Bedok Central to SGH Outram Community Hospital',
    origin: 'Bedok Central (Blk 214)',
    originCoords: { lat: 1.3240, lng: 103.9300 },
    destination: 'Singapore General Hospital (SGH)',
    destinationCoords: { lat: 1.2795, lng: 103.8344 },
    totalDurationMins: 45,
    calculatedETA: '10:05 AM',
    desiredArrivalTime: '10:30 AM',
    personaTarget: 'Mdm Lim',
    polyline: [
      { lat: 1.3240, lng: 103.9300 },
      { lat: 1.3200, lng: 103.9280 },
      { lat: 1.2803, lng: 103.8398 },
      { lat: 1.2795, lng: 103.8344 },
    ],
    legs: [
      {
        id: 'lim-1',
        type: 'walk',
        title: 'Step-free ramp to Bedok MRT Priority Lift L1',
        distanceMeters: 150,
        durationMins: 4,
        landmark: 'Bedok Mall Priority Lift L1 near Guardian Pharmacy',
        landmarkDetail: 'Gentle 1:12 ramp with handrails and sheltered tactile ground paving',
        guidance: {
          full: 'Auntie Lim, take the sheltered ramp beside Guardian Pharmacy to Priority Lift L1. All station lifts are working normally today.',
          medium: 'Take ramp to Lift L1 beside Guardian.',
          light: 'Ramp to Lift L1.',
        },
        coordinates: [
          { lat: 1.3240, lng: 103.9300 },
          { lat: 1.3200, lng: 103.9280 },
        ],
      },
      {
        id: 'lim-2',
        type: 'mrt',
        title: 'East-West Line (Towards Tuas Link) to Outram Park',
        distanceMeters: 13500,
        durationMins: 26,
        landmark: 'Train Carriage 4 (Wheelchair & Senior Priority Berth)',
        landmarkDetail: 'Platform gap filler installed, level boarding directly to train carriage',
        guidance: {
          full: 'Board train carriage 4. It has priority seats and wide space. Ride 10 stops to Outram Park.',
          medium: 'EWL to Outram Park (10 stops). Priority seating in carriage 4.',
          light: 'EWL to Outram Park.',
        },
        coordinates: [
          { lat: 1.3200, lng: 103.9280 },
          { lat: 1.2803, lng: 103.8398 },
        ],
      },
      {
        id: 'lim-3',
        type: 'walk',
        title: 'Outram Park Exit 3 Step-Free Lift to SGH Shuttle',
        distanceMeters: 80,
        durationMins: 3,
        landmark: 'Outram Park Exit 3 Lift Concourse & Hospital Shuttle Shelter',
        landmarkDetail: 'Completely barrier-free covered path with priority seating at shuttle stop',
        guidance: {
          full: 'At Outram Park, follow the blue hospital signs to Exit 3 lift. The free SGH wheelchair-accessible shuttle bus arrives every 8 minutes right outside.',
          medium: 'Exit 3 lift to free SGH shuttle shelter.',
          light: 'Exit 3 lift to shuttle.',
        },
        coordinates: [
          { lat: 1.2803, lng: 103.8398 },
          { lat: 1.2795, lng: 103.8344 },
        ],
      },
    ],
  },
  'nus-orchard': {
    id: 'nus-orchard',
    title: 'NUS (University Town) to Orchard (ION Orchard)',
    origin: 'NUS (University Town)',
    originCoords: { lat: 1.3048, lng: 103.7725 },
    destination: 'Orchard (ION Orchard)',
    destinationCoords: { lat: 1.3040, lng: 103.8318 },
    totalDurationMins: 34,
    calculatedETA: '9:04 AM',
    desiredArrivalTime: '9:30 AM',
    personaTarget: 'General',
    polyline: [
      { lat: 1.3048, lng: 103.7725 },
      { lat: 1.3073, lng: 103.7901 },
      { lat: 1.3009, lng: 103.8384 },
      { lat: 1.3040, lng: 103.8318 },
    ],
    legs: [
      {
        id: 'nus-1',
        type: 'walk',
        title: 'Walk to Stephen Riady Centre Bus Stop',
        distanceMeters: 140,
        durationMins: 2,
        landmark: 'Past FairPrice Express & Starbucks at UTown Plaza',
        landmarkDetail: 'Wide open pedestrian mall leading directly to the sheltered bus bay',
        guidance: {
          full: 'Walk past FairPrice Express across Town Plaza. The UTown bus stop (16189) is 50 meters ahead on your left.',
          medium: 'Walk past FairPrice to UTown bus stop.',
          light: 'Walk to UTown bus stop.',
        },
        coordinates: [
          { lat: 1.3048, lng: 103.7725 },
          { lat: 1.3055, lng: 103.7732 },
        ],
      },
      {
        id: 'nus-2',
        type: 'bus',
        title: 'Take Bus 151 towards Buona Vista',
        distanceMeters: 2800,
        durationMins: 8,
        landmark: 'Alight at Buona Vista Station Exit A',
        landmarkDetail: 'Direct sheltered transfer to the East-West and Circle Line station gantries',
        guidance: {
          full: 'Board Bus 151 at Berth 1. Ride 4 stops along Clementi Road and Dover. Alight at Buona Vista MRT.',
          medium: 'Bus 151 to Buona Vista MRT (4 stops).',
          light: 'Bus 151 to Buona Vista.',
        },
        coordinates: [
          { lat: 1.3055, lng: 103.7732 },
          { lat: 1.3073, lng: 103.7901 },
        ],
      },
      {
        id: 'nus-3',
        type: 'mrt',
        title: 'East-West Line to City Hall, transfer to North-South Line to Orchard',
        distanceMeters: 7400,
        durationMins: 20,
        landmark: 'Orchard MRT Exit E underground concourse',
        landmarkDetail: 'Direct underground air-conditioned connection to ION Orchard Basement 2',
        guidance: {
          full: 'Take train towards City. Transfer to North-South Line towards Jurong East, alight at Orchard. Follow Exit E directly into ION Orchard.',
          medium: 'MRT to Orchard MRT. Take Exit E into ION Orchard.',
          light: 'MRT to Orchard Exit E.',
        },
        coordinates: [
          { lat: 1.3073, lng: 103.7901 },
          { lat: 1.3040, lng: 103.8318 },
        ],
      },
      {
        id: 'nus-4',
        type: 'walk',
        title: 'Enter ION Orchard Basement',
        distanceMeters: 80,
        durationMins: 2,
        landmark: 'ION Orchard Food Hall atrium',
        landmarkDetail: 'Enter through glass sliding doors into the main shopping gallery',
        guidance: {
          full: 'Tap out at Exit E. Walk straight through the glass sliding doors into ION Orchard atrium.',
          medium: 'Walk into ION Orchard atrium.',
          light: 'Enter ION Orchard.',
        },
        coordinates: [
          { lat: 1.3040, lng: 103.8318 },
          { lat: 1.3042, lng: 103.8322 },
        ],
      },
    ],
  },
  'toapayoh-bugis': {
    id: 'toapayoh-bugis',
    title: 'Toa Payoh Central to Bugis Junction',
    origin: 'Toa Payoh Central (Blk 177)',
    originCoords: { lat: 1.3327, lng: 103.8475 },
    destination: 'Bugis Junction',
    destinationCoords: { lat: 1.3008, lng: 103.8558 },
    totalDurationMins: 24,
    calculatedETA: '6:24 PM',
    desiredArrivalTime: '6:30 PM',
    personaTarget: 'General',
    polyline: [
      { lat: 1.3327, lng: 103.8475 },
      { lat: 1.3343, lng: 103.8494 },
      { lat: 1.3008, lng: 103.8553 },
      { lat: 1.3005, lng: 103.8557 },
    ],
    legs: [
      {
        id: 'tp-1',
        type: 'walk',
        title: 'Walk to Toa Payoh Bus Interchange Berth B4',
        distanceMeters: 180,
        durationMins: 3,
        landmark: 'FairPrice Supermarket & Toast Box at HDB Hub',
        landmarkDetail: 'Sheltered walkway through HDB Hub atrium to the air-conditioned interchange',
        guidance: {
          full: 'Walk through HDB Hub atrium past FairPrice and Toast Box to Berth B4 inside the bus interchange.',
          medium: 'Walk past FairPrice to Berth B4.',
          light: 'Head to Berth B4.',
        },
        coordinates: [
          { lat: 1.3327, lng: 103.8491 },
          { lat: 1.3343, lng: 103.8494 },
        ],
      },
      {
        id: 'tp-2',
        type: 'bus',
        title: 'Take Bus 145 towards Bugis',
        distanceMeters: 4500,
        durationMins: 18,
        landmark: 'Board Bus 145 at Berth B4',
        landmarkDetail: 'Ride 8 stops along Balestier Road and Lavender',
        guidance: {
          full: 'Board Bus 145 at Berth B4. Alight at Bugis Station / Middle Road (Stop 01112).',
          medium: 'Bus 145 to Bugis Station stop.',
          light: 'Bus 145 (8 stops).',
        },
        coordinates: [
          { lat: 1.3343, lng: 103.8494 },
          { lat: 1.3060, lng: 103.8530 },
          { lat: 1.3008, lng: 103.8553 },
        ],
      },
      {
        id: 'tp-3',
        type: 'walk',
        title: 'Walk through Bugis Junction atrium',
        distanceMeters: 120,
        durationMins: 3,
        landmark: 'Glass fountain square at Bugis Junction',
        landmarkDetail: 'Enter via glass doors past Starbucks into the mall atrium',
        guidance: {
          full: 'Alight at the bus stop. Turn right into the glass atrium of Bugis Junction. Your destination is right inside.',
          medium: 'Walk into Bugis Junction atrium.',
          light: 'Enter Bugis Junction.',
        },
        coordinates: [
          { lat: 1.3008, lng: 103.8553 },
          { lat: 1.3005, lng: 103.8557 },
        ],
      },
    ],
  },
};

export function getRouteById(id: string): SingaporeRoute {
  return SINGAPORE_ROUTES[id] || SINGAPORE_ROUTES['nus-orchard'];
}

/**
 * Known Singapore Landmark Geocoding Dictionary
 */
const KNOWN_SINGAPORE_PLACES: Record<string, { lat: number; lng: number; name: string }> = {
  nus: { lat: 1.3048, lng: 103.7725, name: 'NUS (University Town)' },
  orchard: { lat: 1.3040, lng: 103.8318, name: 'Orchard (ION Orchard)' },
  bugis: { lat: 1.3008, lng: 103.8558, name: 'Bugis Junction' },
  toapayoh: { lat: 1.3327, lng: 103.8475, name: 'Toa Payoh Central' },
  tampines: { lat: 1.3533, lng: 103.9452, name: 'Tampines Central' },
  raffles: { lat: 1.2830, lng: 103.8510, name: 'Raffles Place' },
  bedok: { lat: 1.3240, lng: 103.9300, name: 'Bedok MRT & Mall' },
  sgh: { lat: 1.2795, lng: 103.8344, name: 'Singapore General Hospital (SGH)' },
  punggol: { lat: 1.4024, lng: 103.9126, name: 'Punggol Oasis' },
  onenorth: { lat: 1.2990, lng: 103.7872, name: 'one-north (Fusionopolis)' },
  jurong: { lat: 1.3332, lng: 103.7423, name: 'Jurong East MRT & Jem' },
  mbs: { lat: 1.2839, lng: 103.8589, name: 'Marina Bay Sands' },
  changi: { lat: 1.3644, lng: 103.9915, name: 'Changi Airport Terminal 3' },
  bishan: { lat: 1.3506, lng: 103.8488, name: 'Bishan Junction 8' },
  dhobyghaut: { lat: 1.2991, lng: 103.8458, name: 'Dhoby Ghaut MRT' },
};

/**
 * Resolve text queries to coordinates in Singapore via OneMap Search API or Curated Gazetteer
 */
export async function resolveCoordinates(
  query: string | undefined
): Promise<{ lat: number; lng: number; displayName: string }> {
  if (!query || typeof query !== 'string') {
    return { lat: 1.304, lng: 103.8318, displayName: 'Singapore City Centre' };
  }
  const q = query.trim().toLowerCase();

  // 1. Direct dictionary match
  for (const [key, val] of Object.entries(KNOWN_SINGAPORE_PLACES)) {
    if (q.includes(key)) {
      return { lat: val.lat, lng: val.lng, displayName: val.name };
    }
  }

  // 2. Try OneMap Elasticsearch API if online
  try {
    const searchRes = await searchOneMapLocation(query);
    const results = Array.isArray(searchRes) ? searchRes : (searchRes as any)?.results || [];
    if (results.length > 0) {
      const top = results[0];
      const lat = parseFloat(top.latitude || top.LATITUDE || '1.3040');
      const lng = parseFloat(top.longitude || top.LONGITUDE || '103.8318');
      const name = top.building || top.name || top.address || query;
      return { lat, lng, displayName: name };
    }
  } catch (err) {
    console.warn('[Routing] OneMap geocode query error:', err);
  }

  // 3. Fallback to closest verified landmark or central Singapore
  return {
    lat: 1.3040,
    lng: 103.8318,
    displayName: query.trim() || 'Central Singapore',
  };
}

/**
 * Format minutes from now into a human-readable ETA (e.g. "9:18 AM")
 */
function calculateEtaString(minutesToAdd: number): string {
  const d = new Date(Date.now() + minutesToAdd * 60000);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Parse a "9:04 AM" / "6:30 PM" style string into minutes since midnight.
 */
function parseTimeToMinutes(timeStr: string): number | null {
  const match = timeStr?.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Compare a commuter's stated desired arrival time against the calculated ETA
 * to produce a genuine on-time/late status — instead of a hardcoded "On schedule"
 * that never reflected whether the desired time was actually achievable.
 */
export function computeArrivalStatus(
  desiredArrivalTime: string | undefined,
  calculatedETA: string | undefined
): { statusText: string; bufferMinutes: number | null } {
  const desiredMin = desiredArrivalTime ? parseTimeToMinutes(desiredArrivalTime) : null;
  const etaMin = calculatedETA ? parseTimeToMinutes(calculatedETA) : null;

  if (desiredMin === null || etaMin === null) {
    return { statusText: 'On schedule', bufferMinutes: null };
  }

  // Handle wraparound past midnight
  let diff = desiredMin - etaMin;
  if (diff < -12 * 60) diff += 24 * 60;
  if (diff > 12 * 60) diff -= 24 * 60;

  if (diff >= 10) {
    return { statusText: `On schedule (${diff} min buffer)`, bufferMinutes: diff };
  } else if (diff >= 0) {
    return { statusText: `Cutting it close (${diff} min buffer)`, bufferMinutes: diff };
  } else {
    return { statusText: `Running ${Math.abs(diff)} min late`, bufferMinutes: diff };
  }
}

/**
 * Plan any journey dynamically
 * Primary source: OneMap Public Transport API
 * Fallback: Deterministic Singapore multimodal engine
 */
export async function planJourney(input: PlanJourneyInput): Promise<Journey> {
  const originCoord = input.currentLocation
    ? {
        lat: input.currentLocation.lat,
        lng: input.currentLocation.lng,
        displayName: input.origin || 'Current Location',
      }
    : await resolveCoordinates(input.origin);
  const destCoord = await resolveCoordinates(input.destination);

  let routeSource: RouteSource = 'FALLBACK_PRESET';
  let steps: JourneyStep[] = [];
  let polylineCoords: [number, number][] = [];
  let totalDurationMins = 30;
  let totalDistanceMeters = 5000;

  // 1. Check if OneMap live transit routing is available
  if (hasOneMapPassword()) {
    try {
      const oneMapResult = await getOneMapPublicTransportRoute(
        originCoord.lat,
        originCoord.lng,
        destCoord.lat,
        destCoord.lng,
        'TRANSIT'
      );

      if (oneMapResult?.source === 'onemap_live' && oneMapResult?.data?.plan?.itineraries?.length > 0) {
        const itin = oneMapResult.data.plan.itineraries[0];
        routeSource = 'LIVE_ONEMAP';
        totalDurationMins = Math.round((itin.duration || 1800) / 60);
        totalDistanceMeters = Math.round(itin.walkDistance || 3000);

        // Convert OneMap legs to Eyes-Up JourneySteps
        const legs = itin.legs || [];
        steps = await Promise.all(legs.map(async (leg: any, idx: number) => {
          const mode = (leg.mode || 'WALK').toUpperCase();
          const type: TransportType =
            mode === 'BUS' ? 'bus' : mode === 'SUBWAY' || mode === 'RAIL' ? 'mrt' : 'walk';

          const legDuration = Math.max(1, Math.round((leg.duration || 120) / 60));
          const legDist = Math.round(leg.distance || 200);

          // Get a real landmark for this leg's starting point (live OneMap reverse
          // geocode, anywhere in Singapore — not just the curated fallback list)
          const startPt = { lat: leg.from?.lat || originCoord.lat, lng: leg.from?.lon || originCoord.lng };
          const endPt = { lat: leg.to?.lat || destCoord.lat, lng: leg.to?.lon || destCoord.lng };
          polylineCoords.push([startPt.lat, startPt.lng]);
          polylineCoords.push([endPt.lat, endPt.lng]);

          const lm = await getLandmarkContext({
            currentLocation: startPt,
            nextManeuver: leg.from?.name || 'Proceed towards destination',
          });

          const title =
            type === 'bus'
              ? `Take Bus ${leg.route || 'Transit'} from ${leg.from?.name || 'Bus Stop'}`
              : type === 'mrt'
              ? `${leg.route || 'MRT Line'} from ${leg.from?.name || 'Station'}`
              : `Walk to ${leg.to?.name || 'Next Transit Node'}`;

          return {
            id: `onemap-step-${idx + 1}`,
            type,
            title,
            lineName: leg.route || undefined,
            lineBadge: leg.route || (type === 'mrt' ? 'MRT' : 'BUS'),
            durationMins: legDuration,
            distanceMeters: legDist,
            boardingStop: leg.from?.name,
            alightingStop: leg.to?.name,
            landmark: lm.landmark,
            landmarkDetail: lm.landmarkDetail,
            landmarkIconName: lm.landmarkIconName,
            guidance: lm.guidance,
            reassuranceCue: lm.reassuranceCue,
            geometry: [
              [startPt.lat, startPt.lng],
              [endPt.lat, endPt.lng],
            ],
          };
        }));
      }
    } catch (err) {
      console.warn('[Routing] Live OneMap processing fell back to deterministic router:', err);
    }
  }

  // 2. Fallback / Offline / Preset Matching Engine
  if (steps.length === 0) {
    routeSource = 'FALLBACK_PRESET';
    const qOrig = input.origin.toLowerCase();
    const qDest = input.destination.toLowerCase();

    // Check if matches known presets
    let matchedPreset: SingaporeRoute | null = null;
    if (qOrig.includes('nus') && qDest.includes('orchard')) {
      matchedPreset = SINGAPORE_ROUTES['nus-orchard'];
    } else if (qOrig.includes('tampines') && qDest.includes('raffles')) {
      matchedPreset = SINGAPORE_ROUTES['rachel-tampines-raffles'];
    } else if (qOrig.includes('punggol') && qDest.includes('one-north')) {
      matchedPreset = SINGAPORE_ROUTES['arjun-punggol-onenorth'];
    } else if (qOrig.includes('bedok') && (qDest.includes('sgh') || qDest.includes('hospital'))) {
      matchedPreset = SINGAPORE_ROUTES['lim-bedok-sgh'];
    } else if (qOrig.includes('toa payoh') && qDest.includes('bugis')) {
      matchedPreset = SINGAPORE_ROUTES['toapayoh-bugis'];
    }

    if (matchedPreset) {
      totalDurationMins = matchedPreset.totalDurationMins;
      polylineCoords = matchedPreset.polyline.map((p) => [p.lat, p.lng]);
      steps = matchedPreset.legs.map((leg) => ({
        id: leg.id,
        type: leg.type,
        title: leg.title,
        durationMins: leg.durationMins,
        distanceMeters: leg.distanceMeters,
        landmark: leg.landmark,
        landmarkDetail: leg.landmarkDetail,
        guidance: leg.guidance,
        reassuranceCue: `On track alongside ${leg.landmark}.`,
        geometry: leg.coordinates.map((c) => [c.lat, c.lng]),
      }));
    } else {
      // Synthesize realistic dynamic multimodal route connecting origin and destination
      const directDist = calculateDistanceMeters(originCoord, destCoord);
      totalDistanceMeters = directDist;
      totalDurationMins = Math.max(15, Math.round(directDist / 350)); // ~21 km/h average speed in SG

      // Leg 1: Walk to nearest transit
      const startLm = await getLandmarkContext({ currentLocation: originCoord });
      const destLm = await getLandmarkContext({ currentLocation: destCoord });

      const midPt: LatLng = {
        lat: (originCoord.lat + destCoord.lat) / 2,
        lng: (originCoord.lng + destCoord.lng) / 2,
      };

      polylineCoords = [
        [originCoord.lat, originCoord.lng],
        [midPt.lat, midPt.lng],
        [destCoord.lat, destCoord.lng],
      ];

      steps = [
        {
          id: `dyn-step-1`,
          type: 'walk',
          title: `Walk past ${startLm.landmark} to Transit Concourse`,
          durationMins: 4,
          distanceMeters: 250,
          landmark: startLm.landmark,
          landmarkDetail: startLm.landmarkDetail,
          landmarkIconName: startLm.landmarkIconName,
          guidance: startLm.guidance,
          reassuranceCue: `Follow the sheltered linkway past ${startLm.landmark}.`,
          geometry: [
            [originCoord.lat, originCoord.lng],
            [midPt.lat, midPt.lng],
          ],
        },
        {
          id: `dyn-step-2`,
          type: 'mrt',
          title: `MRT Transit towards ${destCoord.displayName}`,
          lineName: 'MRT Trunk Service',
          lineBadge: 'MRT',
          durationMins: Math.max(10, totalDurationMins - 7),
          distanceMeters: Math.max(1000, directDist - 400),
          stopsCount: Math.max(3, Math.round(directDist / 1200)),
          landmark: 'Platform B (Towards City Centre)',
          landmarkDetail: 'Air-conditioned train concourse with priority seating',
          guidance: {
            full: `Board MRT towards ${destCoord.displayName}. Ride directly along the transit trunk corridor.`,
            medium: `MRT towards ${destCoord.displayName}.`,
            light: `MRT towards destination.`,
          },
          reassuranceCue: `Enjoy the ride; your eyes-up companion will notify you 1 stop before your exit.`,
          geometry: [
            [midPt.lat, midPt.lng],
            [destCoord.lat, destCoord.lng],
          ],
        },
        {
          id: `dyn-step-3`,
          type: 'walk',
          title: `Exit to ${destCoord.displayName} via ${destLm.landmark}`,
          durationMins: 3,
          distanceMeters: 150,
          landmark: destLm.landmark,
          landmarkDetail: destLm.landmarkDetail,
          landmarkIconName: destLm.landmarkIconName,
          guidance: destLm.guidance,
          reassuranceCue: `You have reached ${destCoord.displayName}.`,
          geometry: [
            [destCoord.lat, destCoord.lng],
            [destCoord.lat, destCoord.lng],
          ],
        },
      ];
    }
  }

  const calculatedETA = calculateEtaString(totalDurationMins);

  return {
    id: `journey-${Date.now()}`,
    title: `${originCoord.displayName || input.origin} to ${destCoord.displayName || input.destination}`,
    origin: originCoord.displayName || input.origin,
    destination: destCoord.displayName || input.destination,
    desiredArrivalTime: input.desiredArrivalTime || calculateEtaString(totalDurationMins + 15),
    calculatedETA,
    totalDurationMins,
    travelHistoryCount: 0,
    steps,
    routeSource,
    totalDistanceMeters,
    geometry: polylineCoords,
    legs: steps,
    originCoords: originCoord,
    destinationCoords: destCoord,
  };
}

/**
 * Intelligent Rerouting Engine
 * Recalculates from current commuter location, avoiding disrupted lines or recovering from missed stops.
 */
export async function recalculateJourney(input: RecalculateJourneyInput): Promise<Journey> {
  const destCoord = await resolveCoordinates(input.destination);
  const avoidDTL = input.avoidLines?.includes('DTL') || input.avoidLines?.includes('Downtown Line');

  // Check if rerouting is due to Downtown Line disruption near Bugis
  if (avoidDTL && destCoord.displayName.toLowerCase().includes('bugis')) {
    const alternativeETA = calculateEtaString(22); // Saves 18 mins vs 40 min delayed route
    return {
      id: `reroute-nel-${Date.now()}`,
      title: `${input.destination} (Bypass via NEL)`,
      origin: 'Current Commuter Location',
      destination: destCoord.displayName,
      desiredArrivalTime: '9:00 AM',
      calculatedETA: alternativeETA,
      totalDurationMins: 22,
      travelHistoryCount: 0,
      routeSource: 'FALLBACK_PRESET',
      steps: [
        {
          id: 'nel-bypass-1',
          type: 'walk',
          title: 'Walk to Dhoby Ghaut Interchange concourse',
          durationMins: 2,
          distanceMeters: 120,
          landmark: 'Dhoby Ghaut Glass Atrium & Travelator',
          landmarkDetail: 'Follow purple North East Line floor markings away from DTL concourse',
          guidance: {
            full: 'Follow the purple overhead signs towards the North East Line platform. Board train towards Punggol.',
            medium: 'Walk to North East Line towards Punggol.',
            light: 'Head to NEL platform.',
          },
          reassuranceCue: 'Good choice switching routes. You will bypass the track delay completely.',
        },
        {
          id: 'nel-bypass-2',
          type: 'mrt',
          title: 'North East Line to Little India, walk via covered linkway',
          lineName: 'North East Line',
          lineBadge: 'NEL',
          durationMins: 14,
          distanceMeters: 2800,
          stopsCount: 2,
          landmark: 'Little India MRT Exit E to Rochor Linkway',
          landmarkDetail: 'Continuous covered pedestrian canopy direct to Bugis Junction',
          guidance: {
            full: 'Ride 2 stops to Little India. Exit via Exit E and take the sheltered pedestrian linkway directly to Bugis.',
            medium: 'NEL to Little India, take sheltered linkway.',
            light: 'NEL to Little India.',
          },
          reassuranceCue: 'Arriving 18 minutes earlier than staying on the disrupted route.',
        },
        {
          id: 'nel-bypass-3',
          type: 'walk',
          title: 'Enter Bugis Junction Atrium',
          durationMins: 6,
          distanceMeters: 350,
          landmark: 'Bugis Junction Glass Atrium',
          landmarkDetail: 'Enter main shopping street directly into air-conditioned concourse',
          guidance: {
            full: 'Walk along the covered linkway into Bugis Junction. You have arrived safely.',
            medium: 'Walk into Bugis Junction.',
            light: 'Enter Bugis Junction.',
          },
          reassuranceCue: 'Safely arrived via the bypass route.',
        },
      ],
      geometry: [
        [input.currentLocation.lat, input.currentLocation.lng],
        [1.2991, 103.8458], // Dhoby Ghaut
        [1.3068, 103.8492], // Little India
        [1.3008, 103.8558], // Bugis
      ],
    };
  }

  // General recalculation from current position
  return planJourney({
    origin: `${input.currentLocation.lat.toFixed(4)}, ${input.currentLocation.lng.toFixed(4)}`,
    destination: input.destination,
    currentLocation: input.currentLocation,
  });
}
