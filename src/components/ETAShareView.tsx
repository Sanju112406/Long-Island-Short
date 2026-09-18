import React, { useState } from 'react';
import { Share2, Clock, CheckCircle2, ShieldCheck, Copy, Check, Smartphone, UserCheck, Users, Send } from 'lucide-react';
import { SharedETAState } from '../types';

interface ETAShareViewProps {
  sharedState: SharedETAState;
  onUpdateRecipientName: (name: string) => void;
}

export const ETAShareView: React.FC<ETAShareViewProps> = ({
  sharedState,
  onUpdateRecipientName,
}) => {
  const [copied, setCopied] = useState(false);
  const contacts = ['Mum', 'Nishikaa', 'Ryan'];

  const handleCopy = () => {
    const link = `https://eyesup.sg/share/${sharedState.shareId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="eta-sharing-screen-view" className="p-4 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold mb-1">
          <ShieldCheck className="w-3 h-3" />
          <span>Privacy Guaranteed</span>
        </div>
        <h2 className="text-base font-black text-slate-900 dark:text-white">
          ETA Sharing
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Share progress, not position. Reassures family without continuous GPS tracking.
        </p>
      </div>

      {/* Recipient Quick Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          Select Trusted Contact
        </label>
        <div className="grid grid-cols-3 gap-2">
          {contacts.map((contact) => {
            const isSelected = sharedState.recipientName === contact;
            return (
              <button
                key={contact}
                type="button"
                onClick={() => onUpdateRecipientName(contact)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black">
                  {contact[0]}
                </span>
                <span>{contact}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Shared Card (What the recipient sees on their phone) */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Live Transit Pass
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Updated {sharedState.lastUpdated}
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-400 block font-medium">
            Traveling to
          </span>
          <h3 className="text-lg font-black text-white">
            {sharedState.destination}
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Journey Progress</span>
            <span className="font-mono font-bold text-emerald-400">
              {sharedState.progressPercentage}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, sharedState.progressPercentage)}%` }}
            />
          </div>
        </div>

        {/* ETA & Status */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Estimated Arrival
            </span>
            <span className="text-base font-black text-white flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {sharedState.currentETA}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Status
            </span>
            <span className="text-xs font-bold text-emerald-300 inline-block px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 mt-0.5">
              {sharedState.statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Share Actions */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Share Link Copied to Clipboard!' : `Copy Pass Link for ${sharedState.recipientName}`}</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
          Link: https://eyesup.sg/share/{sharedState.shareId}
        </p>
      </div>
    </div>
  );
};
