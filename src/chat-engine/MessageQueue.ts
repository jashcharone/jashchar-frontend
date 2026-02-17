// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - OFFLINE MESSAGE QUEUE
// Persists messages for offline-first capability
// ═══════════════════════════════════════════════════════════════════════════

import type { Message } from './types';

const DB_NAME = 'jashchar_chat';
const DB_VERSION = 1;
const STORE_NAME = 'pending_messages';

/**
 * MessageQueue - IndexedDB-based offline message queue
 */
export class MessageQueue {
  private db: IDBDatabase | null = null;
  private userId: string | null = null;

  /**
   * Initialize the queue for a user
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`${DB_NAME}_${userId}`, DB_VERSION);

      request.onerror = () => {
        console.error('[MessageQueue] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[MessageQueue] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'client_id' });
          store.createIndex('conversation_id', 'conversation_id', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
          console.log('[MessageQueue] Object store created');
        }
      };
    });
  }

  /**
   * Add a message to the queue
   */
  async enqueue(message: Message): Promise<void> {
    if (!this.db) {
      throw new Error('MessageQueue not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        ...message,
        queued_at: new Date().toISOString()
      });

      request.onsuccess = () => {
        console.log('[MessageQueue] Message queued:', message.client_id);
        resolve();
      };

      request.onerror = () => {
        console.error('[MessageQueue] Failed to queue message:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove a message from the queue
   */
  async remove(clientId: string): Promise<void> {
    if (!this.db) {
      throw new Error('MessageQueue not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(clientId);

      request.onsuccess = () => {
        console.log('[MessageQueue] Message removed:', clientId);
        resolve();
      };

      request.onerror = () => {
        console.error('[MessageQueue] Failed to remove message:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all queued messages
   */
  async getAll(): Promise<Message[]> {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('created_at');
      
      const request = index.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('[MessageQueue] Failed to get messages:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get queued messages for a specific conversation
   */
  async getByConversation(conversationId: string): Promise<Message[]> {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('conversation_id');
      
      const request = index.getAll(conversationId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('[MessageQueue] Failed to get messages:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get count of queued messages
   */
  async getCount(): Promise<number> {
    if (!this.db) {
      return 0;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all queued messages
   */
  async clear(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[MessageQueue] Queue cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('[MessageQueue] Failed to clear queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
