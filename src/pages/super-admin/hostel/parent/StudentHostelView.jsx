import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, ArrowLeft, User, Home, Calendar, Clock, MessageSquare,
  UtensilsCrossed, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';

const StudentHostelView = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [hostelInfo, setHostelInfo] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [mealHistory, setMealHistory] = useState([]);

  const fetchData = useCallback(async () => {
    if (!branchId || !studentId) return;
    setLoading(true);
    try {
      const params = { branchId };
      const [infoRes, attRes, leaveRes, compRes, mealRes] = await Promise.all([
        api.get(`/hostel-parent/student/${studentId}/hostel-info`, { params }),
        api.get(`/hostel-parent/student/${studentId}/attendance-summary`, { params }),
        api.get(`/hostel-parent/student/${studentId}/leave-history`, { params }),
        api.get(`/hostel-parent/student/${studentId}/complaints`, { params }),
        api.get(`/hostel-parent/student/${studentId}/meal-history`, { params })
      ]);

      if (infoRes.data?.success) setHostelInfo(infoRes.data.data);
      if (attRes.data?.success) setAttendanceSummary(attRes.data.data);
      if (leaveRes.data?.success) setLeaveHistory(leaveRes.data.data || []);
      if (compRes.data?.success) setComplaints(compRes.data.data || []);
      if (mealRes.data?.success) setMealHistory(mealRes.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load student data' });
    } finally {
      setLoading(false);
    }
  }, [branchId, studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><User className="h-6 w-6 text-indigo-600" /> Student Hostel View</h1>
              <p className="text-sm text-muted-foreground">Complete hostel information for student</p>
            </div>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            {/* Hostel Info */}
            {hostelInfo && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Hostel & Room Info</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Student</p>
                      <p className="font-semibold">{hostelInfo.student_profiles?.full_name || hostelInfo.full_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hostel</p>
                      <p className="font-semibold">{hostelInfo.hostels?.hostel_name || hostelInfo.hostel_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Room</p>
                      <p className="font-semibold">{hostelInfo.hostel_rooms?.room_number || hostelInfo.room_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Admission Date</p>
                      <p className="font-semibold">{hostelInfo.admission_date ? formatDate(hostelInfo.admission_date) : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attendance Summary */}
            {attendanceSummary && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Attendance Summary (Last 30 Days)</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                      <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-1" />
                      <p className="text-2xl font-bold text-green-600">{attendanceSummary.present || 0}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded">
                      <XCircle className="h-6 w-6 mx-auto text-red-500 mb-1" />
                      <p className="text-2xl font-bold text-red-600">{attendanceSummary.absent || 0}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded">
                      <Clock className="h-6 w-6 mx-auto text-orange-500 mb-1" />
                      <p className="text-2xl font-bold text-orange-600">{attendanceSummary.on_leave || 0}</p>
                      <p className="text-xs text-muted-foreground">On Leave</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded">
                      <Calendar className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                      <p className="text-2xl font-bold text-blue-600">{attendanceSummary.percentage || 0}%</p>
                      <p className="text-xs text-muted-foreground">Attendance %</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leave History */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Leave History</CardTitle></CardHeader>
              <CardContent>
                {leaveHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No leave records found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveHistory.map(l => (
                        <TableRow key={l.id}>
                          <TableCell><Badge variant="outline">{l.leave_type}</Badge></TableCell>
                          <TableCell>{formatDate(l.from_date)}</TableCell>
                          <TableCell>{formatDate(l.to_date)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{l.reason}</TableCell>
                          <TableCell><Badge variant={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'destructive' : 'secondary'}>{l.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Complaints */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Complaints</CardTitle></CardHeader>
              <CardContent>
                {complaints.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No complaints filed</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complaints.map(c => (
                        <TableRow key={c.id}>
                          <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                          <TableCell className="max-w-[200px] truncate">{c.subject}</TableCell>
                          <TableCell><Badge variant={c.priority === 'high' ? 'destructive' : 'secondary'}>{c.priority}</Badge></TableCell>
                          <TableCell><Badge variant={c.status === 'resolved' ? 'success' : c.status === 'open' ? 'destructive' : 'warning'}>{c.status}</Badge></TableCell>
                          <TableCell>{formatDate(c.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Meal History */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><UtensilsCrossed className="h-5 w-5" /> Meal History (Last 7 Days)</CardTitle></CardHeader>
              <CardContent>
                {mealHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No meal records found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Meal Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mealHistory.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell>{formatDate(m.meal_date || m.date)}</TableCell>
                          <TableCell><Badge variant="outline">{m.meal_type}</Badge></TableCell>
                          <TableCell>
                            {m.opted_in ? (
                              <Badge variant="success">Attended</Badge>
                            ) : (
                              <Badge variant="secondary">Skipped</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentHostelView;
