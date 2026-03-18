import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import {
  Loader2, ArrowLeft, Target, TrendingUp, AlertTriangle, RefreshCw, MessageSquare
} from 'lucide-react';

const ComplaintAnalysisAI = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [days, setDays] = useState('30');
  const [patterns, setPatterns] = useState([]);

  useEffect(() => {
    if (!branchId) return;
    api.get('/hostel/list').then(r => { if (r.data?.success) setHostels(r.data.data || []); });
  }, [branchId]);

  const fetchPatterns = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { branchId, days: parseInt(days) };
      if (selectedHostel !== 'all') params.hostelId = selectedHostel;

      const res = await api.get('/hostel-ai/analysis/complaint-patterns', { params });
      if (res.data?.success) setPatterns(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load patterns' });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedHostel, days]);

  useEffect(() => { fetchPatterns(); }, [fetchPatterns]);

  const totalComplaints = patterns.reduce((sum, p) => sum + (p.count || 0), 0);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="h-6 w-6 text-purple-600" /> Complaint Analysis</h1>
              <p className="text-sm text-muted-foreground">AI-driven complaint pattern analysis</p>
            </div>
          </div>
          <Button onClick={fetchPatterns} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>

        <div className="flex gap-3">
          <Select value={selectedHostel} onValueChange={setSelectedHostel}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Filter by hostel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hostels</SelectItem>
              {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : patterns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No Complaint Patterns</p>
              <p className="text-muted-foreground">No complaints recorded in the selected period</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Total */}
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Complaints ({days} days)</p>
                  <p className="text-3xl font-bold">{totalComplaints}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Pattern Cards by Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patterns.map((p, i) => {
                const pct = totalComplaints > 0 ? Math.round((p.count / totalComplaints) * 100) : 0;
                return (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{p.category || p.complaint_type || 'General'}</Badge>
                          {p.count > 5 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        <span className="font-bold">{p.count || 0}</span>
                      </div>
                      <Progress value={pct} className="h-2 mb-2" />
                      <p className="text-sm text-muted-foreground">{pct}% of total complaints</p>
                      {p.priority_breakdown && (
                        <div className="flex gap-2 mt-2">
                          {Object.entries(p.priority_breakdown).map(([k, v]) => (
                            <Badge key={k} variant={k === 'high' ? 'destructive' : k === 'medium' ? 'warning' : 'secondary'} className="text-xs">
                              {k}: {v}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {p.avg_resolution_hours && (
                        <p className="text-xs text-muted-foreground mt-2">Avg resolution: {Math.round(p.avg_resolution_hours)} hours</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ComplaintAnalysisAI;
