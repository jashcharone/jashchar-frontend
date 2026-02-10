import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, Edit2, Trash2, Search } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from '@/components/ui/DatePicker';
import { format } from 'date-fns';

const Expense = () => {
    const { user, organizationId, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [expenseHeads, setExpenseHeads] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        expense_head_id: '',
        name: '',
        invoice_no: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        description: '',
    });
    
    const branchId = selectedBranch?.id;

    const fetchData = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        
        // Fetch expense heads
        const { data: headsData } = await supabase
            .from('expense_heads')
            .select('id, name')
            .eq('branch_id', branchId)
            .order('name');
        setExpenseHeads(headsData || []);
        
        // Fetch expenses with expense head names
        const { data: expenseData, error } = await supabase
            .from('expenses')
            .select('*, expense_head:expense_heads(name)')
            .eq('branch_id', branchId)
            .order('date', { ascending: false });
            
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            setExpenses(expenseData || []);
        }
        setLoading(false);
    }, [branchId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const onDrop = useCallback(acceptedFiles => {
        setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

    const handleRemoveFile = (fileToRemove) => {
        setFiles(files.filter(file => file !== fileToRemove));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, date: date }));
    };

    const resetForm = () => {
        setFormData({
            expense_head_id: '',
            name: '',
            invoice_no: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: '',
            description: '',
        });
        setFiles([]);
        setEditingId(null);
    };

    const handleEdit = (expense) => {
        setEditingId(expense.id);
        setFormData({
            expense_head_id: expense.expense_head_id || '',
            name: expense.name || '',
            invoice_no: expense.invoice_no || '',
            date: expense.date || format(new Date(), 'yyyy-MM-dd'),
            amount: expense.amount?.toString() || '',
            description: expense.description || '',
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Expense deleted successfully' });
            fetchData();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!branchId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Branch not selected.' });
            return;
        }
        setIsSubmitting(true);
        
        try {
            let documentUrls = [];
            if (files.length > 0) {
                const uploadPromises = files.map(async (file) => {
                    const fileName = `${uuidv4()}-${file.name}`;
                    const { data, error } = await supabase.storage
                        .from('expense-documents')
                        .upload(fileName, file);
                    if (error) throw error;
                    const { data: { publicUrl } } = supabase.storage.from('expense-documents').getPublicUrl(data.path);
                    return { url: publicUrl, name: file.name };
                });
                documentUrls = await Promise.all(uploadPromises);
            }

            const expenseData = {
                ...formData,
                branch_id: branchId,
                organization_id: organizationId,
                session_id: currentSessionId,
                amount: parseFloat(formData.amount),
                documents: documentUrls.length > 0 ? documentUrls : null
            };

            if (editingId) {
                const { error } = await supabase.from('expenses').update(expenseData).eq('id', editingId);
                if (error) throw error;
                toast({ title: 'Success', description: 'Expense updated successfully.' });
            } else {
                const { error } = await supabase.from('expenses').insert([expenseData]);
                if (error) throw error;
                toast({ title: 'Success', description: 'Expense added successfully.' });
            }
            
            resetForm();
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredExpenses = expenses.filter(exp => 
        exp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.expense_head?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4">Add Expense</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left - Add Expense Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit Expense' : 'Add Expense'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="expense_head_id">Expense Head <span className="text-red-500">*</span></Label>
                                <Select value={formData.expense_head_id} onValueChange={(v) => setFormData(p => ({...p, expense_head_id: v}))} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expenseHeads.map(head => (
                                            <SelectItem key={head.id} value={head.id}>{head.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="invoice_no">Invoice Number</Label>
                                <Input id="invoice_no" name="invoice_no" value={formData.invoice_no} onChange={handleInputChange} />
                            </div>
                            <div>
                                <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                                <DatePicker id="date" value={formData.date} onChange={handleDateChange} />
                            </div>
                            <div>
                                <Label htmlFor="amount">Amount (₹) <span className="text-red-500">*</span></Label>
                                <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <Label>Attach Document</Label>
                                <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary">
                                    <input {...getInputProps()} />
                                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                    {isDragActive ? <p>Drop files here...</p> : <p className="text-sm text-muted-foreground">Drag and drop a file here or click</p>}
                                </div>
                                {files.length > 0 && (
                                    <ul className="mt-2 text-sm">
                                        {files.map((file, idx) => (
                                            <li key={idx} className="flex justify-between items-center">
                                                <span>{file.name}</span>
                                                <Button type="button" variant="link" size="sm" onClick={() => handleRemoveFile(file)}>Remove</Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
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

                {/* Right - Expense List */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Expense List</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search" className="pl-8 w-40" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Invoice Number</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Expense Head</TableHead>
                                            <TableHead className="text-right">Amount (₹)</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExpenses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    No data available in table
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredExpenses.map(exp => (
                                                <TableRow key={exp.id}>
                                                    <TableCell className="font-medium">{exp.name}</TableCell>
                                                    <TableCell className="max-w-[200px] truncate">{exp.description || '-'}</TableCell>
                                                    <TableCell>{exp.invoice_no || '-'}</TableCell>
                                                    <TableCell>{exp.date ? format(new Date(exp.date), 'MM/dd/yyyy') : '-'}</TableCell>
                                                    <TableCell>{exp.expense_head?.name || '-'}</TableCell>
                                                    <TableCell className="text-right">₹{exp.amount?.toLocaleString('en-IN') || '0'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 bg-blue-500 text-white hover:bg-blue-600" onClick={() => handleEdit(exp)}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 bg-red-500 text-white hover:bg-red-600" onClick={() => handleDelete(exp.id)}>
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
                                    Showing 1 to {filteredExpenses.length} of {filteredExpenses.length} entries
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Expense;
