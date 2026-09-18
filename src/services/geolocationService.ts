/**
 * Browser Geolocation & Off-Route Detection Service
 * Real GPS tracking with permission state machine, debounced off-route confidence,
 * and seamless fallback to simulation.
 */

import { GPSPermissionState, UserLocation, LatLng, Journey, OffRouteDetectionResult } from '../types';

// Singapore Central default coordinates
export const DEFAULT_SG_LOCATION: LatLng = { lat: 1.3040, lng: 103.8318 };

/**
 * Calculate Haversine distance in meters between two lat/lng coordinates
 */
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Find minimum distance from a point to a route polyline (represented as [lat, lng][])
 */
export function calculateDistanceToRouteMeters(
  point: LatLng,
  polyline: [number, number][]
): number {
  if (!polyline || polyline.length === 0) return 0;
  if (polyline.length === 1) {
    return Math.round(calculateDistanceMeters(point, { lat: polyline[0][0], lng: polyline[0][1] }));
  }

  let minDistance = Infinity;

  // Project point onto each segment of polyline
  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = { lat: polyline[i][0], lng: polyline[i][1] };
    const p2 = { lat: polyline[i + 1][0], lng: polyline[i + 1][1] };

    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = Math.max(0, Math.min(1, ((point.lng - p1.lng) * dx + (point.lat - p1.lat) * dy) / lenSq));
    }

    const proj = {
      lat: p1.lat + t * dy,
      lng: p1.lng + t * dx,
    };

    const d = calculateDistanceMeters(point, proj);
    if (d < minDistance) {
      minDistance = d;
    }
  }

  return Math.round(minDistance);
}

export class GeolocationService {
  private permissionState: GPSPermissionState = 'UNKNOWN';
  private watchId: number | null = null;
  private lastLocation: UserLocation | null = null;
  private consecutiveOffRouteCount = 0;
  private simulatedLocation: LatLng | null = null;
  private isSimulated = false;

  private locationListeners: ((location: UserLocation) => void)[] = [];
  private stateListeners: ((state: GPSPermissionState) => void)[] = [];

  public getPermissionState(): GPSPermissionState {
    return this.permissionState;
  }

  public getLastLocation(): UserLocation | null {
    return this.lastLocation;
  }

  public onLocationChange(listener: (location: UserLocation) => void): () => void {
    this.locationListeners.push(listener);
    return () => {
      this.locationListeners = this.locationListeners.filter((l) => l !== listener);
    };
  }

  public onStateChange(listener: (state: GPSPermissionState) => void): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  private notifyLocation(loc: UserLocation) {
    this.lastLocation = loc;
    for (const listener of this.locationListeners) {
      listener(loc);
    }
  }

  private notifyState(state: GPSPermissionState) {
    this.permissionState = state;
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  /**
   * Request browser geolocation tracking with fallback
   */
  public async startTracking(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      this.notifyState('UNAVAILABLE');
      return;
    }

    this.notifyState('REQUESTING');

    // Check permission API if available
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (perm.state === 'granted') {
          this.notifyState('GRANTED');
        } else if (perm.state === 'denied') {
          this.notifyState('DENIED');
        }
        perm.onchange = () => {
          if (perm.state === 'granted') this.notifyState('GRANTED');
          else if (perm.state === 'denied') this.notifyState('DENIED');
        };
      }
    } catch {
      // Ignore permission query error
    }

    // Start watching position
    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.notifyState('GRANTED');
          if (!this.isSimulated) {
            const userLoc: UserLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              heading: pos.coords.heading ?? undefined,
              speed: pos.coords.speed ?? undefined,
              timestamp: pos.timestamp,
              isSimulated: false,
            };
            this.notifyLocation(userLoc);
          }
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            this.notifyState('DENIED');
          } else {
            this.notifyState('UNAVAILABLE');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    } catch (err) {
      this.notifyState('UNAVAILABLE');
    }
  }

  public stopTracking(): void {
    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Set simulated position for indoor/judge testing
   */
  public setSimulatedLocation(coords: LatLng | null): void {
    if (coords) {
      this.isSimulated = true;
      this.simulatedLocation = coords;
      this.notifyLocation({
        lat: coords.lat,
        lng: coords.lng,
        accuracy: 10,
        timestamp: Date.now(),
        isSimulated: true,
      });
    } else {
      this.isSimulated = false;
      this.simulatedLocation = null;
    }
  }

  /**
   * Evaluates if user is genuinely off-route (>150m for 2 consecutive readings)
   */
  public evaluateOffRoute(
    currentCoords: LatLng,
    journeyOrGeometry: Journey | [number, number][]
  ): OffRouteDetectionResult {
    const geometry = Array.isArray(journeyOrGeometry)
      ? journeyOrGeometry
      : journeyOrGeometry.geometry || [];

    if (!geometry || geometry.length === 0) {
      return {
        offRoute: false,
        distanceFromRouteMeters: 0,
        confidence: 1,
        consecutiveDeviations: 0,
      };
    }

    const distMeters = calculateDistanceToRouteMeters(currentCoords, geometry);
    const isDivergent = distMeters > 150;

    if (isDivergent) {
      this.consecutiveOffRouteCount += 1;
    } else {
      this.consecutiveOffRouteCount = 0;
    }

    // Debounced threshold: requires 2 consecutive deviations for high confidence trigger
    const isConfirmedOffRoute = this.consecutiveOffRouteCount >= 2;

    return {
      offRoute: isConfirmedOffRoute,
      distanceFromRouteMeters: distMeters,
      confidence: isConfirmedOffRoute ? 0.95 : 0.5,
      consecutiveDeviations: this.consecutiveOffRouteCount,
      suggestedAction: isConfirmedOffRoute ? 'RECALCULATE_FROM_HERE' : undefined,
    };
  }

  public resetDeviationCount(): void {
    this.consecutiveOffRouteCount = 0;
  }
}

export const geolocationService = new GeolocationService();
