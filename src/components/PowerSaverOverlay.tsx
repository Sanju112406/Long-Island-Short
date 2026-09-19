import React from 'react';
import { BatteryCharging, Mic, Volume2, ShieldAlert, SunMedium } from 'lucide-react';
import { AppLogo } from './AppLogo';

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
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono tracking-wider text-red-400 font-bold uppercase">
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

      {/* Center large high-contrast guidance text */}
      <div className="space-y-6 text-center my-auto">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
            Target Destination
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
            {nextStepTitle}
          </h2>
        </div>

        {/* Next critical landmark */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 max-w-xs mx-auto">
          <p className="text-[11px] font-mono uppercase tracking-wider text-amber-400 mb-1">
            Approaching Landmark
          </p>
          <p className="text-base font-bold text-neutral-200">
            {landmark}
          </p>
          <div className="mt-2 text-xs font-mono text-neutral-400">
            ETA: <span className="text-neutral-100 font-bold">{eta}</span>
          </div>
        </div>

        {/* Single giant Tap-to-Ask button */}
        <button
          id="power-saver-mic-button"
          type="button"
          onClick={onTapVoice}
          aria-label="Tap to speak to Eyes Up"
          className={`w-36 h-36 mx-auto rounded-full border-2 flex flex-col items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
            isListening
              ? 'bg-rose-700 border-rose-400 text-white animate-pulse scale-105'
              : isSpeaking
              ? 'bg-amber-600 border-amber-300 text-white'
              : 'bg-neutral-900 border-neutral-700 text-red-400 hover:border-red-500'
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

        <p className="text-xs text-neutral-500 max-w-xs leading-relaxed mx-auto">
          Screen dimmed for OLED efficiency. Put phone in pocket — Eyes Up will speak when milestones approach.
        </p>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-900 pt-3 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
        <span className="flex items-center gap-1.5">
          <AppLogo size={16} />
          Eyes on Surroundings
        </span>
        <span>Audio Guidance Ready</span>
      </div>
    </div>
  );
};
