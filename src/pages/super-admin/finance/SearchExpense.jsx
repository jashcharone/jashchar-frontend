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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, FileDown, RotateCcw } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import { format } from 'date-fns';

const SearchExpense = () => {
    const { user, organizationId, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [expenseHeads, setExpenseHeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useState({
        expense_head_id: '',
        dateFrom: '',
        dateTo: '',
    });
    
    const branchId = selectedBranch?.id;

    const fetchExpenseHeads = useCallback(async () => {
        if (!branchId) return;
        const { data } = await supabase
            .from('expense_heads')
            .select('id, name')
            .eq('branch_id', branchId)
            .order('name');
        setExpenseHeads(data || []);
    }, [branchId]);

    useEffect(() => {
        fetchExpenseHeads();
    }, [fetchExpenseHeads]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!branchId) return;
        setLoading(true);

        let query = supabase
            .from('expenses')
            .select(`*, expense_head:expense_heads (name)`)
            .eq('branch_id', branchId);
        
        if (searchParams.expense_head_id) {
            query = query.eq('expense_head_id', searchParams.expense_head_id);
        }
        if (searchParams.dateFrom) {
            query = query.gte('date', searchParams.dateFrom);
        }
        if (searchParams.dateTo) {
            query = query.lte('date', searchParams.dateTo);
        }

        const { data, error } = await query.order('date', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching expenses', description: error.message });
        } else {
            setExpenses(data || []);
        }
        setLoading(false);
    };

    const handleReset = () => {
        setSearchParams({ expense_head_id: '', dateFrom: '', dateTo: '' });
        setExpenses([]);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4">Search Expense</h1>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Search Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <Label>Search By</Label>
                            <Select 
                                value={searchParams.expense_head_id} 
                                onValueChange={v => setSearchParams(p => ({...p, expense_head_id: v}))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Expense Heads</SelectItem>
                                    {expenseHeads.map(head => (
                                        <SelectItem key={head.id} value={head.id}>{head.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Date From</Label>
                            <DatePicker 
                                value={searchParams.dateFrom} 
                                onChange={date => setSearchParams(p => ({...p, dateFrom: date}))} 
                            />
                        </div>
                        <div>
                            <Label>Date To</Label>
                            <DatePicker 
                                value={searchParams.dateTo} 
                                onChange={date => setSearchParams(p => ({...p, dateTo: date}))} 
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />} Search
                            </Button>
                            <Button type="button" variant="outline" onClick={handleReset}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Expense List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Invoice No</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Expense Head</TableHead>
                                    <TableHead className="text-right">Amount (₹)</TableHead>
                                    <TableHead>Documents</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : expenses.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No data available in table</TableCell></TableRow>
                                ) : (
                                    expenses.map(expense => (
                                        <TableRow key={expense.id}>
                                            <TableCell className="font-medium">{expense.name}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{expense.description || '-'}</TableCell>
                                            <TableCell>{expense.invoice_no || '-'}</TableCell>
                                            <TableCell>{expense.date ? format(new Date(expense.date), 'MM/dd/yyyy') : '-'}</TableCell>
                                            <TableCell>{expense.expense_head?.name || '-'}</TableCell>
                                            <TableCell className="text-right">₹{expense.amount?.toLocaleString('en-IN') || '0'}</TableCell>
                                            <TableCell>
                                                {expense.documents && expense.documents.length > 0 ? expense.documents.map((doc, index) => (
                                                    <Button asChild key={index} variant="link" size="sm">
                                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" title={doc.name}>
                                                            <FileDown className="h-4 w-4 mr-1" />
                                                            {`Doc ${index + 1}`}
                                                        </a>
                                                    </Button>
                                                )) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="text-sm text-muted-foreground mt-2">
                            Showing 1 to {expenses.length} of {expenses.length} entries
                        </div>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default SearchExpense;
