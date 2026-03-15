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
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Loader2, Plus, Edit, Trash2, MoreHorizontal, FileText, Search,
    Calendar, Settings, CheckSquare, AlertCircle, Copy
} from 'lucide-react';

// Policy types
const POLICY_TYPES = [
    { value: 'general', label: 'General Policy' },
    { value: 'department', label: 'Department Specific' },
    { value: 'designation', label: 'Designation Specific' },
    { value: 'employment_type', label: 'Employment Type' },
];

const CARRY_FORWARD_OPTIONS = [
    { value: 'none', label: 'No Carry Forward' },
    { value: 'full', label: 'Full Carry Forward' },
    { value: 'limited', label: 'Limited Days' },
    { value: 'percentage', label: 'Percentage' },
];

const initialFormData = {
    name: '',
    description: '',
    policy_type: 'general',
    department_id: '',
    designation_id: '',
    employment_type: '',
    leave_type_id: '',
    annual_allocation: '',
    max_consecutive_days: '',
    min_days_notice: '',
    allow_half_day: true,
    allow_carry_forward: false,
    carry_forward_type: 'none',
    carry_forward_limit: '',
    encashment_allowed: false,
    encashment_max_days: '',
    probation_applicable: false,
    applicable_after_days: '',
    is_active: true,
};

const LeavePolicy = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    // State
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Fetch policies
    const fetchPolicies = useCallback(async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leave_policies')
                .select(`
                    *,
                    leave_types(id, name, color),
                    departments(id, name),
                    designations(id, name)
                `)
                .eq('branch_id', selectedBranch.id)
                .order('name');
            
            if (error) throw error;
            setPolicies(data || []);
        } catch (error) {
            console.error('Error fetching policies:', error);
            toast({ variant: 'destructive', title: 'Error loading policies' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, toast]);

    const fetchLeaveTypes = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('leave_types')
                .select('id, name, color')
                .eq('branch_id', selectedBranch.id)
                .eq('is_active', true)
                .order('name');
            setLeaveTypes(data || []);
        } catch (error) {
            console.error('Error fetching leave types:', error);
        }
    }, [selectedBranch?.id]);

    const fetchDepartments = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('departments')
                .select('id, name')
                .eq('branch_id', selectedBranch.id)
                .order('name');
            setDepartments(data || []);
        } catch (error) {
            console.error('Error:', error);
        }
    }, [selectedBranch?.id]);

    const fetchDesignations = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('designations')
                .select('id, name')
                .eq('branch_id', selectedBranch.id)
                .order('name');
            setDesignations(data || []);
        } catch (error) {
            console.error('Error:', error);
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        fetchPolicies();
        fetchLeaveTypes();
        fetchDepartments();
        fetchDesignations();
    }, [fetchPolicies, fetchLeaveTypes, fetchDepartments, fetchDesignations]);

    // Stats
    const stats = useMemo(() => {
        const total = policies.length;
        const active = policies.filter(p => p.is_active).length;
        const general = policies.filter(p => p.policy_type === 'general').length;
        const withCarryForward = policies.filter(p => p.allow_carry_forward).length;
        return { total, active, general, withCarryForward };
    }, [policies]);

    // Filtered policies
    const filteredPolicies = useMemo(() => {
        let result = policies;
        
        if (activeTab !== 'all') {
            result = result.filter(p => p.policy_type === activeTab);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p => 
                p.name?.toLowerCase().includes(term) ||
                p.leave_types?.name?.toLowerCase().includes(term)
            );
        }
        
        return result;
    }, [policies, activeTab, searchTerm]);

    // Handlers
    const resetForm = () => {
        setFormData(initialFormData);
        setEditingPolicy(null);
    };

    const handleOpenDialog = (policy = null) => {
        if (policy) {
            setEditingPolicy(policy);
            setFormData({
                name: policy.name || '',
                description: policy.description || '',
                policy_type: policy.policy_type || 'general',
                department_id: policy.department_id || '',
                designation_id: policy.designation_id || '',
                employment_type: policy.employment_type || '',
                leave_type_id: policy.leave_type_id || '',
                annual_allocation: policy.annual_allocation?.toString() || '',
                max_consecutive_days: policy.max_consecutive_days?.toString() || '',
                min_days_notice: policy.min_days_notice?.toString() || '',
                allow_half_day: policy.allow_half_day ?? true,
                allow_carry_forward: policy.allow_carry_forward || false,
                carry_forward_type: policy.carry_forward_type || 'none',
                carry_forward_limit: policy.carry_forward_limit?.toString() || '',
                encashment_allowed: policy.encashment_allowed || false,
                encashment_max_days: policy.encashment_max_days?.toString() || '',
                probation_applicable: policy.probation_applicable || false,
                applicable_after_days: policy.applicable_after_days?.toString() || '',
                is_active: policy.is_active ?? true,
            });
        } else {
            resetForm();
        }
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.leave_type_id) {
            toast({ variant: 'destructive', title: 'Name and leave type are required' });
            return;
        }
        
        setSaving(true);
        try {
            const payload = {
                ...formData,
                annual_allocation: formData.annual_allocation ? parseFloat(formData.annual_allocation) : null,
                max_consecutive_days: formData.max_consecutive_days ? parseInt(formData.max_consecutive_days) : null,
                min_days_notice: formData.min_days_notice ? parseInt(formData.min_days_notice) : null,
                carry_forward_limit: formData.carry_forward_limit ? parseFloat(formData.carry_forward_limit) : null,
                encashment_max_days: formData.encashment_max_days ? parseFloat(formData.encashment_max_days) : null,
                applicable_after_days: formData.applicable_after_days ? parseInt(formData.applicable_after_days) : null,
                department_id: formData.department_id || null,
                designation_id: formData.designation_id || null,
                branch_id: selectedBranch.id,
                organization_id: organizationId,
            };
            
            let error;
            if (editingPolicy) {
                ({ error } = await supabase.from('leave_policies').update(payload).eq('id', editingPolicy.id));
            } else {
                ({ error } = await supabase.from('leave_policies').insert(payload));
            }
            
            if (error) throw error;
            
            toast({ title: editingPolicy ? 'Policy updated' : 'Policy created successfully' });
            setShowDialog(false);
            resetForm();
            fetchPolicies();
        } catch (error) {
            console.error('Error saving policy:', error);
            toast({ variant: 'destructive', title: 'Error saving policy' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (policy) => {
        if (!confirm(`Delete policy "${policy.name}"?`)) return;
        try {
            const { error } = await supabase.from('leave_policies').delete().eq('id', policy.id);
            if (error) throw error;
            toast({ title: 'Policy deleted' });
            fetchPolicies();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting policy' });
        }
    };

    const handleDuplicate = async (policy) => {
        try {
            const newPolicy = {
                ...policy,
                id: undefined,
                name: `${policy.name} (Copy)`,
                created_at: undefined,
                updated_at: undefined,
            };
            delete newPolicy.leave_types;
            delete newPolicy.departments;
            delete newPolicy.designations;
            
            const { error } = await supabase.from('leave_policies').insert(newPolicy);
            if (error) throw error;
            toast({ title: 'Policy duplicated' });
            fetchPolicies();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error duplicating policy' });
        }
    };

    const handleToggleActive = async (policy) => {
        try {
            const { error } = await supabase
                .from('leave_policies')
                .update({ is_active: !policy.is_active })
                .eq('id', policy.id);
            if (error) throw error;
            fetchPolicies();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating status' });
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            Leave Policies
                        </h1>
                        <p className="text-muted-foreground">Configure leave allocation and rules</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Policy
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total Policies</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                                <p className="text-xs text-muted-foreground">Active</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{stats.general}</p>
                                <p className="text-xs text-muted-foreground">General Policies</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">{stats.withCarryForward}</p>
                                <p className="text-xs text-muted-foreground">With Carry Forward</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="department">Department</TabsTrigger>
                            <TabsTrigger value="designation">Designation</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search policies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                </div>

                {/* Policies Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Policy Name</TableHead>
                                    <TableHead>Leave Type</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Annual Days</TableHead>
                                    <TableHead>Carry Forward</TableHead>
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
                                ) : filteredPolicies.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            No policies found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPolicies.map((policy) => (
                                        <TableRow key={policy.id} className={!policy.is_active ? 'opacity-50' : ''}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{policy.name}</p>
                                                    {policy.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{policy.description}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    style={{ backgroundColor: policy.leave_types?.color || '#6366f1' }}
                                                    className="text-white"
                                                >
                                                    {policy.leave_types?.name || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {POLICY_TYPES.find(t => t.value === policy.policy_type)?.label || policy.policy_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{policy.annual_allocation || '-'}</TableCell>
                                            <TableCell>
                                                {policy.allow_carry_forward ? (
                                                    <Badge className="bg-green-100 text-green-700">Yes</Badge>
                                                ) : (
                                                    <Badge variant="secondary">No</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                                                    {policy.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(policy)}>
                                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDuplicate(policy)}>
                                                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleActive(policy)}>
                                                            <Settings className="h-4 w-4 mr-2" /> 
                                                            {policy.is_active ? 'Deactivate' : 'Activate'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleDelete(policy)} className="text-red-600">
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

            {/* Create/Edit Policy Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPolicy ? 'Edit Policy' : 'Create New Policy'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Policy Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g., Teaching Staff CL Policy"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Leave Type <span className="text-red-500">*</span></Label>
                                <Select value={formData.leave_type_id} onValueChange={(v) => setFormData({...formData, leave_type_id: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select leave type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map(lt => (
                                            <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Policy description..."
                                rows={2}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Policy Type</Label>
                                <Select value={formData.policy_type} onValueChange={(v) => setFormData({...formData, policy_type: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {POLICY_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {formData.policy_type === 'department' && (
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
                            )}
                            
                            {formData.policy_type === 'designation' && (
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
                            )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Annual Allocation (Days)</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={formData.annual_allocation}
                                    onChange={(e) => setFormData({...formData, annual_allocation: e.target.value})}
                                    placeholder="e.g., 12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Consecutive Days</Label>
                                <Input
                                    type="number"
                                    value={formData.max_consecutive_days}
                                    onChange={(e) => setFormData({...formData, max_consecutive_days: e.target.value})}
                                    placeholder="e.g., 5"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Notice Days</Label>
                                <Input
                                    type="number"
                                    value={formData.min_days_notice}
                                    onChange={(e) => setFormData({...formData, min_days_notice: e.target.value})}
                                    placeholder="e.g., 2"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label>Allow Half Day</Label>
                                    <p className="text-xs text-muted-foreground">Can apply for half-day leave</p>
                                </div>
                                <Switch
                                    checked={formData.allow_half_day}
                                    onCheckedChange={(c) => setFormData({...formData, allow_half_day: c})}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label>Allow Carry Forward</Label>
                                    <p className="text-xs text-muted-foreground">Unused leaves to next year</p>
                                </div>
                                <Switch
                                    checked={formData.allow_carry_forward}
                                    onCheckedChange={(c) => setFormData({...formData, allow_carry_forward: c})}
                                />
                            </div>
                        </div>
                        
                        {formData.allow_carry_forward && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Carry Forward Type</Label>
                                    <Select value={formData.carry_forward_type} onValueChange={(v) => setFormData({...formData, carry_forward_type: v})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CARRY_FORWARD_OPTIONS.map(o => (
                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {(formData.carry_forward_type === 'limited' || formData.carry_forward_type === 'percentage') && (
                                    <div className="space-y-2">
                                        <Label>Limit ({formData.carry_forward_type === 'percentage' ? '%' : 'Days'})</Label>
                                        <Input
                                            type="number"
                                            value={formData.carry_forward_limit}
                                            onChange={(e) => setFormData({...formData, carry_forward_limit: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <Label>Active Policy</Label>
                                <p className="text-xs text-muted-foreground">Policy is available for use</p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(c) => setFormData({...formData, is_active: c})}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingPolicy ? 'Update' : 'Create Policy'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default LeavePolicy;
