import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Network, Server, Play, AlertCircle, CheckCircle, HelpCircle, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import { api, BASE_API_URL, ROOT_SERVER_URL, ApiError } from '../services/api';

export const ApiTestPage: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(BASE_API_URL);
  const [rootUrl, setRootUrl] = useState(ROOT_SERVER_URL);
  const [customOverride, setCustomOverride] = useState(false);

  // States for the current test result
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    type?: string;
    status?: number;
    errors?: any[];
  } | null>(null);
  const [responsePayload, setResponsePayload] = useState<any>(null);

  // Keep rootUrl updated when apiUrl changes if custom override is set
  useEffect(() => {
    if (customOverride) {
      const cleanCustom = apiUrl.trim().replace(/\/$/, '');
      const testRoot = cleanCustom.endsWith('/api')
        ? cleanCustom.substring(0, cleanCustom.length - 4)
        : cleanCustom;
      setRootUrl(testRoot);
    }
  }, [apiUrl, customOverride]);

  const handleResetUrl = () => {
    setApiUrl(BASE_API_URL);
    setRootUrl(ROOT_SERVER_URL);
    setCustomOverride(false);
  };

  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiUrl(e.target.value);
    setCustomOverride(true);
  };

  // Safe wrapper for requests to honor custom URL overrides
  const runTest = async (type: string, action: () => Promise<any>) => {
    setLoading(true);
    setTestType(type);
    setStatus('idle');
    setErrorDetails(null);
    setResponsePayload(null);

    // If custom URL is set, we temporarily override VITE_API_URL behavior by editing storage
    // or passing custom URLs. In our api client, the methods accept absolute paths.
    // So if customOverride is true, we resolve relative paths against the overridden apiUrl/rootUrl.
    const getResolvedPath = (relativePath: string, isRoot = false) => {
      if (!customOverride) return relativePath;
      const base = isRoot ? rootUrl : apiUrl;
      const cleanBase = base.replace(/\/$/, '');
      const cleanPath = relativePath.replace(/^\//, '');
      return `${cleanBase}/${cleanPath}`;
    };

    try {
      const result = await action();
      setStatus('success');
      setResponsePayload(result);
    } catch (err: any) {
      setStatus('error');
      if (err instanceof ApiError) {
        setErrorDetails({
          message: err.message,
          type: err.type,
          status: err.status,
          errors: err.errors,
        });
      } else {
        setErrorDetails({
          message: err.message || 'An unexpected error occurred',
          type: 'unknown',
        });
      }
      setResponsePayload(err.data || null);
    } finally {
      setLoading(false);
    }
  };

  // Test 1: Hit GET /health (Root server health check)
  const testHealthCheck = () => {
    runTest('GET /health (Health Ping)', () => {
      const path = customOverride ? `${rootUrl}/health` : '/health';
      return fetch(path)
        .then((res) => {
          if (!res.ok) throw new ApiError(`Health HTTP ${res.status}`, res.status);
          return res.json();
        })
        .catch((e) => {
          if (e instanceof ApiError) throw e;
          throw new ApiError(e.message || 'Network error connecting to health endpoint');
        });
    });
  };

  // Test 2: Hit GET /api/nonexistent-404-test (Returns 404)
  const test404Error = () => {
    runTest('GET /api/nonexistent-endpoint (404 Not Found)', () => {
      const path = customOverride ? `${apiUrl}/nonexistent-endpoint-404-test` : '/nonexistent-endpoint-404-test';
      return api.get(path);
    });
  };

  // Test 3: Hit POST /api/auth/login with empty object (Returns 400 validation error)
  const test400ValidationError = () => {
    runTest('POST /api/auth/login (400 Validation Error)', () => {
      const path = customOverride ? `${apiUrl}/auth/login` : '/auth/login';
      return api.post(path, {}); // Sending empty body triggers express-validator
    });
  };

  // Test 4: Hit POST /api/auth/login with invalid email schema (400 Validation Error details)
  const testValidationErrorDetails = () => {
    runTest('POST /api/auth/login with bad format (Validation Details)', () => {
      const path = customOverride ? `${apiUrl}/auth/login` : '/auth/login';
      return api.post(path, { email: 'not-an-email', password: '123' });
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Network className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                NicheLink Connectivity Suite
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-400">Diagnostics Active</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Controls */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* Base URL Card */}
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span>Target Connection Settings</span>
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Normalized API Base URL</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={handleCustomUrlChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. http://localhost:5000/api"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Root Server URL (computed)</label>
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-400 select-all overflow-x-auto whitespace-nowrap">
                  {rootUrl}
                </div>
              </div>
              {customOverride && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-amber-400 font-medium">⚠️ Custom URL override active</span>
                  <button
                    onClick={handleResetUrl}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span>Trigger Test Actions</span>
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={testHealthCheck}
                disabled={loading}
                className="w-full text-left py-3 px-4 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
              >
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">Test 1: Health Ping</div>
                  <div className="text-[10px] text-slate-500 font-normal">Checks backend status via GET /health</div>
                </div>
                <div className="px-2 py-1 bg-slate-800 group-hover:bg-indigo-600 rounded text-[10px] text-slate-400 group-hover:text-white transition-colors">Run</div>
              </button>

              <button
                onClick={test400ValidationError}
                disabled={loading}
                className="w-full text-left py-3 px-4 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
              >
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">Test 2: Validation Fail (400)</div>
                  <div className="text-[10px] text-slate-500 font-normal">POST /api/auth/login with empty body</div>
                </div>
                <div className="px-2 py-1 bg-slate-800 group-hover:bg-indigo-600 rounded text-[10px] text-slate-400 group-hover:text-white transition-colors">Run</div>
              </button>

              <button
                onClick={testValidationErrorDetails}
                disabled={loading}
                className="w-full text-left py-3 px-4 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
              >
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">Test 3: Bad Form Details (400)</div>
                  <div className="text-[10px] text-slate-500 font-normal">POST /api/auth/login with malformed fields</div>
                </div>
                <div className="px-2 py-1 bg-slate-800 group-hover:bg-indigo-600 rounded text-[10px] text-slate-400 group-hover:text-white transition-colors">Run</div>
              </button>

              <button
                onClick={test404Error}
                disabled={loading}
                className="w-full text-left py-3 px-4 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
              >
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">Test 4: Not Found (404)</div>
                  <div className="text-[10px] text-slate-500 font-normal">GET nonexistent endpoint</div>
                </div>
                <div className="px-2 py-1 bg-slate-800 group-hover:bg-indigo-600 rounded text-[10px] text-slate-400 group-hover:text-white transition-colors">Run</div>
              </button>

              <button
                onClick={() => {
                  // Simply change URL to invalid to trigger Network Error
                  setApiUrl('http://localhost:9999/api');
                  setCustomOverride(true);
                  runTest('GET /api/health on invalid URL (Network Error)', () => api.get('/health'));
                }}
                disabled={loading}
                className="w-full text-left py-3 px-4 bg-slate-900 border border-slate-850 hover:border-rose-500 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
              >
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-rose-400 transition-colors">Test 5: Network Error</div>
                  <div className="text-[10px] text-slate-500 font-normal">Forces API to hit bad port 9999</div>
                </div>
                <div className="px-2 py-1 bg-slate-800 group-hover:bg-rose-600 rounded text-[10px] text-slate-400 group-hover:text-white transition-colors">Run</div>
              </button>
            </div>
          </div>
        </section>

        {/* Right Side: Diagnostics Output */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full min-h-[500px]">
            
            {/* Tab header / title */}
            <div className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnostic Results</span>
              {testType && (
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono">
                  {testType}
                </span>
              )}
            </div>

            {/* Results Area */}
            <div className="p-6 flex-grow overflow-y-auto space-y-6">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3 py-16">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400 font-medium">Executing request...</span>
                </div>
              ) : status === 'idle' ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16 text-slate-500">
                  <HelpCircle className="w-12 h-12 text-slate-700" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-400">No diagnostic run yet</h3>
                    <p className="text-xs max-w-sm mx-auto mt-1">Select one of the actions on the left to verify connection status and error classification.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Status Banner */}
                  {status === 'success' ? (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-400">Request Succeeded</h4>
                        <p className="text-xs text-emerald-500/90 mt-1">
                          API Client successfully retrieved a 2xx response from the target backend.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-start space-x-3">
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-rose-400">Request Failed</h4>
                        <p className="text-xs text-rose-500/90 mt-1">
                          API Client caught an error. Friendly message:
                        </p>
                        <div className="mt-2 text-xs text-rose-200 bg-rose-950/70 p-2.5 rounded-lg border border-rose-900/50 font-medium">
                          {api.getFriendlyMessage(new ApiError(errorDetails?.message || '', errorDetails?.status, { errors: errorDetails?.errors }))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Breakdown (If Error) */}
                  {status === 'error' && errorDetails && (
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-indigo-400 flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>Centralized Error Classification</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                          <span className="text-[10px] text-slate-500 block">Classified Type</span>
                          <span className="font-bold text-slate-300">{errorDetails.type}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                          <span className="text-[10px] text-slate-500 block">HTTP Status Code</span>
                          <span className="font-bold text-slate-300">{errorDetails.status ?? 'Network / Offline'}</span>
                        </div>
                      </div>

                      {/* Validation Field Details */}
                      {errorDetails.errors && errorDetails.errors.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Parsed Field Violations</span>
                          <div className="space-y-1.5">
                            {errorDetails.errors.map((err, idx) => (
                              <div key={idx} className="flex justify-between bg-rose-950/15 border border-rose-950 px-3 py-1.5 rounded-lg text-xs">
                                <span className="font-mono text-rose-300 font-bold">{err.field}</span>
                                <span className="text-slate-400">{err.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payload Response */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Response Data (JSON)</span>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl overflow-x-auto max-h-[300px]">
                      <pre className="text-[11px] font-mono text-indigo-300 leading-relaxed">
                        {responsePayload ? JSON.stringify(responsePayload, null, 2) : 'No response payload (empty/void response)'}
                      </pre>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Diagnostic Footer Info */}
            <div className="bg-slate-950 border-t border-slate-850 p-4 text-[10px] text-slate-500 flex justify-between">
              <span>NicheLink Phase 1 Diagnostics</span>
              <span>Central Error Handling v1.0</span>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};
