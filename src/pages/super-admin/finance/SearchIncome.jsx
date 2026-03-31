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
import { Loader2, Search, FileBox } from 'lucide-react';
import { format } from 'date-fns';

const SearchIncome = () => {
    const { user, organizationId, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [incomes, setIncomes] = useState([]);
    const [incomeHeads, setIncomeHeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useState({
        search_type: '',
        search_query: '',
    });
    
    // Unified branchId with fallback for staff users
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const fetchIncomeHeads = useCallback(async () => {
        if (!branchId) return;
        const { data } = await supabase
            .from('income_heads')
            .select('id, name')
            .eq('branch_id', branchId)
            .order('name');
        setIncomeHeads(data || []);
    }, [branchId]);

    useEffect(() => {
        fetchIncomeHeads();
    }, [fetchIncomeHeads]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!branchId) return;
        setLoading(true);

        let query = supabase
            .from('incomes')
            .select(`*, income_head:income_heads (name)`)
            .eq('branch_id', branchId);
        
        if (searchParams.search_type && searchParams.search_type !== 'all') {
            query = query.eq('income_head_id', searchParams.search_type);
        }
        if (searchParams.search_query) {
            query = query.or(`name.ilike.%${searchParams.search_query}%,invoice_no.ilike.%${searchParams.search_query}%`);
        }

        const { data, error } = await query.order('date', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching incomes', description: error.message });
        } else {
            setIncomes(data || []);
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4">Search Income</h1>
            
            {/* Search Criteria Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Select Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <Label>Search Type <span className="text-red-500">*</span></Label>
                            <Select 
                                value={searchParams.search_type} 
                                onValueChange={v => setSearchParams(p => ({...p, search_type: v}))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Income Heads</SelectItem>
                                    {incomeHeads.map(head => (
                                        <SelectItem key={head.id} value={head.id}>{head.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Search <span className="text-red-500">*</span></Label>
                            <Input 
                                placeholder="Search By Income" 
                                value={searchParams.search_query} 
                                onChange={e => setSearchParams(p => ({...p, search_query: e.target.value}))} 
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />} Search
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Income List Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Income List</CardTitle>
                        <Button type="button" className="bg-blue-500 hover:bg-blue-600">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Invoice Number</TableHead>
                                    <TableHead>Income Head</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount (?)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : incomes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <p className="text-orange-500 mb-4">No data available in table</p>
                                                <FileBox className="h-20 w-20 text-gray-300 mb-4" />
                                                <p className="text-green-600">? Add new record or search with different criteria.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    incomes.map(income => (
                                        <TableRow key={income.id}>
                                            <TableCell className="font-medium">{income.name}</TableCell>
                                            <TableCell>{income.invoice_no || '-'}</TableCell>
                                            <TableCell>{income.income_head?.name || '-'}</TableCell>
                                            <TableCell>{income.date ? format(new Date(income.date), 'MM/dd/yyyy') : '-'}</TableCell>
                                            <TableCell className="text-right">₹{income.amount?.toLocaleString('en-IN') || '0'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="text-sm text-muted-foreground mt-2">
                            Showing {incomes.length > 0 ? 1 : 0} to {incomes.length} of {incomes.length} entries
                        </div>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default SearchIncome;

