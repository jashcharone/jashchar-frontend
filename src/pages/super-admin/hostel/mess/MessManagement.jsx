import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UtensilsCrossed, CalendarDays, ClipboardList, MessageSquare, Package,
  Loader2, RefreshCw, AlertTriangle, Star
} from 'lucide-react';

const MessManagement = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [todayMenu, setTodayMenu] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);

  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/hostel/list');
      if (res.data?.success) setHostels(res.data.data || []);
    } catch (err) { console.error('Error fetching hostels:', err); }
  }, [branchId]);

  const fetchDashboardData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = selectedHostel !== 'all' ? { hostelId: selectedHostel } : {};
      const today = new Date().toISOString().split('T')[0];

      const [menuRes, attRes, fbRes, lowRes] = await Promise.all([
        api.get('/hostel-mess/menu/today', { params }),
        api.get('/hostel-mess/attendance/stats', { params: { ...params, startDate: today, endDate: today } }),
        api.get('/hostel-mess/feedback/stats', { params: { ...params, startDate: today, endDate: today } }),
        api.get('/hostel-mess/inventory/low-stock', { params })
      ]);

      if (menuRes.data?.success) setTodayMenu(menuRes.data.data || []);
      if (attRes.data?.success) setAttendanceStats(attRes.data.data || null);
      if (fbRes.data?.success) setFeedbackStats(fbRes.data.data || null);
      if (lowRes.data?.success) setLowStockItems(lowRes.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [branchId, selectedHostel, toast]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);
  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const mealOrder = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const mealLabels = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', snacks: '🍪 Snacks', dinner: '🌙 Dinner' };

  const getTotalAttendance = () => {
    if (!attendanceStats) return { present: 0, absent: 0 };
    let present = 0, absent = 0;
    Object.values(attendanceStats).forEach(s => { present += s.present; absent += s.absent; });
    return { present, absent };
  };

  const totals = getTotalAttendance();

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-orange-600" /> Mess Management
            </h1>
            <p className="text-muted-foreground mt-1">Menu, attendance, feedback & inventory</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Hostels" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg"><CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Meals</p>
                <p className="text-2xl font-bold">{todayMenu.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg"><ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Today Present</p>
                <p className="text-2xl font-bold text-green-600">{totals.present}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg"><Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">
                  {feedbackStats?.avgRatings ? (Object.values(feedbackStats.avgRatings).reduce((a, b) => a + b, 0) / Object.values(feedbackStats.avgRatings).length || 0).toFixed(1) : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-3 rounded-lg ${lowStockItems.length > 0 ? 'bg-red-100 dark:bg-red-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <AlertTriangle className={`h-5 w-5 ${lowStockItems.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : ''}`}>{lowStockItems.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
        ) : (
          <>
            {/* Today's Menu Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UtensilsCrossed className="h-5 w-5" /> Today's Menu</CardTitle>
              </CardHeader>
              <CardContent>
                {todayMenu.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No menu configured for today</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mealOrder.map(mealType => {
                      const meal = todayMenu.find(m => m.meal_type === mealType);
                      if (!meal) return (
                        <Card key={mealType} className="border-dashed opacity-50">
                          <CardContent className="p-4 text-center">
                            <p className="text-lg font-medium">{mealLabels[mealType]}</p>
                            <p className="text-sm text-muted-foreground mt-2">Not configured</p>
                          </CardContent>
                        </Card>
                      );
                      return (
                        <Card key={mealType} className="border-l-4 border-l-orange-500">
                          <CardContent className="p-4">
                            <p className="text-lg font-medium">{mealLabels[mealType]}</p>
                            <p className="text-xs text-muted-foreground">{meal.meal_start_time} - {meal.meal_end_time}</p>
                            <div className="mt-3 space-y-1">
                              {(meal.menu_items || []).map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{item.name}</span>
                                  <span className="text-muted-foreground">{item.qty}</span>
                                </div>
                              ))}
                            </div>
                            {meal.special_item && (
                              <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">⭐ {meal.special_item}</Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" /> Low Stock Alerts ({lowStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lowStockItems.map(item => (
                      <Badge key={item.id} variant="destructive" className="text-sm py-1 px-3">
                        {item.item_name}: {item.current_stock} {item.unit} (min: {item.minimum_stock})
                      </Badge>
                    ))}
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

export default MessManagement;
