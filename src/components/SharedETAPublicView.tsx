import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, ShieldCheck, Eye } from 'lucide-react';

interface SharedRecord {
  recipientName: string;
  destination: string;
  currentETA: string;
  progressPercentage: number;
  statusText: string;
  lastUpdated: string;
  isArrived: boolean;
}

interface SharedETAPublicViewProps {
  shareId: string;
}

// The actual page a friend opens from a copied share link — no login, no app
// install, no GPS ever sent to them. Polls the public read endpoint so it
// reflects the sender's real live progress, not a static snapshot.
export const SharedETAPublicView: React.FC<SharedETAPublicViewProps> = ({ shareId }) => {
  const [record, setRecord] = useState<SharedRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(shareId)}`);
        if (cancelled) return;
        if (res.ok) {
          setRecord(await res.json());
          setNotFound(false);
        } else if (res.status === 404) {
          setNotFound(true);
        }
      } catch {
        // Transient network error — keep showing the last known state.
      }
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [shareId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Eye className="w-4 h-4" />
          <span>Eyes Up • Live Transit Pass</span>
        </div>

        {notFound ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center space-y-2">
            <p className="font-bold">This link has expired</p>
            <p className="text-sm text-slate-400">
              Share links stay live for a few hours after they're created. Ask your contact for a fresh one.
            </p>
          </div>
        ) : !record ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400">
            Connecting to live journey status…
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${record.isArrived ? 'bg-emerald-500' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  {record.isArrived ? 'Arrived' : 'In Transit'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Updated {record.lastUpdated}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium">Traveling to</span>
              <h1 className="text-xl font-black text-white">{record.destination || 'their destination'}</h1>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Journey Progress</span>
                <span className="font-mono font-bold text-emerald-400">{record.progressPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, record.progressPercentage)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Estimated Arrival</span>
                <span className="text-base font-black text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {record.currentETA || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Status</span>
                <span className="text-xs font-bold text-emerald-300 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 mt-0.5">
                  {record.isArrived && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {record.statusText}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Progress only — never exact GPS position</span>
        </div>
      </div>
    </div>
  );
};
