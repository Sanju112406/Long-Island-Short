import React from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface AccessibleSideTriggerProps {
  onTap: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  isPowerSaving?: boolean;
}

export const AccessibleSideTrigger: React.FC<AccessibleSideTriggerProps> = ({
  onTap,
  isListening,
  isSpeaking,
  isPowerSaving = false,
}) => {
  return (
    <div
      id="eyes-up-side-control-dock"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center select-none"
    >
      <button
        id="accessible-side-squeeze-button"
        type="button"
        onClick={onTap}
        aria-label="Convenient side control to ask Eyes Up companion"
        title="Side Thumb Control: Tap to talk to Eyes Up"
        className={`group pl-3 pr-2 py-4 rounded-l-2xl flex flex-col items-center gap-1 shadow-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
          isPowerSaving
            ? 'bg-neutral-900 border-l border-y border-neutral-700 text-emerald-400'
            : isListening
            ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
            : isSpeaking
            ? 'bg-amber-500 text-white shadow-amber-500/40'
            : 'bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-700 shadow-slate-900/30'
        }`}
      >
        {isListening ? (
          <Mic className="w-5 h-5 text-white animate-bounce" />
        ) : isSpeaking ? (
          <Volume2 className="w-5 h-5 text-white animate-pulse" />
        ) : (
          <Mic className="w-5 h-5 text-emerald-300 dark:text-white group-hover:scale-110 transition-transform" />
        )}

        <span className="[writing-mode:vertical-rl] text-[9px] font-extrabold uppercase tracking-widest text-slate-300 dark:text-emerald-100 mt-1">
          {isListening ? 'LISTENING' : 'SIDE ASK'}
        </span>
      </button>
    </div>
  );
};
