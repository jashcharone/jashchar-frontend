import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MessageSquare, Star, Loader2, RefreshCw, TrendingUp, Tag
} from 'lucide-react';

const MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'];
const MEAL_LABELS = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', snacks: '🍪 Snacks', dinner: '🌙 Dinner' };

const MessFeedback = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [mealFilter, setMealFilter] = useState('all');
  const [feedbackList, setFeedbackList] = useState([]);
  const [stats, setStats] = useState(null);

  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/hostel/list');
      if (res.data?.success) setHostels(res.data.data || []);
    } catch (err) { console.error('Error:', err); }
  }, [branchId]);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = { startDate: dateFrom, endDate: dateTo };
      if (selectedHostel !== 'all') params.hostelId = selectedHostel;
      if (mealFilter !== 'all') params.mealType = mealFilter;

      const [fbRes, statsRes] = await Promise.all([
        api.get('/hostel-mess/feedback', { params }),
        api.get('/hostel-mess/feedback/stats', { params: { startDate: dateFrom, endDate: dateTo, ...(selectedHostel !== 'all' && { hostelId: selectedHostel }) } })
      ]);

      if (fbRes.data?.success) setFeedbackList(fbRes.data.data || []);
      if (statsRes.data?.success) setStats(statsRes.data.data || null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [branchId, dateFrom, dateTo, selectedHostel, mealFilter, toast]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 inline ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  const ratingColor = (r) => r >= 4 ? 'text-green-600' : r >= 3 ? 'text-yellow-600' : 'text-red-600';

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-purple-600" /> Mess Feedback
            </h1>
            <p className="text-muted-foreground mt-1">Student feedback & analytics</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm font-medium">Hostel</label>
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">From</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[150px]" />
          </div>
          <div>
            <label className="text-sm font-medium">To</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[150px]" />
          </div>
          <div>
            <label className="text-sm font-medium">Meal</label>
            <Select value={mealFilter} onValueChange={setMealFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meals</SelectItem>
                {MEAL_TYPES.map(mt => <SelectItem key={mt} value={mt}>{MEAL_LABELS[mt]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
        ) : (
          <>
            {/* Analytics Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Average Rating per Meal */}
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Avg Rating per Meal</CardTitle></CardHeader>
                  <CardContent>
                    {Object.keys(stats.avgRatings || {}).length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No ratings yet</p>
                    ) : (
                      <div className="space-y-3">
                        {MEAL_TYPES.map(mt => {
                          const avg = stats.avgRatings?.[mt];
                          if (!avg) return null;
                          return (
                            <div key={mt} className="flex items-center justify-between">
                              <span className="font-medium">{MEAL_LABELS[mt]}</span>
                              <div className="flex items-center gap-2">
                                {renderStars(Math.round(avg))}
                                <span className={`font-bold ${ratingColor(avg)}`}>{avg}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-3">Total feedback: {stats.totalFeedback || 0}</p>
                  </CardContent>
                </Card>

                {/* Top Tags */}
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Tag className="h-5 w-5" /> Top Feedback Tags</CardTitle></CardHeader>
                  <CardContent>
                    {Object.keys(stats.tagCounts || {}).length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No tags yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.tagCounts || {})
                          .sort(([, a], [, b]) => b - a)
                          .map(([tag, count]) => (
                            <Badge key={tag} variant="outline" className="text-sm py-1 px-3">
                              {tag.replace(/_/g, ' ')} ({count})
                            </Badge>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Feedback List */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback Records ({feedbackList.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {feedbackList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No feedback found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Meal</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbackList.map(fb => (
                        <TableRow key={fb.id}>
                          <TableCell>{formatDate(fb.meal_date)}</TableCell>
                          <TableCell className="font-medium">
                            {fb.student ? `${fb.student.first_name || ''} ${fb.student.last_name || ''}`.trim() : '-'}
                          </TableCell>
                          <TableCell>{MEAL_LABELS[fb.meal_type] || fb.meal_type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {renderStars(fb.rating)}
                              <span className={`ml-1 font-bold ${ratingColor(fb.rating)}`}>{fb.rating}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(fb.tags || []).map(t => <Badge key={t} variant="secondary" className="text-xs">{t.replace(/_/g, ' ')}</Badge>)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{fb.feedback_text || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MessFeedback;
