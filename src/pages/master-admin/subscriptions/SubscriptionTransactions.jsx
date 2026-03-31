import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Search, Loader2, CreditCard, Banknote } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Badge } from '@/components/ui/badge';

const SubscriptionTransactions = () => {
  const [date, setDate] = useState({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('transactions')
          .select(`
            *,
            schools (name),
            subscription_plans (name)
          `)
          .order('created_at', { ascending: false });

        if (date?.from) {
            query = query.gte('created_at', date.from.toISOString());
        }
        if (date?.to) {
            // Add one day to include the end date fully
            const nextDay = addDays(date.to, 1);
            query = query.lt('created_at', nextDay.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [date]);

  const filteredTransactions = transactions.filter(t =>
    t.schools?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Subscription Transactions</h1>
      <div className="bg-card p-6 rounded-xl shadow-lg border">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-[300px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y')} -{' '}
                        {format(date.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by school or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full md:w-80"
            />
          </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                <tr>
                    <th scope="col" className="px-6 py-3">Transaction ID</th>
                    <th scope="col" className="px-6 py-3">School</th>
                    <th scope="col" className="px-6 py-3">Plan</th>
                    <th scope="col" className="px-6 py-3">Amount</th>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Method</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-border">
                {filteredTransactions.length === 0 ? (
                    <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">
                            No transactions found.
                        </td>
                    </tr>
                ) : (
                    filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">{transaction.transaction_id || 'N/A'}</td>
                        <td className="px-6 py-4 font-medium">{transaction.schools?.name || 'Unknown School'}</td>
                        <td className="px-6 py-4">{transaction.subscription_plans?.name || 'Unknown Plan'}</td>
                        <td className="px-6 py-4 font-semibold">₹{transaction.amount}</td>
                        <td className="px-6 py-4 text-muted-foreground">{format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}</td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                {transaction.payment_method === 'Razorpay' ? <CreditCard className="h-4 w-4 text-blue-500" /> : <Banknote className="h-4 w-4 text-green-500" />}
                                {transaction.payment_method}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <Badge variant={transaction.status === 'Success' || transaction.status === 'paid' ? 'success' : transaction.status === 'Failed' ? 'destructive' : 'secondary'}
                                className={
                                    transaction.status === 'Success' || transaction.status === 'paid' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                                    transaction.status === 'Failed' ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''
                                }
                            >
                            {transaction.status}
                            </Badge>
                        </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionTransactions;

