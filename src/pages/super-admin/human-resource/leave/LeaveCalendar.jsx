import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from '@/utils/dateUtils';
import { 
    Loader2, ChevronLeft, ChevronRight, Calendar, Users, Search,
    CalendarDays, Eye, Filter
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const LeaveCalendar = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    // State
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Fetch leaves
    const fetchLeaves = useCallback(async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
            const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
            
            const { data, error } = await supabase
                .from('leave_requests')
                .select(`
                    *,
                    employees(id, first_name, last_name, employee_code, departments(id, name)),
                    leave_types(id, name, color)
                `)
                .eq('branch_id', selectedBranch.id)
                .in('status', ['approved', 'pending'])
                .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
                .order('start_date');
            
            if (error) throw error;
            setLeaves(data || []);
        } catch (error) {
            console.error('Error fetching leaves:', error);
            toast({ variant: 'destructive', title: 'Error loading leave data' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, currentMonth, currentYear, toast]);

    const fetchDepartments = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('departments')
                .select('id, name')
                .eq('branch_id', selectedBranch.id)
                .order('name');
            setDepartments(data || []);
        } catch (error) {
            console.error('Error:', error);
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        fetchLeaves();
        fetchDepartments();
    }, [fetchLeaves, fetchDepartments]);

    // Filter leaves by department
    const filteredLeaves = useMemo(() => {
        if (departmentFilter === 'all') return leaves;
        return leaves.filter(l => l.employees?.departments?.id === departmentFilter);
    }, [leaves, departmentFilter]);

    // Get leaves for a specific date
    const getLeavesForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return filteredLeaves.filter(leave => {
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            const checkDate = new Date(dateStr);
            return checkDate >= start && checkDate <= end;
        });
    };

    // Calendar data
    const calendarData = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startPadding = firstDay.getDay();
        const totalDays = lastDay.getDate();
        
        const days = [];
        
        // Previous month padding
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = startPadding - 1; i >= 0; i--) {
            days.push({ 
                date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
                isCurrentMonth: false 
            });
        }
        
        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push({ 
                date: new Date(currentYear, currentMonth, i),
                isCurrentMonth: true 
            });
        }
        
        // Next month padding
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ 
                date: new Date(currentYear, currentMonth + 1, i),
                isCurrentMonth: false 
            });
        }
        
        return days;
    }, [currentMonth, currentYear]);

    // Stats
    const stats = useMemo(() => {
        const approved = filteredLeaves.filter(l => l.status === 'approved').length;
        const pending = filteredLeaves.filter(l => l.status === 'pending').length;
        const uniqueEmployees = new Set(filteredLeaves.map(l => l.employee_id)).size;
        return { total: filteredLeaves.length, approved, pending, uniqueEmployees };
    }, [filteredLeaves]);

    // Navigation
    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const goToToday = () => {
        setCurrentMonth(new Date().getMonth());
        setCurrentYear(new Date().getFullYear());
    };

    const handleDateClick = (date) => {
        const dateLeaves = getLeavesForDate(date);
        if (dateLeaves.length > 0) {
            setSelectedDate({ date, leaves: dateLeaves });
            setShowDetailDialog(true);
        }
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const getEmployeeName = (emp) => {
        if (!emp) return 'Unknown';
        return `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    };

    return (
        <DashboardLayout>
            <TooltipProvider>
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <CalendarDays className="h-6 w-6 text-primary" />
                                Leave Calendar
                            </h1>
                            <p className="text-muted-foreground">Visual overview of employee leaves</p>
                        </div>
                        <div className="flex gap-2">
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filter by department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-xs text-muted-foreground">Total Leaves</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-green-500">
                            <CardContent className="pt-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                                    <p className="text-xs text-muted-foreground">Approved</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-orange-500">
                            <CardContent className="pt-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">{stats.uniqueEmployees}</p>
                                    <p className="text-xs text-muted-foreground">Employees on Leave</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Calendar */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <h2 className="text-lg font-semibold min-w-[180px] text-center">
                                        {MONTHS[currentMonth]} {currentYear}
                                    </h2>
                                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button variant="outline" size="sm" onClick={goToToday}>
                                    Today
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-7 gap-px bg-muted">
                                    {/* Day headers */}
                                    {DAYS.map(day => (
                                        <div key={day} className="bg-background p-2 text-center text-sm font-medium text-muted-foreground">
                                            {day}
                                        </div>
                                    ))}
                                    
                                    {/* Calendar days */}
                                    {calendarData.map((day, index) => {
                                        const dateLeaves = getLeavesForDate(day.date);
                                        const hasLeaves = dateLeaves.length > 0;
                                        
                                        return (
                                            <div
                                                key={index}
                                                className={`
                                                    bg-background min-h-[100px] p-1 relative cursor-pointer
                                                    hover:bg-muted/50 transition-colors
                                                    ${!day.isCurrentMonth ? 'opacity-40' : ''}
                                                    ${isToday(day.date) ? 'ring-2 ring-primary ring-inset' : ''}
                                                `}
                                                onClick={() => handleDateClick(day.date)}
                                            >
                                                <div className={`text-sm font-medium mb-1 ${isToday(day.date) ? 'text-primary' : ''}`}>
                                                    {day.date.getDate()}
                                                </div>
                                                
                                                {hasLeaves && (
                                                    <div className="space-y-0.5">
                                                        {dateLeaves.slice(0, 3).map((leave, idx) => (
                                                            <Tooltip key={leave.id}>
                                                                <TooltipTrigger asChild>
                                                                    <div 
                                                                        className="text-xs px-1 py-0.5 rounded truncate text-white"
                                                                        style={{ backgroundColor: leave.leave_types?.color || '#6366f1' }}
                                                                    >
                                                                        {getEmployeeName(leave.employees)}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{getEmployeeName(leave.employees)}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {leave.leave_types?.name} • {leave.status}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))}
                                                        {dateLeaves.length > 3 && (
                                                            <div className="text-xs text-muted-foreground text-center">
                                                                +{dateLeaves.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Legend */}
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm">Leave Types</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-3">
                                {/* Get unique leave types from current leaves */}
                                {[...new Set(filteredLeaves.map(l => JSON.stringify({ name: l.leave_types?.name, color: l.leave_types?.color })))]
                                    .map(str => JSON.parse(str))
                                    .filter(lt => lt.name)
                                    .map((lt, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <div 
                                                className="w-3 h-3 rounded"
                                                style={{ backgroundColor: lt.color || '#6366f1' }}
                                            />
                                            <span className="text-sm">{lt.name}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TooltipProvider>

            {/* Date Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {selectedDate && formatDate(selectedDate.date.toISOString())}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <ScrollArea className="max-h-[400px]">
                        <div className="space-y-3 pr-4">
                            {selectedDate?.leaves.map((leave) => (
                                <div key={leave.id} className="flex items-start gap-3 p-3 rounded-lg border">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                            {leave.employees?.first_name?.[0]}{leave.employees?.last_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium">{getEmployeeName(leave.employees)}</p>
                                            <Badge variant={leave.status === 'approved' ? 'default' : 'secondary'}>
                                                {leave.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {leave.employees?.employee_code} • {leave.employees?.departments?.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge 
                                                style={{ backgroundColor: leave.leave_types?.color || '#6366f1' }}
                                                className="text-white text-xs"
                                            >
                                                {leave.leave_types?.name}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                                            </span>
                                        </div>
                                        {leave.reason && (
                                            <p className="text-xs text-muted-foreground mt-2 italic">
                                                "{leave.reason}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default LeaveCalendar;
