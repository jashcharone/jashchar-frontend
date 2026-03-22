/**
 * ParentFees - View child's fee details
 * Parent can see fee allocations, payments, and balances for selected child
 */
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChildSelector from '@/components/ChildSelector';
import { useParentChild } from '@/contexts/ParentChildContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

const ParentFees = () => {
  const { selectedChild } = useParentChild();
  const { toast } = useToast();
  const [student, setStudent] = useState(null);
  const [feeMasters, setFeeMasters] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedChild?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const studentId = selectedChild.id;

        // Use selectedChild data instead of querying student_profiles (RLS blocks parent access)
        setStudent(selectedChild);

        const [allocationsRes, paymentsRes, ledgerRes] = await Promise.all([
          supabase.from('student_fee_allocations').select('fee_master_id').eq('student_id', studentId),
          supabase.from('fee_payments').select('*').eq('student_id', studentId).order('payment_date', { ascending: false }),
          // Unified ledger: academic + hostel + transport fees
          supabase
            .from('student_fee_ledger')
            .select('*, fee_type:fee_types(name, code)')
            .eq('student_id', studentId)
            .neq('status', 'cancelled')
            .order('due_date'),
        ]);

        if (allocationsRes.data) {
          const masterIds = allocationsRes.data.map(a => a.fee_master_id);
          if (masterIds.length > 0) {
            const { data: mastersData } = await supabase.from('fee_masters').select('*, fee_group:fee_group_id(name), fee_type:fee_type_id(name, code)').in('id', masterIds).order('due_date');
            setFeeMasters(mastersData || []);
          } else {
            setFeeMasters([]);
          }
        }
        setPayments(paymentsRes.data || []);
        setLedgerEntries(ledgerRes.data || []);
      } catch (err) {
        console.error('Error:', err);
        toast({ variant: 'destructive', title: 'Error loading fee data' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedChild, toast]);

  const feeData = useMemo(() => {
    // Old system fees (fee_masters via student_fee_allocations)
    const oldFees = feeMasters.map(master => {
      const masterPayments = payments.filter(p => p.fee_master_id === master.id && !p.reverted_at);
      const totalPaid = masterPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalDiscount = masterPayments.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);
      const balance = Number(master.amount) - totalPaid - totalDiscount;

      let status = 'Unpaid';
      let statusClass = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      if (balance <= 0) {
        status = 'Paid';
        statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      } else if (totalPaid > 0 || totalDiscount > 0) {
        status = 'Partial';
        statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      }

      return {
        ...master,
        fee_group_name: master.fee_group?.name || '-',
        fee_type_name: master.fee_type?.name || '-',
        totalPaid,
        totalDiscount,
        balance: Math.max(0, balance),
        status,
        statusClass,
      };
    });

    // Unified ledger fees (hostel, transport, academic via Fee Engine 3.0)
    const ledgerFees = ledgerEntries.map(entry => {
      const netAmount = Number(entry.net_amount) || 0;
      const paidAmount = Number(entry.paid_amount) || 0;
      const discountAmount = Number(entry.discount_amount) || 0;
      const balance = Math.max(0, netAmount - paidAmount - discountAmount);

      const feeSource = entry.fee_source || 'academic';
      const sourceLabels = { academic: 'Academic', hostel: 'Hostel', transport: 'Transport', other: 'Other' };

      let status = 'Unpaid';
      let statusClass = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      if (entry.status === 'paid' || balance <= 0) {
        status = 'Paid';
        statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      } else if (paidAmount > 0 || discountAmount > 0) {
        status = 'Partial';
        statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      }

      return {
        id: entry.id,
        amount: netAmount,
        fee_group_name: sourceLabels[feeSource] || feeSource,
        fee_type_name: entry.fee_type?.name || (entry.billing_period || '-'),
        due_date: entry.due_date,
        totalPaid: paidAmount,
        totalDiscount: discountAmount,
        balance,
        status,
        statusClass,
      };
    });

    return [...oldFees, ...ledgerFees];
  }, [feeMasters, payments, ledgerEntries]);

  const totalAmount = feeData.reduce((sum, f) => sum + Number(f.amount), 0);
  const totalPaid = feeData.reduce((sum, f) => sum + f.totalPaid, 0);
  const totalBalance = feeData.reduce((sum, f) => sum + f.balance, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Child Fees
          </h1>
        </div>

        <ChildSelector />

        {!selectedChild ? (
          <Card className="p-8 text-center text-muted-foreground">No child selected</Card>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Fees</p>
                  <p className="text-2xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalBalance.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Fee Table */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Details - {selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`}</CardTitle>
              </CardHeader>
              <CardContent>
                {feeData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No fee allocations found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Group</TableHead>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeData.map(fee => (
                          <TableRow key={fee.id}>
                            <TableCell>{fee.fee_group_name}</TableCell>
                            <TableCell>{fee.fee_type_name}</TableCell>
                            <TableCell>{fee.due_date ? format(new Date(fee.due_date), 'dd MMM yyyy') : '-'}</TableCell>
                            <TableCell className="text-right font-medium">₹{Number(fee.amount).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-green-600">₹{fee.totalPaid.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-red-600">₹{fee.balance.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${fee.statusClass}`}>
                                {fee.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            {payments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Recent Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.filter(p => !p.reverted_at).slice(0, 10).map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : '-'}</TableCell>
                            <TableCell className="font-medium">₹{Number(payment.amount).toLocaleString()}</TableCell>
                            <TableCell>{payment.payment_mode || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700">Paid</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentFees;
