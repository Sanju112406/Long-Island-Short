/**
 * Deterministic Singapore Routing & Landmark Context Service
 * Computes exact transport truth, routes, coordinates, and OpenStreetMap landmark anchors.
 * Supports multi-modal transit (walk, MRT, bus) and commuter personas.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteLeg {
  id: string;
  type: 'walk' | 'mrt' | 'bus' | 'cycle';
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
        title: 'Underground underpass to Republic Plaza',
        distanceMeters: 140,
        durationMins: 2,
        landmark: 'Raffles Place Exit D (Republic Plaza)',
        landmarkDetail: 'Direct subterranean connection, no street crossings required',
        guidance: {
          full: 'Tap out at Raffles Place Exit D. Take the short escalator directly into Republic Plaza lobby.',
          medium: 'Exit D directly into Republic Plaza.',
          light: 'Exit D to Republic Plaza.',
        },
        coordinates: [
          { lat: 1.2830, lng: 103.8510 },
          { lat: 1.2835, lng: 103.8515 },
        ],
      },
    ],
  },
  'arjun-punggol-onenorth': {
    id: 'arjun-punggol-onenorth',
    title: 'Punggol Drive to one-north (Multi-Modal)',
    origin: 'Punggol Drive (Oasis Terraces)',
    originCoords: { lat: 1.4044, lng: 103.9127 },
    destination: 'one-north (Fusionopolis)',
    destinationCoords: { lat: 1.2989, lng: 103.7876 },
    totalDurationMins: 52,
    calculatedETA: '9:22 AM',
    desiredArrivalTime: '9:45 AM',
    personaTarget: 'Arjun',
    polyline: [
      { lat: 1.4044, lng: 103.9127 },
      { lat: 1.4050, lng: 103.9020 },
      { lat: 1.3500, lng: 103.8730 },
      { lat: 1.3300, lng: 103.8500 },
      { lat: 1.2989, lng: 103.7876 },
    ],
    legs: [
      {
        id: 'arjun-1',
        type: 'cycle',
        title: 'Cycle along Punggol Park Connector to MRT',
        distanceMeters: 900,
        durationMins: 5,
        landmark: 'Waterway Point cycle track & yellow bike racks',
        landmarkDetail: 'Dedicated PCN path, fold bicycle before entering MRT station entrance',
        guidance: {
          full: 'Cycle along the Oasis Park Connector to Punggol MRT. Secure bike or fold it before entering.',
          medium: 'Cycle to Punggol MRT along Park Connector.',
          light: 'Cycle to Punggol MRT.',
        },
        coordinates: [
          { lat: 1.4044, lng: 103.9127 },
          { lat: 1.4050, lng: 103.9020 },
        ],
      },
      {
        id: 'arjun-2',
        type: 'mrt',
        title: 'North East Line to Serangoon, transfer to Circle Line',
        distanceMeters: 18200,
        durationMins: 42,
        landmark: 'Serangoon CCL Transfer & one-north Exit A',
        landmarkDetail: 'Air-conditioned Circle Line trains. Moderate crowding levels currently.',
        guidance: {
          full: 'Take NEL to Serangoon, cross over to the Circle Line platform towards HarbourFront, alight at one-north.',
          medium: 'NEL to Serangoon, then CCL to one-north.',
          light: 'NEL to Serangoon -> CCL to one-north.',
        },
        coordinates: [
          { lat: 1.4050, lng: 103.9020 },
          { lat: 1.3500, lng: 103.8730 },
          { lat: 1.2989, lng: 103.7876 },
        ],
      },
      {
        id: 'arjun-3',
        type: 'walk',
        title: 'Walk to Fusionopolis Lobby',
        distanceMeters: 100,
        durationMins: 2,
        landmark: 'Exit A escalator to Fusionopolis glass atrium',
        landmarkDetail: 'Direct sheltered basement connection to Fusionopolis',
        guidance: {
          full: 'Exit one-north MRT via Exit A. Unfold bike or head straight up to the plaza.',
          medium: 'Exit A directly to Fusionopolis.',
          light: 'Exit A to Fusionopolis.',
        },
        coordinates: [
          { lat: 1.2989, lng: 103.7876 },
          { lat: 1.2995, lng: 103.7882 },
        ],
      },
    ],
  },
  'lim-bedok-sgh': {
    id: 'lim-bedok-sgh',
    title: 'Bedok Central to Singapore General Hospital (SGH)',
    origin: 'Bedok Central (Blk 214)',
    originCoords: { lat: 1.3240, lng: 103.9300 },
    destination: 'Singapore General Hospital (Outram Community Hospital)',
    destinationCoords: { lat: 1.2798, lng: 103.8340 },
    totalDurationMins: 46,
    calculatedETA: '10:16 AM',
    desiredArrivalTime: '10:30 AM',
    personaTarget: 'Mdm Lim',
    polyline: [
      { lat: 1.3240, lng: 103.9300 },
      { lat: 1.3240, lng: 103.9290 },
      { lat: 1.3100, lng: 103.8800 },
      { lat: 1.2800, lng: 103.8400 },
      { lat: 1.2798, lng: 103.8340 },
    ],
    legs: [
      {
        id: 'lim-1',
        type: 'walk',
        title: 'Step-free sheltered walk to Bedok MRT Lift',
        distanceMeters: 150,
        durationMins: 5,
        landmark: 'Bedok Mall covered ramp to Lift B',
        landmarkDetail: 'Barrier-free ramp with handrails, gently sloping, 100% sheltered from sun and rain',
        guidance: {
          full: 'Follow the flat covered walkway past Bedok Mall. Take Lift B directly down to the concourse. No steps.',
          medium: 'Flat covered path to Lift B at Bedok MRT.',
          light: 'Take Lift B into Bedok MRT.',
        },
        coordinates: [
          { lat: 1.3240, lng: 103.9300 },
          { lat: 1.3240, lng: 103.9290 },
        ],
      },
      {
        id: 'lim-2',
        type: 'mrt',
        title: 'East-West Line to Outram Park (EW16) - 10 Stops',
        distanceMeters: 12400,
        durationMins: 26,
        landmark: 'Priority seating near train doors, alight Outram Park',
        landmarkDetail: 'All Outram Park platforms feature tactile guide paths directly to concourse lifts',
        guidance: {
          full: 'Board East-West Line towards Tuas Link. Priority seats are right by the middle doors. Alight at Outram Park.',
          medium: 'EWL train to Outram Park (10 stops).',
          light: 'EWL to Outram Park.',
        },
        coordinates: [
          { lat: 1.3240, lng: 103.9290 },
          { lat: 1.3100, lng: 103.8800 },
          { lat: 1.2798, lng: 103.8340 },
        ],
      },
      {
        id: 'lim-3',
        type: 'walk',
        title: 'Underground Lift B to SGH Campus Linkway',
        distanceMeters: 180,
        durationMins: 6,
        landmark: 'Outram Park Exit F / SGH Campus Linkway Lift',
        landmarkDetail: 'Wide air-conditioned underground linkway with travellators directly connecting to SGH Outram Community Hospital',
        guidance: {
          full: 'Alight and take Lift L1 up to Concourse level. Follow the wide sheltered linkway with travellators to SGH.',
          medium: 'Lift L1 to SGH covered linkway.',
          light: 'Follow SGH linkway from Lift L1.',
        },
        coordinates: [
          { lat: 1.2798, lng: 103.8340 },
          { lat: 1.2805, lng: 103.8348 },
        ],
      },
    ],
  },
  'nus-orchard': {
    id: 'nus-orchard',
    title: 'NUS (UTown) to Orchard (ION)',
    origin: 'National University of Singapore (UTown)',
    originCoords: { lat: 1.3052, lng: 103.7725 },
    destination: 'Orchard (ION Orchard)',
    destinationCoords: { lat: 1.3040, lng: 103.8318 },
    totalDurationMins: 42,
    calculatedETA: '9:12 AM',
    desiredArrivalTime: '9:30 AM',
    personaTarget: 'Arjun',
    polyline: [
      { lat: 1.3052, lng: 103.7725 },
      { lat: 1.3025, lng: 103.7758 },
      { lat: 1.2934, lng: 103.7845 },
      { lat: 1.3060, lng: 103.8050 },
      { lat: 1.3028, lng: 103.8240 },
      { lat: 1.3040, lng: 103.8318 },
    ],
    legs: [
      {
        id: 'nus-1',
        type: 'walk',
        title: 'Walk straight for 120m',
        distanceMeters: 120,
        durationMins: 3,
        landmark: 'Keep FairPrice on your left',
        landmarkDetail: 'Sheltered walkway past University Town Plaza & FairPrice Finest',
        guidance: {
          full: 'Walk straight for 120m. Keep FairPrice on your left as you head towards Kent Ridge Crescent bus stop.',
          medium: 'Walk 120m past FairPrice to the bus stop.',
          light: 'Head to the Kent Ridge Crescent bus stop.',
        },
        coordinates: [
          { lat: 1.3052, lng: 103.7725 },
          { lat: 1.3025, lng: 103.7758 },
        ],
      },
      {
        id: 'nus-2',
        type: 'bus',
        title: 'Take Bus 151 / 106 towards Orchard',
        distanceMeters: 6200,
        durationMins: 22,
        landmark: 'Board at Stop 16189, alight at Orchard Boulevard',
        landmarkDetail: 'Double-decker bus, upper deck has ample seating. Pass Botanic Gardens',
        guidance: {
          full: 'Board Bus 151 at Kent Ridge Crescent. Sit back for 9 stops — I’ll alert you before Napier Road.',
          medium: 'Bus 151 for 9 stops towards Orchard Boulevard.',
          light: 'Bus 151 (9 stops). I’ll alert you at Orchard.',
        },
        coordinates: [
          { lat: 1.3025, lng: 103.7758 },
          { lat: 1.3060, lng: 103.8050 },
          { lat: 1.3028, lng: 103.8240 },
        ],
      },
      {
        id: 'nus-3',
        type: 'walk',
        title: 'Walk through sheltered linkway to ION Orchard',
        distanceMeters: 250,
        durationMins: 4,
        landmark: 'Follow underground underpass towards Exit 4',
        landmarkDetail: 'Air-conditioned underpass directly connected to Orchard MRT concourse',
        guidance: {
          full: 'Alight at Orchard Boulevard. Take the escalator down into the sheltered underpass directly towards ION entrance.',
          medium: 'Enter the underpass straight ahead to ION Orchard.',
          light: 'Follow the linkway into ION Orchard.',
        },
        coordinates: [
          { lat: 1.3028, lng: 103.8240 },
          { lat: 1.3040, lng: 103.8318 },
        ],
      },
    ],
  },
  'toapayoh-bugis': {
    id: 'toapayoh-bugis',
    title: 'Toa Payoh Central to Bugis Junction',
    origin: 'Toa Payoh Central (Blk 177)',
    originCoords: { lat: 1.3327, lng: 103.8491 },
    destination: 'Bugis Junction / National Library',
    destinationCoords: { lat: 1.3008, lng: 103.8553 },
    totalDurationMins: 28,
    calculatedETA: '6:10 PM',
    desiredArrivalTime: '6:30 PM',
    personaTarget: 'General',
    polyline: [
      { lat: 1.3327, lng: 103.8491 },
      { lat: 1.3343, lng: 103.8494 },
      { lat: 1.3200, lng: 103.8520 },
      { lat: 1.3060, lng: 103.8530 },
      { lat: 1.3008, lng: 103.8553 },
    ],
    legs: [
      {
        id: 'tp-1',
        type: 'walk',
        title: 'Walk towards Toa Payoh Bus Interchange',
        distanceMeters: 180,
        durationMins: 4,
        landmark: 'Pass FairPrice and orange pillars',
        landmarkDetail: 'Sheltered linkway past FairPrice Supermarket, turn left at Toast Box',
        guidance: {
          full: 'Walk straight past FairPrice on your left. Turn left after the orange pillars towards Berth B4.',
          medium: 'Walk past FairPrice and turn left towards Berth B4.',
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
