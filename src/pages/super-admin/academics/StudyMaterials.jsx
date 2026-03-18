/**
 * STUDY MATERIALS HUB
 * Day 11-12 - Academic Intelligence Module
 * 
 * Features:
 * - Digital resources library
 * - Video lectures management
 * - E-books & PDFs repository
 * - Student access tracking
 * - Playlists/Collections
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import { 
  BookOpen, Video, FileText, File, Image, Link, Music, Archive,
  Upload, Plus, Search, Filter, Grid, List, Download, Eye, Trash2,
  Star, StarHalf, Bookmark, BookmarkCheck, Play, Pause, Clock,
  FolderOpen, ChevronRight, RefreshCw, Share2, Edit, MoreVertical,
  BarChart3, Users, Calendar, Globe, Lock, CheckCircle, AlertCircle,
  Youtube, Layers, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { formatDate } from '@/utils/dateUtils';

// Material type icons and colors
const MATERIAL_TYPES = {
  video: { icon: Video, color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700', label: 'Video' },
  pdf: { icon: FileText, color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700', label: 'PDF' },
  ebook: { icon: BookOpen, color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700', label: 'E-Book' },
  document: { icon: File, color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600', label: 'Document' },
  image: { icon: Image, color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700', label: 'Image' },
  audio: { icon: Music, color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700', label: 'Audio' },
  link: { icon: Link, color: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700', label: 'Link' },
  presentation: { icon: Layers, color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700', label: 'Presentation' },
  archive: { icon: Archive, color: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-600', label: 'Archive' }
};

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe },
  { value: 'organization', label: 'Organization Only', icon: Users },
  { value: 'class', label: 'Class Only', icon: BookOpen },
  { value: 'section', label: 'Section Only', icon: Users },
];

export default function StudyMaterials() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  // Tab state
  const [activeTab, setActiveTab] = useState('materials');

  // Data states
  const [materials, setMaterials] = useState([]);
  const [videos, setVideos] = useState([]);
  const [ebooks, setEbooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [stats, setStats] = useState(null);

  // Filter states
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });

  // UI states
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showEbookDialog, setShowEbookDialog] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Form states
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    material_type: 'pdf',
    file_url: '',
    thumbnail_url: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    chapter_id: '',
    visibility: 'class',
    is_downloadable: true,
    status: 'published'
  });

  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    video_type: 'youtube',
    video_url: '',
    youtube_id: '',
    class_id: '',
    subject_id: '',
    chapter_id: '',
    teacher_id: '',
    duration_seconds: 0,
    status: 'published'
  });

  const [newEbook, setNewEbook] = useState({
    title: '',
    description: '',
    author: '',
    publisher: '',
    file_url: '',
    cover_image_url: '',
    class_id: '',
    subject_id: '',
    page_count: 0,
    is_downloadable: false,
    status: 'published'
  });

  // ===========================
  // DATA FETCHING
  // ===========================

  const fetchStats = useCallback(async () => {
    try {
      const params = {};
      if (selectedClass) params.class_id = selectedClass;
      if (selectedSubject) params.subject_id = selectedSubject;

      const { data } = await api.get('/study-materials/stats', { params });
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [selectedClass, selectedSubject]);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (selectedClass) params.class_id = selectedClass;
      if (selectedSection) params.section_id = selectedSection;
      if (selectedSubject) params.subject_id = selectedSubject;
      if (selectedChapter) params.chapter_id = selectedChapter;
      if (materialType) params.material_type = materialType;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const { data } = await api.get('/study-materials', { params });
      if (data.success) {
        setMaterials(data.data || []);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedClass, selectedSection, selectedSubject, selectedChapter, materialType, statusFilter, searchQuery]);

  const fetchVideos = useCallback(async () => {
    try {
      const params = {};
      if (selectedClass) params.class_id = selectedClass;
      if (selectedSubject) params.subject_id = selectedSubject;
      if (selectedChapter) params.chapter_id = selectedChapter;
      if (searchQuery) params.search = searchQuery;

      const { data } = await api.get('/study-materials/videos', { params });
      if (data.success) {
        setVideos(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  }, [selectedClass, selectedSubject, selectedChapter, searchQuery]);

  const fetchEbooks = useCallback(async () => {
    try {
      const params = {};
      if (selectedClass) params.class_id = selectedClass;
      if (selectedSubject) params.subject_id = selectedSubject;
      if (searchQuery) params.search = searchQuery;

      const { data } = await api.get('/study-materials/ebooks', { params });
      if (data.success) {
        setEbooks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch ebooks:', error);
    }
  }, [selectedClass, selectedSubject, searchQuery]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/study-materials/categories');
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchPlaylists = useCallback(async () => {
    try {
      const params = {};
      if (selectedClass) params.class_id = selectedClass;
      if (selectedSubject) params.subject_id = selectedSubject;
      if (selectedChapter) params.chapter_id = selectedChapter;

      const { data } = await api.get('/study-materials/playlists', { params });
      if (data.success) {
        setPlaylists(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  }, [selectedClass, selectedSubject, selectedChapter]);

  const fetchClasses = useCallback(async () => {
    try {
      const { data } = await api.get('/academics/classes');
      if (data.success) {
        setClasses(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }, []);

  const fetchSections = useCallback(async (classId) => {
    try {
      const { data } = await api.get('/academics/sections', { params: { class_id: classId } });
      if (data.success) {
        setSections(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  }, []);

  const fetchSubjects = useCallback(async (classId) => {
    try {
      const { data } = await api.get('/academics/subjects', { params: { class_id: classId } });
      if (data.success) {
        setSubjects(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  }, []);

  const fetchChapters = useCallback(async (subjectId) => {
    try {
      const { data } = await api.get('/curriculum/chapters', { params: { subject_id: subjectId } });
      if (data.success) {
        setChapters(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const { data } = await api.get('/staff', { params: { role: 'teacher', limit: 500 } });
      if (data.success) {
        setTeachers(data.data?.staff || data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    if (selectedBranch?.id) {
      fetchStats();
      fetchCategories();
      fetchClasses();
      fetchTeachers();
    }
  }, [selectedBranch?.id, fetchStats, fetchCategories, fetchClasses, fetchTeachers]);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchMaterials();
      fetchVideos();
      fetchEbooks();
      fetchPlaylists();
    }
  }, [selectedBranch?.id, selectedClass, selectedSubject, selectedChapter, materialType, searchQuery, fetchMaterials, fetchVideos, fetchEbooks, fetchPlaylists]);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
      fetchSubjects(selectedClass);
    } else {
      setSections([]);
      setSubjects([]);
    }
  }, [selectedClass, fetchSections, fetchSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject);
    } else {
      setChapters([]);
    }
  }, [selectedSubject, fetchChapters]);

  // ===========================
  // ACTIONS
  // ===========================

  const handleCreateMaterial = async () => {
    try {
      if (!newMaterial.title || !newMaterial.file_url) {
        toast.error('Please fill in title and file URL');
        return;
      }

      setLoading(true);
      const { data } = await api.post('/study-materials', newMaterial);
      if (data.success) {
        toast.success('Material created successfully');
        setShowUploadDialog(false);
        setNewMaterial({
          title: '',
          description: '',
          material_type: 'pdf',
          file_url: '',
          thumbnail_url: '',
          class_id: '',
          section_id: '',
          subject_id: '',
          chapter_id: '',
          visibility: 'class',
          is_downloadable: true,
          status: 'published'
        });
        fetchMaterials();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to create material:', error);
      toast.error('Failed to create material');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideo = async () => {
    try {
      if (!newVideo.title) {
        toast.error('Please fill in video title');
        return;
      }

      // Extract YouTube ID if URL provided
      if (newVideo.video_type === 'youtube' && newVideo.video_url && !newVideo.youtube_id) {
        const match = newVideo.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (match) {
          newVideo.youtube_id = match[1];
        }
      }

      setLoading(true);
      const { data } = await api.post('/study-materials/videos', newVideo);
      if (data.success) {
        toast.success('Video added successfully');
        setShowVideoDialog(false);
        setNewVideo({
          title: '',
          description: '',
          video_type: 'youtube',
          video_url: '',
          youtube_id: '',
          class_id: '',
          subject_id: '',
          chapter_id: '',
          teacher_id: '',
          duration_seconds: 0,
          status: 'published'
        });
        fetchVideos();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to create video:', error);
      toast.error('Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEbook = async () => {
    try {
      if (!newEbook.title || !newEbook.file_url) {
        toast.error('Please fill in title and file URL');
        return;
      }

      setLoading(true);
      const { data } = await api.post('/study-materials/ebooks', newEbook);
      if (data.success) {
        toast.success('E-book added successfully');
        setShowEbookDialog(false);
        setNewEbook({
          title: '',
          description: '',
          author: '',
          publisher: '',
          file_url: '',
          cover_image_url: '',
          class_id: '',
          subject_id: '',
          page_count: 0,
          is_downloadable: false,
          status: 'published'
        });
        fetchEbooks();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to create ebook:', error);
      toast.error('Failed to add e-book');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      const { data } = await api.delete(`/study-materials/${id}`);
      if (data.success) {
        toast.success('Material deleted');
        fetchMaterials();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete material:', error);
      toast.error('Failed to delete material');
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const { data } = await api.delete(`/study-materials/videos/${id}`);
      if (data.success) {
        toast.success('Video deleted');
        fetchVideos();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      toast.error('Failed to delete video');
    }
  };

  const handleDeleteEbook = async (id) => {
    if (!confirm('Are you sure you want to delete this e-book?')) return;

    try {
      const { data } = await api.delete(`/study-materials/ebooks/${id}`);
      if (data.success) {
        toast.success('E-book deleted');
        fetchEbooks();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete e-book:', error);
      toast.error('Failed to delete e-book');
    }
  };

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || cls?.class_name || '-';
  };

  const getSubjectName = (subjectId) => {
    const sub = subjects.find(s => s.id === subjectId);
    return sub?.name || sub?.subject_name || '-';
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.full_name || teacher?.name || '-';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // ===========================
  // RENDER COMPONENTS
  // ===========================

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Materials</p>
                <p className="text-2xl font-bold">{stats?.totalMaterials || 0}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Video Lectures</p>
                <p className="text-2xl font-bold">{stats?.totalVideos || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(stats?.totalVideoDuration)} total
                </p>
              </div>
              <Video className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">E-Books</p>
                <p className="text-2xl font-bold">{stats?.totalEbooks || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalPages?.toLocaleString() || 0} pages
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Views</p>
                <p className="text-2xl font-bold">{stats?.monthlyViews?.toLocaleString() || 0}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  const renderFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Select value={selectedClass} onValueChange={setSelectedClass}>
        <SelectTrigger>
          <SelectValue placeholder="All Classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Classes</SelectItem>
          {classes.map(cls => (
            <SelectItem key={cls.id} value={cls.id}>
              {cls.name || cls.class_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
        <SelectTrigger>
          <SelectValue placeholder="All Subjects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Subjects</SelectItem>
          {subjects.map(sub => (
            <SelectItem key={sub.id} value={sub.id}>
              {sub.name || sub.subject_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedChapter} onValueChange={setSelectedChapter} disabled={!selectedSubject}>
        <SelectTrigger>
          <SelectValue placeholder="All Chapters" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Chapters</SelectItem>
          {chapters.map(ch => (
            <SelectItem key={ch.id} value={ch.id}>
              {ch.name || ch.chapter_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={materialType} onValueChange={setMaterialType}>
        <SelectTrigger>
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Types</SelectItem>
          {Object.entries(MATERIAL_TYPES).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );

  const renderMaterialsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {materials.map(material => {
        const typeConfig = MATERIAL_TYPES[material.material_type] || MATERIAL_TYPES.document;
        const IconComponent = typeConfig.icon;

        return (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail or Icon */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
                {material.thumbnail_url ? (
                  <img 
                    src={material.thumbnail_url} 
                    alt={material.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <IconComponent className="w-12 h-12 text-gray-400" />
                )}
                <Badge className={`absolute top-2 right-2 ${typeConfig.color}`}>
                  {typeConfig.label}
                </Badge>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{material.title}</h3>
                {material.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {material.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  {material.class_id && <Badge variant="outline">{getClassName(material.class_id)}</Badge>}
                  {material.subject_id && <Badge variant="outline">{getSubjectName(material.subject_id)}</Badge>}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    <span>{material.view_count || 0}</span>
                    <Download className="w-3 h-3 ml-2" />
                    <span>{material.download_count || 0}</span>
                  </div>
                  {material.avg_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span>{material.avg_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </a>
                </Button>
                {material.is_downloadable && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={material.file_url} download>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteMaterial(material.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        );
      })}

      {materials.length === 0 && !loading && (
        <div className="col-span-full text-center py-12">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No materials found</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowUploadDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Material
          </Button>
        </div>
      )}
    </div>
  );

  const renderVideosTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Video className="w-5 h-5 text-red-500" />
          Video Lectures
        </h2>
        <Button onClick={() => setShowVideoDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map(video => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-36 bg-gray-900 flex items-center justify-center relative">
                {video.youtube_id ? (
                  <img 
                    src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Video className="w-12 h-12 text-gray-600" />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-white" />
                </div>
                {video.duration_seconds > 0 && (
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                    {formatDuration(video.duration_seconds)}
                  </Badge>
                )}
                {video.video_type === 'youtube' && (
                  <Youtube className="absolute top-2 right-2 w-6 h-6 text-red-600" />
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                {video.teacher && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {video.teacher.full_name}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span>{video.view_count || 0} views</span>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a 
                    href={video.youtube_id 
                      ? `https://youtube.com/watch?v=${video.youtube_id}`
                      : video.video_url
                    } 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Watch
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteVideo(video.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}

        {videos.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No videos found</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowVideoDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderEbooksTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-500" />
          E-Books Library
        </h2>
        <Button onClick={() => setShowEbookDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add E-Book
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {ebooks.map(ebook => (
          <motion.div
            key={ebook.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                {ebook.cover_image_url ? (
                  <img 
                    src={ebook.cover_image_url}
                    alt={ebook.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-16 h-16 text-blue-400" />
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-2">{ebook.title}</h3>
                {ebook.author && (
                  <p className="text-sm text-muted-foreground mt-1">
                    by {ebook.author}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  <span>{ebook.page_count || 0} pages</span>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a href={ebook.file_url} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="w-4 h-4 mr-1" />
                    Read
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteEbook(ebook.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}

        {ebooks.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No e-books found</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowEbookDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add E-Book
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPlaylistsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-500" />
          Playlists & Collections
        </h2>
        <Button onClick={() => setShowPlaylistDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Playlist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map(playlist => (
          <Card key={playlist.id}>
            <CardHeader>
              <CardTitle className="text-lg">{playlist.title}</CardTitle>
              {playlist.description && (
                <CardDescription>{playlist.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {playlist.items?.length || 0} items
              </div>
              {playlist.is_sequential && (
                <Badge variant="outline" className="mt-2">Sequential</Badge>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Start Learning
              </Button>
            </CardFooter>
          </Card>
        ))}

        {playlists.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No playlists created</p>
          </div>
        )}
      </div>
    </div>
  );

  // ===========================
  // DIALOGS
  // ===========================

  const renderUploadDialog = () => (
    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Study Material</DialogTitle>
          <DialogDescription>Upload or link a new study material</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newMaterial.title}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Material title"
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select 
                value={newMaterial.material_type}
                onValueChange={(value) => setNewMaterial(prev => ({ ...prev, material_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MATERIAL_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={newMaterial.description}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>File URL *</Label>
              <Input
                value={newMaterial.file_url}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, file_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail URL</Label>
              <Input
                value={newMaterial.thumbnail_url}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select 
                value={newMaterial.class_id}
                onValueChange={(value) => setNewMaterial(prev => ({ ...prev, class_id: value, subject_id: '', chapter_id: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name || cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select 
                value={newMaterial.subject_id}
                onValueChange={(value) => setNewMaterial(prev => ({ ...prev, subject_id: value, chapter_id: '' }))}
                disabled={!newMaterial.class_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subjects</SelectItem>
                  {subjects.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name || sub.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select 
                value={newMaterial.visibility}
                onValueChange={(value) => setNewMaterial(prev => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Allow Download</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={newMaterial.is_downloadable}
                  onCheckedChange={(checked) => setNewMaterial(prev => ({ ...prev, is_downloadable: checked }))}
                />
                <span className="text-sm">{newMaterial.is_downloadable ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateMaterial} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add Material
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderVideoDialog = () => (
    <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Video Lecture</DialogTitle>
          <DialogDescription>Add a YouTube video or upload lecture</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newVideo.title}
                onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Video title"
              />
            </div>
            <div className="space-y-2">
              <Label>Video Type</Label>
              <Select 
                value={newVideo.video_type}
                onValueChange={(value) => setNewVideo(prev => ({ ...prev, video_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="upload">Direct Upload</SelectItem>
                  <SelectItem value="url">External URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              {newVideo.video_type === 'youtube' ? 'YouTube URL or Video ID' : 'Video URL'} *
            </Label>
            <Input
              value={newVideo.video_url}
              onChange={(e) => setNewVideo(prev => ({ ...prev, video_url: e.target.value }))}
              placeholder={newVideo.video_type === 'youtube' 
                ? 'https://youtube.com/watch?v=...' 
                : 'https://...'
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={newVideo.description}
              onChange={(e) => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select 
                value={newVideo.class_id}
                onValueChange={(value) => setNewVideo(prev => ({ ...prev, class_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name || cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select 
                value={newVideo.subject_id}
                onValueChange={(value) => setNewVideo(prev => ({ ...prev, subject_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name || sub.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select 
                value={newVideo.teacher_id}
                onValueChange={(value) => setNewVideo(prev => ({ ...prev, teacher_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name || teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Input
                type="number"
                value={newVideo.duration_seconds}
                onChange={(e) => setNewVideo(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowVideoDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateVideo} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderEbookDialog = () => (
    <Dialog open={showEbookDialog} onOpenChange={setShowEbookDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add E-Book</DialogTitle>
          <DialogDescription>Add a new e-book to the library</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newEbook.title}
                onChange={(e) => setNewEbook(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Book title"
              />
            </div>
            <div className="space-y-2">
              <Label>Author</Label>
              <Input
                value={newEbook.author}
                onChange={(e) => setNewEbook(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Author name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={newEbook.description}
              onChange={(e) => setNewEbook(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>File URL *</Label>
              <Input
                value={newEbook.file_url}
                onChange={(e) => setNewEbook(prev => ({ ...prev, file_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input
                value={newEbook.cover_image_url}
                onChange={(e) => setNewEbook(prev => ({ ...prev, cover_image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Publisher</Label>
              <Input
                value={newEbook.publisher}
                onChange={(e) => setNewEbook(prev => ({ ...prev, publisher: e.target.value }))}
                placeholder="Publisher name"
              />
            </div>
            <div className="space-y-2">
              <Label>Page Count</Label>
              <Input
                type="number"
                value={newEbook.page_count}
                onChange={(e) => setNewEbook(prev => ({ ...prev, page_count: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Allow Download</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={newEbook.is_downloadable}
                  onCheckedChange={(checked) => setNewEbook(prev => ({ ...prev, is_downloadable: checked }))}
                />
                <span className="text-sm">{newEbook.is_downloadable ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select 
                value={newEbook.class_id}
                onValueChange={(value) => setNewEbook(prev => ({ ...prev, class_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name || cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select 
                value={newEbook.subject_id}
                onValueChange={(value) => setNewEbook(prev => ({ ...prev, subject_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name || sub.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEbookDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateEbook} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add E-Book
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            Study Materials Hub
          </h1>
          <p className="text-muted-foreground">
            Digital resources library for students and teachers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowVideoDialog(true)}>
            <Video className="w-4 h-4 mr-2" />
            Add Video
          </Button>
          <Button variant="outline" onClick={() => setShowEbookDialog(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Add E-Book
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Material
          </Button>
        </div>
      </div>

      {/* Stats */}
      {renderStatsCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            All Materials
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="ebooks" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            E-Books
          </TabsTrigger>
          <TabsTrigger value="playlists" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Playlists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading materials...</p>
            </div>
          ) : (
            renderMaterialsGrid()
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          {renderVideosTab()}
        </TabsContent>

        <TabsContent value="ebooks" className="mt-6">
          {renderEbooksTab()}
        </TabsContent>

        <TabsContent value="playlists" className="mt-6">
          {renderPlaylistsTab()}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {renderUploadDialog()}
      {renderVideoDialog()}
      {renderEbookDialog()}
    </div>
  );
}
