// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - PLATFORM DETECTION & CAPACITOR BRIDGE
// Abstracts platform differences for seamless cross-platform development
// ═══════════════════════════════════════════════════════════════════════════

import { Capacitor } from '@capacitor/core';

/**
 * Platform types supported by the app
 */
export type Platform = 'web' | 'android' | 'ios' | 'electron';

/**
 * Platform detection and utilities
 */
class PlatformService {
  private _platform: Platform;
  private _isNative: boolean;
  private _deviceInfo: any = null;

  constructor() {
    this._platform = this.detectPlatform();
    this._isNative = Capacitor.isNativePlatform();
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): Platform {
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      if (platform === 'android') return 'android';
      if (platform === 'ios') return 'ios';
    }
    
    // Check for Electron
    if (typeof window !== 'undefined' && (window as any).electron) {
      return 'electron';
    }
    
    return 'web';
  }

  /**
   * Get current platform
   */
  get platform(): Platform {
    return this._platform;
  }

  /**
   * Check if running on native platform (Android/iOS)
   */
  get isNative(): boolean {
    return this._isNative;
  }

  /**
   * Check if running on web/PWA
   */
  get isWeb(): boolean {
    return this._platform === 'web';
  }

  /**
   * Check if running on Android
   */
  get isAndroid(): boolean {
    return this._platform === 'android';
  }

  /**
   * Check if running on iOS
   */
  get isIOS(): boolean {
    return this._platform === 'ios';
  }

  /**
   * Check if device has notch (for safe area handling)
   */
  get hasNotch(): boolean {
    // iOS detection
    if (this.isIOS) {
      const screenHeight = window.screen.height;
      const screenWidth = window.screen.width;
      // iPhone X and later have these dimensions
      return (screenHeight >= 812 || screenWidth >= 812);
    }
    // Android - check for cutout
    if (this.isAndroid && window.screen.height > 800) {
      return true; // Assume modern Android phones have notch
    }
    return false;
  }

  /**
   * Get safe area insets (for notch handling)
   */
  getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
    if (!this.isNative) {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    // Use CSS env() if available
    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10),
      bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10),
      left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10),
      right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10)
    };
  }

  /**
   * Get device info (cached)
   */
  async getDeviceInfo(): Promise<any> {
    if (this._deviceInfo) return this._deviceInfo;

    if (this.isNative) {
      const { Device } = await import('@capacitor/device');
      this._deviceInfo = await Device.getInfo();
    } else {
      this._deviceInfo = {
        platform: 'web',
        operatingSystem: this.getOS(),
        isVirtual: false,
        model: 'Browser'
      };
    }

    return this._deviceInfo;
  }

  /**
   * Get OS for web platform
   */
  private getOS(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) return 'Windows';
    if (userAgent.includes('mac')) return 'macOS';
    if (userAgent.includes('linux')) return 'Linux';
    if (userAgent.includes('android')) return 'Android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Check if PWA is installed
   */
  isPWAInstalled(): boolean {
    if (this.isNative) return false;
    
    // Check display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    
    return isStandalone || isIOSStandalone;
  }

  /**
   * Check if device is tablet
   */
  isTablet(): boolean {
    const minTabletWidth = 768;
    return Math.min(window.screen.width, window.screen.height) >= minTabletWidth;
  }

  /**
   * Check if device is in landscape mode
   */
  isLandscape(): boolean {
    return window.innerWidth > window.innerHeight;
  }
}

export const platformService = new PlatformService();

// Export convenience methods
export const isNative = () => platformService.isNative;
export const isWeb = () => platformService.isWeb;
export const isAndroid = () => platformService.isAndroid;
export const isIOS = () => platformService.isIOS;
export const getPlatform = () => platformService.platform;
