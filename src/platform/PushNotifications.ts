// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - PUSH NOTIFICATIONS
// Cross-platform push notification handling
// ═══════════════════════════════════════════════════════════════════════════

import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { platformService } from './index';
import { secureStorage, STORAGE_KEYS } from './SecureStorage';

type NotificationHandler = (notification: PushNotificationSchema) => void;
type NotificationActionHandler = (action: ActionPerformed) => void;

/**
 * Push notification service
 */
class PushNotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;
  private notificationHandlers: NotificationHandler[] = [];
  private actionHandlers: NotificationActionHandler[] = [];

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (platformService.isNative) {
      await this.initializeNative();
    } else {
      await this.initializeWeb();
    }

    this.isInitialized = true;
    console.log('[PushNotifications] Initialized');
  }

  /**
   * Initialize native push notifications
   */
  private async initializeNative(): Promise<void> {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[PushNotifications] Permission not granted');
      return;
    }

    // Register for push
    await PushNotifications.register();

    // Listen for registration
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('[PushNotifications] Token:', token.value);
      this.fcmToken = token.value;
      await this.saveToken(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[PushNotifications] Registration error:', error);
    });

    // Handle foreground notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushNotifications] Received:', notification);
      this.notificationHandlers.forEach(handler => handler(notification));
      
      // Show local notification when app is in foreground
      this.showLocalNotification({
        title: notification.title || 'Jashchar ERP',
        body: notification.body || '',
        data: notification.data
      });
    });

    // Handle notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[PushNotifications] Action:', action);
      this.actionHandlers.forEach(handler => handler(action));
    });

    // Initialize local notifications for foreground display
    await LocalNotifications.requestPermissions();
  }

  /**
   * Initialize web push notifications
   */
  private async initializeWeb(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('[PushNotifications] Not supported in browser');
      return;
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      // Register service worker for web push
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log('[PushNotifications] Service worker ready');
        } catch (e) {
          console.error('[PushNotifications] Service worker error:', e);
        }
      }
    }
  }

  /**
   * Save FCM token to backend
   */
  private async saveToken(token: string): Promise<void> {
    // Store locally
    await secureStorage.set('fcm_token', token);

    // TODO: Send to backend
    // await api.post('/push/register', { token, platform: platformService.platform });
  }

  /**
   * Get FCM token
   */
  async getToken(): Promise<string | null> {
    if (this.fcmToken) return this.fcmToken;
    return await secureStorage.get<string>('fcm_token');
  }

  /**
   * Show local notification
   */
  async showLocalNotification(options: {
    title: string;
    body: string;
    data?: any;
    channelId?: string;
    sound?: string;
  }): Promise<void> {
    if (platformService.isNative) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: options.title,
            body: options.body,
            extra: options.data,
            channelId: options.channelId,
            sound: options.sound
          }
        ]
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: '/icons/icon-192x192.png',
        data: options.data
      });
    }
  }

  /**
   * Create notification channel (Android)
   */
  async createChannel(options: {
    id: string;
    name: string;
    description: string;
    importance?: number;
    sound?: string;
  }): Promise<void> {
    if (!platformService.isAndroid) return;

    await LocalNotifications.createChannel({
      id: options.id,
      name: options.name,
      description: options.description,
      importance: options.importance || 4,
      sound: options.sound
    });
  }

  /**
   * Register notification handler
   */
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.push(handler);
    return () => {
      const index = this.notificationHandlers.indexOf(handler);
      if (index > -1) {
        this.notificationHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register notification action handler
   */
  onNotificationAction(handler: NotificationActionHandler): () => void {
    this.actionHandlers.push(handler);
    return () => {
      const index = this.actionHandlers.indexOf(handler);
      if (index > -1) {
        this.actionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Get delivered notifications
   */
  async getDelivered(): Promise<any[]> {
    if (!platformService.isNative) return [];
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  }

  /**
   * Remove all delivered notifications
   */
  async clearAll(): Promise<void> {
    if (platformService.isNative) {
      await PushNotifications.removeAllDeliveredNotifications();
    }
  }
}

export const pushNotifications = new PushNotificationService();
