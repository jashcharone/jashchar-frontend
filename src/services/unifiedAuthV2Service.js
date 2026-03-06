/**
 * UNIFIED AUTH V2 SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Future-proof Authentication Service - 100 Years Plan
 * 
 * Primary Auth: Mobile Number + OTP / Face Scan
 * Backup Auth: 6-Digit PIN
 * 
 * API Version: v2
 * Base Path: /api/v2/auth
 * 
 * Created: March 5, 2026
 * Architecture: 100 Years Future Plan
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { getApiBaseUrl } from '@/utils/platform';

const _apiBase = getApiBaseUrl();
const BASE_URL = _apiBase ? `${_apiBase}/api/v2/auth` : '/api/v2/auth';

console.log('[Auth V2 Service] Resolved baseURL:', BASE_URL);

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get stored session token
 */
const getSessionToken = () => {
    return localStorage.getItem('v2_session_token');
};

/**
 * Store session data
 */
const storeSession = (data) => {
    if (data.token) {
        localStorage.setItem('v2_session_token', data.token);
    }
    if (data.user) {
        localStorage.setItem('v2_user', JSON.stringify(data.user));
    }
    if (data.roles) {
        localStorage.setItem('v2_roles', JSON.stringify(data.roles));
    }
};

/**
 * Clear session data
 */
const clearSession = () => {
    localStorage.removeItem('v2_session_token');
    localStorage.removeItem('v2_user');
    localStorage.removeItem('v2_roles');
    localStorage.removeItem('v2_selected_role');
};

/**
 * Get device info for trusted device tracking
 */
const getDeviceInfo = () => {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        deviceName: `${navigator.platform} - ${navigator.userAgent.split(' ').slice(-1)[0]}`
    };
};

/**
 * Make API request with error handling
 */
const apiRequest = async (endpoint, method = 'GET', body = null, requiresAuth = false) => {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (requiresAuth) {
            const token = getSessionToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                headers['X-Session-Token'] = token;
            }
        }
        
        const options = {
            method,
            headers
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error(`[Auth V2] ${endpoint} Error:`, error.message);
        throw error;
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// OTP AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Request OTP for mobile number
 * 
 * @param {string} mobile - Mobile number (10 digits or with +91)
 * @param {string} purpose - 'login' | 'register' | 'reset_pin' | 'face_reset'
 * @param {string} channel - 'sms' | 'whatsapp' (default: whatsapp)
 * @returns {Promise<object>} { success, message, expiresAt, canResendAt, isNewUser }
 */
export const sendOTP = async (mobile, purpose = 'login', channel = null) => {
    console.log('[Auth V2] Sending OTP to:', mobile.substring(0, 6) + '***');
    
    const data = await apiRequest('/send-otp', 'POST', {
        mobile,
        purpose,
        channel
    });
    
    return data;
};

/**
 * Verify OTP and login/register
 * 
 * @param {string} mobile - Mobile number
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<object>} { success, user, token, roles, isNewUser, requiresProfile }
 */
export const verifyOTP = async (mobile, otp) => {
    console.log('[Auth V2] Verifying OTP for:', mobile.substring(0, 6) + '***');
    
    const deviceInfo = getDeviceInfo();
    
    const data = await apiRequest('/verify-otp', 'POST', {
        mobile,
        otp,
        ...deviceInfo
    });
    
    if (data.success) {
        storeSession(data);
    }
    
    return data;
};

// ══════════════════════════════════════════════════════════════════════════════
// FACE BIOMETRIC AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Register face biometric
 * 
 * @param {array|string} faceDescriptor - Face embedding vector
 * @param {object} options - { quality, livenessScore }
 * @returns {Promise<object>} { success, message, faceId }
 */
export const registerFace = async (faceDescriptor, options = {}) => {
    console.log('[Auth V2] Registering face biometric');
    
    const data = await apiRequest('/register-face', 'POST', {
        faceDescriptor: typeof faceDescriptor === 'string' 
            ? faceDescriptor 
            : JSON.stringify(faceDescriptor),
        quality: options.quality,
        livenessScore: options.livenessScore
    }, true);
    
    return data;
};

/**
 * Login with face recognition
 * 
 * @param {array|string} faceDescriptor - Face embedding vector
 * @returns {Promise<object>} { success, user, token, roles, matchScore }
 */
export const loginWithFace = async (faceDescriptor) => {
    console.log('[Auth V2] Attempting face login');
    
    const deviceInfo = getDeviceInfo();
    
    const data = await apiRequest('/login-face', 'POST', {
        faceDescriptor: typeof faceDescriptor === 'string' 
            ? faceDescriptor 
            : JSON.stringify(faceDescriptor),
        ...deviceInfo
    });
    
    if (data.success) {
        storeSession(data);
    }
    
    return data;
};

// ══════════════════════════════════════════════════════════════════════════════
// PIN AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Set 6-digit PIN
 * 
 * @param {string} pin - 6-digit PIN
 * @returns {Promise<object>} { success, message }
 */
export const setPin = async (pin) => {
    console.log('[Auth V2] Setting PIN');
    
    const data = await apiRequest('/set-pin', 'POST', { pin }, true);
    
    return data;
};

/**
 * Login with mobile and PIN
 * 
 * @param {string} mobile - Mobile number
 * @param {string} pin - 6-digit PIN
 * @returns {Promise<object>} { success, user, token, roles }
 */
export const loginWithPin = async (mobile, pin) => {
    console.log('[Auth V2] Attempting PIN login');
    
    const deviceInfo = getDeviceInfo();
    
    const data = await apiRequest('/login-pin', 'POST', {
        mobile,
        pin,
        ...deviceInfo
    });
    
    if (data.success) {
        storeSession(data);
    }
    
    return data;
};

// ══════════════════════════════════════════════════════════════════════════════
// ROLE MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get current user's roles
 * 
 * @returns {Promise<object>} { success, roles }
 */
export const getRoles = async () => {
    const data = await apiRequest('/roles', 'GET', null, true);
    
    if (data.success && data.roles) {
        localStorage.setItem('v2_roles', JSON.stringify(data.roles));
    }
    
    return data;
};

/**
 * Get stored roles from localStorage
 * 
 * @returns {array} Roles array
 */
export const getStoredRoles = () => {
    try {
        return JSON.parse(localStorage.getItem('v2_roles') || '[]');
    } catch {
        return [];
    }
};

/**
 * Select active role
 * 
 * @param {object} role - Selected role object
 */
export const selectRole = (role) => {
    localStorage.setItem('v2_selected_role', JSON.stringify(role));
    
    // Also set context for compatibility with existing app
    if (role.organization_id) {
        localStorage.setItem('selectedOrganizationId', role.organization_id);
    }
    if (role.branch_id) {
        localStorage.setItem('selectedBranchId', role.branch_id);
    }
};

/**
 * Get selected role
 * 
 * @returns {object|null} Selected role or null
 */
export const getSelectedRole = () => {
    try {
        return JSON.parse(localStorage.getItem('v2_selected_role'));
    } catch {
        return null;
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Validate current session
 * 
 * @returns {Promise<object>} { success, user, roles, session }
 */
export const validateSession = async () => {
    const token = getSessionToken();
    if (!token) {
        return { success: false, error: 'No session token' };
    }
    
    try {
        const data = await apiRequest('/session', 'GET', null, true);
        
        if (data.success) {
            storeSession(data);
        }
        
        return data;
    } catch (error) {
        clearSession();
        return { success: false, error: error.message };
    }
};

/**
 * Logout current session
 * 
 * @returns {Promise<object>} { success, message }
 */
export const logout = async () => {
    try {
        await apiRequest('/logout', 'POST', null, true);
    } catch (error) {
        console.warn('[Auth V2] Logout API error (still clearing local session):', error.message);
    }
    
    clearSession();
    return { success: true };
};

/**
 * Logout all sessions
 * 
 * @returns {Promise<object>} { success, message }
 */
export const logoutAll = async () => {
    const data = await apiRequest('/logout-all', 'POST', null, true);
    
    clearSession();
    return data;
};

/**
 * Check if user is authenticated
 * 
 * @returns {boolean}
 */
export const isAuthenticated = () => {
    return !!getSessionToken();
};

/**
 * Get current user
 * 
 * @returns {object|null}
 */
export const getCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem('v2_user'));
    } catch {
        return null;
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// TRUSTED DEVICES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get trusted devices
 * 
 * @returns {Promise<object>} { success, devices }
 */
export const getTrustedDevices = async () => {
    return await apiRequest('/devices', 'GET', null, true);
};

/**
 * Remove trusted device
 * 
 * @param {string} deviceId - Device ID to remove
 * @returns {Promise<object>} { success, message }
 */
export const removeTrustedDevice = async (deviceId) => {
    return await apiRequest(`/devices/${deviceId}`, 'DELETE', null, true);
};

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Update user profile
 * 
 * @param {object} profileData - { fullName, email, dateOfBirth, profilePhotoUrl, address, alternateMobile }
 * @returns {Promise<object>} { success, message }
 */
export const updateProfile = async (profileData) => {
    return await apiRequest('/profile', 'PUT', profileData, true);
};

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Check API health
 * 
 * @returns {Promise<object>} Health status
 */
export const healthCheck = async () => {
    return await apiRequest('/health', 'GET');
};

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT OBJECT
// ══════════════════════════════════════════════════════════════════════════════

export default {
    // OTP
    sendOTP,
    verifyOTP,
    
    // Face
    registerFace,
    loginWithFace,
    
    // PIN
    setPin,
    loginWithPin,
    
    // Roles
    getRoles,
    getStoredRoles,
    selectRole,
    getSelectedRole,
    
    // Session
    validateSession,
    logout,
    logoutAll,
    isAuthenticated,
    getCurrentUser,
    
    // Devices
    getTrustedDevices,
    removeTrustedDevice,
    
    // Profile
    updateProfile,
    
    // Health
    healthCheck
};
