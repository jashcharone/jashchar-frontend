import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, FileDown, Eye } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import { format } from 'date-fns';

const SearchExpense = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useState({
        dateFrom: null,
        dateTo: null,
    });
    
    const branchId = user?.profile?.branch_id;

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!branchId) return;
        setLoading(true);

        let query = supabase
            .from('expenses')
            .select(`
                *,
                expense_head:expense_heads (name)
            `)
            .eq('branch_id', branchId);
        
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
            setExpenses(data);
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4">Search Expense</h1>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filter Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <DatePicker 
                            label="Date From"
                            value={searchParams.dateFrom} 
                            onChange={date => setSearchParams(p => ({...p, dateFrom: date}))} 
                        />
                        <DatePicker 
                            label="Date To"
                            value={searchParams.dateTo} 
                            onChange={date => setSearchParams(p => ({...p, dateTo: date}))} 
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2 h-4 w-4" />} Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Expense List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Invoice No</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Expense Head</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Documents</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                            ) : expenses.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center">No expenses found.</TableCell></TableRow>
                            ) : (
                                expenses.map(expense => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{expense.name}</TableCell>
                                        <TableCell>{expense.invoice_no}</TableCell>
                                        <TableCell>{format(new Date(expense.date), 'PPP')}</TableCell>
                                        <TableCell>{expense.expense_head.name}</TableCell>
                                        <TableCell className="text-right">
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(expense.amount)}
                                        </TableCell>
                                        <TableCell>
                                            {expense.documents && expense.documents.map((doc, index) => (
                                                <Button asChild key={index} variant="link" size="sm">
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" title={doc.name}>
                                                        <FileDown className="h-4 w-4 mr-1" />
                                                        {`Doc ${index + 1}`}
                                                    </a>
                                                </Button>
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default SearchExpense;
