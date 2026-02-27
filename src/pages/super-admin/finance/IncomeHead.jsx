import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Edit2, Trash2, Search, Copy, Download, Printer } from 'lucide-react';

const IncomeHead = () => {
    const { user, organizationId, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [incomeHeads, setIncomeHeads] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    
    // Unified branchId with fallback for staff users
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const fetchIncomeHeads = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        
        const { data, error } = await supabase
            .from('income_heads')
            .select('*')
            .eq('branch_id', branchId)
            .order('name');
            
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            setIncomeHeads(data || []);
        }
        setLoading(false);
    }, [branchId, toast]);

    useEffect(() => {
        fetchIncomeHeads();
    }, [fetchIncomeHeads]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({ name: '', description: '' });
        setEditingId(null);
    };

    const handleEdit = (head) => {
        setEditingId(head.id);
        setFormData({
            name: head.name || '',
            description: head.description || '',
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this income head?')) return;
        
        const { error } = await supabase.from('income_heads').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Income head deleted successfully' });
            fetchIncomeHeads();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!branchId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Branch not selected.' });
            return;
        }
        if (!formData.name.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Income Head name is required.' });
            return;
        }
        setIsSubmitting(true);
        
        try {
            const headData = {
                ...formData,
                branch_id: branchId,
                organization_id: organizationId,
                session_id: currentSessionId,
            };

            if (editingId) {
                const { error } = await supabase.from('income_heads').update(headData).eq('id', editingId);
                if (error) throw error;
                toast({ title: 'Success', description: 'Income head updated successfully.' });
            } else {
                const { error } = await supabase.from('income_heads').insert([headData]);
                if (error) throw error;
                toast({ title: 'Success', description: 'Income head added successfully.' });
            }
            
            resetForm();
            fetchIncomeHeads();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredHeads = incomeHeads.filter(head => 
        head.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        head.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4">Income Head</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left - Add Income Head Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit Income Head' : 'Add Income Head'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Income Head <span className="text-red-500">*</span></Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter income head name" />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="Enter description" />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                    Save
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Right - Income Head List */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Income Head List</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search" className="pl-8 w-40" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="outline" size="icon" className="h-8 w-8"><Copy className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8"><Printer className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Income Head</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredHeads.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    No data available in table
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredHeads.map(head => (
                                                <TableRow key={head.id}>
                                                    <TableCell className="font-medium text-blue-600">{head.name}</TableCell>
                                                    <TableCell className="max-w-[200px] truncate">{head.description || '-'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 bg-blue-500 text-white hover:bg-blue-600" onClick={() => handleEdit(head)}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 bg-red-500 text-white hover:bg-red-600" onClick={() => handleDelete(head.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                <div className="text-sm text-muted-foreground mt-2">
                                    Showing 1 to {filteredHeads.length} of {filteredHeads.length} entries
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default IncomeHead;
