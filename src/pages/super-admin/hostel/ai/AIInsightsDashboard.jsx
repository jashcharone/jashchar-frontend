import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import {
  Loader2, ArrowLeft, Brain, TrendingUp, AlertTriangle, BarChart3,
  RefreshCw, Lightbulb, Target, Eye, CheckCircle
} from 'lucide-react';

const AIInsightsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentInsights, setRecentInsights] = useState([]);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [statsRes, insightsRes] = await Promise.all([
        api.get('/hostel-ai/insights/stats', { params: { branchId } }),
        api.get('/hostel-ai/insights', { params: { branchId, limit: 10 } })
      ]);
      if (statsRes.data?.success) setStats(statsRes.data.data || {});
      if (insightsRes.data?.success) setRecentInsights(insightsRes.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load AI data' });
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const priorityColor = (p) => {
    const map = { critical: 'destructive', high: 'warning', medium: 'secondary', low: 'outline' };
    return map[p] || 'secondary';
  };

  const typeIcon = (t) => {
    const map = {
      occupancy_prediction: <BarChart3 className="h-4 w-4" />,
      attendance_anomaly: <AlertTriangle className="h-4 w-4" />,
      complaint_pattern: <Target className="h-4 w-4" />,
      maintenance_prediction: <Lightbulb className="h-4 w-4" />
    };
    return map[t] || <Brain className="h-4 w-4" />;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="h-6 w-6 text-purple-600" /> AI Insights Dashboard</h1>
              <p className="text-sm text-muted-foreground">Cortex AI - Hostel Intelligence</p>
            </div>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4 text-center">
                <Lightbulb className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">{stats.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Insights</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <p className="text-2xl font-bold">{stats.new || 0}</p>
                <p className="text-sm text-muted-foreground">New</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <Eye className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{stats.reviewed || 0}</p>
                <p className="text-sm text-muted-foreground">Reviewed</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{stats.implemented || 0}</p>
                <p className="text-sm text-muted-foreground">Implemented</p>
              </CardContent></Card>
            </div>

            {/* Quick Nav */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => navigate('/super-admin/hostel/occupancy-prediction')}>
                <BarChart3 className="h-6 w-6 text-blue-500" /><span>Occupancy Prediction</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => navigate('/super-admin/hostel/attendance-anomalies')}>
                <AlertTriangle className="h-6 w-6 text-orange-500" /><span>Attendance Anomalies</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => navigate('/super-admin/hostel/complaint-analysis-ai')}>
                <Target className="h-6 w-6 text-purple-500" /><span>Complaint Analysis</span>
              </Button>
            </div>

            {/* Recent Insights */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> Recent AI Insights</CardTitle></CardHeader>
              <CardContent>
                {recentInsights.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold">No AI Insights Yet</p>
                    <p className="text-muted-foreground">Cortex AI will generate insights as data accumulates</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentInsights.map(insight => (
                      <div key={insight.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                        <div className="mt-1">{typeIcon(insight.insight_type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={priorityColor(insight.priority)}>{insight.priority}</Badge>
                            <Badge variant="outline">{insight.insight_type?.replace(/_/g, ' ')}</Badge>
                            <Badge variant={insight.status === 'new' ? 'destructive' : 'secondary'}>{insight.status}</Badge>
                          </div>
                          <p className="font-medium">{insight.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                          {insight.recommendation && (
                            <p className="text-sm text-blue-600 mt-1">💡 {insight.recommendation}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">{formatDateTime(insight.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AIInsightsDashboard;
