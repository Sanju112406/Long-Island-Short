/**
 * LandmarkContextService
 * Converts raw navigation geometry into Eyes-Up Singapore landmark guidance.
 * Ensures the agent anchors turns and maneuvers to verified physical Singapore landmarks
 * rather than abstract GPS coordinates.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface VerifiedLandmark {
  id: string;
  name: string;
  detail: string;
  category: 'mrt_exit' | 'mall' | 'supermarket' | 'hawker' | 'linkway' | 'landmark' | 'transit_hub';
  icon: 'store' | 'coffee' | 'landmark' | 'building' | 'crosswalk' | 'train' | 'bus';
  lat: number;
  lng: number;
}

export interface LandmarkContextInput {
  currentLocation?: LatLng;
  nextManeuver?: string;
  heading?: number;
  routeStep?: {
    title: string;
    type: string;
    coordinates?: LatLng[];
  };
  originCoords?: LatLng;
  destinationCoords?: LatLng;
}

export interface LandmarkContextResult {
  action: string;
  distanceMeters: number;
  landmark: string;
  landmarkDetail: string;
  relationship: 'AFTER' | 'BEFORE' | 'PAST' | 'AT' | 'ALONGSIDE';
  confidence: number;
  guidance: {
    full: string;
    medium: string;
    light: string;
  };
  reassuranceCue: string;
  landmarkIconName?: 'store' | 'coffee' | 'landmark' | 'building' | 'crosswalk' | 'train' | 'bus';
}

// Verified Singapore Landmark Geospatial Catalog
export const VERIFIED_SINGAPORE_LANDMARKS: VerifiedLandmark[] = [
  // Central / Orchard
  {
    id: 'sg-ion-orchard',
    name: 'ION Orchard & MRT Exit E',
    detail: 'Underground passage connecting to North-South Line concourse',
    category: 'mall',
    icon: 'building',
    lat: 1.3040,
    lng: 103.8318,
  },
  {
    id: 'sg-wisma-atria',
    name: 'Wisma Atria Sheltered Linkway',
    detail: 'Air-conditioned underground linkway to Orchard MRT',
    category: 'linkway',
    icon: 'building',
    lat: 1.3038,
    lng: 103.8335,
  },
  {
    id: 'sg-somerset-313',
    name: '313@somerset & Exit B Gantries',
    detail: 'Direct access to Somerset MRT platform concourse',
    category: 'mall',
    icon: 'train',
    lat: 1.3009,
    lng: 103.8384,
  },
  // West / NUS / one-north
  {
    id: 'sg-utown-stephen-riady',
    name: 'Stephen Riady Centre (UTown)',
    detail: 'Open plaza with FairPrice Express and Cheers convenience store',
    category: 'supermarket',
    icon: 'store',
    lat: 1.3048,
    lng: 103.7725,
  },
  {
    id: 'sg-kent-ridge-exit-a',
    name: 'Kent Ridge MRT Exit A & NUH Underpass',
    detail: 'Sheltered ramp leading past Kopitiam toward NUH main building',
    category: 'mrt_exit',
    icon: 'train',
    lat: 1.2933,
    lng: 103.7845,
  },
  {
    id: 'sg-fusionopolis-exit-b',
    name: 'Fusionopolis Concourse & one-north MRT Exit B',
    detail: 'Wide sheltered escalator bank beside Starbucks',
    category: 'mrt_exit',
    icon: 'coffee',
    lat: 1.2990,
    lng: 103.7872,
  },
  {
    id: 'sg-buona-vista-interchange',
    name: 'Buona Vista Interchange Linkway',
    detail: 'High-ceiling elevated transfer bridge connecting EWL and CCL lines',
    category: 'transit_hub',
    icon: 'train',
    lat: 1.3073,
    lng: 103.7901,
  },
  // North / Toa Payoh / Bishan
  {
    id: 'sg-toa-payoh-hub',
    name: 'HDB Hub & Toa Payoh Bus Interchange',
    detail: 'FairPrice Supermarket & Toast Box opposite Berth B4',
    category: 'supermarket',
    icon: 'store',
    lat: 1.3327,
    lng: 103.8475,
  },
  {
    id: 'sg-bishan-junction8',
    name: 'Junction 8 Atrium & Bishan MRT Exit C',
    detail: 'Busy shopping concourse connecting NSL and Circle Line transfers',
    category: 'mall',
    icon: 'building',
    lat: 1.3506,
    lng: 103.8488,
  },
  // East / Tampines / Bedok / Bugis
  {
    id: 'sg-bugis-junction-glass',
    name: 'Bugis Junction Glass Fountain Plaza',
    detail: 'Covered glass atrium between Bugis MRT Exit C and BHG Department Store',
    category: 'mall',
    icon: 'landmark',
    lat: 1.3008,
    lng: 103.8558,
  },
  {
    id: 'sg-bugis-street-crossing',
    name: 'Bugis Street Pedestrian Crossing',
    detail: 'High-visibility zebra crossing with tactile paving toward Albert Centre',
    category: 'linkway',
    icon: 'crosswalk',
    lat: 1.3012,
    lng: 103.8542,
  },
  {
    id: 'sg-tampines-1-linkway',
    name: 'Tampines 1 Sheltered Linkway & Exit A',
    detail: 'Covered canopy connecting bus interchange past Tampines 1 taxi stand',
    category: 'linkway',
    icon: 'train',
    lat: 1.3533,
    lng: 103.9452,
  },
  {
    id: 'sg-bedok-mall-concourse',
    name: 'Bedok Mall Basement & MRT Exit B',
    detail: 'Wide barrier-free underpass with direct priority lift to street level',
    category: 'transit_hub',
    icon: 'train',
    lat: 1.3240,
    lng: 103.9300,
  },
  // South / CBD / SGH
  {
    id: 'sg-raffles-place-republic',
    name: 'Raffles Place MRT Exit D & Republic Plaza',
    detail: 'Covered granite concourse with digital arrival board',
    category: 'mrt_exit',
    icon: 'building',
    lat: 1.2830,
    lng: 103.8510,
  },
  {
    id: 'sg-dhoby-ghaut-atrium',
    name: 'Dhoby Ghaut Atrium & The Cathay Link',
    detail: 'Tri-line underground transfer interchange with travelators',
    category: 'transit_hub',
    icon: 'train',
    lat: 1.2991,
    lng: 103.8458,
  },
  {
    id: 'sg-sgh-bowyer-block',
    name: 'SGH Bowyer Block Clock Tower',
    detail: 'Historic medical landmark near Outram Park MRT Exit 3',
    category: 'landmark',
    icon: 'landmark',
    lat: 1.2795,
    lng: 103.8344,
  },
  {
    id: 'sg-outram-park-exit-3',
    name: 'Outram Park MRT Exit 3 Step-Free Lift',
    detail: 'Accessible lift concourse leading directly to SGH shuttle bus shelter',
    category: 'mrt_exit',
    icon: 'train',
    lat: 1.2803,
    lng: 103.8398,
  },
  // North-East / Punggol
  {
    id: 'sg-oasis-terraces-plaza',
    name: 'Oasis Terraces Waterfront Plaza',
    detail: 'Community plaza with covered linkway connecting Oasis LRT station to PCN',
    category: 'mall',
    icon: 'landmark',
    lat: 1.4024,
    lng: 103.9126,
  },
  {
    id: 'sg-punggol-waterway-pcn',
    name: 'Punggol Waterway Park Connector (PCN)',
    detail: 'Smooth paved cycling and pedestrian track with clear distance markers',
    category: 'linkway',
    icon: 'crosswalk',
    lat: 1.4050,
    lng: 103.9020,
  },
];

/**
 * Calculate distance in meters between two lat/lng coordinates using the Haversine formula
 */
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Find the closest verified landmark to a given coordinate
 */
export function findNearestLandmark(
  location: LatLng,
  maxDistanceMeters: number = 5000
): { landmark: VerifiedLandmark; distanceMeters: number } | null {
  let closest: VerifiedLandmark | null = null;
  let minDistance = Infinity;

  for (const lm of VERIFIED_SINGAPORE_LANDMARKS) {
    const dist = calculateDistanceMeters(location, { lat: lm.lat, lng: lm.lng });
    if (dist < minDistance && dist <= maxDistanceMeters) {
      minDistance = dist;
      closest = lm;
    }
  }

  if (closest) {
    return { landmark: closest, distanceMeters: minDistance };
  }

  return null;
}

/**
 * Convert navigation geometry and location into eyes-up landmark guidance
 */
export function getLandmarkContext(input: LandmarkContextInput): LandmarkContextResult {
  const pos = input.currentLocation || input.originCoords || { lat: 1.3040, lng: 103.8318 };
  const nearest = findNearestLandmark(pos, 8000);

  const landmarkName = nearest ? nearest.landmark.name : 'MRT Station Concourse';
  const landmarkDetail = nearest ? nearest.landmark.detail : 'Sheltered pedestrian linkway';
  const icon = nearest?.landmark.icon || 'landmark';
  const dist = nearest ? nearest.distanceMeters : 120;

  // Determine relationship based on distance & maneuver
  let relationship: 'AFTER' | 'BEFORE' | 'PAST' | 'AT' | 'ALONGSIDE' = 'AT';
  let action = input.nextManeuver || 'CONTINUE_STRAIGHT';

  if (dist < 40) {
    relationship = 'AT';
  } else if (dist < 150) {
    relationship = 'AFTER';
  } else {
    relationship = 'ALONGSIDE';
  }

  // Construct tiered Eyes-Up instructions (Full, Medium, Light)
  const fullGuidance = `${action === 'TURN_LEFT' ? 'Turn left' : action === 'TURN_RIGHT' ? 'Turn right' : 'Walk straight'} past ${landmarkName}. ${landmarkDetail}. Keep your eyes up; the next turn is in ${dist} meters.`;
  const mediumGuidance = `Past ${landmarkName}, continue along the sheltered path (${dist}m).`;
  const lightGuidance = `Head past ${landmarkName.split('&')[0].trim()}.`;

  return {
    action,
    distanceMeters: dist,
    landmark: landmarkName,
    landmarkDetail,
    relationship,
    confidence: nearest ? 0.95 : 0.75,
    guidance: {
      full: fullGuidance,
      medium: mediumGuidance,
      light: lightGuidance,
    },
    reassuranceCue: `You are right on track alongside ${landmarkName}.`,
    landmarkIconName: icon,
  };
}
