/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LATE FEE CONFIGURATION
 * Day 30 Implementation - Fee Collection Phase 3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Late fee slab configuration
 * - Fixed amount / percentage based
 * - Grace period settings
 * - Per fee type rules
 * - Maximum cap settings
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Clock, 
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Settings,
  Calculator,
  IndianRupee,
  Percent,
  Calendar,
  Edit,
  Info,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function LateFeeConfig() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feeTypes, setFeeTypes] = useState([]);
  
  // Global settings
  const [globalConfig, setGlobalConfig] = useState({
    enabled: true,
    gracePeriodDays: 7,
    applyToAllFeeTypes: true,
    calculationType: 'fixed', // fixed, percentage, slab
    fixedAmount: 50,
    percentageRate: 2,
    maxLateFee: 0, // 0 = no cap
    compoundDaily: false,
    roundingMethod: 'round', // round, ceil, floor
    exemptCategories: []
  });

  // Slabs for slab-based calculation
  const [slabs, setSlabs] = useState([
    { id: 1, fromDays: 1, toDays: 15, type: 'fixed', amount: 50 },
    { id: 2, fromDays: 16, toDays: 30, type: 'fixed', amount: 100 },
    { id: 3, fromDays: 31, toDays: 60, type: 'percentage', amount: 5 },
    { id: 4, fromDays: 61, toDays: 999, type: 'percentage', amount: 10 }
  ]);

  // Fee type specific rules
  const [feeTypeRules, setFeeTypeRules] = useState({});

  // Student categories
  const [categories, setCategories] = useState([
    { id: 'general', name: 'General', exempt: false },
    { id: 'sc', name: 'SC', exempt: false },
    { id: 'st', name: 'ST', exempt: false },
    { id: 'obc', name: 'OBC', exempt: false },
    { id: 'bpl', name: 'BPL', exempt: true },
    { id: 'staff', name: 'Staff Ward', exempt: true }
  ]);

  // Load existing config
  useEffect(() => {
    loadConfig();
    loadFeeTypes();
  }, [organizationId, branchId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fee_late_fee_config')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('branch_id', branchId)
        .single();

      if (data) {
        setGlobalConfig(prev => ({
          ...prev,
          ...data.global_config
        }));
        if (data.slabs) setSlabs(data.slabs);
        if (data.fee_type_rules) setFeeTypeRules(data.fee_type_rules);
        if (data.exempt_categories) {
          setCategories(prev => prev.map(cat => ({
            ...cat,
            exempt: data.exempt_categories.includes(cat.id)
          })));
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeeTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('fee_types')
        .select('id, name')
        .eq('branch_id', branchId)
        .eq('is_active', true);

      if (error) throw error;
      setFeeTypes(data || []);
    } catch (error) {
      console.error('Error loading fee types:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const configData = {
        organization_id: organizationId,
        branch_id: branchId,
        session_id: currentSessionId,
        global_config: globalConfig,
        slabs: slabs,
        fee_type_rules: feeTypeRules,
        exempt_categories: categories.filter(c => c.exempt).map(c => c.id),
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('fee_late_fee_config')
        .upsert(configData, {
          onConflict: 'organization_id,branch_id'
        });

      if (error) throw error;
      toast.success('Late fee configuration saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const addSlab = () => {
    const lastSlab = slabs[slabs.length - 1];
    setSlabs([...slabs, {
      id: Date.now(),
      fromDays: (lastSlab?.toDays || 0) + 1,
      toDays: (lastSlab?.toDays || 0) + 30,
      type: 'fixed',
      amount: 100
    }]);
  };

  const removeSlab = (id) => {
    setSlabs(slabs.filter(s => s.id !== id));
  };

  const updateSlab = (id, field, value) => {
    setSlabs(slabs.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Calculate example late fee
  const calculateExample = (daysOverdue, amount) => {
    if (!globalConfig.enabled || daysOverdue <= globalConfig.gracePeriodDays) {
      return 0;
    }

    const effectiveDays = daysOverdue - globalConfig.gracePeriodDays;

    switch (globalConfig.calculationType) {
      case 'fixed':
        return globalConfig.compoundDaily 
          ? globalConfig.fixedAmount * effectiveDays
          : globalConfig.fixedAmount;
      
      case 'percentage':
        const percentFee = (amount * globalConfig.percentageRate / 100);
        return globalConfig.compoundDaily
          ? percentFee * effectiveDays
          : percentFee;
      
      case 'slab':
        const applicableSlab = slabs.find(s => 
          effectiveDays >= s.fromDays && effectiveDays <= s.toDays
        );
        if (!applicableSlab) return 0;
        return applicableSlab.type === 'fixed'
          ? applicableSlab.amount
          : (amount * applicableSlab.amount / 100);
      
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Late Fee Configuration</h1>
          <p className="text-muted-foreground">
            Configure automatic late fee calculation rules
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Late Fee Settings</CardTitle>
                <CardDescription>Global rules for late fee calculation</CardDescription>
              </div>
            </div>
            <Switch
              checked={globalConfig.enabled}
              onCheckedChange={(checked) => 
                setGlobalConfig(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>
        </CardHeader>
        
        {globalConfig.enabled && (
          <CardContent className="space-y-6">
            {/* Grace Period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Grace Period (Days)</Label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={globalConfig.gracePeriodDays}
                  onChange={(e) => 
                    setGlobalConfig(prev => ({ 
                      ...prev, 
                      gracePeriodDays: parseInt(e.target.value) || 0 
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Days after due date before late fee applies
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Calculation Method</Label>
                <Select
                  value={globalConfig.calculationType}
                  onValueChange={(v) => 
                    setGlobalConfig(prev => ({ ...prev, calculationType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage of Fee</SelectItem>
                    <SelectItem value="slab">Slab-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Maximum Late Fee</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    value={globalConfig.maxLateFee}
                    onChange={(e) => 
                      setGlobalConfig(prev => ({ 
                        ...prev, 
                        maxLateFee: parseFloat(e.target.value) || 0 
                      }))
                    }
                    className="pl-10"
                    placeholder="0 = No cap"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  0 means no maximum limit
                </p>
              </div>
            </div>

            <Separator />

            {/* Fixed / Percentage Options */}
            {globalConfig.calculationType === 'fixed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fixed Late Fee Amount (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      value={globalConfig.fixedAmount}
                      onChange={(e) => 
                        setGlobalConfig(prev => ({ 
                          ...prev, 
                          fixedAmount: parseFloat(e.target.value) || 0 
                        }))
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Switch
                    checked={globalConfig.compoundDaily}
                    onCheckedChange={(checked) => 
                      setGlobalConfig(prev => ({ ...prev, compoundDaily: checked }))
                    }
                  />
                  <div>
                    <Label>Compound Daily</Label>
                    <p className="text-sm text-muted-foreground">
                      Add ₹{globalConfig.fixedAmount} for each day overdue
                    </p>
                  </div>
                </div>
              </div>
            )}

            {globalConfig.calculationType === 'percentage' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Late Fee Percentage (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={globalConfig.percentageRate}
                      onChange={(e) => 
                        setGlobalConfig(prev => ({ 
                          ...prev, 
                          percentageRate: parseFloat(e.target.value) || 0 
                        }))
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Switch
                    checked={globalConfig.compoundDaily}
                    onCheckedChange={(checked) => 
                      setGlobalConfig(prev => ({ ...prev, compoundDaily: checked }))
                    }
                  />
                  <div>
                    <Label>Compound Daily</Label>
                    <p className="text-sm text-muted-foreground">
                      Add {globalConfig.percentageRate}% per day overdue
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Slab-based Configuration */}
            {globalConfig.calculationType === 'slab' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Late Fee Slabs</Label>
                  <Button variant="outline" size="sm" onClick={addSlab} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Slab
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From (Days)</TableHead>
                      <TableHead>To (Days)</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount / %</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slabs.map((slab, index) => (
                      <TableRow key={slab.id}>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={slab.fromDays}
                            onChange={(e) => updateSlab(slab.id, 'fromDays', parseInt(e.target.value))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={slab.fromDays}
                            value={slab.toDays}
                            onChange={(e) => updateSlab(slab.id, 'toDays', parseInt(e.target.value))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={slab.type}
                            onValueChange={(v) => updateSlab(slab.id, 'type', v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed (₹)</SelectItem>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={slab.amount}
                            onChange={(e) => updateSlab(slab.id, 'amount', parseFloat(e.target.value))}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSlab(slab.id)}
                            disabled={slabs.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Example Calculator */}
      {globalConfig.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Late Fee Calculator Preview
            </CardTitle>
            <CardDescription>See how late fees will be calculated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '10 days overdue', days: 10, amount: 5000 },
                { label: '30 days overdue', days: 30, amount: 5000 },
                { label: '60 days overdue', days: 60, amount: 10000 },
                { label: '90 days overdue', days: 90, amount: 10000 }
              ].map((example) => {
                const lateFee = calculateExample(example.days, example.amount);
                const capped = globalConfig.maxLateFee > 0 && lateFee > globalConfig.maxLateFee;
                const finalFee = capped ? globalConfig.maxLateFee : lateFee;
                
                return (
                  <div key={example.days} className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">{example.label}</p>
                    <p className="text-xs text-muted-foreground mb-2">on ₹{example.amount.toLocaleString('en-IN')} fee</p>
                    <p className="text-xl font-bold text-orange-600">
                      +₹{Math.round(finalFee).toLocaleString('en-IN')}
                    </p>
                    {capped && (
                      <Badge variant="secondary" className="text-xs mt-1">Capped</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exempt Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exempt Categories</CardTitle>
          <CardDescription>
            Select student categories that are exempt from late fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  category.exempt ? 'border-green-500 bg-green-50' : 'hover:bg-accent'
                }`}
                onClick={() => {
                  setCategories(prev => prev.map(c => 
                    c.id === category.id ? { ...c, exempt: !c.exempt } : c
                  ));
                }}
              >
                <Checkbox checked={category.exempt} />
                <span className="font-medium">{category.name}</span>
                {category.exempt && (
                  <Badge variant="outline" className="ml-auto text-green-600 border-green-600">
                    Exempt
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>How Late Fees Work:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Late fees are calculated automatically when payment is made after due date</li>
                <li>Grace period is counted from the due date (e.g., 7 days grace = no fee until day 8)</li>
                <li>For slab-based calculation, the system picks the applicable slab based on days overdue</li>
                <li>All late fees can be waived manually by admin at time of collection</li>
                <li>Exempt categories will never have late fees applied</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
