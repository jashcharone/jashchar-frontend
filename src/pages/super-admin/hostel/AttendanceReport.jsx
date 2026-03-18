import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, ArrowLeft, BarChart3, Download, Users, Calendar, TrendingDown
} from 'lucide-react';

const AttendanceReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [reportType, setReportType] = useState('summary');

  // Summary state
  const [summaryData, setSummaryData] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Monthly state
  const [monthlyData, setMonthlyData] = useState(null);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));

  // Fetch hostels
  useEffect(() => {
    const load = async () => {
      if (!branchId) return;
      try {
        const res = await api.get('/hostel/list');
        if (res.data?.success) setHostels(res.data.data || []);
      } catch (err) {
        console.error('Error:', err);
      }
    };
    load();
  }, [branchId]);

  // Fetch summary report
  const fetchSummary = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { startDate, endDate };
      if (selectedHostel !== 'all') params.hostelId = selectedHostel;

      const res = await api.get('/hostel-attendance/summary', { params });
      if (res.data?.success) setSummaryData(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [branchId, startDate, endDate, selectedHostel, toast]);

  // Fetch monthly report
  const fetchMonthly = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { year: selectedYear, month: selectedMonth };
      if (selectedHostel !== 'all') params.hostelId = selectedHostel;

      const res = await api.get('/hostel-attendance/report/monthly', { params });
      if (res.data?.success) setMonthlyData(res.data.data);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedYear, selectedMonth, selectedHostel, toast]);

  const handleGenerate = () => {
    if (reportType === 'summary') fetchSummary();
    else fetchMonthly();
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">📊 Hostel Attendance Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Detailed attendance reports and analytics</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">📋 Summary</SelectItem>
                    <SelectItem value="monthly">📅 Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Hostel</label>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hostels</SelectItem>
                    {hostels.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reportType === 'summary' ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">From</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">To</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Year</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026, 2027].map(y => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Month</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {months.map((m, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="flex items-end">
                <Button className="w-full" onClick={handleGenerate} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-1" />}
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Report */}
        {reportType === 'summary' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Attendance Summary ({formatDate(startDate)} — {formatDate(endDate)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : summaryData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Click "Generate" to load report</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead className="text-center">Late</TableHead>
                        <TableHead className="text-center">Leave</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryData.map((s, idx) => (
                        <TableRow key={s.studentId}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            {s.student?.full_name || s.student?.first_name || '-'}
                          </TableCell>
                          <TableCell>{s.student?.admission_number || '-'}</TableCell>
                          <TableCell>{s.student?.class?.name || '-'}</TableCell>
                          <TableCell className="text-center text-green-600 dark:text-green-400 font-medium">{s.present}</TableCell>
                          <TableCell className="text-center text-red-600 dark:text-red-400 font-medium">{s.absent}</TableCell>
                          <TableCell className="text-center text-yellow-600 dark:text-yellow-400 font-medium">{s.late}</TableCell>
                          <TableCell className="text-center text-blue-600 dark:text-blue-400 font-medium">{s.onLeave + s.medicalLeave}</TableCell>
                          <TableCell className="text-center">{s.total}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${getAttendanceColor(s.attendanceRate)}`}>
                              {s.attendanceRate}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Monthly Report */}
        {reportType === 'monthly' && monthlyData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Monthly Report — {months[monthlyData.month - 1]} {monthlyData.year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (monthlyData.students || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No data available for this month</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-center">P</TableHead>
                        <TableHead className="text-center">A</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.students.map((s, idx) => (
                        <TableRow key={s.studentId}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            {s.student?.full_name || '-'}
                          </TableCell>
                          <TableCell>{s.student?.class?.name || '-'}</TableCell>
                          <TableCell className="text-center text-green-600 dark:text-green-400 font-medium">{s.present}</TableCell>
                          <TableCell className="text-center text-red-600 dark:text-red-400 font-medium">{s.absent}</TableCell>
                          <TableCell className="text-center text-yellow-600 dark:text-yellow-400 font-medium">{s.late}</TableCell>
                          <TableCell className="text-center">{s.total}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${getAttendanceColor(s.attendanceRate)}`}>
                              {s.attendanceRate}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceReport;
