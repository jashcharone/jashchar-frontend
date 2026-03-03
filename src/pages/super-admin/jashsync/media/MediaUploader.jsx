import React, { useState, useRef, useCallback } from 'react';
import { 
    Upload, X, File, Image, Film, Music, FileText, Check, 
    AlertCircle, Trash2, Cloud, Sparkles, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import api from "@/services/api";

/**
 * MediaUploader - Drag-drop upload with progress tracking
 * Supports batch uploads with AI auto-tagging
 */
const MediaUploader = ({ 
    open, 
    onOpenChange,
    onUploadComplete 
}) => {
    const { toast } = useToast();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    
    // File type configurations
    const fileTypes = {
        image: { icon: Image, color: 'text-blue-400 bg-blue-500/20' },
        video: { icon: Film, color: 'text-purple-400 bg-purple-500/20' },
        audio: { icon: Music, color: 'text-green-400 bg-green-500/20' },
        document: { icon: FileText, color: 'text-orange-400 bg-orange-500/20' },
        other: { icon: File, color: 'text-gray-400 bg-gray-500/20' }
    };
    
    // Detect file type
    const getFileType = (file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
        if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext)) return 'document';
        return 'other';
    };
    
    // Format file size
    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };
    
    // Handle file selection
    const handleFiles = useCallback((newFiles) => {
        const fileList = Array.from(newFiles);
        const processedFiles = fileList.map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            name: file.name,
            size: file.size,
            type: getFileType(file),
            progress: 0,
            status: 'pending', // pending | uploading | processing | completed | error
            error: null,
            preview: null,
            aiTags: []
        }));
        
        // Generate previews for images
        processedFiles.forEach(item => {
            if (item.type === 'image') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFiles(prev => prev.map(f => 
                        f.id === item.id ? { ...f, preview: e.target.result } : f
                    ));
                };
                reader.readAsDataURL(item.file);
            }
        });
        
        setFiles(prev => [...prev, ...processedFiles]);
    }, []);
    
    // Drag handlers
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);
    
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
    }, []);
    
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);
    
    // Remove file
    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };
    
    // Clear all
    const clearAll = () => {
        setFiles([]);
    };
    
    // Upload files
    const startUpload = async () => {
        if (files.length === 0) return;
        
        setUploading(true);
        
        for (const item of files) {
            if (item.status === 'completed') continue;
            
            // Update status to uploading
            setFiles(prev => prev.map(f => 
                f.id === item.id ? { ...f, status: 'uploading', progress: 0 } : f
            ));
            
            try {
                // Simulate upload progress
                for (let progress = 0; progress <= 100; progress += 10) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    setFiles(prev => prev.map(f => 
                        f.id === item.id ? { ...f, progress } : f
                    ));
                }
                
                // Update status to processing (AI tagging)
                setFiles(prev => prev.map(f => 
                    f.id === item.id ? { ...f, status: 'processing', progress: 100 } : f
                ));
                
                // Simulate AI processing
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Mock AI tags based on file type
                const mockTags = {
                    image: ['photo', 'uploaded', 'media'],
                    video: ['video', 'recording', 'media'],
                    audio: ['audio', 'recording', 'voice'],
                    document: ['document', 'file', 'text'],
                    other: ['file', 'attachment']
                };
                
                // Update status to completed
                setFiles(prev => prev.map(f => 
                    f.id === item.id ? { 
                        ...f, 
                        status: 'completed', 
                        aiTags: mockTags[item.type] || mockTags.other 
                    } : f
                ));
                
            } catch (error) {
                console.error('Upload failed:', error);
                setFiles(prev => prev.map(f => 
                    f.id === item.id ? { ...f, status: 'error', error: 'Upload failed' } : f
                ));
            }
        }
        
        setUploading(false);
        
        const completedCount = files.filter(f => f.status === 'completed' || files.find(fn => fn.id === f.id)?.status === 'completed').length;
        if (completedCount > 0) {
            toast({ title: "Success", description: `${completedCount} file(s) uploaded successfully` });
            onUploadComplete?.();
        }
    };
    
    // Calculate stats
    const stats = {
        total: files.length,
        pending: files.filter(f => f.status === 'pending').length,
        uploading: files.filter(f => f.status === 'uploading').length,
        processing: files.filter(f => f.status === 'processing').length,
        completed: files.filter(f => f.status === 'completed').length,
        error: files.filter(f => f.status === 'error').length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-2xl max-h-[85vh] p-0">
                <DialogHeader className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-gray-900 dark:text-white">Upload Media</DialogTitle>
                            <DialogDescription>
                                Drag & drop files or click to browse
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="p-4 space-y-4">
                    {/* Drop Zone */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                            "hover:border-cyan-500/50 hover:bg-cyan-500/5",
                            dragOver && "border-cyan-500 bg-cyan-500/10",
                            !dragOver && "border-gray-200 dark:border-gray-700"
                        )}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={(e) => handleFiles(e.target.files)}
                            className="hidden"
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        />
                        
                        <div className={cn(
                            "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center transition-all",
                            dragOver ? "bg-cyan-500/20" : "bg-gray-100 dark:bg-gray-800"
                        )}>
                            <Cloud className={cn(
                                "h-8 w-8 transition-all",
                                dragOver ? "text-cyan-400 scale-110" : "text-gray-400"
                            )} />
                        </div>
                        
                        <p className="text-gray-900 dark:text-white font-medium mb-1">
                            {dragOver ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            or click to browse • Max 50MB per file
                        </p>
                        
                        <div className="flex items-center justify-center gap-4 mt-4">
                            {[
                                { icon: Image, label: 'Images' },
                                { icon: Film, label: 'Videos' },
                                { icon: Music, label: 'Audio' },
                                { icon: FileText, label: 'Docs' }
                            ].map((type, idx) => (
                                <div key={idx} className="flex items-center gap-1 text-xs text-gray-500">
                                    <type.icon className="h-3 w-3" />
                                    <span>{type.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* File List */}
                    {files.length > 0 && (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {stats.total} file(s) • {formatSize(stats.totalSize)}
                                    </span>
                                    {stats.completed > 0 && (
                                        <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                                            {stats.completed} uploaded
                                        </Badge>
                                    )}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={clearAll}
                                    disabled={uploading}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Clear All
                                </Button>
                            </div>
                            
                            <ScrollArea className="max-h-64">
                                <div className="space-y-2">
                                    {files.map((item) => {
                                        const typeInfo = fileTypes[item.type] || fileTypes.other;
                                        const TypeIcon = typeInfo.icon;
                                        
                                        return (
                                            <div 
                                                key={item.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                                    item.status === 'completed' && "bg-green-500/5 border-green-500/30",
                                                    item.status === 'error' && "bg-red-500/5 border-red-500/30",
                                                    item.status === 'pending' && "bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50",
                                                    (item.status === 'uploading' || item.status === 'processing') && "bg-cyan-500/5 border-cyan-500/30"
                                                )}
                                            >
                                                {/* Preview / Icon */}
                                                <div className={cn(
                                                    "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
                                                    !item.preview && typeInfo.color
                                                )}>
                                                    {item.preview ? (
                                                        <img 
                                                            src={item.preview} 
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <TypeIcon className="h-6 w-6" />
                                                    )}
                                                </div>
                                                
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatSize(item.size)}
                                                    </p>
                                                    
                                                    {/* Progress bar */}
                                                    {(item.status === 'uploading' || item.status === 'processing') && (
                                                        <div className="mt-2 space-y-1">
                                                            <Progress value={item.progress} className="h-1" />
                                                            <p className="text-[10px] text-cyan-400">
                                                                {item.status === 'uploading' ? `Uploading... ${item.progress}%` : 'AI processing...'}
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    {/* AI Tags (completed) */}
                                                    {item.status === 'completed' && item.aiTags?.length > 0 && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Sparkles className="h-3 w-3 text-purple-400" />
                                                            {item.aiTags.map((tag, idx) => (
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
                                                    
                                                    {/* Error */}
                                                    {item.status === 'error' && (
                                                        <p className="text-xs text-red-400 mt-1">
                                                            {item.error}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {/* Status / Actions */}
                                                <div className="shrink-0">
                                                    {item.status === 'pending' && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => removeFile(item.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {item.status === 'uploading' && (
                                                        <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                                                    )}
                                                    {item.status === 'processing' && (
                                                        <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
                                                    )}
                                                    {item.status === 'completed' && (
                                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                            <Check className="h-4 w-4 text-green-400" />
                                                        </div>
                                                    )}
                                                    {item.status === 'error' && (
                                                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                                            <AlertCircle className="h-4 w-4 text-red-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-between items-center">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-purple-400" />
                        Files will be auto-tagged by AI
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={startUpload}
                            disabled={files.length === 0 || uploading || stats.pending === 0}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload {stats.pending > 0 ? `(${stats.pending})` : ''}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MediaUploader;
