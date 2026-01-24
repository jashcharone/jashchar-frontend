import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

const SearchIncome = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [incomes, setIncomes] = useState([]);
  const [query, setQuery] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('income')
        .select(`
          *,
          income_head:income_heads(name)
        `)
        .eq('branch_id', user.user_metadata.branch_id)
        .or(`name.ilike.%${query}%,invoice_no.ilike.%${query}%`)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomes(data || []);
    } catch (error) {
      console.error('Error searching income:', error);
      toast({
        title: "Error",
        description: "Failed to search income.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Search Income</h1>
        
        <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by Name or Invoice Number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>
        </div>

        <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead>Income Head</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Searching...</TableCell></TableRow>
              ) : incomes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No records found.</TableCell></TableRow>
              ) : (
                incomes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.invoice_no || '-'}</TableCell>
                    <TableCell>{item.income_head?.name || '-'}</TableCell>
                    <TableCell>{item.date ? format(new Date(item.date), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell className="text-right font-bold">
                      {user?.user_metadata?.currency || '$'} {item.amount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SearchIncome;
