// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - CAPACITOR APP LIFECYCLE
// Handles app state, back button, deep links, and native events
// ═══════════════════════════════════════════════════════════════════════════

import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { platformService } from './index';

type BackButtonHandler = () => boolean | Promise<boolean>;
type DeepLinkHandler = (url: string) => void;
type AppStateHandler = (isActive: boolean) => void;

/**
 * Manages Capacitor App lifecycle
 */
class CapacitorAppManager {
  private backButtonHandlers: BackButtonHandler[] = [];
  private deepLinkHandlers: DeepLinkHandler[] = [];
  private appStateHandlers: AppStateHandler[] = [];
  private isInitialized = false;

  /**
   * Initialize app lifecycle listeners
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !platformService.isNative) return;

    // Back Button Handler (Android)
    App.addListener('backButton', async ({ canGoBack }) => {
      // Try custom handlers first (in reverse order)
      for (let i = this.backButtonHandlers.length - 1; i >= 0; i--) {
        const handled = await this.backButtonHandlers[i]();
        if (handled) return;
      }

      // Default behavior: go back or exit
      if (canGoBack) {
        window.history.back();
      } else {
        // Ask if user wants to exit
        const shouldExit = await this.confirmExit();
        if (shouldExit) {
          App.exitApp();
        }
      }
    });

    // App State (foreground/background)
    App.addListener('appStateChange', ({ isActive }) => {
      console.log(`[App] State changed: ${isActive ? 'foreground' : 'background'}`);
      this.appStateHandlers.forEach(handler => handler(isActive));
    });

    // Deep Links
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      console.log('[App] Deep link opened:', event.url);
      this.handleDeepLink(event.url);
    });

    // Check for initial deep link
    const appLaunchUrl = await App.getLaunchUrl();
    if (appLaunchUrl?.url) {
      this.handleDeepLink(appLaunchUrl.url);
    }

    this.isInitialized = true;
    console.log('[CapacitorApp] Initialized');
  }

  /**
   * Handle deep link URL
   */
  private handleDeepLink(url: string): void {
    // Parse the URL
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    const params = Object.fromEntries(parsedUrl.searchParams);

    console.log('[DeepLink] Path:', path, 'Params:', params);

    // Route based on path
    // Examples:
    // jashchar://chat/123 -> Open chat with ID 123
    // jashchar://student/456 -> Open student profile
    // jashchar://fee/pay?amount=1000 -> Open fee payment

    this.deepLinkHandlers.forEach(handler => handler(url));
  }

  /**
   * Confirm exit dialog
   */
  private async confirmExit(): Promise<boolean> {
    return new Promise((resolve) => {
      // Use native confirm or custom dialog
      const result = window.confirm('Do you want to exit the app?');
      resolve(result);
    });
  }

  /**
   * Register back button handler
   * Returns unregister function
   */
  onBackButton(handler: BackButtonHandler): () => void {
    this.backButtonHandlers.push(handler);
    return () => {
      const index = this.backButtonHandlers.indexOf(handler);
      if (index > -1) {
        this.backButtonHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register deep link handler
   */
  onDeepLink(handler: DeepLinkHandler): () => void {
    this.deepLinkHandlers.push(handler);
    return () => {
      const index = this.deepLinkHandlers.indexOf(handler);
      if (index > -1) {
        this.deepLinkHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register app state handler
   */
  onAppStateChange(handler: AppStateHandler): () => void {
    this.appStateHandlers.push(handler);
    return () => {
      const index = this.appStateHandlers.indexOf(handler);
      if (index > -1) {
        this.appStateHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Get app info
   */
  async getInfo(): Promise<any> {
    if (!platformService.isNative) {
      return {
        name: 'Jashchar ERP',
        id: 'com.jashchar.erp',
        version: '1.0.0',
        build: '1'
      };
    }
    return App.getInfo();
  }

  /**
   * Get app state
   */
  async getState(): Promise<{ isActive: boolean }> {
    if (!platformService.isNative) {
      return { isActive: !document.hidden };
    }
    return App.getState();
  }

  /**
   * Minimize app (Android only)
   */
  async minimize(): Promise<void> {
    if (platformService.isAndroid) {
      await App.minimizeApp();
    }
  }

  /**
   * Exit app
   */
  async exit(): Promise<void> {
    if (platformService.isNative) {
      await App.exitApp();
    }
  }
}

export const capacitorApp = new CapacitorAppManager();
