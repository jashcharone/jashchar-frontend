// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - CHAT ENGINE CORE
// WhatsApp-class real-time communication system
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase';
import { EventBus } from '@/core/events/EventBus';
import { MessageQueue } from './MessageQueue';
import { networkService } from '@/platform/Network';
import type { 
  Message, 
  Conversation, 
  SendMessageParams,
  ConversationWithDetails 
} from './types';

/**
 * Main Chat Engine - Singleton
 * Manages all chat functionality
 */
class ChatEngine {
  private static instance: ChatEngine | null = null;
  private eventBus: EventBus;
  private messageQueue: MessageQueue;
  private subscriptions: Map<string, any> = new Map();
  private isInitialized = false;
  private userId: string | null = null;
  private organizationId: string | null = null;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.messageQueue = new MessageQueue();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ChatEngine {
    if (!ChatEngine.instance) {
      ChatEngine.instance = new ChatEngine();
    }
    return ChatEngine.instance;
  }

  /**
   * Initialize the chat engine
   */
  async initialize(userId: string, organizationId: string): Promise<void> {
    if (this.isInitialized && this.userId === userId) {
      console.log('[ChatEngine] Already initialized for this user');
      return;
    }

    console.log('[ChatEngine] Initializing...');
    
    this.userId = userId;
    this.organizationId = organizationId;

    // Initialize offline message queue
    await this.messageQueue.initialize(userId);

    // Subscribe to user's conversations
    await this.subscribeToUserConversations();

    // Subscribe to presence
    await this.subscribeToPresence();

    // Set user online
    await this.updatePresence('online');

    // Process any queued messages
    if (networkService.isConnected) {
      await this.processQueuedMessages();
    }

    // Listen for network changes
    networkService.onStatusChange(async (status) => {
      if (status.connected) {
        await this.processQueuedMessages();
      }
    });

    this.isInitialized = true;
    console.log('[ChatEngine] Initialized successfully');
  }

  /**
   * Subscribe to all user's conversations
   */
  private async subscribeToUserConversations(): Promise<void> {
    if (!this.userId) return;

    // Get user's conversations
    const { data: participants } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', this.userId)
      .eq('is_active', true);

    if (!participants) return;

    // Subscribe to each conversation
    for (const { conversation_id } of participants) {
      await this.subscribeToConversation(conversation_id);
    }

    // Subscribe to new conversation joins
    const participantChannel = supabase
      .channel(`user-conversations:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${this.userId}`
        },
        async (payload) => {
          const { conversation_id } = payload.new as any;
          await this.subscribeToConversation(conversation_id);
          this.eventBus.emit('chat:conversation:joined', { conversationId: conversation_id });
        }
      )
      .subscribe();

    this.subscriptions.set(`user-conversations:${this.userId}`, participantChannel);
  }

  /**
   * Subscribe to a specific conversation
   */
  async subscribeToConversation(conversationId: string): Promise<void> {
    const channelKey = `conversation:${conversationId}`;
    
    if (this.subscriptions.has(channelKey)) {
      return; // Already subscribed
    }

    const channel = supabase
      .channel(channelKey)
      // New messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          this.handleNewMessage(payload.new as Message);
        }
      )
      // Message updates (edits, deletes)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          this.handleMessageUpdate(payload.new as Message);
        }
      )
      // Typing indicators via broadcast
      .on('broadcast', { event: 'typing' }, (payload) => {
        this.eventBus.emit('chat:typing', {
          conversationId,
          ...payload.payload
        });
      })
      .subscribe();

    this.subscriptions.set(channelKey, channel);
    console.log(`[ChatEngine] Subscribed to conversation: ${conversationId}`);
  }

  /**
   * Subscribe to presence updates
   */
  private async subscribeToPresence(): Promise<void> {
    if (!this.userId) return;

    const channel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        this.eventBus.emit('chat:presence:sync', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.eventBus.emit('chat:presence:join', { userId: key, presences: newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.eventBus.emit('chat:presence:leave', { userId: key, presences: leftPresences });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: this.userId,
            online_at: new Date().toISOString()
          });
        }
      });

    this.subscriptions.set('presence', channel);
  }

  /**
   * Handle new incoming message
   */
  private handleNewMessage(message: Message): void {
    // Don't process our own messages (already handled optimistically)
    if (message.sender_id === this.userId && message.client_id) {
      this.eventBus.emit('chat:message:confirmed', {
        clientId: message.client_id,
        message
      });
      return;
    }

    this.eventBus.emit('chat:message:new', message);
    
    // Update badge
    this.eventBus.emit('chat:unread:update', {
      conversationId: message.conversation_id,
      increment: true
    });
  }

  /**
   * Handle message update
   */
  private handleMessageUpdate(message: Message): void {
    this.eventBus.emit('chat:message:updated', message);
  }

  /**
   * Send a message
   */
  async sendMessage(params: SendMessageParams): Promise<Message> {
    const { conversationId, content, type = 'text', replyToId, media } = params;

    if (!this.userId || !this.organizationId) {
      throw new Error('ChatEngine not initialized');
    }

    // Generate client ID for optimistic update
    const clientId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Create optimistic message
    const optimisticMessage: Partial<Message> = {
      id: clientId, // Temporary ID
      conversation_id: conversationId,
      sender_id: this.userId,
      organization_id: this.organizationId,
      type,
      content,
      reply_to_id: replyToId,
      media,
      status: 'pending',
      created_at: new Date().toISOString(),
      client_id: clientId
    };

    // Emit optimistic update for UI
    this.eventBus.emit('chat:message:optimistic', optimisticMessage);

    // Check network
    if (!networkService.isConnected) {
      // Queue for later
      await this.messageQueue.enqueue(optimisticMessage as Message);
      return optimisticMessage as Message;
    }

    try {
      // Send to server
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: this.userId,
          organization_id: this.organizationId,
          type,
          content,
          reply_to_id: replyToId,
          media,
          status: 'sent',
          client_id: clientId
        })
        .select()
        .single();

      if (error) throw error;

      // Emit confirmed (handled in handleNewMessage)
      return data as Message;

    } catch (error) {
      // Mark as failed
      this.eventBus.emit('chat:message:failed', { clientId, error });
      
      // Queue for retry
      await this.messageQueue.enqueue(optimisticMessage as Message);
      
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, lastMessageId: string): Promise<void> {
    if (!this.userId) return;

    try {
      await supabase.rpc('mark_messages_read', {
        p_conversation_id: conversationId,
        p_user_id: this.userId,
        p_last_message_id: lastMessageId
      });

      this.eventBus.emit('chat:unread:cleared', { conversationId });
    } catch (error) {
      console.error('[ChatEngine] Failed to mark as read:', error);
    }
  }

  /**
   * Update typing status
   */
  async setTyping(conversationId: string, isTyping: boolean): Promise<void> {
    const channel = this.subscriptions.get(`conversation:${conversationId}`);
    if (!channel) return;

    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: this.userId,
        isTyping,
        timestamp: Date.now()
      }
    });

    // Also update presence table
    if (this.userId) {
      await supabase
        .from('chat_user_presence')
        .upsert({
          user_id: this.userId,
          typing_in_conversation: isTyping ? conversationId : null,
          typing_started_at: isTyping ? new Date().toISOString() : null
        });
    }
  }

  /**
   * Update user presence
   */
  async updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): Promise<void> {
    if (!this.userId) return;

    await supabase
      .from('chat_user_presence')
      .upsert({
        user_id: this.userId,
        status,
        last_seen_at: new Date().toISOString()
      });
  }

  /**
   * Process queued messages
   */
  private async processQueuedMessages(): Promise<void> {
    const messages = await this.messageQueue.getAll();
    
    for (const message of messages) {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: message.conversation_id,
            sender_id: message.sender_id,
            organization_id: message.organization_id,
            type: message.type,
            content: message.content,
            reply_to_id: message.reply_to_id,
            media: message.media,
            status: 'sent',
            client_id: message.client_id
          });

        if (!error) {
          await this.messageQueue.remove(message.client_id!);
        }
      } catch (e) {
        console.error('[ChatEngine] Failed to send queued message:', e);
      }
    }
  }

  /**
   * Get total unread count
   */
  async getTotalUnreadCount(): Promise<number> {
    if (!this.userId) return 0;

    const { data } = await supabase.rpc('get_total_unread_count', {
      p_user_id: this.userId
    });

    return data || 0;
  }

  /**
   * Subscribe to events
   */
  on(event: string, handler: (data: any) => void): () => void {
    return this.eventBus.on(event, handler);
  }

  /**
   * Cleanup on logout
   */
  async cleanup(): Promise<void> {
    console.log('[ChatEngine] Cleaning up...');

    // Set offline
    await this.updatePresence('offline');

    // Unsubscribe from all channels
    for (const [key, channel] of this.subscriptions) {
      await channel.unsubscribe();
    }
    this.subscriptions.clear();

    this.isInitialized = false;
    this.userId = null;
    this.organizationId = null;

    console.log('[ChatEngine] Cleaned up');
  }
}

// Export singleton accessor
export const chatEngine = ChatEngine.getInstance();
