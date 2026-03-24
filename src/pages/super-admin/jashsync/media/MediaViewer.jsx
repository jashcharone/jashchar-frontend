import React, { useState, useEffect } from 'react';
import { 
    X, Download, Share2, Trash2, Copy, Check, ChevronLeft, ChevronRight,
    Image, Film, Music, FileText, File, Eye, Calendar, User, Tag,
    ZoomIn, ZoomOut, RotateCw, Maximize2, Sparkles, ExternalLink,
    Play, Pause, Volume2, VolumeX, SkipBack, SkipForward
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTime as formatDate } from '@/utils/dateUtils';
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';

/**
 * MediaViewer - Full-screen preview with details
 * Supports images, videos, audio with controls
 */
const MediaViewer = ({ 
    media,
    open,
    onOpenChange,
    allMedia = [],
    onNavigate,
    onDelete
}) => {
    const { toast } = useToast();
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [copied, setCopied] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(70);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    // File type configurations
    const fileTypes = {
        image: { label: 'Image', icon: Image, color: 'text-blue-400 bg-blue-500/20' },
        video: { label: 'Video', icon: Film, color: 'text-purple-400 bg-purple-500/20' },
        audio: { label: 'Audio', icon: Music, color: 'text-green-400 bg-green-500/20' },
        document: { label: 'Document', icon: FileText, color: 'text-orange-400 bg-orange-500/20' },
        other: { label: 'File', icon: File, color: 'text-gray-400 bg-gray-500/20' }
    };
    
    // Format file size
    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };
    
    // Format time (for audio/video)
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Get current index
    const currentIndex = allMedia.findIndex(m => m.id === media?.id);
    const canNavigatePrev = currentIndex > 0;
    const canNavigateNext = currentIndex < allMedia.length - 1;
    
    // Navigation
    const navigatePrev = () => {
        if (canNavigatePrev && onNavigate) {
            onNavigate(allMedia[currentIndex - 1]);
        }
    };
    
    const navigateNext = () => {
        if (canNavigateNext && onNavigate) {
            onNavigate(allMedia[currentIndex + 1]);
        }
    };
    
    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!open) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    navigatePrev();
                    break;
                case 'ArrowRight':
                    navigateNext();
                    break;
                case 'Escape':
                    onOpenChange(false);
                    break;
                case '+':
                case '=':
                    setZoom(z => Math.min(z + 0.25, 3));
                    break;
                case '-':
                    setZoom(z => Math.max(z - 0.25, 0.5));
                    break;
                case 'r':
                    setRotation(r => (r + 90) % 360);
                    break;
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, currentIndex]);
    
    // Reset state when media changes
    useEffect(() => {
        setZoom(1);
        setRotation(0);
        setIsPlaying(false);
        setCurrentTime(0);
    }, [media?.id]);
    
    // Actions
    const copyLink = () => {
        if (media?.url) {
            navigator.clipboard.writeText(media.url);
            setCopied(true);
            toast({ title: "Success", description: 'Link copied to clipboard' });
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const downloadFile = () => {
        if (media?.url) {
            window.open(media.url, '_blank');
        }
    };
    
    const shareFile = () => {
        if (navigator.share && media) {
            navigator.share({
                title: media.name,
                url: media.url
            });
        } else {
            copyLink();
        }
    };
    
    if (!media) return null;
    
    const typeInfo = fileTypes[media.type] || fileTypes.other;
    const TypeIcon = typeInfo.icon;
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-700 max-w-[95vw] max-h-[95vh] w-full h-full p-0">
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                typeInfo.color
                            )}>
                                <TypeIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-gray-900 dark:text-white font-medium truncate max-w-md">
                                    {media.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatSize(media.size)} • {formatDate(media.uploadedAt)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Image controls */}
                            {media.type === 'image' && (
                                <>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                                        className="h-9 w-9 bg-black/30 hover:bg-black/50"
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs text-gray-400 w-12 text-center">
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                                        className="h-9 w-9 bg-black/30 hover:bg-black/50"
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => setRotation(r => (r + 90) % 360)}
                                        className="h-9 w-9 bg-black/30 hover:bg-black/50"
                                    >
                                        <RotateCw className="h-4 w-4" />
                                    </Button>
                                    <div className="w-px h-6 bg-gray-700 mx-1" />
                                </>
                            )}
                            
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={copyLink}
                                className="h-9 w-9 bg-black/30 hover:bg-black/50"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={shareFile}
                                className="h-9 w-9 bg-black/30 hover:bg-black/50"
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={downloadFile}
                                className="h-9 w-9 bg-black/30 hover:bg-black/50"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="h-9 w-9 bg-black/30 hover:bg-black/50"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                
                {/* Navigation Arrows */}
                {allMedia.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={navigatePrev}
                            disabled={!canNavigatePrev}
                            className={cn(
                                "absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full",
                                "bg-black/50 hover:bg-black/70",
                                !canNavigatePrev && "opacity-30"
                            )}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={navigateNext}
                            disabled={!canNavigateNext}
                            className={cn(
                                "absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full",
                                "bg-black/50 hover:bg-black/70",
                                !canNavigateNext && "opacity-30"
                            )}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </>
                )}
                
                {/* Main Content */}
                <div className="flex h-full pt-16">
                    {/* Media Preview */}
                    <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
                        {/* Image */}
                        {media.type === 'image' && (
                            <img 
                                src={media.url || media.thumbnail}
                                alt={media.name}
                                className="max-w-full max-h-full object-contain transition-transform duration-200"
                                style={{
                                    transform: `scale(${zoom}) rotate(${rotation}deg)`
                                }}
                            />
                        )}
                        
                        {/* Video */}
                        {media.type === 'video' && (
                            <div className="w-full max-w-4xl">
                                <video 
                                    src={media.url}
                                    poster={media.thumbnail}
                                    controls
                                    className="w-full rounded-lg"
                                />
                            </div>
                        )}
                        
                        {/* Audio */}
                        {media.type === 'audio' && (
                            <div className="w-full max-w-md bg-gray-800/50 rounded-xl p-6">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Music className="h-12 w-12 text-green-400" />
                                </div>
                                <p className="text-center text-white font-medium mb-2">{media.name}</p>
                                <p className="text-center text-sm text-gray-400 mb-6">{media.duration || 'Unknown duration'}</p>
                                <audio 
                                    src={media.url}
                                    controls
                                    className="w-full"
                                />
                            </div>
                        )}
                        
                        {/* Document */}
                        {media.type === 'document' && (
                            <div className="text-center">
                                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mx-auto mb-6">
                                    <FileText className="h-16 w-16 text-orange-400" />
                                </div>
                                <p className="text-white font-medium mb-2">{media.name}</p>
                                <p className="text-sm text-gray-400 mb-6">{formatSize(media.size)}</p>
                                <Button onClick={downloadFile}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Document
                                </Button>
                            </div>
                        )}
                        
                        {/* Other */}
                        {media.type === 'other' && (
                            <div className="text-center">
                                <div className="w-32 h-32 rounded-xl bg-gray-800 flex items-center justify-center mx-auto mb-6">
                                    <File className="h-16 w-16 text-gray-400" />
                                </div>
                                <p className="text-white font-medium mb-2">{media.name}</p>
                                <p className="text-sm text-gray-400 mb-6">{formatSize(media.size)}</p>
                                <Button onClick={downloadFile}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download File
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    {/* Details Panel */}
                    <div className="w-80 bg-gray-800/50 border-l border-gray-700/50 overflow-auto">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-6">
                                {/* File Info */}
                                <div>
                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                                        File Details
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <File className="h-4 w-4 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500">Name</p>
                                                <p className="text-sm text-white break-all">{media.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500">Type</p>
                                                <p className="text-sm text-white">{typeInfo.label}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Eye className="h-4 w-4 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500">Size</p>
                                                <p className="text-sm text-white">{formatSize(media.size)}</p>
                                            </div>
                                        </div>
                                        {media.duration && (
                                            <div className="flex items-start gap-3">
                                                <Play className="h-4 w-4 text-gray-500 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Duration</p>
                                                    <p className="text-sm text-white">{media.duration}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Upload Info */}
                                <div>
                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                                        Upload Info
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <User className="h-4 w-4 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500">Uploaded By</p>
                                                <p className="text-sm text-white">{media.uploadedBy?.name || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500">Uploaded On</p>
                                                <p className="text-sm text-white">{formatDate(media.uploadedAt)}</p>
                                            </div>
                                        </div>
                                        {media.source && (
                                            <div className="flex items-start gap-3">
                                                <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Source</p>
                                                    <p className="text-sm text-white">{media.source.name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* AI Tags */}
                                {media.aiTags?.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                                            <Sparkles className="h-3 w-3 text-purple-400" />
                                            AI Tags
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {media.aiTags.map((tag, idx) => (
                                                <Badge 
                                                    key={idx}
                                                    variant="outline"
                                                    className="text-xs text-purple-300 border-purple-500/30"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Stats */}
                                {media.views !== undefined && (
                                    <div>
                                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                                            Statistics
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-white">{media.views} views</span>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Actions */}
                                <div className="pt-4 border-t border-gray-700/50 space-y-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={downloadFile}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={copyLink}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Link
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start text-red-400 hover:text-red-300"
                                        onClick={() => {
                                            onDelete?.(media.id);
                                            onOpenChange(false);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                
                {/* Bottom Bar - Navigation indicator */}
                {allMedia.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60">
                            {allMedia.slice(
                                Math.max(0, currentIndex - 3),
                                Math.min(allMedia.length, currentIndex + 4)
                            ).map((item, idx) => {
                                const realIdx = Math.max(0, currentIndex - 3) + idx;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onNavigate?.(item)}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-all",
                                            realIdx === currentIndex 
                                                ? "w-6 bg-cyan-400" 
                                                : "bg-gray-500 hover:bg-gray-400"
                                        )}
                                    />
                                );
                            })}
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-1">
                            {currentIndex + 1} / {allMedia.length}
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default MediaViewer;
