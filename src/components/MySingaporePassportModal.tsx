import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Award,
  Sparkles,
  MapPin,
  Volume2,
  VolumeX,
  CheckCircle2,
  Lock,
  Share2,
} from 'lucide-react';
import { CollectedStamp, DiscoveryCategory, EyesUpMoment } from '../types';
import { CURATED_EYES_UP_MOMENTS } from '../data/eyesUpMoments';
import { speechService } from '../services/speechService';

interface MySingaporePassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectedStamps: CollectedStamp[];
}

export const MySingaporePassportModal: React.FC<MySingaporePassportModalProps> = ({
  isOpen,
  onClose,
  collectedStamps,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMoment, setSelectedMoment] = useState<EyesUpMoment | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const totalMoments = CURATED_EYES_UP_MOMENTS.length;
  const collectedCount = collectedStamps.length;
  const progressPercent = Math.min(100, Math.round((collectedCount / totalMoments) * 100));

  // Determine Explorer Rank
  const getExplorerRank = (count: number) => {
    if (count >= 9) return { title: 'Lion City Master Voyager', tier: 'Master Explorer' };
    if (count >= 6) return { title: 'Transit Heritage Insider', tier: 'Advanced Explorer' };
    if (count >= 3) return { title: 'Window-Side Explorer', tier: 'Intermediate' };
    if (count >= 1) return { title: 'Curious Commuter', tier: 'Novice' };
    return { title: 'Eyes-Up Initiate', tier: 'Starter' };
  };

  const rank = getExplorerRank(collectedCount);

  const categories = ['All', 'Heritage', 'Architecture', 'Art', 'Nature', 'Neighbourhood'];

  const filteredMoments = CURATED_EYES_UP_MOMENTS.filter((m) => {
    if (selectedCategory === 'All') return true;
    return m.category === selectedCategory;
  });

  const handlePlayStory = (storyText: string) => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    speechService.speak(
      storyText,
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  return (
    <div
      id="my-singapore-passport-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Passport Header Banner */}
        <div className="p-4 bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-xl shadow-inner">
                📕
              </div>
              <div>
                <div className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-red-200">
                  <span>Transit Commuter Edition</span>
                </div>
                <h2 className="text-base font-black tracking-tight leading-tight">
                  My Singapore Passport
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                speechService.stop();
                onClose();
              }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Explorer Stats Card */}
          <div className="mt-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-red-100 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                Rank: <strong>{rank.title}</strong>
              </span>
              <span className="font-black text-amber-300">
                {collectedCount} / {totalMoments} Collected
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stamps Grid View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {filteredMoments.map((moment) => {
              const unlocked = collectedStamps.find((s) => s.momentId === moment.id);

              return (
                <div
                  key={moment.id}
                  onClick={() => setSelectedMoment(moment)}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                    unlocked
                      ? 'bg-gradient-to-br from-white to-red-50/40 dark:from-slate-900 dark:to-red-950/20 border-red-300 dark:border-red-900 shadow-xs hover:scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-65 hover:opacity-85'
                  }`}
                >
                  {/* Stamp Seal Badge */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm border ${
                        unlocked
                          ? `bg-gradient-to-br ${moment.stampBadge.bgGradient} ${moment.stampBadge.borderTone}`
                          : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 grayscale'
                      }`}
                    >
                      {unlocked ? moment.stampBadge.icon : '🔒'}
                    </div>

                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                        unlocked
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {moment.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                      {moment.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {unlocked ? unlocked.unlockedAt : `Clue: ${moment.nearbyTransitCorridor}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail View for Selected Stamp */}
          {selectedMoment && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/80 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedMoment.stampBadge.icon}</span>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      {selectedMoment.title}
                    </h3>
                    <p className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold">
                      {selectedMoment.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMoment(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                "{selectedMoment.shortFact}"
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handlePlayStory(selectedMoment.audioStory)}
                  className="py-1.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen to Story</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Stamps unlock automatically during journeys</span>
          <button
            type="button"
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer transition-colors"
          >
            Close Passport
          </button>
        </div>
      </div>
    </div>
  );
};
