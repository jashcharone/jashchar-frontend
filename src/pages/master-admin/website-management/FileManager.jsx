/**
 * ============================================================
 * PLATFORM FILE MANAGER - MODERN UI REWRITE
 * Jashchar ERP - Master Admin Only
 * ============================================================
 * 
 * "Computer/OS-like" Interface
 * Split Pane Layout | Visual Navigation | Rich Context
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { 
    Loader2, Trash2, Download, Upload, Search, 
    Folder, FolderPlus, Home, ChevronRight, Grid, List as ListIcon,
    MoreVertical, RefreshCw, HardDrive, Archive, RotateCcw,
    Eye, History, FileText, Image as ImageIcon, Video, File, Music,
    Filter, X, Calendar, Tag, FolderOpen, Info, Clock, User,
    ChevronLeft, BarChart3, Star, Clock3, Cloud, LayoutGrid, Monitor,
    Database, Table2 as SheetIcon, ExternalLink
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

const API_BASE = '/platform-files';

// Improved Category Config with Gradients & Colors
const CATEGORY_CONFIG = {
    'legal': { icon: FileText, color: 'text-red-600', bg: 'bg-red-100', gradient: 'from-red-500 to-red-600' },
    'contract': { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-500 to-blue-600' },
    'school-onboarding': { icon: Folder, color: 'text-emerald-600', bg: 'bg-emerald-100', gradient: 'from-emerald-500 to-emerald-600' },
    'backup': { icon: HardDrive, color: 'text-purple-600', bg: 'bg-purple-100', gradient: 'from-purple-500 to-purple-600' },
    'report': { icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-100', gradient: 'from-orange-500 to-orange-600' },
    'invoice': { icon: FileText, color: 'text-teal-600', bg: 'bg-teal-100', gradient: 'from-teal-500 to-teal-600' },
    'media': { icon: ImageIcon, color: 'text-pink-600', bg: 'bg-pink-100', gradient: 'from-pink-500 to-pink-600' },
    'template': { icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100', gradient: 'from-indigo-500 to-indigo-600' },
    'misc': { icon: File, color: 'text-slate-600', bg: 'bg-slate-100', gradient: 'from-slate-500 to-slate-600' },
};

const FileManager = () => {
    const { toast } = useToast();
    
    // State
    const [files, setFiles] = useState([]);
    const [virtualFolders, setVirtualFolders] = useState([]); // New state for folders
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [currentStatus, setCurrentStatus] = useState('active');
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 }); // Higher limit for desktop feel
    
    // Filters & Navigation
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentFolder, setCurrentFolder] = useState('/');
    
    // UI State
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewFile, setPreviewFile] = useState(null); // For Universal Preview Modal
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    // Modals
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isMoveOpen, setIsMoveOpen] = useState(false);
    
    // Drag & Drop State
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverFolder, setDragOverFolder] = useState(null);
    
    // Selection State (for multi-select)
    const [selectedFiles, setSelectedFiles] = useState([]);
    
    // Forms
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadCategory, setUploadCategory] = useState('misc');
    const [uploadTags, setUploadTags] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [renameValue, setRenameValue] = useState('');
    
    // Details Data
    const [fileVersions, setFileVersions] = useState([]);
    const [fileAuditLog, setFileAuditLog] = useState([]);
    const [detailsTab, setDetailsTab] = useState('info'); // info, versions, audit

    // Stats
    const [stats, setStats] = useState(null);

    // Custom Context Menu State
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, file: null });

    // ============================================================
    // API CALLS
    // ============================================================

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                status: currentStatus,
            });
            
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            if (searchQuery) params.append('search', searchQuery);
            if (currentFolder !== '/') params.append('folder', currentFolder);

            const response = await api.get(`${API_BASE}?${params.toString()}`);
            
            if (response.data.success) {
                setFiles(response.data.data);
                if (response.data.folders) setVirtualFolders(response.data.folders);
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }

        } catch (error) {
            console.error('Error fetching files:', error);
            // toast({ variant: 'destructive', title: 'Error', description: 'Failed to load files' }); // Silently fail on init to avoid spam
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, currentStatus, selectedCategory, searchQuery, currentFolder]);

    const fetchCategories = async () => {
        try {
            const response = await api.get(`${API_BASE}/categories`);
            if (response.data.success) setCategories(response.data.data);
        } catch (error) { console.error(error); }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get(`${API_BASE}/stats`);
            if (response.data.success) setStats(response.data.data);
        } catch (error) { console.error(error); }
    };

    const fetchFileDetails = async (fileId) => {
        try {
            const [versionsRes, auditRes] = await Promise.all([
                api.get(`${API_BASE}/${fileId}/versions`),
                api.get(`${API_BASE}/${fileId}/audit-log`),
            ]);
            
            if (versionsRes.data.success) setFileVersions(versionsRes.data.data);
            if (auditRes.data.success) setFileAuditLog(auditRes.data.data);
        } catch (error) { console.error(error); }
    };

    // ============================================================
    // EFFECTS
    // ============================================================

    useEffect(() => {
        fetchCategories();
        fetchStats();
    }, []);

    useEffect(() => {
        const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [contextMenu]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    useEffect(() => {
        if (selectedFile) fetchFileDetails(selectedFile.id);
    }, [selectedFile]);

    // ============================================================
    // ACTIONS
    // ============================================================

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('category', uploadCategory);
            formData.append('folder', currentFolder);
            formData.append('description', uploadDescription);
            if (uploadTags) formData.append('tags', JSON.stringify(uploadTags.split(',').map(t => t.trim()).filter(Boolean)));

            const response = await api.post(API_BASE, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            if (response.data.success) {
                toast({ title: 'Success', description: 'File uploaded successfully' });
                setIsUploadOpen(false);
                resetUploadForm();
                fetchFiles();
                fetchStats();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.response?.data?.message });
        } finally { setUploading(false); }
    };

    const handleDownload = async (file) => {
        try {
            const response = await api.get(`${API_BASE}/${file.id}/download`);
            if (response.data.success) window.open(response.data.data.url, '_blank');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Download failed' });
        }
    };

    const handleArchive = async (file) => {
        try {
            const response = await api.put(`${API_BASE}/${file.id}/archive`);
            if (response.data.success) {
                toast({ title: 'Archived', description: 'File moved to archive' });
                fetchFiles();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to archive' });
        }
    };

    const handleRestore = async (file) => {
        try {
            const response = await api.put(`${API_BASE}/${file.id}/restore`);
            if (response.data.success) {
                toast({ title: 'Restored', description: 'File restored' });
                fetchFiles();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to restore' });
        }
    };

    const handleDelete = async (file) => {
        if (!confirm(`Permanently delete "${file.original_file_name}"?`)) return;
        try {
            const response = await api.delete(`${API_BASE}/${file.id}`);
            if (response.data.success) {
                toast({ title: 'Deleted', description: 'File permanently deleted' });
                fetchFiles();
                fetchStats();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Delete failed' });
        }
    };


    const handleContextMenu = (e, file) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent native browser context menu
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            file
        });
    };

    const handleExportSchoolData = async () => {
        if (!confirm('Generate detailed school report? This may take a moment.')) return;
        setLoading(true);
        try {
            // 1. Fetch all schools
            const response = await api.get('/schools');
            if (response.data.success && response.data.data) {
                const schools = response.data.data;
                
                // 2. Generate CSV Content
                const headers = ['School ID', 'Name', 'Contact Email', 'Phone', 'Address', 'Status', 'Domain Type', 'Created At'];
                const rows = schools.map(s => [
                    s.id,
                    `"${s.name || ''}"`,
                    s.contact_email || '',
                    s.contact_number || '', // Assuming standard field names, will be handled gracefully if missing
                    `"${s.address || ''}"`,
                    s.status,
                    s.domain_type,
                    new Date(s.created_at).toLocaleDateString()
                ]);
                
                const csvContent = [
                    headers.join(','),
                    ...rows.map(r => r.join(','))
                ].join('\n');

                // 3. Create File Object
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const fileName = `School_Data_Report_${new Date().toISOString().split('T')[0]}.csv`;
                const file = new File([blob], fileName, { type: 'text/csv' });

                // 4. Upload to "Reports" category automatically
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', 'report');
                formData.append('folder', '/System Reports');
                formData.append('description', 'Auto-generated detailed school contact report');
                
                // Ensure folder exists first (optional but good practice)
                await api.post(`${API_BASE}/folders`, { path: '/System Reports' }).catch(() => {});

                const uploadRes = await api.post(API_BASE, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

                if (uploadRes.data.success) {
                    toast({ 
                        title: 'Report Generated', 
                        description: `Saved as ${fileName} in /System Reports`,
                        action: <Button variant="outline" size="sm" onClick={() => window.open(uploadRes.data.data.thumbnail_url || '', '_blank')}>Open</Button>
                    });
                    
                    // Navigate to reports if not there
                    if (currentFolder !== '/System Reports') {
                        setCurrentFolder('/System Reports');
                        setSelectedCategory('report');
                    } else {
                        fetchFiles();
                    }
                }
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate school data report.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        const folderPath = currentFolder === '/' ? `/${newFolderName.trim()}` : `${currentFolder}/${newFolderName.trim()}`;
        try {
            await api.post(`${API_BASE}/folders`, { path: folderPath });
            toast({ title: 'Folder Created', description: folderPath });
            setIsCreateFolderOpen(false);
            setNewFolderName('');
            // Refresh to show new folder
            fetchFiles();
        } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to create folder' }); }
    };

    // Move file to folder (drag & drop or manual)
    const handleMoveFile = async (fileId, targetFolder) => {
        try {
            await api.put(`${API_BASE}/${fileId}/move`, { folder: targetFolder });
            toast({ title: 'File Moved', description: `Moved to ${targetFolder}` });
            fetchFiles();
        } catch (error) { 
            toast({ variant: 'destructive', title: 'Move Failed', description: error.message }); 
        }
    };

    // Drag handlers
    const handleDragStart = (e, item, type) => {
        setDraggedItem({ ...item, type });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, type }));
    };

    const handleDragOver = (e, folder) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverFolder(folder?.path || folder?.name);
    };

    const handleDragLeave = () => {
        setDragOverFolder(null);
    };

    const handleDrop = async (e, targetFolder) => {
        e.preventDefault();
        setDragOverFolder(null);
        
        if (!draggedItem || draggedItem.type !== 'file') return;
        
        const targetPath = targetFolder?.path || targetFolder;
        if (targetPath) {
            await handleMoveFile(draggedItem.id, targetPath);
        }
        setDraggedItem(null);
    };

    const resetUploadForm = () => {
        setUploadFile(null);
        setUploadCategory('misc');
        setUploadTags('');
        setUploadDescription('');
    };

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };



    const getFileIcon = (file) => {
        const mime = file.mime_type?.toLowerCase() || '';
        
        // 1. Image Thumbnail
        if (mime.startsWith('image/') && file.thumbnail_url) {
            return (
                <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex items-center justify-center">
                    <img 
                        src={file.thumbnail_url} 
                        alt={file.original_file_name} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        loading="lazy"
                    />
                </div>
            );
        }

        // 2. Video Thumbnail (Preview)
        if (mime.startsWith('video/') && file.thumbnail_url) {
            return (
                <div className="relative w-full h-full bg-black rounded overflow-hidden group border border-slate-800">
                    <video 
                        src={file.thumbnail_url} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        muted
                        loop
                        playsInline
                        onMouseOver={e => e.target.play().catch(() => {})}
                        onMouseOut={e => e.target.pause()}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity bg-black/20">
                         <div className="bg-white/30 backdrop-blur rounded-full p-2">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                         </div>
                    </div>
                </div>
            );
        }

        // 3. Audio Thumbnail (Visualizer)
        if (mime.startsWith('audio/') && file.thumbnail_url) {
            return (
                <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded overflow-hidden flex items-center justify-center group">
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <div className="flex items-end gap-1 h-8">
                            {[1,3,2,4,2,3,1,2,5,3].map((h, i) => (
                                <div key={i} className={`w-1 bg-white rounded-t animate-pulse`} style={{ height: `${h * 20}%`, animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                    </div>
                    <div className="z-10 bg-white/20 backdrop-blur-md rounded-full p-3 group-hover:scale-110 transition-transform">
                        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                    </div>
                    <div className="absolute bottom-1 right-2 text-[10px] font-bold text-white/80">AUDIO</div>
                </div>
            );
        }

        // 4. PDF Thumbnail - Static icon (no iframe due to CSP)
        if (mime === 'application/pdf') {
            return (
                <div className="relative w-full h-full bg-gradient-to-b from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded overflow-hidden flex flex-col items-center justify-center border border-red-200 dark:border-red-800">
                    <FileText className="h-8 w-8 text-red-600 mb-1" />
                    <div className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">PDF</div>
                </div>
            );
        }

        // 5. Text/Code Thumbnail - Static icon (no iframe due to CSP)
        if ((mime.startsWith('text/') || mime === 'application/json')) {
            return (
                <div className="relative w-full h-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded overflow-hidden flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
                    <FileText className="h-8 w-8 text-slate-600 dark:text-slate-400 mb-1" />
                    <div className="bg-slate-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">TXT</div>
                </div>
            );
        }

        // 3. Fallback Icons for other types
        if (mime.startsWith('image/')) return <ImageIcon className="h-full w-full text-blue-500" />;
        if (mime.startsWith('video/')) return <Video className="h-full w-full text-red-500" />;
        if (file.file_extension === 'pdf') {
            return (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/30 p-2">
                     <FileText className="h-10 w-10 text-red-600 mb-1" />
                     <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">PDF</span>
                </div>
            );
        }
        if (['csv', 'xlsx', 'xls'].includes(file.file_extension)) {
            return (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-900/10 rounded border border-emerald-100 dark:border-emerald-900/30 p-2">
                     <SheetIcon className="h-10 w-10 text-emerald-600 mb-1" />
                     <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">{file.file_extension}</span>
                </div>
            );
        }

        const config = CATEGORY_CONFIG[file.category] || CATEGORY_CONFIG.misc;
        const Icon = config.icon;
        return <Icon className={`h-full w-full ${config.color.split(' ')[0]}`} />;
    };


    // ============================================================
    // RENDER UI
    // ============================================================

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-100px)] w-full gap-4 p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 overflow-hidden box-border">
                
                {/* 1. SIDEBAR NAVIGATION ("Finder" style) */}
                <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-card rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
                        <div className="flex items-center gap-2 text-primary font-bold text-lg">
                            <Cloud className="h-6 w-6" />
                            <span>Cloud Drive</span>
                        </div>
                    </div>
                    
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-6">
                            {/* Favorites */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">Favorites</h3>
                                <nav className="space-y-1">
                                    <button 
                                        onClick={() => { setCurrentFolder('/'); setSelectedCategory('all'); setCurrentStatus('active'); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentFolder === '/' && selectedCategory === 'all' && currentStatus === 'active' ? 'bg-primary text-primary-foreground shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                    >
                                        <Home className="h-4 w-4" /> All Files
                                    </button>
                                    <button 
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all font-sans"
                                    >
                                        <Clock3 className="h-4 w-4 text-orange-400" /> Recent
                                    </button>
                                    <button 
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <Star className="h-4 w-4 text-yellow-400" /> Starred
                                    </button>
                                </nav>
                            </div>

                            {/* Locations / Categories */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">Locations</h3>
                                <div className="space-y-1">
                                    {categories.map(cat => {
                                        const config = CATEGORY_CONFIG[cat.slug] || CATEGORY_CONFIG.misc;
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => { setSelectedCategory(cat.slug); setCurrentStatus('active'); }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat.slug ? `bg-gradient-to-r ${config.gradient} text-white shadow-md` : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                            >
                                                <config.icon className={`h-4 w-4 ${selectedCategory === cat.slug ? 'text-white' : config.color.split(' ')[0]}`} />
                                                {cat.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>


                            {/* Tools */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">System Tools</h3>
                                <button 
                                    onClick={handleExportSchoolData}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all font-sans mb-1"
                                >
                                    <Database className="h-4 w-4 text-emerald-600" /> Export School Data
                                </button>
                                <button 
                                    onClick={() => setCurrentStatus('archived')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentStatus === 'archived' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                >
                                    <Archive className="h-4 w-4" /> Recycle Bin
                                </button>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Storage Stats Footer */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-500">Storage</span>
                            <span className="text-xs font-bold">{stats ? `${Math.round(stats.totalSizeMB)} MB` : '...'}</span>
                        </div>
                        <Progress value={stats ? (stats.totalSizeMB / 1024) * 100 : 0} className="h-2 bg-slate-200" indicatorClassName="bg-primary" />
                        <p className="text-[10px] text-muted-foreground mt-2 text-right">1 GB Limit</p>
                    </div>
                </aside>

                {/* 2. MAIN CONTENT AREA */}
                <main className="flex-1 flex flex-col bg-white dark:bg-card rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                    
                    {/* Top Toolbar (OS Style) */}
                    <header className="h-16 border-b flex items-center px-4 gap-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-10">
                        {/* Nav Controls */}
                        <div className="flex items-center gap-1 text-slate-400">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={currentFolder === '/'} onClick={() => {
                                const parts = currentFolder.split('/').filter(Boolean);
                                parts.pop();
                                setCurrentFolder(parts.length ? '/' + parts.join('/') : '/');
                            }}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Breadcrumbs / Path Bar */}
                        <div className="flex-1 bg-slate-100 dark:bg-slate-900 h-9 rounded-md flex items-center px-3 gap-2 overflow-hidden border border-transparent focus-within:border-primary transition-all">
                            <Monitor className="h-4 w-4 text-slate-400" />
                            <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                <span className="hover:bg-white/50 px-1 rounded cursor-pointer" onClick={() => setCurrentFolder('/')}>Root</span>
                                {currentFolder.split('/').filter(Boolean).map((part, i, arr) => (
                                    <React.Fragment key={i}>
                                        <ChevronRight className="h-3 w-3 mx-1 text-slate-400" />
                                        <span 
                                            className="hover:bg-white/50 px-1 rounded cursor-pointer"
                                            onClick={() => setCurrentFolder('/' + arr.slice(0, i + 1).join('/'))}
                                        >
                                            {part}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative w-48 lg:w-64 hidden sm:block">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 bg-slate-100 dark:bg-slate-900 border-none focus-visible:ring-1"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 border-l pl-4">
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                size="icon" className="h-9 w-9" onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                size="icon" className="h-9 w-9" onClick={() => setViewMode('list')}
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="hidden sm:flex gap-2" onClick={() => setIsCreateFolderOpen(true)}>
                                <FolderPlus className="h-4 w-4" /> <span className="hidden lg:inline">New Folder</span>
                            </Button>
                            <Button size="sm" className="hidden sm:flex gap-2" onClick={() => setIsUploadOpen(true)}>
                                <Upload className="h-4 w-4" /> <span className="hidden lg:inline">Upload</span>
                            </Button>
                        </div>
                    </header>

                    {/* File Area - Supports Drop */}
                    <div 
                        className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50 p-6" 
                        onContextMenu={(e) => e.preventDefault()}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                        onDrop={(e) => {
                            e.preventDefault();
                            // Handle file drop from desktop
                            if (e.dataTransfer.files?.length > 0) {
                                setUploadFile(e.dataTransfer.files[0]);
                                setIsUploadOpen(true);
                            }
                        }}
                    >
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-pulse">
                                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                                <p>Loading files...</p>
                            </div>
                        ) : files.length === 0 && virtualFolders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                                <FolderOpen className="h-24 w-24 mb-4 opacity-50 stroke-1" />
                                <h3 className="text-xl font-semibold mb-1">This folder is empty</h3>
                                <p className="text-sm">Drag and drop files here or click Upload</p>
                                <div className="flex gap-2 mt-6">
                                    <Button variant="outline" onClick={() => setIsCreateFolderOpen(true)}>
                                        <FolderPlus className="h-4 w-4 mr-2" /> New Folder
                                    </Button>
                                    <Button onClick={() => setIsUploadOpen(true)}>
                                        <Upload className="h-4 w-4 mr-2" /> Upload File
                                    </Button>
                                </div>
                            </div>

                        ) : (
                            <div className={`
                                ${viewMode === 'grid' 
                                    ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4' 
                                    : 'flex flex-col gap-2'
                                }
                            `}>
                                {/* Folder Rendering - Windows 11 Style with Drop Target */}
                                {virtualFolders.map(folder => (
                                    <div
                                        key={folder.path}
                                        onDoubleClick={() => { setCurrentFolder(folder.path); setSearchQuery(''); }}
                                        onDragOver={(e) => handleDragOver(e, folder)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, folder)}
                                        className={`
                                            group relative transition-all duration-150 cursor-pointer select-none
                                            ${viewMode === 'grid' 
                                                ? 'flex flex-col items-center p-2 rounded-lg hover:bg-blue-100/50 dark:hover:bg-blue-900/20' 
                                                : 'flex items-center p-3 gap-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg'
                                            }
                                            ${dragOverFolder === folder.path ? 'ring-2 ring-blue-500 bg-blue-100/80 dark:bg-blue-900/40 scale-105' : ''}
                                        `}
                                    >
                                        {/* Windows 11-style folder icon */}
                                        <div className={`relative ${viewMode === 'grid' ? 'w-20 h-16' : 'h-10 w-10'} flex items-center justify-center`}>
                                            {/* Folder Back */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-amber-400 to-amber-500 rounded-sm shadow-md" 
                                                 style={{ clipPath: 'polygon(0 15%, 35% 15%, 40% 0, 100% 0, 100% 100%, 0 100%)' }} />
                                            {/* Folder Front */}
                                            <div className="absolute bottom-0 left-0 right-0 h-[75%] bg-gradient-to-b from-amber-300 to-amber-400 rounded-sm shadow-sm flex items-center justify-center overflow-hidden">
                                                <div className="grid grid-cols-2 gap-0.5 p-1 opacity-60">
                                                    <div className="w-3 h-3 bg-white/40 rounded-[2px]"></div>
                                                    <div className="w-3 h-3 bg-white/40 rounded-[2px]"></div>
                                                    <div className="w-3 h-3 bg-white/40 rounded-[2px]"></div>
                                                    <div className="w-3 h-3 bg-white/40 rounded-[2px]"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className={`text-xs text-center text-slate-700 dark:text-slate-300 truncate w-full mt-1 ${viewMode === 'grid' ? 'max-w-[90px]' : ''}`} title={folder.name}>
                                            {folder.name}
                                        </p>
                                    </div>
                                ))}

                                {/* File Rendering - Windows 11 Style with Drag Support */}
                                {files.map((file) => {
                                    const isImage = file.mime_type?.startsWith('image/');
                                    const isVideo = file.mime_type?.startsWith('video/');

                                    return (
                                        <div 
                                            key={file.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, file, 'file')}
                                            onDragEnd={() => setDraggedItem(null)}
                                            onClick={() => { setSelectedFile(file); setIsDetailsOpen(true); }}
                                            onDoubleClick={() => setPreviewFile(file)}
                                            onContextMenu={(e) => handleContextMenu(e, file)}
                                            className={`
                                                group relative transition-all duration-150 cursor-pointer select-none
                                                ${viewMode === 'grid' 
                                                    ? 'flex flex-col items-center p-2 rounded-lg hover:bg-blue-100/50 dark:hover:bg-blue-900/20' 
                                                    : 'flex items-center p-3 gap-4 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg'
                                                }
                                                ${draggedItem?.id === file.id ? 'opacity-50 scale-95' : ''}
                                            `}
                                        >
                                            {/* Thumbnail Area - Large like Windows */}
                                            <div className={`
                                                relative flex items-center justify-center overflow-hidden rounded-md
                                                ${viewMode === 'grid' ? 'w-20 h-20' : 'h-10 w-10 shrink-0'}
                                                ${!isImage && !isVideo ? 'bg-slate-100 dark:bg-slate-800' : ''}
                                            `}>
                                                {/* Image Thumbnail - Full coverage like Windows */}
                                                {isImage && file.thumbnail_url ? (
                                                    <img 
                                                        src={file.thumbnail_url} 
                                                        alt={file.original_file_name}
                                                        className="w-full h-full object-cover rounded-md shadow-sm border border-slate-200 dark:border-slate-700"
                                                        loading="lazy"
                                                    />
                                                ) : isVideo && file.thumbnail_url ? (
                                                    <div className="relative w-full h-full bg-black rounded-md overflow-hidden shadow-sm">
                                                        <video 
                                                            src={file.thumbnail_url}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                            onMouseOver={e => e.target.play().catch(() => {})}
                                                            onMouseOut={e => e.target.pause()}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 group-hover:bg-black/10 transition-colors">
                                                            <div className="bg-white/80 rounded-full p-1.5">
                                                                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-slate-800 border-b-[5px] border-b-transparent ml-0.5"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`${viewMode === 'grid' ? 'w-12 h-12' : 'w-8 h-8'}`}>
                                                        {getFileIcon(file)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* File Name - Below thumbnail like Windows */}
                                            <p className={`
                                                text-xs text-center text-slate-700 dark:text-slate-300 mt-1 leading-tight
                                                ${viewMode === 'grid' ? 'max-w-[90px] line-clamp-2 break-all' : 'flex-1 text-left truncate'}
                                            `} title={file.original_file_name}>
                                                {file.original_file_name}
                                            </p>

                                            {/* List View - Show size */}
                                            {viewMode === 'list' && (
                                                <span className="text-xs text-slate-400">{formatFileSize(file.file_size_bytes)}</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bottom Status Bar */}
                    <footer className="h-9 border-t bg-slate-50 dark:bg-slate-950 flex items-center justify-between px-4 text-[10px] md:text-xs text-slate-500 font-mono">
                        <div className="flex gap-4">
                            <span>{files.length} ITEMS</span>
                            <span>{currentFolder}</span>
                        </div>
                        <div className="flex gap-4">
                            <span>MASTER ADMIN SESSION</span>
                            <span className="uppercase">{currentStatus} MODE</span>
                        </div>
                    </footer>
                </main>
            </div>

            {/* ========== DIALOGS & SHEETS ========== */}

            {/* Upload Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload File</DialogTitle>
                        <DialogDescription>Upload to {currentFolder}</DialogDescription>
                    </DialogHeader>
                    {/* ... (Kept existing form structure but simplified for brevity of rewrite, logic passed fully) ... */}
                    <form onSubmit={handleUpload} className="space-y-4 pt-4">
                        <div 
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${uploadFile ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'}`}
                            onClick={() => document.getElementById('file-upload').click()}
                        >
                            {uploadFile ? (
                                <div className="flex flex-col items-center gap-2">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <span className="font-medium text-sm">{uploadFile.name}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload className="h-8 w-8" />
                                    <span>Click to browse</span>
                                </div>
                            )}
                            <input id="file-upload" type="file" className="hidden" onChange={(e) => setUploadFile(e.target.files[0])} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <Input value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="tag1, tag2" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Optional description" />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={!uploadFile || uploading}>
                                {uploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Upload'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Folder Dialog - Windows Style */}
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderPlus className="h-5 w-5 text-amber-500" />
                            Create New Folder
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="w-12 h-10 relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-400 to-amber-500 rounded-sm" 
                                     style={{ clipPath: 'polygon(0 15%, 35% 15%, 40% 0, 100% 0, 100% 100%, 0 100%)' }} />
                                <div className="absolute bottom-0 left-0 right-0 h-[75%] bg-gradient-to-b from-amber-300 to-amber-400 rounded-sm" />
                            </div>
                            <div className="flex-1">
                                <Input 
                                    value={newFolderName} 
                                    onChange={(e) => setNewFolderName(e.target.value)} 
                                    placeholder="New folder"
                                    className="font-medium"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Location: <span className="font-mono">{currentFolder}</span>
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsCreateFolderOpen(false); setNewFolderName(''); }}>Cancel</Button>
                        <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create Folder</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* File Details Sheet - Enhanced */}
            <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <SheetContent className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col">
                    {selectedFile && (
                        <>
                            {/* Header Image/Icon */}
                            <div className="h-40 bg-slate-100 dark:bg-slate-900 flex items-center justify-center border-b">
                                <div className="h-20 w-20">{getFileIcon(selectedFile)}</div>
                            </div>
                            
                            <div className="p-6 flex-1 overflow-auto">
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold truncate mb-1">{selectedFile.original_file_name}</h2>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary" className="rounded-md">{selectedFile.category}</Badge>
                                        <Badge variant="outline" className="rounded-md">{selectedFile.mime_type}</Badge>
                                    </div>
                                </div>

                                <Tabs value={detailsTab} onValueChange={setDetailsTab} className="w-full">
                                    <TabsList className="w-full grid grid-cols-3 mb-4">
                                        <TabsTrigger value="info">Details</TabsTrigger>
                                        <TabsTrigger value="versions">Versions</TabsTrigger>
                                        <TabsTrigger value="audit">Activity</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="info" className="space-y-6">
                                        <div className="space-y-4 border rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div><p className="text-slate-500">Size</p><p className="font-medium">{formatFileSize(selectedFile.file_size_bytes)}</p></div>
                                                <div><p className="text-slate-500">Created</p><p className="font-medium">{new Date(selectedFile.created_at).toLocaleDateString()}</p></div>
                                                <div><p className="text-slate-500">Uploaded By</p><p className="font-medium">Master Admin</p></div>
                                                <div><p className="text-slate-500">Status</p><p className="font-medium capitalize">{selectedFile.status}</p></div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            <Button className="flex-1" onClick={() => handleDownload(selectedFile)}>
                                                <Download className="mr-2 h-4 w-4" /> Download
                                            </Button>
                                            {selectedFile.status === 'active' ? (
                                                <Button variant="outline" onClick={() => handleArchive(selectedFile)}>
                                                    <Archive className="mr-2 h-4 w-4" /> Archive
                                                </Button>
                                            ) : (
                                                <Button variant="outline" onClick={() => handleRestore(selectedFile)}>
                                                    <RotateCcw className="mr-2 h-4 w-4" /> Restore
                                                </Button>
                                            )}
                                        </div>
                                        
                                        <Separator className="my-4" />
                                        <Button variant="destructive" className="w-full" onClick={() => handleDelete(selectedFile)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                                        </Button>
                                    </TabsContent>

                                    {/* ... Uses existing logic for Versions/Audit but simpler jsx ... */}
                                    <TabsContent value="versions">
                                        <ScrollArea className="h-[400px] pr-4">
                                            {fileVersions.map(v => (
                                                <div key={v.id} className="mb-3 p-3 border rounded-lg hover:bg-slate-50">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-sm">v{v.version_number}</span>
                                                        <span className="text-xs text-muted-foreground">{new Date(v.uploaded_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs">{formatFileSize(v.file_size_bytes)}</p>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="audit">
                                         <ScrollArea className="h-[400px] pr-4">
                                            {fileAuditLog.map(logs => (
                                                <div key={logs.id} className="mb-3 p-3 border rounded-lg text-sm border-l-4 border-l-primary">
                                                    <div className="flex justify-between">
                                                        <span className="font-semibold capitalize">{logs.action}</span>
                                                        <span className="text-xs text-slate-400">{new Date(logs.performed_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{logs.performer_ip_address || 'System'}</p>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* Universal Preview Modal */}
            <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
                <DialogContent 
                    className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 bg-slate-100 dark:bg-slate-900 overflow-hidden"
                    aria-describedby={undefined}
                >
                    <DialogHeader className="absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden [clip:rect(0,0,0,0)] border-0 whitespace-nowrap">
                        <DialogTitle>File Preview: {previewFile?.original_file_name || 'File'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-card border-b h-14 shrink-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                             <div className="h-8 w-8 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                                 {previewFile?.mime_type?.includes('image') ? <ImageIcon className="h-5 w-5" /> : 
                                  previewFile?.mime_type?.includes('video') ? <Video className="h-5 w-5" /> :
                                  previewFile?.mime_type?.includes('pdf') ? <FileText className="h-5 w-5 text-red-500" /> : <File className="h-5 w-5" />}
                             </div>
                             <div className="flex flex-col overflow-hidden">
                                 <h3 className="font-semibold text-sm truncate max-w-[400px]">{previewFile?.original_file_name}</h3>
                                 <p className="text-xs text-muted-foreground">{formatFileSize(previewFile?.file_size_bytes)} • {previewFile?.mime_type}</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleDownload(previewFile)}>
                                <Download className="h-4 w-4 mr-2" /> Download
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full h-full bg-slate-200/50 dark:bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
                         {previewFile && (
                             <>
                                {previewFile.mime_type?.startsWith('image/') && (
                                     <img src={previewFile.thumbnail_url} className="max-h-full max-w-full object-contain shadow-lg rounded-lg" alt="Preview" />
                                )}
                                {previewFile.mime_type?.startsWith('video/') && (
                                     <video src={previewFile.thumbnail_url} controls className="max-h-full max-w-full rounded-lg shadow-lg bg-black" />
                                )}
                                {previewFile.mime_type === 'application/pdf' && (
                                     <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
                                         <div className="flex flex-col items-center gap-4 mb-8">
                                             <div className="w-24 h-32 bg-gradient-to-b from-red-500 to-red-600 rounded-lg shadow-lg flex items-center justify-center">
                                                 <FileText className="h-12 w-12 text-white" />
                                             </div>
                                             <div className="text-center">
                                                 <h3 className="font-semibold text-lg">{previewFile.original_file_name}</h3>
                                                 <p className="text-sm text-muted-foreground">{formatFileSize(previewFile.file_size_bytes)} • PDF Document</p>
                                             </div>
                                         </div>
                                         <div className="flex gap-3">
                                             <Button size="lg" onClick={() => window.open(previewFile.thumbnail_url, '_blank')}>
                                                 <ExternalLink className="h-5 w-5 mr-2" /> Open in New Tab
                                             </Button>
                                             <Button size="lg" variant="outline" onClick={() => handleDownload(previewFile)}>
                                                 <Download className="h-5 w-5 mr-2" /> Download
                                             </Button>
                                         </div>
                                     </div>
                                )}
                                {(previewFile.mime_type?.startsWith('text/') || previewFile.mime_type?.includes('json') || previewFile.mime_type?.includes('javascript')) && (
                                     <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
                                         <div className="flex flex-col items-center gap-4 mb-8">
                                             <div className="w-24 h-32 bg-gradient-to-b from-slate-500 to-slate-600 rounded-lg shadow-lg flex items-center justify-center">
                                                 <FileText className="h-12 w-12 text-white" />
                                             </div>
                                             <div className="text-center">
                                                 <h3 className="font-semibold text-lg">{previewFile.original_file_name}</h3>
                                                 <p className="text-sm text-muted-foreground">{formatFileSize(previewFile.file_size_bytes)} • Text File</p>
                                             </div>
                                         </div>
                                         <div className="flex gap-3">
                                             <Button size="lg" onClick={() => window.open(previewFile.thumbnail_url, '_blank')}>
                                                 <ExternalLink className="h-5 w-5 mr-2" /> Open in New Tab
                                             </Button>
                                             <Button size="lg" variant="outline" onClick={() => handleDownload(previewFile)}>
                                                 <Download className="h-5 w-5 mr-2" /> Download
                                             </Button>
                                         </div>
                                     </div>
                                )}
                                {previewFile.mime_type?.startsWith('audio/') && (
                                     <div className="w-full max-w-md bg-white dark:bg-card p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6">
                                         <div className="h-32 w-32 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 animate-pulse">
                                             <Music className="h-16 w-16" />
                                         </div>
                                         <audio src={previewFile.thumbnail_url} controls className="w-full" />
                                     </div>
                                )}
                             </>
                         )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Context Menu (Custom) - Windows 11 Style */}
            {contextMenu.visible && (
                <div 
                    className="fixed z-50 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1 backdrop-blur-sm"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                     <div className="px-3 py-2 border-b text-xs font-semibold text-slate-500 truncate bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl">
                        {contextMenu.file?.original_file_name}
                    </div>
                    <button onClick={() => { setPreviewFile(contextMenu.file); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3">
                        <Eye className="h-4 w-4 text-blue-500" /> <span className="font-medium">Open Preview</span>
                    </button>
                    <button onClick={() => { setIsDetailsOpen(true); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
                        <Info className="h-4 w-4" /> Properties
                    </button>
                    <div className="border-t my-1"></div>
                    <button onClick={() => { handleDownload(contextMenu.file); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
                        <Download className="h-4 w-4" /> Download
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.host + contextMenu.file.thumbnail_url); toast({ title: 'Copied Link' }); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
                        <ExternalLink className="h-4 w-4" /> Copy Link
                    </button>
                    <div className="border-t my-1"></div>
                    {/* Move To submenu hint */}
                    <div className="px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wide">Organize</div>
                    {virtualFolders.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 justify-between">
                                    <span className="flex items-center gap-3"><FolderOpen className="h-4 w-4" /> Move to...</span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start" className="w-48">
                                <DropdownMenuLabel>Select Folder</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {currentFolder !== '/' && (
                                    <DropdownMenuItem onClick={() => { handleMoveFile(contextMenu.file.id, '/'); setContextMenu({ ...contextMenu, visible: false }); }}>
                                        <Home className="h-4 w-4 mr-2" /> Root (/)
                                    </DropdownMenuItem>
                                )}
                                {virtualFolders.filter(f => f.path !== contextMenu.file?.virtual_folder_path).map(folder => (
                                    <DropdownMenuItem key={folder.path} onClick={() => { handleMoveFile(contextMenu.file.id, folder.path); setContextMenu({ ...contextMenu, visible: false }); }}>
                                        <Folder className="h-4 w-4 mr-2 text-amber-500" /> {folder.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {contextMenu.file?.status === 'active' ? (
                        <button onClick={() => { handleArchive(contextMenu.file); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
                            <Archive className="h-4 w-4" /> Archive
                        </button>
                    ) : (
                         <button onClick={() => { handleRestore(contextMenu.file); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
                             <RotateCcw className="h-4 w-4" /> Restore
                         </button>
                    )}
                     <div className="border-t my-1"></div>
                    <button onClick={() => { handleDelete(contextMenu.file); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20 flex items-center gap-3">
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                </div>
            )}
        </DashboardLayout>
    );
};


export default FileManager;
