// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - CONVERSATION SERVICE
// API layer for conversation operations
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase';
import type { 
  Conversation, 
  ConversationWithDetails, 
  Participant,
  CreateConversationParams,
  ConversationType 
} from './types';

/**
 * ConversationService - Handles all conversation CRUD operations
 */
export class ConversationService {
  private organizationId: string;
  private branchId: string;
  private userId: string;

  constructor(organizationId: string, branchId: string, userId: string) {
    this.organizationId = organizationId;
    this.branchId = branchId;
    this.userId = userId;
  }

  /**
   * Get all conversations for current user
   */
  async getConversations(options?: {
    type?: ConversationType;
    limit?: number;
    offset?: number;
  }): Promise<ConversationWithDetails[]> {
    const { type, limit = 50, offset = 0 } = options || {};

    // Get conversations where user is a participant
    let query = supabase
      .from('chat_participants')
      .select(`
        conversation_id,
        pinned,
        muted_until,
        unread_count,
        conversation:chat_conversations!inner (
          *,
          last_message:chat_messages(
            id,
            content,
            content_preview,
            type,
            sender_id,
            created_at,
            sender:auth.users(id, email, raw_user_meta_data)
          )
        )
      `)
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .order('conversation(last_message_at)', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('conversation.type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ConversationService] Failed to get conversations:', error);
      throw error;
    }

    // Transform and enrich data
    const conversations = await Promise.all(
      (data || []).map(async (item: any) => {
        const conv = item.conversation as Conversation;
        
        // For direct chats, get the other user
        let otherUser = null;
        if (conv.type === 'direct') {
          const { data: participants } = await supabase
            .from('chat_participants')
            .select(`
              user_id,
              user:auth.users(id, email, raw_user_meta_data)
            `)
            .eq('conversation_id', conv.id)
            .neq('user_id', this.userId)
            .single();
          
          if (participants?.user) {
            const user = participants.user as any;
            otherUser = {
              id: user.id,
              email: user.email,
              full_name: user.raw_user_meta_data?.full_name || user.email,
              avatar_url: user.raw_user_meta_data?.avatar_url
            };
          }
        }

        // Get last message
        const lastMessage = conv.last_message?.[0] || null;

        return {
          ...conv,
          lastMessage,
          unreadCount: item.unread_count || 0,
          isPinned: item.pinned || false,
          isMuted: item.muted_until ? new Date(item.muted_until) > new Date() : false,
          otherUser
        } as ConversationWithDetails;
      })
    );

    return conversations;
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(conversationId: string): Promise<ConversationWithDetails | null> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error || !data) {
      return null;
    }

    // Get participant info for current user
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('pinned, muted_until, unread_count')
      .eq('conversation_id', conversationId)
      .eq('user_id', this.userId)
      .single();

    // Get all participants
    const { data: participants } = await supabase
      .from('chat_participants')
      .select(`
        *,
        user:auth.users(id, email, raw_user_meta_data)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_active', true);

    // For direct chats, get other user
    let otherUser = null;
    if (data.type === 'direct' && participants) {
      const other = participants.find((p: any) => p.user_id !== this.userId);
      if (other?.user) {
        const user = other.user as any;
        otherUser = {
          id: user.id,
          email: user.email,
          full_name: user.raw_user_meta_data?.full_name || user.email,
          avatar_url: user.raw_user_meta_data?.avatar_url
        };
      }
    }

    return {
      ...data,
      participants: participants?.map((p: any) => ({
        ...p,
        user: p.user ? {
          id: p.user.id,
          email: p.user.email,
          full_name: p.user.raw_user_meta_data?.full_name || p.user.email,
          avatar_url: p.user.raw_user_meta_data?.avatar_url
        } : undefined
      })),
      unreadCount: participant?.unread_count || 0,
      isPinned: participant?.pinned || false,
      isMuted: participant?.muted_until ? new Date(participant.muted_until) > new Date() : false,
      otherUser
    } as ConversationWithDetails;
  }

  /**
   * Create a new conversation
   */
  async createConversation(params: CreateConversationParams): Promise<Conversation> {
    const { type, name, description, participantIds, classId, sectionId } = params;

    // For direct chats, check if conversation already exists
    if (type === 'direct' && participantIds.length === 1) {
      const { data: existing } = await supabase.rpc('find_direct_conversation', {
        user_id_1: this.userId,
        user_id_2: participantIds[0]
      });

      if (existing?.[0]?.conversation_id) {
        const conv = await this.getConversation(existing[0].conversation_id);
        if (conv) return conv;
      }
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .insert({
        organization_id: this.organizationId,
        branch_id: this.branchId,
        type,
        name: type !== 'direct' ? name : null,
        description,
        class_id: classId,
        section_id: sectionId,
        created_by: this.userId
      })
      .select()
      .single();

    if (convError) {
      console.error('[ConversationService] Failed to create conversation:', convError);
      throw convError;
    }

    // Add participants
    const participantRecords = [
      {
        conversation_id: conversation.id,
        user_id: this.userId,
        role: 'owner' as const
      },
      ...participantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
        role: type === 'broadcast' ? 'viewer' as const : 'member' as const
      }))
    ];

    const { error: partError } = await supabase
      .from('chat_participants')
      .insert(participantRecords);

    if (partError) {
      console.error('[ConversationService] Failed to add participants:', partError);
      // Rollback conversation
      await supabase.from('chat_conversations').delete().eq('id', conversation.id);
      throw partError;
    }

    return conversation;
  }

  /**
   * Start a direct conversation
   */
  async startDirectChat(otherUserId: string): Promise<Conversation> {
    return this.createConversation({
      type: 'direct',
      participantIds: [otherUserId]
    });
  }

  /**
   * Create a group chat
   */
  async createGroup(
    name: string, 
    participantIds: string[], 
    description?: string
  ): Promise<Conversation> {
    return this.createConversation({
      type: 'group',
      name,
      description,
      participantIds
    });
  }

  /**
   * Add participants to a conversation
   */
  async addParticipants(conversationId: string, userIds: string[]): Promise<void> {
    const records = userIds.map(userId => ({
      conversation_id: conversationId,
      user_id: userId,
      role: 'member' as const
    }));

    const { error } = await supabase
      .from('chat_participants')
      .upsert(records, { onConflict: 'conversation_id,user_id' });

    if (error) {
      console.error('[ConversationService] Failed to add participants:', error);
      throw error;
    }
  }

  /**
   * Remove a participant from a conversation
   */
  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_participants')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('[ConversationService] Failed to remove participant:', error);
      throw error;
    }
  }

  /**
   * Leave a conversation
   */
  async leaveConversation(conversationId: string): Promise<void> {
    return this.removeParticipant(conversationId, this.userId);
  }

  /**
   * Update conversation settings
   */
  async updateConversation(
    conversationId: string, 
    updates: Partial<Pick<Conversation, 'name' | 'description' | 'avatar_url' | 'settings'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('chat_conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('[ConversationService] Failed to update conversation:', error);
      throw error;
    }
  }

  /**
   * Pin/unpin a conversation
   */
  async togglePin(conversationId: string, pinned: boolean): Promise<void> {
    const { error } = await supabase
      .from('chat_participants')
      .update({ pinned })
      .eq('conversation_id', conversationId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('[ConversationService] Failed to toggle pin:', error);
      throw error;
    }
  }

  /**
   * Mute/unmute a conversation
   */
  async toggleMute(conversationId: string, muteDuration?: number): Promise<void> {
    const muted_until = muteDuration 
      ? new Date(Date.now() + muteDuration).toISOString()
      : null;

    const { error } = await supabase
      .from('chat_participants')
      .update({ muted_until })
      .eq('conversation_id', conversationId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('[ConversationService] Failed to toggle mute:', error);
      throw error;
    }
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ 
        is_archived: true, 
        archived_at: new Date().toISOString() 
      })
      .eq('id', conversationId);

    if (error) {
      console.error('[ConversationService] Failed to archive conversation:', error);
      throw error;
    }
  }

  /**
   * Get participants of a conversation
   */
  async getParticipants(conversationId: string): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('chat_participants')
      .select(`
        *,
        user:auth.users(id, email, raw_user_meta_data)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_active', true);

    if (error) {
      console.error('[ConversationService] Failed to get participants:', error);
      throw error;
    }

    return (data || []).map((p: any) => ({
      ...p,
      user: p.user ? {
        id: p.user.id,
        email: p.user.email,
        full_name: p.user.raw_user_meta_data?.full_name || p.user.email,
        avatar_url: p.user.raw_user_meta_data?.avatar_url
      } : undefined
    }));
  }
}
