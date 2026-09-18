import { GoogleGenAI } from '@google/genai';
import { getOneMapEmail, hasOneMapPassword } from './oneMapService';
import { fetchTrainServiceAlerts, fetchBusArrivals } from './ltaService';
import { fetchSingaporeWeather } from './weatherService';

export interface ServiceDiagnosticResult {
  service: string;
  ok: boolean;
  status: 'connected' | 'auth_failed' | 'quota_exhausted' | 'missing_config' | 'network_error' | 'rate_limited';
  httpStatus?: number;
  latencyMs: number;
  message: string;
  details?: any;
  timestamp: string;
  recommendation?: string;
}

export interface FullDiagnosticReport {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  gemini: ServiceDiagnosticResult;
  oneMap: ServiceDiagnosticResult;
  lta: ServiceDiagnosticResult;
  weather: ServiceDiagnosticResult;
  environment: {
    nodeEnv: string;
    hasGeminiKey: boolean;
    geminiKeyPrefix: string;
    geminiKeyLength: number;
    hasOneMapPassword: boolean;
    oneMapEmail: string;
    hasLtaKey: boolean;
  };
}

/**
 * Clean and normalize API key string (stripping accidental quotes and surrounding whitespace)
 */
function cleanKey(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Mask key for safe display (shows first 6 and last 4 chars)
 */
function maskKey(key: string): string {
  if (!key) return '(not set)';
  if (key.length <= 10) return `${key.substring(0, 3)}***`;
  return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
}

/**
 * Diagnostic test for Gemini API
 */
export async function testGeminiConnectivity(): Promise<ServiceDiagnosticResult> {
  const startTime = Date.now();
  const rawKey = process.env.GEMINI_API_KEY || '';
  const key = cleanKey(rawKey);

  if (!key || key === 'MY_GEMINI_API_KEY') {
    return {
      service: 'Gemini AI (Google GenAI)',
      ok: false,
      status: 'missing_config',
      latencyMs: Date.now() - startTime,
      message: 'GEMINI_API_KEY is not configured or is a placeholder.',
      timestamp: new Date().toISOString(),
      recommendation: 'Configure your GEMINI_API_KEY in Settings > Secrets or the .env file.',
      details: {
        keyConfigured: false,
        keyLength: key.length,
      },
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-diagnostics',
        },
      },
    });

    const targetModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Respond with the single word: READY' }],
        },
      ],
      config: {
        maxOutputTokens: 20,
        temperature: 0.1,
        // Flash models spend maxOutputTokens on hidden "thinking" unless disabled,
        // which silently returns an empty response.text for small token budgets.
        ...(targetModel.includes('flash') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      },
    });

    const latencyMs = Date.now() - startTime;
    const responseText = response.text?.trim() || '';

    return {
      service: 'Gemini AI (Google GenAI)',
      ok: true,
      status: 'connected',
      httpStatus: 200,
      latencyMs,
      message: `${targetModel} responded successfully in ${latencyMs}ms.`,
      timestamp: new Date().toISOString(),
      details: {
        model: targetModel,
        keyMasked: maskKey(key),
        keyLength: key.length,
        responseSnippet: responseText,
      },
      recommendation: 'Gemini API is fully operational and authenticated.',
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const errMsg = err?.message || String(err);
    const errStatus = err?.status || err?.statusCode || 500;

    let status: ServiceDiagnosticResult['status'] = 'network_error';
    let recommendation = 'Check your network connection or review Google Cloud API settings.';

    if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429') || errMsg.includes('quota')) {
      status = 'quota_exhausted';
      recommendation = 'API daily request quota or rate limit exceeded. The app seamlessly falls back to the deterministic Singapore companion engine until quota resets.';
    } else if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('INVALID_ARGUMENT') || errMsg.includes('400')) {
      status = 'auth_failed';
      recommendation = 'The provided GEMINI_API_KEY is invalid. Please verify the key string from Google AI Studio (https://aistudio.google.com/apikey).';
    } else if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403')) {
      status = 'auth_failed';
      recommendation = 'Permission denied on Gemini API. Ensure the Generative Language API is enabled in your Google Cloud project.';
    } else if (errMsg.includes('503') || errMsg.includes('overloaded')) {
      status = 'rate_limited';
      recommendation = 'Google Gemini endpoint is experiencing high traffic. Retry in a few moments.';
    }

    return {
      service: 'Gemini AI (Google GenAI)',
      ok: false,
      status,
      httpStatus: errStatus,
      latencyMs,
      message: `Gemini request error: ${errMsg}`,
      timestamp: new Date().toISOString(),
      recommendation,
      details: {
        keyMasked: maskKey(key),
        keyLength: key.length,
        rawError: errMsg,
        stack: err?.stack ? err.stack.split('\n').slice(0, 3).join('\n') : undefined,
      },
    };
  }
}

/**
 * Diagnostic test for OneMap Singapore
 */
export async function testOneMapConnectivity(): Promise<ServiceDiagnosticResult> {
  const startTime = Date.now();
  const email = getOneMapEmail();
  const rawPass = process.env.ONEMAP_PASSWORD || '';
  const password = cleanKey(rawPass);

  if (!password) {
    return {
      service: 'OneMap Singapore (GovTech / SLA)',
      ok: false,
      status: 'missing_config',
      latencyMs: Date.now() - startTime,
      message: 'ONEMAP_PASSWORD is not set in environment variables.',
      timestamp: new Date().toISOString(),
      recommendation: 'Configure ONEMAP_PASSWORD in .env or AI Studio Settings. (Email registered: ' + email + ')',
      details: {
        email,
        hasPassword: false,
      },
    };
  }

  try {
    // Step 1: Test token acquisition
    const authRes = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EyesUp-Singapore-Diagnostic/1.0',
      },
      body: JSON.stringify({ email, password }),
    });

    const authBody = await authRes.json().catch(() => ({}));
    const authLatency = Date.now() - startTime;

    if (!authRes.ok || !authBody.access_token) {
      return {
        service: 'OneMap Singapore (GovTech / SLA)',
        ok: false,
        status: 'auth_failed',
        httpStatus: authRes.status,
        latencyMs: authLatency,
        message: `OneMap token request failed (HTTP ${authRes.status}): ${authBody.error || authBody.message || 'Invalid credentials'}`,
        timestamp: new Date().toISOString(),
        recommendation: 'Verify your OneMap email & password on https://www.onemap.gov.sg/apidocs/. Singapore SLA accounts require an active registered account.',
        details: {
          email,
          httpStatus: authRes.status,
          responseBody: authBody,
        },
      };
    }

    const token = authBody.access_token;
    const expiry = authBody.expiry_timestamp;

    // Step 2: Test Elasticsearch query with acquired token
    const searchStartTime = Date.now();
    const searchRes = await fetch(
      'https://www.onemap.gov.sg/api/common/elastic/search?searchVal=NUS&returnGeom=Y&getAddrDetails=Y&pageNum=1',
      {
        headers: {
          Authorization: token,
          'User-Agent': 'EyesUp-Singapore-Diagnostic/1.0',
        },
      }
    );

    const searchData = await searchRes.json().catch(() => ({ results: [] }));
    const totalLatency = Date.now() - startTime;

    return {
      service: 'OneMap Singapore (GovTech / SLA)',
      ok: true,
      status: 'connected',
      httpStatus: 200,
      latencyMs: totalLatency,
      message: `OneMap token verified and ElasticSearch query returned ${searchData.results?.length || 0} locations in ${totalLatency}ms.`,
      timestamp: new Date().toISOString(),
      recommendation: 'OneMap Singapore API is fully active and authenticated.',
      details: {
        email,
        tokenMasked: maskKey(token),
        tokenExpires: expiry,
        searchResultsSample: (searchData.results || []).slice(0, 2).map((r: any) => r.SEARCHVAL || r.BUILDING),
      },
    };
  } catch (err: any) {
    return {
      service: 'OneMap Singapore (GovTech / SLA)',
      ok: false,
      status: 'network_error',
      latencyMs: Date.now() - startTime,
      message: `Network error connecting to OneMap SLA API: ${err?.message}`,
      timestamp: new Date().toISOString(),
      recommendation: 'Check container outbound network access or OneMap API status.',
      details: {
        email,
        error: err?.message,
      },
    };
  }
}

/**
 * Diagnostic test for LTA DataMall
 */
export async function testLtaConnectivity(): Promise<ServiceDiagnosticResult> {
  const startTime = Date.now();
  try {
    const alerts = await fetchTrainServiceAlerts();
    const latencyMs = Date.now() - startTime;
    return {
      service: 'LTA DataMall Singapore',
      ok: true,
      status: 'connected',
      httpStatus: 200,
      latencyMs,
      message: `LTA DataMall train alert feed active (${alerts.messages?.length || 0} active alerts).`,
      timestamp: new Date().toISOString(),
      details: {
        hasKey: !!process.env.LTA_ACCOUNT_KEY,
        status: alerts.status,
        messagesCount: alerts.messages.length,
      },
    };
  } catch (err: any) {
    return {
      service: 'LTA DataMall Singapore',
      ok: false,
      status: 'network_error',
      latencyMs: Date.now() - startTime,
      message: `LTA DataMall request error: ${err?.message}`,
      timestamp: new Date().toISOString(),
      recommendation: 'LTA DataMall feed temporarily unreachable; using synthetic calibrated feeds.',
    };
  }
}

/**
 * Diagnostic test for data.gov.sg Weather
 */
export async function testWeatherConnectivity(): Promise<ServiceDiagnosticResult> {
  const startTime = Date.now();
  try {
    const weather = await fetchSingaporeWeather('Central');
    const latencyMs = Date.now() - startTime;
    return {
      service: 'data.gov.sg Weather Nowcast',
      ok: true,
      status: 'connected',
      httpStatus: 200,
      latencyMs,
      message: `Weather nowcast active for ${weather.area}: ${weather.forecast}`,
      timestamp: new Date().toISOString(),
      details: weather,
    };
  } catch (err: any) {
    return {
      service: 'data.gov.sg Weather Nowcast',
      ok: false,
      status: 'network_error',
      latencyMs: Date.now() - startTime,
      message: `Weather API error: ${err?.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run complete diagnostic suite
 */
export async function runFullDiagnostic(): Promise<FullDiagnosticReport> {
  const [gemini, oneMap, lta, weather] = await Promise.all([
    testGeminiConnectivity(),
    testOneMapConnectivity(),
    testLtaConnectivity(),
    testWeatherConnectivity(),
  ]);

  const rawGeminiKey = cleanKey(process.env.GEMINI_API_KEY);
  const rawOneMapPass = cleanKey(process.env.ONEMAP_PASSWORD);

  let overallStatus: FullDiagnosticReport['overallStatus'] = 'healthy';
  if (!gemini.ok || !oneMap.ok) {
    overallStatus = (!gemini.ok && !oneMap.ok) ? 'critical' : 'degraded';
  }

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    gemini,
    oneMap,
    lta,
    weather,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasGeminiKey: !!rawGeminiKey && rawGeminiKey !== 'MY_GEMINI_API_KEY',
      geminiKeyPrefix: rawGeminiKey ? maskKey(rawGeminiKey) : '(not set)',
      geminiKeyLength: rawGeminiKey.length,
      hasOneMapPassword: !!rawOneMapPass,
      oneMapEmail: getOneMapEmail(),
      hasLtaKey: !!process.env.LTA_ACCOUNT_KEY,
    },
  };
}
