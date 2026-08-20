/**
 * API Client for NicheLink.
 * Centralizes all HTTP communication with the Express backend using Fetch.
 */

export type ApiErrorType =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'server_error'
  | 'network'
  | 'unknown';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status?: number;
  data?: any;
  type: ApiErrorType;
  errors?: ValidationErrorDetail[];

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;

    // Detect details and validation errors from standard backend response structure
    if (data && Array.isArray(data.errors)) {
      this.errors = data.errors;
    } else if (data && data.details) {
      if (Array.isArray(data.details)) {
        this.errors = data.details;
      } else if (typeof data.details === 'object') {
        this.errors = Object.keys(data.details).map((key) => ({
          field: key,
          message: String(data.details[key]),
        }));
      }
    }

    // Map HTTP Status to standard types
    if (status === 400 || status === 422) {
      this.type = 'validation';
    } else if (status === 401) {
      this.type = 'unauthorized';
    } else if (status === 403) {
      this.type = 'forbidden';
    } else if (status === 404) {
      this.type = 'not_found';
    } else if (status === 409) {
      this.type = 'conflict';
    } else if (status && status >= 500) {
      this.type = 'server_error';
    } else if (!status) {
      this.type = 'network';
    } else {
      this.type = 'unknown';
    }
  }
}

// 1. Resolve and Normalize Base URL from Environment Variables
const apiEnvUrl = ((import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api').trim();

// Strip trailing slash if present
const cleanUrl = apiEnvUrl.replace(/\/$/, '');

const REQUEST_TIMEOUT_MS = 30000;

// Ensure BASE_API_URL ends in /api
export const BASE_API_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

// Determine the root server URL (without /api) for ping/health checks
export const ROOT_SERVER_URL = BASE_API_URL.substring(0, BASE_API_URL.length - 4);

export const resolveMediaUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  if (value.startsWith('/')) return `${ROOT_SERVER_URL}${value}`;

  try {
    const parsed = new URL(value);
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${ROOT_SERVER_URL}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return value;
  }

  return value;
};

let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];
let authFailureCallback: (() => void) | null = null;

function subscribeTokenRefresh(resolve: (token: string) => void, reject: (error: Error) => void) {
  refreshSubscribers.push({ resolve, reject });
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(error: Error) {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
}

function getCsrfToken() {
  if (typeof document === 'undefined') return null;
  const cookieName = 'XSRF-TOKEN=';
  const cookie = document.cookie.split('; ').find((item) => item.startsWith(cookieName));
  return cookie ? decodeURIComponent(cookie.slice(cookieName.length)) : null;
}

/**
 * Perform a clean, centralized HTTP Request.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  useRawUrl = false
): Promise<T> {
  const method = options.method || 'GET';
  
  // Normalize URL - prepend BASE_API_URL or ROOT_SERVER_URL based on usage
  let url = '';
  if (useRawUrl) {
    url = path.startsWith('http') ? path : `${ROOT_SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  } else {
    // If path is a full URL, use it directly, otherwise build it
    url = path.startsWith('http') ? path : `${BASE_API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  // Construct Headers
  const headers = new Headers(options.headers || {});
  const csrfToken = getCsrfToken();
  if (csrfToken && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  
  // Automatically serialise body as JSON and set Content-Type header if applicable
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }

  // Automatically attach auth header if token is stored in localStorage
  const token = localStorage.getItem('nichelink_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const finalOptions: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials || 'include',
  };

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);
  finalOptions.signal = abortController.signal;

  try {
    const response = await fetch(url, finalOptions);
    
    // Parse response body (safely checking content-type)
    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // 401 Unauthorized handling for token expiration
      if (
        response.status === 401 &&
        !path.includes('/auth/refresh-token') &&
        !path.includes('/auth/login') &&
        !path.includes('/auth/register')
      ) {
        const refreshToken = localStorage.getItem('nichelink_refresh_token');
        if (refreshToken) {
          if (!isRefreshing) {
            isRefreshing = true;
            
            // Clean refresh call (avoiding interceptors recursively)
            const refreshUrl = `${BASE_API_URL}/auth/refresh-token`;
            fetch(refreshUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: refreshToken }),
            })
              .then(async (refreshRes) => {
                if (!refreshRes.ok) {
                  throw new Error('Refresh token rejected');
                }
                const refreshData = await refreshRes.json();
                const newAccessToken = refreshData.accessToken || refreshData.token;
                const newRefreshToken = refreshData.refreshToken;

                if (!newAccessToken) {
                  throw new Error('No access token returned');
                }

                localStorage.setItem('nichelink_token', newAccessToken);
                if (newRefreshToken) {
                  localStorage.setItem('nichelink_refresh_token', newRefreshToken);
                }
                
                isRefreshing = false;
                onRefreshed(newAccessToken);
              })
              .catch((err) => {
                console.error('Session refresh failed:', err);
                isRefreshing = false;
                localStorage.removeItem('nichelink_token');
                localStorage.removeItem('nichelink_refresh_token');
                localStorage.setItem('nichelink_auth', 'false');
                onRefreshFailed(new Error('Your session has expired. Please sign in again.'));
                authFailureCallback?.();
              });
          }

          // Return a Promise that will resolve with the retried request
          return new Promise<T>((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              const retryHeaders = new Headers(options.headers || {});
              retryHeaders.set('Authorization', `Bearer ${newToken}`);
              resolve(request<T>(path, { ...options, headers: retryHeaders }, useRawUrl));
            }, reject);
          });
        }
      }

      const message = (data && typeof data === 'object' && data.message) || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network errors or fetch configuration errors
    console.error('API request network error:', error);
    throw new ApiError(
      error.name === 'AbortError'
        ? 'The server took too long to respond. Please check that the backend is running and try again.'
        : error.message || 'Network error: Backend is unavailable or unreachable',
      undefined,
      error
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Expose HTTP verbs & convenience operations
 */
export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),
    
  post: <T>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'POST', body }),
    
  put: <T>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'PUT', body }),
    
  patch: <T>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
    
  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),

  onAuthFailure: (callback: () => void) => {
    authFailureCallback = callback;
  },

  /**
   * Safe backend connectivity check pointing to ROOT server health endpoint.
   */
  ping: async (customUrl?: string) => {
    // If a custom URL is provided, we normalize and test that directly
    if (customUrl) {
      const cleanCustom = customUrl.trim().replace(/\/$/, '');
      const testRoot = cleanCustom.endsWith('/api')
        ? cleanCustom.substring(0, cleanCustom.length - 4)
        : cleanCustom;
      return request<any>(`${testRoot}/health`, { method: 'GET' }, true).then(() => true);
    }
    return request<any>('/health', { method: 'GET' }, true);
  },

  /**
   * Helper to retrieve friendly message for a given error type.
   */
  getFriendlyMessage: (error: any): string => {
    if (error instanceof ApiError) {
      switch (error.type) {
        case 'validation':
          if (error.errors && error.errors.length > 0) {
            return `Validation failed: ${error.errors.map((e) => `${e.field} (${e.message})`).join(', ')}`;
          }
          return error.message || 'Invalid input data provided.';
        case 'unauthorized':
          return error.message || 'Your session has expired or you are unauthorized. Please log in again.';
        case 'forbidden':
          return 'Access denied. You do not have permission to view this resource.';
        case 'not_found':
          return 'The requested resource was not found on the server (404).';
        case 'conflict':
          return error.message || 'Conflict occurred. The resource already exists.';
        case 'server_error':
          return 'An internal server error occurred (500). Please try again later.';
        case 'network':
          return 'Unable to reach the server. Please check that the backend is running.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    }
    return String(error || 'An unexpected error occurred.');
  },
};
