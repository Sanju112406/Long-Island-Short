import React from 'react';
import { CheckCircle2, Clock, MapPin, Sparkles, RotateCcw } from 'lucide-react';

interface ArrivalScreenProps {
  destination: string;
  durationMins: number;
  onDone: () => void;
  onPlanNew: () => void;
}

export const ArrivalScreen: React.FC<ArrivalScreenProps> = ({
  destination,
  durationMins,
  onDone,
  onPlanNew,
}) => {
  return (
    <div
      id="arrival-screen-view"
      className="p-6 flex flex-col items-center justify-center text-center space-y-6 my-auto animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-xl animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Arrival Milestone
        </span>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          You're here ✓
        </h2>
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
          {destination}
        </p>
      </div>

      {/* Stats Callout */}
      <div className="w-full max-w-xs p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-around text-center">
        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
            Journey Duration
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1 mt-0.5">
            <Clock className="w-4 h-4 text-emerald-500" />
            {durationMins} min
          </span>
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
            Guidance Used
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
            <Sparkles className="w-4 h-4" />
            Eyes Up
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
        Great commute! Your contact's shared pass has automatically transitioned to "Arrived safely".
      </p>

      <div className="w-full max-w-xs space-y-2 pt-2">
        <button
          id="arrival-done-button"
          type="button"
          onClick={onDone}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
        >
          Done
        </button>

        <button
          id="plan-new-journey-button"
          type="button"
          onClick={onPlanNew}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Plan Another Journey</span>
        </button>
      </div>
    </div>
  );
};
