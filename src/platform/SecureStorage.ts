// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - SECURE STORAGE
// Cross-platform storage with encryption on native
// ═══════════════════════════════════════════════════════════════════════════

import { Preferences } from '@capacitor/preferences';
import { platformService } from './index';

/**
 * Storage keys used in the app
 */
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKENS: 'auth_tokens',
  AUTH_SESSION: 'auth_session',
  USER_PROFILE: 'user_profile',
  
  // Tenant/Organization
  CURRENT_ORGANIZATION: 'current_organization',
  CURRENT_BRANCH: 'current_branch',
  CURRENT_SESSION: 'current_session',
  
  // Branding
  TENANT_BRANDING: 'tenant_branding',
  
  // Chat
  CHAT_DRAFT: 'chat_draft_',
  CHAT_CACHE: 'chat_cache',
  
  // App State
  APP_SETTINGS: 'app_settings',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  LAST_SYNC: 'last_sync',
  
  // Offline
  OFFLINE_QUEUE: 'offline_queue',
  CACHED_DATA: 'cached_data'
} as const;

/**
 * Secure storage service
 * Uses Capacitor Preferences for native (encrypted on device)
 * Uses localStorage for web (with optional encryption)
 */
class SecureStorageService {
  private prefix = 'jashchar_';
  private encryptionKey: string | null = null;

  /**
   * Initialize storage with optional encryption
   */
  async initialize(encryptionKey?: string): Promise<void> {
    this.encryptionKey = encryptionKey || null;
    console.log('[SecureStorage] Initialized');
  }

  /**
   * Store a value
   */
  async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    const finalValue = this.encryptionKey 
      ? this.encrypt(serialized) 
      : serialized;

    if (platformService.isNative) {
      await Preferences.set({
        key: this.prefix + key,
        value: finalValue
      });
    } else {
      try {
        localStorage.setItem(this.prefix + key, finalValue);
      } catch (e) {
        // Handle quota exceeded
        console.error('[SecureStorage] Storage quota exceeded:', e);
        await this.cleanup();
        localStorage.setItem(this.prefix + key, finalValue);
      }
    }
  }

  /**
   * Retrieve a value
   */
  async get<T>(key: string): Promise<T | null> {
    let value: string | null = null;

    if (platformService.isNative) {
      const result = await Preferences.get({ key: this.prefix + key });
      value = result.value;
    } else {
      value = localStorage.getItem(this.prefix + key);
    }

    if (!value) return null;

    try {
      const decrypted = this.encryptionKey 
        ? this.decrypt(value) 
        : value;
      return JSON.parse(decrypted) as T;
    } catch (e) {
      console.error('[SecureStorage] Failed to parse value:', e);
      return null;
    }
  }

  /**
   * Remove a value
   */
  async remove(key: string): Promise<void> {
    if (platformService.isNative) {
      await Preferences.remove({ key: this.prefix + key });
    } else {
      localStorage.removeItem(this.prefix + key);
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    if (platformService.isNative) {
      const result = await Preferences.keys();
      return result.keys
        .filter(k => k.startsWith(this.prefix))
        .map(k => k.replace(this.prefix, ''));
    } else {
      return Object.keys(localStorage)
        .filter(k => k.startsWith(this.prefix))
        .map(k => k.replace(this.prefix, ''));
    }
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    if (platformService.isNative) {
      // Only clear prefixed keys
      const allKeys = await this.keys();
      for (const key of allKeys) {
        await this.remove(key);
      }
    } else {
      const keys = await this.keys();
      keys.forEach(k => localStorage.removeItem(this.prefix + k));
    }
    console.log('[SecureStorage] Cleared all data');
  }

  /**
   * Clear auth-related data only
   */
  async clearAuth(): Promise<void> {
    const authKeys = [
      STORAGE_KEYS.AUTH_TOKENS,
      STORAGE_KEYS.AUTH_SESSION,
      STORAGE_KEYS.USER_PROFILE
    ];
    
    for (const key of authKeys) {
      await this.remove(key);
    }
  }

  /**
   * Get storage size (approximate)
   */
  async getSize(): Promise<number> {
    const keys = await this.keys();
    let totalSize = 0;

    for (const key of keys) {
      const value = await this.get(key);
      if (value) {
        totalSize += JSON.stringify(value).length;
      }
    }

    return totalSize;
  }

  /**
   * Cleanup old data to free space
   */
  async cleanup(): Promise<void> {
    // Remove old cache data
    const cacheKeys = (await this.keys()).filter(k => 
      k.startsWith('cache_') || k.startsWith('temp_')
    );
    
    for (const key of cacheKeys) {
      await this.remove(key);
    }
    
    console.log('[SecureStorage] Cleaned up old data');
  }

  /**
   * Simple encryption (for web localStorage)
   * Note: For production, use a proper encryption library
   */
  private encrypt(data: string): string {
    if (!this.encryptionKey) return data;
    // Simple XOR encryption - Replace with proper encryption in production
    return btoa(
      data
        .split('')
        .map((char, i) => 
          String.fromCharCode(
            char.charCodeAt(0) ^ this.encryptionKey!.charCodeAt(i % this.encryptionKey!.length)
          )
        )
        .join('')
    );
  }

  /**
   * Simple decryption
   */
  private decrypt(data: string): string {
    if (!this.encryptionKey) return data;
    const decoded = atob(data);
    return decoded
      .split('')
      .map((char, i) => 
        String.fromCharCode(
          char.charCodeAt(0) ^ this.encryptionKey!.charCodeAt(i % this.encryptionKey!.length)
        )
      )
      .join('');
  }
}

export const secureStorage = new SecureStorageService();
