import React from 'react';
import { Volume2, ShieldCheck, BatteryCharging, Bell, Lock, ChevronRight, Mic, Sparkles, Activity, Terminal } from 'lucide-react';
import { FamiliarityLevel } from '../types';

interface SettingsScreenProps {
  familiarity: FamiliarityLevel;
  onChangeFamiliarity: (level: FamiliarityLevel) => void;
  isVoiceMuted: boolean;
  onToggleVoiceMuted: () => void;
  isPowerSaving: boolean;
  onTogglePowerSaving: () => void;
  onOpenDiagnostics?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  familiarity,
  onChangeFamiliarity,
  isVoiceMuted,
  onToggleVoiceMuted,
  isPowerSaving,
  onTogglePowerSaving,
  onOpenDiagnostics,
}) => {
  return (
    <div id="settings-screen-view" className="p-4 space-y-4 animate-in fade-in duration-200">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="text-base font-black text-slate-900 dark:text-white">
          Companion Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Personalize your Eyes Up journey preferences
        </p>
      </div>

      {/* Settings list */}
      <div className="space-y-3">
        {/* Voice Guidance */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Voice Guidance
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Spoken landmark cues & audio chimes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleVoiceMuted}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
              !isVoiceMuted ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                !isVoiceMuted ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Guidance Style Selector */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Guidance Style
              </h4>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {familiarity}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(['full', 'medium', 'light'] as FamiliarityLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onChangeFamiliarity(level)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                  familiarity === level
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Battery Conscious / Power Saver */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <BatteryCharging className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Battery-Conscious Mode
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                OLED dark pocket mode & reduced screen draw
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onTogglePowerSaving}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
              isPowerSaving ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isPowerSaving ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Notifications */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Disruption Notifications
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Alert before entering disrupted MRT segments
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        </div>

        {/* Permissions */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Microphone Permissions
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Granted for voice companion speech
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            Granted
          </span>
        </div>

        {/* Privacy & Security */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Privacy Architecture
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Zero live GPS tracking stored or shared
              </p>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </div>

        {/* Dedicated Diagnostic & Telemetry Console */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white border border-slate-700 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">
                  Live API Diagnostics & Logs
                </h4>
                <p className="text-[10px] text-slate-300">
                  Probe Gemini, OneMap SLA, & LTA connections
                </p>
              </div>
            </div>
            {onOpenDiagnostics && (
              <button
                type="button"
                onClick={onOpenDiagnostics}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                Open Console
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-300 leading-tight">
            Perform live connectivity handshakes, inspect response latencies, and check authentication token states.
          </p>
        </div>

        {/* Official Singapore Data & API Security */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                API Security & Official Singapore Feeds
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              Server-Only
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* OneMap SLA Account */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  OneMap Singapore (GovTech / SLA)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Authentication: <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">Configured in .env</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Authenticated via Email + Password grant (no API key required)
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Connected
              </span>
            </div>

            {/* Gemini Adaptive AI Companion */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  Gemini 3.8 Flash
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Adaptive voice intent & physical landmark reasoning
                </p>
                <p className="text-[10px] text-slate-400">
                  API keys secured server-side via Express proxy routes (/api/companion/chat)
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Secure
              </span>
            </div>

            {/* Zero Key Exposure Guarantee */}
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic text-center pt-1">
              ✓ All API keys & passwords are kept strictly server-side in backend environment variables and never bundled into frontend client scripts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
