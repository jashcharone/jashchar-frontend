import React, { useState, useEffect, useCallback } from 'react';
import { formatDateWithMonthName } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Loader2, RefreshCw } from 'lucide-react';

const MEAL_LABELS = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', snacks: '🍪 Snacks', dinner: '🌙 Dinner' };
const MEAL_ORDER = ['breakfast', 'lunch', 'snacks', 'dinner'];

const TodayMenu = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [todayMenu, setTodayMenu] = useState([]);

  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/hostel/list');
      if (res.data?.success) setHostels(res.data.data || []);
    } catch (err) { console.error('Error:', err); }
  }, [branchId]);

  const fetchTodayMenu = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = selectedHostel !== 'all' ? { hostelId: selectedHostel } : {};
      const res = await api.get('/hostel-mess/menu/today', { params });
      if (res.data?.success) setTodayMenu(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [branchId, selectedHostel, toast]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);
  useEffect(() => { fetchTodayMenu(); }, [fetchTodayMenu]);

  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

  const getCurrentMeal = () => {
    const hour = new Date().getHours();
    if (hour < 10) return 'breakfast';
    if (hour < 14) return 'lunch';
    if (hour < 17) return 'snacks';
    return 'dinner';
  };
  const currentMeal = getCurrentMeal();

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-orange-600" /> Today's Menu
            </h1>
            <p className="text-muted-foreground mt-1">{dayName} — {formatDateWithMonthName(new Date())}</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Hostels" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchTodayMenu} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
        ) : todayMenu.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No menu configured for today</p>
              <p className="text-sm text-muted-foreground mt-1">Go to Weekly Menu to set up the menu</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MEAL_ORDER.map(mealType => {
              const meal = todayMenu.find(m => m.meal_type === mealType);
              const isCurrent = mealType === currentMeal;

              return (
                <Card key={mealType} className={`transition-all ${isCurrent ? 'ring-2 ring-orange-500 shadow-lg' : ''} ${!meal ? 'opacity-50 border-dashed' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">{MEAL_LABELS[mealType]}</h2>
                      {isCurrent && <Badge className="bg-orange-500 text-white animate-pulse">NOW SERVING</Badge>}
                    </div>
                    {meal ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-3">⏰ {meal.meal_start_time} - {meal.meal_end_time}</p>
                        <div className="space-y-2">
                          {(meal.menu_items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1 border-b last:border-0">
                              <span className="font-medium">{item.name}</span>
                              {item.qty && <span className="text-sm text-muted-foreground">{item.qty}</span>}
                            </div>
                          ))}
                        </div>
                        {meal.special_item && (
                          <div className="mt-4 p-2 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm font-medium text-amber-800">⭐ Special: {meal.special_item}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">Not configured</p>
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

export default TodayMenu;
