import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, formatDateTime, formatTime } from '@/utils/dateUtils';
import { 
    Loader2, Plus, Edit, Trash2, Eye, MoreHorizontal, Calendar, Clock, Users,
    Video, MapPin, Phone, CheckCircle, XCircle, AlertCircle, Play, User, Search
} from 'lucide-react';

// Interview status configurations
const INTERVIEW_STATUS = {
    scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700', icon: Play },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
    rescheduled: { label: 'Rescheduled', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

const INTERVIEW_TYPES = [
    { value: 'phone', label: 'Phone Interview', icon: Phone },
    { value: 'video', label: 'Video Interview', icon: Video },
    { value: 'in-person', label: 'In-Person Interview', icon: MapPin },
    { value: 'panel', label: 'Panel Interview', icon: Users },
    { value: 'technical', label: 'Technical Round', icon: CheckCircle },
    { value: 'hr', label: 'HR Round', icon: User },
];

const INTERVIEW_ROUNDS = [
    { value: '1', label: 'Round 1 - Initial Screening' },
    { value: '2', label: 'Round 2 - Technical/Subject' },
    { value: '3', label: 'Round 3 - Management' },
    { value: '4', label: 'Round 4 - HR Final' },
    { value: '5', label: 'Round 5 - Principal/Director' },
];

const initialFormData = {
    application_id: '',
    interview_type: 'in-person',
    round_number: '1',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    location: '',
    meeting_link: '',
    interviewer_ids: [],
    notes: '',
};

const InterviewScheduler = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    // State
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [applications, setApplications] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [editingInterview, setEditingInterview] = useState(null);
    const [viewingInterview, setViewingInterview] = useState(null);
    const [feedbackInterview, setFeedbackInterview] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [feedback, setFeedback] = useState({ rating: '', recommendation: '', comments: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('upcoming');

    // Fetch interviews
    const fetchInterviews = useCallback(async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('interview_schedules')
                .select(`
                    *,
                    job_applications(id, candidate_name, email, phone, application_number, job_postings(title))
                `)
                .eq('branch_id', selectedBranch.id)
                .order('scheduled_date', { ascending: true })
                .order('start_time', { ascending: true });
            
            if (error) throw error;
            setInterviews(data || []);
        } catch (error) {
            console.error('Error fetching interviews:', error);
            toast({ variant: 'destructive', title: 'Error loading interviews' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, toast]);

    const fetchApplications = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('job_applications')
                .select('id, candidate_name, application_number, job_postings(title)')
                .eq('branch_id', selectedBranch.id)
                .in('status', ['shortlisted', 'interview'])
                .order('candidate_name');
            setApplications(data || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    }, [selectedBranch?.id]);

    const fetchEmployees = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('employees')
                .select('id, first_name, last_name, designations(name)')
                .eq('branch_id', selectedBranch.id)
                .eq('status', 'active')
                .order('first_name');
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        fetchInterviews();
        fetchApplications();
        fetchEmployees();
    }, [fetchInterviews, fetchApplications, fetchEmployees]);

    // Stats calculation
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const total = interviews.length;
        const todayCount = interviews.filter(i => i.scheduled_date === today).length;
        const scheduled = interviews.filter(i => i.status === 'scheduled' || i.status === 'confirmed').length;
        const completed = interviews.filter(i => i.status === 'completed').length;
        return { total, todayCount, scheduled, completed };
    }, [interviews]);

    // Filtered interviews
    const filteredInterviews = useMemo(() => {
        let result = interviews;
        const today = new Date().toISOString().split('T')[0];
        
        // Tab filter
        if (activeTab === 'upcoming') {
            result = result.filter(i => i.scheduled_date >= today && !['completed', 'cancelled', 'no_show'].includes(i.status));
        } else if (activeTab === 'today') {
            result = result.filter(i => i.scheduled_date === today);
        } else if (activeTab === 'completed') {
            result = result.filter(i => i.status === 'completed');
        }
        
        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(i => 
                i.job_applications?.candidate_name?.toLowerCase().includes(term) ||
                i.job_applications?.job_postings?.title?.toLowerCase().includes(term)
            );
        }
        
        return result;
    }, [interviews, activeTab, searchTerm]);

    // Handlers
    const resetForm = () => {
        setFormData(initialFormData);
        setEditingInterview(null);
    };

    const handleOpenDialog = (interview = null) => {
        if (interview) {
            setEditingInterview(interview);
            setFormData({
                application_id: interview.application_id || '',
                interview_type: interview.interview_type || 'in-person',
                round_number: interview.round_number?.toString() || '1',
                scheduled_date: interview.scheduled_date || '',
                start_time: interview.start_time || '',
                end_time: interview.end_time || '',
                location: interview.location || '',
                meeting_link: interview.meeting_link || '',
                interviewer_ids: interview.interviewer_ids || [],
                notes: interview.notes || '',
            });
        } else {
            resetForm();
        }
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.application_id || !formData.scheduled_date || !formData.start_time) {
            toast({ variant: 'destructive', title: 'Application, date, and start time are required' });
            return;
        }
        
        setSaving(true);
        try {
            const payload = {
                ...formData,
                round_number: parseInt(formData.round_number),
                branch_id: selectedBranch.id,
                organization_id: organizationId,
            };
            
            let error;
            if (editingInterview) {
                ({ error } = await supabase.from('interview_schedules').update(payload).eq('id', editingInterview.id));
            } else {
                payload.status = 'scheduled';
                ({ error } = await supabase.from('interview_schedules').insert(payload));
                
                // Update application status to interview
                if (!error) {
                    await supabase.from('job_applications').update({ status: 'interview' }).eq('id', formData.application_id);
                }
            }
            
            if (error) throw error;
            
            toast({ title: editingInterview ? 'Interview updated' : 'Interview scheduled successfully' });
            setShowDialog(false);
            resetForm();
            fetchInterviews();
        } catch (error) {
            console.error('Error saving interview:', error);
            toast({ variant: 'destructive', title: 'Error saving interview' });
        } finally {
            setSaving(false);
        }
    };

    const handleStatusUpdate = async (interview, newStatus) => {
        try {
            const { error } = await supabase.from('interview_schedules').update({ status: newStatus }).eq('id', interview.id);
            if (error) throw error;
            toast({ title: `Interview marked as ${INTERVIEW_STATUS[newStatus]?.label}` });
            fetchInterviews();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating status' });
        }
    };

    const handleSubmitFeedback = async () => {
        if (!feedbackInterview) return;
        try {
            const { error } = await supabase.from('interview_schedules').update({
                status: 'completed',
                feedback_rating: parseInt(feedback.rating),
                feedback_recommendation: feedback.recommendation,
                feedback_comments: feedback.comments,
            }).eq('id', feedbackInterview.id);
            
            if (error) throw error;
            toast({ title: 'Feedback submitted successfully' });
            setShowFeedbackDialog(false);
            setFeedbackInterview(null);
            setFeedback({ rating: '', recommendation: '', comments: '' });
            fetchInterviews();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error submitting feedback' });
        }
    };

    const handleDelete = async (interview) => {
        if (!confirm('Are you sure you want to delete this interview?')) return;
        try {
            const { error } = await supabase.from('interview_schedules').delete().eq('id', interview.id);
            if (error) throw error;
            toast({ title: 'Interview deleted' });
            fetchInterviews();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting interview' });
        }
    };

    const StatusBadge = ({ status }) => {
        const config = INTERVIEW_STATUS[status] || INTERVIEW_STATUS.scheduled;
        return (
            <Badge className={`${config.color} font-medium`}>
                {config.label}
            </Badge>
        );
    };

    const InterviewTypeIcon = ({ type }) => {
        const typeConfig = INTERVIEW_TYPES.find(t => t.value === type);
        const IconComponent = typeConfig?.icon || Calendar;
        return <IconComponent className="h-4 w-4" />;
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-primary" />
                            Interview Scheduler
                        </h1>
                        <p className="text-muted-foreground">Schedule and track candidate interviews</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Interview
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total Interviews</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">{stats.todayCount}</p>
                                <p className="text-xs text-muted-foreground">Today</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                                <p className="text-xs text-muted-foreground">Scheduled</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                <p className="text-xs text-muted-foreground">Completed</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            <TabsTrigger value="today">Today</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                            <TabsTrigger value="all">All</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search candidates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                </div>

                {/* Interviews Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[220px]">Candidate</TableHead>
                                    <TableHead>Job Position</TableHead>
                                    <TableHead>Interview Type</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Round</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">
                                            <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredInterviews.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            No interviews found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredInterviews.map((interview) => (
                                        <TableRow key={interview.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {interview.job_applications?.candidate_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{interview.job_applications?.candidate_name || 'N/A'}</p>
                                                        <p className="text-xs text-muted-foreground">{interview.job_applications?.application_number}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{interview.job_applications?.job_postings?.title || 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <InterviewTypeIcon type={interview.interview_type} />
                                                    <span className="text-sm">{INTERVIEW_TYPES.find(t => t.value === interview.interview_type)?.label || interview.interview_type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{formatDate(interview.scheduled_date)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {interview.start_time?.slice(0, 5)} - {interview.end_time?.slice(0, 5)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">Round {interview.round_number}</Badge>
                                            </TableCell>
                                            <TableCell><StatusBadge status={interview.status} /></TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => { setViewingInterview(interview); setShowViewDialog(true); }}>
                                                            <Eye className="h-4 w-4 mr-2" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(interview)}>
                                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {interview.status === 'scheduled' && (
                                                            <DropdownMenuItem onClick={() => handleStatusUpdate(interview, 'confirmed')}>
                                                                <CheckCircle className="h-4 w-4 mr-2" /> Mark Confirmed
                                                            </DropdownMenuItem>
                                                        )}
                                                        {(interview.status === 'scheduled' || interview.status === 'confirmed') && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => { setFeedbackInterview(interview); setShowFeedbackDialog(true); }}>
                                                                    <CheckCircle className="h-4 w-4 mr-2" /> Complete & Add Feedback
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleStatusUpdate(interview, 'no_show')}>
                                                                    <XCircle className="h-4 w-4 mr-2" /> Mark No Show
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleStatusUpdate(interview, 'cancelled')}>
                                                                    <XCircle className="h-4 w-4 mr-2" /> Cancel Interview
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleDelete(interview)} className="text-red-600">
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Schedule Interview Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingInterview ? 'Edit Interview' : 'Schedule New Interview'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Candidate <span className="text-red-500">*</span></Label>
                            <Select value={formData.application_id} onValueChange={(v) => setFormData({...formData, application_id: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select candidate" />
                                </SelectTrigger>
                                <SelectContent>
                                    {applications.map(a => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.candidate_name} - {a.job_postings?.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Interview Type</Label>
                                <Select value={formData.interview_type} onValueChange={(v) => setFormData({...formData, interview_type: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INTERVIEW_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Round</Label>
                                <Select value={formData.round_number} onValueChange={(v) => setFormData({...formData, round_number: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INTERVIEW_ROUNDS.map(r => (
                                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Date <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={formData.scheduled_date}
                                    onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Start Time <span className="text-red-500">*</span></Label>
                                <Input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    placeholder="e.g., Conference Room A"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Meeting Link (for video)</Label>
                                <Input
                                    value={formData.meeting_link}
                                    onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
                                    placeholder="https://meet.google.com/..."
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                placeholder="Interview instructions, topics to cover..."
                                rows={3}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingInterview ? 'Update' : 'Schedule Interview'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Interview Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Interview Details</DialogTitle>
                    </DialogHeader>
                    
                    {viewingInterview && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {viewingInterview.job_applications?.candidate_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{viewingInterview.job_applications?.candidate_name}</p>
                                    <p className="text-sm text-muted-foreground">{viewingInterview.job_applications?.job_postings?.title}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDate(viewingInterview.scheduled_date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{viewingInterview.start_time?.slice(0, 5)} - {viewingInterview.end_time?.slice(0, 5)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <InterviewTypeIcon type={viewingInterview.interview_type} />
                                    <span>{INTERVIEW_TYPES.find(t => t.value === viewingInterview.interview_type)?.label}</span>
                                </div>
                                <div>
                                    <Badge variant="outline">Round {viewingInterview.round_number}</Badge>
                                </div>
                            </div>
                            
                            {viewingInterview.location && (
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{viewingInterview.location}</span>
                                </div>
                            )}
                            
                            {viewingInterview.meeting_link && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Video className="h-4 w-4 text-muted-foreground" />
                                    <a href={viewingInterview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        Join Meeting
                                    </a>
                                </div>
                            )}
                            
                            <StatusBadge status={viewingInterview.status} />
                            
                            {viewingInterview.feedback_comments && (
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="font-medium text-sm mb-1">Feedback</p>
                                    <p className="text-sm text-muted-foreground">{viewingInterview.feedback_comments}</p>
                                    {viewingInterview.feedback_recommendation && (
                                        <Badge className="mt-2">{viewingInterview.feedback_recommendation}</Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Feedback Dialog */}
            <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Interview Feedback</DialogTitle>
                        <DialogDescription>
                            Provide feedback for {feedbackInterview?.job_applications?.candidate_name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Rating (1-10)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={feedback.rating}
                                onChange={(e) => setFeedback({...feedback, rating: e.target.value})}
                                placeholder="1-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Recommendation</Label>
                            <Select value={feedback.recommendation} onValueChange={(v) => setFeedback({...feedback, recommendation: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select recommendation" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="strongly_recommend">Strongly Recommend</SelectItem>
                                    <SelectItem value="recommend">Recommend</SelectItem>
                                    <SelectItem value="maybe">Maybe</SelectItem>
                                    <SelectItem value="not_recommend">Do Not Recommend</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Comments</Label>
                            <Textarea
                                value={feedback.comments}
                                onChange={(e) => setFeedback({...feedback, comments: e.target.value})}
                                placeholder="Detailed feedback about the candidate..."
                                rows={4}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmitFeedback}>Submit Feedback</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default InterviewScheduler;
