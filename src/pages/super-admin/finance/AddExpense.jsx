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
import { Loader2, Plus, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from '@/components/ui/DatePicker';
import { format } from 'date-fns';

const AddExpense = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [expenseHeads, setExpenseHeads] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState([]);
    const [formData, setFormData] = useState({
        expense_head_id: '',
        name: '',
        invoice_no: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        description: '',
    });
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    useEffect(() => {
        if (branchId) {
            const fetchExpenseHeads = async () => {
                const { data, error } = await supabase
                    .from('expense_heads')
                    .select('id, name')
                    .eq('branch_id', branchId);
                if (error) {
                    toast({ variant: 'destructive', title: 'Error fetching expense heads', description: error.message });
                } else {
                    setExpenseHeads(data);
                }
            };
            fetchExpenseHeads();
        }
    }, [branchId, toast]);
    
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!branchId) {
            toast({ variant: 'destructive', title: 'Error', description: 'School not identified.' });
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

                    if (error) {
                        throw error;
                    }
                    const { data: { publicUrl } } = supabase.storage.from('expense-documents').getPublicUrl(data.path);
                    return { url: publicUrl, name: file.name };
                });
                documentUrls = await Promise.all(uploadPromises);
            }

            const { error: insertError } = await supabase
                .from('expenses')
                .insert([{
                    ...formData,
                    branch_id: branchId,
                    amount: parseFloat(formData.amount),
                    documents: documentUrls.length > 0 ? documentUrls : null
                }]);

            if (insertError) {
                throw insertError;
            }

            toast({ title: 'Success', description: 'Expense added successfully.' });
            setFormData({
                expense_head_id: '',
                name: '',
                invoice_no: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                amount: '',
                description: '',
            });
            setFiles([]);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error adding expense', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4">Add Expense</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Enter Expense Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="expense_head_id" required>Expense Head</Label>
                                <Select value={formData.expense_head_id} onValueChange={(v) => setFormData(p => ({...p, expense_head_id:v}))} required>
                                    <SelectTrigger id="expense_head_id">
                                        <SelectValue placeholder="Select Expense Head" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expenseHeads.map(head => (
                                            <SelectItem key={head.id} value={head.id}>{head.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="name" required>Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="invoice_no">Invoice Number</Label>
                                <Input id="invoice_no" name="invoice_no" value={formData.invoice_no} onChange={handleInputChange} />
                            </div>
                            <div>
                                <Label htmlFor="date" required>Date</Label>
                                <DatePicker id="date" value={formData.date} onChange={handleDateChange} />
                            </div>
                            <div>
                                <Label htmlFor="amount" required>Amount</Label>
                                <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange} required />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <Label htmlFor="documents">Attach Documents</Label>
                                <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary">
                                    <input {...getInputProps()} />
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    {isDragActive ? <p>Drop the files here ...</p> : <p>Drag 'n' drop some files here, or click to select files</p>}
                                </div>
                                <aside className="mt-4">
                                    <h4 className="font-semibold">Files:</h4>
                                    <ul>{files.map(file => <li key={file.path}>{file.path} - {file.size} bytes <Button variant="link" size="sm" onClick={() => handleRemoveFile(file)}>Remove</Button></li>)}</ul>
                                </aside>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />} Save Expense
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default AddExpense;
