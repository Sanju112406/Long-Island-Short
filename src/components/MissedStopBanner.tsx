import React from 'react';
import { Route, Clock, Volume2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { MissedStopState } from '../types';

interface MissedStopBannerProps {
  missedState: MissedStopState;
  onSpeakExplanation: () => void;
  onResetRoute?: () => void;
  isSpeaking?: boolean;
}

export const MissedStopBanner: React.FC<MissedStopBannerProps> = ({
  missedState,
  onSpeakExplanation,
  onResetRoute,
  isSpeaking = false,
}) => {
  if (!missedState.isMissed) return null;

  return (
    <div
      id="missed-stop-recovery-banner"
      className="p-4 rounded-3xl bg-indigo-500/10 border-2 border-indigo-500/40 dark:bg-indigo-950/40 dark:border-indigo-500/50 shadow-md my-3 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Automatic Rerouting
              </span>
              <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 px-1.5 py-0.5 rounded font-bold">
                1 Stop Past
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Missed Stop Detected — Route Auto-Adjusted
            </h4>
          </div>
        </div>

        <button
          id="missed-stop-speak-button"
          type="button"
          onClick={onSpeakExplanation}
          aria-label="Listen to Eyes Up recovery guidance"
          className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
            isSpeaking
              ? 'bg-indigo-600 text-white animate-pulse'
              : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 shadow-xs'
          }`}
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Spoken Companion Quote Box */}
      <div className="mt-3 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-900/50">
        <div className="flex items-start gap-2">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">Eyes Up:</span>
          <p className="text-xs text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
            “{missedState.aiExplanation}”
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t border-indigo-100 dark:border-indigo-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Original ETA: {missedState.originalETA}</span>
            <span>→</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-300">New ETA: {missedState.newETA}</span>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active on Bus {missedState.recoveryBus}
          </span>
        </div>
      </div>

      {onResetRoute && (
        <div className="mt-2.5 flex justify-end">
          <button
            id="reset-missed-route-button"
            type="button"
            onClick={onResetRoute}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo to Original Route</span>
          </button>
        </div>
      )}
    </div>
  );
};
