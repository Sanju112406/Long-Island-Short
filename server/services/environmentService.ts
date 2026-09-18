/**
 * data.gov.sg Environment & Extended Weather Service (PS2 section 2.4)
 * All endpoints are free, keyless, and live under https://api-open.data.gov.sg/v2/real-time/api/.
 * Station/region readings feed walking & cycling leg advisories; forecasts feed trip planning.
 */

export interface StationReading {
  stationId: string;
  stationName: string;
  lat: number;
  lng: number;
  value: number;
}

export interface StationDataset {
  source: 'LIVE_WEATHER' | 'FALLBACK_SIMULATION';
  timestamp: string;
  unit: string;
  areaAverage: number | null;
  readings: StationReading[];
}

export interface RegionalPM25 {
  source: 'LIVE_WEATHER' | 'FALLBACK_SIMULATION';
  timestamp: string;
  unit: string;
  byRegion: Record<'west' | 'south' | 'north' | 'east' | 'central', number>;
  overallAverage: number | null;
  advisory: string;
}

export interface DailyForecast {
  date: string;
  day?: string;
  forecast: string;
  temperatureLow: number;
  temperatureHigh: number;
  relativeHumidityLow: number;
  relativeHumidityHigh: number;
  windDirection: string;
  windSpeedLow: number;
  windSpeedHigh: number;
}

export interface MultiDayOutlook {
  source: 'LIVE_WEATHER' | 'FALLBACK_SIMULATION';
  updatedTimestamp: string;
  days: DailyForecast[];
}

const DATA_GOV_BASE = 'https://api-open.data.gov.sg/v2/real-time/api';

/**
 * Shared fetcher for the station-reading family (rainfall, air-temperature,
 * relative-humidity, wind-speed, wind-direction) — they all share one response shape.
 */
async function fetchStationDataset(endpoint: string, unit: string): Promise<StationDataset> {
  try {
    const res = await fetch(`${DATA_GOV_BASE}/${endpoint}`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const json = await res.json();
      const stations: Array<{ id: string; name: string; location: { latitude: number; longitude: number } }> =
        json.data?.stations || [];
      const stationsById = new Map(stations.map((s) => [s.id, s]));
      const latestReading = json.data?.readings?.[0];
      const values: Array<{ stationId: string; value: number }> = latestReading?.data || [];

      const readings: StationReading[] = values.map((v) => {
        const st = stationsById.get(v.stationId);
        return {
          stationId: v.stationId,
          stationName: st?.name || v.stationId,
          lat: st?.location?.latitude ?? 0,
          lng: st?.location?.longitude ?? 0,
          value: v.value,
        };
      });

      const areaAverage = readings.length
        ? Math.round((readings.reduce((sum, r) => sum + r.value, 0) / readings.length) * 10) / 10
        : null;

      return {
        source: 'LIVE_WEATHER',
        timestamp: latestReading?.timestamp || new Date().toISOString(),
        unit,
        areaAverage,
        readings,
      };
    }
    console.warn(`[Environment] ${endpoint} returned HTTP ${res.status}, using fallback`);
  } catch (err) {
    console.warn(`[Environment] ${endpoint} fetch failed, using fallback:`, err);
  }

  return {
    source: 'FALLBACK_SIMULATION',
    timestamp: new Date().toISOString(),
    unit,
    areaAverage: null,
    readings: [],
  };
}

export async function fetchRainfall(): Promise<StationDataset> {
  return fetchStationDataset('rainfall', 'mm');
}

export async function fetchAirTemperature(): Promise<StationDataset> {
  return fetchStationDataset('air-temperature', '°C');
}

export async function fetchHumidity(): Promise<StationDataset> {
  return fetchStationDataset('relative-humidity', '%');
}

export async function fetchWindSpeed(): Promise<StationDataset> {
  return fetchStationDataset('wind-speed', 'knots');
}

export async function fetchWindDirection(): Promise<StationDataset> {
  return fetchStationDataset('wind-direction', 'degrees');
}

/**
 * PM2.5 comes back per-region (west/south/north/east/central), not per-station.
 */
export async function fetchPM25(): Promise<RegionalPM25> {
  try {
    const res = await fetch(`${DATA_GOV_BASE}/pm25`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const json = await res.json();
      const item = json.data?.items?.[0];
      const byRegion = item?.readings?.pm25_one_hourly;
      if (byRegion) {
        const values = Object.values(byRegion) as number[];
        const overallAverage = values.length
          ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
          : null;
        const advisory =
          overallAverage !== null && overallAverage > 55
            ? 'Elevated PM2.5 levels — sensitive commuters should consider a mask on outdoor legs.'
            : 'PM2.5 levels are within the healthy range across Singapore.';
        return {
          source: 'LIVE_WEATHER',
          timestamp: item.timestamp || new Date().toISOString(),
          unit: 'µg/m³',
          byRegion,
          overallAverage,
          advisory,
        };
      }
    } else {
      console.warn(`[Environment] pm25 returned HTTP ${res.status}, using fallback`);
    }
  } catch (err) {
    console.warn('[Environment] pm25 fetch failed, using fallback:', err);
  }

  return {
    source: 'FALLBACK_SIMULATION',
    timestamp: new Date().toISOString(),
    unit: 'µg/m³',
    byRegion: { west: 0, south: 0, north: 0, east: 0, central: 0 },
    overallAverage: null,
    advisory: 'Air quality data temporarily unavailable.',
  };
}

export async function fetch24HourForecast(): Promise<MultiDayOutlook> {
  try {
    const res = await fetch(`${DATA_GOV_BASE}/twenty-four-hr-forecast`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const json = await res.json();
      const record = json.data?.records?.[0];
      if (record) {
        return {
          source: 'LIVE_WEATHER',
          updatedTimestamp: record.updatedTimestamp || new Date().toISOString(),
          days: [
            {
              date: record.date,
              forecast: record.general?.forecast?.text || 'Unavailable',
              temperatureLow: record.general?.temperature?.low ?? 0,
              temperatureHigh: record.general?.temperature?.high ?? 0,
              relativeHumidityLow: record.general?.relativeHumidity?.low ?? 0,
              relativeHumidityHigh: record.general?.relativeHumidity?.high ?? 0,
              windDirection: record.general?.wind?.direction || '',
              windSpeedLow: record.general?.wind?.speed?.low ?? 0,
              windSpeedHigh: record.general?.wind?.speed?.high ?? 0,
            },
          ],
        };
      }
    }
  } catch (err) {
    console.warn('[Environment] 24hr forecast fetch failed, using fallback:', err);
  }

  return { source: 'FALLBACK_SIMULATION', updatedTimestamp: new Date().toISOString(), days: [] };
}

export async function fetch4DayOutlook(): Promise<MultiDayOutlook> {
  try {
    const res = await fetch(`${DATA_GOV_BASE}/four-day-outlook`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const json = await res.json();
      const record = json.data?.records?.[0];
      const forecasts = record?.forecasts || [];
      if (forecasts.length) {
        return {
          source: 'LIVE_WEATHER',
          updatedTimestamp: record.updatedTimestamp || new Date().toISOString(),
          days: forecasts.map((f: any) => ({
            date: f.timestamp?.split('T')[0] || '',
            day: f.day,
            forecast: f.forecast?.text || 'Unavailable',
            temperatureLow: f.temperature?.low ?? 0,
            temperatureHigh: f.temperature?.high ?? 0,
            relativeHumidityLow: f.relativeHumidity?.low ?? 0,
            relativeHumidityHigh: f.relativeHumidity?.high ?? 0,
            windDirection: f.wind?.direction || '',
            windSpeedLow: f.wind?.speed?.low ?? 0,
            windSpeedHigh: f.wind?.speed?.high ?? 0,
          })),
        };
      }
    }
  } catch (err) {
    console.warn('[Environment] 4-day outlook fetch failed, using fallback:', err);
  }

  return { source: 'FALLBACK_SIMULATION', updatedTimestamp: new Date().toISOString(), days: [] };
}
