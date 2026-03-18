/**
 * CLASS ACTIVITIES & DAILY DIARY
 * Day 14 - Academic Intelligence Module
 * 
 * Features:
 * - Daily activities calendar
 * - Activity types management
 * - Student participation tracking
 * - Comments and likes
 * - Analytics dashboard
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
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import {
  Calendar, BookOpen, FileText, Users, Clock, Star, Eye, Heart,
  Plus, Search, Filter, Edit, Trash2, MessageSquare, ChevronLeft, ChevronRight,
  Activity, Bookmark, Pin, Image, Paperclip, Video, Music, File,
  TrendingUp, BarChart3, Award, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { formatDate, formatDateTime, formatTime } from '@/utils/dateUtils';

const ACTIVITY_CATEGORIES = [
  { value: 'academic', label: 'Academic', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'co-curricular', label: 'Co-Curricular', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'sports', label: 'Sports', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'cultural', label: 'Cultural', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
];

const VISIBILITY_OPTIONS = [
  { value: 'students', label: 'Students Only' },
  { value: 'parents', label: 'Parents Only' },
  { value: 'both', label: 'Students & Parents' },
  { value: 'teachers_only', label: 'Teachers Only' }
];

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-700',
  archived: 'bg-slate-100 text-slate-700'
};

const FILE_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  document: File,
  default: Paperclip
};

export default function ClassActivities() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  // Tab state
  const [activeTab, setActiveTab] = useState('activities');

  // Data states
  const [activities, setActivities] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [participation, setParticipation] = useState({ data: [], stats: {} });
  const [calendarData, setCalendarData] = useState({});

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Filter states
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('');
  const [statusFilter, setStatusFilter] = useState('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // UI states
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showParticipationDialog, setShowParticipationDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);

  // Form states
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    detailed_content: '',
    activity_type_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    activity_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    period_number: '',
    visibility: 'both',
    status: 'published',
    is_important: false,
    is_pinned: false,
    tags: []
  });

  const [newType, setNewType] = useState({
    name: '',
    code: '',
    description: '',
    category: 'general',
    icon: 'activity',
    color: '#3B82F6',
    requires_attendance: false,
    requires_grading: false,
    max_points: 10
  });

  // ===========================
  // DATA FETCHING
  // ===========================

  const fetchStats = useCallback(async () => {
    try {
      const params = {};
      if (selectedClass) params.class_id = selectedClass;

      const { data } = await api.get('/class-activities/analytics/dashboard', { params });
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [selectedClass]);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter
      };
      if (selectedClass) params.class_id = selectedClass;
      if (selectedSection) params.section_id = selectedSection;
      if (selectedSubject) params.subject_id = selectedSubject;
      if (selectedActivityType) params.activity_type_id = selectedActivityType;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (searchQuery) params.search = searchQuery;

      const { data } = await api.get('/class-activities', { params });
      if (data.success) {
        setActivities(data.data || []);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedClass, selectedSection, selectedSubject, selectedActivityType, statusFilter, dateFrom, dateTo, searchQuery]);

  const fetchActivityTypes = useCallback(async () => {
    try {
      const { data } = await api.get('/class-activities/types');
      if (data.success) {
        setActivityTypes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch activity types:', error);
    }
  }, []);

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

  const fetchActivityDetails = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/class-activities/${id}`);
      if (data.success) {
        setSelectedActivity(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch activity details:', error);
    }
  }, []);

  const fetchParticipation = useCallback(async (activityId) => {
    try {
      const { data } = await api.get(`/class-activities/${activityId}/participation`);
      if (data.success) {
        setParticipation(data);
      }
    } catch (error) {
      console.error('Failed to fetch participation:', error);
    }
  }, []);

  const fetchCalendarData = useCallback(async () => {
    try {
      const params = {
        month: currentMonth,
        year: currentYear
      };
      if (selectedClass) params.class_id = selectedClass;
      if (selectedSection) params.section_id = selectedSection;

      const { data } = await api.get('/class-activities/calendar', { params });
      if (data.success) {
        setCalendarData(data.data || {});
      }
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
    }
  }, [currentMonth, currentYear, selectedClass, selectedSection]);

  // Initial data load
  useEffect(() => {
    if (selectedBranch?.id) {
      fetchStats();
      fetchActivityTypes();
      fetchClasses();
    }
  }, [selectedBranch?.id, fetchStats, fetchActivityTypes, fetchClasses]);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchActivities();
    }
  }, [selectedBranch?.id, selectedClass, selectedSection, selectedSubject, selectedActivityType, statusFilter, dateFrom, dateTo, searchQuery, pagination.page, fetchActivities]);

  useEffect(() => {
    if (selectedBranch?.id && activeTab === 'calendar') {
      fetchCalendarData();
    }
  }, [selectedBranch?.id, activeTab, currentMonth, currentYear, selectedClass, selectedSection, fetchCalendarData]);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
      fetchSubjects(selectedClass);
    } else {
      setSections([]);
      setSubjects([]);
    }
  }, [selectedClass, fetchSections, fetchSubjects]);

  // ===========================
  // ACTIONS
  // ===========================

  const handleCreateActivity = async () => {
    try {
      if (!newActivity.title || !newActivity.activity_date || !newActivity.class_id) {
        toast.error('Please fill in required fields');
        return;
      }

      setLoading(true);
      const { data } = await api.post('/class-activities', newActivity);
      if (data.success) {
        toast.success('Activity created successfully');
        setShowCreateDialog(false);
        resetActivityForm();
        fetchActivities();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to create activity:', error);
      toast.error('Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const { data } = await api.delete(`/class-activities/${id}`);
      if (data.success) {
        toast.success('Activity deleted');
        fetchActivities();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  const handleViewActivity = async (activity) => {
    await fetchActivityDetails(activity.id);
    setShowActivityDialog(true);
  };

  const handleViewParticipation = async (activity) => {
    setSelectedActivity(activity);
    await fetchParticipation(activity.id);
    setShowParticipationDialog(true);
  };

  const handleToggleLike = async (activityId) => {
    try {
      const { data } = await api.post(`/class-activities/${activityId}/like`);
      if (data.success) {
        fetchActivities();
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleSaveActivityType = async () => {
    try {
      if (!newType.name) {
        toast.error('Name is required');
        return;
      }

      const { data } = await api.post('/class-activities/types', newType);
      if (data.success) {
        toast.success('Activity type saved');
        setShowTypeDialog(false);
        resetTypeForm();
        fetchActivityTypes();
      }
    } catch (error) {
      console.error('Failed to save activity type:', error);
      toast.error('Failed to save activity type');
    }
  };

  const handleUpdateParticipation = async (studentId, updates) => {
    try {
      const { data } = await api.put(`/class-activities/${selectedActivity.id}/participation`, {
        student_id: studentId,
        ...updates
      });
      if (data.success) {
        toast.success('Participation updated');
        fetchParticipation(selectedActivity.id);
      }
    } catch (error) {
      console.error('Failed to update participation:', error);
      toast.error('Failed to update');
    }
  };

  const resetActivityForm = () => {
    setNewActivity({
      title: '',
      description: '',
      detailed_content: '',
      activity_type_id: '',
      class_id: '',
      section_id: '',
      subject_id: '',
      activity_date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      period_number: '',
      visibility: 'both',
      status: 'published',
      is_important: false,
      is_pinned: false,
      tags: []
    });
  };

  const resetTypeForm = () => {
    setNewType({
      name: '',
      code: '',
      description: '',
      category: 'general',
      icon: 'activity',
      color: '#3B82F6',
      requires_attendance: false,
      requires_grading: false,
      max_points: 10
    });
  };

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  const getCategoryColor = (category) => {
    const cat = ACTIVITY_CATEGORIES.find(c => c.value === category);
    return cat?.color || 'bg-gray-100 text-gray-700';
  };

  const getFileIcon = (fileType) => {
    return FILE_ICONS[fileType] || FILE_ICONS.default;
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // ===========================
  // RENDER COMPONENTS
  // ===========================

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Activities</p>
                <p className="text-3xl font-bold text-blue-700">{stats?.totalActivities || 0}</p>
              </div>
              <Activity className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Activity Types</p>
                <p className="text-3xl font-bold text-purple-700">{activityTypes.length}</p>
              </div>
              <Bookmark className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Top Teacher</p>
                <p className="text-lg font-bold text-green-700 truncate">
                  {stats?.topTeachers?.[0]?.name || '-'}
                </p>
              </div>
              <Award className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">This Week</p>
                <p className="text-3xl font-bold text-orange-700">
                  {Object.values(stats?.activitiesByType || {}).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  const renderFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
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

      <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
        <SelectTrigger>
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Types</SelectItem>
          {activityTypes.map(type => (
            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Status</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        placeholder="From Date"
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search activities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Button onClick={() => setShowCreateDialog(true)}>
        <Plus className="w-4 h-4 mr-2" />
        New Activity
      </Button>
    </div>
  );

  const renderActivityList = () => (
    <div className="space-y-4">
      {activities.map((activity) => {
        const typeInfo = activityTypes.find(t => t.id === activity.activity_type_id);

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left - Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {activity.is_pinned && (
                        <Pin className="w-4 h-4 text-orange-500" />
                      )}
                      {activity.is_important && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <h3 className="font-semibold text-lg">{activity.title}</h3>
                      <Badge className={STATUS_COLORS[activity.status]}>
                        {activity.status}
                      </Badge>
                      {typeInfo && (
                        <Badge 
                          style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color, borderColor: typeInfo.color }}
                          variant="outline"
                        >
                          {typeInfo.name}
                        </Badge>
                      )}
                    </div>

                    {activity.description && (
                      <p className="text-muted-foreground mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(activity.activity_date)}
                      </span>
                      {activity.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(activity.start_time)}
                          {activity.end_time && ` - ${formatTime(activity.end_time)}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {activity.class?.name || activity.class?.class_name}
                        {activity.section && ` - ${activity.section.name || activity.section.section_name}`}
                      </span>
                      {activity.teacher && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {activity.teacher.full_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right - Stats & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {activity.views_count || 0}
                      </span>
                      <button
                        onClick={() => handleToggleLike(activity.id)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${activity.likes_count > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                        {activity.likes_count || 0}
                      </button>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {activity._comments_count?.[0]?.count || 0}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewActivity(activity)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewParticipation(activity)}>
                        <Users className="w-4 h-4 mr-1" />
                        Attendance
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteActivity(activity.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                {activity.attachments && activity.attachments.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {activity.attachments.slice(0, 3).map((att, idx) => {
                      const FileIcon = getFileIcon(att.file_type);
                      return (
                        <Badge key={idx} variant="outline" className="flex items-center gap-1">
                          <FileIcon className="w-3 h-3" />
                          {att.file_name}
                        </Badge>
                      );
                    })}
                    {activity.attachments.length > 3 && (
                      <Badge variant="outline">+{activity.attachments.length - 3} more</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {activities.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No activities found</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Activity
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Empty cells for days before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 h-24" />);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayActivities = calendarData[dateStr] || [];
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div
          key={day}
          className={`p-2 h-24 border rounded-lg overflow-hidden ${isToday ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
        >
          <div className={`font-medium text-sm ${isToday ? 'text-blue-700' : ''}`}>{day}</div>
          <div className="space-y-1 mt-1 overflow-y-auto max-h-16">
            {dayActivities.slice(0, 2).map((act, idx) => (
              <div
                key={idx}
                className="text-xs truncate p-1 rounded"
                style={{ backgroundColor: act.activity_type?.color + '20', color: act.activity_type?.color || '#666' }}
              >
                {act.title}
              </div>
            ))}
            {dayActivities.length > 2 && (
              <div className="text-xs text-muted-foreground">+{dayActivities.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{monthNames[currentMonth - 1]} {currentYear}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentMonth === 1) {
                    setCurrentMonth(12);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentMonth(new Date().getMonth() + 1);
                  setCurrentYear(new Date().getFullYear());
                }}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentMonth === 12) {
                    setCurrentMonth(1);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-medium text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderActivityTypes = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activity Types</h3>
        <Button onClick={() => setShowTypeDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activityTypes.map((type) => (
          <Card key={type.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: type.color + '20' }}
                >
                  <Activity className="w-5 h-5" style={{ color: type.color }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{type.name}</h4>
                  <p className="text-sm text-muted-foreground">{type.code}</p>
                </div>
                <Badge className={getCategoryColor(type.category)}>
                  {type.category}
                </Badge>
              </div>
              {type.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{type.description}</p>
              )}
              <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
                {type.requires_attendance && (
                  <Badge variant="outline" className="text-xs">Attendance</Badge>
                )}
                {type.requires_grading && (
                  <Badge variant="outline" className="text-xs">Grading ({type.max_points} pts)</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCreateDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Activity / Diary Entry</DialogTitle>
          <DialogDescription>Add a new class activity or daily diary entry</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newActivity.title}
                onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Activity title"
              />
            </div>
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select
                value={newActivity.activity_type_id}
                onValueChange={(value) => setNewActivity(prev => ({ ...prev, activity_type_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={newActivity.description}
              onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Detailed Content</Label>
            <Textarea
              value={newActivity.detailed_content}
              onChange={(e) => setNewActivity(prev => ({ ...prev, detailed_content: e.target.value }))}
              placeholder="Detailed activity content"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select
                value={newActivity.class_id}
                onValueChange={(value) => {
                  setNewActivity(prev => ({ ...prev, class_id: value, section_id: '', subject_id: '' }));
                  if (value) {
                    fetchSections(value);
                    fetchSubjects(value);
                  }
                }}
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
              <Label>Section (Optional)</Label>
              <Select
                value={newActivity.section_id}
                onValueChange={(value) => setNewActivity(prev => ({ ...prev, section_id: value }))}
                disabled={!newActivity.class_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sections</SelectItem>
                  {sections.map(sec => (
                    <SelectItem key={sec.id} value={sec.id}>
                      {sec.name || sec.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Activity Date *</Label>
              <Input
                type="date"
                value={newActivity.activity_date}
                onChange={(e) => setNewActivity(prev => ({ ...prev, activity_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={newActivity.start_time}
                onChange={(e) => setNewActivity(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={newActivity.end_time}
                onChange={(e) => setNewActivity(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={newActivity.visibility}
                onValueChange={(value) => setNewActivity(prev => ({ ...prev, visibility: value }))}
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
              <Label>Status</Label>
              <Select
                value={newActivity.status}
                onValueChange={(value) => setNewActivity(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={newActivity.is_important}
                onCheckedChange={(checked) => setNewActivity(prev => ({ ...prev, is_important: checked }))}
              />
              <Label className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                Mark as Important
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newActivity.is_pinned}
                onCheckedChange={(checked) => setNewActivity(prev => ({ ...prev, is_pinned: checked }))}
              />
              <Label className="flex items-center gap-1">
                <Pin className="w-4 h-4 text-orange-500" />
                Pin to Top
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetActivityForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleCreateActivity} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Activity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderParticipationDialog = () => (
    <Dialog open={showParticipationDialog} onOpenChange={setShowParticipationDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Participation - {selectedActivity?.title}</DialogTitle>
          <DialogDescription>
            {participation.stats.participated || 0} of {participation.stats.total || 0} participated
          </DialogDescription>
        </DialogHeader>

        {/* Stats Bar */}
        <div className="flex gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{participation.stats.participated || 0}</p>
            <p className="text-sm text-muted-foreground">Participated</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{participation.stats.absent || 0}</p>
            <p className="text-sm text-muted-foreground">Absent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{participation.stats.partial || 0}</p>
            <p className="text-sm text-muted-foreground">Partial</p>
          </div>
          {participation.stats.avgScore > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{participation.stats.avgScore.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Avg Score</p>
            </div>
          )}
        </div>

        <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
          {participation.data.map(p => (
            <Card key={p.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {p.student?.photo_url ? (
                      <img src={p.student.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Users className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{p.student?.first_name} {p.student?.last_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.student?.admission_no} | Roll: {p.student?.roll_no}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={p.participation_status}
                    onValueChange={(value) => handleUpdateParticipation(p.student_id, { participation_status: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="participated">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Present
                        </span>
                      </SelectItem>
                      <SelectItem value="absent">
                        <span className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-500" />
                          Absent
                        </span>
                      </SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="exempted">Exempted</SelectItem>
                    </SelectContent>
                  </Select>
                  {p.points_earned !== null && (
                    <Badge className="bg-blue-100 text-blue-700">
                      {p.points_earned} pts
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderTypeDialog = () => (
    <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Activity Type</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newType.name}
                onChange={(e) => setNewType(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Type name"
              />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={newType.code}
                onChange={(e) => setNewType(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Short code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={newType.description}
              onChange={(e) => setNewType(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newType.category}
                onValueChange={(value) => setNewType(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={newType.color}
                onChange={(e) => setNewType(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={newType.requires_attendance}
                onCheckedChange={(checked) => setNewType(prev => ({ ...prev, requires_attendance: checked }))}
              />
              <Label>Requires Attendance</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newType.requires_grading}
                onCheckedChange={(checked) => setNewType(prev => ({ ...prev, requires_grading: checked }))}
              />
              <Label>Requires Grading</Label>
            </div>
          </div>

          {newType.requires_grading && (
            <div className="space-y-2">
              <Label>Max Points</Label>
              <Input
                type="number"
                value={newType.max_points}
                onChange={(e) => setNewType(prev => ({ ...prev, max_points: parseInt(e.target.value) || 10 }))}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowTypeDialog(false); resetTypeForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleSaveActivityType}>
            <Plus className="w-4 h-4 mr-2" />
            Save Type
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
            Class Activities & Daily Diary
          </h1>
          <p className="text-muted-foreground">
            Track daily activities, events, and student participation
          </p>
        </div>
      </div>

      {/* Stats */}
      {renderStatsCards()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="activities">
            <Activity className="w-4 h-4 mr-2" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="types">
            <Bookmark className="w-4 h-4 mr-2" />
            Activity Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          {renderFilters()}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading activities...</p>
            </div>
          ) : (
            renderActivityList()
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          {renderCalendar()}
        </TabsContent>

        <TabsContent value="types">
          {renderActivityTypes()}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {renderCreateDialog()}
      {renderParticipationDialog()}
      {renderTypeDialog()}
    </div>
  );
}
