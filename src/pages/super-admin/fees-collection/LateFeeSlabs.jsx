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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Clock, Plus, Loader2, RefreshCw, Edit, Trash2, IndianRupee, Percent,
  AlertTriangle, CheckCircle2, Calendar, Save, Settings, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════════
// LATE FEE SLABS CONFIGURATION
// Configure slab-based late fee penalties
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

const feeTypeLabels = {
  fixed: 'Fixed Amount',
  percentage: 'Percentage of Due',
  per_day_fixed: 'Per Day (Fixed)',
  per_day_percentage: 'Per Day (Percentage)',
  compound: 'Compound Interest',
};

// ─────────────────────────────────────────────────────────────────────────────────
// SLAB CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const SlabCard = ({ slab, onEdit, onDelete, onToggle }) => {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200",
      !slab.is_active && "opacity-60 bg-gray-50"
    )}>
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        slab.is_active ? "bg-green-500" : "bg-gray-300"
      )} />
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{slab.slab_name}</h3>
            <p className="text-sm text-muted-foreground">
              {slab.days_from} - {slab.days_to || '∞'} days overdue
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={slab.is_active}
              onCheckedChange={() => onToggle(slab)}
            />
            <Badge variant={slab.is_active ? 'default' : 'secondary'}>
              {slab.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            {slab.late_fee_type.includes('percentage') ? (
              <Percent className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            ) : (
              <IndianRupee className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            )}
            <p className="text-xl font-bold text-blue-700">
              {slab.late_fee_type.includes('percentage') ? `${slab.late_fee_value}%` : formatCurrency(slab.late_fee_value)}
            </p>
            <p className="text-xs text-blue-600">{feeTypeLabels[slab.late_fee_type]}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
            <IndianRupee className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-700">
              {slab.max_late_fee ? formatCurrency(slab.max_late_fee) : 'No Cap'}
            </p>
            <p className="text-xs text-amber-600">Maximum Fine</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(slab)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onDelete(slab)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// LATE FEE CALCULATOR PREVIEW
// ─────────────────────────────────────────────────────────────────────────────────

const LateFeePreview = ({ slabs }) => {
  const [testAmount, setTestAmount] = useState(10000);
  const [testDays, setTestDays] = useState(15);

  const calculateLateFee = () => {
    if (testDays <= 0) return { lateFee: 0, slab: null };

    // Find applicable slab
    const applicableSlab = slabs
      .filter(s => s.is_active)
      .filter(s => s.days_from <= testDays && (s.days_to === null || s.days_to >= testDays))
      .sort((a, b) => b.days_from - a.days_from)[0];

    if (!applicableSlab) return { lateFee: 0, slab: null };

    let lateFee = 0;
    switch (applicableSlab.late_fee_type) {
      case 'fixed':
        lateFee = applicableSlab.late_fee_value;
        break;
      case 'percentage':
        lateFee = (testAmount * applicableSlab.late_fee_value) / 100;
        break;
      case 'per_day_fixed':
        lateFee = applicableSlab.late_fee_value * testDays;
        break;
      case 'per_day_percentage':
        lateFee = (testAmount * applicableSlab.late_fee_value * testDays) / 100;
        break;
      case 'compound':
        lateFee = testAmount * (Math.pow(1 + applicableSlab.late_fee_value / 100, testDays) - 1);
        break;
    }

    if (applicableSlab.max_late_fee && lateFee > applicableSlab.max_late_fee) {
      lateFee = applicableSlab.max_late_fee;
    }

    return { lateFee: Math.round(lateFee), slab: applicableSlab };
  };

  const result = calculateLateFee();

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Late Fee Calculator Preview
        </CardTitle>
        <CardDescription>Test your slab configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Due Amount (₹)</Label>
            <Input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Days Overdue</Label>
            <Input
              type="number"
              value={testDays}
              onChange={(e) => setTestDays(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Calculated Late Fee</p>
            {result.slab && (
              <p className="text-xs text-muted-foreground">
                Slab: {result.slab.slab_name}
              </p>
            )}
          </div>
          <p className={cn(
            "text-2xl font-bold",
            result.lateFee > 0 ? "text-red-600" : "text-green-600"
          )}>
            {formatCurrency(result.lateFee)}
          </p>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total Payable:</span>
          <span className="font-bold">{formatCurrency(testAmount + result.lateFee)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const LateFeeSlabs = () => {
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slabs, setSlabs] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    slab_name: '',
    days_from: 1,
    days_to: 15,
    late_fee_type: 'per_day_fixed',
    late_fee_value: 10,
    max_late_fee: null,
    fee_type_id: null,
    is_active: true,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchSlabs = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    try {
      // Fetch slabs without relation join (fee_types lookup done separately)
      const { data, error } = await supabase
        .from('late_fee_slabs')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSlabs(data || []);
    } catch (error) {
      console.error('Fetch slabs error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load late fee slabs' });
    }
    setLoading(false);
  }, [branchId, toast]);

  const fetchFeeTypes = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from('fee_types')
      .select('id, name')
      .eq('branch_id', branchId)
      .order('name');
    setFeeTypes(data || []);
  }, [branchId]);

  useEffect(() => {
    fetchSlabs();
    fetchFeeTypes();
  }, [fetchSlabs, fetchFeeTypes]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      slab_name: '',
      days_from: 1,
      days_to: 15,
      late_fee_type: 'per_day_fixed',
      late_fee_value: 10,
      max_late_fee: null,
      fee_type_id: null,
      is_active: true,
    });
    setEditMode(false);
    setSelectedSlab(null);
  };

  const handleCreateNew = () => {
    resetForm();
    // Auto-suggest next slab range
    if (slabs.length > 0) {
      const lastSlab = slabs[slabs.length - 1];
      if (lastSlab.days_to) {
        setFormData(prev => ({
          ...prev,
          days_from: lastSlab.days_to + 1,
          days_to: lastSlab.days_to + 15,
        }));
      }
    }
    setShowCreateDialog(true);
  };

  const handleEdit = (slab) => {
    setFormData({
      slab_name: slab.slab_name,
      days_from: slab.days_from,
      days_to: slab.days_to,
      late_fee_type: slab.late_fee_type,
      late_fee_value: slab.late_fee_value,
      max_late_fee: slab.max_late_fee,
      fee_type_id: slab.fee_type_id,
      is_active: slab.is_active,
    });
    setSelectedSlab(slab);
    setEditMode(true);
    setShowCreateDialog(true);
  };

  const handleDelete = (slab) => {
    setSelectedSlab(slab);
    setShowDeleteDialog(true);
  };

  const handleToggle = async (slab) => {
    try {
      const { error } = await supabase
        .from('late_fee_slabs')
        .update({ 
          is_active: !slab.is_active,
          updated_at: new Date().toISOString() 
        })
        .eq('id', slab.id);

      if (error) throw error;
      toast({ title: 'Success', description: `Slab ${slab.is_active ? 'deactivated' : 'activated'}` });
      fetchSlabs();
    } catch (error) {
      console.error('Toggle error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update slab' });
    }
  };

  const confirmDelete = async () => {
    if (!selectedSlab) return;
    
    try {
      const { error } = await supabase
        .from('late_fee_slabs')
        .delete()
        .eq('id', selectedSlab.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Slab deleted successfully' });
      fetchSlabs();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete slab' });
    }
    setShowDeleteDialog(false);
    setSelectedSlab(null);
  };

  const handleSave = async () => {
    if (!formData.slab_name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Slab name is required' });
      return;
    }

    if (formData.days_from < 1) {
      toast({ variant: 'destructive', title: 'Error', description: 'Days from must be at least 1' });
      return;
    }

    setSaving(true);
    
    try {
      const slabData = {
        slab_name: formData.slab_name,
        days_from: formData.days_from,
        days_to: formData.days_to || null,
        late_fee_type: formData.late_fee_type,
        late_fee_value: formData.late_fee_value,
        max_late_fee: formData.max_late_fee || null,
        fee_type_id: formData.fee_type_id || null,
        is_active: formData.is_active,
        branch_id: branchId,
        organization_id: organizationId,
        updated_at: new Date().toISOString(),
      };

      if (editMode && selectedSlab) {
        const { error } = await supabase
          .from('late_fee_slabs')
          .update(slabData)
          .eq('id', selectedSlab.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Slab updated successfully' });
      } else {
        const { error } = await supabase
          .from('late_fee_slabs')
          .insert(slabData);

        if (error) throw error;
        toast({ title: 'Success', description: 'Slab created successfully' });
      }

      setShowCreateDialog(false);
      resetForm();
      fetchSlabs();
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save slab' });
    }
    setSaving(false);
  };

  const handleCreateDefaults = async () => {
    try {
      const defaultSlabs = [
        { slab_name: '1-15 Days Late', days_from: 1, days_to: 15, late_fee_type: 'per_day_fixed', late_fee_value: 10, max_late_fee: 100 },
        { slab_name: '16-30 Days Late', days_from: 16, days_to: 30, late_fee_type: 'per_day_fixed', late_fee_value: 20, max_late_fee: 300 },
        { slab_name: '31-60 Days Late', days_from: 31, days_to: 60, late_fee_type: 'per_day_fixed', late_fee_value: 30, max_late_fee: 500 },
        { slab_name: '60+ Days Late', days_from: 61, days_to: null, late_fee_type: 'percentage', late_fee_value: 10, max_late_fee: 1000 },
      ];

      const slabsToInsert = defaultSlabs.map(s => ({
        ...s,
        is_active: true,
        branch_id: branchId,
        organization_id: organizationId,
      }));

      const { error } = await supabase
        .from('late_fee_slabs')
        .insert(slabsToInsert);

      if (error) throw error;
      toast({ title: 'Success', description: '4 default slabs created' });
      fetchSlabs();
    } catch (error) {
      console.error('Create defaults error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create default slabs' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading Late Fee Configuration...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              Late Fee Configuration
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure slab-based late fee penalties
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchSlabs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {slabs.length === 0 && (
              <Button variant="outline" onClick={handleCreateDefaults}>
                <Settings className="h-4 w-4 mr-2" />
                Create Defaults
              </Button>
            )}
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slab
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* MAIN CONTENT */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Slabs List */}
          <div className="lg:col-span-2 space-y-4">
            {slabs.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Late Fee Slabs Configured</h3>
                <p className="text-muted-foreground mb-6">
                  Create slabs to automatically calculate late fees
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={handleCreateDefaults}>
                    <Settings className="h-4 w-4 mr-2" />
                    Create Defaults
                  </Button>
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Slab
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slabs.map((slab) => (
                  <SlabCard
                    key={slab.id}
                    slab={slab}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Calculator Preview */}
          <div>
            <LateFeePreview slabs={slabs} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* CREATE/EDIT DIALOG */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowCreateDialog(open); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {editMode ? 'Edit Late Fee Slab' : 'Create Late Fee Slab'}
              </DialogTitle>
              <DialogDescription>
                Define the late fee calculation for a specific day range
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="slab_name">Slab Name *</Label>
                <Input
                  id="slab_name"
                  value={formData.slab_name}
                  onChange={(e) => setFormData({ ...formData, slab_name: e.target.value })}
                  placeholder="e.g., 1-15 Days Late"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="days_from">From Day *</Label>
                  <Input
                    id="days_from"
                    type="number"
                    min="1"
                    value={formData.days_from}
                    onChange={(e) => setFormData({ ...formData, days_from: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days_to">To Day (leave empty for ∞)</Label>
                  <Input
                    id="days_to"
                    type="number"
                    value={formData.days_to || ''}
                    onChange={(e) => setFormData({ ...formData, days_to: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="late_fee_type">Calculation Type *</Label>
                <Select 
                  value={formData.late_fee_type} 
                  onValueChange={(val) => setFormData({ ...formData, late_fee_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount (one-time)</SelectItem>
                    <SelectItem value="percentage">Percentage of Due Amount</SelectItem>
                    <SelectItem value="per_day_fixed">Per Day (Fixed Amount)</SelectItem>
                    <SelectItem value="per_day_percentage">Per Day (Percentage)</SelectItem>
                    <SelectItem value="compound">Compound Interest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="late_fee_value">
                    {formData.late_fee_type.includes('percentage') ? 'Percentage (%)' : 'Amount (₹)'}
                  </Label>
                  <Input
                    id="late_fee_value"
                    type="number"
                    min="0"
                    step={formData.late_fee_type.includes('percentage') ? '0.1' : '1'}
                    value={formData.late_fee_value}
                    onChange={(e) => setFormData({ ...formData, late_fee_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_late_fee">Maximum Fine (₹)</Label>
                  <Input
                    id="max_late_fee"
                    type="number"
                    min="0"
                    value={formData.max_late_fee || ''}
                    onChange={(e) => setFormData({ ...formData, max_late_fee: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="No cap"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee_type_id">Specific Fee Type (Optional)</Label>
                <Select 
                  value={formData.fee_type_id || 'all'} 
                  onValueChange={(val) => setFormData({ ...formData, fee_type_id: val === 'all' ? null : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Apply to all fee types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fee Types</SelectItem>
                    {feeTypes.map(ft => (
                      <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editMode ? 'Update Slab' : 'Create Slab'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* DELETE CONFIRMATION */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Late Fee Slab?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedSlab?.slab_name}"? 
                This may affect late fee calculations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default LateFeeSlabs;
