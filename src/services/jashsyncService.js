/**
 * JashSync API Service
 * ═══════════════════════════════════════════════════════════════════════════════
 * Frontend API integration for JashSync messaging platform
 * Complete API wrapper for all JashSync backend endpoints
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import api from './api';

// Base endpoint
const BASE_URL = '/api/jashsync';

/**
 * JashSync API Service
 */
const jashsyncService = {
    // ═══════════════════════════════════════════════════════════════════════════════
    // ACCESS & STATUS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Check if user has JashSync access
     */
    checkAccess: async () => {
        const response = await api.get(`${BASE_URL}/access`);
        return response.data;
    },
    
    /**
     * Get school JashSync status
     */
    getStatus: async () => {
        const response = await api.get(`${BASE_URL}/status`);
        return response.data;
    },
    
    /**
     * Get wallet balance and details
     */
    getWallet: async () => {
        const response = await api.get(`${BASE_URL}/wallet`);
        return response.data;
    },
    
    /**
     * Get pricing information
     */
    getPricing: async () => {
        const response = await api.get(`${BASE_URL}/pricing`);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // CONVERSATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Get all conversations
     * @param {Object} params - Query params (page, limit, search, filter)
     */
    getConversations: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/conversations`, { params });
        return response.data;
    },
    
    /**
     * Get single conversation by ID
     * @param {string} conversationId 
     */
    getConversation: async (conversationId) => {
        const response = await api.get(`${BASE_URL}/conversations/${conversationId}`);
        return response.data;
    },
    
    /**
     * Create new conversation
     * @param {Object} data - { participantIds, type, name? }
     */
    createConversation: async (data) => {
        const response = await api.post(`${BASE_URL}/conversations`, data);
        return response.data;
    },
    
    /**
     * Update conversation
     * @param {string} conversationId 
     * @param {Object} data - Update data
     */
    updateConversation: async (conversationId, data) => {
        const response = await api.put(`${BASE_URL}/conversations/${conversationId}`, data);
        return response.data;
    },
    
    /**
     * Delete conversation
     * @param {string} conversationId 
     */
    deleteConversation: async (conversationId) => {
        const response = await api.delete(`${BASE_URL}/conversations/${conversationId}`);
        return response.data;
    },
    
    /**
     * Archive conversation
     * @param {string} conversationId 
     */
    archiveConversation: async (conversationId) => {
        const response = await api.post(`${BASE_URL}/conversations/${conversationId}/archive`);
        return response.data;
    },
    
    /**
     * Pin conversation
     * @param {string} conversationId 
     */
    pinConversation: async (conversationId) => {
        const response = await api.post(`${BASE_URL}/conversations/${conversationId}/pin`);
        return response.data;
    },
    
    /**
     * Mute conversation
     * @param {string} conversationId 
     * @param {Object} options - { muteUntil? }
     */
    muteConversation: async (conversationId, options = {}) => {
        const response = await api.post(`${BASE_URL}/conversations/${conversationId}/mute`, options);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // MESSAGES
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Get messages for a conversation
     * @param {string} conversationId 
     * @param {Object} params - { page, limit, before, after }
     */
    getMessages: async (conversationId, params = {}) => {
        const response = await api.get(`${BASE_URL}/conversations/${conversationId}/messages`, { params });
        return response.data;
    },
    
    /**
     * Send message to conversation
     * @param {string} conversationId 
     * @param {Object} data - { content, type, attachments? }
     */
    sendMessage: async (conversationId, data) => {
        const response = await api.post(`${BASE_URL}/conversations/${conversationId}/messages`, data);
        return response.data;
    },
    
    /**
     * Edit message
     * @param {string} messageId 
     * @param {Object} data - { content }
     */
    editMessage: async (messageId, data) => {
        const response = await api.put(`${BASE_URL}/messages/${messageId}`, data);
        return response.data;
    },
    
    /**
     * Delete message
     * @param {string} messageId 
     */
    deleteMessage: async (messageId) => {
        const response = await api.delete(`${BASE_URL}/messages/${messageId}`);
        return response.data;
    },
    
    /**
     * Add reaction to message
     * @param {string} messageId 
     * @param {string} emoji 
     */
    addReaction: async (messageId, emoji) => {
        const response = await api.post(`${BASE_URL}/messages/${messageId}/react`, { emoji });
        return response.data;
    },
    
    /**
     * Remove reaction from message
     * @param {string} messageId 
     * @param {string} emoji 
     */
    removeReaction: async (messageId, emoji) => {
        const response = await api.delete(`${BASE_URL}/messages/${messageId}/react/${encodeURIComponent(emoji)}`);
        return response.data;
    },
    
    /**
     * Forward message
     * @param {string} messageId 
     * @param {Object} data - { toConversationIds }
     */
    forwardMessage: async (messageId, data) => {
        const response = await api.post(`${BASE_URL}/messages/${messageId}/forward`, data);
        return response.data;
    },
    
    /**
     * Mark conversation as read
     * @param {string} conversationId 
     */
    markAsRead: async (conversationId) => {
        const response = await api.post(`${BASE_URL}/conversations/${conversationId}/read`);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // CHANNELS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Get all channels
     * @param {Object} params - Query params
     */
    getChannels: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/channels`, { params });
        return response.data;
    },
    
    /**
     * Get single channel
     * @param {string} channelId 
     */
    getChannel: async (channelId) => {
        const response = await api.get(`${BASE_URL}/channels/${channelId}`);
        return response.data;
    },
    
    /**
     * Create channel
     * @param {Object} data - { name, description, type, memberIds? }
     */
    createChannel: async (data) => {
        const response = await api.post(`${BASE_URL}/channels`, data);
        return response.data;
    },
    
    /**
     * Update channel
     * @param {string} channelId 
     * @param {Object} data 
     */
    updateChannel: async (channelId, data) => {
        const response = await api.put(`${BASE_URL}/channels/${channelId}`, data);
        return response.data;
    },
    
    /**
     * Delete channel
     * @param {string} channelId 
     */
    deleteChannel: async (channelId) => {
        const response = await api.delete(`${BASE_URL}/channels/${channelId}`);
        return response.data;
    },
    
    /**
     * Subscribe to channel
     * @param {string} channelId 
     */
    subscribeChannel: async (channelId) => {
        const response = await api.post(`${BASE_URL}/channels/${channelId}/subscribe`);
        return response.data;
    },
    
    /**
     * Unsubscribe from channel
     * @param {string} channelId 
     */
    unsubscribeChannel: async (channelId) => {
        const response = await api.post(`${BASE_URL}/channels/${channelId}/unsubscribe`);
        return response.data;
    },
    
    /**
     * Get channel members
     * @param {string} channelId 
     */
    getChannelMembers: async (channelId) => {
        const response = await api.get(`${BASE_URL}/channels/${channelId}/members`);
        return response.data;
    },
    
    /**
     * Add member to channel
     * @param {string} channelId 
     * @param {Object} data - { userId, role? }
     */
    addChannelMember: async (channelId, data) => {
        const response = await api.post(`${BASE_URL}/channels/${channelId}/members`, data);
        return response.data;
    },
    
    /**
     * Remove member from channel
     * @param {string} channelId 
     * @param {string} userId 
     */
    removeChannelMember: async (channelId, userId) => {
        const response = await api.delete(`${BASE_URL}/channels/${channelId}/members/${userId}`);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // BROADCASTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Get all broadcasts
     * @param {Object} params - Query params
     */
    getBroadcasts: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/broadcasts`, { params });
        return response.data;
    },
    
    /**
     * Get single broadcast
     * @param {string} broadcastId 
     */
    getBroadcast: async (broadcastId) => {
        const response = await api.get(`${BASE_URL}/broadcasts/${broadcastId}`);
        return response.data;
    },
    
    /**
     * Create broadcast
     * @param {Object} data - { title, content, recipientFilter, scheduledFor? }
     */
    createBroadcast: async (data) => {
        const response = await api.post(`${BASE_URL}/broadcasts`, data);
        return response.data;
    },
    
    /**
     * Update broadcast
     * @param {string} broadcastId 
     * @param {Object} data 
     */
    updateBroadcast: async (broadcastId, data) => {
        const response = await api.put(`${BASE_URL}/broadcasts/${broadcastId}`, data);
        return response.data;
    },
    
    /**
     * Delete broadcast
     * @param {string} broadcastId 
     */
    deleteBroadcast: async (broadcastId) => {
        const response = await api.delete(`${BASE_URL}/broadcasts/${broadcastId}`);
        return response.data;
    },
    
    /**
     * Send broadcast now
     * @param {string} broadcastId 
     */
    sendBroadcast: async (broadcastId) => {
        const response = await api.post(`${BASE_URL}/broadcasts/${broadcastId}/send`);
        return response.data;
    },
    
    /**
     * Schedule broadcast
     * @param {string} broadcastId 
     * @param {Object} data - { scheduledFor }
     */
    scheduleBroadcast: async (broadcastId, data) => {
        const response = await api.post(`${BASE_URL}/broadcasts/${broadcastId}/schedule`, data);
        return response.data;
    },
    
    /**
     * Cancel scheduled broadcast
     * @param {string} broadcastId 
     */
    cancelBroadcast: async (broadcastId) => {
        const response = await api.post(`${BASE_URL}/broadcasts/${broadcastId}/cancel`);
        return response.data;
    },
    
    /**
     * Get broadcast stats
     * @param {string} broadcastId 
     */
    getBroadcastStats: async (broadcastId) => {
        const response = await api.get(`${BASE_URL}/broadcasts/${broadcastId}/stats`);
        return response.data;
    },
    
    /**
     * Get broadcast recipients
     * @param {string} broadcastId 
     */
    getBroadcastRecipients: async (broadcastId) => {
        const response = await api.get(`${BASE_URL}/broadcasts/${broadcastId}/recipients`);
        return response.data;
    },
    
    /**
     * Get broadcast templates
     */
    getBroadcastTemplates: async () => {
        const response = await api.get(`${BASE_URL}/broadcast-templates`);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // MEDIA
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Upload media
     * @param {FormData} formData - File data
     */
    uploadMedia: async (formData) => {
        const response = await api.post(`${BASE_URL}/media/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    
    /**
     * Get media list
     * @param {Object} params - Query params
     */
    getMediaList: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/media`, { params });
        return response.data;
    },
    
    /**
     * Get single media item
     * @param {string} mediaId 
     */
    getMedia: async (mediaId) => {
        const response = await api.get(`${BASE_URL}/media/${mediaId}`);
        return response.data;
    },
    
    /**
     * Delete media
     * @param {string} mediaId 
     */
    deleteMedia: async (mediaId) => {
        const response = await api.delete(`${BASE_URL}/media/${mediaId}`);
        return response.data;
    },
    
    /**
     * Get media by type
     * @param {string} type - 'image' | 'video' | 'document' | 'audio'
     */
    getMediaByType: async (type) => {
        const response = await api.get(`${BASE_URL}/media/by-type/${type}`);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // AI FEATURES
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Summarize conversation
     * @param {Object} data - { conversationId, messageCount? }
     */
    summarizeConversation: async (data) => {
        const response = await api.post(`${BASE_URL}/ai/summarize`, data);
        return response.data;
    },
    
    /**
     * Translate message
     * @param {Object} data - { text, targetLanguage }
     */
    translateMessage: async (data) => {
        const response = await api.post(`${BASE_URL}/ai/translate`, data);
        return response.data;
    },
    
    /**
     * Analyze sentiment
     * @param {Object} data - { text }
     */
    analyzeSentiment: async (data) => {
        const response = await api.post(`${BASE_URL}/ai/sentiment`, data);
        return response.data;
    },
    
    /**
     * Get AI suggested reply
     * @param {Object} data - { conversationId, context? }
     */
    suggestReply: async (data) => {
        const response = await api.post(`${BASE_URL}/ai/suggest-reply`, data);
        return response.data;
    },
    
    /**
     * Rewrite message
     * @param {Object} data - { text, style }
     */
    rewriteMessage: async (data) => {
        const response = await api.post(`${BASE_URL}/ai/rewrite`, data);
        return response.data;
    },
    
    /**
     * Get AI digest
     */
    getAIDigest: async () => {
        const response = await api.get(`${BASE_URL}/ai/digest`);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // AUTOMATION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Get automation rules
     */
    getAutomationRules: async () => {
        const response = await api.get(`${BASE_URL}/automation/rules`);
        return response.data;
    },
    
    /**
     * Get single automation rule
     * @param {string} ruleId 
     */
    getAutomationRule: async (ruleId) => {
        const response = await api.get(`${BASE_URL}/automation/rules/${ruleId}`);
        return response.data;
    },
    
    /**
     * Create automation rule
     * @param {Object} data - Rule configuration
     */
    createAutomationRule: async (data) => {
        const response = await api.post(`${BASE_URL}/automation/rules`, data);
        return response.data;
    },
    
    /**
     * Update automation rule
     * @param {string} ruleId 
     * @param {Object} data 
     */
    updateAutomationRule: async (ruleId, data) => {
        const response = await api.put(`${BASE_URL}/automation/rules/${ruleId}`, data);
        return response.data;
    },
    
    /**
     * Delete automation rule
     * @param {string} ruleId 
     */
    deleteAutomationRule: async (ruleId) => {
        const response = await api.delete(`${BASE_URL}/automation/rules/${ruleId}`);
        return response.data;
    },
    
    /**
     * Toggle automation rule
     * @param {string} ruleId 
     */
    toggleAutomationRule: async (ruleId) => {
        const response = await api.post(`${BASE_URL}/automation/rules/${ruleId}/toggle`);
        return response.data;
    },
    
    /**
     * Get automation logs
     * @param {string} ruleId 
     */
    getAutomationLogs: async (ruleId) => {
        const response = await api.get(`${BASE_URL}/automation/rules/${ruleId}/logs`);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Get notifications
     * @param {Object} params - Query params
     */
    getNotifications: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/notifications`, { params });
        return response.data;
    },
    
    /**
     * Mark notifications as read
     * @param {Object} data - { notificationIds }
     */
    markNotificationsRead: async (data) => {
        const response = await api.post(`${BASE_URL}/notifications/read`, data);
        return response.data;
    },
    
    /**
     * Mark all notifications as read
     */
    markAllNotificationsRead: async () => {
        const response = await api.post(`${BASE_URL}/notifications/read-all`);
        return response.data;
    },
    
    /**
     * Get notification preferences
     */
    getNotificationPreferences: async () => {
        const response = await api.get(`${BASE_URL}/notifications/preferences`);
        return response.data;
    },
    
    /**
     * Update notification preferences
     * @param {Object} data - Preferences
     */
    updateNotificationPreferences: async (data) => {
        const response = await api.put(`${BASE_URL}/notifications/preferences`, data);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // PRIVACY
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Get privacy settings
     */
    getPrivacySettings: async () => {
        const response = await api.get(`${BASE_URL}/privacy/settings`);
        return response.data;
    },
    
    /**
     * Update privacy settings
     * @param {Object} data - Settings
     */
    updatePrivacySettings: async (data) => {
        const response = await api.put(`${BASE_URL}/privacy/settings`, data);
        return response.data;
    },
    
    /**
     * Block user
     * @param {string} userId 
     */
    blockUser: async (userId) => {
        const response = await api.post(`${BASE_URL}/privacy/block/${userId}`);
        return response.data;
    },
    
    /**
     * Unblock user
     * @param {string} userId 
     */
    unblockUser: async (userId) => {
        const response = await api.post(`${BASE_URL}/privacy/unblock/${userId}`);
        return response.data;
    },
    
    /**
     * Get blocked users
     */
    getBlockedUsers: async () => {
        const response = await api.get(`${BASE_URL}/privacy/blocked`);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Get admin stats
     */
    getAdminStats: async () => {
        const response = await api.get(`${BASE_URL}/admin/stats`);
        return response.data;
    },
    
    /**
     * Get admin logs
     * @param {Object} params - Query params
     */
    getAdminLogs: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/admin/logs`, { params });
        return response.data;
    },
    
    /**
     * Moderate message
     * @param {string} messageId 
     * @param {Object} data - { action, reason }
     */
    moderateMessage: async (messageId, data) => {
        const response = await api.post(`${BASE_URL}/admin/moderate/${messageId}`, data);
        return response.data;
    },
    
    /**
     * Get JashSync users
     * @param {Object} params - Query params
     */
    getJashSyncUsers: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/admin/users`, { params });
        return response.data;
    },
    
    /**
     * Update user permissions
     * @param {string} userId 
     * @param {Object} data - Permissions
     */
    updateUserPermissions: async (userId, data) => {
        const response = await api.put(`${BASE_URL}/admin/users/${userId}/permissions`, data);
        return response.data;
    },
    
    /**
     * Get usage report
     */
    getUsageReport: async () => {
        const response = await api.get(`${BASE_URL}/admin/usage-report`);
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // SEARCH
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Global search
     * @param {Object} params - { query, type? }
     */
    globalSearch: async (params) => {
        const response = await api.get(`${BASE_URL}/search`, { params });
        return response.data;
    },
    
    /**
     * Search messages
     * @param {Object} params - { query, conversationId? }
     */
    searchMessages: async (params) => {
        const response = await api.get(`${BASE_URL}/search/messages`, { params });
        return response.data;
    },
    
    /**
     * Search media
     * @param {Object} params - { query, type? }
     */
    searchMedia: async (params) => {
        const response = await api.get(`${BASE_URL}/search/media`, { params });
        return response.data;
    },
    
    /**
     * Search users
     * @param {Object} params - { query }
     */
    searchUsers: async (params) => {
        const response = await api.get(`${BASE_URL}/search/users`, { params });
        return response.data;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // WALLET & BILLING
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Get wallet transactions
     * @param {Object} params - Query params
     */
    getWalletTransactions: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/wallet/transactions`, { params });
        return response.data;
    },
    
    /**
     * Initiate recharge
     * @param {Object} data - { packageId, amount? }
     */
    initiateRecharge: async (data) => {
        const response = await api.post(`${BASE_URL}/wallet/recharge`, data);
        return response.data;
    },
    
    /**
     * Verify recharge payment
     * @param {Object} data - Payment verification data
     */
    verifyRecharge: async (data) => {
        const response = await api.post(`${BASE_URL}/wallet/recharge/verify`, data);
        return response.data;
    },
    
    /**
     * Get usage stats
     */
    getUsageStats: async () => {
        const response = await api.get(`${BASE_URL}/wallet/usage`);
        return response.data;
    },
    
    /**
     * Get recharge packages (public)
     */
    getRechargePackages: async () => {
        const response = await api.get(`${BASE_URL}/packages/public`);
        return response.data;
    }
};

export default jashsyncService;
