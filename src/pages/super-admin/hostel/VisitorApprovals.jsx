import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle, XCircle, Clock, Users, Loader2, RefreshCw
} from 'lucide-react';

const VisitorApprovals = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [pendingVisitors, setPendingVisitors] = useState([]);
  const [rejectReasons, setRejectReasons] = useState({});

  const fetchPending = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await api.get('/hostel-visitors/pending-approvals');
      if (res.data?.success) setPendingVisitors(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [branchId, toast]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(fetchPending, 20000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  const handleApprove = async (visitorId) => {
    try {
      await api.post(`/hostel-visitors/${visitorId}/approve`);
      toast({ title: 'Visitor approved' });
      fetchPending();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleReject = async (visitorId) => {
    try {
      await api.post(`/hostel-visitors/${visitorId}/reject`, {
        reason: rejectReasons[visitorId] || ''
      });
      toast({ title: 'Visitor rejected' });
      fetchPending();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const getRelationLabel = (rel) => {
    const map = { father: 'Father', mother: 'Mother', guardian: 'Guardian', sibling: 'Sibling', other: 'Other' };
    return map[rel] || rel;
  };

  const getPurposeLabel = (p) => {
    const map = { meet_student: 'Meet Student', drop_items: 'Drop Items', pickup_student: 'Pickup', emergency: 'Emergency', other: 'Other' };
    return map[p] || p;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">⏳ Visitor Approvals</h1>
          <div className="flex items-center gap-3">
            <Badge variant={pendingVisitors.length > 0 ? 'destructive' : 'outline'} className="text-lg px-3 py-1">
              <Clock className="w-4 h-4 mr-2" /> {pendingVisitors.length} Pending
            </Badge>
            <Button onClick={fetchPending} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : pendingVisitors.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No pending visitor approvals
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingVisitors.map(v => (
              <Card key={v.id} className="border-yellow-300 dark:border-yellow-700 border-2">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{v.visitor_name}</h3>
                      <p className="text-sm text-muted-foreground">{v.visitor_phone}</p>
                    </div>
                    <Badge className="bg-yellow-500 dark:bg-yellow-600 text-white">
                      <Clock className="w-3 h-3 mr-1" /> Pending
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Relation</span>
                      <span className="font-medium">{getRelationLabel(v.visitor_relation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Student</span>
                      <span className="font-medium">
                        {v.student ? `${v.student.first_name} ${v.student.last_name}` : '-'}
                        {v.student?.admission_number && <span className="text-xs ml-1">({v.student.admission_number})</span>}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hostel</span>
                      <span className="font-medium">{v.hostel?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purpose</span>
                      <Badge variant="outline">{getPurposeLabel(v.visit_purpose)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requested</span>
                      <span className="font-medium text-xs">{formatDateTime(v.entry_time)}</span>
                    </div>
                    {v.visit_notes && (
                      <div>
                        <span className="text-muted-foreground">Notes: </span>
                        <span className="text-xs">{v.visit_notes}</span>
                      </div>
                    )}
                  </div>

                  <Textarea
                    placeholder="Rejection reason (optional)..."
                    rows={2}
                    value={rejectReasons[v.id] || ''}
                    onChange={e => setRejectReasons(prev => ({ ...prev, [v.id]: e.target.value }))}
                    className="mb-3"
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(v.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(v.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">Auto-refreshes every 20 seconds</p>
      </div>
    </DashboardLayout>
  );
};

export default VisitorApprovals;
