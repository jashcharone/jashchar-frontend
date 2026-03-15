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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from '@/utils/dateUtils';
import { 
    Loader2, Plus, Edit, Trash2, MoreHorizontal, DollarSign, Search,
    IndianRupee, Users, Calculator, Settings, Copy, Eye, FileText
} from 'lucide-react';

// Component types
const COMPONENT_TYPES = [
    { value: 'earning', label: 'Earning', color: 'bg-green-100 text-green-700' },
    { value: 'deduction', label: 'Deduction', color: 'bg-red-100 text-red-700' },
    { value: 'reimbursement', label: 'Reimbursement', color: 'bg-blue-100 text-blue-700' },
];

const CALCULATION_TYPES = [
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'percentage', label: 'Percentage of Basic' },
    { value: 'formula', label: 'Custom Formula' },
];

const initialComponentFormData = {
    name: '',
    code: '',
    component_type: 'earning',
    calculation_type: 'fixed',
    percentage_of_basic: '',
    is_taxable: true,
    is_active: true,
    description: '',
};

const initialStructureFormData = {
    employee_id: '',
    effective_from: '',
    components: [],
};

const SalaryStructure = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    // State
    const [components, setComponents] = useState([]);
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [showComponentDialog, setShowComponentDialog] = useState(false);
    const [showStructureDialog, setShowStructureDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null);
    const [editingStructure, setEditingStructure] = useState(null);
    const [viewingStructure, setViewingStructure] = useState(null);
    const [componentFormData, setComponentFormData] = useState(initialComponentFormData);
    const [structureFormData, setStructureFormData] = useState(initialStructureFormData);
    const [structureComponents, setStructureComponents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('components');

    // Fetch data
    const fetchComponents = useCallback(async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('salary_components')
                .select('*')
                .eq('branch_id', selectedBranch.id)
                .order('component_type')
                .order('name');
            
            if (error) throw error;
            setComponents(data || []);
        } catch (error) {
            console.error('Error fetching components:', error);
            toast({ variant: 'destructive', title: 'Error loading salary components' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, toast]);

    const fetchStructures = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data, error } = await supabase
                .from('employee_salary_structures')
                .select(`
                    *,
                    employees(id, first_name, last_name, employee_code, designations(name), departments(name))
                `)
                .eq('branch_id', selectedBranch.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setStructures(data || []);
        } catch (error) {
            console.error('Error fetching structures:', error);
        }
    }, [selectedBranch?.id]);

    const fetchEmployees = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('employees')
                .select('id, first_name, last_name, employee_code')
                .eq('branch_id', selectedBranch.id)
                .eq('status', 'active')
                .order('first_name');
            setEmployees(data || []);
        } catch (error) {
            console.error('Error:', error);
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        fetchComponents();
        fetchStructures();
        fetchEmployees();
    }, [fetchComponents, fetchStructures, fetchEmployees]);

    // Stats
    const stats = useMemo(() => {
        const totalComponents = components.length;
        const earnings = components.filter(c => c.component_type === 'earning').length;
        const deductions = components.filter(c => c.component_type === 'deduction').length;
        const employeesWithStructure = structures.length;
        return { totalComponents, earnings, deductions, employeesWithStructure };
    }, [components, structures]);

    // Filtered items
    const filteredComponents = useMemo(() => {
        if (!searchTerm) return components;
        const term = searchTerm.toLowerCase();
        return components.filter(c => 
            c.name?.toLowerCase().includes(term) ||
            c.code?.toLowerCase().includes(term)
        );
    }, [components, searchTerm]);

    const filteredStructures = useMemo(() => {
        if (!searchTerm) return structures;
        const term = searchTerm.toLowerCase();
        return structures.filter(s => 
            s.employees?.first_name?.toLowerCase().includes(term) ||
            s.employees?.last_name?.toLowerCase().includes(term) ||
            s.employees?.employee_code?.toLowerCase().includes(term)
        );
    }, [structures, searchTerm]);

    // Component handlers
    const resetComponentForm = () => {
        setComponentFormData(initialComponentFormData);
        setEditingComponent(null);
    };

    const handleOpenComponentDialog = (component = null) => {
        if (component) {
            setEditingComponent(component);
            setComponentFormData({
                name: component.name || '',
                code: component.code || '',
                component_type: component.component_type || 'earning',
                calculation_type: component.calculation_type || 'fixed',
                percentage_of_basic: component.percentage_of_basic?.toString() || '',
                is_taxable: component.is_taxable ?? true,
                is_active: component.is_active ?? true,
                description: component.description || '',
            });
        } else {
            resetComponentForm();
        }
        setShowComponentDialog(true);
    };

    const handleSubmitComponent = async () => {
        if (!componentFormData.name.trim() || !componentFormData.code.trim()) {
            toast({ variant: 'destructive', title: 'Name and code are required' });
            return;
        }
        
        setSaving(true);
        try {
            const payload = {
                ...componentFormData,
                percentage_of_basic: componentFormData.percentage_of_basic ? parseFloat(componentFormData.percentage_of_basic) : null,
                branch_id: selectedBranch.id,
                organization_id: organizationId,
            };
            
            let error;
            if (editingComponent) {
                ({ error } = await supabase.from('salary_components').update(payload).eq('id', editingComponent.id));
            } else {
                ({ error } = await supabase.from('salary_components').insert(payload));
            }
            
            if (error) throw error;
            
            toast({ title: editingComponent ? 'Component updated' : 'Component created' });
            setShowComponentDialog(false);
            resetComponentForm();
            fetchComponents();
        } catch (error) {
            console.error('Error:', error);
            toast({ variant: 'destructive', title: 'Error saving component' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteComponent = async (component) => {
        if (!confirm(`Delete component "${component.name}"?`)) return;
        try {
            const { error } = await supabase.from('salary_components').delete().eq('id', component.id);
            if (error) throw error;
            toast({ title: 'Component deleted' });
            fetchComponents();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting component' });
        }
    };

    // Structure handlers
    const handleOpenStructureDialog = (structure = null) => {
        if (structure) {
            setEditingStructure(structure);
            setStructureFormData({
                employee_id: structure.employee_id || '',
                effective_from: structure.effective_from || '',
            });
            setStructureComponents(structure.components || []);
        } else {
            setEditingStructure(null);
            setStructureFormData({
                employee_id: '',
                effective_from: new Date().toISOString().split('T')[0],
            });
            // Initialize with all active components
            setStructureComponents(
                components
                    .filter(c => c.is_active)
                    .map(c => ({
                        component_id: c.id,
                        component_name: c.name,
                        component_type: c.component_type,
                        amount: 0,
                        calculation_type: c.calculation_type,
                        percentage: c.percentage_of_basic,
                    }))
            );
        }
        setShowStructureDialog(true);
    };

    const handleComponentAmountChange = (componentId, amount) => {
        setStructureComponents(prev => 
            prev.map(c => c.component_id === componentId ? { ...c, amount: parseFloat(amount) || 0 } : c)
        );
    };

    const handleSubmitStructure = async () => {
        if (!structureFormData.employee_id || !structureFormData.effective_from) {
            toast({ variant: 'destructive', title: 'Employee and effective date are required' });
            return;
        }
        
        setSaving(true);
        try {
            // Calculate totals
            const earnings = structureComponents
                .filter(c => c.component_type === 'earning')
                .reduce((sum, c) => sum + (c.amount || 0), 0);
            const deductions = structureComponents
                .filter(c => c.component_type === 'deduction')
                .reduce((sum, c) => sum + (c.amount || 0), 0);
            const grossSalary = earnings;
            const netSalary = grossSalary - deductions;
            
            const payload = {
                employee_id: structureFormData.employee_id,
                effective_from: structureFormData.effective_from,
                components: structureComponents,
                gross_salary: grossSalary,
                total_deductions: deductions,
                net_salary: netSalary,
                is_active: true,
                branch_id: selectedBranch.id,
                organization_id: organizationId,
            };
            
            // Deactivate old structure for this employee
            await supabase
                .from('employee_salary_structures')
                .update({ is_active: false })
                .eq('employee_id', structureFormData.employee_id)
                .eq('branch_id', selectedBranch.id);
            
            const { error } = await supabase.from('employee_salary_structures').insert(payload);
            if (error) throw error;
            
            toast({ title: 'Salary structure saved' });
            setShowStructureDialog(false);
            fetchStructures();
        } catch (error) {
            console.error('Error:', error);
            toast({ variant: 'destructive', title: 'Error saving structure' });
        } finally {
            setSaving(false);
        }
    };

    const handleViewStructure = (structure) => {
        setViewingStructure(structure);
        setShowViewDialog(true);
    };

    const getEmployeeName = (emp) => {
        if (!emp) return 'Unknown';
        return `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    };

    const calculateTotals = () => {
        const earnings = structureComponents
            .filter(c => c.component_type === 'earning')
            .reduce((sum, c) => sum + (c.amount || 0), 0);
        const deductions = structureComponents
            .filter(c => c.component_type === 'deduction')
            .reduce((sum, c) => sum + (c.amount || 0), 0);
        return { earnings, deductions, net: earnings - deductions };
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <IndianRupee className="h-6 w-6 text-primary" />
                            Salary Structure
                        </h1>
                        <p className="text-muted-foreground">Manage salary components and employee structures</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleOpenComponentDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Component
                        </Button>
                        <Button onClick={() => handleOpenStructureDialog()}>
                            <Users className="h-4 w-4 mr-2" />
                            Assign Structure
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{stats.totalComponents}</p>
                                <p className="text-xs text-muted-foreground">Total Components</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.earnings}</p>
                                <p className="text-xs text-muted-foreground">Earnings</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{stats.deductions}</p>
                                <p className="text-xs text-muted-foreground">Deductions</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{stats.employeesWithStructure}</p>
                                <p className="text-xs text-muted-foreground">Employee Structures</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex justify-between items-center">
                        <TabsList>
                            <TabsTrigger value="components">Salary Components</TabsTrigger>
                            <TabsTrigger value="structures">Employee Structures</TabsTrigger>
                        </TabsList>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-64"
                            />
                        </div>
                    </div>

                    {/* Components Tab */}
                    <TabsContent value="components" className="mt-4">
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Component Name</TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Calculation</TableHead>
                                            <TableHead>Taxable</TableHead>
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
                                        ) : filteredComponents.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                                    No components found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredComponents.map((component) => (
                                                <TableRow key={component.id}>
                                                    <TableCell className="font-medium">{component.name}</TableCell>
                                                    <TableCell><code className="text-sm bg-muted px-1 rounded">{component.code}</code></TableCell>
                                                    <TableCell>
                                                        <Badge className={COMPONENT_TYPES.find(t => t.value === component.component_type)?.color}>
                                                            {COMPONENT_TYPES.find(t => t.value === component.component_type)?.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {component.calculation_type === 'percentage' 
                                                            ? `${component.percentage_of_basic}% of Basic`
                                                            : CALCULATION_TYPES.find(t => t.value === component.calculation_type)?.label
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={component.is_taxable ? 'default' : 'secondary'}>
                                                            {component.is_taxable ? 'Yes' : 'No'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={component.is_active ? 'default' : 'secondary'}>
                                                            {component.is_active ? 'Active' : 'Inactive'}
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
                                                                <DropdownMenuItem onClick={() => handleOpenComponentDialog(component)}>
                                                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleDeleteComponent(component)} className="text-red-600">
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
                    </TabsContent>

                    {/* Structures Tab */}
                    <TabsContent value="structures" className="mt-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredStructures.map((structure) => (
                                <Card key={structure.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {structure.employees?.first_name?.[0]}{structure.employees?.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{getEmployeeName(structure.employees)}</CardTitle>
                                                <CardDescription className="text-xs">
                                                    {structure.employees?.employee_code} • {structure.employees?.designations?.name}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Gross Salary:</span>
                                                <span className="font-medium">₹{Number(structure.gross_salary || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Deductions:</span>
                                                <span className="font-medium text-red-600">₹{Number(structure.total_deductions || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm border-t pt-2">
                                                <span className="text-muted-foreground">Net Salary:</span>
                                                <span className="font-bold text-green-600">₹{Number(structure.net_salary || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Effective: {formatDate(structure.effective_from)}
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                className="w-full mt-2"
                                                onClick={() => handleViewStructure(structure)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Component Dialog */}
            <Dialog open={showComponentDialog} onOpenChange={setShowComponentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingComponent ? 'Edit Component' : 'Add Salary Component'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Component Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={componentFormData.name}
                                    onChange={(e) => setComponentFormData({...componentFormData, name: e.target.value})}
                                    placeholder="e.g., Basic Salary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Code <span className="text-red-500">*</span></Label>
                                <Input
                                    value={componentFormData.code}
                                    onChange={(e) => setComponentFormData({...componentFormData, code: e.target.value.toUpperCase()})}
                                    placeholder="e.g., BASIC"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={componentFormData.component_type} onValueChange={(v) => setComponentFormData({...componentFormData, component_type: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMPONENT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Calculation Type</Label>
                                <Select value={componentFormData.calculation_type} onValueChange={(v) => setComponentFormData({...componentFormData, calculation_type: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CALCULATION_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {componentFormData.calculation_type === 'percentage' && (
                            <div className="space-y-2">
                                <Label>Percentage of Basic</Label>
                                <Input
                                    type="number"
                                    value={componentFormData.percentage_of_basic}
                                    onChange={(e) => setComponentFormData({...componentFormData, percentage_of_basic: e.target.value})}
                                    placeholder="e.g., 40"
                                />
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label>Taxable Component</Label>
                            <Switch
                                checked={componentFormData.is_taxable}
                                onCheckedChange={(c) => setComponentFormData({...componentFormData, is_taxable: c})}
                            />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label>Active</Label>
                            <Switch
                                checked={componentFormData.is_active}
                                onCheckedChange={(c) => setComponentFormData({...componentFormData, is_active: c})}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowComponentDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmitComponent} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingComponent ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Structure Dialog */}
            <Dialog open={showStructureDialog} onOpenChange={setShowStructureDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Assign Salary Structure</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Employee <span className="text-red-500">*</span></Label>
                                <Select value={structureFormData.employee_id} onValueChange={(v) => setStructureFormData({...structureFormData, employee_id: v})}>
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
                                <Label>Effective From <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={structureFormData.effective_from}
                                    onChange={(e) => setStructureFormData({...structureFormData, effective_from: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Salary Components</h4>
                            <div className="space-y-3">
                                {/* Earnings */}
                                <div>
                                    <p className="text-sm font-medium text-green-700 mb-2">Earnings</p>
                                    {structureComponents.filter(c => c.component_type === 'earning').map((comp) => (
                                        <div key={comp.component_id} className="flex items-center gap-4 mb-2">
                                            <span className="text-sm w-40">{comp.component_name}</span>
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                                <Input
                                                    type="number"
                                                    className="pl-8"
                                                    value={comp.amount || ''}
                                                    onChange={(e) => handleComponentAmountChange(comp.component_id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Deductions */}
                                <div>
                                    <p className="text-sm font-medium text-red-700 mb-2">Deductions</p>
                                    {structureComponents.filter(c => c.component_type === 'deduction').map((comp) => (
                                        <div key={comp.component_id} className="flex items-center gap-4 mb-2">
                                            <span className="text-sm w-40">{comp.component_name}</span>
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                                <Input
                                                    type="number"
                                                    className="pl-8"
                                                    value={comp.amount || ''}
                                                    onChange={(e) => handleComponentAmountChange(comp.component_id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Totals */}
                        <div className="bg-muted p-4 rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-muted-foreground">Gross Salary</p>
                                    <p className="text-lg font-bold">₹{calculateTotals().earnings.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Deductions</p>
                                    <p className="text-lg font-bold text-red-600">₹{calculateTotals().deductions.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Net Salary</p>
                                    <p className="text-lg font-bold text-green-600">₹{calculateTotals().net.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStructureDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmitStructure} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save Structure
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Structure Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Salary Structure Details</DialogTitle>
                    </DialogHeader>
                    
                    {viewingStructure && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {viewingStructure.employees?.first_name?.[0]}{viewingStructure.employees?.last_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{getEmployeeName(viewingStructure.employees)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {viewingStructure.employees?.employee_code} • {viewingStructure.employees?.designations?.name}
                                    </p>
                                </div>
                            </div>
                            
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-green-700 mb-2">Earnings</p>
                                        {viewingStructure.components?.filter(c => c.component_type === 'earning').map((comp, idx) => (
                                            <div key={idx} className="flex justify-between text-sm py-1">
                                                <span>{comp.component_name}</span>
                                                <span className="font-medium">₹{Number(comp.amount || 0).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-red-700 mb-2">Deductions</p>
                                        {viewingStructure.components?.filter(c => c.component_type === 'deduction').map((comp, idx) => (
                                            <div key={idx} className="flex justify-between text-sm py-1">
                                                <span>{comp.component_name}</span>
                                                <span className="font-medium text-red-600">₹{Number(comp.amount || 0).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                            
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Gross</p>
                                        <p className="font-bold">₹{Number(viewingStructure.gross_salary || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Deductions</p>
                                        <p className="font-bold text-red-600">₹{Number(viewingStructure.total_deductions || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Net</p>
                                        <p className="font-bold text-green-600">₹{Number(viewingStructure.net_salary || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default SalaryStructure;
