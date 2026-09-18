import React from 'react';
import { AlertTriangle, Clock, ArrowRight, Check, X, Volume2 } from 'lucide-react';
import { DisruptionAlert } from '../types';

interface DisruptionBannerProps {
  disruption: DisruptionAlert;
  onAcceptAlternative: () => void;
  onDeclineAlternative: () => void;
  onSpeakExplanation: () => void;
  isSpeaking?: boolean;
}

export const DisruptionBanner: React.FC<DisruptionBannerProps> = ({
  disruption,
  onAcceptAlternative,
  onDeclineAlternative,
  onSpeakExplanation,
  isSpeaking = false,
}) => {
  if (!disruption.active) return null;

  return (
    <div
      id="transport-disruption-card"
      className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 dark:bg-amber-950/40 dark:border-amber-500/50 shadow-md my-3 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Transport Alert
              </span>
              <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-bold">
                {disruption.affectedLine}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {disruption.title}
            </h4>
          </div>
        </div>

        {/* Speak companion warning */}
        <button
          id="disruption-speak-button"
          type="button"
          onClick={onSpeakExplanation}
          aria-label="Listen to Eyes Up disruption advice"
          className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
            isSpeaking
              ? 'bg-amber-600 text-white animate-pulse'
              : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 shadow-xs'
          }`}
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
        {disruption.description}
      </p>

      {/* ETA Comparison Card */}
      <div className="mt-3 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Current Route</p>
          <p className="text-xs font-bold text-red-600 dark:text-red-400 line-through">
            ETA {disruption.currentRouteETA}
          </p>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-400" />

        <div className="text-right">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
            Recommended Bypass ({disruption.alternativeLine})
          </p>
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
            ETA {disruption.alternativeRouteETA}
          </p>
        </div>
      </div>

      {/* Companion quote */}
      <div className="mt-2.5 text-[11px] italic text-slate-600 dark:text-slate-300 flex items-start gap-1">
        <span className="font-semibold text-amber-600 dark:text-amber-400 not-italic shrink-0">Eyes Up:</span>
        <span>
          “There’s a disruption ahead. Your current route would arrive at {disruption.currentRouteETA}. I found another route that arrives at {disruption.alternativeRouteETA}. Would you like to switch?”
        </span>
      </div>

      {/* Accept / Decline actions */}
      <div className="mt-3.5 flex items-center gap-2">
        <button
          id="accept-disruption-bypass-button"
          type="button"
          onClick={onAcceptAlternative}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Switch Route (Save 18 mins)</span>
        </button>
        <button
          id="decline-disruption-bypass-button"
          type="button"
          onClick={onDeclineAlternative}
          className="py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Keep Current</span>
        </button>
      </div>
    </div>
  );
};
