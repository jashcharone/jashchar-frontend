import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Loader2, Plus, Edit, Trash2, Eye, MoreHorizontal, Users, UserPlus,
    Calendar, Mail, Phone, FileText, Star, StarHalf, Download, ExternalLink,
    CheckCircle, XCircle, Clock, UserCheck, Send, MessageSquare, Search,
    Briefcase, GraduationCap, DollarSign, Building, Filter, ArrowRight
} from 'lucide-react';

// Application status configurations
const APPLICATION_STATUS = {
    applied: { label: 'Applied', color: 'bg-blue-100 text-blue-700', icon: FileText },
    screening: { label: 'Screening', color: 'bg-cyan-100 text-cyan-700', icon: Eye },
    shortlisted: { label: 'Shortlisted', color: 'bg-yellow-100 text-yellow-700', icon: Star },
    interview: { label: 'Interview', color: 'bg-purple-100 text-purple-700', icon: Calendar },
    selected: { label: 'Selected', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    offer: { label: 'Offer Sent', color: 'bg-emerald-100 text-emerald-700', icon: Send },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
    withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700', icon: Clock },
};

const SOURCES = [
    { value: 'website', label: 'Career Website' },
    { value: 'referral', label: 'Employee Referral' },
    { value: 'job-portal', label: 'Job Portal' },
    { value: 'walk-in', label: 'Walk-in' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'newspaper', label: 'Newspaper' },
    { value: 'other', label: 'Other' },
];

const initialFormData = {
    job_posting_id: '',
    candidate_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    highest_qualification: '',
    experience_years: '',
    current_employer: '',
    current_designation: '',
    current_salary: '',
    expected_salary: '',
    notice_period: '',
    available_from: '',
    source: 'website',
    notes: '',
};

const Applications = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    // State
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [jobPostings, setJobPostings] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [editingApp, setEditingApp] = useState(null);
    const [viewingApp, setViewingApp] = useState(null);
    const [statusApp, setStatusApp] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [statusNotes, setStatusNotes] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [jobFilter, setJobFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('all');

    // Fetch data
    const fetchApplications = useCallback(async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('job_applications')
                .select(`
                    *,
                    job_postings(id, title, departments(name))
                `)
                .eq('branch_id', selectedBranch.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setApplications(data || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast({ variant: 'destructive', title: 'Error loading applications' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, toast]);

    const fetchJobPostings = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('job_postings')
                .select('id, title')
                .eq('branch_id', selectedBranch.id)
                .in('status', ['open', 'on-hold'])
                .order('title');
            setJobPostings(data || []);
        } catch (error) {
            console.error('Error fetching job postings:', error);
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        fetchApplications();
        fetchJobPostings();
    }, [fetchApplications, fetchJobPostings]);

    // Stats calculation
    const stats = useMemo(() => {
        const total = applications.length;
        const applied = applications.filter(a => a.status === 'applied').length;
        const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
        const interview = applications.filter(a => a.status === 'interview').length;
        const selected = applications.filter(a => a.status === 'selected' || a.status === 'offer').length;
        const rejected = applications.filter(a => a.status === 'rejected').length;
        return { total, applied, shortlisted, interview, selected, rejected };
    }, [applications]);

    // Filtered applications
    const filteredApplications = useMemo(() => {
        let result = applications;
        
        // Tab filter
        if (activeTab !== 'all') {
            result = result.filter(a => a.status === activeTab);
        }
        
        // Job filter
        if (jobFilter !== 'all') {
            result = result.filter(a => a.job_posting_id === jobFilter);
        }
        
        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(a => 
                a.candidate_name?.toLowerCase().includes(term) ||
                a.email?.toLowerCase().includes(term) ||
                a.phone?.includes(term) ||
                a.job_postings?.title?.toLowerCase().includes(term)
            );
        }
        
        return result;
    }, [applications, activeTab, jobFilter, searchTerm]);

    // Handlers
    const resetForm = () => {
        setFormData(initialFormData);
        setEditingApp(null);
    };

    const handleOpenDialog = (app = null) => {
        if (app) {
            setEditingApp(app);
            setFormData({
                job_posting_id: app.job_posting_id || '',
                candidate_name: app.candidate_name || '',
                email: app.email || '',
                phone: app.phone || '',
                date_of_birth: app.date_of_birth || '',
                gender: app.gender || '',
                address: app.address || '',
                city: app.city || '',
                state: app.state || '',
                highest_qualification: app.highest_qualification || '',
                experience_years: app.experience_years || '',
                current_employer: app.current_employer || '',
                current_designation: app.current_designation || '',
                current_salary: app.current_salary || '',
                expected_salary: app.expected_salary || '',
                notice_period: app.notice_period || '',
                available_from: app.available_from || '',
                source: app.source || 'website',
                notes: app.notes || '',
            });
        } else {
            resetForm();
        }
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.candidate_name.trim() || !formData.job_posting_id) {
            toast({ variant: 'destructive', title: 'Candidate name and job are required' });
            return;
        }
        
        setSaving(true);
        try {
            const payload = {
                ...formData,
                experience_years: formData.experience_years ? parseFloat(formData.experience_years) : null,
                current_salary: formData.current_salary ? parseFloat(formData.current_salary) : null,
                expected_salary: formData.expected_salary ? parseFloat(formData.expected_salary) : null,
                notice_period: formData.notice_period ? parseInt(formData.notice_period) : null,
                date_of_birth: formData.date_of_birth || null,
                available_from: formData.available_from || null,
                branch_id: selectedBranch.id,
                organization_id: organizationId,
            };
            
            let error;
            if (editingApp) {
                ({ error } = await supabase.from('job_applications').update(payload).eq('id', editingApp.id));
            } else {
                payload.status = 'applied';
                payload.applied_date = new Date().toISOString().split('T')[0];
                // Generate application number
                const count = await supabase.from('job_applications').select('id', { count: 'exact' }).eq('branch_id', selectedBranch.id);
                payload.application_number = `APP${String((count.count || 0) + 1).padStart(5, '0')}`;
                ({ error } = await supabase.from('job_applications').insert(payload));
                
                // Update applications count on job posting
                if (!error) {
                    await supabase.rpc('increment_job_applications', { job_id: formData.job_posting_id });
                }
            }
            
            if (error) throw error;
            
            toast({ title: editingApp ? 'Application updated' : 'Application added successfully' });
            setShowDialog(false);
            resetForm();
            fetchApplications();
        } catch (error) {
            console.error('Error saving application:', error);
            toast({ variant: 'destructive', title: 'Error saving application' });
        } finally {
            setSaving(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusApp || !newStatus) return;
        
        try {
            const update = { 
                status: newStatus,
                notes: statusNotes ? `${statusApp.notes || ''}\n[${formatDate(new Date())}] Status: ${newStatus} - ${statusNotes}` : statusApp.notes
            };
            
            const { error } = await supabase.from('job_applications').update(update).eq('id', statusApp.id);
            if (error) throw error;
            
            toast({ title: `Status updated to ${APPLICATION_STATUS[newStatus]?.label}` });
            setShowStatusDialog(false);
            setStatusApp(null);
            setNewStatus('');
            setStatusNotes('');
            fetchApplications();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating status' });
        }
    };

    const handleRatingUpdate = async (app, rating) => {
        try {
            const { error } = await supabase.from('job_applications').update({ rating }).eq('id', app.id);
            if (error) throw error;
            toast({ title: 'Rating updated' });
            fetchApplications();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating rating' });
        }
    };

    const StatusBadge = ({ status }) => {
        const config = APPLICATION_STATUS[status] || APPLICATION_STATUS.applied;
        return (
            <Badge className={`${config.color} font-medium`}>
                {config.label}
            </Badge>
        );
    };

    const RatingStars = ({ rating, onRate, readonly = false }) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        disabled={readonly}
                        onClick={() => !readonly && onRate && onRate(star)}
                        className={`${readonly ? '' : 'hover:scale-110 cursor-pointer'} transition-transform`}
                    >
                        <Star 
                            className={`h-4 w-4 ${star <= (rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6 text-primary" />
                            Job Applications
                        </h1>
                        <p className="text-muted-foreground">Track and manage candidate applications</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Application
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{stats.applied}</p>
                                <p className="text-xs text-muted-foreground">New</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">{stats.shortlisted}</p>
                                <p className="text-xs text-muted-foreground">Shortlisted</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">{stats.interview}</p>
                                <p className="text-xs text-muted-foreground">Interview</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.selected}</p>
                                <p className="text-xs text-muted-foreground">Selected</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                                <p className="text-xs text-muted-foreground">Rejected</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="applied">New</TabsTrigger>
                            <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
                            <TabsTrigger value="interview">Interview</TabsTrigger>
                            <TabsTrigger value="selected">Selected</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <div className="flex gap-2">
                        <Select value={jobFilter} onValueChange={setJobFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by Job" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Jobs</SelectItem>
                                {jobPostings.map(j => (
                                    <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                </div>

                {/* Applications Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[250px]">Candidate</TableHead>
                                    <TableHead>Job Applied</TableHead>
                                    <TableHead>Experience</TableHead>
                                    <TableHead>Expected Salary</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Applied On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24">
                                            <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredApplications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                            No applications found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredApplications.map((app) => (
                                        <TableRow key={app.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={app.photo_url} />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {app.candidate_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{app.candidate_name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3" />
                                                            {app.email || 'No email'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{app.job_postings?.title || 'N/A'}</p>
                                                    <p className="text-xs text-muted-foreground">{app.application_number}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{app.experience_years ? `${app.experience_years} yrs` : '-'}</TableCell>
                                            <TableCell>
                                                {app.expected_salary ? `₹${Number(app.expected_salary).toLocaleString()}` : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <RatingStars 
                                                    rating={app.rating} 
                                                    onRate={(r) => handleRatingUpdate(app, r)}
                                                />
                                            </TableCell>
                                            <TableCell><StatusBadge status={app.status} /></TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {app.applied_date ? formatDate(app.applied_date) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => { setViewingApp(app); setShowViewDialog(true); }}>
                                                            <Eye className="h-4 w-4 mr-2" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(app)}>
                                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => { setStatusApp(app); setNewStatus(''); setShowStatusDialog(true); }}>
                                                            <ArrowRight className="h-4 w-4 mr-2" /> Update Status
                                                        </DropdownMenuItem>
                                                        {app.status === 'applied' && (
                                                            <DropdownMenuItem onClick={() => { setStatusApp(app); setNewStatus('shortlisted'); setShowStatusDialog(true); }}>
                                                                <Star className="h-4 w-4 mr-2" /> Shortlist
                                                            </DropdownMenuItem>
                                                        )}
                                                        {app.status === 'shortlisted' && (
                                                            <DropdownMenuItem onClick={() => { setStatusApp(app); setNewStatus('interview'); setShowStatusDialog(true); }}>
                                                                <Calendar className="h-4 w-4 mr-2" /> Schedule Interview
                                                            </DropdownMenuItem>
                                                        )}
                                                        {app.resume_url && (
                                                            <DropdownMenuItem asChild>
                                                                <a href={app.resume_url} target="_blank" rel="noopener noreferrer">
                                                                    <Download className="h-4 w-4 mr-2" /> Download Resume
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}
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

            {/* Add/Edit Application Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingApp ? 'Edit Application' : 'Add New Application'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Job Position <span className="text-red-500">*</span></Label>
                            <Select value={formData.job_posting_id} onValueChange={(v) => setFormData({...formData, job_posting_id: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select job position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobPostings.map(j => (
                                        <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Candidate Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.candidate_name}
                                    onChange={(e) => setFormData({...formData, candidate_name: e.target.value})}
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="Phone number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Highest Qualification</Label>
                                <Input
                                    value={formData.highest_qualification}
                                    onChange={(e) => setFormData({...formData, highest_qualification: e.target.value})}
                                    placeholder="e.g., M.Ed, B.Ed"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Experience (Years)</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={formData.experience_years}
                                    onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                                    placeholder="e.g., 3.5"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Current Employer</Label>
                                <Input
                                    value={formData.current_employer}
                                    onChange={(e) => setFormData({...formData, current_employer: e.target.value})}
                                    placeholder="Company name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Current Designation</Label>
                                <Input
                                    value={formData.current_designation}
                                    onChange={(e) => setFormData({...formData, current_designation: e.target.value})}
                                    placeholder="e.g., Senior Teacher"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Current Salary (₹)</Label>
                                <Input
                                    type="number"
                                    value={formData.current_salary}
                                    onChange={(e) => setFormData({...formData, current_salary: e.target.value})}
                                    placeholder="25000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Expected Salary (₹)</Label>
                                <Input
                                    type="number"
                                    value={formData.expected_salary}
                                    onChange={(e) => setFormData({...formData, expected_salary: e.target.value})}
                                    placeholder="35000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Notice Period (Days)</Label>
                                <Input
                                    type="number"
                                    value={formData.notice_period}
                                    onChange={(e) => setFormData({...formData, notice_period: e.target.value})}
                                    placeholder="30"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Available From</Label>
                                <Input
                                    type="date"
                                    value={formData.available_from}
                                    onChange={(e) => setFormData({...formData, available_from: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input
                                    value={formData.city}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    placeholder="City"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>State</Label>
                                <Input
                                    value={formData.state}
                                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                                    placeholder="State"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Source</Label>
                                <Select value={formData.source} onValueChange={(v) => setFormData({...formData, source: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SOURCES.map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                placeholder="Additional notes about the candidate..."
                                rows={3}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingApp ? 'Update' : 'Add Application'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Application Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {viewingApp?.candidate_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p>{viewingApp?.candidate_name}</p>
                                <p className="text-sm font-normal text-muted-foreground">{viewingApp?.application_number}</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    
                    {viewingApp && (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-6 pr-4">
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={viewingApp.status} />
                                    <RatingStars rating={viewingApp.rating} readonly />
                                </div>
                                
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" /> Applied For
                                    </h4>
                                    <p className="text-sm">{viewingApp.job_postings?.title || 'N/A'}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{viewingApp.email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{viewingApp.phone || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                        <span>{viewingApp.highest_qualification || 'Not specified'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{viewingApp.experience_years || 0} years experience</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-1">Current Employment</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {viewingApp.current_designation || 'N/A'} at {viewingApp.current_employer || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Salary Expectation</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Current: ₹{Number(viewingApp.current_salary || 0).toLocaleString()} → 
                                            Expected: ₹{Number(viewingApp.expected_salary || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                
                                {viewingApp.notes && (
                                    <div>
                                        <h4 className="font-medium mb-2">Notes</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingApp.notes}</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
                        <Button onClick={() => { setShowViewDialog(false); handleOpenDialog(viewingApp); }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Application Status</DialogTitle>
                        <DialogDescription>
                            Change status for {statusApp?.candidate_name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>New Status</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(APPLICATION_STATUS).map(([key, val]) => (
                                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                                placeholder="Add any notes about this status change..."
                                rows={3}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
                        <Button onClick={handleStatusUpdate} disabled={!newStatus}>
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default Applications;
