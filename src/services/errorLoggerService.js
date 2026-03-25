import axios from 'axios';
import { supabase } from '@/lib/customSupabaseClient';
import { getApiBaseUrl } from '@/utils/platform';

// Platform-aware API URL (Capacitor uses full Railway URL, web uses relative /api)
const _apiBase = getApiBaseUrl();
const API_URL = _apiBase ? `${_apiBase}/api` : '/api';

// Retry configuration for 429 errors
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

// Helper: Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Retry with exponential backoff
const retryWithBackoff = async (fn, retries = MAX_RETRIES, delay = INITIAL_DELAY) => {
    try {
        return await fn();
    } catch (error) {
        if (error.response?.status === 429 && retries > 0) {
            console.log(`[ErrorLogger] 429 received, retrying in ${delay}ms... (${retries} retries left)`);
            await sleep(delay);
            return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
        }
        throw error;
    }
};

// Debounce cache to prevent flooding the backend with the same error
const seenErrors = new Map();
const ERROR_DEBOUNCE_TIME = 60000; // 1 minute

export const errorLoggerService = {
    
    /**
     * Logs an error to the queries_finder_logs table via Backend API.
     */
    logError: async (error, errorInfo = {}, context = {}) => {
        try {
            const errorMessage = error.message || error.toString();
            
            // Debounce check
            const errorKey = `${errorMessage}-${context.module}-${window.location.href}`;
            const lastSeen = seenErrors.get(errorKey);
            if (lastSeen && Date.now() - lastSeen < ERROR_DEBOUNCE_TIME) {
                console.warn('[Queries Finder] Error suppressed (debounced):', errorMessage);
                return;
            }
            seenErrors.set(errorKey, Date.now());

            // Clean up old entries periodically (optional, but good for long sessions)
            if (seenErrors.size > 100) {
                const now = Date.now();
                for (const [key, time] of seenErrors.entries()) {
                    if (now - time > ERROR_DEBOUNCE_TIME) seenErrors.delete(key);
                }
            }

            const user = (await supabase.auth.getUser()).data.user;
            const userRole = user?.user_metadata?.role || 'guest';
            
            const stackTrace = error.stack || '';
            const componentStack = errorInfo.componentStack || '';

            const payload = {
                severity: context.severity || 'error',
                source: context.source || 'frontend',
                module_name: context.module || 'unknown',
                page_url: window.location.href,
                error_message: errorMessage,
                stack_trace: context.stack_trace || `${stackTrace}\n\nComponent Stack:\n${componentStack}`,
                user_id: user?.id,
                user_role: userRole,
                organization_id: context.organization_id || null,
                branch_id: context.branch_id || null,
                session_id: context.session_id || null,
                device_info: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language
                },
                metadata: context.metadata || context
            };

            // Send to Backend API with retry for 429 errors
            await retryWithBackoff(() => axios.post(`${API_URL}/queries-finder/log`, payload));
            console.log('[Queries Finder] Error logged to backend.');

        } catch (loggingError) {
            console.error('[Queries Finder] Failed to log error:', loggingError);
        }
    },

    /**
     * Fetches errors for the Master Admin dashboard
     */
    getErrors: async (filters = {}) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const params = new URLSearchParams();
            if (filters.status && filters.status !== 'All') params.append('status', filters.status);
            if (filters.severity && filters.severity !== 'All') params.append('severity', filters.severity);
            if (filters.search) params.append('search', filters.search);
            
            const response = await retryWithBackoff(() => axios.get(`${API_URL}/queries-finder/logs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            }));
            return response.data.data;
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            return [];
        }
    },

    /**
     * Fetches the logged-in user's own bug reports (for My Bug Reports page)
     */
    getMyReports: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await retryWithBackoff(() => axios.get(`${API_URL}/queries-finder/my-reports`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            }));
            return response.data.data || [];
        } catch (error) {
            console.error('Failed to fetch my reports:', error);
            return [];
        }
    },

    updateStatus: async (id, status) => {
        const { data: { session } } = await supabase.auth.getSession();
        await retryWithBackoff(() => axios.patch(`${API_URL}/queries-finder/logs/${id}/status`, { status }, {
            headers: { Authorization: `Bearer ${session?.access_token}` }
        }));
    },

    getSystemStatus: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await axios.get(`${API_URL}/queries-finder/status`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch system status', error);
            return { enabled: true };
        }
    },

    updateSystemStatus: async (enabled) => {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await axios.post(`${API_URL}/queries-finder/status`, { enabled }, {
            headers: { Authorization: `Bearer ${session?.access_token}` }
        });
        return response.data;
    }
};
