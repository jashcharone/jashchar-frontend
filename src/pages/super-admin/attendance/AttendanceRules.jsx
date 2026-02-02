// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - ATTENDANCE RULES & AUTOMATION
// Configure attendance rules, late marking, half-day rules, notifications, etc.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Clock,
    Timer,
    Bell,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Save,
    Trash2,
    Edit,
    RefreshCw,
    Loader2,
    Calendar,
    Users,
    GraduationCap,
    Briefcase,
    MessageSquare,
    Mail,
    Smartphone,
    Zap,
    Shield,
    Target,
    ArrowRight,
    Play,
    Pause,
    X
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// RULE TYPE ICONS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const ruleTypeConfig = {
    late_marking: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Late Marking' },
    half_day: { icon: Timer, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Half Day' },
    absent_marking: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100', label: 'Absent Marking' },
    early_leave: { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Early Leave' },
    overtime: { icon: Timer, color: 'text-green-500', bg: 'bg-green-100', label: 'Overtime' },
    notification: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Notification' },
    auto_checkout: { icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-100', label: 'Auto Checkout' },
    grace_period: { icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-100', label: 'Grace Period' },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// RULE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const RuleCard = ({ rule, onEdit, onDelete, onToggle }) => {
    const config = ruleTypeConfig[rule.rule_type] || ruleTypeConfig.late_marking;
    const Icon = config.icon;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.01 }}
        >
            <Card className={`relative overflow-hidden ${!rule.is_active ? 'opacity-60' : ''}`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${rule.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                
                <CardContent className="pt-6 pl-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${config.bg}`}>
                            <Icon className={`h-6 w-6 ${config.color}`} />
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{rule.rule_name}</h3>
                                <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-xs">
                                    {rule.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                            
                            {/* Rule conditions preview */}
                            <div className="flex flex-wrap gap-2 text-xs">
                                {rule.applies_to && (
                                    <Badge variant="outline" className="capitalize">
                                        {rule.applies_to === 'student' && <GraduationCap className="w-3 h-3 mr-1" />}
                                        {rule.applies_to === 'staff' && <Briefcase className="w-3 h-3 mr-1" />}
                                        {rule.applies_to === 'both' && <Users className="w-3 h-3 mr-1" />}
                                        {rule.applies_to}
                                    </Badge>
                                )}
                                {rule.conditions?.time_threshold && (
                                    <Badge variant="outline">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {rule.conditions.time_threshold} min
                                    </Badge>
                                )}
                                {rule.conditions?.start_time && (
                                    <Badge variant="outline">
                                        After {rule.conditions.start_time}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Switch 
                                checked={rule.is_active}
                                onCheckedChange={() => onToggle(rule)}
                            />
                        </div>
                    </div>
                </CardContent>
                
                <CardFooter className="bg-muted/30 border-t justify-between">
                    <span className="text-xs text-muted-foreground">
                        Priority: {rule.priority || 'Normal'}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(rule)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ADD/EDIT RULE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const RuleDialog = ({ open, onClose, rule, branchId, organizationId, sessionId, onSaved }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        rule_name: '',
        rule_type: 'late_marking',
        description: '',
        applies_to: 'both',
        priority: 1,
        conditions: {
            time_threshold: 15,
            start_time: '09:00',
            end_time: '17:00',
            grace_minutes: 5,
            mark_as: 'late',
        },
        actions: {
            send_sms: false,
            send_email: false,
            send_whatsapp: false,
            notify_parent: false,
            auto_deduct: false,
            deduction_type: 'none',
            deduction_value: 0,
        },
        is_active: true,
    });
    
    useEffect(() => {
        if (rule) {
            setFormData({
                rule_name: rule.rule_name || '',
                rule_type: rule.rule_type || 'late_marking',
                description: rule.description || '',
                applies_to: rule.applies_to || 'both',
                priority: rule.priority || 1,
                conditions: rule.conditions || {
                    time_threshold: 15,
                    start_time: '09:00',
                    end_time: '17:00',
                    grace_minutes: 5,
                    mark_as: 'late',
                },
                actions: rule.actions || {
                    send_sms: false,
                    send_email: false,
                    send_whatsapp: false,
                    notify_parent: false,
                    auto_deduct: false,
                    deduction_type: 'none',
                    deduction_value: 0,
                },
                is_active: rule.is_active ?? true,
            });
        } else {
            setFormData({
                rule_name: '',
                rule_type: 'late_marking',
                description: '',
                applies_to: 'both',
                priority: 1,
                conditions: {
                    time_threshold: 15,
                    start_time: '09:00',
                    end_time: '17:00',
                    grace_minutes: 5,
                    mark_as: 'late',
                },
                actions: {
                    send_sms: false,
                    send_email: false,
                    send_whatsapp: false,
                    notify_parent: false,
                    auto_deduct: false,
                    deduction_type: 'none',
                    deduction_value: 0,
                },
                is_active: true,
            });
        }
    }, [rule, open]);
    
    const handleSave = async () => {
        if (!formData.rule_name) {
            toast({ variant: 'destructive', title: 'Rule name is required' });
            return;
        }
        
        setLoading(true);
        
        const payload = {
            ...formData,
            branch_id: branchId,
            organization_id: organizationId,
            session_id: sessionId,
        };
        
        try {
            if (rule?.id) {
                const { error } = await supabase
                    .from('attendance_rules')
                    .update(payload)
                    .eq('id', rule.id);
                
                if (error) throw error;
                toast({ title: 'Rule updated successfully' });
            } else {
                const { error } = await supabase
                    .from('attendance_rules')
                    .insert(payload);
                
                if (error) throw error;
                toast({ title: 'Rule created successfully' });
            }
            
            onSaved();
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            toast({ variant: 'destructive', title: 'Error saving rule', description: error.message });
        }
        
        setLoading(false);
    };
    
    const updateConditions = (key, value) => {
        setFormData(prev => ({
            ...prev,
            conditions: { ...prev.conditions, [key]: value },
        }));
    };
    
    const updateActions = (key, value) => {
        setFormData(prev => ({
            ...prev,
            actions: { ...prev.actions, [key]: value },
        }));
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        {rule ? 'Edit Rule' : 'Create New Rule'}
                    </DialogTitle>
                    <DialogDescription>
                        Configure attendance automation rules
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Rule Name *</Label>
                                <Input
                                    value={formData.rule_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                                    placeholder="e.g., Late Marking After 9 AM"
                                />
                            </div>
                            <div>
                                <Label>Rule Type</Label>
                                <Select 
                                    value={formData.rule_type} 
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, rule_type: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ruleTypeConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center gap-2">
                                                    <config.icon className={`w-4 h-4 ${config.color}`} />
                                                    {config.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Applies To</Label>
                                <Select 
                                    value={formData.applies_to} 
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, applies_to: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="both">Both Students & Staff</SelectItem>
                                        <SelectItem value="student">Students Only</SelectItem>
                                        <SelectItem value="staff">Staff Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe what this rule does..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Conditions */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Conditions
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            {(formData.rule_type === 'late_marking' || formData.rule_type === 'half_day') && (
                                <>
                                    <div>
                                        <Label>Time Threshold (minutes)</Label>
                                        <Input
                                            type="number"
                                            value={formData.conditions.time_threshold}
                                            onChange={(e) => updateConditions('time_threshold', parseInt(e.target.value))}
                                            placeholder="15"
                                        />
                                    </div>
                                    <div>
                                        <Label>Grace Period (minutes)</Label>
                                        <Input
                                            type="number"
                                            value={formData.conditions.grace_minutes}
                                            onChange={(e) => updateConditions('grace_minutes', parseInt(e.target.value))}
                                            placeholder="5"
                                        />
                                    </div>
                                </>
                            )}
                            <div>
                                <Label>Start Time</Label>
                                <Input
                                    type="time"
                                    value={formData.conditions.start_time}
                                    onChange={(e) => updateConditions('start_time', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>End Time</Label>
                                <Input
                                    type="time"
                                    value={formData.conditions.end_time}
                                    onChange={(e) => updateConditions('end_time', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Mark As</Label>
                                <Select 
                                    value={formData.conditions.mark_as} 
                                    onValueChange={(v) => updateConditions('mark_as', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="late">Late</SelectItem>
                                        <SelectItem value="half_day">Half Day</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Priority</Label>
                                <Input
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                    placeholder="1"
                                    min="1"
                                    max="10"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Actions */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Automated Actions
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                                    <Label className="cursor-pointer">Send SMS Alert</Label>
                                </div>
                                <Switch 
                                    checked={formData.actions.send_sms}
                                    onCheckedChange={(v) => updateActions('send_sms', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <Label className="cursor-pointer">Send Email</Label>
                                </div>
                                <Switch 
                                    checked={formData.actions.send_email}
                                    onCheckedChange={(v) => updateActions('send_email', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                    <Label className="cursor-pointer">Send WhatsApp</Label>
                                </div>
                                <Switch 
                                    checked={formData.actions.send_whatsapp}
                                    onCheckedChange={(v) => updateActions('send_whatsapp', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <Label className="cursor-pointer">Notify Parent</Label>
                                </div>
                                <Switch 
                                    checked={formData.actions.notify_parent}
                                    onCheckedChange={(v) => updateActions('notify_parent', v)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={formData.is_active}
                            onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                        />
                        <Label>Rule is active</Label>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        {rule ? 'Update Rule' : 'Create Rule'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN ATTENDANCE RULES COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const AttendanceRules = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd, canEdit, canDelete } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState([]);
    const [filterType, setFilterType] = useState('all');
    
    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    
    // Permissions
    const hasViewPermission = canView('attendance.rules') || canView('attendance');
    const hasAddPermission = canAdd('attendance.rules') || canAdd('attendance');
    const hasEditPermission = canEdit('attendance.rules') || canEdit('attendance');
    const hasDeletePermission = canDelete('attendance.rules') || canDelete('attendance');
    
    // Fetch rules
    useEffect(() => {
        if (branchId) {
            fetchRules();
        }
    }, [branchId, currentSessionId]);
    
    const fetchRules = async () => {
        setLoading(true);
        
        const { data, error } = await supabase
            .from('attendance_rules')
            .select('*')
            .eq('branch_id', branchId)
            .order('priority', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching rules', description: error.message });
        } else {
            setRules(data || []);
        }
        
        setLoading(false);
    };
    
    // Filter rules
    const filteredRules = rules.filter(rule => {
        if (filterType === 'all') return true;
        return rule.rule_type === filterType;
    });
    
    // Stats
    const stats = {
        total: rules.length,
        active: rules.filter(r => r.is_active).length,
        inactive: rules.filter(r => !r.is_active).length,
    };
    
    // Handlers
    const handleAddRule = () => {
        setEditingRule(null);
        setDialogOpen(true);
    };
    
    const handleEditRule = (rule) => {
        setEditingRule(rule);
        setDialogOpen(true);
    };
    
    const handleToggleRule = async (rule) => {
        const { error } = await supabase
            .from('attendance_rules')
            .update({ is_active: !rule.is_active })
            .eq('id', rule.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: `Rule ${rule.is_active ? 'deactivated' : 'activated'}` });
            fetchRules();
        }
    };
    
    const handleDeleteRule = async () => {
        if (!deleteConfirm) return;
        
        const { error } = await supabase
            .from('attendance_rules')
            .delete()
            .eq('id', deleteConfirm.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Rule deleted' });
            fetchRules();
        }
        
        setDeleteConfirm(null);
    };
    
    // Default rules templates
    const defaultTemplates = [
        {
            rule_name: 'Late Marking After 9 AM',
            rule_type: 'late_marking',
            description: 'Mark attendance as late if check-in is after 9:00 AM',
            applies_to: 'both',
            conditions: { time_threshold: 15, start_time: '09:00', grace_minutes: 5, mark_as: 'late' },
        },
        {
            rule_name: 'Half Day After 11 AM',
            rule_type: 'half_day',
            description: 'Mark as half day if check-in is after 11:00 AM',
            applies_to: 'both',
            conditions: { time_threshold: 120, start_time: '11:00', mark_as: 'half_day' },
        },
        {
            rule_name: 'Absent If No Check-in',
            rule_type: 'absent_marking',
            description: 'Auto-mark as absent if no check-in by end of day',
            applies_to: 'both',
            conditions: { end_time: '17:00', mark_as: 'absent' },
        },
    ];
    
    const applyTemplate = (template) => {
        setEditingRule({
            ...template,
            is_active: true,
            priority: 1,
            actions: { send_sms: false, send_email: false },
        });
        setDialogOpen(true);
    };
    
    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="h-8 w-8 text-primary" />
                        Attendance Rules
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure automation rules for attendance marking
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchRules}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {hasAddPermission && (
                        <Button onClick={handleAddRule}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Rule
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Settings className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Rules</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Play className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gray-500/10">
                                <Pause className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.inactive}</p>
                                <p className="text-sm text-muted-foreground">Inactive</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Filter Tabs */}
            <Tabs value={filterType} onValueChange={setFilterType} className="mb-6">
                <TabsList className="flex-wrap">
                    <TabsTrigger value="all">All Rules</TabsTrigger>
                    {Object.entries(ruleTypeConfig).map(([key, config]) => (
                        <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                            <config.icon className={`w-4 h-4 ${config.color}`} />
                            {config.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            
            {/* Rules Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredRules.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Rules Found</h3>
                        <p className="text-muted-foreground mb-6">
                            {rules.length === 0 
                                ? "Start by creating your first attendance rule or use a template."
                                : "No rules match the selected filter."}
                        </p>
                        
                        {/* Quick Templates */}
                        {rules.length === 0 && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-muted-foreground">Quick Start Templates</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                                    {defaultTemplates.map((template, index) => (
                                        <Card 
                                            key={index}
                                            className="cursor-pointer hover:border-primary transition-colors"
                                            onClick={() => applyTemplate(template)}
                                        >
                                            <CardContent className="pt-6 text-left">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {React.createElement(
                                                        ruleTypeConfig[template.rule_type].icon,
                                                        { className: `w-5 h-5 ${ruleTypeConfig[template.rule_type].color}` }
                                                    )}
                                                    <h5 className="font-medium text-sm">{template.rule_name}</h5>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{template.description}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {filteredRules.map((rule) => (
                            <RuleCard
                                key={rule.id}
                                rule={rule}
                                onEdit={handleEditRule}
                                onDelete={setDeleteConfirm}
                                onToggle={handleToggleRule}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
            
            {/* Add/Edit Dialog */}
            <RuleDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingRule(null);
                }}
                rule={editingRule}
                branchId={branchId}
                organizationId={organizationId}
                sessionId={currentSessionId}
                onSaved={fetchRules}
            />
            
            {/* Delete Confirmation */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Rule
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteConfirm?.rule_name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteRule}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default AttendanceRules;
