/**
 * ETA Share Service
 * A lightweight in-memory store so a real, unauthenticated recipient link
 * (no login, no GPS exposed) can poll for a commuter's live journey progress.
 * In-memory is sufficient for a single-server hackathon deploy; each share
 * expires a few hours after creation so the store never grows unbounded.
 */

export interface SharedJourneyState {
  shareId: string;
  recipientName: string;
  destination: string;
  currentETA: string;
  progressPercentage: number;
  statusText: string;
  lastUpdated: string;
  isArrived: boolean;
  createdAt: number;
}

const shares = new Map<string, SharedJourneyState>();
const SHARE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — comfortably longer than any single commute

export function createOrUpdateShare(
  shareId: string,
  data: Omit<SharedJourneyState, 'shareId' | 'createdAt'>
): SharedJourneyState {
  const existing = shares.get(shareId);
  const record: SharedJourneyState = {
    shareId,
    createdAt: existing?.createdAt ?? Date.now(),
    ...data,
  };
  shares.set(shareId, record);
  return record;
}

export function getShare(shareId: string): SharedJourneyState | null {
  const record = shares.get(shareId);
  if (!record) return null;
  if (Date.now() - record.createdAt > SHARE_TTL_MS) {
    shares.delete(shareId);
    return null;
  }
  return record;
}
