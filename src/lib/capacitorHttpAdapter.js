// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - CAPACITOR NATIVE HTTP ADAPTER FOR AXIOS
// ═══════════════════════════════════════════════════════════════════════════
// Problem: On real Android devices, Capacitor's global XHR/fetch patching
// (CapacitorHttp.enabled = true) doesn't always work reliably. The WebView
// may still enforce CORS or fail silently, causing "Network Error" in Axios.
//
// Solution: This custom Axios adapter calls CapacitorHttp.request() DIRECTLY
// from @capacitor/core. This uses the native Android HTTP client (OkHttp)
// which has ZERO CORS restrictions. The adapter:
// - Only activates on Capacitor native platforms (Android/iOS)
// - Falls back to default Axios adapter on web
// - Preserves full Axios interceptor chain (runs AFTER interceptors)
// - Handles non-2xx responses correctly (triggers Axios error interceptors)
// ═══════════════════════════════════════════════════════════════════════════

import { Capacitor, CapacitorHttp } from '@capacitor/core';

/**
 * Detect if running on Capacitor native platform (Android/iOS).
 */
function isCapacitorNative() {
  try {
    if (typeof Capacitor !== 'undefined' && typeof Capacitor.isNativePlatform === 'function') {
      return Capacitor.isNativePlatform();
    }
  } catch {
    // Not on Capacitor
  }
  // Fallback: check window.Capacitor
  try {
    if (window?.Capacitor?.isNativePlatform?.()) return true;
  } catch {
    // noop
  }
  return false;
}

/**
 * Build full URL from Axios config (baseURL + url + params).
 */
function buildFullUrl(config) {
  let url = config.url || '';
  const baseURL = config.baseURL || '';

  // If url is relative, prepend baseURL
  if (url && !/^https?:\/\//i.test(url)) {
    // Ensure no double slashes
    if (baseURL.endsWith('/') && url.startsWith('/')) {
      url = baseURL + url.slice(1);
    } else if (!baseURL.endsWith('/') && !url.startsWith('/')) {
      url = baseURL + '/' + url;
    } else {
      url = baseURL + url;
    }
  }

  // Append query params
  if (config.params && typeof config.params === 'object') {
    const entries = Object.entries(config.params).filter(
      ([, v]) => v !== undefined && v !== null
    );
    if (entries.length > 0) {
      const qs = entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  return url;
}

/**
 * Create an Axios-compatible error from a native error or non-2xx response.
 */
function createAxiosError(message, config, response, code) {
  const error = new Error(message);
  error.config = config;
  error.isAxiosError = true;
  error.code = code || 'ERR_BAD_RESPONSE';
  error.response = response || undefined;
  error.toJSON = function () {
    return {
      message: this.message,
      name: this.name,
      code: this.code,
      status: this.response?.status,
    };
  };
  return error;
}

/**
 * The custom Axios adapter that routes requests through Capacitor's
 * native HTTP client (OkHttp on Android, NSURLSession on iOS).
 *
 * Axios adapter contract:
 * - Receives the final config (after all request interceptors)
 * - Must return a Promise<AxiosResponse> for success
 * - Must reject with an Axios-compatible error for failures
 */
async function capacitorHttpAdapter(config) {
  const fullUrl = buildFullUrl(config);
  const method = (config.method || 'GET').toUpperCase();

  // Build headers — clone to avoid mutation
  const headers = {};
  if (config.headers) {
    // Axios 1.x uses AxiosHeaders class; iterate properly
    if (typeof config.headers.toJSON === 'function') {
      Object.assign(headers, config.headers.toJSON());
    } else if (typeof config.headers.forEach === 'function') {
      config.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, config.headers);
    }
  }
  // Remove internal Axios headers that shouldn't be sent
  delete headers['common'];
  delete headers['delete'];
  delete headers['get'];
  delete headers['head'];
  delete headers['post'];
  delete headers['put'];
  delete headers['patch'];

  // Prepare request body
  let data = config.data;
  // CapacitorHttp expects `data` as a plain object for JSON requests
  if (typeof data === 'string' && headers['Content-Type']?.includes('application/json')) {
    try {
      data = JSON.parse(data);
    } catch {
      // Keep as string if not valid JSON
    }
  }

  const requestOptions = {
    url: fullUrl,
    method: method,
    headers: headers,
    readTimeout: config.timeout || 30000,
    connectTimeout: config.timeout || 30000,
  };

  // Only add data for methods that support a body
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && data !== undefined) {
    requestOptions.data = data;
  }

  console.log(`[CapacitorHTTP] ${method} ${fullUrl}`);

  try {
    const nativeResponse = await CapacitorHttp.request(requestOptions);

    // Build Axios-compatible response object
    const axiosResponse = {
      data: nativeResponse.data,
      status: nativeResponse.status,
      statusText: nativeResponse.status >= 200 && nativeResponse.status < 300 ? 'OK' : 'Error',
      headers: nativeResponse.headers || {},
      config: config,
      request: { _isNative: true },
    };

    // Check validateStatus (Axios default: 200-299 are valid)
    const validateStatus = config.validateStatus || ((status) => status >= 200 && status < 300);
    if (!validateStatus(nativeResponse.status)) {
      console.warn(`[CapacitorHTTP] ${method} ${fullUrl} → ${nativeResponse.status}`);
      throw createAxiosError(
        `Request failed with status code ${nativeResponse.status}`,
        config,
        axiosResponse,
        nativeResponse.status >= 400 && nativeResponse.status < 500 ? 'ERR_BAD_REQUEST' : 'ERR_BAD_RESPONSE'
      );
    }

    console.log(`[CapacitorHTTP] ${method} ${fullUrl} → ${nativeResponse.status} OK`);
    return axiosResponse;
  } catch (error) {
    // If it's already an Axios error (from validateStatus check above), re-throw
    if (error.isAxiosError) {
      throw error;
    }

    // Native network error (DNS, SSL, timeout, connection refused, etc.)
    console.error(`[CapacitorHTTP] ${method} ${fullUrl} → NATIVE ERROR:`, error?.message || error);
    throw createAxiosError(
      error?.message || 'Network Error',
      config,
      undefined,
      'ERR_NETWORK'
    );
  }
}

/**
 * Returns the native adapter if on Capacitor, or undefined (use Axios default) on web.
 */
export function getCapacitorAdapter() {
  if (isCapacitorNative()) {
    console.log('[CapacitorHTTP] Native platform detected — using Capacitor HTTP adapter for Axios');
    return capacitorHttpAdapter;
  }
  console.log('[CapacitorHTTP] Web platform — using default Axios adapter');
  return undefined;
}

export default capacitorHttpAdapter;
