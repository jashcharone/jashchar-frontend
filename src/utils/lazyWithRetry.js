/**
 * Lazy load with retry mechanism
 * Handles "Failed to fetch dynamically imported module" errors
 * by retrying the import and optionally forcing a page reload
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Creates a lazy component with automatic retry on chunk load failure
 * @param {Function} componentImport - The import function, e.g., () => import('./MyComponent')
 * @param {string} componentName - Name for logging purposes
 * @returns {React.LazyExoticComponent}
 */
export function lazyWithRetry(componentImport, componentName = 'Component') {
    return React.lazy(() => retryImport(componentImport, componentName));
}

/**
 * Retry import with exponential backoff
 * @param {Function} componentImport - The import function
 * @param {string} componentName - Name for logging
 * @param {number} retries - Current retry count
 * @returns {Promise}
 */
async function retryImport(componentImport, componentName, retries = 0) {
    try {
        return await componentImport();
    } catch (error) {
        const isChunkLoadError = 
            error.message?.includes('Failed to fetch dynamically imported module') ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('Loading CSS chunk') ||
            error.name === 'ChunkLoadError';

        if (isChunkLoadError && retries < MAX_RETRIES) {
            console.warn(`[LazyRetry] Retry ${retries + 1}/${MAX_RETRIES} for ${componentName}`);
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
            
            // Retry the import
            return retryImport(componentImport, componentName, retries + 1);
        }

        // If all retries failed, check if we should force reload
        if (isChunkLoadError) {
            console.error(`[LazyRetry] All retries failed for ${componentName}. Triggering page reload...`);
            
            // Store flag to prevent infinite reload loop
            const reloadKey = `chunk_reload_${componentName}`;
            const hasReloaded = sessionStorage.getItem(reloadKey);
            
            if (!hasReloaded) {
                sessionStorage.setItem(reloadKey, 'true');
                // Force cache-busting reload
                window.location.reload();
                // Return a never-resolving promise to prevent render during reload
                return new Promise(() => {});
            } else {
                // Already tried reload, show error to user
                sessionStorage.removeItem(reloadKey);
                console.error(`[LazyRetry] Page already reloaded. Showing error.`);
            }
        }

        // Re-throw the error for error boundary to catch
        throw error;
    }
}

/**
 * React import for lazy
 */
import React from 'react';

export default lazyWithRetry;
