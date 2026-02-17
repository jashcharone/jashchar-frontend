// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - NETWORK STATUS
// Cross-platform network connectivity monitoring
// ═══════════════════════════════════════════════════════════════════════════

import { Network, ConnectionStatus } from '@capacitor/network';
import { platformService } from './index';

type NetworkStatusHandler = (status: ConnectionStatus) => void;

/**
 * Network connectivity service
 */
class NetworkService {
  private isInitialized = false;
  private currentStatus: ConnectionStatus = { connected: true, connectionType: 'wifi' };
  private handlers: NetworkStatusHandler[] = [];

  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Get initial status
    this.currentStatus = await this.getStatus();

    if (platformService.isNative) {
      // Native: Use Capacitor Network
      Network.addListener('networkStatusChange', (status) => {
        console.log('[Network] Status changed:', status);
        this.currentStatus = status;
        this.notifyHandlers(status);
      });
    } else {
      // Web: Use navigator.onLine
      window.addEventListener('online', () => {
        this.currentStatus = { connected: true, connectionType: 'unknown' };
        this.notifyHandlers(this.currentStatus);
      });

      window.addEventListener('offline', () => {
        this.currentStatus = { connected: false, connectionType: 'none' };
        this.notifyHandlers(this.currentStatus);
      });
    }

    this.isInitialized = true;
    console.log('[Network] Initialized, status:', this.currentStatus);
  }

  /**
   * Get current network status
   */
  async getStatus(): Promise<ConnectionStatus> {
    if (platformService.isNative) {
      return await Network.getStatus();
    }
    return {
      connected: navigator.onLine,
      connectionType: navigator.onLine ? 'unknown' : 'none'
    };
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.currentStatus.connected;
  }

  /**
   * Check if on WiFi
   */
  get isWifi(): boolean {
    return this.currentStatus.connectionType === 'wifi';
  }

  /**
   * Check if on cellular
   */
  get isCellular(): boolean {
    return this.currentStatus.connectionType === 'cellular';
  }

  /**
   * Get connection type
   */
  get connectionType(): string {
    return this.currentStatus.connectionType;
  }

  /**
   * Register status change handler
   */
  onStatusChange(handler: NetworkStatusHandler): () => void {
    this.handlers.push(handler);
    // Immediately call with current status
    handler(this.currentStatus);
    
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all handlers
   */
  private notifyHandlers(status: ConnectionStatus): void {
    this.handlers.forEach(handler => handler(status));
  }

  /**
   * Wait for connection
   */
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    if (this.isConnected) return true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.onStatusChange((status) => {
        if (status.connected) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Check connection quality (ping-based)
   */
  async checkConnectionQuality(): Promise<'good' | 'poor' | 'offline'> {
    if (!this.isConnected) return 'offline';

    const startTime = Date.now();
    try {
      // Ping a fast endpoint
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      const latency = Date.now() - startTime;

      if (latency < 200) return 'good';
      return 'poor';
    } catch {
      return 'poor';
    }
  }
}

export const networkService = new NetworkService();
