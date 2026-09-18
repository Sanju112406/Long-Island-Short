import React from 'react';
import { BatteryCharging, Mic, Volume2, ShieldAlert, SunMedium, Eye } from 'lucide-react';

interface PowerSaverOverlayProps {
  isPowerSaving: boolean;
  onTogglePowerSave: () => void;
  nextStepTitle: string;
  landmark: string;
  eta: string;
  onTapVoice: () => void;
  isListening: boolean;
  isSpeaking: boolean;
}

export const PowerSaverOverlay: React.FC<PowerSaverOverlayProps> = ({
  isPowerSaving,
  onTogglePowerSave,
  nextStepTitle,
  landmark,
  eta,
  onTapVoice,
  isListening,
  isSpeaking,
}) => {
  if (!isPowerSaving) return null;

  return (
    <div
      id="power-saving-pocket-mode"
      className="absolute inset-0 z-40 bg-black text-white flex flex-col justify-between p-6 select-none animate-in fade-in duration-300"
    >
      {/* Top minimal status */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono tracking-wider text-emerald-400 font-bold uppercase">
            Eyes-Up OLED Pocket Mode
          </span>
        </div>

        <button
          id="exit-power-save-button"
          type="button"
          onClick={onTogglePowerSave}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-950 cursor-pointer"
        >
          <SunMedium className="w-3.5 h-3.5" />
          <span>Exit Power Mode</span>
        </button>
      </div>

      {/* Main pocket-mode center area: Minimal high-contrast guidance & giant voice trigger */}
      <div className="my-auto flex flex-col items-center text-center space-y-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Next Action</p>
          <h2 className="text-2xl font-bold tracking-tight text-white max-w-xs">
            {nextStepTitle}
          </h2>
          <p className="text-sm text-amber-400 font-mono mt-1">
            📍 {landmark}
          </p>
        </div>

        {/* ETA badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-sm font-mono text-emerald-400">
          <span>ETA {eta}</span>
          <span>•</span>
          <span>Battery Saver Active</span>
        </div>

        {/* Giant full-screen accessible thumb trigger */}
        <button
          id="pocket-mode-voice-trigger"
          type="button"
          onClick={onTapVoice}
          className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 transition-transform active:scale-95 cursor-pointer shadow-2xl ${
            isListening
              ? 'bg-emerald-600 border-emerald-300 text-white animate-pulse'
              : isSpeaking
              ? 'bg-amber-600 border-amber-300 text-white'
              : 'bg-neutral-900 border-neutral-700 text-emerald-400 hover:border-emerald-500'
          }`}
        >
          {isListening ? (
            <span className="text-sm font-bold uppercase tracking-wider">Listening...</span>
          ) : isSpeaking ? (
            <Volume2 className="w-10 h-10" />
          ) : (
            <>
              <Mic className="w-10 h-10 mb-1" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Tap to Ask</span>
            </>
          )}
        </button>

        <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
          Screen dimmed for OLED efficiency. Put phone in pocket — Eyes Up will speak when milestones approach.
        </p>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-900 pt-3 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-neutral-400" />
          Eyes on Surroundings
        </span>
        <span>Audio Guidance Ready</span>
      </div>
    </div>
  );
};
