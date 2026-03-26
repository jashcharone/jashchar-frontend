import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Loader2, Trash2, Edit, Save, Users, Briefcase, IndianRupee,
    GraduationCap, Plus, TrendingUp
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Predefined salary grades
const SALARY_GRADES = [
    { value: 'L1', label: 'Level 1 (Entry)', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
    { value: 'L2', label: 'Level 2 (Junior)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'L3', label: 'Level 3 (Associate)', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'M1', label: 'Manager 1 (Team Lead)', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'M2', label: 'Manager 2 (Senior Manager)', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    { value: 'S1', label: 'Senior 1 (Director)', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    { value: 'S2', label: 'Senior 2 (VP)', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
    { value: 'E1', label: 'Executive (CXO)', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
];

const Designations = () => {
    const { toast } = useToast();
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const [designations, setDesignations] = useState([]);
    const [employeeCount, setEmployeeCount] = useState({});
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [designationToDelete, setDesignationToDelete] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        salary_grade: '',
        min_salary: '',
        max_salary: '',
        sort_order: 0
    });

    let branchId = user?.profile?.branch_id;
    if (!branchId) {
        branchId = sessionStorage.getItem('ma_target_branch_id');
    }

    const fetchDesignations = async () => {
        if (!branchId || !selectedBranch?.id) return;
        setIsFetching(true);
        const { data, error } = await supabase
            .from('designations')
            .select('*')
            .eq('branch_id', selectedBranch.id)
            .order('sort_order', { ascending: true })
            .order('name');
        
        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error fetching designations" });
        } else {
            setDesignations(data || []);
        }
        setIsFetching(false);
    };

    const fetchEmployeeCount = async () => {
        if (!selectedBranch?.id) return;
        
        const { data, error } = await supabase
            .from('employee_profiles')
            .select('designation_id')
            .eq('branch_id', selectedBranch.id)
            .neq('is_disabled', true);
        
        if (!error && data) {
            const counts = {};
            data.forEach(emp => {
                if (emp.designation_id) {
                    counts[emp.designation_id] = (counts[emp.designation_id] || 0) + 1;
                }
            });
            setEmployeeCount(counts);
        }
    };

    useEffect(() => {
        if (branchId && selectedBranch?.id) {
            fetchDesignations();
            fetchEmployeeCount();
        }
    }, [branchId, selectedBranch?.id]);

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }
        if (!selectedBranch?.id) {
            toast({ variant: "destructive", title: "Branch not selected" });
            return;
        }
        setLoading(true);
        
        const payload = {
            name: formData.name,
            description: formData.description || null,
            salary_grade: formData.salary_grade || null,
            min_salary: formData.min_salary ? parseFloat(formData.min_salary) : null,
            max_salary: formData.max_salary ? parseFloat(formData.max_salary) : null,
            sort_order: parseInt(formData.sort_order) || 0,
            branch_id: selectedBranch.id,
            organization_id: organizationId
        };

        let error;
        if (editingId) {
            const { error: updateError } = await supabase
                .from('designations')
                .update(payload)
                .eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('designations')
                .insert(payload);
            error = insertError;
        }

        setLoading(false);

        if (error) {
            toast({ variant: "destructive", title: "Error saving designation", description: error.message });
        } else {
            toast({ title: "Success", description: "Designation saved successfully" });
            resetForm();
            fetchDesignations();
        }
    };

    const handleDelete = async () => {
        if (!designationToDelete) return;
        
        // Check if designation has employees
        if (employeeCount[designationToDelete.id] > 0) {
            toast({ 
                variant: "destructive", 
                title: "Cannot delete", 
                description: `This designation has ${employeeCount[designationToDelete.id]} employee(s). Reassign them first.` 
            });
            setShowDeleteDialog(false);
            return;
        }
        
        const { error } = await supabase
            .from('designations')
            .delete()
            .eq('id', designationToDelete.id);

        if (error) {
            toast({ variant: "destructive", title: "Error deleting designation", description: error.message });
        } else {
            toast({ title: "Deleted successfully" });
            fetchDesignations();
        }
        setShowDeleteDialog(false);
        setDesignationToDelete(null);
    };
    
    const handleEdit = (desig) => {
        setFormData({
            name: desig.name,
            description: desig.description || '',
            salary_grade: desig.salary_grade || '',
            min_salary: desig.min_salary || '',
            max_salary: desig.max_salary || '',
            sort_order: desig.sort_order || 0
        });
        setEditingId(desig.id);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            salary_grade: '',
            min_salary: '',
            max_salary: '',
            sort_order: 0
        });
        setEditingId(null);
    };

    // Format salary for display
    const formatSalary = (amount) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 0 
        }).format(amount);
    };

    // Get grade badge
    const getGradeBadge = (grade) => {
        const gradeInfo = SALARY_GRADES.find(g => g.value === grade);
        if (!gradeInfo) return null;
        return (
            <Badge variant="secondary" className={gradeInfo.color}>
                {gradeInfo.value}
            </Badge>
        );
    };

    // Stats
    const stats = useMemo(() => ({
        total: designations.length,
        withGrade: designations.filter(d => d.salary_grade).length,
        withSalary: designations.filter(d => d.min_salary || d.max_salary).length,
        totalEmployees: Object.values(employeeCount).reduce((a, b) => a + b, 0)
    }), [designations, employeeCount]);

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Designations</h1>
                        <p className="text-muted-foreground">Manage job titles and salary grades</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Briefcase className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-xs text-muted-foreground">Total Designations</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.withGrade}</p>
                                    <p className="text-xs text-muted-foreground">With Grade</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <IndianRupee className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.withSalary}</p>
                                    <p className="text-xs text-muted-foreground">With Salary Range</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Users className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                                    <p className="text-xs text-muted-foreground">Total Employees</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Add/Edit Form */}
                    <div className="md:col-span-1">
                        <Card className="border-t-4 border-t-primary shadow-md sticky top-4">
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {editingId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                    {editingId ? 'Edit Designation' : 'Add Designation'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="desigName">Designation Name <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="desigName"
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g., Senior Teacher"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="desigDesc">Description</Label>
                                    <Textarea 
                                        id="desigDesc"
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                        placeholder="Brief description of the role..."
                                        rows={2}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Salary Grade</Label>
                                    <Select 
                                        value={formData.salary_grade} 
                                        onValueChange={(v) => setFormData({...formData, salary_grade: v === 'none' ? '' : v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select salary grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Not Specified</SelectItem>
                                            {SALARY_GRADES.map(grade => (
                                                <SelectItem key={grade.value} value={grade.value}>
                                                    {grade.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="minSalary">Min Salary (?)</Label>
                                        <Input 
                                            id="minSalary"
                                            type="number"
                                            value={formData.min_salary} 
                                            onChange={(e) => setFormData({...formData, min_salary: e.target.value})} 
                                            placeholder="15000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxSalary">Max Salary (?)</Label>
                                        <Input 
                                            id="maxSalary"
                                            type="number"
                                            value={formData.max_salary} 
                                            onChange={(e) => setFormData({...formData, max_salary: e.target.value})} 
                                            placeholder="50000"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="sortOrder">Sort Order</Label>
                                    <Input 
                                        id="sortOrder"
                                        type="number"
                                        value={formData.sort_order} 
                                        onChange={(e) => setFormData({...formData, sort_order: e.target.value})} 
                                        placeholder="0"
                                        min="0"
                                    />
                                    <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                                </div>
                                
                                <div className="flex justify-end pt-4 gap-2">
                                    {editingId && (
                                        <Button variant="outline" onClick={resetForm}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button onClick={handleSubmit} disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        {editingId ? 'Update' : 'Save'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: List Table */}
                    <div className="md:col-span-2">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    Designation List
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[50px]">Sl</TableHead>
                                            <TableHead>Designation</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead>Salary Range</TableHead>
                                            <TableHead className="text-center">Employees</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isFetching ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24">
                                                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : designations.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                    No designations found. Add your first designation.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            designations.map((desig, index) => (
                                                <TableRow key={desig.id} className="hover:bg-muted/50">
                                                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <span className="font-medium">{desig.name}</span>
                                                            {desig.description && (
                                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                    {desig.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {desig.salary_grade ? getGradeBadge(desig.salary_grade) : (
                                                            <span className="text-muted-foreground text-sm">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {(desig.min_salary || desig.max_salary) ? (
                                                            <span className="text-sm">
                                                                {formatSalary(desig.min_salary)} - {formatSalary(desig.max_salary)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">Not defined</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary">
                                                            {employeeCount[desig.id] || 0}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="icon" 
                                                                className="h-8 w-8"
                                                                onClick={() => handleEdit(desig)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="destructive" 
                                                                size="icon" 
                                                                className="h-8 w-8"
                                                                onClick={() => {
                                                                    setDesignationToDelete(desig);
                                                                    setShowDeleteDialog(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Designation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{designationToDelete?.name}</strong>? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default Designations;
