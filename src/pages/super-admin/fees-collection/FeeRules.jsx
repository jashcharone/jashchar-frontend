import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PlusCircle, Edit, Trash2, Loader2, Brain, Play, Plus, X,
  ArrowUp, ArrowDown, Zap, Users, Eye, CheckCircle2, AlertCircle,
} from 'lucide-react';

// ============================================================================
// FEE RULES - Smart Rules Engine 3.0
// Visual rule builder for auto-assigning fee structures, discounts, waivers
// ============================================================================

const RULE_TYPES = [
  { value: 'auto_assign', label: 'Auto-Assign Structure', icon: '📦', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'auto_discount', label: 'Auto-Discount', icon: '🏷️', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'auto_add_fee', label: 'Auto-Add Fee', icon: '➕', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'auto_waive', label: 'Auto-Waive', icon: '🎁', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
];

const ACTION_TYPES = [
  { value: 'assign_structure', label: 'Assign Fee Structure', for: ['auto_assign'] },
  { value: 'apply_discount_percent', label: 'Apply % Discount', for: ['auto_discount'] },
  { value: 'apply_discount_fixed', label: 'Apply Fixed Discount', for: ['auto_discount'] },
  { value: 'add_component', label: 'Add Fee Component', for: ['auto_add_fee'] },
  { value: 'waive_fee', label: 'Waive All Fees', for: ['auto_waive'] },
];

const CONDITION_FIELDS = [
  { value: 'class_id', label: 'Class', type: 'multi_select' },
  { value: 'category_id', label: 'Category', type: 'select', options: ['General', 'OBC', 'SC', 'ST', 'RTE', 'EWS'] },
  { value: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
  { value: 'is_new_admission', label: 'New Admission', type: 'boolean' },
  { value: 'transport_assigned', label: 'Transport Assigned', type: 'boolean' },
  { value: 'hostel_assigned', label: 'Hostel Assigned', type: 'boolean' },
  { value: 'parent_is_staff', label: 'Staff Ward', type: 'boolean' },
];

const CONDITION_OPERATORS = {
  multi_select: [
    { value: 'in', label: 'is one of' },
    { value: 'not_in', label: 'is NOT one of' },
  ],
  select: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
  ],
  boolean: [
    { value: 'equals', label: 'is' },
  ],
};

const TRIGGERS = [
  { value: 'admission', label: 'New Admission' },
  { value: 'session_start', label: 'Session Start' },
  { value: 'manual', label: 'Manual Only' },
  { value: 'hostel_assign', label: 'Hostel Assignment' },
  { value: 'transport_assign', label: 'Transport Assignment' },
];

const FeeRules = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  // Data
  const [rules, setRules] = useState([]);
  const [structures, setStructures] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);

  // Run Preview
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [runPreview, setRunPreview] = useState(null);
  const [running, setRunning] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    id: null,
    rule_name: '',
    description: '',
    priority: 100,
    rule_type: 'auto_assign',
    action_type: 'assign_structure',
    action_config: {},
    trigger_on: ['admission'],
    is_active: true,
    requires_approval: false,
  });
  const [formConditions, setFormConditions] = useState([]);

  // ─── Fetch Data ──────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!selectedBranch?.id || !currentSessionId) return;
    setLoading(true);

    const [rulesRes, structRes, typesRes, classesRes] = await Promise.all([
      supabase
        .from('fee_rules')
        .select('*')
        .eq('branch_id', selectedBranch.id)
        .eq('session_id', currentSessionId)
        .order('priority'),
      supabase
        .from('fee_structures')
        .select('id, name, total_annual_amount, is_active')
        .eq('branch_id', selectedBranch.id)
        .eq('session_id', currentSessionId)
        .eq('is_active', true),
      supabase
        .from('fee_types')
        .select('id, name, code')
        .eq('branch_id', selectedBranch.id)
        .eq('session_id', currentSessionId)
        .order('name'),
      supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', selectedBranch.id)
        .order('name'),
    ]);

    if (!rulesRes.error) setRules(rulesRes.data || []);
    else toast({ variant: 'destructive', title: 'Error fetching rules', description: rulesRes.error.message });
    if (!structRes.error) setStructures(structRes.data || []);
    if (!typesRes.error) setFeeTypes(typesRes.data || []);
    if (!classesRes.error) setClasses(classesRes.data || []);

    setLoading(false);
  }, [selectedBranch?.id, currentSessionId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Helpers ─────────────────────────────────────────────
  const getClassName = (id) => classes.find(c => c.id === id)?.name || id;
  const getStructureName = (id) => structures.find(s => s.id === id)?.name || id;
  const getRuleTypeInfo = (type) => RULE_TYPES.find(rt => rt.value === type) || RULE_TYPES[0];

  const getActionLabel = (rule) => {
    const config = rule.action_config || {};
    switch (rule.action_type) {
      case 'assign_structure':
        return `Assign "${getStructureName(config.fee_structure_id)}"`;
      case 'apply_discount_percent':
        return `${config.discount_percent || 0}% discount${config.reason ? ` (${config.reason})` : ''}`;
      case 'apply_discount_fixed':
        return `₹${config.discount_amount || 0} discount${config.reason ? ` (${config.reason})` : ''}`;
      case 'waive_fee':
        return `Waive all fees${config.reason ? ` (${config.reason})` : ''}`;
      case 'add_component':
        return `Add fee ₹${config.amount || 0}`;
      default:
        return rule.action_type;
    }
  };

  const getConditionLabel = (cond) => {
    const field = CONDITION_FIELDS.find(f => f.value === cond.field);
    const fieldLabel = field?.label || cond.field;

    if (cond.field === 'class_id' && Array.isArray(cond.value)) {
      const names = cond.value.map(getClassName).join(', ');
      return `${fieldLabel} ${cond.operator === 'in' ? 'is one of' : 'is NOT one of'} [${names}]`;
    }
    if (field?.type === 'boolean') {
      return `${fieldLabel} = ${cond.value ? 'Yes' : 'No'}`;
    }
    return `${fieldLabel} ${cond.operator} ${cond.value}`;
  };

  // ─── Bulk Reassign Fees (Fix Missing Allocations) ─────────
  const [bulkReassigning, setBulkReassigning] = useState(false);
  
  const handleBulkReassign = async () => {
    if (!selectedBranch?.id || !currentSessionId) return;
    setBulkReassigning(true);
    
    try {
      let totalAllocations = 0;
      let totalStudents = 0;
      
      for (const cls of classes) {
        // Step 1: Get fee_group_class_assignments for this class
        const { data: assignments } = await supabase
          .from('fee_group_class_assignments')
          .select('fee_group_id, section_id')
          .eq('class_id', cls.id)
          .eq('branch_id', selectedBranch.id)
          .eq('session_id', currentSessionId)
          .eq('is_active', true);
        
        if (!assignments || assignments.length === 0) continue;
        
        const feeGroupIds = [...new Set(assignments.map(a => a.fee_group_id))];
        
        // Step 2: Get all fee_masters for these fee groups
        const { data: feeMasters } = await supabase
          .from('fee_masters')
          .select('id')
          .in('fee_group_id', feeGroupIds)
          .eq('branch_id', selectedBranch.id)
          .eq('session_id', currentSessionId);
        
        if (!feeMasters || feeMasters.length === 0) continue;
        
        // Step 3: Get all students in this class
        const { data: students } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('class_id', cls.id)
          .eq('branch_id', selectedBranch.id)
          .eq('session_id', currentSessionId)
          .eq('status', 'active')
          .or('is_disabled.is.null,is_disabled.eq.false');
        
        if (!students || students.length === 0) continue;
        
        totalStudents += students.length;
        
        // Step 4: Get existing allocations
        const studentIds = students.map(s => s.id);
        const { data: existingAllocations } = await supabase
          .from('student_fee_allocations')
          .select('student_id, fee_master_id')
          .in('student_id', studentIds)
          .eq('branch_id', selectedBranch.id)
          .eq('session_id', currentSessionId);
        
        const existingSet = new Set(
          (existingAllocations || []).map(a => `${a.student_id}_${a.fee_master_id}`)
        );
        
        // Step 5: Create missing allocations
        const missingAllocations = [];
        for (const student of students) {
          for (const feeMaster of feeMasters) {
            const key = `${student.id}_${feeMaster.id}`;
            if (!existingSet.has(key)) {
              missingAllocations.push({
                student_id: student.id,
                fee_master_id: feeMaster.id,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                organization_id: organizationId,
              });
            }
          }
        }
        
        // Step 6: Batch insert
        if (missingAllocations.length > 0) {
          const batchSize = 100;
          for (let i = 0; i < missingAllocations.length; i += batchSize) {
            const batch = missingAllocations.slice(i, i + batchSize);
            await supabase
              .from('student_fee_allocations')
              .upsert(batch, { onConflict: 'student_id,fee_master_id', ignoreDuplicates: true });
          }
          totalAllocations += missingAllocations.length;
        }
      }
      
      toast({
        title: 'Fees Reassigned Successfully',
        description: `Processed ${totalStudents} students across ${classes.length} classes. Created ${totalAllocations} new allocations.`,
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error reassigning fees', description: err.message });
    }
    
    setBulkReassigning(false);
  };

  // ─── Form ───────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      id: null,
      rule_name: '',
      description: '',
      priority: 100,
      rule_type: 'auto_assign',
      action_type: 'assign_structure',
      action_config: {},
      trigger_on: ['admission'],
      is_active: true,
      requires_approval: false,
    });
    setFormConditions([]);
    setIsEditing(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (rule) => {
    setFormData({
      id: rule.id,
      rule_name: rule.rule_name,
      description: rule.description || '',
      priority: rule.priority,
      rule_type: rule.rule_type,
      action_type: rule.action_type,
      action_config: rule.action_config || {},
      trigger_on: rule.trigger_on || ['admission'],
      is_active: rule.is_active,
      requires_approval: rule.requires_approval,
    });
    setFormConditions(Array.isArray(rule.conditions) ? [...rule.conditions] : []);
    setIsEditing(true);
    setDialogOpen(true);
  };

  // ─── Conditions ─────────────────────────────────────────
  const addCondition = () => {
    setFormConditions(prev => [...prev, { field: 'class_id', operator: 'in', value: [] }]);
  };

  const removeCondition = (idx) => {
    setFormConditions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx, updates) => {
    setFormConditions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updates };
      return copy;
    });
  };

  const handleConditionFieldChange = (idx, newField) => {
    const fieldDef = CONDITION_FIELDS.find(f => f.value === newField);
    const defaultOps = CONDITION_OPERATORS[fieldDef?.type || 'select'];
    const defaultOp = defaultOps?.[0]?.value || 'equals';
    const defaultVal = fieldDef?.type === 'multi_select' ? [] : fieldDef?.type === 'boolean' ? true : '';
    updateCondition(idx, { field: newField, operator: defaultOp, value: defaultVal });
  };

  // Toggle class in multi-select condition
  const toggleConditionClass = (condIdx, classId) => {
    setFormConditions(prev => {
      const copy = [...prev];
      const current = Array.isArray(copy[condIdx].value) ? copy[condIdx].value : [];
      copy[condIdx] = {
        ...copy[condIdx],
        value: current.includes(classId)
          ? current.filter(c => c !== classId)
          : [...current, classId],
      };
      return copy;
    });
  };

  // ─── Trigger Toggle ─────────────────────────────────────
  const toggleTrigger = (triggerVal) => {
    setFormData(prev => ({
      ...prev,
      trigger_on: prev.trigger_on.includes(triggerVal)
        ? prev.trigger_on.filter(t => t !== triggerVal)
        : [...prev.trigger_on, triggerVal],
    }));
  };

  // ─── Update rule_type → auto-pick matching action_type ──
  const handleRuleTypeChange = (newType) => {
    const matchingActions = ACTION_TYPES.filter(at => at.for.includes(newType));
    setFormData(prev => ({
      ...prev,
      rule_type: newType,
      action_type: matchingActions[0]?.value || prev.action_type,
      action_config: {},
    }));
  };

  // ─── Save Rule ──────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.rule_name.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Rule name is required.' });
      return;
    }
    if (formConditions.length === 0) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Add at least one condition.' });
      return;
    }

    setSaving(true);

    const payload = {
      rule_name: formData.rule_name.trim(),
      description: formData.description?.trim() || null,
      priority: parseInt(formData.priority) || 100,
      rule_type: formData.rule_type,
      conditions: formConditions,
      action_type: formData.action_type,
      action_config: formData.action_config,
      trigger_on: formData.trigger_on,
      is_active: formData.is_active,
      requires_approval: formData.requires_approval,
      branch_id: selectedBranch.id,
      session_id: currentSessionId,
      organization_id: organizationId,
    };

    if (isEditing && formData.id) {
      payload.id = formData.id;
      payload.updated_at = new Date().toISOString();
    }

    const { error } = await supabase.from('fee_rules').upsert(payload);
    if (error) {
      toast({ variant: 'destructive', title: 'Error saving rule', description: error.message });
    } else {
      toast({ title: isEditing ? 'Rule Updated!' : 'Rule Created!' });
      setDialogOpen(false);
      resetForm();
      await fetchData();
    }
    setSaving(false);
  };

  // ─── Delete Rule ────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('fee_rules').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting', description: error.message });
    } else {
      toast({ title: 'Rule Deleted' });
      await fetchData();
    }
    setDeleteId(null);
  };

  // ─── Toggle Active ─────────────────────────────────────
  const toggleRuleActive = async (rule) => {
    const { error } = await supabase
      .from('fee_rules')
      .update({ is_active: !rule.is_active, updated_at: new Date().toISOString() })
      .eq('id', rule.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      await fetchData();
    }
  };

  // ─── Priority Change ───────────────────────────────────
  const changePriority = async (ruleId, direction) => {
    const idx = rules.findIndex(r => r.id === ruleId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= rules.length) return;

    const currentP = rules[idx].priority;
    const swapP = rules[swapIdx].priority;

    await Promise.all([
      supabase.from('fee_rules').update({ priority: swapP }).eq('id', rules[idx].id),
      supabase.from('fee_rules').update({ priority: currentP }).eq('id', rules[swapIdx].id),
    ]);
    await fetchData();
  };

  // ─── Run Rules Preview ─────────────────────────────────
  const handleRunPreview = async () => {
    setRunning(true);
    setRunPreview(null);

    // Fetch all students in this branch/session (include hostel/transport IDs)
    const { data: rawStudents, error } = await supabase
      .from('student_profiles')
      .select('id, first_name, last_name, class_id, category_id, gender, hostel_details_id, transport_details_id')
      .eq('branch_id', selectedBranch.id)
      .eq('session_id', currentSessionId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching students', description: error.message });
      setRunning(false);
      return;
    }

    // Derive hostel_assigned & transport_assigned from FK IDs
    const students = (rawStudents || []).map(s => ({
      ...s,
      hostel_assigned: !!s.hostel_details_id,
      transport_assigned: !!s.transport_details_id,
    }));

    const activeRules = rules.filter(r => r.is_active);
    const preview = [];

    for (const student of students) {
      const matchedRules = [];
      for (const rule of activeRules) {
        const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
        let allMatch = true;

        for (const cond of conditions) {
          const studentVal = student[cond.field];
          switch (cond.operator) {
            case 'in':
              if (!Array.isArray(cond.value) || !cond.value.includes(studentVal)) allMatch = false;
              break;
            case 'not_in':
              if (Array.isArray(cond.value) && cond.value.includes(studentVal)) allMatch = false;
              break;
            case 'equals':
              if (studentVal !== cond.value) allMatch = false;
              break;
            case 'not_equals':
              if (studentVal === cond.value) allMatch = false;
              break;
            default:
              break;
          }
          if (!allMatch) break;
        }

        if (allMatch) {
          matchedRules.push(rule);
        }
      }
      if (matchedRules.length > 0) {
        preview.push({ student, matchedRules });
      }
    }

    setRunPreview(preview);
    setRunDialogOpen(true);
    setRunning(false);
  };

  // ─── Execute Rules (Create Ledger Entries) ──────────────
  const executeRules = async () => {
    if (!runPreview || runPreview.length === 0) return;
    setRunning(true);

    let totalEntries = 0;
    let errors = 0;

    for (const item of runPreview) {
      for (const rule of item.matchedRules) {
        if (rule.action_type === 'assign_structure') {
          const structureId = rule.action_config?.fee_structure_id;
          if (!structureId) continue;

          // Get structure components
          const { data: components } = await supabase
            .from('fee_structure_components')
            .select('*')
            .eq('fee_structure_id', structureId);

          if (!components || components.length === 0) continue;

          // Check if ledger already has entries for this student + structure
          const { data: existing } = await supabase
            .from('student_fee_ledger')
            .select('id')
            .eq('student_id', item.student.id)
            .eq('fee_structure_id', structureId)
            .eq('session_id', currentSessionId)
            .limit(1);

          if (existing && existing.length > 0) continue; // already assigned

          const ledgerEntries = components.map(comp => ({
            student_id: item.student.id,
            fee_structure_id: structureId,
            fee_type_id: comp.fee_type_id,
            original_amount: comp.amount,
            discount_amount: 0,
            concession_amount: 0,
            net_amount: comp.amount,
            paid_amount: 0,
            fine_amount: 0,
            installment_number: comp.installment_number,
            due_date: comp.due_date,
            status: 'pending',
            assigned_by: 'rule',
            rule_id: rule.id,
            branch_id: selectedBranch.id,
            session_id: currentSessionId,
            organization_id: organizationId,
          }));

          const { error: insertErr } = await supabase.from('student_fee_ledger').insert(ledgerEntries);
          if (insertErr) {
            errors++;
          } else {
            totalEntries += ledgerEntries.length;
            // Log
            await supabase.from('fee_rule_logs').insert({
              student_id: item.student.id,
              rule_id: rule.id,
              action_taken: `Assigned structure "${getStructureName(structureId)}" with ${ledgerEntries.length} components`,
              details: { structure_id: structureId, entries_count: ledgerEntries.length },
              triggered_by: 'admin',
              branch_id: selectedBranch.id,
              session_id: currentSessionId,
              organization_id: organizationId,
            });
          }
        } else if (rule.action_type === 'apply_discount_percent' || rule.action_type === 'apply_discount_fixed') {
          // Apply discount to existing pending ledger entries
          const { data: ledgerRows } = await supabase
            .from('student_fee_ledger')
            .select('*')
            .eq('student_id', item.student.id)
            .eq('session_id', currentSessionId)
            .eq('status', 'pending');

          for (const entry of (ledgerRows || [])) {
            let discountAmt = 0;
            if (rule.action_type === 'apply_discount_percent') {
              discountAmt = (entry.original_amount * (rule.action_config.discount_percent || 0)) / 100;
            } else {
              discountAmt = rule.action_config.discount_amount || 0;
            }
            const newNet = Math.max(0, entry.original_amount - discountAmt - (entry.concession_amount || 0));
            await supabase
              .from('student_fee_ledger')
              .update({
                discount_amount: discountAmt,
                net_amount: newNet,
                discount_reason: rule.action_config.reason || rule.rule_name,
                rule_id: rule.id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', entry.id);
            totalEntries++;
          }
        } else if (rule.action_type === 'waive_fee') {
          const { data: ledgerRows } = await supabase
            .from('student_fee_ledger')
            .select('id')
            .eq('student_id', item.student.id)
            .eq('session_id', currentSessionId)
            .eq('status', 'pending');

          for (const entry of (ledgerRows || [])) {
            await supabase
              .from('student_fee_ledger')
              .update({
                status: 'waived',
                discount_reason: rule.action_config.reason || 'Rule waiver',
                rule_id: rule.id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', entry.id);
            totalEntries++;
          }
        }
      }
    }

    setRunning(false);
    setRunDialogOpen(false);
    toast({
      title: 'Rules Executed!',
      description: `${totalEntries} ledger entries created/updated. ${errors > 0 ? `${errors} errors.` : ''}`,
    });
    setRunPreview(null);
  };

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                Smart Fee Rules
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Auto-assign fees, discounts & waivers based on conditions
              </p>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleBulkReassign} disabled={bulkReassigning || classes.length === 0}>
                      {bulkReassigning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
                      Fix Missing Fees
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reassign fees to all students based on Fee Group Class Assignments</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" onClick={handleRunPreview} disabled={running || rules.filter(r => r.is_active).length === 0}>
                {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Run All Rules
              </Button>
              <Button onClick={openCreateDialog} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Rule
              </Button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty */}
          {!loading && rules.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Rules Yet</h3>
                <p className="text-muted-foreground mt-1">
                  Create rules to auto-assign fee structures to students.
                </p>
                <Button onClick={openCreateDialog} className="mt-4 gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create First Rule
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rules List */}
          <div className="space-y-3">
            {rules.map((rule, idx) => {
              const typeInfo = getRuleTypeInfo(rule.rule_type);
              const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];

              return (
                <Card key={rule.id} className={`transition-opacity ${!rule.is_active ? 'opacity-60' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Priority + Info */}
                      <div className="flex items-start gap-3 flex-1">
                        {/* Priority Controls */}
                        <div className="flex flex-col items-center gap-0.5 pt-1">
                          <Button
                            variant="ghost" size="sm"
                            className="h-6 w-6 p-0"
                            disabled={idx === 0}
                            onClick={() => changePriority(rule.id, 'up')}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-mono text-muted-foreground">{rule.priority}</span>
                          <Button
                            variant="ghost" size="sm"
                            className="h-6 w-6 p-0"
                            disabled={idx === rules.length - 1}
                            onClick={() => changePriority(rule.id, 'down')}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Rule Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{rule.rule_name}</h3>
                            <Badge className={typeInfo.color}>
                              {typeInfo.icon} {typeInfo.label}
                            </Badge>
                            {rule.requires_approval && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                Needs Approval
                              </Badge>
                            )}
                          </div>

                          {/* Conditions */}
                          <div className="mt-2 space-y-1">
                            {conditions.map((cond, ci) => (
                              <div key={ci} className="text-sm text-muted-foreground">
                                {ci === 0 ? 'IF ' : 'AND '}
                                <span className="font-medium text-foreground">{getConditionLabel(cond)}</span>
                              </div>
                            ))}
                            <div className="text-sm">
                              <span className="text-primary font-medium">THEN </span>
                              <span className="font-medium">{getActionLabel(rule)}</span>
                            </div>
                          </div>

                          {/* Triggers */}
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {(rule.trigger_on || []).map(t => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.is_active}
                                onCheckedChange={() => toggleRuleActive(rule)}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{rule.is_active ? 'Active' : 'Inactive'}</TooltipContent>
                        </Tooltip>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ─── CREATE/EDIT DIALOG ─────────────────────────── */}
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {isEditing ? 'Edit Rule' : 'Create Rule'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rule Name <span className="text-destructive">*</span></Label>
                    <Input
                      value={formData.rule_name}
                      onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                      placeholder="e.g., Auto-assign Primary Classes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority (1 = highest)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this rule do?"
                    rows={2}
                  />
                </div>

                {/* Rule Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rule Type</Label>
                    <Select value={formData.rule_type} onValueChange={handleRuleTypeChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RULE_TYPES.map(rt => (
                          <SelectItem key={rt.value} value={rt.value}>{rt.icon} {rt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Action Type</Label>
                    <Select value={formData.action_type} onValueChange={(val) => setFormData({ ...formData, action_type: val, action_config: {} })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.filter(at => at.for.includes(formData.rule_type)).map(at => (
                          <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* CONDITIONS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Conditions (ALL must match)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                      <Plus className="h-4 w-4 mr-1" /> Add Condition
                    </Button>
                  </div>

                  {formConditions.length === 0 && (
                    <div className="text-center py-4 border rounded-md text-muted-foreground text-sm">
                      No conditions. Click "Add Condition".
                    </div>
                  )}

                  {formConditions.map((cond, idx) => {
                    const fieldDef = CONDITION_FIELDS.find(f => f.value === cond.field);
                    const operators = CONDITION_OPERATORS[fieldDef?.type || 'select'] || [];

                    return (
                      <div key={idx} className="flex items-start gap-2 p-3 border rounded-md bg-muted/30">
                        <span className="text-xs font-medium mt-2 min-w-[30px]">{idx === 0 ? 'IF' : 'AND'}</span>

                        {/* Field */}
                        <Select value={cond.field} onValueChange={(val) => handleConditionFieldChange(idx, val)}>
                          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONDITION_FIELDS.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Operator */}
                        <Select value={cond.operator} onValueChange={(val) => updateCondition(idx, { operator: val })}>
                          <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {operators.map(op => (
                              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Value */}
                        <div className="flex-1">
                          {fieldDef?.type === 'multi_select' && cond.field === 'class_id' && (
                            <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-background max-h-24 overflow-y-auto">
                              {classes.map(cls => (
                                <label
                                  key={cls.id}
                                  className={`text-xs px-2 py-1 rounded cursor-pointer border ${
                                    Array.isArray(cond.value) && cond.value.includes(cls.id)
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'hover:bg-muted'
                                  }`}
                                  onClick={() => toggleConditionClass(idx, cls.id)}
                                >
                                  {cls.name}
                                </label>
                              ))}
                            </div>
                          )}
                          {fieldDef?.type === 'select' && (
                            <Select value={cond.value} onValueChange={(val) => updateCondition(idx, { value: val })}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {(fieldDef.options || []).map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {fieldDef?.type === 'boolean' && (
                            <Select value={String(cond.value)} onValueChange={(val) => updateCondition(idx, { value: val === 'true' })}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => removeCondition(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* ACTION CONFIG */}
                <div className="space-y-3 p-4 border rounded-md bg-blue-50/50">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Action Configuration
                  </Label>

                  {formData.action_type === 'assign_structure' && (
                    <div className="space-y-2">
                      <Label>Fee Structure to Assign</Label>
                      <Select
                        value={formData.action_config.fee_structure_id || ''}
                        onValueChange={(val) => setFormData({ ...formData, action_config: { ...formData.action_config, fee_structure_id: val } })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select structure..." /></SelectTrigger>
                        <SelectContent>
                          {structures.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} (₹{s.total_annual_amount?.toLocaleString('en-IN')})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {structures.length === 0 && (
                        <p className="text-xs text-destructive">No fee structures found. Create one first.</p>
                      )}
                    </div>
                  )}

                  {formData.action_type === 'apply_discount_percent' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Discount Percentage</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={formData.action_config.discount_percent || ''}
                          onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, discount_percent: parseFloat(e.target.value) || 0 } })}
                          placeholder="e.g., 10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input
                          value={formData.action_config.reason || ''}
                          onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, reason: e.target.value } })}
                          placeholder="e.g., Sibling Discount"
                        />
                      </div>
                    </div>
                  )}

                  {formData.action_type === 'apply_discount_fixed' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Discount Amount (₹)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.action_config.discount_amount || ''}
                          onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, discount_amount: parseFloat(e.target.value) || 0 } })}
                          placeholder="e.g., 5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input
                          value={formData.action_config.reason || ''}
                          onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, reason: e.target.value } })}
                          placeholder="e.g., Staff Ward"
                        />
                      </div>
                    </div>
                  )}

                  {formData.action_type === 'waive_fee' && (
                    <div className="space-y-2">
                      <Label>Waiver Reason</Label>
                      <Input
                        value={formData.action_config.reason || ''}
                        onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, reason: e.target.value } })}
                        placeholder="e.g., RTE Student - 100% waiver"
                      />
                    </div>
                  )}

                  {formData.action_type === 'add_component' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fee Type</Label>
                        <Select
                          value={formData.action_config.fee_type_id || ''}
                          onValueChange={(val) => setFormData({ ...formData, action_config: { ...formData.action_config, fee_type_id: val } })}
                        >
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {feeTypes.map(ft => (
                              <SelectItem key={ft.id} value={ft.id}>{ft.name} ({ft.code})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (₹)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.action_config.amount || ''}
                          onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, amount: parseFloat(e.target.value) || 0 } })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Triggers */}
                <div className="space-y-2">
                  <Label>Triggers On</Label>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGERS.map(tr => (
                      <label
                        key={tr.value}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer text-sm transition-colors ${
                          formData.trigger_on.includes(tr.value)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleTrigger(tr.value)}
                      >
                        {tr.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Approval */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="requires_approval"
                    checked={formData.requires_approval}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_approval: !!checked })}
                  />
                  <Label htmlFor="requires_approval">Requires Admin Approval before applying</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? 'Update Rule' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── RUN PREVIEW DIALOG ─────────────────────────── */}
          <Dialog open={runDialogOpen} onOpenChange={(open) => { if (!open) setRunDialogOpen(false); }}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Rules Execution Preview
                </DialogTitle>
              </DialogHeader>

              {runPreview && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-sm py-1 px-3">
                      <Users className="h-4 w-4 mr-1" />
                      {runPreview.length} students matched
                    </Badge>
                  </div>

                  {runPreview.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                      No students matched any active rules.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-md">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="py-2 px-3 text-left">#</th>
                            <th className="py-2 px-3 text-left">Student</th>
                            <th className="py-2 px-3 text-left">Class</th>
                            <th className="py-2 px-3 text-left">Matched Rules</th>
                          </tr>
                        </thead>
                        <tbody>
                          {runPreview.slice(0, 50).map((item, idx) => (
                            <tr key={item.student.id} className="border-t">
                              <td className="py-2 px-3">{idx + 1}</td>
                              <td className="py-2 px-3 font-medium">
                                {item.student.first_name} {item.student.last_name}
                              </td>
                              <td className="py-2 px-3">{getClassName(item.student.class_id)}</td>
                              <td className="py-2 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {item.matchedRules.map(r => (
                                    <Badge key={r.id} variant="outline" className="text-xs">
                                      {r.rule_name}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {runPreview.length > 50 && (
                        <div className="text-center py-2 text-xs text-muted-foreground">
                          Showing first 50 of {runPreview.length} results
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setRunDialogOpen(false)}>
                  Cancel
                </Button>
                {runPreview && runPreview.length > 0 && (
                  <Button onClick={executeRules} disabled={running}>
                    {running && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Execute & Create Ledger Entries
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── DELETE CONFIRMATION ─────────────────────────── */}
          <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Fee Rule?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete this rule. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
};

export default FeeRules;
