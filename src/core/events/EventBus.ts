// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - EVENT BUS
// Global event emitter for cross-component communication
// ═══════════════════════════════════════════════════════════════════════════

type EventHandler = (data: any) => void;

/**
 * EventBus - Singleton event emitter
 */
export class EventBus {
  private static instance: EventBus | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   * @returns Unsubscribe function
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Subscribe to event once
   */
  once(event: string, handler: EventHandler): () => void {
    const wrapper = (data: any) => {
      this.off(event, wrapper);
      handler(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, data?: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${event}:`, err);
        }
      });
    }

    // Also emit to wildcard listeners
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler({ event, data });
        } catch (err) {
          console.error(`[EventBus] Error in wildcard handler:`, err);
        }
      });
    }
  }

  /**
   * Remove all handlers for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Get count of listeners for an event
   */
  listenerCount(event: string): number {
    return this.handlers.get(event)?.size || 0;
  }
}

// Export singleton accessor
export const eventBus = EventBus.getInstance();
