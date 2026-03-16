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
    Loader2, Trash2, Edit, Save, Users, Building2, ChevronRight, 
    Palette, UserCircle, GripVertical, Eye, Plus
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

// Predefined colors for departments
const DEPARTMENT_COLORS = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Gray', value: '#6B7280' },
];

const Departments = () => {
    const { toast } = useToast();
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [employeeCount, setEmployeeCount] = useState({});
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        parent_id: '',
        head_employee_id: '',
        sort_order: 0
    });

    let branchId = user?.profile?.branch_id;
    if (!branchId) {
        branchId = sessionStorage.getItem('ma_target_branch_id');
    }

    const fetchDepartments = async () => {
        if (!branchId || !selectedBranch?.id) return;
        setIsFetching(true);
        
        const { data, error } = await supabase
            .from('departments')
            .select(`
                *,
                parent:departments!parent_id(id, name),
                head:employee_profiles!head_employee_id(id, full_name, photo_url)
            `)
            .eq('branch_id', selectedBranch.id)
            .order('sort_order', { ascending: true })
            .order('name');
        
        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error fetching departments" });
        } else {
            setDepartments(data || []);
        }
        setIsFetching(false);
    };

    const fetchEmployees = async () => {
        if (!selectedBranch?.id) return;
        
        const { data, error } = await supabase
            .from('employee_profiles')
            .select('id, full_name, photo_url, department_id')
            .eq('branch_id', selectedBranch.id)
            .neq('is_disabled', true)
            .order('full_name');
        
        if (error) {
            console.error(error);
        } else {
            setEmployees(data || []);
            
            // Count employees per department
            const counts = {};
            (data || []).forEach(emp => {
                if (emp.department_id) {
                    counts[emp.department_id] = (counts[emp.department_id] || 0) + 1;
                }
            });
            setEmployeeCount(counts);
        }
    };

    useEffect(() => {
        if (branchId && selectedBranch?.id) {
            fetchDepartments();
            fetchEmployees();
        }
    }, [branchId, selectedBranch?.id]);

    // Build hierarchical structure for display
    const hierarchicalDepartments = useMemo(() => {
        const buildTree = (parentId = null) => {
            return departments
                .filter(d => (d.parent_id || null) === parentId)
                .map(dept => ({
                    ...dept,
                    children: buildTree(dept.id),
                    level: parentId ? departments.find(p => p.id === parentId)?.level + 1 || 1 : 0
                }));
        };
        
        const flattenTree = (tree, level = 0) => {
            let result = [];
            tree.forEach(node => {
                result.push({ ...node, level });
                if (node.children?.length) {
                    result = result.concat(flattenTree(node.children, level + 1));
                }
            });
            return result;
        };
        
        return flattenTree(buildTree());
    }, [departments]);

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
            color: formData.color,
            parent_id: formData.parent_id || null,
            head_employee_id: formData.head_employee_id || null,
            sort_order: parseInt(formData.sort_order) || 0,
            branch_id: selectedBranch.id,
            organization_id: organizationId
        };

        let error;
        if (editingId) {
            const { error: updateError } = await supabase
                .from('departments')
                .update(payload)
                .eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('departments')
                .insert(payload);
            error = insertError;
        }

        setLoading(false);

        if (error) {
            toast({ variant: "destructive", title: "Error saving department", description: error.message });
        } else {
            toast({ title: "Success", description: "Department saved successfully" });
            resetForm();
            fetchDepartments();
        }
    };

    const handleDelete = async () => {
        if (!departmentToDelete) return;
        
        // Check if department has children
        const hasChildren = departments.some(d => d.parent_id === departmentToDelete.id);
        if (hasChildren) {
            toast({ variant: "destructive", title: "Cannot delete", description: "Department has sub-departments. Delete them first." });
            setShowDeleteDialog(false);
            return;
        }
        
        // Check if department has employees
        if (employeeCount[departmentToDelete.id] > 0) {
            toast({ variant: "destructive", title: "Cannot delete", description: `Department has ${employeeCount[departmentToDelete.id]} employee(s). Reassign them first.` });
            setShowDeleteDialog(false);
            return;
        }
        
        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', departmentToDelete.id);

        if (error) {
            toast({ variant: "destructive", title: "Error deleting department", description: error.message });
        } else {
            toast({ title: "Deleted successfully" });
            fetchDepartments();
        }
        setShowDeleteDialog(false);
        setDepartmentToDelete(null);
    };
    
    const handleEdit = (dept) => {
        setFormData({
            name: dept.name,
            description: dept.description || '',
            color: dept.color || '#3B82F6',
            parent_id: dept.parent_id || '',
            head_employee_id: dept.head_employee_id || '',
            sort_order: dept.sort_order || 0
        });
        setEditingId(dept.id);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            color: '#3B82F6',
            parent_id: '',
            head_employee_id: '',
            sort_order: 0
        });
        setEditingId(null);
    };

    // Stats
    const stats = useMemo(() => ({
        total: departments.length,
        rootDepts: departments.filter(d => !d.parent_id).length,
        withHead: departments.filter(d => d.head_employee_id).length,
        totalEmployees: Object.values(employeeCount).reduce((a, b) => a + b, 0)
    }), [departments, employeeCount]);

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Departments</h1>
                        <p className="text-muted-foreground">Manage organizational departments and hierarchy</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-xs text-muted-foreground">Total Departments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <ChevronRight className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.rootDepts}</p>
                                    <p className="text-xs text-muted-foreground">Main Departments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <UserCircle className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.withHead}</p>
                                    <p className="text-xs text-muted-foreground">With Head Assigned</p>
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
                                    {editingId ? 'Edit Department' : 'Add Department'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deptName">Department Name <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="deptName"
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g., Administration"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="deptDesc">Description</Label>
                                    <Textarea 
                                        id="deptDesc"
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                        placeholder="Brief description of the department..."
                                        rows={2}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Parent Department</Label>
                                    <Select 
                                        value={formData.parent_id} 
                                        onValueChange={(v) => setFormData({...formData, parent_id: v === 'none' ? '' : v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select parent department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (Root Department)</SelectItem>
                                            {departments
                                                .filter(d => d.id !== editingId)
                                                .map(d => (
                                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Department Head</Label>
                                    <Select 
                                        value={formData.head_employee_id} 
                                        onValueChange={(v) => setFormData({...formData, head_employee_id: v === 'none' ? '' : v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department head" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Not Assigned</SelectItem>
                                            {employees.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {DEPARTMENT_COLORS.map(color => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                    formData.color === color.value 
                                                        ? 'border-gray-900 scale-110' 
                                                        : 'border-transparent hover:scale-105'
                                                }`}
                                                style={{ backgroundColor: color.value }}
                                                onClick={() => setFormData({...formData, color: color.value})}
                                                title={color.name}
                                            />
                                        ))}
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
                                    <Building2 className="h-5 w-5" />
                                    Department List
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[50px]">Sl</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Head</TableHead>
                                            <TableHead className="text-center">Employees</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isFetching ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24">
                                                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : hierarchicalDepartments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    No departments found. Add your first department.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            hierarchicalDepartments.map((dept, index) => (
                                                <TableRow key={dept.id} className="hover:bg-muted/50">
                                                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2" style={{ paddingLeft: dept.level * 20 }}>
                                                            {dept.level > 0 && (
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                            <div 
                                                                className="w-3 h-3 rounded-full" 
                                                                style={{ backgroundColor: dept.color || '#3B82F6' }}
                                                            />
                                                            <div>
                                                                <span className="font-medium">{dept.name}</span>
                                                                {dept.description && (
                                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                        {dept.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {dept.head ? (
                                                            <div className="flex items-center gap-2">
                                                                {dept.head.photo_url ? (
                                                                    <img 
                                                                        src={dept.head.photo_url} 
                                                                        alt="" 
                                                                        className="w-6 h-6 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                                                        {dept.head.full_name?.charAt(0)}
                                                                    </div>
                                                                )}
                                                                <span className="text-sm">{dept.head.full_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary">
                                                            {employeeCount[dept.id] || 0}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="icon" 
                                                                className="h-8 w-8"
                                                                onClick={() => handleEdit(dept)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="destructive" 
                                                                size="icon" 
                                                                className="h-8 w-8"
                                                                onClick={() => {
                                                                    setDepartmentToDelete(dept);
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
                        <DialogTitle>Delete Department</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{departmentToDelete?.name}</strong>? 
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

export default Departments;
