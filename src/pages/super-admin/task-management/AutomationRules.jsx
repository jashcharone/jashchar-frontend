/**
 * Task Automation Rules - JashFlow AI
 * Manage escalation rules, view automation status, and manually trigger jobs
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertTriangle, ArrowLeft, Bot, CheckCircle2, Clock, Loader2,
  Play, Plus, RefreshCw, Settings2, Shield, Trash2, Zap, Rocket
} from 'lucide-react';

export default function AutomationRules() {
  const navigate = useNavigate();
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(null);

  // Status
  const [automationStatus, setAutomationStatus] = useState(null);

  // Escalation rules
  const [rules, setRules] = useState([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger_type: 'overdue_days',
    trigger_value: 3,
    escalate_to_role: 'principal',
    priority_filter: null
  });

  // Templates
  const [templates, setTemplates] = useState([]);
  const [activatingTemplate, setActivatingTemplate] = useState(null);

  const basePath = user?.role === 'super_admin' ? 'super-admin' : 'super-admin';

  // ==========================================
  // DATA LOADING
  // ==========================================

  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get('/tasks/automation/status', {
        params: { organization_id: organizationId }
      });
      if (res.data.success) {
        setAutomationStatus(res.data.status);
      }
    } catch (err) {
      console.error('Failed to load automation status:', err);
    }
  }, [organizationId]);

  const loadRules = useCallback(async () => {
    try {
      const res = await api.get('/tasks/automation/escalation-rules', {
        params: { organization_id: organizationId }
      });
      if (res.data.success) {
        setRules(res.data.rules);
      }
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  }, [organizationId]);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await api.get('/tasks/automation/templates', {
        params: { organization_id: organizationId }
      });
      if (res.data.success) {
        setTemplates(res.data.templates);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }, [organizationId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadStatus(), loadRules(), loadTemplates()]);
      setLoading(false);
    };
    load();
  }, [loadStatus, loadRules, loadTemplates]);

  // ==========================================
  // ACTIONS
  // ==========================================

  const handleAddRule = async () => {
    if (!newRule.name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/tasks/automation/escalation-rules', {
        ...newRule,
        organization_id: organizationId
      });
      if (res.data.success) {
        setRules(prev => [res.data.rule, ...prev]);
        setShowAddRule(false);
        setNewRule({
          name: '', trigger_type: 'overdue_days', trigger_value: 3,
          escalate_to_role: 'principal', priority_filter: null
        });
      }
    } catch (err) {
      console.error('Failed to create rule:', err);
    }
    setSaving(false);
  };

  const handleToggleRule = async (ruleId, currentActive) => {
    try {
      await api.put(`/tasks/automation/escalation-rules/${ruleId}`, {
        is_active: !currentActive
      });
      setRules(prev => prev.map(r =>
        r.id === ruleId ? { ...r, is_active: !currentActive } : r
      ));
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Delete this escalation rule?')) return;
    try {
      await api.delete(`/tasks/automation/escalation-rules/${ruleId}`);
      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handleTriggerJob = async (jobName) => {
    setTriggering(jobName);
    try {
      await api.post('/tasks/automation/trigger', { job_name: jobName });
      await loadStatus();
    } catch (err) {
      console.error('Failed to trigger job:', err);
    }
    setTriggering(null);
  };

  // ==========================================
  // STATUS TAB
  // ==========================================

  const renderStatusTab = () => {
    if (!automationStatus) {
      return <div className="text-center py-8 text-muted-foreground">No automation data available</div>;
    }

    const statusIcon = (status) => {
      if (status === 'active') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      if (status === 'no_rules') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      return <Clock className="h-4 w-4 text-gray-400" />;
    };

    const statusBadge = (status) => {
      if (status === 'active') return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
      if (status === 'no_rules') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">No Rules</Badge>;
      return <Badge variant="secondary">Inactive</Badge>;
    };

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{automationStatus.stats?.total_active || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Active Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-red-600">{automationStatus.stats?.overdue || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Overdue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{automationStatus.stats?.due_tomorrow || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Due Tomorrow</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{automationStatus.stats?.escalation_rules || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Escalation Rules</div>
            </CardContent>
          </Card>
        </div>

        {/* Automation Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-500" />
              Automated Jobs
            </CardTitle>
            <CardDescription>These jobs run automatically on schedule. You can also trigger them manually.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(automationStatus.jobs || []).map((job, idx) => {
                const jobKey = ['reminders', 'daily_summary', 'overdue', 'escalation', 'auto_complete'][idx];
                return (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {statusIcon(job.status)}
                      <div>
                        <div className="font-medium text-sm">{job.name}</div>
                        <div className="text-xs text-muted-foreground">{job.schedule}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(job.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTriggerJob(jobKey)}
                        disabled={!!triggering}
                      >
                        {triggering === jobKey ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        <span className="ml-1 text-xs">Run Now</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ==========================================
  // ESCALATION RULES TAB
  // ==========================================

  const renderEscalationTab = () => (
    <div className="space-y-4">
      {/* Add Rule Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold">Escalation Rules</h3>
          <p className="text-xs text-muted-foreground">Define when and how overdue tasks get escalated</p>
        </div>
        <Button size="sm" onClick={() => setShowAddRule(!showAddRule)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Rule
        </Button>
      </div>

      {/* Add Rule Form */}
      {showAddRule && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Rule Name</Label>
                <Input
                  placeholder="e.g., Critical tasks → Principal"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Trigger Type</Label>
                <Select
                  value={newRule.trigger_type}
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, trigger_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overdue_days">Overdue by X days</SelectItem>
                    <SelectItem value="overdue_hours">Overdue by X hours</SelectItem>
                    <SelectItem value="no_progress">No progress for X days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">
                  Trigger Value ({newRule.trigger_type === 'overdue_hours' ? 'hours' : 'days'})
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={newRule.trigger_value}
                  onChange={(e) => setNewRule(prev => ({ ...prev, trigger_value: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label className="text-xs">Escalate To Role</Label>
                <Select
                  value={newRule.escalate_to_role}
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, escalate_to_role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="vice_principal">Vice Principal</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority Filter (Optional)</Label>
                <Select
                  value={newRule.priority_filter || 'all'}
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, priority_filter: v === 'all' ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical Only</SelectItem>
                    <SelectItem value="high">High & Above</SelectItem>
                    <SelectItem value="medium">Medium & Above</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAddRule(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddRule} disabled={saving || !newRule.name.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No escalation rules configured</p>
            <p className="text-xs mt-1">Default escalation behavior is used. Add custom rules for fine-grained control.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className={`h-5 w-5 ${rule.is_active ? 'text-purple-500' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium text-sm">{rule.name}</div>
                      <div className="text-xs text-muted-foreground">
                        When task is {rule.trigger_type === 'overdue_hours' ? `overdue by ${rule.trigger_value} hours` : `overdue by ${rule.trigger_value} days`}
                        {rule.priority_filter && ` (${rule.priority_filter} priority)`}
                        {' → '}Escalate to <span className="font-medium capitalize">{rule.escalate_to_role?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Default Behavior Info */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-blue-700">Default Escalation Behavior</div>
              <div className="text-xs text-blue-600 mt-1 space-y-1">
                <p>• Critical tasks overdue by 12+ hours → Escalated to <strong>Principal</strong></p>
                <p>• Standard tasks overdue by 3+ days → Escalated to <strong>Admin</strong></p>
                <p>Custom rules above will override these defaults when matched.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ==========================================
  // RENDER
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/${basePath}/task-management`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-purple-500" />
              Automation Rules
            </h1>
            <p className="text-sm text-muted-foreground">Configure automated task reminders, escalations, and daily summaries</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadStatus(); loadRules(); }}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Status & Jobs
          </TabsTrigger>
          <TabsTrigger value="escalation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Escalation Rules
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-4">
          {renderStatusTab()}
        </TabsContent>

        <TabsContent value="escalation" className="mt-4">
          {renderEscalationTab()}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pre-built automation templates for common school operations. Click "Activate" to instantly create tasks from a template.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(tpl => (
                <Card key={tpl.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{tpl.icon}</span>
                        <div>
                          <h3 className="font-semibold text-sm">{tpl.name}</h3>
                          <p className="text-xs text-muted-foreground">{tpl.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {tpl.tasks_generated.map((task, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" style={{ borderColor: tpl.color, color: tpl.color }}>{tpl.default_priority}</Badge>
                        <span>{tpl.default_deadline_days}d deadline</span>
                      </div>
                      <Button
                        size="sm"
                        disabled={activatingTemplate === tpl.id}
                        onClick={async () => {
                          setActivatingTemplate(tpl.id);
                          try {
                            const res = await api.post('/tasks/automation/templates/activate', {
                              template_id: tpl.id,
                              organization_id: organizationId,
                              branch_id: selectedBranch?.id
                            });
                            if (res.data.success) {
                              alert(`✅ ${res.data.message}`);
                            }
                          } catch (err) {
                            console.error('Failed to activate template:', err);
                            alert('Failed to activate template');
                          }
                          setActivatingTemplate(null);
                        }}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                      >
                        {activatingTemplate === tpl.id ? (
                          <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Creating...</>
                        ) : (
                          <><Rocket className="h-3 w-3 mr-1" /> Activate</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
