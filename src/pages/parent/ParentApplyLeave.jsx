/**
 * ParentApplyLeave - Apply leave for child
 */
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChildSelector from '@/components/ChildSelector';
import { useParentChild } from '@/contexts/ParentChildContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Send, Calendar } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import { format } from 'date-fns';

const ParentApplyLeave = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedChild } = useParentChild();
  const { toast } = useToast();
  const [pastRequests, setPastRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    from_date: format(new Date(), 'yyyy-MM-dd'),
    to_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  const fetchData = useCallback(async () => {
    if (!selectedChild?.branch_id || !selectedChild?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch past leave requests from student_leaves table
      const { data: requests, error } = await supabase
        .from('student_leaves')
        .select('*')
        .eq('student_id', selectedChild.id)
        .eq('branch_id', selectedChild.branch_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPastRequests(requests || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [selectedChild, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.from_date || !formData.to_date || !formData.reason) {
      toast({ variant: 'destructive', title: 'All fields are required.' });
      return;
    }
    if (!selectedChild?.id) {
      toast({ variant: 'destructive', title: 'Please select a child first.' });
      return;
    }
    if (!selectedChild?.class_id || !selectedChild?.section_id) {
      toast({ variant: 'destructive', title: 'Child profile incomplete. Please contact school admin.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('student_leaves').insert({
        branch_id: selectedChild.branch_id,
        student_id: selectedChild.id,
        class_id: selectedChild.class_id,
        section_id: selectedChild.section_id,
        apply_date: format(new Date(), 'yyyy-MM-dd'),
        from_date: formData.from_date,
        to_date: formData.to_date,
        reason: formData.reason,
        status: 'Pending',
      });

      if (error) throw error;

      toast({ title: 'Leave request submitted successfully!' });
      setFormData({ from_date: format(new Date(), 'yyyy-MM-dd'), to_date: format(new Date(), 'yyyy-MM-dd'), reason: '' });
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to submit leave request', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'approved': return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      default: return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
    }
  };

  const childName = selectedChild ? (selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`) : '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Apply Leave
        </h1>

        <ChildSelector />

        {!selectedChild ? (
          <Card className="p-8 text-center text-muted-foreground">No child selected</Card>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Apply Leave Form */}
            <Card>
              <CardHeader>
                <CardTitle>Apply Leave for {childName}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>From Date</Label>
                      <DatePicker
                        value={formData.from_date}
                        onChange={(val) => handleInputChange('from_date', val)}
                      />
                    </div>
                    <div>
                      <Label>To Date</Label>
                      <DatePicker
                        value={formData.to_date}
                        onChange={(val) => handleInputChange('to_date', val)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Textarea
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Enter reason for leave..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Submit Leave Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Past Requests */}
            {pastRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Past Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastRequests.map(req => (
                          <TableRow key={req.id}>
                            <TableCell>{req.from_date ? format(new Date(req.from_date), 'dd MMM yyyy') : '-'}</TableCell>
                            <TableCell>{req.to_date ? format(new Date(req.to_date), 'dd MMM yyyy') : '-'}</TableCell>
                            <TableCell className="max-w-xs truncate">{req.reason || '-'}</TableCell>
                            <TableCell>{getStatusBadge(req.status)}</TableCell>
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

export default ParentApplyLeave;
