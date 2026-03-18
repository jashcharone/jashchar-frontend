import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, ArrowLeft, Users, Bell, Home, Calendar, Clock,
  RefreshCw, Plus, CheckCircle, MessageSquare, Send, Mail
} from 'lucide-react';

const ParentHostelDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [showSend, setShowSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendForm, setSendForm] = useState({
    student_id: '', notification_type: 'general', title: '', message: '', priority: 'normal'
  });

  useEffect(() => {
    if (!branchId) return;
    api.get('/students', { params: { branchId, limit: 500 } }).then(r => {
      if (r.data?.data) setStudents(r.data.data || []);
    });
  }, [branchId]);

  const fetchNotifications = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { branchId, limit: 50 };
      if (selectedStudent !== 'all') params.studentId = selectedStudent;

      const [notifRes, unreadRes] = await Promise.all([
        api.get('/hostel-parent/notifications', { params }),
        api.get('/hostel-parent/notifications/unread-count', { params: { branchId } })
      ]);

      if (notifRes.data?.success) {
        setNotifications(notifRes.data.data || []);
        setTotal(notifRes.data.total || 0);
      }
      if (unreadRes.data?.success) setUnreadCount(unreadRes.data.data?.unreadCount || 0);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load notifications' });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedStudent]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleSend = async () => {
    if (!sendForm.student_id || !sendForm.title || !sendForm.message) {
      toast({ variant: 'destructive', title: 'Error', description: 'Student, title, message are required' });
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/hostel-parent/notifications', { ...sendForm, branchId });
      if (res.data?.success) {
        toast({ title: 'Notification sent!' });
        setShowSend(false);
        setSendForm({ student_id: '', notification_type: 'general', title: '', message: '', priority: 'normal' });
        fetchNotifications();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send' });
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/hostel-parent/notifications/${id}/read`, { branchId });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const typeIcon = (type) => {
    const map = {
      attendance: <Calendar className="h-4 w-4 text-blue-500" />,
      leave: <Clock className="h-4 w-4 text-orange-500" />,
      fee: <Home className="h-4 w-4 text-green-500" />,
      complaint: <MessageSquare className="h-4 w-4 text-red-500" />,
      general: <Bell className="h-4 w-4 text-gray-500" />
    };
    return map[type] || <Bell className="h-4 w-4" />;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-indigo-600" /> Parent Hostel Portal</h1>
              <p className="text-sm text-muted-foreground">Manage parent notifications & student hostel info</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchNotifications} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
            <Button onClick={() => setShowSend(true)} size="sm"><Send className="h-4 w-4 mr-1" /> Send Notification</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-sm text-muted-foreground">Total Notifications</p>
          </CardContent></Card>
          <Card className={unreadCount > 0 ? 'border-red-300 dark:border-red-700' : ''}>
            <CardContent className="p-4 text-center">
              <Mail className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{unreadCount}</p>
              <p className="text-sm text-muted-foreground">Unread</p>
            </CardContent>
          </Card>
          <Card><CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{students.length}</p>
            <p className="text-sm text-muted-foreground">Students</p>
          </CardContent></Card>
        </div>

        {/* Quick Nav */}
        <div className="flex gap-2 flex-wrap">
          {students.slice(0, 10).map(s => (
            <Button key={s.id} variant="outline" size="sm" onClick={() => navigate(`/super-admin/hostel/student-hostel-view/${s.id}`)}>
              {s.full_name}
            </Button>
          ))}
        </div>

        {/* Filter */}
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-60"><SelectValue placeholder="Filter by student" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No notifications found</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Card key={n.id} className={!n.is_read ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/50' : ''}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="mt-1">{typeIcon(n.notification_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{n.title}</span>
                      {!n.is_read && <Badge variant="destructive" className="text-xs">New</Badge>}
                      <Badge variant="outline" className="text-xs">{n.notification_type}</Badge>
                      {n.priority === 'urgent' && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</span>
                      {n.student_profiles?.full_name && <span className="text-xs">Student: {n.student_profiles.full_name}</span>}
                    </div>
                  </div>
                  {!n.is_read && (
                    <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)}><CheckCircle className="h-4 w-4" /></Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Send Notification Dialog */}
        <Dialog open={showSend} onOpenChange={setShowSend}>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Parent Notification</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Student *</Label>
                <Select value={sendForm.student_id} onValueChange={(v) => setSendForm(p => ({ ...p, student_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Type</Label>
                <Select value={sendForm.notification_type} onValueChange={(v) => setSendForm(p => ({ ...p, notification_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={sendForm.priority} onValueChange={(v) => setSendForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Title *</Label><Input value={sendForm.title} onChange={(e) => setSendForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Message *</Label><Textarea value={sendForm.message} onChange={(e) => setSendForm(p => ({ ...p, message: e.target.value }))} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSend(false)}>Cancel</Button>
              <Button onClick={handleSend} disabled={sending}>{sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Send</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ParentHostelDashboard;
