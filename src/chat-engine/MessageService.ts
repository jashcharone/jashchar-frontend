// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - MESSAGE SERVICE
// API layer for message operations
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase';
import type { Message, MediaAttachment } from './types';

/**
 * MessageService - Handles message CRUD operations
 */
export class MessageService {
  private organizationId: string;
  private userId: string;

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    options?: {
      limit?: number;
      before?: string;  // Message ID or timestamp for pagination
      after?: string;
    }
  ): Promise<Message[]> {
    const { limit = 50, before, after } = options || {};

    let query = supabase
      .from('chat_messages')
      .select(`
        *,
        sender:auth.users(id, email, raw_user_meta_data),
        reply_to:chat_messages!reply_to_id(
          id,
          content,
          content_preview,
          type,
          sender_id,
          sender:auth.users(id, email, raw_user_meta_data)
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Pagination - load older messages
    if (before) {
      query = query.lt('created_at', before);
    }

    // Load newer messages
    if (after) {
      query = query.gt('created_at', after);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[MessageService] Failed to get messages:', error);
      throw error;
    }

    // Transform sender data and reverse for chronological order
    const messages = (data || []).map((msg: any) => ({
      ...msg,
      sender: msg.sender ? {
        id: msg.sender.id,
        email: msg.sender.email,
        full_name: msg.sender.raw_user_meta_data?.full_name || msg.sender.email,
        avatar_url: msg.sender.raw_user_meta_data?.avatar_url
      } : undefined,
      reply_to: msg.reply_to ? {
        ...msg.reply_to,
        sender: msg.reply_to.sender ? {
          id: msg.reply_to.sender.id,
          email: msg.reply_to.sender.email,
          full_name: msg.reply_to.sender.raw_user_meta_data?.full_name || msg.reply_to.sender.email,
          avatar_url: msg.reply_to.sender.raw_user_meta_data?.avatar_url
        } : undefined
      } : null
    })).reverse();

    return messages;
  }

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:auth.users(id, email, raw_user_meta_data)
      `)
      .eq('id', messageId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      sender: data.sender ? {
        id: data.sender.id,
        email: data.sender.email,
        full_name: data.sender.raw_user_meta_data?.full_name || data.sender.email,
        avatar_url: data.sender.raw_user_meta_data?.avatar_url
      } : undefined
    } as Message;
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<Message> {
    // Get original message
    const original = await this.getMessage(messageId);
    if (!original) {
      throw new Error('Message not found');
    }

    if (original.sender_id !== this.userId) {
      throw new Error('Cannot edit message from another user');
    }

    // Update edit history
    const editHistory = original.edit_history || [];
    editHistory.push({
      content: original.content,
      edited_at: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        content: newContent,
        content_preview: newContent.substring(0, 255),
        is_edited: true,
        edited_at: new Date().toISOString(),
        original_content: original.original_content || original.content,
        edit_history: editHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('[MessageService] Failed to edit message:', error);
      throw error;
    }

    return data as Message;
  }

  /**
   * Delete a message (for everyone)
   */
  async deleteMessage(messageId: string): Promise<void> {
    const message = await this.getMessage(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.sender_id !== this.userId) {
      throw new Error('Cannot delete message from another user');
    }

    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        content: null,
        content_preview: null,
        media: null
      })
      .eq('id', messageId);

    if (error) {
      console.error('[MessageService] Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * Delete a message for myself only
   */
  async deleteForMe(messageId: string): Promise<void> {
    const { data: message } = await supabase
      .from('chat_messages')
      .select('deleted_for')
      .eq('id', messageId)
      .single();

    if (!message) {
      throw new Error('Message not found');
    }

    const deletedFor = message.deleted_for || [];
    if (!deletedFor.includes(this.userId)) {
      deletedFor.push(this.userId);
    }

    const { error } = await supabase
      .from('chat_messages')
      .update({ deleted_for: deletedFor })
      .eq('id', messageId);

    if (error) {
      console.error('[MessageService] Failed to delete for me:', error);
      throw error;
    }
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(
    conversationId: string,
    query: string,
    limit: number = 20
  ): Promise<Message[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:auth.users(id, email, raw_user_meta_data)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .textSearch('search_vector', query)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[MessageService] Failed to search messages:', error);
      throw error;
    }

    return (data || []).map((msg: any) => ({
      ...msg,
      sender: msg.sender ? {
        id: msg.sender.id,
        email: msg.sender.email,
        full_name: msg.sender.raw_user_meta_data?.full_name || msg.sender.email,
        avatar_url: msg.sender.raw_user_meta_data?.avatar_url
      } : undefined
    }));
  }

  /**
   * Get thread replies for a message
   */
  async getThreadReplies(messageId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:auth.users(id, email, raw_user_meta_data)
      `)
      .eq('thread_root_id', messageId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[MessageService] Failed to get thread replies:', error);
      throw error;
    }

    return (data || []).map((msg: any) => ({
      ...msg,
      sender: msg.sender ? {
        id: msg.sender.id,
        email: msg.sender.email,
        full_name: msg.sender.raw_user_meta_data?.full_name || msg.sender.email,
        avatar_url: msg.sender.raw_user_meta_data?.avatar_url
      } : undefined
    }));
  }

  /**
   * Upload media attachment
   */
  async uploadMedia(
    file: File,
    conversationId: string
  ): Promise<MediaAttachment> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `chat/${this.organizationId}/${conversationId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[MessageService] Failed to upload media:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    // Create thumbnail for images
    let thumbnailUrl: string | undefined;
    if (file.type.startsWith('image/')) {
      // In production, use a cloud function to generate thumbnails
      thumbnailUrl = urlData.publicUrl;
    }

    // Record in database
    const { data: mediaRecord, error: dbError } = await supabase
      .from('chat_media')
      .insert({
        organization_id: this.organizationId,
        uploaded_by: this.userId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_bucket: 'chat-media',
        storage_path: filePath,
        url: urlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        processing_status: 'ready'
      })
      .select()
      .single();

    if (dbError) {
      console.error('[MessageService] Failed to record media:', dbError);
    }

    return {
      url: urlData.publicUrl,
      thumbnail_url: thumbnailUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type
    };
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<void> {
    const { error } = await supabase
      .from('chat_message_reactions')
      .upsert({
        message_id: messageId,
        user_id: this.userId,
        emoji
      });

    if (error) {
      console.error('[MessageService] Failed to add reaction:', error);
      throw error;
    }
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    const { error } = await supabase
      .from('chat_message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', this.userId)
      .eq('emoji', emoji);

    if (error) {
      console.error('[MessageService] Failed to remove reaction:', error);
      throw error;
    }
  }

  /**
   * Get reactions for a message
   */
  async getReactions(messageId: string): Promise<{ emoji: string; count: number; users: string[] }[]> {
    const { data, error } = await supabase
      .from('chat_message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    if (error) {
      console.error('[MessageService] Failed to get reactions:', error);
      throw error;
    }

    // Group by emoji
    const reactionMap = new Map<string, string[]>();
    for (const { emoji, user_id } of data || []) {
      if (!reactionMap.has(emoji)) {
        reactionMap.set(emoji, []);
      }
      reactionMap.get(emoji)!.push(user_id);
    }

    return Array.from(reactionMap.entries()).map(([emoji, users]) => ({
      emoji,
      count: users.length,
      users
    }));
  }

  /**
   * Forward a message to other conversations
   */
  async forwardMessage(
    messageId: string,
    targetConversationIds: string[]
  ): Promise<void> {
    const original = await this.getMessage(messageId);
    if (!original) {
      throw new Error('Message not found');
    }

    const forwardedMessages = targetConversationIds.map(convId => ({
      conversation_id: convId,
      sender_id: this.userId,
      organization_id: this.organizationId,
      type: original.type,
      content: original.content,
      media: original.media,
      metadata: {
        forwarded: true,
        forwarded_from: {
          message_id: original.id,
          conversation_id: original.conversation_id,
          sender_id: original.sender_id
        }
      },
      status: 'sent'
    }));

    const { error } = await supabase
      .from('chat_messages')
      .insert(forwardedMessages);

    if (error) {
      console.error('[MessageService] Failed to forward message:', error);
      throw error;
    }
  }
}
