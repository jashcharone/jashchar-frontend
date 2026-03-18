import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Award, AlertTriangle, TrendingUp, TrendingDown, Star, ShieldAlert,
  Trophy, ThumbsUp, ThumbsDown, BarChart3, Calendar,
} from 'lucide-react';

// ─── MINI COMPONENTS ──────────
const StatBox = ({ label, value, icon: Icon, color }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
        <Icon className={`h-5 w-5 text-${color}-600`} />
      </div>
      <div>
        <p className={`text-xl font-bold text-${color}-700 dark:text-${color}-400`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

// ===================== MAIN COMPONENT =====================
export default function StudentProfileBehaviorTab({ studentId }) {
  const { currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();

  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);

  const fetchIncidents = useCallback(async () => {
    if (!studentId || !selectedBranch?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_behaviour_incidents')
        .select('*, incident:behaviour_incidents(title, point, is_negative, description)')
        .eq('student_id', studentId)
        .eq('branch_id', selectedBranch.id)
        .order('assigned_date', { ascending: false });

      if (!error && data) setIncidents(data);
    } catch (e) {
      console.error('Error fetching behavior incidents:', e);
    }
    setLoading(false);
  }, [studentId, selectedBranch?.id]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  // ─── Computed Stats ────────────
  const stats = useMemo(() => {
    const positive = incidents.filter(i => !i.incident?.is_negative);
    const negative = incidents.filter(i => i.incident?.is_negative);
    const totalPoints = incidents.reduce((sum, i) => {
      const pts = i.incident?.point || 0;
      return sum + (i.incident?.is_negative ? -pts : pts);
    }, 0);
    const positivePoints = positive.reduce((sum, i) => sum + (i.incident?.point || 0), 0);
    const negativePoints = negative.reduce((sum, i) => sum + (i.incident?.point || 0), 0);

    return {
      total: incidents.length,
      positive: positive.length,
      negative: negative.length,
      totalPoints,
      positivePoints,
      negativePoints,
      trend: positive.length >= negative.length ? 'improving' : 'declining',
    };
  }, [incidents]);

  // ─── Group by month ────────────
  const monthlyGroups = useMemo(() => {
    const groups = {};
    incidents.forEach(i => {
      const month = i.assigned_date ? i.assigned_date.substring(0, 7) : 'Unknown';
      if (!groups[month]) groups[month] = [];
      groups[month].push(i);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [incidents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Total Incidents" value={stats.total} icon={BarChart3} color="blue" />
        <StatBox label="Positive" value={`${stats.positive} (+${stats.positivePoints} pts)`} icon={ThumbsUp} color="green" />
        <StatBox label="Negative" value={`${stats.negative} (-${stats.negativePoints} pts)`} icon={ThumbsDown} color="red" />
        <StatBox
          label="Net Score"
          value={stats.totalPoints}
          icon={stats.trend === 'improving' ? TrendingUp : TrendingDown}
          color={stats.totalPoints >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* Behavior Trend Indicator */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          {stats.trend === 'improving' ? (
            <>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Improving Behavior</p>
                <p className="text-xs text-muted-foreground">Student has more positive records than negative</p>
              </div>
            </>
          ) : stats.total === 0 ? (
            <>
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Star className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium">No Behavior Records</p>
                <p className="text-xs text-muted-foreground">No incidents assigned yet</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-orange-700 dark:text-orange-400">Needs Attention</p>
                <p className="text-xs text-muted-foreground">Student has more negative records — consider counseling</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Score Bar */}
      {stats.total > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Positive vs Negative Ratio</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.positive / stats.total) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.negative / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-green-600">{stats.positive} Positive ({stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0}%)</span>
              <span className="text-red-600">{stats.negative} Negative ({stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0}%)</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incident Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Incident Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No behavior incidents recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyGroups.map(([month, items]) => (
                <div key={month}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    {month !== 'Unknown' ? new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Unknown Date'}
                  </p>
                  <div className="space-y-2 pl-3 border-l-2 border-muted">
                    {items.map((item) => {
                      const isNeg = item.incident?.is_negative;
                      return (
                        <div key={item.id} className="relative flex items-start gap-3 pl-4">
                          <div className={`absolute -left-[13px] top-1 w-5 h-5 rounded-full flex items-center justify-center ${isNeg ? 'bg-red-100' : 'bg-green-100'}`}>
                            {isNeg ? (
                              <ShieldAlert className="h-3 w-3 text-red-600" />
                            ) : (
                              <Trophy className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium">{item.incident?.title || 'Unknown Incident'}</p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${isNeg ? 'border-red-300 text-red-600' : 'border-green-300 text-green-600'}`}
                              >
                                {isNeg ? '-' : '+'}{item.incident?.point || 0} pts
                              </Badge>
                            </div>
                            {item.incident?.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{item.incident.description}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {item.assigned_date ? formatDate(item.assigned_date) : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
