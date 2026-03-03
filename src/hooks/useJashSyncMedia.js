/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * useJashSyncMedia Hook
 * Day 24-25: Media upload, search, AI tagging frontend integration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import api from '@/services/api';

/**
 * Hook for JashSync Media operations
 * @returns {Object} Media operations and state
 */
export const useJashSyncMedia = () => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [mediaList, setMediaList] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    /**
     * Upload a file
     * @param {File} file - File to upload
     * @param {Object} options - Upload options
     */
    const uploadFile = useCallback(async (file, options = {}) => {
        try {
            setUploading(true);
            setUploadProgress(0);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);
            
            if (options.expiryDays !== undefined) {
                formData.append('expiryDays', options.expiryDays);
            }
            if (options.enableAITags !== undefined) {
                formData.append('enableAITags', options.enableAITags);
            }

            const queryParams = new URLSearchParams();
            if (options.organizationId) queryParams.set('organization_id', options.organizationId);
            if (options.branchId) queryParams.set('branch_id', options.branchId);

            const response = await api.post(
                `/jashsync/media/upload?${queryParams.toString()}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    },
                }
            );

            setUploading(false);
            setUploadProgress(100);
            
            // Add to media list if exists
            if (response.data?.media) {
                setMediaList(prev => [response.data.media, ...prev]);
            }

            return { success: true, media: response.data.media };
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            setUploading(false);
            throw err;
        }
    }, []);

    /**
     * Upload multiple files
     * @param {FileList|File[]} files - Files to upload
     * @param {Object} options - Upload options
     */
    const uploadMultiple = useCallback(async (files, options = {}) => {
        const results = [];
        const fileArray = Array.from(files);

        for (let i = 0; i < fileArray.length; i++) {
            try {
                const result = await uploadFile(fileArray[i], options);
                results.push({ success: true, file: fileArray[i].name, media: result.media });
            } catch (err) {
                results.push({ success: false, file: fileArray[i].name, error: err.message });
            }
        }

        return results;
    }, [uploadFile]);

    /**
     * Search media files
     * @param {Object} params - Search parameters
     */
    const searchMedia = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            if (params.query) queryParams.set('query', params.query);
            if (params.tags) queryParams.set('tags', params.tags.join(','));
            if (params.fileType) queryParams.set('fileType', params.fileType);
            if (params.uploadedBy) queryParams.set('uploadedBy', params.uploadedBy);
            if (params.startDate) queryParams.set('startDate', params.startDate);
            if (params.endDate) queryParams.set('endDate', params.endDate);
            if (params.page) queryParams.set('page', params.page);
            if (params.limit) queryParams.set('limit', params.limit);
            if (params.branchId) queryParams.set('branch_id', params.branchId);

            const response = await api.get(`/jashsync/media?${queryParams.toString()}`);
            const data = response?.data || {};

            setMediaList(data.media || []);
            setPagination({
                page: data.page || 1,
                limit: data.limit || 20,
                total: data.total || 0,
                totalPages: data.totalPages || 0
            });

            setLoading(false);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            setLoading(false);
            throw err;
        }
    }, []);

    /**
     * Get media by ID
     * @param {string} mediaId - Media ID
     */
    const getMedia = useCallback(async (mediaId) => {
        try {
            setLoading(true);
            const response = await api.get(`/jashsync/media/${mediaId}`);
            setLoading(false);
            return response.data.media;
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            setLoading(false);
            throw err;
        }
    }, []);

    /**
     * Get signed URL for private media
     * @param {string} mediaId - Media ID
     * @param {number} expirySeconds - Expiry time in seconds
     */
    const getSignedUrl = useCallback(async (mediaId, expirySeconds = 3600) => {
        try {
            const response = await api.get(
                `/jashsync/media/${mediaId}/signed-url?expirySeconds=${expirySeconds}`
            );
            return response.data.signedUrl;
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            throw err;
        }
    }, []);

    /**
     * Delete media
     * @param {string} mediaId - Media ID
     */
    const deleteMedia = useCallback(async (mediaId) => {
        try {
            setLoading(true);
            await api.delete(`/jashsync/media/${mediaId}`);
            
            // Remove from local list
            setMediaList(prev => prev.filter(m => m.id !== mediaId));
            
            setLoading(false);
            return { success: true };
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            setLoading(false);
            throw err;
        }
    }, []);

    /**
     * Update media tags
     * @param {string} mediaId - Media ID
     * @param {string[]} tags - New tags array
     */
    const updateTags = useCallback(async (mediaId, tags) => {
        try {
            setLoading(true);
            const response = await api.put(`/jashsync/media/${mediaId}/tags`, { tags });
            
            // Update local list
            setMediaList(prev => 
                prev.map(m => m.id === mediaId ? { ...m, ai_tags: tags } : m)
            );
            
            setLoading(false);
            return response.data.media;
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            setLoading(false);
            throw err;
        }
    }, []);

    /**
     * Trigger AI tagging for media
     * @param {string} mediaId - Media ID
     */
    const triggerAITagging = useCallback(async (mediaId) => {
        try {
            setLoading(true);
            const response = await api.post(`/jashsync/media/${mediaId}/ai-tag`);
            
            // Update local list if tags were generated
            if (response.data.media) {
                setMediaList(prev => 
                    prev.map(m => m.id === mediaId ? response.data.media : m)
                );
            }
            
            setLoading(false);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            setLoading(false);
            throw err;
        }
    }, []);

    /**
     * Get media statistics
     * @param {string} branchId - Optional branch ID filter
     */
    const getMediaStats = useCallback(async (branchId) => {
        try {
            setLoading(true);
            const queryParams = branchId ? `?branch_id=${branchId}` : '';
            const response = await api.get(`/jashsync/media-stats${queryParams}`);
            
            const data = response?.data || {};
            setStats(data.stats || {});
            setLoading(false);
            return data.stats || {};
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            setLoading(false);
            throw err;
        }
    }, []);

    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     */
    const formatFileSize = useCallback((bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    /**
     * Get file type icon
     * @param {string} fileType - File type
     */
    const getFileTypeIcon = useCallback((fileType) => {
        const icons = {
            image: '🖼️',
            video: '🎬',
            audio: '🎵',
            document: '📄',
            voice_note: '🎤',
            sticker: '😀'
        };
        return icons[fileType] || '📎';
    }, []);

    /**
     * Check if file type is allowed
     * @param {string} mimeType - MIME type
     */
    const isFileTypeAllowed = useCallback((mimeType) => {
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            // Videos
            'video/mp4', 'video/webm', 'video/quicktime',
            // Audio
            'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ];
        return allowedTypes.includes(mimeType);
    }, []);

    return {
        // State
        loading,
        uploading,
        uploadProgress,
        error,
        mediaList,
        stats,
        pagination,

        // Upload
        uploadFile,
        uploadMultiple,

        // Read/Search
        searchMedia,
        getMedia,
        getSignedUrl,

        // Update
        updateTags,
        triggerAITagging,

        // Delete
        deleteMedia,

        // Stats
        getMediaStats,

        // Helpers
        formatFileSize,
        getFileTypeIcon,
        isFileTypeAllowed,

        // Setters
        setMediaList,
        setError
    };
};

export default useJashSyncMedia;
