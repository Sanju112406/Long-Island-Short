import React, { useState } from 'react';
import { Share2, Clock, CheckCircle2, ShieldCheck, Copy, Check, ExternalLink, Smartphone, ArrowRight, UserCheck } from 'lucide-react';
import { SharedETAState } from '../types';

interface ETAShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedState: SharedETAState;
  onUpdateRecipientName: (name: string) => void;
}

export const ETAShareModal: React.FC<ETAShareModalProps> = ({
  isOpen,
  onClose,
  sharedState,
  onUpdateRecipientName,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'share' | 'recipient-preview'>('recipient-preview');

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const link = `${window.location.origin}/share/${sharedState.shareId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const recipientPresets = ['Mum', 'Nishikaa', 'Ryan'];

  return (
    <div
      id="eta-share-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="eta-share-modal-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Eyes Up • ETA Sharing
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Privacy-first arrival reassurance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle: Share Settings vs Live Recipient View */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode('recipient-preview')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'recipient-preview'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Recipient's Live View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('share')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'share'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Controls</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {viewMode === 'share' ? (
            <>
              {/* Privacy Guarantee Note */}
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 dark:text-emerald-200">
                  <p className="font-bold">Zero Live GPS Tracking</p>
                  <p className="mt-0.5 text-emerald-700/80 dark:text-emerald-300/80 leading-relaxed">
                    Your contact only sees ETA and transit percentage. They never see your raw map coordinates or exact pinpoint location.
                  </p>
                </div>
              </div>

              {/* Shareable Link Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Private Transit Pass Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/share/${sharedState.shareId || 'singapore-ride'}`}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Pass Link'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Live Simulated Recipient Phone View */
            <div className="flex flex-col items-center">
              <div className="w-full max-w-sm rounded-3xl border-4 border-slate-800 dark:border-slate-700 bg-slate-950 p-4 text-white shadow-xl">
                {/* Phone Notch/Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Eyes Up Live Pass
                  </span>
                  <span>Auto-syncing 🟢</span>
                </div>

                <div className="text-center py-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Traveling to
                  </p>
                  <h4 className="text-base font-bold text-white truncate">
                    {sharedState.destination}
                  </h4>
                </div>

                {/* Big ETA Callout */}
                <div className="my-3 p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 text-center">
                  <span className="text-xs font-semibold text-emerald-400">
                    Expected Arrival Time
                  </span>
                  <div className="text-3xl font-black text-white mt-1">
                    {sharedState.currentETA}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{sharedState.statusText}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Journey Progress</span>
                    <span className="text-emerald-400 font-bold">{sharedState.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${sharedState.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Status Badge */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-300 flex items-center gap-1">
                    {sharedState.isArrived ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Arrived safely
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        In transit via public transport
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-3 text-center text-[10px] text-slate-500">
                  Last updated: {sharedState.lastUpdated} • Location protected
                </div>
              </div>

              <p className="mt-3 text-[11px] text-slate-500 text-center">
                ✨ If the commuter misses their stop or route changes, this ETA updates automatically.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
