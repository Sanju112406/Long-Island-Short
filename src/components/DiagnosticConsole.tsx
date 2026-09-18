import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Sparkles,
  MapPin,
  Train,
  CloudRain,
  Key,
  Shield,
  Copy,
  Check,
  Terminal,
  Clock,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface DiagnosticServiceResult {
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

export interface FullReport {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  gemini: DiagnosticServiceResult;
  oneMap: DiagnosticServiceResult;
  lta: DiagnosticServiceResult;
  weather: DiagnosticServiceResult;
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

interface DiagnosticConsoleProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

interface LogEntry {
  id: string;
  time: string;
  service: string;
  endpoint: string;
  status: number | string;
  latencyMs: number;
  type: 'success' | 'warning' | 'error' | 'info';
  summary: string;
  details?: any;
}

export const DiagnosticConsole: React.FC<DiagnosticConsoleProps> = ({
  isOpen = true,
  onClose,
  isEmbedded = false,
}) => {
  const [report, setReport] = useState<FullReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');

  const addLog = (entry: Omit<LogEntry, 'id' | 'time'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [newEntry, ...prev].slice(0, 50));
  };

  const runFullReport = async () => {
    setIsLoading(true);
    addLog({
      service: 'System',
      endpoint: 'GET /api/diagnostics/report',
      status: 'Probing...',
      latencyMs: 0,
      type: 'info',
      summary: 'Initiating full end-to-end API connectivity diagnostic suite.',
    });

    try {
      const start = Date.now();
      const res = await fetch('/api/diagnostics/report');
      const latency = Date.now() - start;
      const data: FullReport = await res.json();
      setReport(data);

      addLog({
        service: 'Diagnostic Suite',
        endpoint: '/api/diagnostics/report',
        status: res.status,
        latencyMs: latency,
        type: data.overallStatus === 'healthy' ? 'success' : data.overallStatus === 'degraded' ? 'warning' : 'error',
        summary: `Diagnostic completed: Gemini (${data.gemini.status}), OneMap (${data.oneMap.status}), LTA (${data.lta.status}).`,
        details: data,
      });
    } catch (err: any) {
      addLog({
        service: 'System',
        endpoint: '/api/diagnostics/report',
        status: 'Failed',
        latencyMs: 0,
        type: 'error',
        summary: `Diagnostic endpoint request error: ${err?.message}`,
        details: err,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testGeminiOnly = async () => {
    setTestingService('gemini');
    try {
      const start = Date.now();
      const res = await fetch('/api/diagnostics/test-gemini', { method: 'POST' });
      const latency = Date.now() - start;
      const data: DiagnosticServiceResult = await res.json();

      setReport((prev) => (prev ? { ...prev, gemini: data } : null));

      addLog({
        service: 'Gemini AI',
        endpoint: 'POST /api/diagnostics/test-gemini',
        status: data.httpStatus || (data.ok ? 200 : 'Error'),
        latencyMs: latency,
        type: data.ok ? 'success' : data.status === 'quota_exhausted' ? 'warning' : 'error',
        summary: data.message,
        details: data,
      });
    } catch (err: any) {
      addLog({
        service: 'Gemini AI',
        endpoint: 'POST /api/diagnostics/test-gemini',
        status: 'Error',
        latencyMs: 0,
        type: 'error',
        summary: `Network error probing Gemini: ${err?.message}`,
      });
    } finally {
      setTestingService(null);
    }
  };

  const testOneMapOnly = async () => {
    setTestingService('onemap');
    try {
      const start = Date.now();
      const res = await fetch('/api/diagnostics/test-onemap', { method: 'POST' });
      const latency = Date.now() - start;
      const data: DiagnosticServiceResult = await res.json();

      setReport((prev) => (prev ? { ...prev, oneMap: data } : null));

      addLog({
        service: 'OneMap Singapore',
        endpoint: 'POST /api/diagnostics/test-onemap',
        status: data.httpStatus || (data.ok ? 200 : 'Error'),
        latencyMs: latency,
        type: data.ok ? 'success' : 'error',
        summary: data.message,
        details: data,
      });
    } catch (err: any) {
      addLog({
        service: 'OneMap Singapore',
        endpoint: 'POST /api/diagnostics/test-onemap',
        status: 'Error',
        latencyMs: 0,
        type: 'error',
        summary: `Network error probing OneMap: ${err?.message}`,
      });
    } finally {
      setTestingService(null);
    }
  };

  const testLtaOnly = async () => {
    setTestingService('lta');
    try {
      const start = Date.now();
      const res = await fetch('/api/diagnostics/test-lta', { method: 'POST' });
      const latency = Date.now() - start;
      const data: DiagnosticServiceResult = await res.json();

      setReport((prev) => (prev ? { ...prev, lta: data } : null));

      addLog({
        service: 'LTA DataMall',
        endpoint: 'POST /api/diagnostics/test-lta',
        status: data.httpStatus || 200,
        latencyMs: latency,
        type: data.ok ? 'success' : 'warning',
        summary: data.message,
        details: data,
      });
    } catch (err: any) {
      addLog({
        service: 'LTA DataMall',
        endpoint: 'POST /api/diagnostics/test-lta',
        status: 'Error',
        latencyMs: 0,
        type: 'error',
        summary: `Error probing LTA: ${err?.message}`,
      });
    } finally {
      setTestingService(null);
    }
  };

  useEffect(() => {
    runFullReport();
  }, []);

  const handleCopyLogs = () => {
    const text = JSON.stringify(
      {
        reportTimestamp: report?.timestamp,
        overallStatus: report?.overallStatus,
        report,
        logs,
      },
      null,
      2
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStatusBadge = (res?: DiagnosticServiceResult) => {
    if (!res) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Not Tested
        </span>
      );
    }
    if (res.ok) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Connected ({res.latencyMs}ms)
        </span>
      );
    }
    if (res.status === 'quota_exhausted') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Quota Limit (Fallback Active)
        </span>
      );
    }
    if (res.status === 'missing_config') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
          <Key className="w-3 h-3 text-slate-500" />
          Key / Pass Not Set
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
        <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
        {res.status === 'auth_failed' ? 'Auth Failed' : 'Connection Error'}
      </span>
    );
  };

  const content = (
    <div className="space-y-4 text-slate-900 dark:text-slate-100">
      {/* Top Header Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white shadow-lg border border-slate-700/60 relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
              <h3 className="text-sm font-black tracking-tight">API Health & Service Diagnostics</h3>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 max-w-[260px]">
              Live connectivity verification for Gemini 3.8 Flash, OneMap Singapore SLA, & LTA DataMall
            </p>
          </div>

          <button
            type="button"
            onClick={runFullReport}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Probing...' : 'Run All'}
          </button>
        </div>

        {/* Global Status Bar */}
        <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Overall Status:</span>
            <span
              className={`font-black text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                report?.overallStatus === 'healthy'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  : report?.overallStatus === 'degraded'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/50'
              }`}
            >
              {report?.overallStatus || 'Checking...'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {report?.timestamp ? new Date(report.timestamp).toLocaleTimeString() : '—'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Service Health Grid
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'logs'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Live Request Logs ({logs.length})
        </button>
      </div>

      {/* TAB 1: SERVICE OVERVIEW GRID */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {/* 1. Gemini AI Service Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black">Gemini 3.8 Flash</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Voice intent reasoning & emotional de-escalation
                  </p>
                </div>
              </div>
              {renderStatusBadge(report?.gemini)}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500 dark:text-slate-400">Key Status:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {report?.environment.hasGeminiKey
                    ? `Configured (${report.environment.geminiKeyPrefix})`
                    : 'Not Detected'}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500 dark:text-slate-400">Endpoint:</span>
                <span className="text-slate-700 dark:text-slate-300">POST /api/companion/chat</span>
              </div>
              {report?.gemini.details?.responseSnippet && (
                <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex items-start gap-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Probe Response:</span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    "{report.gemini.details.responseSnippet}"
                  </span>
                </div>
              )}
            </div>

            {report?.gemini.recommendation && (
              <div className="p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-start gap-1.5 text-[11px] text-emerald-900 dark:text-emerald-200">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="leading-tight">{report.gemini.recommendation}</p>
              </div>
            )}

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={testGeminiOnly}
                disabled={testingService === 'gemini'}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${testingService === 'gemini' ? 'animate-spin' : ''}`} />
                {testingService === 'gemini' ? 'Testing...' : 'Test Gemini Probe'}
              </button>
            </div>
          </div>

          {/* 2. OneMap Singapore SLA Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black">OneMap Singapore (GovTech/SLA)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Official SLA geocoding & public transport routing
                  </p>
                </div>
              </div>
              {renderStatusBadge(report?.oneMap)}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Account Email:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {report?.environment.oneMapEmail || 'e1486310@u.nus.edu'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Password Status:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {report?.environment.hasOneMapPassword ? 'Configured in .env' : 'Missing'}
                </span>
              </div>
              {report?.oneMap.details?.tokenExpires && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Token Expires:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {new Date(report.oneMap.details.tokenExpires).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {report?.oneMap.recommendation && (
              <div className="p-2 rounded-lg bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/60 flex items-start gap-1.5 text-[11px] text-sky-900 dark:text-sky-200">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
                <p className="leading-tight">{report.oneMap.recommendation}</p>
              </div>
            )}

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={testOneMapOnly}
                disabled={testingService === 'onemap'}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${testingService === 'onemap' ? 'animate-spin' : ''}`} />
                {testingService === 'onemap' ? 'Testing...' : 'Test OneMap Token & Search'}
              </button>
            </div>
          </div>

          {/* 3. LTA DataMall Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  <Train className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black">LTA DataMall & Weather</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Live MRT alerts, bus arrivals & rain nowcasts
                  </p>
                </div>
              </div>
              {renderStatusBadge(report?.lta)}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">LTA Account Key:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {report?.environment.hasLtaKey ? 'Configured' : 'Public Feed Active'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Weather Feed:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {report?.weather.message || 'data.gov.sg active'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={testLtaOnly}
                disabled={testingService === 'lta'}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${testingService === 'lta' ? 'animate-spin' : ''}`} />
                {testingService === 'lta' ? 'Testing...' : 'Test LTA Live Alerts'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE REQUEST LOG VIEWER */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Live Network Activity ({logs.length} events recorded)
            </span>
            <button
              type="button"
              onClick={handleCopyLogs}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied JSON!' : 'Copy Logs'}
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
                No requests recorded yet. Click "Run All" above to probe services.
              </div>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1.5 transition-all"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.type === 'success'
                              ? 'bg-emerald-500'
                              : log.type === 'warning'
                              ? 'bg-amber-500'
                              : log.type === 'error'
                              ? 'bg-rose-500'
                              : 'bg-sky-500'
                          }`}
                        />
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {log.service}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.endpoint}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            typeof log.status === 'number' && log.status === 200
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {log.status}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                      {log.summary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span className="font-mono">{log.time}</span>
                      {log.latencyMs > 0 && <span>Latency: {log.latencyMs}ms</span>}
                    </div>

                    {isExpanded && log.details && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                        <pre className="p-2 rounded-lg bg-slate-950 text-emerald-400 overflow-x-auto max-h-48 text-[10px]">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return <div id="diagnostic-console-embedded">{content}</div>;
  }

  if (!isOpen) return null;

  return (
    <div
      id="diagnostic-console-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="diagnostic-console-modal-content"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              System Diagnostics & Telemetry
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {content}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
