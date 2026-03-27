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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PlusCircle, Edit, Trash2, Loader2, Search, Copy, ChevronDown, ChevronRight,
  IndianRupee, Calendar, GraduationCap, Package, Eye, Plus, X,
} from 'lucide-react';
import { formatDate, formatDateForInput } from '@/utils/dateUtils';

// ============================================================================
// FEE STRUCTURES - Fee Engine 3.0
// Replaces FeesGroup + FeesMaster with unified structure management
// Each structure = collection of fee components (types + amounts + due dates)
// ============================================================================

const BILLING_CYCLES = [
  { value: 'installment', label: 'Installment-wise' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual (One-time)' },
];

const FINE_TYPES = [
  { value: 'none', label: 'No Fine' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'per_day', label: 'Per Day' },
];

const FeeStructures = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  // Data
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

  // Preview
  const [previewStructure, setPreviewStructure] = useState(null);

  // Search & UI
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: '',
    billing_cycle: 'installment',
    total_installments: 3,
    applies_to_classes: [],
    applies_to_categories: [],
  });

  // Components in the form (fee items)
  const [formComponents, setFormComponents] = useState([]);

  // ─── Data Fetching ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!selectedBranch?.id || !currentSessionId) return;
    setLoading(true);

    const [structRes, typesRes, classesRes] = await Promise.all([
      supabase
        .from('fee_structures')
        .select('*, fee_structure_components(*)')
        .eq('branch_id', selectedBranch.id)
        .eq('session_id', currentSessionId)
        .order('name'),
      supabase
        .from('fee_types')
        .select('id, name, code')
        .eq('branch_id', selectedBranch.id)
        // Note: fee_types are branch-level, not session-specific
        .order('name'),
      supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', selectedBranch.id)
        .order('name'),
    ]);

    if (structRes.error) {
      toast({ variant: 'destructive', title: 'Error fetching structures', description: structRes.error.message });
    } else {
      setStructures(structRes.data || []);
    }

    if (!typesRes.error) setFeeTypes(typesRes.data || []);
    if (!classesRes.error) setClasses(classesRes.data || []);

    setLoading(false);
  }, [selectedBranch?.id, currentSessionId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Filtered List ───────────────────────────────────────
  const filteredStructures = useMemo(() => {
    if (!searchQuery.trim()) return structures;
    const q = searchQuery.toLowerCase();
    return structures.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  }, [structures, searchQuery]);

  // ─── Helpers ─────────────────────────────────────────────
  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || classId;
  };

  const getFeeTypeName = (typeId) => {
    const ft = feeTypes.find(t => t.id === typeId);
    return ft ? `${ft.name} (${ft.code})` : typeId;
  };

  const calcStructureTotal = (components) => {
    return (components || []).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  };

  // ─── Form Management ────────────────────────────────────
  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      description: '',
      billing_cycle: 'installment',
      total_installments: 3,
      applies_to_classes: [],
      applies_to_categories: [],
    });
    setFormComponents([]);
    setIsEditing(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (structure) => {
    setFormData({
      id: structure.id,
      name: structure.name,
      description: structure.description || '',
      billing_cycle: structure.billing_cycle,
      total_installments: structure.total_installments || 3,
      applies_to_classes: structure.applies_to_classes || [],
      applies_to_categories: structure.applies_to_categories || [],
    });
    setFormComponents(
      (structure.fee_structure_components || [])
        .sort((a, b) => (a.installment_number || 0) - (b.installment_number || 0) || (a.sort_order || 0) - (b.sort_order || 0))
        .map(c => ({
          id: c.id,
          fee_type_id: c.fee_type_id,
          amount: c.amount,
          due_date: c.due_date ? formatDateForInput(c.due_date) : '',
          installment_number: c.installment_number || 1,
          fine_type: c.fine_type || 'none',
          fine_value: c.fine_value || 0,
          is_optional: c.is_optional || false,
        }))
    );
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDuplicate = (structure) => {
    setFormData({
      id: null,
      name: `${structure.name} (Copy)`,
      description: structure.description || '',
      billing_cycle: structure.billing_cycle,
      total_installments: structure.total_installments || 3,
      applies_to_classes: structure.applies_to_classes || [],
      applies_to_categories: structure.applies_to_categories || [],
    });
    setFormComponents(
      (structure.fee_structure_components || []).map(c => ({
        id: null,
        fee_type_id: c.fee_type_id,
        amount: c.amount,
        due_date: c.due_date ? formatDateForInput(c.due_date) : '',
        installment_number: c.installment_number || 1,
        fine_type: c.fine_type || 'none',
        fine_value: c.fine_value || 0,
        is_optional: c.is_optional || false,
      }))
    );
    setIsEditing(false);
    setDialogOpen(true);
  };

  // ─── Add Component Row ──────────────────────────────────
  const addComponentRow = () => {
    setFormComponents(prev => [...prev, {
      id: null,
      fee_type_id: '',
      amount: '',
      due_date: '',
      installment_number: 1,
      fine_type: 'none',
      fine_value: 0,
      is_optional: false,
    }]);
  };

  const removeComponentRow = (index) => {
    setFormComponents(prev => prev.filter((_, i) => i !== index));
  };

  const updateComponent = (index, field, value) => {
    setFormComponents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ─── Toggle Class Selection ─────────────────────────────
  const toggleClass = (classId) => {
    setFormData(prev => ({
      ...prev,
      applies_to_classes: prev.applies_to_classes.includes(classId)
        ? prev.applies_to_classes.filter(c => c !== classId)
        : [...prev.applies_to_classes, classId],
    }));
  };

  // ─── Save Structure ─────────────────────────────────────
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Structure name is required.' });
      return;
    }
    if (formComponents.length === 0) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Add at least one fee component.' });
      return;
    }
    for (let i = 0; i < formComponents.length; i++) {
      const comp = formComponents[i];
      if (!comp.fee_type_id) {
        toast({ variant: 'destructive', title: 'Validation Error', description: `Row ${i+1}: Fee type is required.` });
        return;
      }
      if (!comp.amount || parseFloat(comp.amount) <= 0) {
        toast({ variant: 'destructive', title: 'Validation Error', description: `Row ${i+1}: Amount must be > 0.` });
        return;
      }
    }

    setSaving(true);

    const totalAnnual = formComponents.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    const structurePayload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      billing_cycle: formData.billing_cycle,
      total_installments: formData.billing_cycle === 'annual' ? 1 : (parseInt(formData.total_installments) || 3),
      applies_to_classes: formData.applies_to_classes,
      applies_to_categories: formData.applies_to_categories,
      total_annual_amount: totalAnnual,
      is_active: true,
      branch_id: selectedBranch.id,
      session_id: currentSessionId,
      organization_id: organizationId,
    };

    let structureId = formData.id;

    if (isEditing && structureId) {
      // Update existing structure
      structurePayload.id = structureId;
      structurePayload.updated_at = new Date().toISOString();
      const { error } = await supabase.from('fee_structures').upsert(structurePayload);
      if (error) {
        toast({ variant: 'destructive', title: 'Error saving structure', description: error.message });
        setSaving(false);
        return;
      }
      // Delete old components and re-insert
      await supabase.from('fee_structure_components').delete().eq('fee_structure_id', structureId);
    } else {
      // Insert new structure
      const { data, error } = await supabase.from('fee_structures').insert(structurePayload).select('id').single();
      if (error) {
        toast({ variant: 'destructive', title: 'Error creating structure', description: error.message });
        setSaving(false);
        return;
      }
      structureId = data.id;
    }

    // Insert components
    const componentPayloads = formComponents.map((comp, idx) => ({
      fee_structure_id: structureId,
      fee_type_id: comp.fee_type_id,
      amount: parseFloat(comp.amount),
      due_date: comp.due_date || null,
      installment_number: parseInt(comp.installment_number) || 1,
      fine_type: comp.fine_type || 'none',
      fine_value: parseFloat(comp.fine_value) || 0,
      is_optional: comp.is_optional || false,
      sort_order: idx,
      branch_id: selectedBranch.id,
      session_id: currentSessionId,
      organization_id: organizationId,
    }));

    const { error: compError } = await supabase.from('fee_structure_components').insert(componentPayloads);
    if (compError) {
      toast({ variant: 'destructive', title: 'Error saving components', description: compError.message });
      setSaving(false);
      return;
    }

    // ── Propagate due_date changes to existing student_fee_ledger entries ──
    if (isEditing && structureId) {
      let ledgerUpdated = 0;
      let ledgerErrors = 0;
      for (const comp of componentPayloads) {
        const { data: updatedRows, error: updErr } = await supabase
          .from('student_fee_ledger')
          .update({
            due_date: comp.due_date,
            updated_at: new Date().toISOString(),
          })
          .eq('fee_structure_id', structureId)
          .eq('fee_type_id', comp.fee_type_id)
          .eq('installment_number', comp.installment_number)
          .select('id');

        if (updErr) {
          console.error('[FeeStructures] Ledger update error:', updErr.message, comp);
          ledgerErrors++;
        } else {
          ledgerUpdated += (updatedRows?.length || 0);
        }
      }
      console.log(`[FeeStructures] Ledger propagation: ${ledgerUpdated} entries updated, ${ledgerErrors} errors`);
    }

    toast({ title: isEditing ? 'Structure Updated!' : 'Structure Created!' });
    setDialogOpen(false);
    resetForm();
    await fetchData();
    setSaving(false);
  };

  // ─── Delete Structure ───────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;

    // Check if any ledger entries reference this structure
    const { data: ledgerEntries } = await supabase
      .from('student_fee_ledger')
      .select('id')
      .eq('fee_structure_id', deleteId)
      .limit(1);

    if (ledgerEntries && ledgerEntries.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete',
        description: 'This structure has assigned student fees. Remove those first.',
      });
      setDeleteId(null);
      return;
    }

    const { error } = await supabase.from('fee_structures').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting', description: error.message });
    } else {
      toast({ title: 'Structure Deleted' });
      await fetchData();
    }
    setDeleteId(null);
  };

  // ─── Toggle Expand ──────────────────────────────────────
  const toggleExpand = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ─── Auto-generate installment rows ─────────────────────
  const autoGenerateInstallments = () => {
    if (feeTypes.length === 0) {
      toast({ variant: 'destructive', title: 'No fee types', description: 'Create fee types first.' });
      return;
    }
    const count = formData.billing_cycle === 'annual' ? 1 : (parseInt(formData.total_installments) || 3);
    // Keep existing or create blank rows per installment
    const rows = [];
    for (let i = 1; i <= count; i++) {
      rows.push({
        id: null,
        fee_type_id: '',
        amount: '',
        due_date: '',
        installment_number: i,
        fine_type: 'none',
        fine_value: 0,
        is_optional: false,
      });
    }
    setFormComponents(rows);
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
                <Package className="h-6 w-6 text-primary" />
                Fee Structures
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Create fee packages with components, installments & due dates
              </p>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Structure
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search structures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredStructures.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Fee Structures Yet</h3>
                <p className="text-muted-foreground mt-1">
                  Create your first fee structure to define fee packages for classes.
                </p>
                <Button onClick={openCreateDialog} className="mt-4 gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create First Structure
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Structure Cards */}
          <div className="space-y-4">
            {filteredStructures.map(structure => {
              const components = (structure.fee_structure_components || [])
                .sort((a, b) => (a.installment_number || 0) - (b.installment_number || 0) || (a.sort_order || 0) - (b.sort_order || 0));
              const total = calcStructureTotal(components);
              const isExpanded = expandedIds[structure.id];
              const classNames = (structure.applies_to_classes || []).map(getClassName);

              // Group by installment
              const byInstallment = {};
              components.forEach(c => {
                const key = c.installment_number || 1;
                if (!byInstallment[key]) byInstallment[key] = [];
                byInstallment[key].push(c);
              });

              return (
                <Card key={structure.id} className="overflow-hidden">
                  {/* Card Header - Always Visible */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleExpand(structure.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base">{structure.name}</h3>
                          <Badge variant={structure.is_active ? 'default' : 'secondary'}>
                            {structure.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {structure.billing_cycle}
                          </Badge>
                          {structure.total_installments > 1 && (
                            <Badge variant="outline">
                              {structure.total_installments} Installments
                            </Badge>
                          )}
                        </div>
                        {classNames.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {classNames.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total Annual</div>
                        <div className="font-bold text-lg flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          {total.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(structure)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleDuplicate(structure)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicate</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(structure.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4">
                      {structure.description && (
                        <p className="text-sm text-muted-foreground py-2">{structure.description}</p>
                      )}
                      <div className="overflow-x-auto mt-2">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="py-2 pr-4 font-medium text-muted-foreground">Inst #</th>
                              <th className="py-2 pr-4 font-medium text-muted-foreground">Fee Type</th>
                              <th className="py-2 pr-4 font-medium text-muted-foreground text-right">Amount</th>
                              <th className="py-2 pr-4 font-medium text-muted-foreground">Due Date</th>
                              <th className="py-2 pr-4 font-medium text-muted-foreground">Fine</th>
                              <th className="py-2 font-medium text-muted-foreground">Optional</th>
                            </tr>
                          </thead>
                          <tbody>
                            {components.map((comp, idx) => (
                              <tr key={comp.id || idx} className="border-b last:border-0">
                                <td className="py-2 pr-4">{comp.installment_number || '-'}</td>
                                <td className="py-2 pr-4 font-medium">{getFeeTypeName(comp.fee_type_id)}</td>
                                <td className="py-2 pr-4 text-right font-mono">₹{parseFloat(comp.amount).toLocaleString('en-IN')}</td>
                                <td className="py-2 pr-4">{comp.due_date ? formatDate(comp.due_date) : '-'}</td>
                                <td className="py-2 pr-4">
                                  {comp.fine_type === 'none' ? '-' : `${comp.fine_type}: ${comp.fine_value}`}
                                </td>
                                <td className="py-2">{comp.is_optional ? <Badge variant="outline">Optional</Badge> : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-bold border-t">
                              <td colSpan={2} className="py-2">Total</td>
                              <td className="py-2 text-right font-mono">₹{total.toLocaleString('en-IN')}</td>
                              <td colSpan={3}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Installment Summary */}
                      {Object.keys(byInstallment).length > 1 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(byInstallment).map(([instNum, comps]) => {
                            const instTotal = comps.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
                            return (
                              <Badge key={instNum} variant="secondary" className="text-sm py-1 px-3">
                                Inst {instNum}: ₹{instTotal.toLocaleString('en-IN')}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* ─── CREATE/EDIT DIALOG ─────────────────────────── */}
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {isEditing ? 'Edit Fee Structure' : 'Create Fee Structure'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Structure Name <span className="text-destructive">*</span></Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Primary Package 2026-27"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Cycle</Label>
                    <Select
                      value={formData.billing_cycle}
                      onValueChange={(val) => setFormData({ ...formData, billing_cycle: val })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BILLING_CYCLES.map(bc => (
                          <SelectItem key={bc.value} value={bc.value}>{bc.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>
                  {formData.billing_cycle !== 'annual' && (
                    <div className="space-y-2">
                      <Label>Number of Installments</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={formData.total_installments}
                        onChange={(e) => setFormData({ ...formData, total_installments: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  )}
                </div>

                {/* Classes Selection */}
                <div className="space-y-2">
                  <Label>Applies to Classes</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
                    {classes.length === 0 ? (
                      <span className="text-muted-foreground text-sm">No classes found</span>
                    ) : (
                      classes.map(cls => (
                        <label
                          key={cls.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer transition-colors text-sm ${
                            formData.applies_to_classes.includes(cls.id)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleClass(cls.id)}
                        >
                          {cls.name}
                        </label>
                      ))
                    )}
                  </div>
                  {formData.applies_to_classes.length > 0 && (
                    <p className="text-xs text-muted-foreground">{formData.applies_to_classes.length} class(es) selected</p>
                  )}
                </div>

                {/* Fee Components Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Fee Components</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={autoGenerateInstallments}>
                        Auto-generate Rows
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={addComponentRow}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Row
                      </Button>
                    </div>
                  </div>

                  {formComponents.length === 0 ? (
                    <div className="text-center py-6 border rounded-md text-muted-foreground">
                      No components yet. Click "Add Row" or "Auto-generate Rows".
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-md">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="py-2 px-3 text-left font-medium">Inst #</th>
                            <th className="py-2 px-3 text-left font-medium">Fee Type *</th>
                            <th className="py-2 px-3 text-left font-medium">Amount *</th>
                            <th className="py-2 px-3 text-left font-medium">Due Date</th>
                            <th className="py-2 px-3 text-left font-medium">Fine Type</th>
                            <th className="py-2 px-3 text-left font-medium">Fine Value</th>
                            <th className="py-2 px-3 text-center font-medium">Optional</th>
                            <th className="py-2 px-3 text-center font-medium w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formComponents.map((comp, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="py-2 px-3">
                                <Input
                                  type="number"
                                  min={1}
                                  className="w-16 h-8"
                                  value={comp.installment_number}
                                  onChange={(e) => updateComponent(idx, 'installment_number', parseInt(e.target.value) || 1)}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Select
                                  value={comp.fee_type_id}
                                  onValueChange={(val) => updateComponent(idx, 'fee_type_id', val)}
                                >
                                  <SelectTrigger className="h-8 min-w-[160px]"><SelectValue placeholder="Select..." /></SelectTrigger>
                                  <SelectContent>
                                    {feeTypes.map(ft => (
                                      <SelectItem key={ft.id} value={ft.id}>{ft.name} ({ft.code})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="number"
                                  min={0}
                                  className="w-28 h-8"
                                  placeholder="₹"
                                  value={comp.amount}
                                  onChange={(e) => updateComponent(idx, 'amount', e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="date"
                                  className="h-8"
                                  value={comp.due_date}
                                  onChange={(e) => updateComponent(idx, 'due_date', e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Select
                                  value={comp.fine_type}
                                  onValueChange={(val) => updateComponent(idx, 'fine_type', val)}
                                >
                                  <SelectTrigger className="h-8 min-w-[100px]"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {FINE_TYPES.map(ft => (
                                      <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="number"
                                  min={0}
                                  className="w-20 h-8"
                                  value={comp.fine_value}
                                  disabled={comp.fine_type === 'none'}
                                  onChange={(e) => updateComponent(idx, 'fine_value', e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <Checkbox
                                  checked={comp.is_optional}
                                  onCheckedChange={(checked) => updateComponent(idx, 'is_optional', checked)}
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeComponentRow(idx)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t bg-muted/30 font-bold">
                            <td colSpan={2} className="py-2 px-3">Total</td>
                            <td className="py-2 px-3">
                              ₹{formComponents.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0).toLocaleString('en-IN')}
                            </td>
                            <td colSpan={5}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? 'Update Structure' : 'Create Structure'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── DELETE CONFIRMATION ─────────────────────────── */}
          <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Fee Structure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the fee structure and all its components.
                  This action cannot be undone.
                </AlertDialogDescription>
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

export default FeeStructures;
