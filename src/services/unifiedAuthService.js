/**
 * UNIFIED LOGIN SERVICE
 * ═══════════════════════════════════════════════════════════════
 * Service for unified authentication across all roles
 * Uses the new /api/auth/unified-login endpoint
 * 
 * Features:
 * - Single login for all roles (student/parent/staff/admin)
 * - Auto role detection
 * - Organization context validation
 * - JWT with full tenant context
 * 
 * Created: February 10, 2026
 * ═══════════════════════════════════════════════════════════════
 */

import axios from 'axios';
import { getApiBaseUrl } from '@/utils/platform';

// Platform-aware API URL (Capacitor uses full Railway URL, web uses relative or localhost)
const API_URL = getApiBaseUrl();

/**
 * Unified Login
 * @param {object} credentials - Login credentials
 * @param {string} credentials.identifier - Email, mobile, enrollment_id, or username
 * @param {string} credentials.password - User password
 * @param {string} credentials.organization_slug - Organization subdomain
 * @param {string} [credentials.role_hint] - Optional role hint for faster lookup
 * @returns {Promise<object>} Login response with token and user data
 */
export const unifiedLogin = async (credentials) => {
    try {
        console.log('[Unified Login] Attempting login:', {
            identifier: credentials.identifier,
            organization: credentials.organization_slug
        });
        
        const response = await axios.post(
            `${API_URL}/api/auth/unified-login`,
            credentials,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.success) {
            console.log('[Unified Login] Success:', response.data.user.role);
            
            // Store token
            const token = response.data.token;
            localStorage.setItem('token', token);
            localStorage.setItem('supabase-auth-token', token); // For compatibility
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Store context
            localStorage.setItem('context', JSON.stringify(response.data.context));
            
            return {
                success: true,
                user: response.data.user,
                token: response.data.token,
                context: response.data.context
            };
        } else {
            throw new Error(response.data.message || 'Login failed');
        }
        
    } catch (error) {
        console.error('[Unified Login] Error:', error);
        
        // Extract error message
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Login failed';
        
        return {
            success: false,
            error: errorMessage
        };
    }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

/**
 * Get stored user data
 * @returns {object|null} User object or null
 */
export const getStoredUser = () => {
    try {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
        console.error('[Auth] Error parsing stored user:', error);
        return null;
    }
};

/**
 * Get stored context (org/branch/session)
 * @returns {object|null} Context object or null
 */
export const getStoredContext = () => {
    try {
        const contextJson = localStorage.getItem('context');
        return contextJson ? JSON.parse(contextJson) : null;
    } catch (error) {
        console.error('[Auth] Error parsing stored context:', error);
        return null;
    }
};

/**
 * Logout user
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('supabase-auth-token');
    localStorage.removeItem('user');
    localStorage.removeItem('context');
    
    // Redirect to login
    window.location.href = '/login';
};

/**
 * Get auth token
 * @returns {string|null} JWT token or null
 */
export const getToken = () => {
    return localStorage.getItem('token');
};

/**
 * Set auth token in axios default headers
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);
    } else {
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
    }
};

// Set token on module load if exists
const existingToken = getToken();
if (existingToken) {
    setAuthToken(existingToken);
}

export default {
    unifiedLogin,
    isAuthenticated,
    getStoredUser,
    getStoredContext,
    logout,
    getToken,
    setAuthToken
};
