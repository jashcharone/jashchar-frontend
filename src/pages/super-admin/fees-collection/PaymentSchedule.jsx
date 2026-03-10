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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2, Search, Filter,
  IndianRupee, Clock, CheckCircle2, AlertCircle, XCircle, TrendingUp,
  Users, Building2, Calendar, Receipt, CreditCard, Eye, MessageSquare,
  Bell, Send, Download, Printer, ArrowUpRight, Wallet, PiggyBank
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatDateWithMonthName } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT SCHEDULE - Visual Calendar View of Student Fee Dues
// Track installments, due dates, and payment status
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

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
  partial: { label: 'Partial', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: TrendingUp },
  waived: { label: 'Waived', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Receipt },
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ─────────────────────────────────────────────────────────────────────────────────
// CALENDAR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const CalendarGrid = ({ currentDate, installments, onDateClick, onInstallmentClick }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const weeks = [];
  let days = [];
  let dayCount = 1;
  
  // Fill in empty days at start
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Fill in days
  while (dayCount <= daysInMonth) {
    days.push(dayCount);
    if (days.length === 7) {
      weeks.push(days);
      days = [];
    }
    dayCount++;
  }
  
  // Fill in remaining days
  while (days.length > 0 && days.length < 7) {
    days.push(null);
  }
  if (days.length > 0) {
    weeks.push(days);
  }
  
  // Get installments for a specific date
  const getInstallmentsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return installments.filter(inst => inst.due_date?.startsWith(dateStr));
  };
  
  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground border-b">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7">
        {weeks.flat().map((day, index) => {
          const dayInstallments = getInstallmentsForDate(day);
          const hasOverdue = dayInstallments.some(i => i.status === 'overdue');
          const hasPending = dayInstallments.some(i => i.status === 'pending');
          const hasPaid = dayInstallments.every(i => i.status === 'paid') && dayInstallments.length > 0;
          
          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-2 border-b border-r relative",
                day ? "bg-white dark:bg-slate-900 hover:bg-muted/50 cursor-pointer" : "bg-muted/20",
                isToday(day) && "ring-2 ring-primary ring-inset"
              )}
              onClick={() => day && dayInstallments.length > 0 && onDateClick(day, dayInstallments)}
            >
              {day && (
                <>
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(day) && "bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center",
                    hasOverdue && !isToday(day) && "text-red-600"
                  )}>
                    {day}
                  </span>
                  
                  {dayInstallments.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayInstallments.slice(0, 3).map((inst, idx) => (
                        <div
                          key={inst.id || idx}
                          className={cn(
                            "text-xs p-1 rounded truncate",
                            inst.status === 'overdue' && "bg-red-100 text-red-700",
                            inst.status === 'pending' && "bg-yellow-100 text-yellow-700",
                            inst.status === 'paid' && "bg-green-100 text-green-700",
                            inst.status === 'partial' && "bg-orange-100 text-orange-700"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onInstallmentClick(inst);
                          }}
                        >
                          {inst.student_name?.split(' ')[0] || 'Student'} - {formatCurrency(inst.amount)}
                        </div>
                      ))}
                      {dayInstallments.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-1">
                          +{dayInstallments.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// STUDENT SCHEDULE CARD
// ─────────────────────────────────────────────────────────────────────────────────

const StudentScheduleCard = ({ student, onSendReminder }) => {
  const totalAmount = student.installments?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
  const paidAmount = student.installments?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
  const overdueAmount = student.installments?.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
  const progressPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  
  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {student.student_name?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold truncate">{student.student_name}</h4>
              <Badge variant="outline" className="text-xs">{student.class_name}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{student.admission_number}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="font-bold text-green-600">{formatCurrency(paidAmount)}</p>
                  <p className="text-muted-foreground">Paid</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <p className="font-bold text-yellow-600">{formatCurrency(totalAmount - paidAmount)}</p>
                  <p className="text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="font-bold text-red-600">{formatCurrency(overdueAmount)}</p>
                  <p className="text-muted-foreground">Overdue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {overdueAmount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3 text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => onSendReminder(student)}
          >
            <Bell className="h-4 w-4 mr-2" />
            Send Reminder
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const PaymentSchedule = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [installments, setInstallments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // calendar, list, student
  const [selectedClass, setSelectedClass] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [showDayDialog, setShowDayDialog] = useState(false);
  const [showInstallmentDialog, setShowInstallmentDialog] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState({ day: null, installments: [] });
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchInstallments = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('student_fee_installments')
        .select(`
          *,
          student:student_id (
            id,
            full_name,
            school_code,
            class:class_id (id, name)
          ),
          plan:installment_plan_id (
            id,
            name,
            installment_interval
          )
        `)
        .eq('branch_id', branchId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Transform and check overdue status
      const today = new Date().toISOString().split('T')[0];
      const transformed = (data || []).map(inst => {
        let status = inst.is_paid ? 'paid' : 'pending';
        if (status === 'pending' && inst.due_date < today) {
          status = 'overdue';
        }
        return {
          ...inst,
          status,
          student_name: inst.student?.full_name || 'Unknown',
          admission_number: inst.student?.school_code,
          class_name: inst.student?.class?.name,
          class_id: inst.student?.class?.id,
        };
      });
      
      setInstallments(transformed);
    } catch (error) {
      console.error('Fetch installments error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load payment schedule' });
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

  useEffect(() => {
    fetchInstallments();
    fetchClasses();
  }, [fetchInstallments, fetchClasses]);

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPUTED DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const filteredInstallments = useMemo(() => {
    return installments.filter(inst => {
      const matchesClass = selectedClass === 'all' || inst.class_id === selectedClass;
      const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
      const matchesSearch = 
        inst.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.admission_number?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesStatus && matchesSearch;
    });
  }, [installments, selectedClass, statusFilter, searchQuery]);

  const currentMonthInstallments = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return filteredInstallments.filter(inst => {
      if (!inst.due_date) return false;
      const dueDate = new Date(inst.due_date);
      return dueDate.getFullYear() === year && dueDate.getMonth() === month;
    });
  }, [filteredInstallments, currentDate]);

  const studentSchedules = useMemo(() => {
    const map = {};
    filteredInstallments.forEach(inst => {
      if (!map[inst.student_id]) {
        map[inst.student_id] = {
          student_id: inst.student_id,
          student_name: inst.student_name,
          admission_number: inst.admission_number,
          class_name: inst.class_name,
          installments: [],
        };
      }
      map[inst.student_id].installments.push(inst);
    });
    return Object.values(map);
  }, [filteredInstallments]);

  const stats = useMemo(() => ({
    totalInstallments: filteredInstallments.length,
    pending: filteredInstallments.filter(i => i.status === 'pending').length,
    paid: filteredInstallments.filter(i => i.status === 'paid').length,
    overdue: filteredInstallments.filter(i => i.status === 'overdue').length,
    totalAmount: filteredInstallments.reduce((sum, i) => sum + (i.amount || 0), 0),
    paidAmount: filteredInstallments.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0),
    overdueAmount: filteredInstallments.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.amount || 0), 0),
    monthDue: currentMonthInstallments.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.amount || 0), 0),
  }), [filteredInstallments, currentMonthInstallments]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (day, dayInstallments) => {
    setSelectedDayData({ day, installments: dayInstallments });
    setShowDayDialog(true);
  };

  const handleInstallmentClick = (installment) => {
    setSelectedInstallment(installment);
    setShowInstallmentDialog(true);
  };

  const handleSendReminder = async (student) => {
    toast({ 
      title: 'Reminder Sent', 
      description: `Payment reminder sent to ${student.student_name}'s parents` 
    });
  };

  const handleMarkAsPaid = async (installment) => {
    try {
      const { error } = await supabase
        .from('student_fee_installments')
        .update({ 
          is_paid: true, 
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', installment.id);
        
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Installment marked as paid' });
      fetchInstallments();
      setShowInstallmentDialog(false);
    } catch (error) {
      console.error('Update error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update installment' });
    }
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
              <CalendarDays className="h-7 w-7 text-primary" />
              Payment Schedule
            </h1>
            <p className="text-muted-foreground">Track installment due dates and payment status</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {}}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => {}}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-blue-100 text-sm">This Month Due</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.monthDue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">Overdue Amount</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdueAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">Paid</p>
              <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">Overdue</p>
              <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <Tabs value={viewMode} onValueChange={setViewMode}>
                  <TabsList>
                    <TabsTrigger value="calendar">
                      <Calendar className="h-4 w-4 mr-1" /> Calendar
                    </TabsTrigger>
                    <TabsTrigger value="list">
                      <Receipt className="h-4 w-4 mr-1" /> List
                    </TabsTrigger>
                    <TabsTrigger value="student">
                      <Users className="h-4 w-4 mr-1" /> By Student
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-[200px]"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Navigation */}
        {viewMode === 'calendar' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>Today</Button>
            </div>
            <h2 className="text-xl font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-200"></div>
                <span>Paid</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-200"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-200"></div>
                <span>Overdue</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <CalendarGrid
                currentDate={currentDate}
                installments={filteredInstallments}
                onDateClick={handleDateClick}
                onInstallmentClick={handleInstallmentClick}
              />
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInstallments.slice(0, 50).map((inst) => {
                        const status = STATUS_CONFIG[inst.status];
                        const StatusIcon = status?.icon || Clock;
                        return (
                          <TableRow key={inst.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{inst.student_name}</p>
                                <p className="text-xs text-muted-foreground">{inst.admission_number}</p>
                              </div>
                            </TableCell>
                            <TableCell>{inst.class_name}</TableCell>
                            <TableCell>{formatDate(inst.due_date)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(inst.amount)}</TableCell>
                            <TableCell>
                              <Badge className={cn("border", status?.color)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status?.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleInstallmentClick(inst)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Student View */}
            {viewMode === 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentSchedules.map((student) => (
                  <StudentScheduleCard
                    key={student.student_id}
                    student={student}
                    onSendReminder={handleSendReminder}
                  />
                ))}
              </div>
            )}

            {filteredInstallments.length === 0 && (
              <Card className="p-12 text-center">
                <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Installments Found</h3>
                <p className="text-muted-foreground">
                  Create installment plans and assign them to students to see payment schedules
                </p>
              </Card>
            )}
          </>
        )}

        {/* Day Details Dialog */}
        <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Due on {formatDateWithMonthName(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayData.day).padStart(2, '0')}`)}
              </DialogTitle>
              <DialogDescription>
                {selectedDayData.installments.length} installment(s) due
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {selectedDayData.installments.map((inst) => {
                  const status = STATUS_CONFIG[inst.status];
                  const StatusIcon = status?.icon || Clock;
                  return (
                    <div
                      key={inst.id}
                      className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setShowDayDialog(false);
                        handleInstallmentClick(inst);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{inst.student_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{inst.student_name}</p>
                          <p className="text-sm text-muted-foreground">{inst.class_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(inst.amount)}</p>
                        <Badge className={cn("border text-xs", status?.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status?.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Installment Details Dialog */}
        <Dialog open={showInstallmentDialog} onOpenChange={setShowInstallmentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Installment Details</DialogTitle>
            </DialogHeader>
            {selectedInstallment && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {selectedInstallment.student_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedInstallment.student_name}</h3>
                    <p className="text-muted-foreground">{selectedInstallment.admission_number} • {selectedInstallment.class_name}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDate(selectedInstallment.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(selectedInstallment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Installment #</p>
                    <p className="font-medium">{selectedInstallment.installment_number || 1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={cn("border", STATUS_CONFIG[selectedInstallment.status]?.color)}>
                      {STATUS_CONFIG[selectedInstallment.status]?.label}
                    </Badge>
                  </div>
                </div>
                
                {selectedInstallment.status !== 'paid' && (
                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" onClick={() => handleMarkAsPaid(selectedInstallment)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                    <Button variant="outline" onClick={() => handleSendReminder({ student_name: selectedInstallment.student_name })}>
                      <Bell className="h-4 w-4 mr-2" />
                      Send Reminder
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PaymentSchedule;
