import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, Settings,
  IndianRupee, Clock, CheckCircle2, AlertCircle, Calendar, MoreVertical,
  Bell, Repeat, Trash2, Edit, Copy, FileText, Users, Building2, Eye,
  Download, Filter, ChevronsLeft, ChevronsRight, Target, Zap, Sun, Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatDateWithMonthName } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// FEE CALENDAR - Full Calendar View with Due Date Management
// Manage fee due dates, recurring schedules, and bulk operations
// ═══════════════════════════════════════════════════════════════════════════════

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_COLORS = {
  tuition: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300' },
  transport: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300' },
  hostel: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300' },
  exam: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300' },
  lab: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300' },
  other: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300' },
};

// ─────────────────────────────────────────────────────────────────────────────────
// MINI CALENDAR (for sidebar navigation)  
// ─────────────────────────────────────────────────────────────────────────────────

const MiniCalendar = ({ currentDate, onDateSelect, highlightedDates }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  
  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };
  
  const isHighlighted = (day) => {
    if (!day) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return highlightedDates?.includes(dateStr);
  };
  
  return (
    <div className="p-3">
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-muted-foreground font-medium">{d.charAt(0)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <button
            key={i}
            className={cn(
              "h-7 w-7 text-xs rounded-full flex items-center justify-center transition-colors",
              day && "hover:bg-muted cursor-pointer",
              isToday(day) && "bg-primary text-primary-foreground font-bold",
              isHighlighted(day) && !isToday(day) && "bg-blue-100 text-blue-700 dark:bg-blue-900/50"
            )}
            onClick={() => day && onDateSelect(new Date(year, month, day))}
            disabled={!day}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// EVENT ITEM COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const EventItem = ({ event, compact, onClick }) => {
  const colorConfig = EVENT_COLORS[event.category] || EVENT_COLORS.other;
  
  if (compact) {
    return (
      <div
        className={cn(
          "text-xs p-1 rounded truncate cursor-pointer",
          colorConfig.bg, colorConfig.text
        )}
        onClick={onClick}
      >
        {event.title}
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all",
        colorConfig.bg, colorConfig.border
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-medium truncate", colorConfig.text)}>{event.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
        </div>
        <Badge variant="outline" className="ml-2 text-xs shrink-0">
          {formatCurrency(event.amount)}
        </Badge>
      </div>
      {event.class_names && (
        <div className="flex flex-wrap gap-1 mt-2">
          {event.class_names.slice(0, 3).map((cls, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{cls}</Badge>
          ))}
          {event.class_names.length > 3 && (
            <Badge variant="secondary" className="text-xs">+{event.class_names.length - 3}</Badge>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN CALENDAR GRID
// ─────────────────────────────────────────────────────────────────────────────────

const CalendarGrid = ({ currentDate, events, onDateClick, onEventClick, viewMode }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get weeks for month view
  const getMonthWeeks = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const weeks = [];
    let days = [];
    
    // Fill in empty days at start
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: prevMonthDay, currentMonth: false });
    }
    
    // Fill in days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), currentMonth: true });
      if (days.length === 7) {
        weeks.push(days);
        days = [];
      }
    }
    
    // Fill remaining with next month
    if (days.length > 0) {
      let nextDay = 1;
      while (days.length < 7) {
        days.push({ date: new Date(year, month + 1, nextDay++), currentMonth: false });
      }
      weeks.push(days);
    }
    
    return weeks;
  };
  
  // Get week for week view
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };
  
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.due_date?.startsWith(dateStr));
  };
  
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const weeks = viewMode === 'month' ? getMonthWeeks() : [getWeekDays().map(d => ({ date: d, currentMonth: true }))];
  
  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted/50 border-b">
        {WEEKDAYS.map((day, i) => (
          <div 
            key={day} 
            className={cn(
              "py-3 text-center text-sm font-medium",
              i === 0 && "text-red-500",
              i === 6 && "text-blue-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Days Grid */}
      <div className="divide-y">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 divide-x">
            {week.map((dayData, dayIndex) => {
              const { date, currentMonth } = viewMode === 'month' ? dayData : { date: dayData, currentMonth: true };
              const dayEvents = getEventsForDate(date);
              const hasOverdue = dayEvents.some(e => e.is_overdue);
              
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "min-h-[120px] p-2 transition-colors",
                    viewMode === 'week' && "min-h-[300px]",
                    currentMonth ? "bg-white dark:bg-slate-900" : "bg-muted/30",
                    isToday(date) && "bg-blue-50/50 dark:bg-blue-900/20",
                    "hover:bg-muted/50 cursor-pointer"
                  )}
                  onClick={() => onDateClick(date)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                      !currentMonth && "text-muted-foreground",
                      isToday(date) && "bg-primary text-white",
                      hasOverdue && !isToday(date) && "text-red-600"
                    )}>
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <Badge 
                        variant={hasOverdue ? "destructive" : "secondary"} 
                        className="text-xs h-5"
                      >
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, viewMode === 'week' ? 10 : 3).map((event, i) => (
                      <EventItem
                        key={event.id || i}
                        event={event}
                        compact={viewMode === 'month'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      />
                    ))}
                    {dayEvents.length > (viewMode === 'week' ? 10 : 3) && (
                      <p className="text-xs text-muted-foreground pl-1">
                        +{dayEvents.length - (viewMode === 'week' ? 10 : 3)} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const FeeCalendar = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'tuition',
    amount: '',
    due_date: '',
    class_ids: [],
    is_recurring: false,
    recurrence_type: 'monthly',
    notify_before_days: 7,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    try {
      // Fetch fee due dates from various sources
      const [templatesRes, installmentsRes] = await Promise.all([
        supabase
          .from('fee_templates')
          .select('id, name, template_name, total_amount, due_date, applicable_classes')
          .eq('branch_id', branchId),
        supabase
          .from('student_fee_installments')
          .select(`
            id, amount, due_date, status,
            student:student_id (class_id)
          `)
          .eq('branch_id', branchId)
      ]);

      const allEvents = [];
      const today = new Date().toISOString().split('T')[0];
      
      // Templates with due dates
      (templatesRes.data || []).forEach(t => {
        if (t.due_date) {
          allEvents.push({
            id: `template-${t.id}`,
            title: t.template_name || t.name || 'Fee Due',
            description: 'Template due date',
            category: 'tuition',
            amount: t.total_amount,
            due_date: t.due_date,
            class_ids: t.applicable_classes || [],
            is_overdue: t.due_date < today,
            type: 'template',
          });
        }
      });
      
      // Installments
      (installmentsRes.data || []).forEach(i => {
        if (i.due_date && i.status !== 'paid') {
          allEvents.push({
            id: `installment-${i.id}`,
            title: 'Installment Due',
            description: `Student installment`,
            category: 'tuition',
            amount: i.amount,
            due_date: i.due_date,
            class_ids: i.student?.class_id ? [i.student.class_id] : [],
            is_overdue: i.due_date < today,
            type: 'installment',
            status: i.status,
          });
        }
      });
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Fetch events error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load calendar events' });
    }
    setLoading(false);
  }, [branchId, toast]);

  const fetchClasses = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from('classes')
      .select('id, name')
      .eq('branch_id', branchId)
      .order('name');
    setClasses(data || []);
  }, [branchId]);

  const fetchFeeTypes = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from('fee_types')
      .select('id, name')
      .eq('branch_id', branchId)
      .order('name');
    setFeeTypes(data || []);
  }, [branchId]);

  useEffect(() => {
    fetchEvents();
    fetchClasses();
    fetchFeeTypes();
  }, [fetchEvents, fetchClasses, fetchFeeTypes]);

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPUTED DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesClass = selectedClasses.length === 0 || 
        event.class_ids?.some(c => selectedClasses.includes(c));
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(event.category);
      return matchesClass && matchesCategory;
    });
  }, [events, selectedClasses, selectedCategories]);

  const highlightedDates = useMemo(() => {
    return [...new Set(filteredEvents.map(e => e.due_date?.split('T')[0]).filter(Boolean))];
  }, [filteredEvents]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    return {
      totalEvents: filteredEvents.length,
      thisMonth: filteredEvents.filter(e => e.due_date?.startsWith(thisMonth)).length,
      overdue: filteredEvents.filter(e => e.is_overdue).length,
      upcomingWeek: filteredEvents.filter(e => {
        if (!e.due_date) return false;
        const due = new Date(e.due_date);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return due >= new Date(today) && due <= weekFromNow;
      }).length,
      totalAmount: filteredEvents.reduce((sum, e) => sum + (e.amount || 0), 0),
    };
  }, [filteredEvents, currentDate]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handlePrevMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const handleNextMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date) => {
    const dateEvents = filteredEvents.filter(e => 
      e.due_date?.startsWith(date.toISOString().split('T')[0])
    );
    setSelectedDate(date);
    if (dateEvents.length > 0) {
      setShowDateDialog(true);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        due_date: date.toISOString().split('T')[0] 
      }));
      setShowCreateDialog(true);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'tuition',
      amount: '',
      due_date: '',
      class_ids: [],
      is_recurring: false,
      recurrence_type: 'monthly',
      notify_before_days: 7,
    });
  };

  const handleCreateNew = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.due_date || !formData.amount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill required fields' });
      return;
    }

    setSaving(true);
    try {
      // For now, we'll add to fee_templates with a due_date
      const { error } = await supabase
        .from('fee_templates')
        .insert({
          name: formData.title,
          template_name: formData.title,
          template_code: `CAL-${Date.now()}`,
          description: formData.description,
          total_amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          applicable_classes: formData.class_ids,
          is_active: true,
          branch_id: branchId,
          session_id: currentSessionId,
          organization_id: organizationId,
        });

      if (error) throw error;

      toast({ title: 'Created!', description: 'Fee due date added to calendar' });
      setShowCreateDialog(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save event' });
    }
    setSaving(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-7 w-7 text-primary" />
              Fee Calendar
            </h1>
            <p className="text-muted-foreground">Manage fee due dates and payment schedules</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {}}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Due Date
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-4 shrink-0">
            {/* Mini Calendar */}
            <Card>
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentDate(newDate);
                  }}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-sm">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCurrentDate(newDate);
                  }}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <MiniCalendar
                  currentDate={currentDate}
                  onDateSelect={setCurrentDate}
                  highlightedDates={highlightedDates}
                />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <Badge>{stats.thisMonth}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next 7 Days</span>
                  <Badge variant="secondary">{stats.upcomingWeek}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-500">Overdue</span>
                  <Badge variant="destructive">{stats.overdue}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Due</span>
                  <span className="font-bold text-primary">{formatCurrency(stats.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Categories</Label>
                  <div className="space-y-2">
                    {Object.entries(EVENT_COLORS).map(([key, config]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${key}`}
                          checked={selectedCategories.includes(key)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, key]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== key));
                            }
                          }}
                        />
                        <label htmlFor={`cat-${key}`} className="text-sm capitalize flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded", config.bg, config.border, "border")} />
                          {key}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Classes</Label>
                  <Select
                    value={selectedClasses.length === 1 ? selectedClasses[0] : ""}
                    onValueChange={(v) => setSelectedClasses(v ? [v] : [])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {(selectedCategories.length > 0 || selectedClasses.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedClasses([]);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Calendar */}
          <div className="flex-1 min-w-0">
            {/* Calendar Controls */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => {
                      if (viewMode === 'month') {
                        setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
                      }
                    }}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={handleToday}>Today</Button>
                    <Button variant="outline" size="icon" onClick={handleNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => {
                      if (viewMode === 'month') {
                        setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
                      }
                    }}>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <h2 className="text-xl font-bold">
                    {viewMode === 'month' 
                      ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                      : formatDateWithMonthName(currentDate)
                    }
                  </h2>
                  
                  <Tabs value={viewMode} onValueChange={setViewMode}>
                    <TabsList>
                      <TabsTrigger value="month">Month</TabsTrigger>
                      <TabsTrigger value="week">Week</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <CalendarGrid
                currentDate={currentDate}
                events={filteredEvents}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                viewMode={viewMode}
              />
            )}
          </div>
        </div>

        {/* Create Event Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Fee Due Date
              </DialogTitle>
              <DialogDescription>
                Create a new fee due date on the calendar
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g., April Tuition Fee"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="5000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(EVENT_COLORS).map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveEvent} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add to Calendar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Event Details Dialog */}
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fee Due Date Details</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    EVENT_COLORS[selectedEvent.category]?.bg || EVENT_COLORS.other.bg
                  )}>
                    <CalendarDays className={cn("h-6 w-6", EVENT_COLORS[selectedEvent.category]?.text)} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                    <p className="text-muted-foreground">{selectedEvent.description}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDateWithMonthName(selectedEvent.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-bold text-xl text-primary">{formatCurrency(selectedEvent.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline" className="capitalize">{selectedEvent.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {selectedEvent.is_overdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge variant="secondary">Upcoming</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Date Details Dialog */}
        <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedDate && formatDateWithMonthName(selectedDate)}
              </DialogTitle>
              <DialogDescription>
                Due dates on this day
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {selectedDate && filteredEvents
                  .filter(e => e.due_date?.startsWith(selectedDate.toISOString().split('T')[0]))
                  .map((event) => (
                    <EventItem
                      key={event.id}
                      event={event}
                      compact={false}
                      onClick={() => {
                        setShowDateDialog(false);
                        handleEventClick(event);
                      }}
                    />
                  ))
                }
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowDateDialog(false);
                  setFormData(prev => ({
                    ...prev,
                    due_date: selectedDate?.toISOString().split('T')[0] || ''
                  }));
                  setShowCreateDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Due Date
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FeeCalendar;
