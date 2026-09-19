import { EyesUpMoment, JourneyStep } from '../types';

export const CURATED_EYES_UP_MOMENTS: EyesUpMoment[] = [
  {
    id: 'moment-dragon-playground',
    title: 'Toa Payoh Dragon Playground',
    subtitle: 'Passing near Toa Payoh / Braddell Corridor',
    nearbyTransitCorridor: 'North-South Line (NSL) & Toa Payoh Trunk Bus Corridor',
    shortFact:
      'Designed in 1979 by HDB architect Khor Ean Ghee, its terrazzo-tiled spine and spiral steel slide made it an enduring icon of Singaporean childhood.',
    audioStory:
      'Look out towards Toa Payoh. Built in 1979 by Khor Ean Ghee using colorful terrazzo tiles, this dragon playground is one of the very few sand-pit heritage playgrounds preserved in Singapore.',
    category: 'Heritage',
    stampBadge: {
      icon: '🐉',
      label: 'Dragon Playground',
      bgGradient: 'from-amber-500 to-red-600',
      borderTone: 'border-amber-400',
    },
    keywords: ['toa payoh', 'braddell', 'bishan', 'north-south', 'ns19', 'ns18'],
  },
  {
    id: 'moment-ion-orchard-tree',
    title: 'The Orchard Canopy & Seed',
    subtitle: 'Approaching Orchard / Somerset Boulevard',
    nearbyTransitCorridor: 'North-South Line & Thomson-East Coast Line',
    shortFact:
      'ION Orchard’s organic parametric facade was inspired by the seeds, roots, and nutmeg plantations that covered Orchard Road in the 1830s.',
    audioStory:
      'As you reach Orchard, glance at the glass canopy above. The flowing curves were designed to evoke towering fruit trees and nutmeg seeds from Singapore’s plantation era.',
    category: 'Architecture',
    stampBadge: {
      icon: '🌳',
      label: 'Orchard Canopy',
      bgGradient: 'from-emerald-500 to-teal-700',
      borderTone: 'border-emerald-400',
    },
    keywords: ['orchard', 'somerset', 'dhoby ghaut', 'ion', 'ns22', 'te14'],
  },
  {
    id: 'moment-redhill-pink',
    title: 'The Crimson Underground of Redhill',
    subtitle: 'Approaching Redhill / Queenstown',
    nearbyTransitCorridor: 'East-West Line (EWL)',
    shortFact:
      'Redhill MRT is the only station in Singapore painted in full pastel millennial pink, inspired by the legend of Bukit Merah (Red Hill) and legendary swordfish.',
    audioStory:
      'Passing Redhill. The entire station is finished in signature pastel pink, celebrating the folklore of Radin Mas and the red soil of Bukit Merah.',
    category: 'Architecture',
    stampBadge: {
      icon: '🌸',
      label: 'Pink Redhill',
      bgGradient: 'from-pink-500 to-rose-600',
      borderTone: 'border-pink-300',
    },
    keywords: ['redhill', 'queenstown', 'tiong bahru', 'bukit merah', 'ew18', 'ew17'],
  },
  {
    id: 'moment-tanjong-pagar-railway',
    title: 'Old Tanjong Pagar Railway Heritage',
    subtitle: 'Passing Keppel / Tanjong Pagar Way',
    nearbyTransitCorridor: 'East-West Line & Circle Line Keppel extension',
    shortFact:
      'Completed in 1932 with Art Deco grandeur, the station hall features 4 massive marble statues symbolizing Agriculture, Commerce, Transport, and Industry.',
    audioStory:
      'To the south lies the 1932 Tanjong Pagar Railway Station, where steam locomotives once departed across the causeway all the way to London.',
    category: 'Heritage',
    stampBadge: {
      icon: '🚂',
      label: 'Historic Railway',
      bgGradient: 'from-stone-600 to-slate-900',
      borderTone: 'border-amber-300',
    },
    keywords: ['tanjong pagar', 'keppel', 'outram', 'cantonment', 'ew15', 'cc30'],
  },
  {
    id: 'moment-botanic-bandstand',
    title: 'Botanic Gardens 1930s Bandstand',
    subtitle: 'Near Botanic Gardens & Napier',
    nearbyTransitCorridor: 'Circle Line & Downtown Line (CC19 / DT9 / TE12)',
    shortFact:
      'Erected in 1930 atop a small hill surrounded by ringed yellow rain trees, this octagonal gazebo hosted regimental sunset military concerts.',
    audioStory:
      'Beside the rail corridor stands Singapore’s UNESCO World Heritage Botanic Gardens, where the 1930 octagonal bandstand still stands beneath heritage rain trees.',
    category: 'Nature',
    stampBadge: {
      icon: '🎷',
      label: 'Heritage Bandstand',
      bgGradient: 'from-lime-600 to-emerald-800',
      borderTone: 'border-lime-400',
    },
    keywords: ['botanic', 'napier', 'stevens', 'farrer', 'bukit timah', 'cc19', 'dt9'],
  },
  {
    id: 'moment-rochor-canals',
    title: 'Rochor Canals & Rainbow Shophouses',
    subtitle: 'Passing Bugis / Rochor Canal Road',
    nearbyTransitCorridor: 'Downtown Line & East-West Line (DT14 / EW12)',
    shortFact:
      'Once a bustling trade waterway for timber boats, the canal now flows past restored pastel heritage shophouses and neighborhood mural corridors.',
    audioStory:
      'Notice the Rochor waterway outside. What was once a busy timber trading canal is now a lively green corridor connecting Little India and Bugis.',
    category: 'Neighbourhood',
    stampBadge: {
      icon: '🌈',
      label: 'Rochor Rainbow',
      bgGradient: 'from-cyan-500 to-blue-700',
      borderTone: 'border-cyan-300',
    },
    keywords: ['bugis', 'rochor', 'jalan besar', 'little india', 'dt14', 'ew12', 'middle road'],
  },
  {
    id: 'moment-fort-canning-spice',
    title: 'Fort Canning Hill Spice Garden',
    subtitle: 'Passing City Hall / Clarke Quay',
    nearbyTransitCorridor: 'North-East Line & Downtown Line (NE5 / DT20 / NS25)',
    shortFact:
      'In 1822, Singapore’s first experimental botanical garden was planted here with 125 nutmeg trees, creating Singapore’s spice trade foundation.',
    audioStory:
      'Rising above the station is Fort Canning Hill, the Forbidden Hill where ancient 14th-century kings held court and Singapore’s first spice plantations grew.',
    category: 'Heritage',
    stampBadge: {
      icon: '🌿',
      label: 'Spice Hill',
      bgGradient: 'from-amber-600 to-yellow-800',
      borderTone: 'border-yellow-400',
    },
    keywords: ['fort canning', 'clarke quay', 'city hall', 'dhoby ghaut', 'ne5', 'dt20', 'ns25'],
  },
  {
    id: 'moment-marina-lotus',
    title: 'The ArtScience Lotus Blossom',
    subtitle: 'Approaching Marina Bay & Promontory',
    nearbyTransitCorridor: 'Circle Line & Thomson-East Coast Line (CC4 / TE20 / DT16)',
    shortFact:
      'Designed by Moshe Safdie as “The Welcoming Hand of Singapore”, its 10 petals channel rainfall down a 35-meter interior waterfall into a lily pond.',
    audioStory:
      'Looking across the bay, the lotus petals of the ArtScience Museum gather Singapore’s heavy tropical rains to cool the interior galleries naturally.',
    category: 'Art',
    stampBadge: {
      icon: '🪷',
      label: 'Marina Lotus',
      bgGradient: 'from-indigo-500 to-purple-800',
      borderTone: 'border-indigo-300',
    },
    keywords: ['marina bay', 'bayfront', 'promontory', 'downtown', 'cc4', 'te20', 'dt16'],
  },
  {
    id: 'moment-haji-lane',
    title: 'Haji Lane Pilgrimage Shophouses',
    subtitle: 'Passing Kampong Glam / Beach Road',
    nearbyTransitCorridor: 'Downtown Line (DT14) & East-West Line',
    shortFact:
      'In the 1800s, this narrow street housed Islamic pilgrims traveling by ship to Mecca. Today, it is Singapore’s narrowest lane of street murals.',
    audioStory:
      'Beside Bugis lies Haji Lane. Once a quiet lodging alley for seafaring Mecca pilgrims, it is now Singapore’s most vibrant living art gallery.',
    category: 'Art',
    stampBadge: {
      icon: '🎨',
      label: 'Haji Lane Murals',
      bgGradient: 'from-violet-600 to-fuchsia-700',
      borderTone: 'border-violet-300',
    },
    keywords: ['haji lane', 'kampong glam', 'bugis', 'beach road', 'arab street'],
  },
  {
    id: 'moment-bishan-park',
    title: 'Bishan River Naturalization',
    subtitle: 'Passing Bishan / Ang Mo Kio Transit Link',
    nearbyTransitCorridor: 'North-South Line & Circle Line (NS17 / CC15)',
    shortFact:
      'Singapore demolished a 2.7km concrete stormwater canal here to recreate a meandering natural riverbed that brought back wild smooth-coated otters.',
    audioStory:
      'Outside Bishan, the old concrete canal was broken down and restored into a lush natural river where Singapore’s famous otter families fish daily.',
    category: 'Nature',
    stampBadge: {
      icon: '🦦',
      label: 'Bishan Otters',
      bgGradient: 'from-teal-600 to-emerald-900',
      borderTone: 'border-teal-300',
    },
    keywords: ['bishan', 'ang mo kio', 'marymount', 'lorong chuan', 'ns17', 'cc15'],
  },
];

/**
 * Match the most relevant Eyes Up Moment for a journey step or fallback to a rotating curated discovery
 */
export function findMomentForStep(
  step: JourneyStep | null | undefined,
  stepIndex: number = 0,
  journeyTitle: string = ''
): EyesUpMoment {
  if (!step) {
    return CURATED_EYES_UP_MOMENTS[stepIndex % CURATED_EYES_UP_MOMENTS.length];
  }

  const searchHaystack = `${step.title} ${step.landmark} ${step.landmarkDetail} ${step.lineName || ''} ${
    step.boardingStop || ''
  } ${step.alightingStop || ''} ${journeyTitle}`.toLowerCase();

  // 1. Direct keyword match
  const matched = CURATED_EYES_UP_MOMENTS.find((m) =>
    m.keywords.some((kw) => searchHaystack.includes(kw))
  );

  if (matched) return matched;

  // 2. Fallback deterministically by step index + step type
  const offset = step.type === 'mrt' ? 1 : step.type === 'bus' ? 2 : 0;
  return CURATED_EYES_UP_MOMENTS[(stepIndex + offset) % CURATED_EYES_UP_MOMENTS.length];
}
