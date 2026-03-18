/**
 * 🌟 FUTURISTIC STUDENT ATTENDANCE TAB
 * ═══════════════════════════════════════════════════════════════════════════════
 * Designed for 100+ years of use - Premium attendance visualization
 * Features: Calendar Heatmap, Statistics, Trends, Monthly Analysis
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, CalendarDays, CheckCircle2, XCircle, Clock, TrendingUp, 
  TrendingDown, Calendar, Activity, Target, BarChart3, PieChart,
  ChevronLeft, ChevronRight, Sun, Moon, Zap, Award, AlertTriangle,
  Flame, Sparkles, Eye, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isToday, isSunday, getDay, subMonths, addMonths,
  differenceInDays, startOfYear, endOfYear, getMonth, isWeekend
} from 'date-fns';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PREMIUM GLASS COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const GlassCard = ({ children, className, gradient = false, hover = true, ...props }) => (
  <div 
    className={cn(
      "relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl",
      gradient && "bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-900/90 dark:via-gray-900/80 dark:to-gray-900/70",
      hover && "transition-all duration-500 hover:shadow-2xl hover:border-primary/30",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const StatCard = ({ icon: Icon, label, value, subValue, trend, color = "blue", glowEffect = false }) => {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-600 text-blue-600 bg-blue-50 dark:bg-blue-950/30",
    green: "from-emerald-500 to-green-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
    orange: "from-orange-500 to-amber-600 text-orange-600 bg-orange-50 dark:bg-orange-950/30",
    purple: "from-purple-500 to-violet-600 text-purple-600 bg-purple-50 dark:bg-purple-950/30",
    red: "from-red-500 to-rose-600 text-red-600 bg-red-50 dark:bg-red-950/30",
    pink: "from-pink-500 to-rose-600 text-pink-600 bg-pink-50 dark:bg-pink-950/30",
    cyan: "from-cyan-500 to-teal-600 text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30",
  };
  
  return (
    <GlassCard className={cn("p-5 group", glowEffect && `ring-2 ring-${color}-500/20`)}>
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl transition-all duration-300 group-hover:scale-110", colorClasses[color].split(' ').slice(2).join(' '))}>
          <Icon className={cn("h-6 w-6", colorClasses[color].split(' ')[2])} />
        </div>
        {trend !== undefined && (
          <Badge variant={trend >= 0 ? "success" : "destructive"} className="text-xs flex items-center gap-1">
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend >= 0 ? '+' : ''}{trend}%
          </Badge>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
      </div>
      <div className="absolute bottom-0 right-0 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-full h-full" />
      </div>
    </GlassCard>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📅 FUTURISTIC CALENDAR HEATMAP
// ═══════════════════════════════════════════════════════════════════════════════

const AttendanceCalendar = ({ attendanceData, currentMonth, onMonthChange }) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Create a map for quick lookup
  const attendanceMap = useMemo(() => {
    const map = {};
    attendanceData.forEach(record => {
      map[record.date] = record.status;
    });
    return map;
  }, [attendanceData]);

  // Get the day offset for the first day of the month
  const startDayOffset = getDay(monthStart);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-500/30';
      case 'absent':
        return 'bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-red-500/30';
      case 'late':
        return 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-orange-500/30';
      case 'half_day':
        return 'bg-gradient-to-br from-yellow-400 to-amber-400 text-white shadow-yellow-500/30';
      case 'leave':
        return 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-blue-500/30';
      case 'holiday':
        return 'bg-gradient-to-br from-purple-400 to-violet-500 text-white shadow-purple-500/30';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="h-3 w-3" />;
      case 'absent': return <XCircle className="h-3 w-3" />;
      case 'late': return <Clock className="h-3 w-3" />;
      case 'leave': return <CalendarDays className="h-3 w-3" />;
      default: return null;
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className={cn(
            "text-center text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 rounded-lg",
            day === 'Sun' ? "text-red-500 bg-red-50 dark:bg-red-950/30" : "text-muted-foreground bg-muted/30"
          )}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Empty cells for offset */}
        {Array.from({ length: startDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Day cells */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const status = attendanceMap[dateStr];
          const isSunday_ = isSunday(day);
          const isToday_ = isToday(day);
          
          return (
            <div
              key={dateStr}
              className={cn(
                "aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer",
                "hover:scale-105 hover:shadow-lg",
                status ? getStatusColor(status) : (isSunday_ ? "bg-red-50 dark:bg-red-950/20 text-red-400" : "bg-gray-50 dark:bg-gray-800/50 text-gray-400"),
                isToday_ && "ring-2 ring-primary ring-offset-2"
              )}
              title={`${format(day, 'dd MMM yyyy')} - ${status || 'No data'}`}
            >
              <span className={cn("text-[10px] sm:text-sm font-bold", isToday_ && !status && "text-primary")}>
                {format(day, 'd')}
              </span>
              {status && (
                <span className="absolute bottom-1">
                  {getStatusIcon(status)}
                </span>
              )}
              {isToday_ && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t">
        {[
          { status: 'present', label: 'Present', color: 'bg-emerald-500' },
          { status: 'absent', label: 'Absent', color: 'bg-red-500' },
          { status: 'late', label: 'Late', color: 'bg-orange-500' },
          { status: 'half_day', label: 'Half Day', color: 'bg-yellow-500' },
          { status: 'leave', label: 'Leave', color: 'bg-blue-500' },
          { status: 'holiday', label: 'Holiday', color: 'bg-purple-500' },
        ].map(item => (
          <div key={item.status} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", item.color)} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 YEARLY HEATMAP VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

const YearlyHeatmap = ({ attendanceData, year }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Group by month
  const monthlyStats = useMemo(() => {
    const stats = Array(12).fill(null).map(() => ({ present: 0, absent: 0, late: 0, total: 0 }));
    
    attendanceData.forEach(record => {
      const date = parseISO(record.date);
      const month = getMonth(date);
      stats[month].total++;
      if (record.status === 'present') stats[month].present++;
      else if (record.status === 'absent') stats[month].absent++;
      else if (record.status === 'late') stats[month].late++;
    });
    
    return stats.map((s, i) => ({
      month: months[i],
      ...s,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
    }));
  }, [attendanceData]);

  const getHeatColor = (percentage) => {
    if (percentage >= 95) return 'bg-emerald-500';
    if (percentage >= 85) return 'bg-green-400';
    if (percentage >= 75) return 'bg-yellow-400';
    if (percentage >= 60) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Yearly Overview - {year}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Low</span>
          <div className="flex gap-1">
            {['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500'].map((c, i) => (
              <div key={i} className={cn("w-4 h-4 rounded", c)} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>
      
      <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
        {monthlyStats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer">
            <div 
              className={cn(
                "w-full aspect-square rounded-lg transition-all duration-300",
                stat.total > 0 ? getHeatColor(stat.percentage) : "bg-gray-200 dark:bg-gray-700",
                "hover:scale-110 hover:shadow-lg"
              )}
              title={`${stat.month}: ${stat.percentage}% attendance`}
            />
            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {stat.month}
            </span>
            <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              {stat.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 STREAK & ACHIEVEMENTS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const StreakAchievements = ({ attendanceData }) => {
  // Calculate streaks
  const { currentStreak, longestStreak, perfectMonths } = useMemo(() => {
    if (!attendanceData.length) return { currentStreak: 0, longestStreak: 0, perfectMonths: 0 };

    // Sort by date
    const sorted = [...attendanceData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Current streak
    let current = 0;
    for (const record of sorted) {
      if (record.status === 'present' || record.status === 'late') {
        current++;
      } else if (record.status === 'absent') {
        break;
      }
    }

    // Longest streak
    let longest = 0;
    let tempStreak = 0;
    const ascending = [...attendanceData].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const record of ascending) {
      if (record.status === 'present' || record.status === 'late') {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else if (record.status === 'absent') {
        tempStreak = 0;
      }
    }

    // Perfect months (100% attendance)
    const monthMap = {};
    attendanceData.forEach(r => {
      const month = r.date.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { present: 0, absent: 0 };
      if (r.status === 'present' || r.status === 'late') monthMap[month].present++;
      else if (r.status === 'absent') monthMap[month].absent++;
    });
    const perfect = Object.values(monthMap).filter(m => m.absent === 0 && m.present > 0).length;

    return { currentStreak: current, longestStreak: longest, perfectMonths: perfect };
  }, [attendanceData]);

  const achievements = [
    { 
      icon: Flame, 
      title: "Current Streak", 
      value: currentStreak,
      suffix: "days",
      color: currentStreak >= 30 ? "text-orange-500" : currentStreak >= 7 ? "text-yellow-500" : "text-muted-foreground"
    },
    { 
      icon: Award, 
      title: "Longest Streak", 
      value: longestStreak,
      suffix: "days",
      color: longestStreak >= 60 ? "text-purple-500" : longestStreak >= 30 ? "text-blue-500" : "text-muted-foreground"
    },
    { 
      icon: Sparkles, 
      title: "Perfect Months", 
      value: perfectMonths,
      suffix: perfectMonths === 1 ? "month" : "months",
      color: perfectMonths >= 6 ? "text-emerald-500" : perfectMonths >= 3 ? "text-green-500" : "text-muted-foreground"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {achievements.map((achievement, i) => (
        <div 
          key={i} 
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border shadow-sm hover:shadow-md transition-all group"
        >
          <achievement.icon className={cn("h-8 w-8 mb-2 transition-transform group-hover:scale-110", achievement.color)} />
          <span className="text-2xl font-bold">{achievement.value}</span>
          <span className="text-xs text-muted-foreground">{achievement.suffix}</span>
          <span className="text-xs font-medium mt-1">{achievement.title}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 RECENT ATTENDANCE LIST
// ═══════════════════════════════════════════════════════════════════════════════

const RecentAttendanceList = ({ attendanceData }) => {
  const recentRecords = useMemo(() => {
    return [...attendanceData]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15);
  }, [attendanceData]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"><CheckCircle2 className="h-3 w-3 mr-1" /> Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" /> Absent</Badge>;
      case 'late':
        return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"><Clock className="h-3 w-3 mr-1" /> Late</Badge>;
      case 'half_day':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"><Sun className="h-3 w-3 mr-1" /> Half Day</Badge>;
      case 'leave':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"><CalendarDays className="h-3 w-3 mr-1" /> Leave</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-2">
        {recentRecords.length > 0 ? recentRecords.map((record, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-sm">
                {format(parseISO(record.date), 'd')}
              </div>
              <div>
                <p className="font-medium">{format(parseISO(record.date), 'EEEE')}</p>
                <p className="text-xs text-muted-foreground">{format(parseISO(record.date), 'dd MMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {record.check_in_time && (
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Check In</p>
                  <p className="text-sm font-medium">{record.check_in_time}</p>
                </div>
              )}
              {record.check_out_time && (
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Check Out</p>
                  <p className="text-sm font-medium">{record.check_out_time}</p>
                </div>
              )}
              {getStatusBadge(record.status)}
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No attendance records found</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const StudentProfileAttendanceTab = ({ studentId }) => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedView, setSelectedView] = useState('calendar');

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    if (!studentId || !selectedBranch?.id) return;
    
    setLoading(true);
    try {
      // Get attendance for current academic year (approx last 12 months)
      const startDate = format(subMonths(new Date(), 12), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('branch_id', selectedBranch.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error loading attendance', 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedBranch, toast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter(a => a.status === 'present').length;
    const absent = attendanceData.filter(a => a.status === 'absent').length;
    const late = attendanceData.filter(a => a.status === 'late').length;
    const leave = attendanceData.filter(a => a.status === 'leave').length;
    const halfDay = attendanceData.filter(a => a.status === 'half_day').length;
    
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    const effectiveRate = total > 0 ? Math.round(((present + (halfDay * 0.5) + (late * 0.8)) / total) * 100) : 0;
    
    // Calculate trend (compare last 30 days with previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = subMonths(now, 1);
    const sixtyDaysAgo = subMonths(now, 2);
    
    const recent = attendanceData.filter(a => new Date(a.date) >= thirtyDaysAgo);
    const previous = attendanceData.filter(a => new Date(a.date) >= sixtyDaysAgo && new Date(a.date) < thirtyDaysAgo);
    
    const recentRate = recent.length > 0 ? (recent.filter(a => a.status === 'present').length / recent.length) * 100 : 0;
    const previousRate = previous.length > 0 ? (previous.filter(a => a.status === 'present').length / previous.length) * 100 : 0;
    const trend = previous.length > 0 ? Math.round(recentRate - previousRate) : 0;

    return { total, present, absent, late, leave, halfDay, attendanceRate, effectiveRate, trend };
  }, [attendanceData]);

  if (loading) {
    return (
      <GlassCard className="p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard 
          icon={Activity} 
          label="Attendance Rate" 
          value={`${stats.attendanceRate}%`}
          subValue={`${stats.total} total days`}
          trend={stats.trend}
          color={stats.attendanceRate >= 90 ? "green" : stats.attendanceRate >= 75 ? "orange" : "red"}
          glowEffect
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Present Days" 
          value={stats.present}
          subValue={`${Math.round((stats.present / (stats.total || 1)) * 100)}% of total`}
          color="green"
        />
        <StatCard 
          icon={XCircle} 
          label="Absent Days" 
          value={stats.absent}
          subValue={stats.absent > 5 ? "⚠️ High absences" : "Within limit"}
          color="red"
        />
        <StatCard 
          icon={Clock} 
          label="Late Arrivals" 
          value={stats.late}
          subValue="Counted as present"
          color="orange"
        />
        <StatCard 
          icon={CalendarDays} 
          label="Leave Days" 
          value={stats.leave}
          subValue="Approved leaves"
          color="blue"
        />
        <StatCard 
          icon={Target} 
          label="Effective Rate" 
          value={`${stats.effectiveRate}%`}
          subValue="Including partial days"
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section - Takes 2 columns */}
        <GlassCard className="lg:col-span-2 p-6" gradient>
          <Tabs value={selectedView} onValueChange={setSelectedView}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Attendance Calendar
              </h3>
              <TabsList className="grid grid-cols-3 w-[280px]">
                <TabsTrigger value="calendar" className="text-xs">
                  <CalendarDays className="h-3 w-3 mr-1" /> Monthly
                </TabsTrigger>
                <TabsTrigger value="yearly" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" /> Yearly
                </TabsTrigger>
                <TabsTrigger value="list" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" /> List
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="calendar" className="mt-0">
              <AttendanceCalendar 
                attendanceData={attendanceData}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            </TabsContent>

            <TabsContent value="yearly" className="mt-0">
              <YearlyHeatmap 
                attendanceData={attendanceData}
                year={new Date().getFullYear()}
              />
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <RecentAttendanceList attendanceData={attendanceData} />
            </TabsContent>
          </Tabs>
        </GlassCard>

        {/* Right Side - Achievements & Recent */}
        <div className="space-y-6">
          {/* Streaks & Achievements */}
          <GlassCard className="p-6" gradient>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-amber-500" />
              Streaks & Achievements
            </h3>
            <StreakAchievements attendanceData={attendanceData} />
          </GlassCard>

          {/* Progress Bar */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Attendance Goal
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current: {stats.attendanceRate}%</span>
                  <span className="text-sm font-medium">Target: 90%</span>
                </div>
                <Progress 
                  value={stats.attendanceRate} 
                  className="h-3"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                {stats.attendanceRate >= 90 ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Goal Achieved! 🎉</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-orange-600 font-medium">
                      {90 - stats.attendanceRate}% more needed
                    </span>
                  </>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Quick Summary */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <PieChart className="h-5 w-5 text-blue-500" />
              Quick Summary
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Present', value: stats.present, total: stats.total, color: 'bg-emerald-500' },
                { label: 'Absent', value: stats.absent, total: stats.total, color: 'bg-red-500' },
                { label: 'Late', value: stats.late, total: stats.total, color: 'bg-orange-500' },
                { label: 'Leave', value: stats.leave, total: stats.total, color: 'bg-blue-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", item.color)} />
                  <span className="text-sm flex-1">{item.label}</span>
                  <span className="text-sm font-bold">{item.value}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileAttendanceTab;
