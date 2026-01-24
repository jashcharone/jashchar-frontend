import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, List } from 'lucide-react';
import { format } from 'date-fns';
import JoinListModal from '@/components/gmeet/JoinListModal';
import { Badge } from '@/components/ui/badge';

const LiveMeetingReport = () => {
  const { user } = useAuth();
  const branchId = user?.user_metadata?.branch_id;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (branchId) fetchReports();
  }, [branchId]);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gmeet_live_meetings')
      .select('id, title, date, status, created_by, joins:gmeet_live_meeting_joins(count)')
      .eq('branch_id', branchId)
      .order('date', { ascending: false });

    if (!error) {
      setReports(data || []);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Live Meeting Report</h1>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Join</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                ) : reports.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">No records found</TableCell></TableRow>
                ) : (
                  reports.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{format(new Date(item.date), 'dd-MMM-yyyy HH:mm')}</TableCell>
                      <TableCell>Self</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Finished' ? 'secondary' : item.status === 'Cancelled' ? 'destructive' : 'default'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.joins?.[0]?.count || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedMeetingId(item.id); setModalOpen(true); }}>
                          <List className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <JoinListModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        type="meeting" 
        itemId={selectedMeetingId} 
        branchId={branchId} 
      />
    </DashboardLayout>
  );
};

export default LiveMeetingReport;
