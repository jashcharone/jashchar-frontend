import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTableExport from '@/components/DataTableExport';
import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const IncomeExpenseBalanceReport = () => {
  const { school } = useAuth();
  const { toast } = useToast();
  
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const columns = useMemo(() => [
    { key: 'date_formatted', label: 'Date' },
    { key: 'description', label: 'Description' },
    { key: 'income_formatted', label: 'Income' },
    { key: 'expense_formatted', label: 'Expense' }
  ], []);

  const exportData = useMemo(() => {
    return reportData.map(row => ({
      ...row,
      date_formatted: format(new Date(row.date), 'dd-MM-yyyy'),
      income_formatted: row.income_money ? row.income_money.toFixed(2) : '-',
      expense_formatted: row.expense_money ? row.expense_money.toFixed(2) : '-'
    }));
  }, [reportData]);

  const handleSearch = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_income_expense_report', {
      p_branch_id: school.id,
      p_date_from: dateFrom,
      p_date_to: dateTo,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching report data', description: error.message });
      setReportData([]);
    } else {
      setReportData(data);
    }
    setLoading(false);
  };

  const totalIncome = reportData.reduce((sum, row) => sum + (row.income_money || 0), 0);
  const totalExpense = reportData.reduce((sum, row) => sum + (row.expense_money || 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Income vs Expense Report</h1>
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div><label>Date From</label><DatePicker value={dateFrom} onChange={setDateFrom} /></div>
          <div><label>Date To</label><DatePicker value={dateTo} onChange={setDateTo} /></div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="w-full">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="bg-card p-4 rounded-lg shadow-sm overflow-x-auto">
          {reportData.length > 0 && (
            <div className="bg-card p-3 rounded-lg shadow-sm mb-4">
              <DataTableExport
                data={exportData}
                columns={columns}
                fileName="Income_Expense_Balance_Report"
                title="Income vs Expense Report"
                printRef={printRef}
              />
            </div>
          )}
          <div ref={printRef}>
          <h2 className="text-xl font-semibold mb-4 text-center">Income vs Expense Report</h2>
          <p className="text-center text-sm mb-4">From {format(new Date(dateFrom), 'dd-MM-yyyy')} to {format(new Date(dateTo), 'dd-MM-yyyy')}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Date</th>
                <th className="p-2">Description</th>
                <th className="p-2 text-right">Income</th>
                <th className="p-2 text-right">Expense</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? reportData.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{format(new Date(row.date), 'dd-MM-yyyy')}</td>
                  <td className="p-2">{row.description}</td>
                  <td className="p-2 text-right">{row.income_money ? row.income_money.toFixed(2) : '-'}</td>
                  <td className="p-2 text-right">{row.expense_money ? row.expense_money.toFixed(2) : '-'}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="text-center py-10 text-muted-foreground">No data found for the selected criteria.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted">
                <td colSpan="2" className="p-2 text-right">Total:</td>
                <td className="p-2 text-right">{totalIncome.toFixed(2)}</td>
                <td className="p-2 text-right">{totalExpense.toFixed(2)}</td>
              </tr>
              <tr className="font-bold bg-primary/10">
                <td colSpan="3" className="p-2 text-right">Balance:</td>
                <td className="p-2 text-right">{balance.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default IncomeExpenseBalanceReport;
