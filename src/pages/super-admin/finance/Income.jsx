import React, { useState, useEffect } from 'react';
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
import { Plus, Search, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const Income = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.user_metadata?.branch_id) {
      fetchIncomes();
    }
  }, [user]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('income')
        .select(`
          *,
          income_head:income_heads(name)
        `)
        .eq('branch_id', user.user_metadata.branch_id)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomes(data || []);
    } catch (error) {
      console.error('Error fetching incomes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch income list.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this income record?")) return;

    try {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIncomes(incomes.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Income record deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting income:', error);
      toast({
        title: "Error",
        description: "Failed to delete income record.",
        variant: "destructive",
      });
    }
  };

  const filteredIncomes = incomes.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.income_head?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Income List</h1>
          <Button onClick={() => navigate('/school-owner/finance/add-income')}>
            <Plus className="mr-2 h-4 w-4" /> Add Income
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow border border-border p-6">
          <div className="flex items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, invoice or head..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Income Head</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredIncomes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No income records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncomes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.invoice_no || '-'}</TableCell>
                      <TableCell>{item.income_head?.name || '-'}</TableCell>
                      <TableCell>{item.date ? format(new Date(item.date), 'dd MMM yyyy') : '-'}</TableCell>
                      <TableCell className="text-right font-bold">
                         {user?.user_metadata?.currency || '$'} {item.amount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Income;
