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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { formatDate } from '@/utils/dateUtils';
import { 
    Loader2, Plus, Edit, Trash2, Eye, MoreHorizontal, Briefcase, Users, 
    Calendar, MapPin, DollarSign, Clock, CheckCircle, XCircle, PauseCircle,
    FileText, Send, Copy, Search, Filter, Building, GraduationCap,
    TrendingUp, AlertCircle
} from 'lucide-react';

// Status configurations
const JOB_STATUS = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
    open: { label: 'Open', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    'on-hold': { label: 'On Hold', color: 'bg-yellow-100 text-yellow-700', icon: PauseCircle },
    closed: { label: 'Closed', color: 'bg-red-100 text-red-700', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const JOB_TYPES = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' },
];

const initialFormData = {
    title: '',
    department_id: '',
    designation_id: '',
    description: '',
    requirements: '',
    qualifications: '',
    experience_required: '',
    salary_range_min: '',
    salary_range_max: '',
    job_type: 'full-time',
    job_location: '',
    openings: 1,
    closing_date: '',
    benefits: '',
    is_remote: false,
    status: 'draft',
};

const JobPostings = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    // State
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [viewingJob, setViewingJob] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('all');

    // Fetch data
    const fetchJobs = useCallback(async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('job_postings')
                .select(`
                    *,
                    departments(id, name),
                    designations(id, name)
                `)
                .eq('branch_id', selectedBranch.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setJobs(data || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast({ variant: 'destructive', title: 'Error loading job postings' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, toast]);

    const fetchDepartmentsAndDesignations = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const [deptRes, desigRes] = await Promise.all([
                supabase.from('departments').select('id, name').eq('branch_id', selectedBranch.id).order('name'),
                supabase.from('designations').select('id, name').eq('branch_id', selectedBranch.id).order('name')
            ]);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
        } catch (error) {
            console.error('Error fetching departments/designations:', error);
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        fetchJobs();
        fetchDepartmentsAndDesignations();
    }, [fetchJobs, fetchDepartmentsAndDesignations]);

    // Stats calculation
    const stats = useMemo(() => {
        const total = jobs.length;
        const open = jobs.filter(j => j.status === 'open').length;
        const draft = jobs.filter(j => j.status === 'draft').length;
        const closed = jobs.filter(j => j.status === 'closed').length;
        const totalOpenings = jobs.filter(j => j.status === 'open').reduce((sum, j) => sum + (j.openings || 0), 0);
        const totalApplications = jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0);
        return { total, open, draft, closed, totalOpenings, totalApplications };
    }, [jobs]);

    // Filtered jobs
    const filteredJobs = useMemo(() => {
        let result = jobs;
        
        // Tab filter
        if (activeTab !== 'all') {
            result = result.filter(j => j.status === activeTab);
        }
        
        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(j => j.status === statusFilter);
        }
        
        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(j => 
                j.title?.toLowerCase().includes(term) ||
                j.departments?.name?.toLowerCase().includes(term) ||
                j.designations?.name?.toLowerCase().includes(term) ||
                j.job_location?.toLowerCase().includes(term)
            );
        }
        
        return result;
    }, [jobs, activeTab, statusFilter, searchTerm]);

    // Handlers
    const resetForm = () => {
        setFormData(initialFormData);
        setEditingJob(null);
    };

    const handleOpenDialog = (job = null) => {
        if (job) {
            setEditingJob(job);
            setFormData({
                title: job.title || '',
                department_id: job.department_id || '',
                designation_id: job.designation_id || '',
                description: job.description || '',
                requirements: job.requirements || '',
                qualifications: job.qualifications || '',
                experience_required: job.experience_required || '',
                salary_range_min: job.salary_range_min || '',
                salary_range_max: job.salary_range_max || '',
                job_type: job.job_type || 'full-time',
                job_location: job.job_location || '',
                openings: job.openings || 1,
                closing_date: job.closing_date || '',
                benefits: job.benefits || '',
                is_remote: job.is_remote || false,
                status: job.status || 'draft',
            });
        } else {
            resetForm();
        }
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            toast({ variant: 'destructive', title: 'Job title is required' });
            return;
        }
        
        setSaving(true);
        try {
            const payload = {
                ...formData,
                department_id: formData.department_id || null,
                designation_id: formData.designation_id || null,
                salary_range_min: formData.salary_range_min ? parseFloat(formData.salary_range_min) : null,
                salary_range_max: formData.salary_range_max ? parseFloat(formData.salary_range_max) : null,
                openings: parseInt(formData.openings) || 1,
                closing_date: formData.closing_date || null,
                posted_date: formData.status === 'open' && !editingJob?.posted_date ? new Date().toISOString().split('T')[0] : editingJob?.posted_date,
                branch_id: selectedBranch.id,
                organization_id: organizationId,
            };
            
            let error;
            if (editingJob) {
                ({ error } = await supabase
                    .from('job_postings')
                    .update(payload)
                    .eq('id', editingJob.id));
            } else {
                payload.created_by = user?.id;
                ({ error } = await supabase.from('job_postings').insert(payload));
            }
            
            if (error) throw error;
            
            toast({ title: editingJob ? 'Job updated successfully' : 'Job created successfully' });
            setShowDialog(false);
            resetForm();
            fetchJobs();
        } catch (error) {
            console.error('Error saving job:', error);
            toast({ variant: 'destructive', title: 'Error saving job posting' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!jobToDelete) return;
        try {
            const { error } = await supabase.from('job_postings').delete().eq('id', jobToDelete.id);
            if (error) throw error;
            toast({ title: 'Job posting deleted' });
            setShowDeleteDialog(false);
            setJobToDelete(null);
            fetchJobs();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting job posting' });
        }
    };

    const handleStatusChange = async (job, newStatus) => {
        try {
            const update = { status: newStatus };
            if (newStatus === 'open' && !job.posted_date) {
                update.posted_date = new Date().toISOString().split('T')[0];
            }
            const { error } = await supabase.from('job_postings').update(update).eq('id', job.id);
            if (error) throw error;
            toast({ title: `Job ${newStatus === 'open' ? 'published' : 'status updated'}` });
            fetchJobs();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating status' });
        }
    };

    const handleDuplicate = async (job) => {
        const newJob = {
            title: `${job.title} (Copy)`,
            department_id: job.department_id,
            designation_id: job.designation_id,
            description: job.description,
            requirements: job.requirements,
            qualifications: job.qualifications,
            experience_required: job.experience_required,
            salary_range_min: job.salary_range_min,
            salary_range_max: job.salary_range_max,
            job_type: job.job_type,
            job_location: job.job_location,
            openings: job.openings,
            benefits: job.benefits,
            is_remote: job.is_remote,
            status: 'draft',
            branch_id: selectedBranch.id,
            organization_id: organizationId,
            created_by: user?.id,
        };
        
        try {
            const { error } = await supabase.from('job_postings').insert(newJob);
            if (error) throw error;
            toast({ title: 'Job duplicated successfully' });
            fetchJobs();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error duplicating job' });
        }
    };

    const StatusBadge = ({ status }) => {
        const config = JOB_STATUS[status] || JOB_STATUS.draft;
        return (
            <Badge className={`${config.color} font-medium`}>
                {config.label}
            </Badge>
        );
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Briefcase className="h-6 w-6 text-primary" />
                            Job Postings
                        </h1>
                        <p className="text-muted-foreground">Manage job openings and recruitment</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Job Posting
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Briefcase className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-xs text-muted-foreground">Total Jobs</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.open}</p>
                                    <p className="text-xs text-muted-foreground">Active Jobs</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.draft}</p>
                                    <p className="text-xs text-muted-foreground">Drafts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Users className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalOpenings}</p>
                                    <p className="text-xs text-muted-foreground">Open Positions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalApplications}</p>
                                    <p className="text-xs text-muted-foreground">Applications</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs & Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                            <TabsTrigger value="open">Active ({stats.open})</TabsTrigger>
                            <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
                            <TabsTrigger value="closed">Closed ({stats.closed})</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search jobs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Jobs Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[300px]">Job Title</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-center">Openings</TableHead>
                                    <TableHead className="text-center">Applications</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Posted</TableHead>
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
                                ) : filteredJobs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                            No job postings found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredJobs.map((job) => (
                                        <TableRow key={job.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div>
                                                    <span className="font-medium">{job.title}</span>
                                                    {job.job_location && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {job.job_location}
                                                            {job.is_remote && <Badge variant="outline" className="ml-1 text-[10px]">Remote</Badge>}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{job.departments?.name || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {JOB_TYPES.find(t => t.value === job.job_type)?.label || job.job_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">{job.openings || 1}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">{job.applications_count || 0}</Badge>
                                            </TableCell>
                                            <TableCell><StatusBadge status={job.status} /></TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {job.posted_date ? formatDate(job.posted_date) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => { setViewingJob(job); setShowViewDialog(true); }}>
                                                            <Eye className="h-4 w-4 mr-2" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(job)}>
                                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDuplicate(job)}>
                                                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {job.status === 'draft' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(job, 'open')}>
                                                                <Send className="h-4 w-4 mr-2" /> Publish
                                                            </DropdownMenuItem>
                                                        )}
                                                        {job.status === 'open' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleStatusChange(job, 'on-hold')}>
                                                                    <PauseCircle className="h-4 w-4 mr-2" /> Put On Hold
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleStatusChange(job, 'closed')}>
                                                                    <XCircle className="h-4 w-4 mr-2" /> Close Job
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {job.status === 'on-hold' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(job, 'open')}>
                                                                <CheckCircle className="h-4 w-4 mr-2" /> Resume
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-destructive"
                                                            onClick={() => { setJobToDelete(job); setShowDeleteDialog(true); }}
                                                        >
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

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingJob ? 'Edit Job Posting' : 'Create Job Posting'}</DialogTitle>
                        <DialogDescription>Fill in the job details below</DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label>Job Title <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g., Senior Mathematics Teacher"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Designation</Label>
                                <Select value={formData.designation_id} onValueChange={(v) => setFormData({...formData, designation_id: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select designation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {designations.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Job Type</Label>
                                <Select value={formData.job_type} onValueChange={(v) => setFormData({...formData, job_type: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JOB_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input
                                    value={formData.job_location}
                                    onChange={(e) => setFormData({...formData, job_location: e.target.value})}
                                    placeholder="e.g., Bangalore, Karnataka"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>No. of Openings</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.openings}
                                    onChange={(e) => setFormData({...formData, openings: e.target.value})}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Experience Required</Label>
                                <Input
                                    value={formData.experience_required}
                                    onChange={(e) => setFormData({...formData, experience_required: e.target.value})}
                                    placeholder="e.g., 3-5 years"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Min Salary (₹)</Label>
                                <Input
                                    type="number"
                                    value={formData.salary_range_min}
                                    onChange={(e) => setFormData({...formData, salary_range_min: e.target.value})}
                                    placeholder="e.g., 25000"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Max Salary (₹)</Label>
                                <Input
                                    type="number"
                                    value={formData.salary_range_max}
                                    onChange={(e) => setFormData({...formData, salary_range_max: e.target.value})}
                                    placeholder="e.g., 50000"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Closing Date</Label>
                                <Input
                                    type="date"
                                    value={formData.closing_date}
                                    onChange={(e) => setFormData({...formData, closing_date: e.target.value})}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="open">Open (Publish)</SelectItem>
                                        <SelectItem value="on-hold">On Hold</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Switch
                                    checked={formData.is_remote}
                                    onCheckedChange={(c) => setFormData({...formData, is_remote: c})}
                                />
                                <Label>Remote Work Available</Label>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Job Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Describe the role and responsibilities..."
                                rows={4}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Requirements</Label>
                            <Textarea
                                value={formData.requirements}
                                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                                placeholder="List the key requirements..."
                                rows={3}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Qualifications</Label>
                            <Textarea
                                value={formData.qualifications}
                                onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                                placeholder="Educational qualifications required..."
                                rows={2}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Benefits</Label>
                            <Textarea
                                value={formData.benefits}
                                onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                                placeholder="List benefits like PF, Insurance, etc."
                                rows={2}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingJob ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            {viewingJob?.title}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {viewingJob && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <StatusBadge status={viewingJob.status} />
                                <Badge variant="outline">{JOB_TYPES.find(t => t.value === viewingJob.job_type)?.label}</Badge>
                                {viewingJob.is_remote && <Badge variant="outline">Remote</Badge>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span>{viewingJob.departments?.name || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{viewingJob.job_location || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{viewingJob.openings} opening(s)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{viewingJob.experience_required || 'Any experience'}</span>
                                </div>
                                {(viewingJob.salary_range_min || viewingJob.salary_range_max) && (
                                    <div className="flex items-center gap-2 col-span-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span>₹{viewingJob.salary_range_min?.toLocaleString() || 0} - ₹{viewingJob.salary_range_max?.toLocaleString() || 0}</span>
                                    </div>
                                )}
                            </div>
                            
                            {viewingJob.description && (
                                <div>
                                    <h4 className="font-medium mb-2">Description</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingJob.description}</p>
                                </div>
                            )}
                            
                            {viewingJob.requirements && (
                                <div>
                                    <h4 className="font-medium mb-2">Requirements</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingJob.requirements}</p>
                                </div>
                            )}
                            
                            {viewingJob.qualifications && (
                                <div>
                                    <h4 className="font-medium mb-2">Qualifications</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingJob.qualifications}</p>
                                </div>
                            )}
                            
                            {viewingJob.benefits && (
                                <div>
                                    <h4 className="font-medium mb-2">Benefits</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingJob.benefits}</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
                        <Button onClick={() => { setShowViewDialog(false); handleOpenDialog(viewingJob); }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Job Posting</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{jobToDelete?.title}</strong>? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default JobPostings;
