import React from 'react';
import { BatteryCharging, Battery, Volume2, VolumeX, Share2, Compass, MapPin, Activity, Clock } from 'lucide-react';
import { FamiliarityLevel } from '../types';
import { useLiveClock } from '../utils/timeUtils';
import { AppLogo } from './AppLogo';

interface JourneyHeaderProps {
  appName: string;
  familiarity: FamiliarityLevel;
  isPowerSaving: boolean;
  onTogglePowerSave: () => void;
  isAudioMuted: boolean;
  onToggleAudioMute: () => void;
  onOpenShareModal: () => void;
  onOpenPlanModal: () => void;
  onOpenPassport?: () => void;
  passportStampCount?: number;
  onOpenDiagnostics?: () => void;
  origin: string;
  destination: string;
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
  onOpenPassport,
  passportStampCount = 0,
  onOpenDiagnostics,
  origin,
  destination,
}) => {
  const { timeString } = useLiveClock(1000);

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
            <div className="group-hover:scale-105 transition-transform">
              <AppLogo size={32} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight leading-none text-slate-900 dark:text-white">
                  {appName}
                </h1>
                <span className="text-[9px] bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 font-bold px-1.5 py-0.5 rounded-full uppercase">
                  SG
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate max-w-[140px] mt-0.5">
                {destination}
              </p>
            </div>
          </button>
        </div>

        {/* Action Controls & Live Clock */}
        <div className="flex items-center gap-1.5">
          {/* Live Clock Badge */}
          <div
            id="header-live-clock-badge"
            className={`hidden xs:flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-mono font-bold border transition-colors ${
              isPowerSaving
                ? 'bg-neutral-900 border-neutral-800 text-red-400'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
            title="Live Time"
          >
            <Clock className="w-3 h-3 text-red-500 animate-pulse shrink-0" />
            <span>{timeString}</span>
          </div>

          {/* My Singapore Passport Button */}
          {onOpenPassport && (
            <button
              id="header-passport-button"
              type="button"
              onClick={onOpenPassport}
              aria-label="Open My Singapore Passport"
              title="My Singapore Passport"
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
            >
              <span className="text-base">📕</span>
              {passportStampCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {passportStampCount}
                </span>
              )}
            </button>
          )}

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
              <Activity className="w-4 h-4 text-red-600 dark:text-red-400" />
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
                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60'
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
                ? 'bg-neutral-800 text-red-400 border border-neutral-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isPowerSaving ? (
              <BatteryCharging className="w-3.5 h-3.5 text-red-400" />
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
