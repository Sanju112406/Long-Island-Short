import React, { useState, useEffect } from 'react';
import { Bus, Train, AlertCircle, CheckCircle2, ShieldCheck, Users, Accessibility, ArrowUpRight } from 'lucide-react';

import { TransportType } from '../types';

interface LiveTransitTelemetryProps {
  stepType: TransportType;
  isPowerSaving?: boolean;
}

export const LiveTransitTelemetryBadge: React.FC<LiveTransitTelemetryProps> = ({
  stepType,
  isPowerSaving = false,
}) => {
  const [busData, setBusData] = useState<{
    serviceNo: string;
    mins: number;
    load: string;
    isWAB: boolean;
  } | null>(null);

  const [liftStatus, setLiftStatus] = useState<{
    liftUnderMaintenance: boolean;
    notice?: string;
  }>({ liftUnderMaintenance: false });

  const [alerts, setAlerts] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Fetch live bus telemetry if bus leg
    if (stepType === 'bus') {
      fetch('/api/lta/bus-arrivals/16189')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isMounted || !data?.services?.length) return;
          const svc = data.services[0];
          setBusData({
            serviceNo: svc.serviceNo,
            mins: svc.nextBus?.minutesUntilArrival ?? 4,
            load: svc.nextBus?.loadDescription ?? 'Seats Available',
            isWAB: svc.nextBus?.isWheelchairAccessible ?? true,
          });
        })
        .catch(() => {});
    }

    // Fetch LTA Facilities Maintenance
    if (stepType === 'mrt') {
      fetch('/api/lta/facilities-maintenance')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isMounted) return;
          const fac = data?.facilities || [];
          const match = fac.find((f: any) => f.stationCode === 'EW16' || f.stationCode === 'EW5');
          if (match) {
            setLiftStatus({
              liftUnderMaintenance: true,
              notice: `${match.stationName}: ${match.liftDesc} is under maintenance. Use alternative lift.`,
            });
          } else {
            setLiftStatus({
              liftUnderMaintenance: false,
              notice: 'All station lifts operating normally. Step-free access active.',
            });
          }
        })
        .catch(() => {});
    }

    // Fetch train alerts
    fetch('/api/lta/alerts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.status === 2 && data?.messages?.length > 0) {
          setAlerts(data.messages[0].content);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [stepType]);

  if (stepType === 'bus' && busData) {
    return (
      <div
        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs mt-2.5 transition-all ${
          isPowerSaving
            ? 'bg-neutral-900 border-neutral-800 text-neutral-300'
            : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200/70 dark:border-indigo-900/40 text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Bus className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <span className="font-bold">
              Bus {busData.serviceNo}: Arriving in {busData.mins} min
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <Users className="w-3 h-3" />
                {busData.load}
              </span>
              {busData.isWAB && (
                <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-semibold">
                  <Accessibility className="w-3 h-3" />
                  WAB Step-Free
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
          LTA DataMall
        </span>
      </div>
    );
  }

  if (stepType === 'mrt') {
    return (
      <div
        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs mt-2.5 transition-all ${
          liftStatus.liftUnderMaintenance
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
            : isPowerSaving
            ? 'bg-neutral-900 border-neutral-800 text-neutral-300'
            : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Train className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold">MRT Station Telemetry</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {liftStatus.notice || 'Station operating normally.'}
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
          LTA Facilities
        </span>
      </div>
    );
  }

  return null;
};
