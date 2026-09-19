import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Clock,
  ArrowRight,
  CloudRain,
  Sun,
  ShieldCheck,
  Sparkles,
  Train,
  Bus,
  Footprints,
  Umbrella,
  CheckCircle2,
  Navigation,
  Loader2,
  Plus,
  Trash2,
  Users,
  Route,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getDefaultLiveTargetTime } from '../utils/timeUtils';
import { Journey, RouteOption } from '../types';

interface HomeJourneyPlannerViewProps {
  onStartJourney: (selectedJourney: Journey) => void;
  currentRouteId: string;
}

interface OneMapSearchResult {
  name: string;
  address: string;
  postalCode: string;
}

export const HomeJourneyPlannerView: React.FC<HomeJourneyPlannerViewProps> = ({
  onStartJourney,
  currentRouteId,
}) => {
  const [origin, setOrigin] = useState('NUS (University Town)');
  const [destination, setDestination] = useState('Orchard (ION Orchard)');
  const [arrivalTime, setArrivalTime] = useState(() => getDefaultLiveTargetTime(35, 10));

  // Multi-destination (Via Stops)
  const [viaStops, setViaStops] = useState<string[]>([]);
  const [viaSuggestions, setViaSuggestions] = useState<{ [index: number]: OneMapSearchResult[] }>({});
  const [activeViaSearchingIndex, setActiveViaSearchingIndex] = useState<number | null>(null);

  // Multi-origin (Meet Halfway)
  const [showSecondaryOrigin, setShowSecondaryOrigin] = useState(false);
  const [secondaryOrigin, setSecondaryOrigin] = useState('Tampines Mall');
  const [secondarySuggestions, setSecondarySuggestions] = useState<OneMapSearchResult[]>([]);
  const [isSearchingSecondary, setIsSearchingSecondary] = useState(false);

  const [originSuggestions, setOriginSuggestions] = useState<OneMapSearchResult[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<OneMapSearchResult[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [weather, setWeather] = useState<{
    area: string;
    forecast: string;
    isRaining: boolean;
    advice: string;
  } | null>(null);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/weather/nowcast?area=Central')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setWeather(data);
      })
      .catch((err) => console.warn('Weather fetch error:', err));
  }, []);

  // Fetch route options whenever user searches or on initial mount
  const calculateRoutes = async (
    origStr = origin,
    destStr = destination,
    arrTime = arrivalTime,
    vStops = viaStops,
    secOrig = showSecondaryOrigin ? secondaryOrigin : undefined
  ) => {
    setIsCalculatingRoutes(true);
    try {
      const res = await fetch('/api/journey/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origStr || 'NUS (University Town)',
          destination: destStr || 'Orchard (ION Orchard)',
          desiredArrivalTime: arrTime || getDefaultLiveTargetTime(35, 10),
          viaStops: vStops.filter((s) => s.trim().length > 0),
          secondaryOrigin: secOrig && secOrig.trim().length > 0 ? secOrig.trim() : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.routes && Array.isArray(data.routes) && data.routes.length > 0) {
          setRouteOptions(data.routes);
          setSelectedOptionId(data.routes[0].id);
        } else if (data.journey || data.steps) {
          const singleJourney = data.journey || data;
          const fallbackOpts: RouteOption[] = [
            {
              id: singleJourney.id,
              tag: 'Recommended • Fastest Transit',
              tagType: 'recommended',
              durationMins: singleJourney.totalDurationMins || 25,
              calculatedETA: singleJourney.calculatedETA,
              transfersCount: 0,
              shelteredPercentage: 90,
              summary: 'Direct MRT/Bus transit corridor with landmark guidance.',
              journey: singleJourney,
              rendezvousInfo: singleJourney.rendezvousInfo,
            },
          ];
          setRouteOptions(fallbackOpts);
          setSelectedOptionId(singleJourney.id);
        }
      }
    } catch (err) {
      console.warn('Failed to calculate route options:', err);
    } finally {
      setIsCalculatingRoutes(false);
    }
  };

  useEffect(() => {
    calculateRoutes();
  }, []);

  // OneMap search query for origin
  const handleOriginChange = (val: string) => {
    setOrigin(val);
    if (val.trim().length >= 2) {
      setIsSearchingOrigin(true);
      fetch(`/api/onemap/search?q=${encodeURIComponent(val)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.results) setOriginSuggestions(data.results.slice(0, 4));
        })
        .catch(() => {})
        .finally(() => setIsSearchingOrigin(false));
    } else {
      setOriginSuggestions([]);
    }
  };

  // OneMap search query for destination
  const handleDestChange = (val: string) => {
    setDestination(val);
    if (val.trim().length >= 2) {
      setIsSearchingDest(true);
      fetch(`/api/onemap/search?q=${encodeURIComponent(val)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.results) setDestSuggestions(data.results.slice(0, 4));
        })
        .catch(() => {})
        .finally(() => setIsSearchingDest(false));
    } else {
      setDestSuggestions([]);
    }
  };

  // OneMap search query for secondary origin (Meet halfway)
  const handleSecondaryOriginChange = (val: string) => {
    setSecondaryOrigin(val);
    if (val.trim().length >= 2) {
      setIsSearchingSecondary(true);
      fetch(`/api/onemap/search?q=${encodeURIComponent(val)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.results) setSecondarySuggestions(data.results.slice(0, 4));
        })
        .catch(() => {})
        .finally(() => setIsSearchingSecondary(false));
    } else {
      setSecondarySuggestions([]);
    }
  };

  // OneMap search query for via stop
  const handleViaChange = (index: number, val: string) => {
    const updated = [...viaStops];
    updated[index] = val;
    setViaStops(updated);

    if (val.trim().length >= 2) {
      setActiveViaSearchingIndex(index);
      fetch(`/api/onemap/search?q=${encodeURIComponent(val)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.results) {
            setViaSuggestions((prev) => ({ ...prev, [index]: data.results.slice(0, 4) }));
          }
        })
        .catch(() => {})
        .finally(() => setActiveViaSearchingIndex(null));
    } else {
      setViaSuggestions((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const addViaStop = () => {
    if (viaStops.length < 3) {
      setViaStops([...viaStops, '']);
    }
  };

  const removeViaStop = (index: number) => {
    const updated = viaStops.filter((_, i) => i !== index);
    setViaStops(updated);
    const newSugg = { ...viaSuggestions };
    delete newSugg[index];
    setViaSuggestions(newSugg);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateRoutes(
      origin,
      destination,
      arrivalTime,
      viaStops,
      showSecondaryOrigin ? secondaryOrigin : undefined
    );
  };

  const handleStartTravel = (option: RouteOption) => {
    onStartJourney(option.journey);
  };

  return (
    <div id="home-journey-planner-view" className="p-4 space-y-4 animate-in fade-in duration-200">
      {/* Weather Header Badge (data.gov.sg real-time, clickable to expand full message) */}
      {weather && (
        <div
          id="weather-nowcast-card"
          onClick={() => setIsWeatherExpanded((prev) => !prev)}
          role="button"
          tabIndex={0}
          aria-expanded={isWeatherExpanded}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsWeatherExpanded((prev) => !prev);
            }
          }}
          className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-200/90 dark:border-red-900/60 shadow-xs hover:border-red-400 dark:hover:border-red-700 transition-all cursor-pointer select-none space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 shrink-0">
                {weather.isRaining ? (
                  <CloudRain className="w-4 h-4 text-sky-600 animate-pulse" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Singapore Nowcast: {weather.forecast}
                  </span>
                  <span className="text-[9px] font-black uppercase bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                    {weather.isRaining ? 'Rain Alert' : 'Fair Weather'}
                  </span>
                </div>
                {!isWeatherExpanded && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                    {weather.advice}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/80 px-2 py-0.5 rounded-full">
                data.gov.sg
              </span>
              <div className="p-1 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400">
                {isWeatherExpanded ? (
                  <ChevronUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </div>
            </div>
          </div>

          {/* Expanded Full Message & Transit Recommendations */}
          {isWeatherExpanded && (
            <div className="pt-2.5 border-t border-red-200/70 dark:border-red-900/50 space-y-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-red-100 dark:border-red-900/40 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Umbrella className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>Commuter Shelter Advisory</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed">
                  {weather.advice}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-red-100/50 dark:bg-red-950/60 border border-red-200/50 dark:border-red-900/30">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Monitored Zone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{weather.area || 'Central Singapore'}</span>
                </div>
                <div className="p-2 rounded-xl bg-red-100/50 dark:bg-red-950/60 border border-red-200/50 dark:border-red-900/30">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Transit Routing</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {weather.isRaining ? 'Sheltered Paths Boosted' : 'All Routes Optimal'}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right pt-0.5">
                Tap anywhere to collapse ▴
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hero Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[11px] font-bold">
          <Compass className="w-3 h-3" />
          <span>Singapore Transit Route Planner</span>
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Plan Your Transit Journey
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Compare route options, add intermediate stopovers, or coordinate with a friend to meet halfway and travel together.
        </p>
      </div>

      {/* Journey Form */}
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          {/* Origin */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-600" />
                Origin (Your Starting Point)
              </label>
              {isSearchingOrigin && (
                <span className="text-[10px] text-red-600 dark:text-red-400 animate-pulse font-semibold">
                  Searching OneMap...
                </span>
              )}
            </div>
            <input
              id="journey-origin-input"
              type="text"
              value={origin}
              onChange={(e) => handleOriginChange(e.target.value)}
              placeholder="e.g. NUS (University Town)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            {originSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>OneMap Verified Places</span>
                  <span className="font-mono text-red-600">SLA</span>
                </div>
                {originSuggestions.map((item, idx) => (
                  <button
                    key={`${item.name}-${idx}`}
                    type="button"
                    onClick={() => {
                      setOrigin(item.name);
                      setOriginSuggestions([]);
                    }}
                    className="w-full p-2 text-left hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer block"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {item.address} {item.postalCode ? `• S(${item.postalCode})` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Secondary Origin (Friend's Starting Point / Meet Halfway) */}
          {showSecondaryOrigin && (
            <div className="relative p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  Friend's Starting Point (Meet Halfway)
                </label>
                <button
                  type="button"
                  onClick={() => setShowSecondaryOrigin(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Remove friend's origin"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                id="journey-secondary-origin-input"
                type="text"
                value={secondaryOrigin}
                onChange={(e) => handleSecondaryOriginChange(e.target.value)}
                placeholder="e.g. Tampines Mall or Jurong East"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {secondarySuggestions.length > 0 && (
                <div className="absolute left-2.5 right-2.5 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/80 text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <span>Friend's OneMap Verified Places</span>
                    <span className="font-mono text-amber-600">SLA</span>
                  </div>
                  {secondarySuggestions.map((item, idx) => (
                    <button
                      key={`${item.name}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSecondaryOrigin(item.name);
                        setSecondarySuggestions([]);
                      }}
                      className="w-full p-2 text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer block"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        {item.address} {item.postalCode ? `• S(${item.postalCode})` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Via Stops (Intermediate Destinations) */}
          {viaStops.map((via, idx) => (
            <div
              key={`via-stop-${idx}`}
              className="relative p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-blue-600" />
                  Stopover #{idx + 1} (Via Stop)
                </label>
                <button
                  type="button"
                  onClick={() => removeViaStop(idx)}
                  className="p-1 rounded-md text-slate-400 hover:text-red-600 transition-colors"
                  title="Remove stop"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={via}
                onChange={(e) => handleViaChange(idx, e.target.value)}
                placeholder="e.g. Toa Payoh Hub, Bugis Junction"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {viaSuggestions[idx] && viaSuggestions[idx].length > 0 && (
                <div className="absolute left-2.5 right-2.5 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>OneMap Stopover Suggestions</span>
                    <span className="font-mono text-blue-600">SLA</span>
                  </div>
                  {viaSuggestions[idx].map((item, itemIdx) => (
                    <button
                      key={`${item.name}-${itemIdx}`}
                      type="button"
                      onClick={() => {
                        const updated = [...viaStops];
                        updated[idx] = item.name;
                        setViaStops(updated);
                        setViaSuggestions((prev) => ({ ...prev, [idx]: [] }));
                      }}
                      className="w-full p-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer block"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        {item.address} {item.postalCode ? `• S(${item.postalCode})` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Action Row: Add Via Stop & Add Friend's Starting Point Buttons */}
          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
            {viaStops.length < 2 && (
              <button
                type="button"
                onClick={addViaStop}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Add Stop / Via Destination</span>
              </button>
            )}

            {!showSecondaryOrigin && (
              <button
                type="button"
                onClick={() => setShowSecondaryOrigin(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-[11px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Add Friend's Starting Point (Meet Halfway)</span>
              </button>
            )}
          </div>

          {/* Destination */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-600" />
                Final Destination
              </label>
              {isSearchingDest && (
                <span className="text-[10px] text-red-600 dark:text-red-400 animate-pulse font-semibold">
                  Searching OneMap...
                </span>
              )}
            </div>
            <input
              id="journey-destination-input"
              type="text"
              value={destination}
              onChange={(e) => handleDestChange(e.target.value)}
              placeholder="e.g. Orchard (ION Orchard)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            {destSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>OneMap Verified Places</span>
                  <span className="font-mono text-red-600">SLA</span>
                </div>
                {destSuggestions.map((item, idx) => (
                  <button
                    key={`${item.name}-${idx}`}
                    type="button"
                    onClick={() => {
                      setDestination(item.name);
                      setDestSuggestions([]);
                    }}
                    className="w-full p-2 text-left hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer block"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {item.address} {item.postalCode ? `• S(${item.postalCode})` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desired Arrival Time */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-amber-500" />
              Desired Arrival Time
            </label>
            <input
              id="journey-arrival-time-input"
              type="text"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              placeholder="e.g. 10:30 AM"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Find Routes Button */}
          <button
            id="plan-journey-find-routes-button"
            type="submit"
            disabled={isCalculatingRoutes}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isCalculatingRoutes ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Finding Best Singapore Routes...</span>
              </>
            ) : (
              <>
                <span>Search Singapore Routes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Route Options List */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Available Route Options ({routeOptions.length})
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Choose a route to travel
          </span>
        </div>

        {routeOptions.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          const tagColors =
            opt.tagType === 'recommended'
              ? 'bg-red-600 text-white'
              : opt.tagType === 'sheltered'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-white';

          return (
            <div
              key={opt.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-red-50/50 dark:bg-red-950/30 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${tagColors}`}>
                  {opt.tag}
                </span>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {opt.durationMins} mins
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Arrives ~{opt.calculatedETA}
                  </p>
                </div>
              </div>

              {/* Rendezvous Info Banner (If Meet Halfway is active) */}
              {opt.rendezvousInfo && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 mb-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                    <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Meet Halfway Rendezvous Point: {opt.rendezvousInfo.meetingStation} ({opt.rendezvousInfo.meetingStationCode})</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    📍 <strong>Meeting Point:</strong> {opt.rendezvousInfo.meetingPlatformOrExit}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-amber-200/60">
                      <div className="font-bold text-slate-800 dark:text-slate-200">You (Primary)</div>
                      <div className="text-slate-600 dark:text-slate-400">
                        Depart: <strong>{opt.rendezvousInfo.primaryDepartureTime}</strong> ({opt.rendezvousInfo.primaryDurationToHubMins}m)
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-amber-200/60">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Friend</div>
                      <div className="text-slate-600 dark:text-slate-400">
                        Depart: <strong>{opt.rendezvousInfo.secondaryDepartureTime}</strong> ({opt.rendezvousInfo.secondaryDurationToHubMins}m)
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold pt-0.5">
                    ⏰ Rendezvous ~{opt.rendezvousInfo.rendezvousTime} • Joint ride ~{opt.rendezvousInfo.jointDurationToDestMins}m to destination
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium mb-2.5">
                {opt.summary}
              </p>

              {/* Transit legs and shelter specs */}
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <Train className="w-3.5 h-3.5 text-red-600" />
                  {opt.transfersCount === 0 ? 'Direct (0 transfers)' : `${opt.transfersCount} transfer`}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                  <Umbrella className="w-3.5 h-3.5" />
                  {opt.shelteredPercentage}% Sheltered
                </span>
                <span className="inline-flex items-center gap-1">
                  <Footprints className="w-3.5 h-3.5" />
                  Step-Free Lift Access
                </span>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleStartTravel(opt)}
                className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Select Route & Start Travel</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

