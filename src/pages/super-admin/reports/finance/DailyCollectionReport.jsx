import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import DataTableExport from '@/components/DataTableExport';

const DailyCollectionReport = () => {
  const { school } = useAuth();
  const { toast } = useToast();
  
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = React.useRef();

  // Column definitions for export
  const columns = useMemo(() => [
    { key: 'date', label: 'Date' },
    { key: 'total_transactions', label: 'Total Transactions' },
    { key: 'amount', label: 'Amount' },
  ], []);

  // Transform data for export
  const exportData = useMemo(() => {
    return reportData.map(row => ({
      ...row,
      date: format(new Date(row.date), 'dd-MM-yyyy'),
      amount: row.amount.toFixed(2),
    }));
  }, [reportData]);

  const handleSearch = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_daily_collection_report', {
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

  const grandTotal = reportData.reduce((sum, row) => sum + row.amount, 0);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Daily Collection Report</h1>
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div><label>Date From</label><DatePicker value={dateFrom} onChange={setDateFrom} /></div>
          <div><label>Date To</label><DatePicker value={dateTo} onChange={setDateTo} /></div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="flex-shrink-0">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search</Button>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      {reportData.length > 0 && (
        <div className="bg-card p-3 rounded-lg shadow-sm mb-4">
          <DataTableExport
            data={exportData}
            columns={columns}
            fileName={`Daily_Collection_Report_${dateFrom}_to_${dateTo}`}
            title="Daily Collection Report"
            printRef={printRef}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
      ) : (
        <div ref={printRef} className="bg-card p-4 rounded-lg shadow-sm overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">Daily Collection Report</h2>
          <p className="text-center text-sm mb-4">From {format(new Date(dateFrom), 'dd-MM-yyyy')} to {format(new Date(dateTo), 'dd-MM-yyyy')}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Date</th>
                <th className="p-2">Total Transactions</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? reportData.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{format(new Date(row.date), 'dd-MM-yyyy')}</td>
                  <td className="p-2">{row.total_transactions}</td>
                  <td className="p-2 text-right">{row.amount.toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan="3" className="text-center py-10 text-muted-foreground">No data found for the selected criteria.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted">
                <td colSpan="2" className="p-2 text-right">Grand Total:</td>
                <td className="p-2 text-right">{grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DailyCollectionReport;
