// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - CHAT ENGINE TYPES
// TypeScript interfaces for the chat system
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Message types supported
 */
export type MessageType = 
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice_note'
  | 'document'
  | 'location'
  | 'contact'
  | 'sticker'
  | 'poll'
  | 'system';

/**
 * Conversation types
 */
export type ConversationType = 
  | 'direct'
  | 'group'
  | 'class_group'
  | 'staff_group'
  | 'pta_group'
  | 'broadcast'
  | 'support';

/**
 * Message status
 */
export type MessageStatus = 
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

/**
 * Participant role
 */
export type ParticipantRole = 
  | 'owner'
  | 'admin'
  | 'member'
  | 'viewer';

/**
 * User presence status
 */
export type PresenceStatus = 
  | 'online'
  | 'away'
  | 'busy'
  | 'offline';

/**
 * Media attachment
 */
export interface MediaAttachment {
  url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Message entity
 */
export interface Message {
  id: string;
  organization_id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: string | null;
  content_preview?: string;
  media?: MediaAttachment | null;
  reply_to_id?: string | null;
  thread_root_id?: string | null;
  thread_reply_count?: number;
  mentions?: string[];
  metadata?: Record<string, any>;
  status: MessageStatus;
  is_edited?: boolean;
  edited_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  deleted_for?: string[];
  created_at: string;
  updated_at?: string;
  client_id?: string | null;
  
  // Joined data
  sender?: UserInfo;
  reply_to?: Message | null;
}

/**
 * Conversation entity
 */
export interface Conversation {
  id: string;
  organization_id: string;
  branch_id: string;
  type: ConversationType;
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  class_id?: string | null;
  section_id?: string | null;
  session_id?: string | null;
  settings?: ConversationSettings;
  created_by: string;
  last_message_at?: string | null;
  message_count?: number;
  created_at: string;
  updated_at: string;
  is_archived?: boolean;
}

/**
 * Conversation settings
 */
export interface ConversationSettings {
  mute_notifications?: boolean;
  only_admins_can_send?: boolean;
  only_admins_can_add_members?: boolean;
  disappearing_messages_duration?: number | null;
  locked?: boolean;
  archived?: boolean;
}

/**
 * Conversation with extra details for listing
 */
export interface ConversationWithDetails extends Conversation {
  lastMessage?: Message | null;
  participants?: Participant[];
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  // For direct chats, the other user
  otherUser?: UserInfo | null;
}

/**
 * Participant entity
 */
export interface Participant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  user_type?: string;
  display_name?: string;
  nickname?: string | null;
  muted_until?: string | null;
  pinned?: boolean;
  last_read_at?: string | null;
  last_read_message_id?: string | null;
  unread_count?: number;
  is_active: boolean;
  joined_at: string;
  left_at?: string | null;
  
  // Joined data
  user?: UserInfo;
}

/**
 * User info (for display)
 */
export interface UserInfo {
  id: string;
  email?: string;
  full_name: string;
  avatar_url?: string | null;
  user_type?: string;
}

/**
 * User presence
 */
export interface UserPresence {
  user_id: string;
  status: PresenceStatus;
  status_message?: string | null;
  last_seen_at: string;
  typing_in_conversation?: string | null;
}

/**
 * Message receipt
 */
export interface MessageReceipt {
  id: string;
  message_id: string;
  user_id: string;
  delivered_at?: string | null;
  read_at?: string | null;
}

/**
 * Send message parameters
 */
export interface SendMessageParams {
  conversationId: string;
  content: string;
  type?: MessageType;
  replyToId?: string;
  media?: MediaAttachment;
  mentions?: string[];
}

/**
 * Create conversation parameters
 */
export interface CreateConversationParams {
  type: ConversationType;
  name?: string;
  description?: string;
  participantIds: string[];
  classId?: string;
  sectionId?: string;
}

/**
 * Typing indicator event
 */
export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

/**
 * Chat event types
 */
export interface ChatEvents {
  'chat:message:new': Message;
  'chat:message:optimistic': Partial<Message>;
  'chat:message:confirmed': { clientId: string; message: Message };
  'chat:message:failed': { clientId: string; error: Error };
  'chat:message:updated': Message;
  'chat:conversation:joined': { conversationId: string };
  'chat:typing': TypingEvent;
  'chat:presence:sync': Record<string, any>;
  'chat:presence:join': { userId: string; presences: any[] };
  'chat:presence:leave': { userId: string; presences: any[] };
  'chat:unread:update': { conversationId: string; increment?: boolean };
  'chat:unread:cleared': { conversationId: string };
}
