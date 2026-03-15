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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from '@/utils/dateUtils';
import { 
    Loader2, Plus, Edit, Trash2, Eye, UserPlus, Users, CheckCircle, 
    Circle, Clock, Calendar, FileText, AlertCircle, Search, Play
} from 'lucide-react';

// Onboarding status configurations
const ONBOARDING_STATUS = {
    not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-700', icon: Circle },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const NewEmployeeOnboarding = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    // State
    const [onboardings, setOnboardings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [checklists, setChecklists] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [showProgressDialog, setShowProgressDialog] = useState(false);
    const [selectedOnboarding, setSelectedOnboarding] = useState(null);
    const [onboardingItems, setOnboardingItems] = useState([]);
    const [formData, setFormData] = useState({ employee_id: '', checklist_id: '', start_date: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('in_progress');

    // Fetch onboardings
    const fetchOnboardings = useCallback(async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('employee_onboarding')
                .select(`
                    *,
                    employees(id, first_name, last_name, employee_code, designations(name), departments(name)),
                    onboarding_checklists(id, name, items_count)
                `)
                .eq('branch_id', selectedBranch.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setOnboardings(data || []);
        } catch (error) {
            console.error('Error fetching onboardings:', error);
            toast({ variant: 'destructive', title: 'Error loading onboardings' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, toast]);

    const fetchEmployees = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            // Get employees who don't have ongoing onboarding
            const { data } = await supabase
                .from('employees')
                .select('id, first_name, last_name, employee_code, joining_date')
                .eq('branch_id', selectedBranch.id)
                .eq('status', 'active')
                .order('first_name');
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [selectedBranch?.id]);

    const fetchChecklists = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('onboarding_checklists')
                .select('id, name, items_count')
                .eq('branch_id', selectedBranch.id)
                .eq('is_active', true)
                .order('name');
            setChecklists(data || []);
        } catch (error) {
            console.error('Error fetching checklists:', error);
        }
    }, [selectedBranch?.id]);

    const fetchOnboardingItems = useCallback(async (onboardingId) => {
        try {
            const { data, error } = await supabase
                .from('employee_onboarding_items')
                .select('*')
                .eq('onboarding_id', onboardingId)
                .order('order_index');
            
            if (error) throw error;
            setOnboardingItems(data || []);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    }, []);

    useEffect(() => {
        fetchOnboardings();
        fetchEmployees();
        fetchChecklists();
    }, [fetchOnboardings, fetchEmployees, fetchChecklists]);

    // Stats calculation
    const stats = useMemo(() => {
        const total = onboardings.length;
        const inProgress = onboardings.filter(o => o.status === 'in_progress').length;
        const completed = onboardings.filter(o => o.status === 'completed').length;
        const overdue = onboardings.filter(o => o.status === 'overdue').length;
        return { total, inProgress, completed, overdue };
    }, [onboardings]);

    // Filtered onboardings
    const filteredOnboardings = useMemo(() => {
        let result = onboardings;
        
        if (activeTab !== 'all') {
            result = result.filter(o => o.status === activeTab);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(o => 
                o.employees?.first_name?.toLowerCase().includes(term) ||
                o.employees?.last_name?.toLowerCase().includes(term) ||
                o.employees?.employee_code?.toLowerCase().includes(term)
            );
        }
        
        return result;
    }, [onboardings, activeTab, searchTerm]);

    // Handlers
    const handleOpenDialog = () => {
        setFormData({ employee_id: '', checklist_id: '', start_date: new Date().toISOString().split('T')[0] });
        setShowDialog(true);
    };

    const handleOpenProgressDialog = async (onboarding) => {
        setSelectedOnboarding(onboarding);
        await fetchOnboardingItems(onboarding.id);
        setShowProgressDialog(true);
    };

    const handleStartOnboarding = async () => {
        if (!formData.employee_id || !formData.checklist_id) {
            toast({ variant: 'destructive', title: 'Employee and checklist are required' });
            return;
        }
        
        setSaving(true);
        try {
            // Check if employee already has ongoing onboarding
            const { data: existing } = await supabase
                .from('employee_onboarding')
                .select('id')
                .eq('employee_id', formData.employee_id)
                .in('status', ['not_started', 'in_progress'])
                .single();
            
            if (existing) {
                toast({ variant: 'destructive', title: 'Employee already has an active onboarding' });
                return;
            }
            
            // Create onboarding record
            const { data: onboarding, error: createError } = await supabase
                .from('employee_onboarding')
                .insert({
                    employee_id: formData.employee_id,
                    checklist_id: formData.checklist_id,
                    start_date: formData.start_date,
                    status: 'in_progress',
                    progress_percentage: 0,
                    branch_id: selectedBranch.id,
                    organization_id: organizationId,
                })
                .select()
                .single();
            
            if (createError) throw createError;
            
            // Get checklist items and create onboarding items
            const { data: checklistItems } = await supabase
                .from('onboarding_checklist_items')
                .select('*')
                .eq('checklist_id', formData.checklist_id)
                .order('order_index');
            
            if (checklistItems && checklistItems.length > 0) {
                const onboardingItems = checklistItems.map(item => ({
                    onboarding_id: onboarding.id,
                    checklist_item_id: item.id,
                    title: item.title,
                    description: item.description,
                    category: item.category,
                    is_mandatory: item.is_mandatory,
                    due_date: item.due_days 
                        ? new Date(new Date(formData.start_date).getTime() + item.due_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        : null,
                    order_index: item.order_index,
                    status: 'pending',
                }));
                
                await supabase.from('employee_onboarding_items').insert(onboardingItems);
            }
            
            toast({ title: 'Onboarding started successfully' });
            setShowDialog(false);
            fetchOnboardings();
        } catch (error) {
            console.error('Error starting onboarding:', error);
            toast({ variant: 'destructive', title: 'Error starting onboarding' });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleItem = async (item) => {
        const newStatus = item.status === 'completed' ? 'pending' : 'completed';
        try {
            const { error } = await supabase
                .from('employee_onboarding_items')
                .update({ 
                    status: newStatus,
                    completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null,
                })
                .eq('id', item.id);
            
            if (error) throw error;
            
            // Refresh items and update progress
            await fetchOnboardingItems(selectedOnboarding.id);
            await updateProgress(selectedOnboarding.id);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating item' });
        }
    };

    const updateProgress = async (onboardingId) => {
        const { data: items } = await supabase
            .from('employee_onboarding_items')
            .select('status, is_mandatory')
            .eq('onboarding_id', onboardingId);
        
        if (!items || items.length === 0) return;
        
        const completed = items.filter(i => i.status === 'completed').length;
        const percentage = Math.round((completed / items.length) * 100);
        
        const allMandatoryComplete = items
            .filter(i => i.is_mandatory)
            .every(i => i.status === 'completed');
        
        const status = percentage === 100 ? 'completed' : 'in_progress';
        
        await supabase.from('employee_onboarding').update({
            progress_percentage: percentage,
            status,
            completed_date: status === 'completed' ? new Date().toISOString().split('T')[0] : null,
        }).eq('id', onboardingId);
        
        fetchOnboardings();
    };

    const StatusBadge = ({ status }) => {
        const config = ONBOARDING_STATUS[status] || ONBOARDING_STATUS.not_started;
        return (
            <Badge className={`${config.color} font-medium`}>
                {config.label}
            </Badge>
        );
    };

    const getEmployeeName = (emp) => {
        if (!emp) return 'Unknown';
        return `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <UserPlus className="h-6 w-6 text-primary" />
                            Employee Onboarding
                        </h1>
                        <p className="text-muted-foreground">Track and manage new employee onboarding progress</p>
                    </div>
                    <Button onClick={handleOpenDialog}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Onboarding
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                                <p className="text-xs text-muted-foreground">In Progress</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                <p className="text-xs text-muted-foreground">Completed</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                                <p className="text-xs text-muted-foreground">Overdue</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                            <TabsTrigger value="overdue">Overdue</TabsTrigger>
                            <TabsTrigger value="all">All</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                </div>

                {/* Onboarding Cards */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : filteredOnboardings.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No onboarding records found. Start onboarding for new employees.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredOnboardings.map((onboarding) => (
                            <Card key={onboarding.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {onboarding.employees?.first_name?.[0]}{onboarding.employees?.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{getEmployeeName(onboarding.employees)}</CardTitle>
                                                <CardDescription className="text-xs">
                                                    {onboarding.employees?.employee_code} • {onboarding.employees?.designations?.name}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <StatusBadge status={onboarding.status} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Checklist:</span>
                                            <span className="font-medium">{onboarding.onboarding_checklists?.name}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Started:</span>
                                            <span>{formatDate(onboarding.start_date)}</span>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Progress</span>
                                                <span className="font-medium">{onboarding.progress_percentage || 0}%</span>
                                            </div>
                                            <Progress value={onboarding.progress_percentage || 0} className="h-2" />
                                        </div>
                                        
                                        <Button 
                                            className="w-full" 
                                            onClick={() => handleOpenProgressDialog(onboarding)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Progress
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Start Onboarding Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start New Employee Onboarding</DialogTitle>
                        <DialogDescription>
                            Select an employee and a checklist to begin their onboarding process.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Employee <span className="text-red-500">*</span></Label>
                            <Select value={formData.employee_id} onValueChange={(v) => setFormData({...formData, employee_id: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name} ({emp.employee_code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Onboarding Checklist <span className="text-red-500">*</span></Label>
                            <Select value={formData.checklist_id} onValueChange={(v) => setFormData({...formData, checklist_id: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select checklist" />
                                </SelectTrigger>
                                <SelectContent>
                                    {checklists.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} ({c.items_count || 0} items)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleStartOnboarding} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Start Onboarding
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Progress Dialog */}
            <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {selectedOnboarding?.employees?.first_name?.[0]}{selectedOnboarding?.employees?.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p>{getEmployeeName(selectedOnboarding?.employees)}</p>
                                <p className="text-sm font-normal text-muted-foreground">
                                    {selectedOnboarding?.onboarding_checklists?.name}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Overall Progress</span>
                            <span className="font-medium">{selectedOnboarding?.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={selectedOnboarding?.progress_percentage || 0} className="h-3" />
                    </div>
                    
                    <ScrollArea className="max-h-[50vh]">
                        <div className="space-y-2 pr-4">
                            {onboardingItems.map((item) => (
                                <div 
                                    key={item.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                        item.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <Checkbox
                                        checked={item.status === 'completed'}
                                        onCheckedChange={() => handleToggleItem(item)}
                                        className="mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-medium text-sm ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                {item.title}
                                            </p>
                                            {item.is_mandatory && (
                                                <Badge variant="destructive" className="text-xs">Required</Badge>
                                            )}
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <Badge variant="outline">{item.category}</Badge>
                                            {item.due_date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Due: {formatDate(item.due_date)}
                                                </span>
                                            )}
                                            {item.completed_date && (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Completed: {formatDate(item.completed_date)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowProgressDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default NewEmployeeOnboarding;
