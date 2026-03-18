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
  Loader2, ArrowLeft, BarChart3, TrendingUp, TrendingDown, Home, RefreshCw
} from 'lucide-react';

const OccupancyPrediction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [occupancyData, setOccupancyData] = useState([]);

  useEffect(() => {
    if (!branchId) return;
    api.get('/hostel/list').then(r => { if (r.data?.success) setHostels(r.data.data || []); });
  }, [branchId]);

  const fetchOccupancy = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { branchId };
      if (selectedHostel !== 'all') params.hostelId = selectedHostel;

      const res = await api.get('/hostel-ai/analysis/occupancy', { params });
      if (res.data?.success) setOccupancyData(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load occupancy data' });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedHostel]);

  useEffect(() => { fetchOccupancy(); }, [fetchOccupancy]);

  const occupancyColor = (pct) => {
    if (pct >= 90) return 'text-red-600';
    if (pct >= 70) return 'text-orange-500';
    if (pct >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-blue-600" /> Occupancy Prediction</h1>
              <p className="text-sm text-muted-foreground">AI-powered occupancy analysis & forecasting</p>
            </div>
          </div>
          <Button onClick={fetchOccupancy} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>

        <Select value={selectedHostel} onValueChange={setSelectedHostel}>
          <SelectTrigger className="w-60"><SelectValue placeholder="Filter by hostel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hostels</SelectItem>
            {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
          </SelectContent>
        </Select>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : occupancyData.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No Occupancy Data</p>
              <p className="text-muted-foreground">Occupancy data will appear as hostels are populated with students</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {occupancyData.map((hostel, idx) => {
              const pct = hostel.total_capacity > 0 ? Math.round((hostel.occupied / hostel.total_capacity) * 100) : 0;
              return (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" /> {hostel.hostel_name || 'Hostel'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Occupancy</span>
                      <span className={`text-2xl font-bold ${occupancyColor(pct)}`}>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-3" />
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-2 bg-muted rounded">
                        <p className="font-bold">{hostel.total_capacity || 0}</p>
                        <p className="text-xs text-muted-foreground">Capacity</p>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                        <p className="font-bold text-green-600">{hostel.occupied || 0}</p>
                        <p className="text-xs text-muted-foreground">Occupied</p>
                      </div>
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                        <p className="font-bold text-blue-600">{(hostel.total_capacity || 0) - (hostel.occupied || 0)}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                    </div>
                    {hostel.trend && (
                      <div className="flex items-center gap-2 text-sm">
                        {hostel.trend === 'increasing' ? (
                          <><TrendingUp className="h-4 w-4 text-red-500" /> <span>Occupancy increasing</span></>
                        ) : (
                          <><TrendingDown className="h-4 w-4 text-green-500" /> <span>Occupancy decreasing</span></>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OccupancyPrediction;
