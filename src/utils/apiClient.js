/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * API CLIENT UTILITY
 * ═══════════════════════════════════════════════════════════════════════════════
 * Simple wrapper around axios for API calls
 * Used by academic analytics modules
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response wrapper for consistency
const handleResponse = (response) => {
    return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Success'
    };
};

// Error wrapper
const handleError = (error) => {
    console.error('API Error:', error);
    return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'API request failed'
    };
};

/**
 * GET request
 */
export const apiGet = async (url, config = {}) => {
    try {
        const response = await client.get(url, config);
        return handleResponse(response);
    } catch (error) {
        return handleError(error);
    }
};

/**
 * POST request
 */
export const apiPost = async (url, data = {}, config = {}) => {
    try {
        const response = await client.post(url, data, config);
        return handleResponse(response);
    } catch (error) {
        return handleError(error);
    }
};

/**
 * PATCH request
 */
export const apiPatch = async (url, data = {}, config = {}) => {
    try {
        const response = await client.patch(url, data, config);
        return handleResponse(response);
    } catch (error) {
        return handleError(error);
    }
};

/**
 * PUT request
 */
export const apiPut = async (url, data = {}, config = {}) => {
    try {
        const response = await client.put(url, data, config);
        return handleResponse(response);
    } catch (error) {
        return handleError(error);
    }
};

/**
 * DELETE request
 */
export const apiDelete = async (url, config = {}) => {
    try {
        const response = await client.delete(url, config);
        return handleResponse(response);
    } catch (error) {
        return handleError(error);
    }
};

export default client;
