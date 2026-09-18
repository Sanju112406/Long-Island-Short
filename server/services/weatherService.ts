/**
 * data.gov.sg Weather Nowcast Service
 * Connects to the public Singapore 2-hour real-time weather API (free, no API key needed).
 * Real-time endpoint: https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast
 */

export interface WeatherNowcast {
  area: string;
  forecast: string; // e.g. "Passing Showers", "Partly Cloudy", "Fair (Day)"
  isRaining: boolean;
  shelterRecommended: boolean;
  advice: string;
  lastUpdated: string;
}

export async function fetchSingaporeWeather(areaName: string = 'Tanglin'): Promise<WeatherNowcast> {
  try {
    const res = await fetch(
      'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
      { signal: AbortSignal.timeout(4000) }
    );

    if (res.ok) {
      const data = await res.json();
      const items = data.data?.items?.[0];
      const forecasts = items?.forecasts || [];

      // Find matching area or default to first/Central
      const matched =
        forecasts.find((f: any) =>
          f.area.toLowerCase().includes(areaName.toLowerCase())
        ) ||
        forecasts.find((f: any) =>
          ['central water catchment', 'tanglin', 'novena', 'queenstown', 'orchard'].some((k) =>
            f.area.toLowerCase().includes(k)
          )
        ) ||
        forecasts[0];

      if (matched) {
        const forecastText = matched.forecast;
        const isRaining = /rain|shower|thunderstorm/i.test(forecastText);
        return {
          area: matched.area,
          forecast: forecastText,
          isRaining,
          shelterRecommended: isRaining,
          advice: isRaining
            ? `Passing showers detected in ${matched.area}. Eyes Up will prioritize sheltered linkways and underground MRT underpasses.`
            : `Weather in ${matched.area} is clear (${forecastText}). Ideal conditions for outdoor walking.`,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
    }
  } catch (err) {
    console.warn('data.gov.sg weather fetch failed, using fallback:', err);
  }

  // Graceful deterministic fallback
  return {
    area: 'Central Singapore',
    forecast: 'Fair (Day)',
    isRaining: false,
    shelterRecommended: false,
    advice: 'Weather is currently fair across the central corridor. Sheltered linkways available throughout.',
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
