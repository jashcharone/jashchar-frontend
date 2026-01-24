import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Edit, Save } from 'lucide-react';
import api from '@/lib/api'; // Use backend API instead of direct Supabase
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const EmploymentCategory = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [editingId, setEditingId] = useState(null);

    let branchId = user?.profile?.branch_id;
    if (!branchId) {
        branchId = sessionStorage.getItem('ma_target_branch_id');
    }

    const fetchCategories = async () => {
        if (!branchId || !selectedBranch?.id) return;
        setIsFetching(true);
        try {
            const response = await api.get('/human-resource/employment-categories', {
                params: { branchId, branchId: selectedBranch.id }
            });
            setCategories(response.data || []);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error fetching categories", description: error.message });
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (branchId && selectedBranch?.id) {
            fetchCategories();
        }
    }, [branchId, selectedBranch?.id]);

    const handleSubmit = async () => {
        if (!categoryName.trim()) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }
        if (!selectedBranch?.id) {
            toast({ variant: "destructive", title: "Branch not selected" });
            return;
        }
        setLoading(true);
        
        try {
            const payload = {
                name: categoryName,
                branch_id: branchId,
                branch_id: selectedBranch.id
            };

            if (editingId) {
                await api.put(`/human-resource/employment-categories/${editingId}`, payload);
            } else {
                await api.post('/human-resource/employment-categories', payload);
            }

            toast({ title: "Success", description: "Category saved successfully" });
            setCategoryName('');
            setEditingId(null);
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error saving category", description: error.response?.data?.error || error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        
        try {
            await api.delete(`/human-resource/employment-categories/${id}`);
            toast({ title: "Deleted successfully" });
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error deleting category", description: error.response?.data?.error || error.message });
        }
    };
    
    const handleEdit = (item) => {
        setCategoryName(item.name);
        setEditingId(item.id);
    };

    const handleCancel = () => {
        setCategoryName('');
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
                                    {editingId ? 'Edit Category' : 'Add Category'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="catName">Category Name <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="catName"
                                        value={categoryName} 
                                        onChange={(e) => setCategoryName(e.target.value)} 
                                        placeholder="Enter category name"
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
                                    Employment Category List
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
                                        ) : categories.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                    No categories found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            categories.map((item, index) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="icon" 
                                                                className="h-8 w-8"
                                                                onClick={() => handleEdit(item)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="destructive" 
                                                                size="icon" 
                                                                className="h-8 w-8"
                                                                onClick={() => handleDelete(item.id)}
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

export default EmploymentCategory;
