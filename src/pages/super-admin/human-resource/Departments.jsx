import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Edit, Save } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const Departments = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const [departments, setDepartments] = useState([]);
    const [departmentName, setDepartmentName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [editingId, setEditingId] = useState(null);

    let branchId = user?.profile?.branch_id;
    if (!branchId) {
        branchId = sessionStorage.getItem('ma_target_branch_id');
    }

    const fetchDepartments = async () => {
        if (!branchId || !selectedBranch?.id) return;
        setIsFetching(true);
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('branch_id', branchId)
            .eq('branch_id', selectedBranch.id)
            .order('name');
        
        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error fetching departments" });
        } else {
            setDepartments(data || []);
        }
        setIsFetching(false);
    };

    useEffect(() => {
        if (branchId && selectedBranch?.id) {
            fetchDepartments();
        }
    }, [branchId, selectedBranch?.id]);

    const handleSubmit = async () => {
        if (!departmentName.trim()) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }
        if (!selectedBranch?.id) {
            toast({ variant: "destructive", title: "Branch not selected" });
            return;
        }
        setLoading(true);
        
        const payload = {
            name: departmentName,
            branch_id: branchId,
            branch_id: selectedBranch.id
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
            setDepartmentName('');
            setEditingId(null);
            fetchDepartments();
        }
    };

    const handleDelete = async (departmentId) => {
        if (!window.confirm("Are you sure you want to delete this department?")) return;
        
        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', departmentId);

        if (error) {
            toast({ variant: "destructive", title: "Error deleting department" });
        } else {
            toast({ title: "Deleted successfully" });
            fetchDepartments();
        }
    };
    
    const handleEdit = (dept) => {
        setDepartmentName(dept.name);
        setEditingId(dept.id);
    };

    const handleCancel = () => {
        setDepartmentName('');
        setEditingId(null);
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Add/Edit Form */}
                    <div className="md:col-span-1">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Edit className="h-5 w-5" /> 
                                    {editingId ? 'Edit Department' : 'Add Department'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deptName">Department Name <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="deptName"
                                        value={departmentName} 
                                        onChange={(e) => setDepartmentName(e.target.value)} 
                                        placeholder="Enter department name"
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    {editingId && (
                                        <Button variant="outline" onClick={handleCancel} className="mr-2">
                                            Cancel
                                        </Button>
                                    )}
                                    <Button onClick={handleSubmit} disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Save
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
                                    <div className="h-5 w-5 flex items-center justify-center">
                                        <span className="text-lg font-bold">°</span>
                                    </div>
                                    Department List
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[50px]">Sl</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isFetching ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24">
                                                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : departments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                    No departments found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            departments.map((dept, index) => (
                                                <TableRow key={dept.id}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell className="font-medium">{dept.name}</TableCell>
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
                                                                onClick={() => handleDelete(dept.id)}
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
        </DashboardLayout>
    );
};

export default Departments;
