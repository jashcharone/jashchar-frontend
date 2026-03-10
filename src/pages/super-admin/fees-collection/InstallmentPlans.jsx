import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, Plus, Loader2, MoreVertical, Check, X, Eye, Copy, Trash2,
  IndianRupee, Calendar, CalendarDays, Calculator, PiggyBank, CreditCard,
  Split, Percent, AlertCircle, ChevronRight, Settings2, Users, Building2,
  TrendingUp, Clock, Edit, Sparkles, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALLMENT PLANS - EMI Plan Creator (Monthly/Quarterly/Custom)
// Create flexible payment schedules for students
// ═══════════════════════════════════════════════════════════════════════════════

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PLAN_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly', icon: CalendarDays, installments: 12, color: 'blue' },
  { value: 'quarterly', label: 'Quarterly', icon: Calendar, installments: 4, color: 'purple' },
  { value: 'half_yearly', label: 'Half Yearly', icon: Calendar, installments: 2, color: 'orange' },
  { value: 'yearly', label: 'Annual', icon: Calendar, installments: 1, color: 'green' },
  { value: 'custom', label: 'Custom', icon: Settings2, installments: 0, color: 'gray' },
];

// ─────────────────────────────────────────────────────────────────────────────────
// PLAN CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const PlanCard = ({ plan, onEdit, onDelete, onDuplicate, onViewDetails }) => {
  const frequency = PLAN_FREQUENCIES.find(f => f.value === plan.frequency) || PLAN_FREQUENCIES[0];
  const FreqIcon = frequency.icon;
  
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: `var(--${frequency.color}-500)` }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              `bg-${frequency.color}-100 text-${frequency.color}-600`
            )}>
              <FreqIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>{plan.description || frequency.label + ' Payment Plan'}</CardDescription>
            </div>
          </div>
          <Badge variant={plan.is_active ? 'default' : 'secondary'}>
            {plan.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-2xl font-bold text-primary">{plan.total_installments}</p>
            <p className="text-xs text-muted-foreground">Installments</p>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(plan.total_amount)}</p>
            <p className="text-xs text-muted-foreground">Total Amount</p>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(plan.installment_amount)}</p>
            <p className="text-xs text-muted-foreground">Per Install.</p>
          </div>
        </div>

        {plan.late_fee_applicable && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>Late fee: {plan.late_fee_type === 'percentage' ? `${plan.late_fee_value}%` : formatCurrency(plan.late_fee_value)} after due date</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Created: {formatDate(plan.created_at)}</span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {plan.students_count || 0} students
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-0 gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails(plan)}>
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(plan)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDuplicate(plan)}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(plan)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// INSTALLMENT PREVIEW TABLE
// ─────────────────────────────────────────────────────────────────────────────────

const InstallmentPreview = ({ installments }) => {
  if (!installments || installments.length === 0) return null;
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((inst, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{formatDate(inst.due_date)}</TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(inst.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const InstallmentPlans = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);
  const [feeTemplates, setFeeTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fee_template_id: '',
    total_amount: '',
    frequency: 'monthly',
    total_installments: 12,
    start_date: '',
    installment_day: 1,
    late_fee_applicable: true,
    late_fee_type: 'percentage',
    late_fee_value: 2,
    grace_period_days: 7,
    is_active: true,
  });

  // Calculated installments preview
  const [previewInstallments, setPreviewInstallments] = useState([]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CALCULATE INSTALLMENTS PREVIEW
  // ─────────────────────────────────────────────────────────────────────────────

  const calculateInstallments = useCallback(() => {
    if (!formData.total_amount || !formData.total_installments || !formData.start_date) {
      setPreviewInstallments([]);
      return;
    }

    const totalAmount = parseFloat(formData.total_amount);
    const numInstallments = parseInt(formData.total_installments);
    const baseAmount = Math.floor(totalAmount / numInstallments);
    const remainder = totalAmount - (baseAmount * numInstallments);
    
    const installments = [];
    let startDate = new Date(formData.start_date);
    
    for (let i = 0; i < numInstallments; i++) {
      let dueDate = new Date(startDate);
      
      if (formData.frequency === 'monthly') {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (formData.frequency === 'quarterly') {
        dueDate.setMonth(dueDate.getMonth() + (i * 3));
      } else if (formData.frequency === 'half_yearly') {
        dueDate.setMonth(dueDate.getMonth() + (i * 6));
      } else if (formData.frequency === 'yearly') {
        dueDate.setFullYear(dueDate.getFullYear() + i);
      } else {
        // Custom - monthly by default
        dueDate.setMonth(dueDate.getMonth() + i);
      }
      
      // Set the day
      dueDate.setDate(Math.min(formData.installment_day, 28));
      
      // Last installment gets the remainder
      const amount = i === numInstallments - 1 ? baseAmount + remainder : baseAmount;
      
      installments.push({
        installment_number: i + 1,
        due_date: dueDate.toISOString().split('T')[0],
        amount: amount,
        status: 'pending',
      });
    }
    
    setPreviewInstallments(installments);
  }, [formData.total_amount, formData.total_installments, formData.start_date, formData.frequency, formData.installment_day]);

  useEffect(() => {
    calculateInstallments();
  }, [calculateInstallments]);

  // Auto-update installments based on frequency
  useEffect(() => {
    const freq = PLAN_FREQUENCIES.find(f => f.value === formData.frequency);
    if (freq && freq.installments > 0) {
      setFormData(prev => ({ ...prev, total_installments: freq.installments }));
    }
  }, [formData.frequency]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('fee_installment_plans')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Fetch plans error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load installment plans' });
    }
    setLoading(false);
  }, [branchId, toast]);

  const fetchFeeTemplates = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from('fee_templates')
      .select('id, name, template_name, total_amount')
      .eq('branch_id', branchId)
      .order('name');
    setFeeTemplates(data || []);
  }, [branchId]);

  useEffect(() => {
    fetchPlans();
    fetchFeeTemplates();
  }, [fetchPlans, fetchFeeTemplates]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      fee_template_id: '',
      total_amount: '',
      frequency: 'monthly',
      total_installments: 12,
      start_date: new Date().toISOString().split('T')[0],
      installment_day: 1,
      late_fee_applicable: true,
      late_fee_type: 'percentage',
      late_fee_value: 2,
      grace_period_days: 7,
      is_active: true,
    });
    setPreviewInstallments([]);
  };

  const handleCreateNew = () => {
    resetForm();
    setIsEditing(false);
    setSelectedPlan(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (plan) => {
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      fee_template_id: plan.fee_template_id || '',
      total_amount: plan.total_amount?.toString() || '',
      frequency: plan.frequency || 'monthly',
      total_installments: plan.total_installments || 12,
      start_date: plan.start_date ? new Date(plan.start_date).toISOString().split('T')[0] : '',
      installment_day: plan.installment_day || 1,
      late_fee_applicable: plan.late_fee_applicable ?? true,
      late_fee_type: plan.late_fee_type || 'percentage',
      late_fee_value: plan.late_fee_value || 2,
      grace_period_days: plan.grace_period_days || 7,
      is_active: plan.is_active ?? true,
    });
    setIsEditing(true);
    setSelectedPlan(plan);
    setShowCreateDialog(true);
  };

  const handleDuplicate = (plan) => {
    setFormData({
      name: plan.name + ' (Copy)',
      description: plan.description || '',
      fee_template_id: plan.fee_template_id || '',
      total_amount: plan.total_amount?.toString() || '',
      frequency: plan.frequency || 'monthly',
      total_installments: plan.total_installments || 12,
      start_date: new Date().toISOString().split('T')[0],
      installment_day: plan.installment_day || 1,
      late_fee_applicable: plan.late_fee_applicable ?? true,
      late_fee_type: plan.late_fee_type || 'percentage',
      late_fee_value: plan.late_fee_value || 2,
      grace_period_days: plan.grace_period_days || 7,
      is_active: true,
    });
    setIsEditing(false);
    setSelectedPlan(null);
    setShowCreateDialog(true);
  };

  const handleDelete = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteDialog(true);
  };

  const handleViewDetails = (plan) => {
    setSelectedPlan(plan);
    setShowViewDialog(true);
  };

  const handleTemplateChange = (templateId) => {
    const template = feeTemplates.find(t => t.id === templateId);
    setFormData(prev => ({
      ...prev,
      fee_template_id: templateId,
      total_amount: template?.total_amount?.toString() || prev.total_amount,
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.total_amount || !formData.start_date) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        fee_template_id: formData.fee_template_id || null,
        total_amount: parseFloat(formData.total_amount),
        installment_amount: previewInstallments.length > 0 ? previewInstallments[0].amount : parseFloat(formData.total_amount) / formData.total_installments,
        frequency: formData.frequency,
        total_installments: parseInt(formData.total_installments),
        start_date: formData.start_date,
        installment_day: formData.installment_day,
        late_fee_applicable: formData.late_fee_applicable,
        late_fee_type: formData.late_fee_type,
        late_fee_value: parseFloat(formData.late_fee_value),
        grace_period_days: parseInt(formData.grace_period_days),
        is_active: formData.is_active,
        installment_schedule: previewInstallments,
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: organizationId,
      };

      if (isEditing && selectedPlan) {
        const { error } = await supabase
          .from('fee_installment_plans')
          .update(payload)
          .eq('id', selectedPlan.id);
        if (error) throw error;
        toast({ title: 'Updated!', description: 'Installment plan updated successfully' });
      } else {
        const { error } = await supabase
          .from('fee_installment_plans')
          .insert(payload);
        if (error) throw error;
        toast({ title: 'Created!', description: 'Installment plan created successfully' });
      }

      setShowCreateDialog(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save plan' });
    }
    setSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlan) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('fee_installment_plans')
        .delete()
        .eq('id', selectedPlan.id);
        
      if (error) throw error;
      
      toast({ title: 'Deleted', description: 'Installment plan deleted successfully' });
      setShowDeleteDialog(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete plan' });
    }
    setSaving(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FILTERED DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const filteredPlans = plans.filter(plan => 
    plan.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.is_active).length,
    monthlyPlans: plans.filter(p => p.frequency === 'monthly').length,
    totalValue: plans.reduce((sum, p) => sum + (p.total_amount || 0), 0),
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Split className="h-7 w-7 text-primary" />
              Installment Plans
            </h1>
            <p className="text-muted-foreground">Create and manage EMI payment plans</p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Split className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPlans}</p>
                  <p className="text-sm text-muted-foreground">Total Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activePlans}</p>
                  <p className="text-sm text-muted-foreground">Active Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.monthlyPlans}</p>
                  <p className="text-sm text-muted-foreground">Monthly Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <IndianRupee className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          {PLAN_FREQUENCIES.slice(0, 4).map((freq) => {
            const Icon = freq.icon;
            return (
              <Button
                key={freq.value}
                variant="outline"
                onClick={() => {
                  resetForm();
                  setFormData(prev => ({
                    ...prev,
                    frequency: freq.value,
                    total_installments: freq.installments,
                    start_date: new Date().toISOString().split('T')[0],
                  }));
                  setShowCreateDialog(true);
                }}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                Quick {freq.label}
              </Button>
            );
          })}
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card className="p-12 text-center">
            <Split className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Installment Plans</h3>
            <p className="text-muted-foreground mb-6">Create flexible payment plans for students</p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Plan
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Split className="h-5 w-5" />
                {isEditing ? 'Edit Installment Plan' : 'Create Installment Plan'}
              </DialogTitle>
              <DialogDescription>
                Configure flexible payment schedules for fee collection
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
              {/* Form Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Plan Name *</Label>
                  <Input
                    placeholder="e.g., Monthly Payment Plan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Plan description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link to Fee Template (Optional)</Label>
                  <Select value={formData.fee_template_id} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.template_name || t.name} - {formatCurrency(t.total_amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Amount *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="100000"
                        value={formData.total_amount}
                        onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Frequency</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {PLAN_FREQUENCIES.map((freq) => {
                      const Icon = freq.icon;
                      return (
                        <Button
                          key={freq.value}
                          type="button"
                          variant={formData.frequency === freq.value ? 'default' : 'outline'}
                          className="flex-col h-auto py-3"
                          onClick={() => setFormData({ ...formData, frequency: freq.value })}
                        >
                          <Icon className="h-5 w-5 mb-1" />
                          <span className="text-xs">{freq.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Installments</Label>
                    <Input
                      type="number"
                      min="1"
                      max="36"
                      value={formData.total_installments}
                      onChange={(e) => setFormData({ ...formData, total_installments: parseInt(e.target.value) || 1 })}
                      disabled={formData.frequency !== 'custom'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Day of Month</Label>
                    <Select 
                      value={formData.installment_day.toString()} 
                      onValueChange={(v) => setFormData({ ...formData, installment_day: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 5, 10, 15, 20, 25, 28].map(day => (
                          <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Late Fee Applicable</Label>
                    <Switch
                      checked={formData.late_fee_applicable}
                      onCheckedChange={(v) => setFormData({ ...formData, late_fee_applicable: v })}
                    />
                  </div>
                  
                  {formData.late_fee_applicable && (
                    <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-amber-300">
                      <div className="space-y-2">
                        <Label>Late Fee Type</Label>
                        <Select 
                          value={formData.late_fee_type} 
                          onValueChange={(v) => setFormData({ ...formData, late_fee_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Late Fee Value</Label>
                        <Input
                          type="number"
                          value={formData.late_fee_value}
                          onChange={(e) => setFormData({ ...formData, late_fee_value: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Grace Period (Days)</Label>
                        <Input
                          type="number"
                          value={formData.grace_period_days}
                          onChange={(e) => setFormData({ ...formData, grace_period_days: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label>Plan Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Installment Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {previewInstallments.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-white/50 rounded-lg">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(previewInstallments[0].amount)}</p>
                            <p className="text-xs text-muted-foreground">Per Installment</p>
                          </div>
                          <div className="text-center p-3 bg-white/50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{previewInstallments.length}</p>
                            <p className="text-xs text-muted-foreground">Total Payments</p>
                          </div>
                        </div>
                        <ScrollArea className="h-[300px]">
                          <InstallmentPreview installments={previewInstallments} />
                        </ScrollArea>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Enter amount and start date to see preview</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                {isEditing ? 'Update Plan' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Installment Plan Details</DialogTitle>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan Name</p>
                    <p className="font-semibold">{selectedPlan.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Frequency</p>
                    <p className="font-semibold capitalize">{selectedPlan.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-bold text-lg text-green-600">{formatCurrency(selectedPlan.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Per Installment</p>
                    <p className="font-bold text-lg text-blue-600">{formatCurrency(selectedPlan.installment_amount)}</p>
                  </div>
                </div>
                {selectedPlan.installment_schedule && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Schedule</p>
                    <ScrollArea className="h-[300px]">
                      <InstallmentPreview installments={selectedPlan.installment_schedule} />
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Installment Plan?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{selectedPlan?.name}". Students with this plan will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default InstallmentPlans;
