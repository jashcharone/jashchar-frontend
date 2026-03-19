/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * JASHFLOW AI - REPORTS & ANALYTICS PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Overview dashboard with key metrics
 * - Staff performance leaderboard
 * - Category-wise breakdown
 * - Task creation/completion trend chart
 * - Overdue analysis
 * - SLA compliance
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/utils/dateUtils';
import {
  BarChart3, TrendingUp, Users, CheckCircle2, Clock,
  AlertTriangle, Target, Award, ArrowUp, ArrowDown,
  RefreshCw, Loader2, PieChart, Calendar, Shield,
  Flame, Zap
} from 'lucide-react';

export default function TaskReports() {
  const { organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [categoryStats, setCategoryStats] = useState(null);
  const [trend, setTrend] = useState(null);
  const [overdueData, setOverdueData] = useState(null);
  const [slaData, setSlaData] = useState(null);

  const branchId = selectedBranch?.id;

  useEffect(() => {
    loadOverview();
    loadPerformance();
    loadCategoryStats();
    loadTrend();
    loadOverdue();
    loadSla();
  }, [branchId]);

  const loadOverview = async () => {
    try {
      const res = await api.get('/tasks/reports/overview', { params: { organization_id: organizationId, branch_id: branchId } });
      if (res.data?.success) setOverview(res.data.overview);
    } catch (e) { console.error('Overview error:', e); }
  };

  const loadPerformance = async () => {
    try {
      const res = await api.get('/tasks/reports/performance', { params: { organization_id: organizationId, branch_id: branchId } });
      if (res.data?.success) setPerformance(res.data);
    } catch (e) { console.error('Performance error:', e); }
  };

  const loadCategoryStats = async () => {
    try {
      const res = await api.get('/tasks/reports/category-stats', { params: { organization_id: organizationId, branch_id: branchId } });
      if (res.data?.success) setCategoryStats(res.data.category_stats);
    } catch (e) { console.error('Category error:', e); }
  };

  const loadTrend = async () => {
    try {
      const res = await api.get('/tasks/reports/trend', { params: { organization_id: organizationId, branch_id: branchId, days: 30 } });
      if (res.data?.success) setTrend(res.data);
    } catch (e) { console.error('Trend error:', e); }
    finally { setLoading(false); }
  };

  const loadOverdue = async () => {
    try {
      const res = await api.get('/tasks/reports/overdue-analysis', { params: { organization_id: organizationId, branch_id: branchId } });
      if (res.data?.success) setOverdueData(res.data);
    } catch (e) { console.error('Overdue error:', e); }
  };

  const loadSla = async () => {
    try {
      const res = await api.get('/tasks/reports/sla-compliance', { params: { organization_id: organizationId, branch_id: branchId } });
      if (res.data?.success) setSlaData(res.data);
    } catch (e) { console.error('SLA error:', e); }
  };

  const refreshAll = () => {
    setLoading(true);
    loadOverview();
    loadPerformance();
    loadCategoryStats();
    loadTrend();
    loadOverdue();
    loadSla();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'performance', label: 'Staff Performance', icon: Award },
    { id: 'categories', label: 'Categories', icon: PieChart },
    { id: 'overdue', label: 'Overdue Analysis', icon: AlertTriangle },
    { id: 'sla', label: 'SLA Compliance', icon: Shield },
  ];

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-muted-foreground">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-500" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Task performance insights powered by JashFlow AI</p>
        </div>
        <button onClick={refreshAll} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${activeTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard icon={Target} label="Total Tasks" value={overview.total} color="blue" />
            <MetricCard icon={CheckCircle2} label="Completed" value={overview.completed} color="green" subtitle={`${overview.completion_rate}% rate`} />
            <MetricCard icon={Clock} label="In Progress" value={overview.in_progress} color="yellow" />
            <MetricCard icon={AlertTriangle} label="Overdue" value={overview.overdue} color={overview.overdue > 0 ? 'red' : 'green'} />
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard icon={Zap} label="On-Time Rate" value={`${overview.on_time_rate}%`} color="purple" />
            <MetricCard icon={Clock} label="Avg Completion" value={`${overview.avg_completion_hours}h`} color="blue" />
            <MetricCard icon={TrendingUp} label="Created (30d)" value={overview.recent_30_days?.created || 0} color="blue" />
            <MetricCard icon={CheckCircle2} label="Completed (30d)" value={overview.recent_30_days?.completed || 0} color="green" />
          </div>

          {/* Status Distribution Bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Task Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Completed', value: overview.completed, color: 'bg-green-500', pct: overview.total > 0 ? (overview.completed / overview.total * 100) : 0 },
                  { label: 'In Progress', value: overview.in_progress, color: 'bg-blue-500', pct: overview.total > 0 ? (overview.in_progress / overview.total * 100) : 0 },
                  { label: 'Pending', value: overview.pending, color: 'bg-yellow-500', pct: overview.total > 0 ? (overview.pending / overview.total * 100) : 0 },
                  { label: 'Overdue', value: overview.overdue, color: 'bg-red-500', pct: overview.total > 0 ? (overview.overdue / overview.total * 100) : 0 },
                  { label: 'On Hold', value: overview.on_hold, color: 'bg-gray-400', pct: overview.total > 0 ? (overview.on_hold / overview.total * 100) : 0 },
                ].filter(s => s.value > 0).map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-sm w-24 text-muted-foreground">{s.label}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all flex items-center justify-end pr-2`}
                        style={{ width: `${Math.max(s.pct, 5)}%` }}>
                        <span className="text-xs text-white font-medium">{s.value}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{Math.round(s.pct)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trend Mini Chart */}
          {trend && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Task Trend (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-[2px] h-32">
                  {trend.trend.map((day, i) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-[1px] group relative">
                      <div className="w-full bg-green-500/80 rounded-t" style={{ height: `${Math.max(2, (day.completed / Math.max(1, ...trend.trend.map(d => Math.max(d.created, d.completed)))) * 100)}%` }} />
                      <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${Math.max(2, (day.created / Math.max(1, ...trend.trend.map(d => Math.max(d.created, d.completed)))) * 100)}%` }} />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                        <p className="font-medium">{formatDate(day.date)}</p>
                        <p className="text-blue-500">Created: {day.created}</p>
                        <p className="text-green-500">Completed: {day.completed}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded" /> Created ({trend.totals?.created})</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Completed ({trend.totals?.completed})</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ==================== PERFORMANCE TAB ==================== */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          {/* Top Performer */}
          {performance?.top_performer && (
            <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Performer</p>
                  <p className="text-lg font-bold">{performance.top_performer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {performance.top_performer.role} • Score: {performance.top_performer.score}/100 • 
                    {performance.top_performer.completed} tasks completed ({performance.top_performer.on_time_rate}% on time)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Staff Performance Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pl-2">#</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2 text-center">Total</th>
                      <th className="pb-2 text-center">Completed</th>
                      <th className="pb-2 text-center">On-Time</th>
                      <th className="pb-2 text-center">Overdue</th>
                      <th className="pb-2 text-center">Avg Hours</th>
                      <th className="pb-2 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(performance?.performance || []).map((s, i) => (
                      <tr key={s.user_id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 pl-2">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="py-2 font-medium">{s.name}</td>
                        <td className="py-2 text-muted-foreground">{s.role}</td>
                        <td className="py-2 text-center">{s.total_assigned}</td>
                        <td className="py-2 text-center text-green-600">{s.completed}</td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${s.on_time_rate >= 80 ? 'bg-green-500/10 text-green-600' : s.on_time_rate >= 50 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}`}>
                            {s.on_time_rate}%
                          </span>
                        </td>
                        <td className="py-2 text-center">
                          {s.overdue > 0 ? <span className="text-red-600 font-medium">{s.overdue}</span> : <span className="text-green-600">0</span>}
                        </td>
                        <td className="py-2 text-center text-muted-foreground">{s.avg_hours}h</td>
                        <td className="py-2 text-center">
                          <span className={`font-bold ${s.score >= 70 ? 'text-green-600' : s.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {s.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!performance?.performance || performance.performance.length === 0) && (
                      <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No performance data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== CATEGORIES TAB ==================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(categoryStats || []).map(cat => (
              <Card key={cat.id || 'uncategorized'} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#94a3b8' }} />
                      {cat.name}
                    </h3>
                    <span className="text-2xl font-bold">{cat.total}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="text-green-600 font-medium">{cat.completed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="text-yellow-600 font-medium">{cat.pending}</span>
                    </div>
                    {cat.overdue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Overdue</span>
                        <span className="text-red-600 font-medium">{cat.overdue}</span>
                      </div>
                    )}
                    {/* Progress bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${cat.total > 0 ? (cat.completed / cat.total * 100) : 0}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {cat.total > 0 ? Math.round(cat.completed / cat.total * 100) : 0}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!categoryStats || categoryStats.length === 0) && (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No category data available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== OVERDUE TAB ==================== */}
      {activeTab === 'overdue' && (
        <div className="space-y-4">
          {/* Severity cards */}
          {overdueData && (
            <div className="grid grid-cols-3 gap-4">
              <MetricCard icon={Flame} label="Critical (7+ days)" value={overdueData.by_severity?.critical || 0} color="red" />
              <MetricCard icon={AlertTriangle} label="High (3-7 days)" value={overdueData.by_severity?.high || 0} color="yellow" />
              <MetricCard icon={Clock} label="Medium (1-3 days)" value={overdueData.by_severity?.medium || 0} color="blue" />
            </div>
          )}

          {/* Summary */}
          {overdueData?.total_overdue > 0 && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-sm">
                  <strong>{overdueData.total_overdue} tasks</strong> are overdue with an average delay of <strong>{overdueData.avg_overdue_days} days</strong>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Overdue task list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Overdue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(overdueData?.overdue_tasks || []).map(task => (
                  <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    task.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                    task.severity === 'high' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-blue-500/30 bg-blue-500/5'
                  }`}>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Due: {formatDate(task.due_date)}</span>
                        <span className="font-medium text-red-600">{task.overdue_days} days overdue</span>
                        {task.category && <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: task.category_color + '20', color: task.category_color }}>{task.category}</span>}
                        {task.assignees?.length > 0 && <span>→ {task.assignees.join(', ')}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      task.severity === 'critical' ? 'bg-red-500 text-white' :
                      task.severity === 'high' ? 'bg-yellow-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {task.severity}
                    </span>
                  </div>
                ))}
                {(!overdueData?.overdue_tasks || overdueData.overdue_tasks.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-500" />
                    <p className="text-green-600 font-medium">No overdue tasks! Great work!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== SLA TAB ==================== */}
      {activeTab === 'sla' && (
        <div className="space-y-4">
          {/* Overall SLA */}
          {slaData?.overall && (
            <Card className={`border-2 ${slaData.overall.compliance_rate >= 80 ? 'border-green-500/30 bg-green-500/5' : slaData.overall.compliance_rate >= 50 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <CardContent className="p-6 flex items-center gap-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${slaData.overall.compliance_rate >= 80 ? 'bg-green-500 text-white' : slaData.overall.compliance_rate >= 50 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}`}>
                  {slaData.overall.compliance_rate}%
                </div>
                <div>
                  <h3 className="text-lg font-bold">Overall SLA Compliance</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {slaData.overall.met} of {slaData.overall.total} tasks completed within SLA time
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-Priority SLA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(slaData?.sla_compliance || []).map(sla => (
              <Card key={sla.priority}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sla.color || '#94a3b8' }} />
                      {sla.priority}
                    </h3>
                    <span className="text-xs text-muted-foreground">SLA: {sla.sla_hours}h</span>
                  </div>
                  <div className="text-center mb-3">
                    <span className={`text-3xl font-bold ${sla.compliance_rate >= 80 ? 'text-green-600' : sla.compliance_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {sla.compliance_rate}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${sla.compliance_rate >= 80 ? 'bg-green-500' : sla.compliance_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${sla.compliance_rate}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-green-600">{sla.met} met</span>
                    <span className="text-red-600">{sla.breached} breached</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!slaData?.sla_compliance || slaData.sla_compliance.length === 0) && (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No SLA data available. Complete tasks with priorities set to see SLA metrics.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function MetricCard({ icon: Icon, label, value, color, subtitle }) {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-600/5 text-blue-600',
    green: 'from-green-500/10 to-green-600/5 text-green-600',
    yellow: 'from-yellow-500/10 to-yellow-600/5 text-yellow-600',
    red: 'from-red-500/10 to-red-600/5 text-red-600',
    purple: 'from-purple-500/10 to-purple-600/5 text-purple-600',
  };

  return (
    <div className={`rounded-lg bg-gradient-to-br ${colorMap[color] || colorMap.blue} p-4`}>
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5 opacity-70" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs mt-1 opacity-70">{label}</p>
      {subtitle && <p className="text-xs mt-0.5 opacity-50">{subtitle}</p>}
    </div>
  );
}
