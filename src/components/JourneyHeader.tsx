import React from 'react';
import { Eye, BatteryCharging, Battery, Volume2, VolumeX, Share2, Compass, MapPin, Activity } from 'lucide-react';
import { FamiliarityLevel } from '../types';

interface JourneyHeaderProps {
  appName: string;
  familiarity: FamiliarityLevel;
  isPowerSaving: boolean;
  onTogglePowerSave: () => void;
  isAudioMuted: boolean;
  onToggleAudioMute: () => void;
  onOpenShareModal: () => void;
  onOpenPlanModal: () => void;
  onOpenDiagnostics?: () => void;
  origin: string;
  destination: string;
  persona?: 'rachel' | 'arjun' | 'lim' | 'default';
  onSelectPersona?: (persona: 'rachel' | 'arjun' | 'lim' | 'default') => void;
}

export const JourneyHeader: React.FC<JourneyHeaderProps> = ({
  appName,
  familiarity,
  isPowerSaving,
  onTogglePowerSave,
  isAudioMuted,
  onToggleAudioMute,
  onOpenShareModal,
  onOpenPlanModal,
  onOpenDiagnostics,
  origin,
  destination,
  persona = 'default',
  onSelectPersona,
}) => {
  return (
    <header
      id="eyes-up-main-header"
      className={`sticky top-0 z-20 backdrop-blur-md border-b transition-colors px-4 py-3 ${
        isPowerSaving
          ? 'bg-black/90 border-neutral-800 text-white'
          : 'bg-white/85 dark:bg-slate-900/85 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand & Route Title */}
        <div className="flex items-center gap-2.5">
          <button
            id="brand-header-button"
            type="button"
            onClick={onOpenPlanModal}
            className="flex items-center gap-2 text-left cursor-pointer group"
            title="Click to plan or switch journey"
          >
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight leading-none text-slate-900 dark:text-white">
                  {appName}
                </h1>
                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-full uppercase">
                  SG
                </span>
                {persona !== 'default' && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${
                      persona === 'rachel'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : persona === 'arjun'
                        ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {persona === 'lim' ? 'Mdm Lim' : persona}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate max-w-[140px] mt-0.5">
                {destination}
              </p>
            </div>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Diagnostic Console Button */}
          {onOpenDiagnostics && (
            <button
              id="header-diagnostics-button"
              type="button"
              onClick={onOpenDiagnostics}
              aria-label="Open Diagnostics & API Health"
              title="API Health & Diagnostics"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}

          {/* Share ETA Button */}
          <button
            id="header-share-eta-button"
            type="button"
            onClick={onOpenShareModal}
            aria-label="Share ETA with contact"
            title="Share ETA"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Voice Mute / Unmute Toggle */}
          <button
            id="header-audio-mute-toggle"
            type="button"
            onClick={onToggleAudioMute}
            aria-label={isAudioMuted ? 'Unmute voice companion' : 'Mute voice companion'}
            title={isAudioMuted ? 'Audio muted (tap to speak)' : 'Voice audio active'}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isAudioMuted
                ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Power Optimization Toggle */}
          <button
            id="header-power-saver-toggle"
            type="button"
            onClick={onTogglePowerSave}
            aria-label="Toggle Power Optimization Mode"
            title={isPowerSaving ? 'Power Saver On (tap to exit)' : 'Switch to Power Saver'}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isPowerSaving
                ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isPowerSaving ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="text-[11px] font-bold">
              {isPowerSaving ? 'OLED Save' : 'Power'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
