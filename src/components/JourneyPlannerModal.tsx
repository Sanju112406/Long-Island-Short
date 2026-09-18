import React, { useState } from 'react';
import { Journey } from '../types';
import { PRESET_JOURNEYS } from '../data/singaporeRoutes';
import { MapPin, Navigation, Clock, Sparkles, X, ArrowRight, Check } from 'lucide-react';

interface JourneyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJourney: (journey: Journey) => void;
  activeJourneyId: string;
}

export const JourneyPlannerModal: React.FC<JourneyPlannerModalProps> = ({
  isOpen,
  onClose,
  onSelectJourney,
  activeJourneyId,
}) => {
  const [origin, setOrigin] = useState('Toa Payoh Central (Blk 177)');
  const [destination, setDestination] = useState('Bugis Junction / National Library');
  const [desiredTime, setDesiredTime] = useState('6:30 PM');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    // Build custom journey based on first preset template
    const base = PRESET_JOURNEYS[0];
    const customJourney: Journey = {
      ...base,
      id: `custom-${Date.now()}`,
      title: `${origin} to ${destination}`,
      origin,
      destination,
      desiredArrivalTime: desiredTime || '6:30 PM',
      calculatedETA: '6:12 PM',
      travelHistoryCount: 0,
    };
    onSelectJourney(customJourney);
    onClose();
  };

  return (
    <div
      id="journey-planner-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="journey-planner-modal-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Plan a Singapore Journey
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                AI eyes-up companion routing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Custom Route Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Origin
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Toa Payoh Central, Serangoon NEX..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Destination
              </label>
              <div className="relative">
                <Navigation className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Bugis Junction, Orchard ION, Raffles Place..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Desired Arrival Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={desiredTime}
                  onChange={(e) => setDesiredTime(e.target.value)}
                  placeholder="e.g. 6:30 PM, 8:45 AM..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              id="generate-journey-submit-button"
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Eyes-Up Companion Route</span>
            </button>
          </form>

          {/* Quick Singapore Commuter Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Explore Curated Singapore Routes
              </span>
            </div>

            <div className="space-y-2">
              {PRESET_JOURNEYS.map((pj) => {
                const isSelected = activeJourneyId === pj.id;
                return (
                  <button
                    key={pj.id}
                    type="button"
                    onClick={() => {
                      onSelectJourney(pj);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold truncate text-slate-900 dark:text-white">
                          {pj.title}
                        </h4>
                        {isSelected && (
                          <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                        {pj.totalDurationMins} mins • Target arrival {pj.desiredArrivalTime}
                      </p>
                    </div>

                    <div className="shrink-0 p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-500">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
