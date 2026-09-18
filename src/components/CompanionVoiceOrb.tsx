import React from 'react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

interface CompanionVoiceOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  onToggleListen: () => void;
  onOpenVoiceDrawer: () => void;
  activeStatusText?: string;
  isPowerSaving?: boolean;
}

export const CompanionVoiceOrb: React.FC<CompanionVoiceOrbProps> = ({
  isListening,
  isSpeaking,
  isThinking,
  onToggleListen,
  onOpenVoiceDrawer,
  activeStatusText,
  isPowerSaving = false,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center my-3" id="companion-voice-orb-container">
      {/* Visual pulse glow rings */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <>
            <div className="absolute w-28 h-28 rounded-full bg-emerald-500/20 animate-ping duration-1000 pointer-events-none" />
            <div className="absolute w-24 h-24 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />
          </>
        )}

        {isSpeaking && (
          <>
            <div className="absolute w-28 h-28 rounded-full bg-amber-500/20 animate-pulse duration-700 pointer-events-none" />
            <div className="absolute w-24 h-24 rounded-full bg-amber-500/30 animate-ping duration-1000 pointer-events-none" />
          </>
        )}

        {isThinking && (
          <div className="absolute w-24 h-24 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin pointer-events-none" />
        )}

        {/* Central interactive Orb button */}
        <button
          id="companion-main-mic-button"
          onClick={onToggleListen}
          type="button"
          aria-label="Speak to Eyes Up AI Companion"
          className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
            isPowerSaving
              ? isListening
                ? 'bg-emerald-600 text-black border-2 border-emerald-300'
                : 'bg-neutral-900 text-emerald-400 border border-neutral-700'
              : isListening
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white scale-105 shadow-emerald-500/30'
              : isSpeaking
              ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/30'
              : isThinking
              ? 'bg-slate-700 text-teal-300'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20 active:scale-95'
          }`}
        >
          {isListening ? (
            <div className="flex items-center gap-0.5 h-6">
              <span className="w-1 bg-white rounded-full animate-wave-bar-1" />
              <span className="w-1 bg-white rounded-full animate-wave-bar-2" />
              <span className="w-1 bg-white rounded-full animate-wave-bar-3" />
              <span className="w-1 bg-white rounded-full animate-wave-bar-4" />
            </div>
          ) : isSpeaking ? (
            <div className="flex flex-col items-center">
              <Volume2 className="w-7 h-7 animate-bounce" />
            </div>
          ) : isThinking ? (
            <Sparkles className="w-7 h-7 animate-spin" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Mic className="w-7 h-7 text-emerald-400" />
            </div>
          )}
        </button>
      </div>

      {/* Companion Status Subtext */}
      <div className="mt-2.5 flex flex-col items-center text-center px-4" id="companion-status-caption">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
          {isListening
            ? 'Listening to you...'
            : isSpeaking
            ? 'Speaking guidance...'
            : isThinking
            ? 'Analyzing surroundings...'
            : 'Tap mic or side button to ask'}
        </p>
        <p className="text-xs text-slate-400 dark:text-neutral-400 max-w-xs truncate mt-0.5">
          {activeStatusText || '“Am I going the right way?” • “Do I turn here?”'}
        </p>
      </div>
    </div>
  );
};
