// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - CHAT ENGINE REACT HOOKS
// React hooks for chat functionality
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatEngine } from './ChatEngine';
import { ConversationService } from './ConversationService';
import { MessageService } from './MessageService';
import { useAuth } from '@/hooks/useAuth';
import { useBranch } from '@/contexts/BranchContext';
import type { 
  Message, 
  ConversationWithDetails, 
  ConversationType,
  SendMessageParams,
  TypingEvent 
} from './types';

/**
 * Initialize and manage chat engine lifecycle
 */
export function useChatEngine() {
  const { user, organizationId } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id || !organizationId) {
      setIsInitialized(false);
      return;
    }

    let mounted = true;

    const init = async () => {
      try {
        await chatEngine.initialize(user.id, organizationId);
        if (mounted) {
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        console.error('[useChatEngine] Failed to initialize:', err);
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      chatEngine.cleanup();
    };
  }, [user?.id, organizationId]);

  return { isInitialized, error };
}

/**
 * Get list of conversations
 */
export function useConversations(options?: { type?: ConversationType }) {
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const serviceRef = useRef<ConversationService | null>(null);

  // Initialize service
  useEffect(() => {
    if (user?.id && organizationId && selectedBranch?.id) {
      serviceRef.current = new ConversationService(
        organizationId,
        selectedBranch.id,
        user.id
      );
    }
  }, [user?.id, organizationId, selectedBranch?.id]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      setIsLoading(true);
      const data = await serviceRef.current.getConversations(options);
      setConversations(data);
      setError(null);
    } catch (err) {
      console.error('[useConversations] Failed to fetch:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Listen for conversation updates
  useEffect(() => {
    const unsub1 = chatEngine.on('chat:message:new', (message: Message) => {
      setConversations(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(c => c.id === message.conversation_id);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            lastMessage: message,
            last_message_at: message.created_at
          };
          // Move to top
          const [conv] = updated.splice(idx, 1);
          updated.unshift(conv);
        }
        return updated;
      });
    });

    const unsub2 = chatEngine.on('chat:unread:update', ({ conversationId, increment }) => {
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, unreadCount: increment ? c.unreadCount + 1 : c.unreadCount }
          : c
      ));
    });

    const unsub3 = chatEngine.on('chat:unread:cleared', ({ conversationId }) => {
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ));
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  return { conversations, isLoading, error, refetch: fetchConversations };
}

/**
 * Single conversation with messages
 */
export function useConversation(conversationId: string | null) {
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());

  const convServiceRef = useRef<ConversationService | null>(null);
  const msgServiceRef = useRef<MessageService | null>(null);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize services
  useEffect(() => {
    if (user?.id && organizationId && selectedBranch?.id) {
      convServiceRef.current = new ConversationService(
        organizationId,
        selectedBranch.id,
        user.id
      );
      msgServiceRef.current = new MessageService(organizationId, user.id);
    }
  }, [user?.id, organizationId, selectedBranch?.id]);
  
  // Load conversation and messages
  useEffect(() => {
    if (!conversationId || !convServiceRef.current || !msgServiceRef.current) {
      setConversation(null);
      setMessages([]);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const [conv, msgs] = await Promise.all([
          convServiceRef.current!.getConversation(conversationId),
          msgServiceRef.current!.getMessages(conversationId)
        ]);
        setConversation(conv);
        setMessages(msgs);
        setHasMore(msgs.length >= 50);
      } catch (err) {
        console.error('[useConversation] Failed to load:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
    
    // Subscribe to realtime
    chatEngine.subscribeToConversation(conversationId);
  }, [conversationId]);

  // Listen for new messages
  useEffect(() => {
    if (!conversationId) return;

    const unsub1 = chatEngine.on('chat:message:new', (message: Message) => {
      if (message.conversation_id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });

    const unsub2 = chatEngine.on('chat:message:optimistic', (message: Partial<Message>) => {
      if (message.conversation_id === conversationId) {
        setMessages(prev => [...prev, message as Message]);
      }
    });

    const unsub3 = chatEngine.on('chat:message:confirmed', ({ clientId, message }) => {
      if (message.conversation_id === conversationId) {
        setMessages(prev => prev.map(m => 
          m.client_id === clientId ? message : m
        ));
      }
    });

    const unsub4 = chatEngine.on('chat:message:failed', ({ clientId }) => {
      setMessages(prev => prev.map(m => 
        m.client_id === clientId ? { ...m, status: 'failed' as const } : m
      ));
    });

    const unsub5 = chatEngine.on('chat:message:updated', (message: Message) => {
      if (message.conversation_id === conversationId) {
        setMessages(prev => prev.map(m => 
          m.id === message.id ? message : m
        ));
      }
    });

    // Typing indicators
    const unsub6 = chatEngine.on('chat:typing', ({ conversationId: convId, userId, isTyping }: TypingEvent) => {
      if (convId === conversationId && userId !== user?.id) {
        setTypingUsers(prev => {
          const next = new Map(prev);
          if (isTyping) {
            next.set(userId, true);
            // Clear after timeout
            const existingTimeout = typingTimeoutRef.current.get(userId);
            if (existingTimeout) clearTimeout(existingTimeout);
            typingTimeoutRef.current.set(userId, setTimeout(() => {
              setTypingUsers(p => {
                const n = new Map(p);
                n.delete(userId);
                return n;
              });
            }, 5000));
          } else {
            next.delete(userId);
          }
          return next;
        });
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      typingTimeoutRef.current.forEach(t => clearTimeout(t));
    };
  }, [conversationId, user?.id]);

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!conversationId || !msgServiceRef.current || messages.length === 0) return;

    try {
      const oldestMessage = messages[0];
      const older = await msgServiceRef.current.getMessages(conversationId, {
        before: oldestMessage.created_at
      });
      
      if (older.length < 50) {
        setHasMore(false);
      }
      
      setMessages(prev => [...older, ...prev]);
    } catch (err) {
      console.error('[useConversation] Failed to load more:', err);
    }
  }, [conversationId, messages]);

  // Send message
  const sendMessage = useCallback(async (params: Omit<SendMessageParams, 'conversationId'>) => {
    if (!conversationId) return;
    
    await chatEngine.sendMessage({
      ...params,
      conversationId
    });
  }, [conversationId]);

  // Set typing
  const setTyping = useCallback((isTyping: boolean) => {
    if (!conversationId) return;
    chatEngine.setTyping(conversationId, isTyping);
  }, [conversationId]);

  // Mark as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    await chatEngine.markAsRead(conversationId, lastMessage.id);
  }, [conversationId, messages]);

  return {
    conversation,
    messages,
    isLoading,
    hasMore,
    loadMore,
    sendMessage,
    setTyping,
    markAsRead,
    typingUsers: Array.from(typingUsers.keys())
  };
}

/**
 * Total unread message count (for badge)
 */
export function useUnreadCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Initial load
    chatEngine.getTotalUnreadCount().then(setCount);

    // Listen for updates
    const unsub1 = chatEngine.on('chat:unread:update', ({ increment }) => {
      if (increment) {
        setCount(prev => prev + 1);
      }
    });

    const unsub2 = chatEngine.on('chat:unread:cleared', () => {
      chatEngine.getTotalUnreadCount().then(setCount);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return count;
}

/**
 * User presence status
 */
export function usePresence(userIds: string[]) {
  const [presence, setPresence] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const handleSync = (state: Record<string, any[]>) => {
      const newPresence = new Map<string, string>();
      for (const [userId, presences] of Object.entries(state)) {
        if (userIds.includes(userId) && presences.length > 0) {
          newPresence.set(userId, 'online');
        }
      }
      setPresence(newPresence);
    };

    const handleJoin = ({ userId }: { userId: string }) => {
      if (userIds.includes(userId)) {
        setPresence(prev => new Map(prev).set(userId, 'online'));
      }
    };

    const handleLeave = ({ userId }: { userId: string }) => {
      if (userIds.includes(userId)) {
        setPresence(prev => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }
    };

    const unsub1 = chatEngine.on('chat:presence:sync', handleSync);
    const unsub2 = chatEngine.on('chat:presence:join', handleJoin);
    const unsub3 = chatEngine.on('chat:presence:leave', handleLeave);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [userIds]);

  const isOnline = useCallback((userId: string) => {
    return presence.get(userId) === 'online';
  }, [presence]);

  return { presence, isOnline };
}

/**
 * Create new conversation helpers
 */
export function useCreateConversation() {
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const [isCreating, setIsCreating] = useState(false);

  const serviceRef = useRef<ConversationService | null>(null);

  useEffect(() => {
    if (user?.id && organizationId && selectedBranch?.id) {
      serviceRef.current = new ConversationService(
        organizationId,
        selectedBranch.id,
        user.id
      );
    }
  }, [user?.id, organizationId, selectedBranch?.id]);

  const startDirectChat = useCallback(async (otherUserId: string) => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    setIsCreating(true);
    try {
      return await serviceRef.current.startDirectChat(otherUserId);
    } finally {
      setIsCreating(false);
    }
  }, []);

  const createGroup = useCallback(async (
    name: string, 
    participantIds: string[], 
    description?: string
  ) => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    setIsCreating(true);
    try {
      return await serviceRef.current.createGroup(name, participantIds, description);
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { startDirectChat, createGroup, isCreating };
}
