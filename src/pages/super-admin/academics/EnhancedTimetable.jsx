/**
 * ENHANCED TIMETABLE SYSTEM
 * Day 9-10 - Academic Intelligence Module
 * 
 * Features:
 * - Visual timetable grid (days × periods)
 * - Settings configuration
 * - Subject requirements setup
 * - Teacher availability matrix
 * - Auto-generation with constraint satisfaction
 * - Conflict detection & resolution
 * - Version management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import { 
  Calendar, Clock, Settings, Wand2, Users, BookOpen, AlertTriangle,
  ChevronRight, Plus, Save, Trash2, Download, Upload, CheckCircle,
  XCircle, RefreshCw, Play, Pause, Eye, EyeOff, Building2, GraduationCap,
  Layers, Grid, List, Zap, Sparkles, Copy, History, MousePointer,
  ArrowRight, Check, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';

// Day names
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Colors for subjects
const SUBJECT_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
  'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
  'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-700',
  'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700',
  'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
  'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
  'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700',
  'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700',
];

// Break/Lunch slot styling
const BREAK_STYLE = 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600';
const LUNCH_STYLE = 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700';

export default function EnhancedTimetable() {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  // Tab state
  const [activeTab, setActiveTab] = useState('timetables');

  // Settings state
  const [settings, setSettings] = useState({
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    periods_per_day: 8,
    period_duration_minutes: 40,
    first_period_start: '08:30',
    break_after_period: 4,
    break_duration_minutes: 15,
    lunch_after_period: 6,
    lunch_duration_minutes: 30,
    allow_teacher_clash: false,
    allow_room_clash: false,
    max_continuous_periods: 3,
  });

  // Timetables state
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [timetableSlots, setTimetableSlots] = useState([]);

  // Classes and subjects
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Requirements & Availability
  const [requirements, setRequirements] = useState([]);
  const [teacherAvailability, setTeacherAvailability] = useState([]);

  // Conflicts
  const [conflicts, setConflicts] = useState([]);

  // Stats
  const [stats, setStats] = useState(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Filters
  const [viewMode, setViewMode] = useState('class'); // 'class' or 'teacher'
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // New timetable form
  const [newTimetable, setNewTimetable] = useState({
    name: '',
    class_id: '',
    section_id: '',
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
  });

  // Subject color map
  const [subjectColorMap, setSubjectColorMap] = useState({});

  // ===========================
  // DATA FETCHING
  // ===========================

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/enhanced-timetable/settings');
      if (response?.success && response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, []);

  const fetchTimetables = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedClass) params.class_id = selectedClass;
      if (selectedSection) params.section_id = selectedSection;

      const response = await api.get('/enhanced-timetable', { params });
      if (response?.success) {
        setTimetables(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch timetables:', error);
      toast.error('Failed to load timetables');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSection]);

  const fetchTimetableDetails = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/enhanced-timetable/${id}`);
      if (response?.success) {
        setSelectedTimetable(response.data.timetable);
        setTimetableSlots(response.data.slots || []);

        // Build subject color map
        const colorMap = {};
        let colorIndex = 0;
        (response.data.slots || []).forEach(slot => {
          if (slot.subject_id && !colorMap[slot.subject_id]) {
            colorMap[slot.subject_id] = SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length];
            colorIndex++;
          }
        });
        setSubjectColorMap(colorMap);
      }
    } catch (error) {
      console.error('Failed to fetch timetable details:', error);
      toast.error('Failed to load timetable details');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get('/academics/classes');
      const items = response?.data || (Array.isArray(response) ? response : []);
      setClasses(items);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }, []);

  const fetchSections = useCallback(async (classId) => {
    try {
      const response = await api.get('/academics/sections', { params: { class_id: classId } });
      const items = response?.data || (Array.isArray(response) ? response : []);
      setSections(items);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  }, []);

  const fetchSubjects = useCallback(async (classId) => {
    try {
      const response = await api.get('/academics/subjects', { params: { class_id: classId } });
      const items = response?.data || (Array.isArray(response) ? response : []);
      setSubjects(items);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await api.get('/staff', { params: { role: 'teacher', limit: 500 } });
      const items = response?.data?.staff || response?.data || (Array.isArray(response) ? response : []);
      setTeachers(items);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await api.get('/enhanced-timetable/rooms');
      if (response?.success) {
        setRooms(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  }, []);

  const fetchRequirements = useCallback(async () => {
    try {
      const params = {};
      if (selectedClass) params.class_id = selectedClass;
      if (selectedSection) params.section_id = selectedSection;

      const response = await api.get('/enhanced-timetable/requirements', { params });
      if (response?.success) {
        setRequirements(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch requirements:', error);
    }
  }, [selectedClass, selectedSection]);

  const fetchTeacherAvailability = useCallback(async () => {
    try {
      const params = {};
      if (selectedTeacher) params.teacher_id = selectedTeacher;

      const response = await api.get('/enhanced-timetable/availability', { params });
      if (response?.success) {
        setTeacherAvailability(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch teacher availability:', error);
    }
  }, [selectedTeacher]);

  const fetchConflicts = useCallback(async () => {
    try {
      const params = { status: 'detected' };
      if (selectedTimetable) params.timetable_id = selectedTimetable.id;

      const response = await api.get('/enhanced-timetable/conflicts', { params });
      if (response?.success) {
        setConflicts(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch conflicts:', error);
    }
  }, [selectedTimetable]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/enhanced-timetable/stats');
      if (response?.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    if (selectedBranch?.id) {
      fetchSettings();
      fetchClasses();
      fetchTeachers();
      fetchRooms();
      fetchStats();
    }
  }, [selectedBranch?.id, fetchSettings, fetchClasses, fetchTeachers, fetchRooms, fetchStats]);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchTimetables();
      fetchRequirements();
    }
  }, [selectedBranch?.id, selectedClass, selectedSection, fetchTimetables, fetchRequirements]);

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
    if (selectedBranch?.id) {
      fetchTeacherAvailability();
    }
  }, [selectedBranch?.id, selectedTeacher, fetchTeacherAvailability]);

  useEffect(() => {
    if (selectedTimetable) {
      fetchConflicts();
    }
  }, [selectedTimetable, fetchConflicts]);

  // ===========================
  // ACTIONS
  // ===========================

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const response = await api.post('/enhanced-timetable/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimetable = async () => {
    try {
      if (!newTimetable.name || !newTimetable.class_id || !newTimetable.section_id) {
        toast.error('Please fill in all required fields');
        return;
      }

      setLoading(true);
      const response = await api.post('/enhanced-timetable', newTimetable);
      toast.success('Timetable created successfully');
      setShowCreateDialog(false);
      setNewTimetable({
        name: '',
        class_id: '',
        section_id: '',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: '',
      });
      fetchTimetables();
    } catch (error) {
      console.error('Failed to create timetable:', error);
      toast.error('Failed to create timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!selectedClass || !selectedSection) {
      toast.error('Please select a class and section first');
      return;
    }

    try {
      setGenerating(true);
      setGenerationProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      const response = await api.post('/enhanced-timetable/generate', {
        class_id: selectedClass,
        section_id: selectedSection,
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      setTimeout(() => {
        setGenerating(false);
        setGenerationProgress(0);
        toast.success(`Timetable generated! Quality Score: ${response?.quality_score || response?.data?.quality_score || 0}%`);
        fetchTimetables();
        const ttId = response?.timetable?.id || response?.data?.timetable_id;
        if (ttId) {
          fetchTimetableDetails(ttId);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to generate timetable:', error);
      toast.error(error.response?.data?.error || 'Failed to generate timetable');
      setGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleActivateTimetable = async (id) => {
    try {
      setLoading(true);
      const response = await api.post(`/enhanced-timetable/${id}/activate`);
      toast.success('Timetable activated successfully');
      fetchTimetables();
      fetchTimetableDetails(id);
    } catch (error) {
      console.error('Failed to activate timetable:', error);
      toast.error('Failed to activate timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return;

    try {
      setLoading(true);
      const response = await api.delete(`/enhanced-timetable/${id}`);
      toast.success('Timetable deleted successfully');
      setSelectedTimetable(null);
      setTimetableSlots([]);
      fetchTimetables();
    } catch (error) {
      console.error('Failed to delete timetable:', error);
      toast.error('Failed to delete timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (day, period) => {
    if (!selectedTimetable) {
      toast.error('Please select a timetable first');
      return;
    }

    const existingSlot = timetableSlots.find(
      s => s.day_of_week === day && s.period_number === period
    );

    setSelectedSlot({
      day_of_week: day,
      period_number: period,
      subject_id: existingSlot?.subject_id || '',
      teacher_id: existingSlot?.teacher_id || '',
      room_id: existingSlot?.room_id || '',
      slot_type: existingSlot?.slot_type || 'regular',
      id: existingSlot?.id || null,
    });
    setShowSlotDialog(true);
  };

  const handleSaveSlot = async () => {
    try {
      setLoading(true);
      const response = await api.post('/enhanced-timetable/slots', {
        timetable_id: selectedTimetable.id,
        ...selectedSlot,
      });

      toast.success('Slot saved successfully');
      setShowSlotDialog(false);
      fetchTimetableDetails(selectedTimetable.id);
      fetchConflicts();
    } catch (error) {
      console.error('Failed to save slot:', error);
      toast.error('Failed to save slot');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSlot = async () => {
    try {
      setLoading(true);
      const response = await api.delete('/enhanced-timetable/slots/clear', {
        data: {
          timetable_id: selectedTimetable.id,
          day_of_week: selectedSlot.day_of_week,
          period_number: selectedSlot.period_number,
        }
      });

      toast.success('Slot cleared');
      setShowSlotDialog(false);
      fetchTimetableDetails(selectedTimetable.id);
    } catch (error) {
      console.error('Failed to clear slot:', error);
      toast.error('Failed to clear slot');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRequirement = async (requirement) => {
    try {
      const response = await api.post('/enhanced-timetable/requirements', requirement);
      toast.success('Requirement saved');
      fetchRequirements();
    } catch (error) {
      console.error('Failed to save requirement:', error);
      toast.error('Failed to save requirement');
    }
  };

  const handleSaveAvailability = async (availability) => {
    try {
      const response = await api.post('/enhanced-timetable/availability', availability);
      toast.success('Availability saved');
      fetchTeacherAvailability();
    } catch (error) {
      console.error('Failed to save availability:', error);
      toast.error('Failed to save availability');
    }
  };

  const handleResolveConflict = async (conflictId) => {
    try {
      const response = await api.patch(`/enhanced-timetable/conflicts/${conflictId}/resolve`);
      toast.success('Conflict resolved');
      fetchConflicts();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      toast.error('Failed to resolve conflict');
    }
  };

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  const getSlotForCell = (day, period) => {
    return timetableSlots.find(
      s => s.day_of_week === day && s.period_number === period
    );
  };

  const isBreakPeriod = (period) => {
    return settings.break_after_period && period === settings.break_after_period + 0.5;
  };

  const isLunchPeriod = (period) => {
    return settings.lunch_after_period && period === settings.lunch_after_period + 0.5;
  };

  const getPeriodTimes = () => {
    const times = [];
    let currentTime = settings.first_period_start;

    for (let i = 1; i <= settings.periods_per_day; i++) {
      const startTime = currentTime;
      const [hours, minutes] = startTime.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + settings.period_duration_minutes;
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

      times.push({ period: i, start: startTime, end: endTime });

      // Update current time
      currentTime = endTime;

      // Add break time
      if (settings.break_after_period && i === settings.break_after_period) {
        const breakEnd = hours * 60 + minutes + settings.period_duration_minutes + settings.break_duration_minutes;
        currentTime = `${Math.floor(breakEnd / 60).toString().padStart(2, '0')}:${(breakEnd % 60).toString().padStart(2, '0')}`;
      }

      // Add lunch time
      if (settings.lunch_after_period && i === settings.lunch_after_period) {
        const lunchEnd = hours * 60 + minutes + settings.period_duration_minutes + settings.lunch_duration_minutes;
        currentTime = `${Math.floor(lunchEnd / 60).toString().padStart(2, '0')}:${(lunchEnd % 60).toString().padStart(2, '0')}`;
      }
    }

    return times;
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || subject?.subject_name || 'Unknown Subject';
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.full_name || teacher?.name || 'Unknown Teacher';
  };

  const getRoomName = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room?.name || room?.room_number || 'No Room';
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || cls?.class_name || 'Unknown Class';
  };

  const getSectionName = (sectionId) => {
    const sec = sections.find(s => s.id === sectionId);
    return sec?.name || sec?.section_name || 'Unknown Section';
  };

  // ===========================
  // RENDER COMPONENTS
  // ===========================

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Timetables</p>
                <p className="text-2xl font-bold">{stats?.total_timetables || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Timetables</p>
                <p className="text-2xl font-bold">{stats?.active_timetables || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unresolved Conflicts</p>
                <p className="text-2xl font-bold">{stats?.unresolved_conflicts || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Quality Score</p>
                <p className="text-2xl font-bold">{stats?.avg_quality_score?.toFixed(1) || '-'}%</p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  const renderTimetableGrid = () => {
    const periodTimes = getPeriodTimes();
    const workingDays = settings.working_days || DAYS.slice(0, 6);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid className="w-5 h-5" />
                {selectedTimetable ? selectedTimetable.name : 'Select a Timetable'}
              </CardTitle>
              {selectedTimetable && (
                <CardDescription>
                  {getClassName(selectedTimetable.class_id)} - {getSectionName(selectedTimetable.section_id)}
                  {selectedTimetable.is_active && (
                    <Badge variant="success" className="ml-2">Active</Badge>
                  )}
                </CardDescription>
              )}
            </div>
            {selectedTimetable && (
              <div className="flex gap-2">
                {!selectedTimetable.is_active && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleActivateTimetable(selectedTimetable.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Activate
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteTimetable(selectedTimetable.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedTimetable ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 w-20">Period</th>
                    <th className="border p-2 bg-gray-50 w-20">Time</th>
                    {workingDays.map(day => (
                      <th key={day} className="border p-2 bg-gray-50 min-w-[120px]">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodTimes.map(({ period, start, end }) => (
                    <React.Fragment key={period}>
                      <tr>
                        <td className="border p-2 text-center font-medium bg-gray-50">
                          P{period}
                        </td>
                        <td className="border p-2 text-center text-sm text-muted-foreground bg-gray-50">
                          {start} - {end}
                        </td>
                        {workingDays.map(day => {
                          const slot = getSlotForCell(day, period);
                          const colorClass = slot?.subject_id 
                            ? subjectColorMap[slot.subject_id] || SUBJECT_COLORS[0]
                            : '';
                          const isBreak = slot?.slot_type === 'break';
                          const isLunch = slot?.slot_type === 'lunch';

                          return (
                            <td 
                              key={`${day}-${period}`}
                              className={`border p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                                isBreak ? BREAK_STYLE : isLunch ? LUNCH_STYLE : ''
                              }`}
                              onClick={() => handleSlotClick(day, period)}
                            >
                              {slot && (
                                <div className={`p-2 rounded text-sm ${colorClass} border`}>
                                  {isBreak ? (
                                    <div className="text-center font-medium">Break</div>
                                  ) : isLunch ? (
                                    <div className="text-center font-medium">Lunch</div>
                                  ) : (
                                    <>
                                      <div className="font-medium truncate">
                                        {getSubjectName(slot.subject_id)}
                                      </div>
                                      <div className="text-xs truncate opacity-75">
                                        {getTeacherName(slot.teacher_id)}
                                      </div>
                                      {slot.room_id && (
                                        <div className="text-xs truncate opacity-60">
                                          {getRoomName(slot.room_id)}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                              {!slot && (
                                <div className="p-2 text-center text-muted-foreground text-sm">
                                  <Plus className="w-4 h-4 mx-auto" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Break row */}
                      {settings.break_after_period === period && (
                        <tr className="bg-gray-100">
                          <td colSpan={2 + workingDays.length} className="border p-2 text-center font-medium text-gray-600">
                            Break ({settings.break_duration_minutes} min)
                          </td>
                        </tr>
                      )}
                      {/* Lunch row */}
                      {settings.lunch_after_period === period && (
                        <tr className="bg-amber-50">
                          <td colSpan={2 + workingDays.length} className="border p-2 text-center font-medium text-amber-700">
                            Lunch ({settings.lunch_duration_minutes} min)
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a timetable from the list or create a new one</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTimetablesList = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <List className="w-5 h-5" />
            Timetables
          </CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Timetable
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select value={selectedClass || '__all__'} onValueChange={(v) => setSelectedClass(v === '__all__' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Classes</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name || cls.class_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedSection || '__all__'} 
            onValueChange={(v) => setSelectedSection(v === '__all__' ? '' : v)}
            disabled={!selectedClass}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Sections</SelectItem>
              {sections.map(sec => (
                <SelectItem key={sec.id} value={sec.id}>
                  {sec.name || sec.section_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto-generate button */}
        {selectedClass && selectedSection && (
          <div className="mb-4">
            <Button 
              onClick={handleAutoGenerate}
              disabled={generating}
              className="w-full"
              variant="secondary"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating... {Math.round(generationProgress)}%
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Auto-Generate Timetable
                </>
              )}
            </Button>
            {generating && (
              <Progress value={generationProgress} className="mt-2" />
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading timetables...</p>
          </div>
        ) : timetables.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No timetables found. Create or generate one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {timetables.map(tt => (
              <div
                key={tt.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedTimetable?.id === tt.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => fetchTimetableDetails(tt.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tt.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getClassName(tt.class_id)} - {getSectionName(tt.section_id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Version {tt.version} | Quality: {tt.quality_score || '-'}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tt.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSettingsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Timetable Settings
        </CardTitle>
        <CardDescription>Configure default timetable parameters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Periods Per Day</Label>
            <Input
              type="number"
              min="1"
              max="12"
              value={settings.periods_per_day}
              onChange={(e) => setSettings(prev => ({ ...prev, periods_per_day: parseInt(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Period Duration (minutes)</Label>
            <Input
              type="number"
              min="20"
              max="60"
              value={settings.period_duration_minutes}
              onChange={(e) => setSettings(prev => ({ ...prev, period_duration_minutes: parseInt(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>First Period Start Time</Label>
            <Input
              type="time"
              value={settings.first_period_start}
              onChange={(e) => setSettings(prev => ({ ...prev, first_period_start: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Break After Period</Label>
            <Input
              type="number"
              min="1"
              max={settings.periods_per_day}
              value={settings.break_after_period || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, break_after_period: parseInt(e.target.value) || null }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Break Duration (minutes)</Label>
            <Input
              type="number"
              min="5"
              max="30"
              value={settings.break_duration_minutes}
              onChange={(e) => setSettings(prev => ({ ...prev, break_duration_minutes: parseInt(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Lunch After Period</Label>
            <Input
              type="number"
              min="1"
              max={settings.periods_per_day}
              value={settings.lunch_after_period || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, lunch_after_period: parseInt(e.target.value) || null }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Lunch Duration (minutes)</Label>
            <Input
              type="number"
              min="15"
              max="60"
              value={settings.lunch_duration_minutes}
              onChange={(e) => setSettings(prev => ({ ...prev, lunch_duration_minutes: parseInt(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Continuous Periods</Label>
            <Input
              type="number"
              min="1"
              max="5"
              value={settings.max_continuous_periods}
              onChange={(e) => setSettings(prev => ({ ...prev, max_continuous_periods: parseInt(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Working Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <Badge
                  key={day}
                  variant={settings.working_days?.includes(day) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const days = settings.working_days || [];
                    if (days.includes(day)) {
                      setSettings(prev => ({
                        ...prev,
                        working_days: days.filter(d => d !== day)
                      }));
                    } else {
                      setSettings(prev => ({
                        ...prev,
                        working_days: [...days, day]
                      }));
                    }
                  }}
                >
                  {day.slice(0, 3)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            <Switch
              checked={!settings.allow_teacher_clash}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allow_teacher_clash: !checked }))}
            />
            <Label>Prevent Teacher Clashes</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={!settings.allow_room_clash}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allow_room_clash: !checked }))}
            />
            <Label>Prevent Room Clashes</Label>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleSaveSettings} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderRequirementsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Subject Period Requirements
        </CardTitle>
        <CardDescription>Configure how many periods each subject needs per week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
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

          <Select 
            value={selectedSection} 
            onValueChange={setSelectedSection}
            disabled={!selectedClass}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map(sec => (
                <SelectItem key={sec.id} value={sec.id}>
                  {sec.name || sec.section_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClass && selectedSection ? (
          <div className="space-y-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Subject</th>
                  <th className="text-center p-2">Periods/Week</th>
                  <th className="text-center p-2">Max/Day</th>
                  <th className="text-center p-2">Preferred Time</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(subject => {
                  const req = requirements.find(r => r.subject_id === subject.id) || {};
                  return (
                    <tr key={subject.id} className="border-b">
                      <td className="p-2 font-medium">{subject.name || subject.subject_name}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          className="w-20 mx-auto"
                          value={req.periods_per_week || ''}
                          onChange={(e) => handleSaveRequirement({
                            ...req,
                            subject_id: subject.id,
                            class_id: selectedClass,
                            section_id: selectedSection,
                            periods_per_week: parseInt(e.target.value)
                          })}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          className="w-20 mx-auto"
                          value={req.max_periods_per_day || ''}
                          onChange={(e) => handleSaveRequirement({
                            ...req,
                            subject_id: subject.id,
                            class_id: selectedClass,
                            section_id: selectedSection,
                            max_periods_per_day: parseInt(e.target.value)
                          })}
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={req.preferred_time || '__any__'}
                          onValueChange={(value) => handleSaveRequirement({
                            ...req,
                            subject_id: subject.id,
                            class_id: selectedClass,
                            section_id: selectedSection,
                            preferred_time: value === '__any__' ? null : value
                          })}
                        >
                          <SelectTrigger className="w-32 mx-auto">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__any__">Any</SelectItem>
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={req.periods_per_week ? 'success' : 'secondary'}>
                          {req.periods_per_week ? 'Set' : 'Not Set'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a class and section to configure subject requirements</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAvailabilityTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Teacher Availability
        </CardTitle>
        <CardDescription>Set teacher preferences and unavailability</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-64">
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

        {selectedTeacher ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50">Period</th>
                  {(settings.working_days || DAYS.slice(0, 6)).map(day => (
                    <th key={day} className="border p-2 bg-gray-50">{day.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: settings.periods_per_day }, (_, i) => i + 1).map(period => (
                  <tr key={period}>
                    <td className="border p-2 text-center font-medium bg-gray-50">P{period}</td>
                    {(settings.working_days || DAYS.slice(0, 6)).map(day => {
                      const av = teacherAvailability.find(
                        a => a.teacher_id === selectedTeacher && 
                             a.day_of_week === day && 
                             a.period_number === period
                      );
                      const isAvailable = !av || av.is_available !== false;
                      const isPreferred = av?.preference === 'preferred';

                      return (
                        <td 
                          key={`${day}-${period}`}
                          className={`border p-2 cursor-pointer transition-colors ${
                            !isAvailable ? 'bg-red-100' : isPreferred ? 'bg-green-100' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            // Cycle through: available -> preferred -> unavailable
                            let newPreference = null;
                            let newIsAvailable = true;

                            if (!av || (av.is_available && !av.preference)) {
                              newPreference = 'preferred';
                            } else if (av.preference === 'preferred') {
                              newIsAvailable = false;
                              newPreference = null;
                            }

                            handleSaveAvailability({
                              teacher_id: selectedTeacher,
                              day_of_week: day,
                              period_number: period,
                              is_available: newIsAvailable,
                              preference: newPreference,
                            });
                          }}
                        >
                          <div className="text-center">
                            {!isAvailable ? (
                              <XCircle className="w-5 h-5 mx-auto text-red-500" />
                            ) : isPreferred ? (
                              <CheckCircle className="w-5 h-5 mx-auto text-green-500" />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-gray-100 border"></span>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-green-100"></span>
                <span>Preferred</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-red-100"></span>
                <span>Unavailable</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a teacher to configure their availability</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderConflictsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Conflicts
        </CardTitle>
        <CardDescription>Detected scheduling conflicts that need resolution</CardDescription>
      </CardHeader>
      <CardContent>
        {conflicts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
            <p className="text-muted-foreground">No unresolved conflicts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts.map(conflict => (
              <div 
                key={conflict.id}
                className="p-4 border rounded-lg bg-orange-50 border-orange-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="destructive" className="mb-2">
                      {conflict.conflict_type === 'teacher_clash' ? 'Teacher Clash' : 'Room Clash'}
                    </Badge>
                    <p className="font-medium">{conflict.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {conflict.day_of_week} - Period {conflict.period_number}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveConflict(conflict.id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderRoomsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Rooms & Labs
        </CardTitle>
        <CardDescription>Manage classrooms and specialized rooms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{room.name || room.room_number}</p>
                <Badge variant={room.is_active ? 'success' : 'secondary'}>
                  {room.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Type: {room.room_type || 'Classroom'}
              </p>
              <p className="text-sm text-muted-foreground">
                Capacity: {room.capacity || '-'}
              </p>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No rooms configured yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ===========================
  // DIALOGS
  // ===========================

  const renderCreateDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Timetable</DialogTitle>
          <DialogDescription>Create a new timetable for a class/section</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Timetable Name</Label>
            <Input
              value={newTimetable.name}
              onChange={(e) => setNewTimetable(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., 10A - First Term"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select 
                value={newTimetable.class_id}
                onValueChange={(value) => {
                  setNewTimetable(prev => ({ ...prev, class_id: value, section_id: '' }));
                  fetchSections(value);
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
              <Label>Section</Label>
              <Select 
                value={newTimetable.section_id}
                onValueChange={(value) => setNewTimetable(prev => ({ ...prev, section_id: value }))}
                disabled={!newTimetable.class_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(sec => (
                    <SelectItem key={sec.id} value={sec.id}>
                      {sec.name || sec.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Effective From</Label>
              <Input
                type="date"
                value={newTimetable.effective_from}
                onChange={(e) => setNewTimetable(prev => ({ ...prev, effective_from: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Effective To (Optional)</Label>
              <Input
                type="date"
                value={newTimetable.effective_to}
                onChange={(e) => setNewTimetable(prev => ({ ...prev, effective_to: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateTimetable} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Timetable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderSlotDialog = () => (
    <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Slot</DialogTitle>
          <DialogDescription>
            {selectedSlot?.day_of_week} - Period {selectedSlot?.period_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Slot Type</Label>
            <Select
              value={selectedSlot?.slot_type || 'regular'}
              onValueChange={(value) => setSelectedSlot(prev => ({ ...prev, slot_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Class</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
                <SelectItem value="break">Break</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="assembly">Assembly</SelectItem>
                <SelectItem value="free">Free Period</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedSlot?.slot_type === 'regular' || selectedSlot?.slot_type === 'lab' ? (
            <>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={selectedSlot?.subject_id || ''}
                  onValueChange={(value) => setSelectedSlot(prev => ({ ...prev, subject_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name || subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select
                  value={selectedSlot?.teacher_id || ''}
                  onValueChange={(value) => setSelectedSlot(prev => ({ ...prev, teacher_id: value }))}
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
                <Label>Room (Optional)</Label>
                <Select
                  value={selectedSlot?.room_id || '__none__'}
                  onValueChange={(value) => setSelectedSlot(prev => ({ ...prev, room_id: value === '__none__' ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No Room</SelectItem>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name || room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          {selectedSlot?.id && (
            <Button variant="destructive" onClick={handleClearSlot}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Slot
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowSlotDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSlot} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            Enhanced Timetable System
          </h1>
          <p className="text-muted-foreground">
            Create, manage, and auto-generate class timetables
          </p>
        </div>
      </div>

      {/* Stats */}
      {renderStatsCards()}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="timetables" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Timetables
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Requirements
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Conflicts
            {conflicts.length > 0 && (
              <Badge variant="destructive" className="ml-1">{conflicts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Rooms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timetables">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {renderTimetablesList()}
            </div>
            <div className="lg:col-span-2">
              {renderTimetableGrid()}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          {renderSettingsTab()}
        </TabsContent>

        <TabsContent value="requirements">
          {renderRequirementsTab()}
        </TabsContent>

        <TabsContent value="availability">
          {renderAvailabilityTab()}
        </TabsContent>

        <TabsContent value="conflicts">
          {renderConflictsTab()}
        </TabsContent>

        <TabsContent value="rooms">
          {renderRoomsTab()}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {renderCreateDialog()}
      {renderSlotDialog()}
    </div>
    </DashboardLayout>
  );
}
