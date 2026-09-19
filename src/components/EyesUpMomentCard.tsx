import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Compass,
  Award,
  ChevronRight,
  ExternalLink,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { EyesUpMoment } from '../types';
import { speechService } from '../services/speechService';

interface EyesUpMomentCardProps {
  moment: EyesUpMoment;
  onDismiss: () => void;
  onCollect: (moment: EyesUpMoment) => void;
  onOpenPassport: () => void;
  isAudioMuted?: boolean;
}

export const EyesUpMomentCard: React.FC<EyesUpMomentCardProps> = ({
  moment,
  onDismiss,
  onCollect,
  onOpenPassport,
  isAudioMuted = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasCollected, setHasCollected] = useState(false);

  const handleShowMe = () => {
    setIsExpanded(true);
    if (!hasCollected) {
      setHasCollected(true);
      onCollect(moment);
    }
  };

  const handlePlayVoiceStory = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    speechService.speak(
      moment.audioStory,
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  return (
    <div
      id="eyes-up-moment-card"
      className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 z-40 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-amber-200/90 dark:border-amber-900/70 shadow-2xl p-4 transition-all">
        {/* Amber Glow Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500" />

        {!isExpanded ? (
          /* Initial Subtle Slide-Up Prompt */
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-base shrink-0 shadow-xs">
                  {moment.stampBadge.icon}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                    <span>A little window-side discovery</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    Passing a landmark? Here's its 10-second story.
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Dismiss discovery"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium pl-10 line-clamp-1">
              Near {moment.title} • {moment.nearbyTransitCorridor}
            </p>

            {/* Prompt Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="eyes-up-moment-show-button"
                type="button"
                onClick={handleShowMe}
                className="flex-1 py-2 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Show me ✨</span>
              </button>

              <button
                id="eyes-up-moment-dismiss-button"
                type="button"
                onClick={onDismiss}
                className="py-2 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Just get me there
              </button>
            </div>
          </div>
        ) : (
          /* Expanded 10-Second Story & Stamp Collection Card */
          <div className="space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header & Stamp Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${moment.stampBadge.bgGradient} border-2 ${moment.stampBadge.borderTone} flex items-center justify-center text-xl shadow-md shrink-0`}
                >
                  {moment.stampBadge.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      {moment.category}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      10-Sec Window Story
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                    {moment.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subtitle / Corridor */}
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              📍 {moment.subtitle} ({moment.nearbyTransitCorridor})
            </p>

            {/* Bite-Sized Fact */}
            <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60">
              <p className="text-xs text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                "{moment.shortFact}"
              </p>
            </div>

            {/* Collected Stamp Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/40 dark:to-amber-950/40 border border-red-200/80 dark:border-red-900/60 text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-red-600 dark:text-red-400 animate-bounce" />
                <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                  Stamp added to <strong>My Singapore</strong> Passport!
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onOpenPassport();
                }}
                className="text-[11px] font-black text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Passport</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="eyes-up-moment-listen-button"
                type="button"
                onClick={handlePlayVoiceStory}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:opacity-90 transition-opacity"
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen with Companion</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onDismiss}
                className="py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
