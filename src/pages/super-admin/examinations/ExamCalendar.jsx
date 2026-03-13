/**
 * Exam Calendar Page
 * Visual calendar view of exam schedules
 * Phase 3 of Examination Module
 * @file jashchar-frontend/src/pages/super-admin/examinations/ExamCalendar.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { examCalendarService, examGroupService } from '@/services/examinationService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Icons
import { 
    Calendar as CalendarIcon, 
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    BookOpen,
    FileText,
    Clock,
    Sync
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];

const ExamCalendar = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // month, week, list

    // Reference data
    const [examGroups, setExamGroups] = useState([]);
    const [selectedExamGroup, setSelectedExamGroup] = useState('');

    // Event form
    const [eventForm, setEventForm] = useState({
        schedule_date: '',
        start_time: '',
        end_time: '',
        subject_name: '',
        event_type: 'exam',
        status: 'scheduled',
        remarks: ''
    });

    // Fetch reference data
    const fetchReferenceData = useCallback(async () => {
        try {
            const groupsRes = await examGroupService.getAll();
            if (groupsRes.success) setExamGroups(groupsRes.data || []);
        } catch (error) {
            console.error('Error fetching reference data:', error);
        }
    }, []);

    // Fetch calendar events
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

            const params = { start_date: startDate, end_date: endDate };
            if (selectedExamGroup) params.exam_group_id = selectedExamGroup;

            const response = await examCalendarService.getAll(params);
            if (response.success) {
                setEvents(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch calendar events',
                variant: 'destructive'
            });
        }
        setLoading(false);
    }, [currentDate, selectedExamGroup, toast]);

    useEffect(() => {
        fetchReferenceData();
    }, [fetchReferenceData]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days = [];
        
        // Previous month days
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const prevDate = new Date(year, month, -i);
            days.push({ date: prevDate, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // Next month days to fill grid
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return days;
    };

    const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(e => e.schedule_date === dateStr);
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    // Navigation
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Event handlers
    const handleDateClick = (date) => {
        setSelectedDate(date);
        setEventForm({
            ...eventForm,
            schedule_date: date.toISOString().split('T')[0]
        });
        setSelectedEvent(null);
        setDialogOpen(true);
    };

    const handleEventClick = (event, e) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setEventForm({
            schedule_date: event.schedule_date,
            start_time: event.start_time || '',
            end_time: event.end_time || '',
            subject_name: event.subject_name || '',
            event_type: event.event_type || 'exam',
            status: event.status || 'scheduled',
            remarks: event.remarks || ''
        });
        setDialogOpen(true);
    };

    const handleSaveEvent = async () => {
        setLoading(true);
        try {
            const data = {
                ...eventForm,
                exam_group_id: selectedExamGroup || null
            };

            if (selectedEvent) {
                await examCalendarService.update(selectedEvent.id, data);
                toast({ title: 'Success', description: 'Event updated' });
            } else {
                await examCalendarService.add(data);
                toast({ title: 'Success', description: 'Event created' });
            }
            setDialogOpen(false);
            fetchEvents();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to save event',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        
        setLoading(true);
        try {
            await examCalendarService.delete(selectedEvent.id);
            toast({ title: 'Success', description: 'Event deleted' });
            setDialogOpen(false);
            fetchEvents();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete event',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    const handleSyncFromExamGroup = async () => {
        if (!selectedExamGroup) {
            toast({
                title: 'Select Exam Group',
                description: 'Please select an exam group to sync',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await examCalendarService.syncFromExamGroup(selectedExamGroup);
            if (response.success) {
                toast({ title: 'Success', description: response.message || 'Calendar synced' });
                fetchEvents();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to sync calendar',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // Get event type badge
    const getEventTypeBadge = (type) => {
        const config = {
            exam: { variant: 'default', icon: BookOpen, label: 'Exam' },
            practical: { variant: 'secondary', icon: FileText, label: 'Practical' },
            viva: { variant: 'outline', icon: FileText, label: 'Viva' },
            result: { variant: 'success', icon: FileText, label: 'Result' },
            holiday: { variant: 'destructive', icon: CalendarIcon, label: 'Holiday' }
        };
        const c = config[type] || config.exam;
        return c;
    };

    const calendarDays = getDaysInMonth(currentDate);

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <CalendarIcon className="h-6 w-6" />
                            Exam Calendar
                        </h1>
                        <p className="text-muted-foreground">
                            View and manage exam schedule calendar
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSyncFromExamGroup} disabled={!selectedExamGroup}>
                            <Sync className="h-4 w-4 mr-2" />
                            Sync from Exams
                        </Button>
                        <Button onClick={() => handleDateClick(new Date())}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Event
                        </Button>
                    </div>
                </div>

                {/* Filter & Navigation */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="space-y-1">
                                    <Label>Exam Group</Label>
                                    <Select value={selectedExamGroup} onValueChange={setSelectedExamGroup}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="All Groups" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Groups</SelectItem>
                                            {examGroups.map(group => (
                                                <SelectItem key={group.id} value={group.id}>
                                                    {group.group_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-lg font-semibold min-w-[180px] text-center">
                                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </div>
                                <Button variant="outline" size="sm" onClick={goToNextMonth}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={goToToday}>
                                    Today
                                </Button>
                            </div>

                            <Button variant="outline" size="sm" onClick={fetchEvents}>
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Calendar Grid */}
                <Card>
                    <CardContent className="p-4">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS.map(day => (
                                <div key={day} className="text-center font-semibold py-2 text-sm text-muted-foreground">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                                const dayEvents = getEventsForDate(date);
                                const isTodayDate = isToday(date);

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleDateClick(date)}
                                        className={`min-h-[100px] p-2 border rounded cursor-pointer transition-colors hover:bg-muted/50 ${
                                            !isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''
                                        } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
                                    >
                                        <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600' : ''}`}>
                                            {date.getDate()}
                                        </div>
                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 3).map(event => {
                                                const typeConfig = getEventTypeBadge(event.event_type);
                                                return (
                                                    <div
                                                        key={event.id}
                                                        onClick={(e) => handleEventClick(event, e)}
                                                        className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate hover:bg-blue-200 transition-colors"
                                                        title={event.subject_name || 'Event'}
                                                    >
                                                        {event.start_time && (
                                                            <span className="font-medium mr-1">
                                                                {event.start_time.substring(0, 5)}
                                                            </span>
                                                        )}
                                                        {event.subject_name || event.event_type}
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 3 && (
                                                <div className="text-xs text-muted-foreground">
                                                    +{dayEvents.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Exams</CardTitle>
                        <CardDescription>Events in the next 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {events
                                .filter(e => new Date(e.schedule_date) >= new Date())
                                .sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date))
                                .slice(0, 10)
                                .map(event => {
                                    const typeConfig = getEventTypeBadge(event.event_type);
                                    return (
                                        <div 
                                            key={event.id} 
                                            className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer"
                                            onClick={() => handleEventClick(event, { stopPropagation: () => {} })}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-center min-w-[60px]">
                                                    <div className="text-2xl font-bold">
                                                        {new Date(event.schedule_date).getDate()}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {MONTHS[new Date(event.schedule_date).getMonth()].substring(0, 3)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-medium">{event.subject_name || 'Exam'}</div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        {event.start_time && (
                                                            <>
                                                                <Clock className="h-3 w-3" />
                                                                {event.start_time} - {event.end_time || '-'}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                                        </div>
                                    );
                                })}
                            {events.filter(e => new Date(e.schedule_date) >= new Date()).length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No upcoming exams scheduled
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Event Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {selectedEvent ? 'Edit Event' : 'Add Event'}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedDate && formatDate(selectedDate)}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Date *</Label>
                                <Input
                                    type="date"
                                    value={eventForm.schedule_date}
                                    onChange={(e) => setEventForm({...eventForm, schedule_date: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input
                                        type="time"
                                        value={eventForm.start_time}
                                        onChange={(e) => setEventForm({...eventForm, start_time: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input
                                        type="time"
                                        value={eventForm.end_time}
                                        onChange={(e) => setEventForm({...eventForm, end_time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Subject / Title</Label>
                                <Input
                                    value={eventForm.subject_name}
                                    onChange={(e) => setEventForm({...eventForm, subject_name: e.target.value})}
                                    placeholder="e.g., Mathematics Final Exam"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Event Type</Label>
                                    <Select 
                                        value={eventForm.event_type} 
                                        onValueChange={(v) => setEventForm({...eventForm, event_type: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="exam">Exam</SelectItem>
                                            <SelectItem value="practical">Practical</SelectItem>
                                            <SelectItem value="viva">Viva</SelectItem>
                                            <SelectItem value="result">Result Day</SelectItem>
                                            <SelectItem value="holiday">Holiday</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select 
                                        value={eventForm.status} 
                                        onValueChange={(v) => setEventForm({...eventForm, status: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="scheduled">Scheduled</SelectItem>
                                            <SelectItem value="ongoing">Ongoing</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="postponed">Postponed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Remarks</Label>
                                <Input
                                    value={eventForm.remarks}
                                    onChange={(e) => setEventForm({...eventForm, remarks: e.target.value})}
                                    placeholder="Any additional notes..."
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex justify-between">
                            <div>
                                {selectedEvent && (
                                    <Button variant="destructive" onClick={handleDeleteEvent} disabled={loading}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveEvent} disabled={loading}>
                                    {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                    {selectedEvent ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default ExamCalendar;
