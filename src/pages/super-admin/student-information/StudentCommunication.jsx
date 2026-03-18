import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { getApiBaseUrl } from '@/utils/platform';
import { formatDateTime } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, MessageSquare, Clock, Users, Filter, Search, ChevronLeft, ChevronRight,
  Mail, Phone, Loader2, CheckCircle2, XCircle, AlertCircle, FileText, Plus,
  BarChart3, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const _apiBase = getApiBaseUrl();
const BASE_URL = _apiBase ? `${_apiBase}/api` : '/api';

const CHANNEL_OPTIONS = [
  { value: 'sms', label: 'SMS', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
];

const RECIPIENT_TYPES = [
  { value: 'class', label: 'Entire Class' },
  { value: 'section', label: 'Class & Section' },
  { value: 'individual', label: 'Select Students' },
  { value: 'low_attendance', label: 'Low Attendance Students' },
  { value: 'fee_defaulters', label: 'Fee Defaulters' },
];

const TEMPLATE_CATEGORIES = [
  { value: 'fee_reminder', label: 'Fee Reminder', color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30' },
  { value: 'attendance_alert', label: 'Attendance Alert', color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30' },
  { value: 'exam_schedule', label: 'Exam Schedule', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30' },
  { value: 'holiday_notice', label: 'Holiday Notice', color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30' },
  { value: 'result_notification', label: 'Result Notification', color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30' },
  { value: 'general', label: 'General', color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800' },
  { value: 'custom', label: 'Custom', color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30' },
];

export default function StudentCommunication() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  const [activeTab, setActiveTab] = useState('compose');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Compose form state
  const [channel, setChannel] = useState('sms');
  const [recipientType, setRecipientType] = useState('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Data
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logPagination, setLogPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [selectedLog, setSelectedLog] = useState(null);
  const [logDetailOpen, setLogDetailOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, sms: 0, email: 0, whatsapp: 0 });

  const branchId = selectedBranch?.id;

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  }, []);

  const headers = useCallback(async () => {
    const token = await getToken();
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-branch-id': branchId };
  }, [getToken, branchId]);

  // Load classes
  useEffect(() => {
    if (!branchId || !organizationId) return;
    (async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('display_order');
      setClasses(data || []);
    })();
  }, [branchId, organizationId]);

  // Load sections when class changes
  useEffect(() => {
    if (!selectedClass) { setSections([]); return; }
    (async () => {
      const { data } = await supabase
        .from('sections')
        .select('id, name')
        .eq('class_id', selectedClass)
        .eq('is_active', true)
        .order('name');
      setSections(data || []);
    })();
  }, [selectedClass]);

  // Load students for selection
  useEffect(() => {
    if (!branchId || !currentSessionId || !selectedClass) { setStudents([]); return; }
    (async () => {
      let q = supabase
        .from('student_profiles')
        .select('id, full_name, father_phone, mother_phone, father_email, class_id, section_id, roll_number, classes(name), sections(name)')
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId)
        .eq('status', 'active')
        .eq('class_id', selectedClass);
      if (selectedSection) q = q.eq('section_id', selectedSection);
      q = q.order('full_name');
      const { data } = await q;
      setStudents(data || []);
    })();
  }, [branchId, currentSessionId, selectedClass, selectedSection]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    if (!branchId) return;
    try {
      const h = await headers();
      const res = await fetch(`${BASE_URL}/student-communication/templates`, { headers: h });
      const json = await res.json();
      if (json.success) setTemplates(json.data);
    } catch (e) { console.error(e); }
  }, [branchId, headers]);

  // Load communication log
  const loadLogs = useCallback(async (page = 1) => {
    if (!branchId) return;
    setLoading(true);
    try {
      const h = await headers();
      const res = await fetch(`${BASE_URL}/student-communication/log?page=${page}&limit=15`, { headers: h });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
        setLogPagination(json.pagination);
        // Compute stats from recent logs
        const s = { total: json.pagination.total, sms: 0, email: 0, whatsapp: 0 };
        json.data.forEach(l => { if (s[l.channel] !== undefined) s[l.channel]++; });
        setStats(s);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [branchId, headers]);

  useEffect(() => { loadTemplates(); loadLogs(); }, [loadTemplates, loadLogs]);

  // Send communication
  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const h = await headers();
      const filter = {};
      if (recipientType === 'class' || recipientType === 'section') {
        filter.class_id = selectedClass;
        if (selectedSection) filter.section_id = selectedSection;
      }
      if (recipientType === 'individual' || recipientType === 'custom' || recipientType === 'low_attendance' || recipientType === 'fee_defaulters') {
        filter.student_ids = selectedStudents;
      }

      const res = await fetch(`${BASE_URL}/student-communication/send`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          channel,
          recipientType,
          recipientFilter: filter,
          subject: channel === 'email' ? subject : undefined,
          message,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage('');
        setSubject('');
        setSelectedStudents([]);
        loadLogs();
        setActiveTab('history');
      }
    } catch (e) { console.error(e); }
    setSending(false);
  };

  // View log detail
  const viewLogDetail = async (logId) => {
    try {
      const h = await headers();
      const res = await fetch(`${BASE_URL}/student-communication/log/${logId}`, { headers: h });
      const json = await res.json();
      if (json.success) {
        setSelectedLog(json.data);
        setLogDetailOpen(true);
      }
    } catch (e) { console.error(e); }
  };

  // Apply template
  const applyTemplate = (tpl) => {
    setMessage(tpl.body);
    if (tpl.subject) setSubject(tpl.subject);
    if (tpl.channel !== 'all') setChannel(tpl.channel);
  };

  const toggleStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) setSelectedStudents([]);
    else setSelectedStudents(filteredStudents.map(s => s.id));
  };

  const filteredStudents = students.filter(s =>
    !searchTerm || s.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const channelBadge = (ch) => {
    const colors = { sms: 'bg-green-100 text-green-700', email: 'bg-blue-100 text-blue-700', whatsapp: 'bg-emerald-100 text-emerald-700' };
    return <Badge className={cn('text-xs', colors[ch])}>{ch.toUpperCase()}</Badge>;
  };

  const recipientCount = recipientType === 'individual' || recipientType === 'custom' || recipientType === 'low_attendance' || recipientType === 'fee_defaulters'
    ? selectedStudents.length
    : students.length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" /> Student Communication Hub
          </h1>
          <p className="text-muted-foreground mt-1">Send SMS, Email, or WhatsApp messages to students and parents</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Sent', value: stats.total, icon: Send, color: 'text-primary' },
            { label: 'SMS', value: stats.sms, icon: Phone, color: 'text-green-600' },
            { label: 'Email', value: stats.email, icon: Mail, color: 'text-blue-600' },
            { label: 'WhatsApp', value: stats.whatsapp, icon: MessageSquare, color: 'text-emerald-600' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn('h-8 w-8', s.color)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="compose"><Send className="h-4 w-4 mr-1" /> Compose</TabsTrigger>
            <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-1" /> Templates</TabsTrigger>
            <TabsTrigger value="history"><Clock className="h-4 w-4 mr-1" /> History</TabsTrigger>
          </TabsList>

          {/* ===== COMPOSE TAB ===== */}
          <TabsContent value="compose" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Message Form */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compose Message</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Channel */}
                    <div>
                      <Label>Channel</Label>
                      <div className="flex gap-2 mt-1">
                        {CHANNEL_OPTIONS.map(ch => (
                          <Button
                            key={ch.value}
                            variant={channel === ch.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChannel(ch.value)}
                          >
                            <ch.icon className="h-4 w-4 mr-1" /> {ch.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Recipient Type */}
                    <div>
                      <Label>Send To</Label>
                      <Select value={recipientType} onValueChange={setRecipientType}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {RECIPIENT_TYPES.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Class / Section selector */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Class</Label>
                        <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSection(''); setSelectedStudents([]); }}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Section</Label>
                        <Select value={selectedSection} onValueChange={v => { setSelectedSection(v); setSelectedStudents([]); }}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="All sections" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All</SelectItem>
                            {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Student Selector (for individual/custom) */}
                    {(recipientType === 'individual' || recipientType === 'custom' || recipientType === 'low_attendance' || recipientType === 'fee_defaulters') && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Select Students ({selectedStudents.length} selected)</Label>
                          <Button variant="ghost" size="sm" onClick={selectAllStudents}>
                            {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        <Input
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                        <ScrollArea className="h-48 border rounded-lg p-2">
                          {filteredStudents.map(s => (
                            <div key={s.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50">
                              <Checkbox
                                checked={selectedStudents.includes(s.id)}
                                onCheckedChange={() => toggleStudent(s.id)}
                              />
                              <span className="text-sm flex-1">{s.full_name}</span>
                              <span className="text-xs text-muted-foreground">{s.classes?.name} {s.sections?.name}</span>
                            </div>
                          ))}
                          {filteredStudents.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              {selectedClass ? 'No students found' : 'Select a class first'}
                            </p>
                          )}
                        </ScrollArea>
                      </div>
                    )}

                    {/* Subject (email only) */}
                    {channel === 'email' && (
                      <div>
                        <Label>Subject</Label>
                        <Input value={subject} onChange={e => setSubject(e.target.value)} className="mt-1" placeholder="Email subject" />
                      </div>
                    )}

                    {/* Message */}
                    <div>
                      <Label>Message</Label>
                      <Textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        className="mt-1 min-h-[120px]"
                        placeholder="Type your message here... Use {student_name}, {class}, {parent_name} for dynamic fields"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{message.length} characters</p>
                    </div>

                    {/* Send button */}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-muted-foreground">
                        <Users className="h-4 w-4 inline mr-1" />
                        {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
                      </p>
                      <Button onClick={handleSend} disabled={sending || !message.trim() || recipientCount === 0}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                        Send {channel.toUpperCase()}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Quick Templates */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Templates</CardTitle>
                    <CardDescription>Click to apply a template</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {templates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No templates yet</p>
                    ) : (
                      templates.map(tpl => {
                        const cat = TEMPLATE_CATEGORIES.find(c => c.value === tpl.category);
                        return (
                          <button
                            key={tpl.id}
                            onClick={() => applyTemplate(tpl)}
                            className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={cn('text-xs', cat?.color)}>{cat?.label || tpl.category}</Badge>
                              {channelBadge(tpl.channel)}
                            </div>
                            <p className="text-sm font-medium">{tpl.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{tpl.body}</p>
                          </button>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Preview */}
                {message && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">{message}</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ===== TEMPLATES TAB ===== */}
          <TabsContent value="templates" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Message Templates</CardTitle>
                  <CardDescription>Create reusable message templates</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No templates created yet. Templates created from the Compose tab will appear here.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(tpl => {
                      const cat = TEMPLATE_CATEGORIES.find(c => c.value === tpl.category);
                      return (
                        <Card key={tpl.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={cn('text-xs', cat?.color)}>{cat?.label}</Badge>
                              {channelBadge(tpl.channel)}
                            </div>
                            <p className="font-semibold">{tpl.name}</p>
                            {tpl.subject && <p className="text-sm text-muted-foreground">Subject: {tpl.subject}</p>}
                            <p className="text-sm mt-1 line-clamp-3">{tpl.body}</p>
                            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => applyTemplate(tpl)}>
                              Use Template
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== HISTORY TAB ===== */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Communication History</CardTitle>
                <CardDescription>All messages sent to students and parents</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No communications sent yet</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Date</th>
                            <th className="text-left py-2 px-3 font-medium">Channel</th>
                            <th className="text-left py-2 px-3 font-medium">Recipients</th>
                            <th className="text-left py-2 px-3 font-medium">Type</th>
                            <th className="text-left py-2 px-3 font-medium">Message</th>
                            <th className="text-left py-2 px-3 font-medium">Status</th>
                            <th className="text-right py-2 px-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map(log => (
                            <tr key={log.id} className="border-b hover:bg-muted/30">
                              <td className="py-2 px-3 whitespace-nowrap">{formatDateTime(log.sent_at)}</td>
                              <td className="py-2 px-3">{channelBadge(log.channel)}</td>
                              <td className="py-2 px-3">{log.total_recipients}</td>
                              <td className="py-2 px-3 capitalize">{log.recipient_type?.replace('_', ' ')}</td>
                              <td className="py-2 px-3 max-w-[200px] truncate">{log.message}</td>
                              <td className="py-2 px-3">
                                <Badge variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'outline'}>
                                  {log.status}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Button variant="ghost" size="sm" onClick={() => viewLogDetail(log.id)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {logPagination.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button variant="outline" size="sm" disabled={logPagination.page <= 1} onClick={() => loadLogs(logPagination.page - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">Page {logPagination.page} of {logPagination.totalPages}</span>
                        <Button variant="outline" size="sm" disabled={logPagination.page >= logPagination.totalPages} onClick={() => loadLogs(logPagination.page + 1)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={logDetailOpen} onOpenChange={setLogDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Communication Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Channel:</span> {channelBadge(selectedLog.channel)}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge>{selectedLog.status}</Badge></div>
                <div><span className="text-muted-foreground">Sent:</span> {formatDateTime(selectedLog.sent_at)}</div>
                <div><span className="text-muted-foreground">Recipients:</span> {selectedLog.total_recipients}</div>
                <div><span className="text-muted-foreground">Delivered:</span> {selectedLog.delivered}</div>
                <div><span className="text-muted-foreground">Failed:</span> {selectedLog.failed}</div>
              </div>
              {selectedLog.subject && (
                <div>
                  <Label className="text-muted-foreground">Subject</Label>
                  <p className="text-sm mt-1">{selectedLog.subject}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Message</Label>
                <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">{selectedLog.message}</p>
              </div>
              {selectedLog.deliveries?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Recipients ({selectedLog.deliveries.length})</Label>
                  <ScrollArea className="h-48 mt-2 border rounded-lg p-2">
                    {selectedLog.deliveries.map(d => (
                      <div key={d.id} className="flex items-center justify-between py-1.5 px-2 text-sm border-b last:border-0">
                        <span>{d.student_profiles?.full_name || 'Unknown'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{d.parent_phone || d.parent_email}</span>
                          {d.status === 'sent' || d.status === 'delivered' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
