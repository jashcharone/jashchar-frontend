// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - CHAT ENGINE INDEX
// Public exports for the chat module
// ═══════════════════════════════════════════════════════════════════════════

// Core engine
export { chatEngine } from './ChatEngine';

// Services
export { ConversationService } from './ConversationService';
export { MessageService } from './MessageService';
export { MessageQueue } from './MessageQueue';

// React Hooks
export {
  useChatEngine,
  useConversations,
  useConversation,
  useUnreadCount,
  usePresence,
  useCreateConversation
} from './hooks';

// Types
export type {
  Message,
  Conversation,
  ConversationWithDetails,
  ConversationType,
  MessageType,
  MessageStatus,
  Participant,
  ParticipantRole,
  UserInfo,
  UserPresence,
  PresenceStatus,
  MediaAttachment,
  SendMessageParams,
  CreateConversationParams,
  TypingEvent,
  MessageReceipt,
  ConversationSettings,
  ChatEvents
} from './types';
