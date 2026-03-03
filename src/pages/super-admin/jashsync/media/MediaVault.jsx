import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    FolderOpen, Search, Filter, Upload, Grid, List, Download,
    Image, FileText, Film, Music, File, Trash2, MoreVertical,
    Calendar, User, Tag, Eye, Share2, Copy, Check, RefreshCw,
    ChevronDown, X, Sparkles, Hash, MessageCircle, Megaphone, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useJashSyncMedia } from "@/hooks/useJashSyncMedia";
import { useToast } from "@/components/ui/use-toast";

/**
 * MediaVault - Centralized media storage with AI tagging
 * Day 24-25: Now integrated with backend API
 */
const MediaVault = ({ 
    onUpload,
    onViewMedia,
    className 
}) => {
    const { toast } = useToast();
    const {
        loading,
        uploading,
        uploadProgress,
        error,
        mediaList,
        stats: mediaStats,
        pagination,
        searchMedia,
        uploadFile,
        deleteMedia,
        triggerAITagging,
        getMediaStats,
        formatFileSize,
        getFileTypeIcon
    } = useJashSyncMedia();
    
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectMode, setSelectMode] = useState(false);
    
    // File type configurations
    const fileTypes = {
        image: { label: 'Images', icon: Image, color: 'text-blue-400 bg-blue-500/20', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] },
        video: { label: 'Videos', icon: Film, color: 'text-purple-400 bg-purple-500/20', extensions: ['mp4', 'mov', 'avi', 'webm'] },
        audio: { label: 'Audio', icon: Music, color: 'text-green-400 bg-green-500/20', extensions: ['mp3', 'wav', 'ogg', 'm4a'] },
        document: { label: 'Documents', icon: FileText, color: 'text-orange-400 bg-orange-500/20', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'] },
        other: { label: 'Other', icon: File, color: 'text-gray-400 bg-gray-500/20', extensions: [] }
    };
    
    // Source configurations
    const sourceIcons = {
        chat: { icon: MessageCircle, color: 'text-purple-400' },
        channel: { icon: Hash, color: 'text-blue-400' },
        broadcast: { icon: Megaphone, color: 'text-red-400' }
    };
    
    // Fetch media from backend
    const fetchMedia = useCallback(async () => {
        try {
            await searchMedia({
                query: search || undefined,
                fileType: activeFilter !== 'all' ? activeFilter : undefined,
                page: 1,
                limit: 50
            });
            await getMediaStats();
        } catch (err) {
            console.error('Failed to fetch media:', err);
            toast({
                title: "Error",
                description: "Failed to load media files",
                variant: "destructive"
            });
        }
    }, [search, activeFilter, searchMedia, getMediaStats, toast]);
    
    // Initial fetch
    useEffect(() => {
        fetchMedia();
    }, []);
    
    // Re-fetch when filter changes
    useEffect(() => {
        fetchMedia();
    }, [activeFilter]);
    
    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== undefined) {
                fetchMedia();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);
    
    // Map backend media to component format
    const media = useMemo(() => {
        return mediaList.map(m => ({
            id: m.id,
            name: m.original_filename || m.filename,
            type: m.file_type,
            size: m.file_size,
            url: m.public_url,
            thumbnail: m.thumbnail_url,
            uploadedAt: m.created_at,
            uploadedBy: { name: 'User', avatar: null },
            source: { type: 'chat', name: 'JashSync' },
            aiTags: m.ai_tags || [],
            views: m.usage_count || 0,
            duration: m.duration ? `${Math.floor(m.duration / 60)}:${String(m.duration % 60).padStart(2, '0')}` : null
        }));
    }, [mediaList]);
    
    // Calculate stats
    const stats = useMemo(() => {
        if (mediaStats) {
            return {
                images: mediaStats.byType?.image?.count || 0,
                videos: mediaStats.byType?.video?.count || 0,
                documents: mediaStats.byType?.document?.count || 0,
                audio: mediaStats.byType?.audio?.count || 0,
                total: mediaStats.totalFiles || 0,
                totalSize: mediaStats.totalSize || 0,
                totalSizeFormatted: mediaStats.totalSizeFormatted || '0 Bytes'
            };
        }
        // Fallback to calculating from media list
        const images = media.filter(m => m.type === 'image').length;
        const videos = media.filter(m => m.type === 'video').length;
        const documents = media.filter(m => m.type === 'document').length;
        const audio = media.filter(m => m.type === 'audio').length;
        const totalSize = media.reduce((sum, m) => sum + (m.size || 0), 0);
        return { 
            images, videos, documents, audio, 
            total: media.length, 
            totalSize,
            totalSizeFormatted: formatFileSize(totalSize)
        };
    }, [media, mediaStats, formatFileSize]);
    
    // Handle file upload
    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        try {
            for (const file of files) {
                await uploadFile(file);
            }
            toast({
                title: "Success",
                description: `${files.length} file(s) uploaded successfully`
            });
            fetchMedia(); // Refresh list
        } catch (err) {
            toast({
                title: "Upload Failed",
                description: err.message,
                variant: "destructive"
            });
        }
    };
    
    // Handle delete
    const handleDelete = async (mediaId) => {
        try {
            await deleteMedia(mediaId);
            toast({
                title: "Success",
                description: "File deleted successfully"
            });
        } catch (err) {
            toast({
                title: "Delete Failed",
                description: err.message,
                variant: "destructive"
            });
        }
    };
    
    // Handle AI tagging
    const handleAITag = async (mediaId) => {
        try {
            await triggerAITagging(mediaId);
            toast({
                title: "Success",
                description: "AI tags generated"
            });
        } catch (err) {
            toast({
                title: "AI Tagging Failed",
                description: err.message,
                variant: "destructive"
            });
        }
    };
    
    // Format file size
    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };
    
    // Format date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    
    // Filter and sort media
    const filteredMedia = useMemo(() => {
        let result = [...media];
        
        // Filter by type
        if (activeFilter !== 'all') {
            result = result.filter(m => m.type === activeFilter);
        }
        
        // Search
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(m => 
                m.name?.toLowerCase().includes(query) ||
                m.aiTags?.some(tag => tag.toLowerCase().includes(query)) ||
                m.source?.name?.toLowerCase().includes(query)
            );
        }
        
        // Sort
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
                break;
            case 'largest':
                result.sort((a, b) => (b.size || 0) - (a.size || 0));
                break;
            case 'smallest':
                result.sort((a, b) => (a.size || 0) - (b.size || 0));
                break;
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'views':
                result.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
        }
        
        return result;
    }, [media, activeFilter, search, sortBy]);
    
    // Actions
    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };
    
    const selectAll = () => {
        setSelectedIds(filteredMedia.map(m => m.id));
    };
    
    const handleDeleteMedia = async (ids) => {
        // Use deleteMedia from hook for each id
        for (const id of ids) {
            await deleteMedia(id);
        }
        setSelectedIds([]);
    };
    
    const downloadMedia = (item) => {
        window.open(item.url, '_blank');
    };
    
    const copyLink = (item) => {
        navigator.clipboard.writeText(item.url);
    };
    
    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900", className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                Media Vault
                                <Badge className="bg-cyan-500/20 text-cyan-400 text-[10px]">
                                    {stats.total} files
                                </Badge>
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatSize(stats.totalSize)} used • AI-tagged & searchable
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {selectMode ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => { setSelectMode(false); setSelectedIds([]); }}
                                >
                                    Cancel
                                </Button>
                                {selectedIds.length > 0 && (
                                    <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => handleDeleteMedia(selectedIds)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete ({selectedIds.length})
                                    </Button>
                                )}
                            </>
                        ) : (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectMode(true)}
                                >
                                    <Check className="h-4 w-4 mr-1" />
                                    Select
                                </Button>
                                <Button 
                                    size="sm"
                                    onClick={onUpload}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-500"
                                >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Upload
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                    {[
                        { label: 'All', value: stats.total, filter: 'all', color: 'text-white' },
                        { label: 'Images', value: stats.images, filter: 'image', color: 'text-blue-400' },
                        { label: 'Videos', value: stats.videos, filter: 'video', color: 'text-purple-400' },
                        { label: 'Documents', value: stats.documents, filter: 'document', color: 'text-orange-400' },
                        { label: 'Audio', value: stats.audio, filter: 'audio', color: 'text-green-400' }
                    ].map((stat, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setActiveFilter(stat.filter)}
                            className={cn(
                                "bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-2 text-center cursor-pointer transition-all",
                                "hover:bg-gray-100 dark:hover:bg-gray-800",
                                activeFilter === stat.filter && "ring-1 ring-cyan-500"
                            )}
                        >
                            <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                    ))}
                </div>
                
                {/* Search & Controls */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search files, tags, sources..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        />
                    </div>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-36 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="largest">Largest</SelectItem>
                            <SelectItem value="smallest">Smallest</SelectItem>
                            <SelectItem value="name">Name A-Z</SelectItem>
                            <SelectItem value="views">Most Viewed</SelectItem>
                        </SelectContent>
                    </Select>
                    
                        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "rounded-none h-9",
                                viewMode === 'grid' && "bg-cyan-500/20 text-cyan-400"
                            )}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "rounded-none h-9",
                                viewMode === 'list' && "bg-cyan-500/20 text-cyan-400"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* Select All (when in select mode) */}
            {selectMode && (
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between bg-gray-100/30 dark:bg-gray-800/30">
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            checked={selectedIds.length === filteredMedia.length && filteredMedia.length > 0}
                            onCheckedChange={(checked) => checked ? selectAll() : setSelectedIds([])}
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedIds.length} selected
                        </span>
                    </div>
                </div>
            )}
            
            {/* Media Grid/List */}
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
                    </div>
                ) : filteredMedia.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <FolderOpen className="h-12 w-12 mb-3 opacity-50" />
                        <p className="text-sm font-medium">No media found</p>
                        <p className="text-xs">Upload files or adjust your filters</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    // Grid View
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {filteredMedia.map((item) => {
                            const typeInfo = fileTypes[item.type] || fileTypes.other;
                            const TypeIcon = typeInfo.icon;
                            const sourceInfo = sourceIcons[item.source?.type];
                            const SourceIcon = sourceInfo?.icon || Hash;
                            const isSelected = selectedIds.includes(item.id);
                            
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => selectMode ? toggleSelect(item.id) : onViewMedia?.(item)}
                                    className={cn(
                                        "group relative bg-gray-100/50 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700/50 cursor-pointer transition-all",
                                        "hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10",
                                        isSelected && "ring-2 ring-cyan-500"
                                    )}
                                >
                                    {/* Thumbnail / Icon */}
                                        <div className="aspect-square relative bg-gray-100 dark:bg-gray-900">
                                        {item.thumbnail ? (
                                            <img 
                                                src={item.thumbnail} 
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={cn(
                                                "w-full h-full flex items-center justify-center",
                                                typeInfo.color
                                            )}>
                                                <TypeIcon className="h-12 w-12 opacity-80" />
                                            </div>
                                        )}
                                        
                                        {/* Duration badge (video/audio) */}
                                        {item.duration && (
                                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white">
                                                {item.duration}
                                            </div>
                                        )}
                                        
                                        {/* Select checkbox */}
                                        {selectMode && (
                                            <div className="absolute top-2 left-2">
                                                <Checkbox 
                                                    checked={isSelected}
                                                    className="bg-black/50"
                                                />
                                            </div>
                                        )}
                                        
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className="h-8 w-8 bg-white/10 hover:bg-white/20"
                                                onClick={(e) => { e.stopPropagation(); onViewMedia?.(item); }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className="h-8 w-8 bg-white/10 hover:bg-white/20"
                                                onClick={(e) => { e.stopPropagation(); downloadMedia(item); }}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="p-2">
                                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={item.name}>
                                            {item.name}
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-gray-500">
                                                {formatSize(item.size)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <SourceIcon className={cn("h-3 w-3", sourceInfo?.color)} />
                                            </div>
                                        </div>
                                        
                                        {/* AI Tags */}
                                        {item.aiTags?.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                                                <Sparkles className="h-3 w-3 text-purple-400 shrink-0" />
                                                <div className="flex gap-1 overflow-hidden">
                                                    {item.aiTags.slice(0, 2).map((tag, idx) => (
                                                        <Badge 
                                                            key={idx}
                                                            variant="outline"
                                                            className="text-[9px] px-1 py-0 text-purple-300 border-purple-500/30"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {item.aiTags.length > 2 && (
                                                        <span className="text-[9px] text-gray-500">
                                                            +{item.aiTags.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // List View
                    <div className="p-2 space-y-1">
                        {filteredMedia.map((item) => {
                            const typeInfo = fileTypes[item.type] || fileTypes.other;
                            const TypeIcon = typeInfo.icon;
                            const sourceInfo = sourceIcons[item.source?.type];
                            const SourceIcon = sourceInfo?.icon || Hash;
                            const isSelected = selectedIds.includes(item.id);
                            
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => selectMode ? toggleSelect(item.id) : onViewMedia?.(item)}
                                    className={cn(
                                        "group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                                        "hover:bg-gray-800/70 border-gray-700/30",
                                        isSelected && "ring-1 ring-cyan-500 bg-cyan-500/10"
                                    )}
                                >
                                    {/* Checkbox */}
                                    {selectMode && (
                                        <Checkbox 
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelect(item.id)}
                                        />
                                    )}
                                    
                                    {/* Thumbnail / Icon */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
                                        !item.thumbnail && typeInfo.color
                                    )}>
                                        {item.thumbnail ? (
                                            <img 
                                                src={item.thumbnail} 
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <TypeIcon className="h-6 w-6" />
                                        )}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                            {item.name}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            <span>{formatSize(item.size)}</span>
                                            <span>•</span>
                                            <span>{formatDate(item.uploadedAt)}</span>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <SourceIcon className={cn("h-3 w-3", sourceInfo?.color)} />
                                                <span>{item.source?.name}</span>
                                            </div>
                                        </div>
                                        
                                        {/* AI Tags */}
                                        {item.aiTags?.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <Sparkles className="h-3 w-3 text-purple-400" />
                                                {item.aiTags.slice(0, 4).map((tag, idx) => (
                                                    <Badge 
                                                        key={idx}
                                                        variant="outline"
                                                        className="text-[9px] px-1 py-0 text-purple-300 border-purple-500/30"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Stats & Actions */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-right text-xs">
                                            <div className="flex items-center gap-1 text-gray-400">
                                                <Eye className="h-3 w-3" />
                                                <span>{item.views}</span>
                                            </div>
                                        </div>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                <DropdownMenuItem onClick={() => onViewMedia?.(item)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => downloadMedia(item)}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => copyLink(item)}>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Copy Link
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-gray-700" />
                                                <DropdownMenuItem 
                                                    onClick={() => handleDeleteMedia([item.id])}
                                                    className="text-red-400"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default MediaVault;
