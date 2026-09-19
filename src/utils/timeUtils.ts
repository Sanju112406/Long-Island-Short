import { useState, useEffect } from 'react';
import { JourneyStep } from '../types';

/**
 * Format date to live Singapore/local time string, e.g. "10:52 AM"
 */
export function formatLiveTime(date: Date = new Date(), includeSeconds: boolean = false): string {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

/**
 * Compute live ETA by adding minutes to now (or base date)
 */
export function computeLiveETA(minutesFromNow: number, baseDate: Date = new Date()): string {
  const target = new Date(baseDate.getTime() + Math.max(0, minutesFromNow) * 60000);
  return formatLiveTime(target);
}

/**
 * Compute remaining minutes in a journey from the active step index onwards
 */
export function computeRemainingMinutes(steps: JourneyStep[], currentStepIndex: number): number {
  if (!steps || steps.length === 0) return 0;
  return steps
    .slice(currentStepIndex)
    .reduce((acc, step) => acc + (step.durationMins || 0), 0);
}

/**
 * Get dynamic live target arrival time (e.g. current time + total minutes + cushion rounded up to nearest 5 mins)
 */
export function getDefaultLiveTargetTime(tripDurationMins: number = 30, cushionMins: number = 10): string {
  const totalMins = tripDurationMins + cushionMins;
  const now = new Date();
  const target = new Date(now.getTime() + totalMins * 60000);
  
  // Round to nearest 5 minutes for clean human schedule
  const mins = target.getMinutes();
  const roundedMins = Math.ceil(mins / 5) * 5;
  target.setMinutes(roundedMins);
  target.setSeconds(0);
  
  return formatLiveTime(target);
}

/**
 * React hook that yields live ticking time updated every intervalMs (default 1000ms)
 */
export function useLiveClock(intervalMs: number = 1000) {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return {
    date: currentTime,
    timeString: formatLiveTime(currentTime),
    timeWithSeconds: formatLiveTime(currentTime, true),
  };
}
