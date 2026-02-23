/**
 * ParentAttendance - View child's attendance records
 */
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChildSelector from '@/components/ChildSelector';
import { useParentChild } from '@/contexts/ParentChildContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckSquare } from 'lucide-react';
import { format, subDays } from 'date-fns';

const ParentAttendance = () => {
  const { selectedChild } = useParentChild();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, half_day: 0, leave: 0 });

  const fetchAttendance = useCallback(async () => {
    if (!selectedChild?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('student_attendance')
        .select('date, status, remark')
        .eq('student_id', selectedChild.id)
        .gte('date', thirtyDaysAgo)
        .lte('date', today)
        .order('date', { ascending: false });

      if (error) throw error;

      setAttendance(data || []);

      const summaryData = (data || []).reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, { present: 0, absent: 0, late: 0, half_day: 0, leave: 0 });
      setSummary(summaryData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching attendance', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [selectedChild, toast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const getStatusPill = (status) => {
    const baseClasses = 'px-3 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'present': return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`;
      case 'absent': return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`;
      case 'late': return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`;
      case 'half_day': return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300`;
      case 'leave': return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300`;
      default: return `${baseClasses} bg-gray-50 text-gray-500`;
    }
  };

  const childName = selectedChild ? (selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`) : '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckSquare className="h-6 w-6" />
          Child Attendance
        </h1>

        <ChildSelector />

        {!selectedChild ? (
          <Card className="p-8 text-center text-muted-foreground">No child selected</Card>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <Card>
              <CardHeader><CardTitle>Last 30 Days Summary - {childName}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-3xl font-bold text-green-600">{summary.present || 0}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-3xl font-bold text-red-600">{summary.absent || 0}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <p className="text-3xl font-bold text-yellow-600">{summary.late || 0}</p>
                  <p className="text-sm text-muted-foreground">Late</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-3xl font-bold text-blue-600">{summary.half_day || 0}</p>
                  <p className="text-sm text-muted-foreground">Half Day</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                  <p className="text-3xl font-bold text-gray-600">{summary.leave || 0}</p>
                  <p className="text-sm text-muted-foreground">Leave</p>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Records */}
            <Card>
              <CardHeader><CardTitle>Attendance Records</CardTitle></CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No attendance records found</p>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((record, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{format(new Date(record.date), 'EEE, dd MMM yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={getStatusPill(record.status)}>
                            {record.status?.replace('_', ' ').toUpperCase()}
                          </span>
                          {record.remark && (
                            <span className="text-xs text-muted-foreground ml-2">{record.remark}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentAttendance;
