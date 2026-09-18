import React, { useState, useEffect } from 'react';
import { Compass, MapPin, Clock, ArrowRight, CloudRain, Sun, ShieldAlert, Sparkles, User } from 'lucide-react';
import { SINGAPORE_ROUTES, SingaporeRoute } from '../data/singaporeRoutes';

interface HomeJourneyPlannerViewProps {
  onStartJourney: (routeId: string, origin: string, destination: string, arrivalTime: string) => void;
  currentRouteId: string;
}

interface OneMapSearchResult {
  name: string;
  address: string;
  postalCode: string;
}

// Convert between the app's "9:30 AM" display format (used everywhere downstream)
// and the native <input type="time"> 24-hour "HH:MM" format.
function amPmTo24h(timeStr: string): string {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '09:30';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

function to12hAmPm(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${mStr} ${period}`;
}

// Default to 45 minutes from the actual current time, not a fixed clock-independent
// string — so the pre-filled suggestion is always relevant to when you're planning.
function getLiveDefaultArrivalTime(): string {
  const target = new Date(Date.now() + 45 * 60000);
  return target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export const HomeJourneyPlannerView: React.FC<HomeJourneyPlannerViewProps> = ({
  onStartJourney,
  currentRouteId,
}) => {
  const [origin, setOrigin] = useState('NUS (University Town)');
  const [destination, setDestination] = useState('Orchard (ION Orchard)');
  const [arrivalTime, setArrivalTime] = useState(getLiveDefaultArrivalTime);
  // Empty by default: only an explicit Persona Scenario click below sets this to a
  // known preset id. Any other plan (default text, typed search, OneMap suggestion)
  // must be routed dynamically rather than served from fixed local data.
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('');
  const [originSuggestions, setOriginSuggestions] = useState<OneMapSearchResult[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<OneMapSearchResult[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [weather, setWeather] = useState<{
    area: string;
    forecast: string;
    isRaining: boolean;
    advice: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/weather/nowcast?area=Central')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setWeather(data);
      })
      .catch((err) => console.warn('Weather fetch error:', err));
  }, []);

  // OneMap search query for origin
  const handleOriginChange = (val: string) => {
    setOrigin(val);
    setSelectedRouteKey('');
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
    setSelectedRouteKey('');
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

  const handleSelectPreset = (key: string) => {
    setSelectedRouteKey(key);
    if (key === 'rachel-tampines-raffles' || key === 'tampines-raffles') {
      setOrigin('Tampines Central (Our Tampines Hub)');
      setDestination('Raffles Place (Republic Plaza)');
      setArrivalTime('8:45 AM');
    } else if (key === 'arjun-punggol-onenorth' || key === 'nus-orchard') {
      setOrigin('Punggol Drive (Oasis Terraces)');
      setDestination('one-north (Fusionopolis)');
      setArrivalTime('9:45 AM');
    } else if (key === 'lim-bedok-sgh' || key === 'bedok-sgh') {
      setOrigin('Bedok Central (Blk 214)');
      setDestination('Singapore General Hospital (SGH)');
      setArrivalTime('10:30 AM');
    } else if (key === 'toapayoh-bugis') {
      setOrigin('Toa Payoh Central (Blk 177)');
      setDestination('Bugis Junction');
      setArrivalTime('6:30 PM');
    }
  };

  const handlePlan = (e: React.FormEvent) => {
    e.preventDefault();
    onStartJourney(selectedRouteKey, origin, destination, arrivalTime);
  };

  return (
    <div id="home-journey-planner-view" className="p-4 space-y-5 animate-in fade-in duration-200">
      {/* Weather Header Badge (data.gov.sg real-time) */}
      {weather && (
        <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {weather.isRaining ? (
              <CloudRain className="w-4 h-4 text-sky-600 animate-pulse" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                Singapore Nowcast: {weather.forecast}
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                {weather.advice}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full shrink-0">
            data.gov.sg
          </span>
        </div>
      )}

      {/* Hero Headline matching architecture diagram Screen 1 */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
          <Sparkles className="w-3 h-3" />
          <span>Eyes-Up Commuter Companion</span>
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Where are you heading today?
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Put your phone away. Travel with eyes up and landmark voice cues.
        </p>
      </div>

      {/* Journey Form */}
      <form onSubmit={handlePlan} className="space-y-3.5">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          {/* Origin */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                Origin
              </label>
              {isSearchingOrigin && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 animate-pulse font-semibold">
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
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            {originSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>OneMap Verified Places</span>
                  <span className="font-mono text-emerald-600">SLA</span>
                </div>
                {originSuggestions.map((item, idx) => (
                  <button
                    key={`${item.name}-${idx}`}
                    type="button"
                    onClick={() => {
                      setOrigin(item.name);
                      setSelectedRouteKey('');
                      setOriginSuggestions([]);
                    }}
                    className="w-full p-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer block"
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

          {/* Destination */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                Destination
              </label>
              {isSearchingDest && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 animate-pulse font-semibold">
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
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            {destSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>OneMap Verified Places</span>
                  <span className="font-mono text-emerald-600">SLA</span>
                </div>
                {destSuggestions.map((item, idx) => (
                  <button
                    key={`${item.name}-${idx}`}
                    type="button"
                    onClick={() => {
                      setDestination(item.name);
                      setSelectedRouteKey('');
                      setDestSuggestions([]);
                    }}
                    className="w-full p-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer block"
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
              type="time"
              value={amPmTo24h(arrivalTime)}
              onChange={(e) => e.target.value && setArrivalTime(to12hAmPm(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Persona Commuter Shortcuts */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Commuter Persona Scenarios (PS2):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPreset('rachel-tampines-raffles')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedRouteKey === 'rachel-tampines-raffles'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold">Rachel</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 block">Tampines → Raffles</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Fixed schedule (EWL)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('arjun-punggol-onenorth')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedRouteKey === 'arjun-punggol-onenorth'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span className="text-xs font-bold">Arjun</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 block">Punggol → one-north</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Multi-modal (Cycle+MRT)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('lim-bedok-sgh')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedRouteKey === 'lim-bedok-sgh'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-bold">Mdm Lim</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 block">Bedok → SGH</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Accessibility (Lifts only)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('toapayoh-bugis')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedRouteKey === 'toapayoh-bugis'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-xs font-bold">Disruption Demo</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 block">Toa Payoh → Bugis</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Auto-recovery & Bypasses
              </span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="plan-journey-submit-button"
          type="submit"
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Plan Journey</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
