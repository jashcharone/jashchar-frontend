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
import {
  Users, LogOut, Clock, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';

const InPremisesVisitors = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState([]);

  const fetchInPremises = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await api.get('/hostel-visitors/in-premises');
      if (res.data?.success) setVisitors(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [branchId, toast]);

  useEffect(() => { fetchInPremises(); }, [fetchInPremises]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchInPremises, 30000);
    return () => clearInterval(interval);
  }, [fetchInPremises]);

  const handleCheckout = async (visitorId) => {
    try {
      await api.post(`/hostel-visitors/${visitorId}/checkout`);
      toast({ title: 'Visitor checked out' });
      fetchInPremises();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const isOverstay = (visitor) => {
    if (!visitor.expected_exit_time) return false;
    return new Date() > new Date(visitor.expected_exit_time);
  };

  const getDuration = (entryTime) => {
    const mins = Math.floor((new Date() - new Date(entryTime)) / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const getRelationLabel = (rel) => {
    const map = { father: 'Father', mother: 'Mother', guardian: 'Guardian', sibling: 'Sibling', other: 'Other' };
    return map[rel] || rel;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">🟢 In-Premises Visitors</h1>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Users className="w-4 h-4 mr-2" /> {visitors.length} Visitors
            </Badge>
            <Button onClick={fetchInPremises} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : visitors.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No visitors currently in premises
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitors.map(v => {
              const overstay = isOverstay(v);
              return (
                <Card key={v.id} className={`${overstay ? 'border-red-500 border-2 bg-red-50' : 'border-green-200'}`}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{v.visitor_name}</h3>
                        <p className="text-sm text-muted-foreground">{v.visitor_phone}</p>
                      </div>
                      {overstay && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overstay
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Relation</span>
                        <span className="font-medium">{getRelationLabel(v.visitor_relation)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Student</span>
                        <span className="font-medium">{v.student ? `${v.student.first_name} ${v.student.last_name}` : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hostel</span>
                        <span className="font-medium">{v.hostel?.name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entry</span>
                        <span className="font-medium">{formatDateTime(v.entry_time)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Duration</span>
                        <Badge variant={overstay ? 'destructive' : 'outline'} className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {getDuration(v.entry_time)}
                        </Badge>
                      </div>
                      {v.items_carried && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Items</span>
                          <span className="font-medium text-xs">{v.items_carried}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleCheckout(v.id)}
                      className="w-full mt-4"
                      variant={overstay ? 'destructive' : 'default'}
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Checkout
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">Auto-refreshes every 30 seconds</p>
      </div>
    </DashboardLayout>
  );
};

export default InPremisesVisitors;
