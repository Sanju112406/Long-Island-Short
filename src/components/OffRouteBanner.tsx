import React from 'react';
import { Compass, Volume2, RotateCcw, CheckCircle2 } from 'lucide-react';

interface OffRouteBannerProps {
  isActive: boolean;
  destination: string;
  onSpeakExplanation: () => void;
  onResetRoute?: () => void;
  isSpeaking?: boolean;
}

export const OffRouteBanner: React.FC<OffRouteBannerProps> = ({
  isActive,
  destination,
  onSpeakExplanation,
  onResetRoute,
  isSpeaking = false,
}) => {
  if (!isActive) return null;

  return (
    <div
      id="off-route-recovery-banner"
      className="p-4 rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 dark:bg-rose-950/40 dark:border-rose-500/50 shadow-md my-3 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
            <Compass className="w-5 h-5 animate-spin duration-1000" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Off-Route Recovery
              </span>
              <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 px-1.5 py-0.5 rounded font-bold">
                Auto-Rerouted
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Alternative Path Detected — Recalculated
            </h4>
          </div>
        </div>

        <button
          id="off-route-speak-button"
          type="button"
          onClick={onSpeakExplanation}
          aria-label="Listen to Eyes Up off-route recovery guidance"
          className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
            isSpeaking
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 shadow-xs'
          }`}
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Spoken Companion Quote Box */}
      <div className="mt-3 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-rose-200 dark:border-rose-900/50">
        <div className="flex items-start gap-2">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">Eyes Up:</span>
          <p className="text-xs text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
            “I noticed you turned onto an alternative route. Don't worry at all—I've recalculated your quickest connection to {destination} with tangible landmark cues.”
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t border-rose-100 dark:border-rose-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Landmark guidance updated</span>
          </div>

          {onResetRoute && (
            <button
              type="button"
              onClick={onResetRoute}
              className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore original</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
