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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  FileText, Plus, Loader2, MoreVertical, Pencil, Trash2, Copy, Eye, Check,
  IndianRupee, Calendar, Tag, Users, Building2, GraduationCap, Search,
  Filter, Download, Upload, AlertCircle, CheckCircle2, Clock, Target,
  Layers, Package, Settings, Save, X, ChevronDown, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// FEE TEMPLATES - World-Class Fee Template Management
// Create, manage, and assign fee templates for different categories
// Designed for 500+ schools, built to last 100+ years
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

// ─────────────────────────────────────────────────────────────────────────────────
// TEMPLATE CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const TemplateCard = ({ template, onEdit, onDelete, onDuplicate, onPreview, onAssign, onUseTemplate }) => {
  const totalAmount = template.fee_head_splits?.reduce((sum, h) => sum + (h.amount || 0), 0) || 0;
  const headsCount = template.fee_head_splits?.length || 0;
  const isSystem = template.is_system_template;
  
  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200 group",
      isSystem && "border-2 border-amber-400 bg-amber-50/30 dark:bg-amber-900/10"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{template.template_name}</CardTitle>
              {isSystem && (
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-400">
                  🌟 Ready Template
                </Badge>
              )}
              {template.is_default && (
                <Badge variant="secondary" className="text-xs">Default</Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {template.description || 'No description provided'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(template)}>
                <Eye className="h-4 w-4 mr-2" /> Preview
              </DropdownMenuItem>
              {isSystem ? (
                <DropdownMenuItem onClick={() => onUseTemplate(template)} className="text-green-600 focus:text-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Use This Template
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onEdit(template)}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(template)}>
                    <Copy className="h-4 w-4 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAssign(template)}>
                    <Users className="h-4 w-4 mr-2" /> Assign to Class
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(template)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <IndianRupee className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-blue-600">Total Amount</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Layers className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-700">{headsCount}</p>
            <p className="text-xs text-purple-600">Fee Heads</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-700">{template.assigned_count || 0}</p>
            <p className="text-xs text-green-600">Assigned</p>
          </div>
        </div>
        {template.applicable_for && (
          <div className="mt-4 flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Applicable: {template.applicable_for}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onPreview(template)}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button size="sm" className="flex-1" onClick={() => onAssign(template)}>
          <Users className="h-4 w-4 mr-2" />
          Assign
        </Button>
      </CardFooter>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// FEE HEAD EDITOR
// ─────────────────────────────────────────────────────────────────────────────────

const FeeHeadEditor = ({ heads, feeTypes, onChange }) => {
  const addHead = () => {
    onChange([
      ...heads,
      {
        id: `new_${Date.now()}`,
        fee_type_id: '',
        head_name: '',
        amount: 0,
        is_optional: false,
        due_date_offset: 30,
        installment_allowed: true,
      }
    ]);
  };

  const updateHead = (index, field, value) => {
    const updated = [...heads];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill head name from fee type
    if (field === 'fee_type_id' && value) {
      const feeType = feeTypes.find(ft => ft.id === value);
      if (feeType) {
        updated[index].head_name = feeType.name;
      }
    }
    
    onChange(updated);
  };

  const removeHead = (index) => {
    onChange(heads.filter((_, i) => i !== index));
  };

  const totalAmount = heads.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Fee Heads</Label>
        <Button variant="outline" size="sm" onClick={addHead}>
          <Plus className="h-4 w-4 mr-2" />
          Add Head
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Fee Type</TableHead>
              <TableHead>Head Name</TableHead>
              <TableHead className="w-[120px]">Amount</TableHead>
              <TableHead className="w-[100px] text-center">Optional</TableHead>
              <TableHead className="w-[120px]">Due Days</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {heads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No fee heads added. Click "Add Head" to start.
                </TableCell>
              </TableRow>
            ) : (
              heads.map((head, index) => (
                <TableRow key={head.id || index}>
                  <TableCell>
                    <Select 
                      value={head.fee_type_id} 
                      onValueChange={(val) => updateHead(index, 'fee_type_id', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {feeTypes.map(ft => (
                          <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={head.head_name}
                      onChange={(e) => updateHead(index, 'head_name', e.target.value)}
                      placeholder="Head name"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <IndianRupee className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={head.amount}
                        onChange={(e) => updateHead(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="pl-7"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={head.is_optional}
                      onCheckedChange={(checked) => updateHead(index, 'is_optional', checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={head.due_date_offset}
                      onChange={(e) => updateHead(index, 'due_date_offset', parseInt(e.target.value) || 0)}
                      placeholder="Days"
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeHead(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-end p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Template Amount</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const FeeTemplates = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterApplicable, setFilterApplicable] = useState('all');

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [systemTemplates, setSystemTemplates] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    template_name: '',
    template_code: '',
    description: '',
    applicable_for: 'all',
    is_default: false,
    fee_head_splits: [],
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    try {
      // First fetch branch-specific templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('fee_templates')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_system_template', false)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      
      // Fetch system templates (organization-wide ready templates)
      const { data: sysTemplates } = await supabase
        .from('fee_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_system_template', true)
        .order('template_name', { ascending: true });
      
      // Fetch fee heads for branch templates
      const templatesWithHeads = await Promise.all(
        (templatesData || []).map(async (template) => {
          const { data: heads } = await supabase
            .from('fee_head_splits')
            .select('*')
            .eq('template_id', template.id)
            .order('display_order', { ascending: true });
          
          return {
            ...template,
            fee_head_splits: heads || []
          };
        })
      );
      
      // Fetch fee heads for system templates
      const sysTemplatesWithHeads = await Promise.all(
        (sysTemplates || []).map(async (template) => {
          const { data: heads } = await supabase
            .from('fee_head_splits')
            .select('*')
            .eq('template_id', template.id)
            .order('display_order', { ascending: true });
          
          return {
            ...template,
            fee_head_splits: heads || []
          };
        })
      );
      
      setTemplates(templatesWithHeads);
      setSystemTemplates(sysTemplatesWithHeads);
    } catch (error) {
      console.error('Fetch templates error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load templates' });
    }
    setLoading(false);
  }, [branchId, organizationId, toast]);

  const fetchFeeTypes = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from('fee_types')
      .select('id, name')
      .eq('branch_id', branchId)
      .order('name');
    setFeeTypes(data || []);
  }, [branchId]);

  const fetchClasses = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from('classes')
      .select('id, name')
      .eq('branch_id', branchId)
      .order('name');
    setClasses(data || []);
  }, [branchId]);

  useEffect(() => {
    fetchTemplates();
    fetchFeeTypes();
    fetchClasses();
  }, [fetchTemplates, fetchFeeTypes, fetchClasses]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 10 DEFAULT FEE TEMPLATES - Ready to Use
  // ─────────────────────────────────────────────────────────────────────────────

  const DEFAULT_TEMPLATES = [
    {
      template_name: 'CBSE School - Standard',
      template_code: 'CBSE-STD-001',
      description: 'Standard fee structure for CBSE affiliated schools. Includes tuition, exam, lab, and development fees.',
      applicable_for: 'all',
      fee_heads: [
        { head_name: 'Tuition Fee', amount: 35000, is_optional: false },
        { head_name: 'Admission Fee', amount: 5000, is_optional: false },
        { head_name: 'Examination Fee', amount: 3000, is_optional: false },
        { head_name: 'Lab Fee', amount: 4000, is_optional: false },
        { head_name: 'Library Fee', amount: 2000, is_optional: false },
        { head_name: 'Development Fee', amount: 5000, is_optional: false },
        { head_name: 'Sports Fee', amount: 2500, is_optional: true },
        { head_name: 'Computer Fee', amount: 3000, is_optional: false },
      ]
    },
    {
      template_name: 'ICSE School - Premium',
      template_code: 'ICSE-PRM-001',
      description: 'Premium fee structure for ICSE schools with additional activity fees.',
      applicable_for: 'all',
      fee_heads: [
        { head_name: 'Tuition Fee', amount: 55000, is_optional: false },
        { head_name: 'Admission Fee', amount: 15000, is_optional: false },
        { head_name: 'Examination Fee', amount: 5000, is_optional: false },
        { head_name: 'Lab Fee', amount: 6000, is_optional: false },
        { head_name: 'Library Fee', amount: 3000, is_optional: false },
        { head_name: 'Development Fee', amount: 8000, is_optional: false },
        { head_name: 'Activity Fee', amount: 5000, is_optional: true },
        { head_name: 'Smart Class Fee', amount: 4000, is_optional: false },
      ]
    },
    {
      template_name: 'State Board - Budget',
      template_code: 'STATE-BUD-001',
      description: 'Affordable fee structure for state board schools.',
      applicable_for: 'all',
      fee_heads: [
        { head_name: 'Tuition Fee', amount: 15000, is_optional: false },
        { head_name: 'Admission Fee', amount: 2000, is_optional: false },
        { head_name: 'Examination Fee', amount: 1500, is_optional: false },
        { head_name: 'Lab Fee', amount: 2000, is_optional: false },
        { head_name: 'Development Fee', amount: 2500, is_optional: false },
      ]
    },
    {
      template_name: 'PU College - Science',
      template_code: 'PUC-SCI-001',
      description: 'Pre-University College fee structure for Science stream (PCMB/PCMC).',
      applicable_for: 'science',
      fee_heads: [
        { head_name: 'Tuition Fee', amount: 45000, is_optional: false },
        { head_name: 'Admission Fee', amount: 5000, is_optional: false },
        { head_name: 'Lab Fee (Physics)', amount: 4000, is_optional: false },
        { head_name: 'Lab Fee (Chemistry)', amount: 4000, is_optional: false },
        { head_name: 'Lab Fee (Biology/CS)', amount: 3500, is_optional: false },
        { head_name: 'Library Fee', amount: 2000, is_optional: false },
        { head_name: 'Examination Fee', amount: 4000, is_optional: false },
      ]
    },
    {
      template_name: 'PU College - Commerce',
      template_code: 'PUC-COM-001',
      description: 'Pre-University College fee structure for Commerce stream.',
      applicable_for: 'commerce',
      fee_heads: [
        { head_name: 'Tuition Fee', amount: 35000, is_optional: false },
        { head_name: 'Admission Fee', amount: 4000, is_optional: false },
        { head_name: 'Computer Lab Fee', amount: 3000, is_optional: false },
        { head_name: 'Library Fee', amount: 2000, is_optional: false },
        { head_name: 'Examination Fee', amount: 3500, is_optional: false },
        { head_name: 'Study Material', amount: 2500, is_optional: true },
      ]
    },
    {
      template_name: 'Degree College - BA/BCom',
      template_code: 'DEG-BA-001',
      description: 'Undergraduate degree program fee structure for Arts and Commerce.',
      applicable_for: 'arts',
      fee_heads: [
        { head_name: 'Tuition Fee', amount: 25000, is_optional: false },
        { head_name: 'Admission Fee', amount: 3000, is_optional: false },
        { head_name: 'University Fee', amount: 8000, is_optional: false },
        { head_name: 'Library Fee', amount: 1500, is_optional: false },
        { head_name: 'Examination Fee', amount: 3000, is_optional: false },
        { head_name: 'Sports Fee', amount: 1000, is_optional: true },
      ]
    },
    {
      template_name: 'Degree College - BSc',
      template_code: 'DEG-BSC-001',
      description: 'Bachelor of Science program fee structure with lab components.',
      applicable_for: 'science',
      fee_heads: [
        { head_name: 'Tuition Fee', amount: 35000, is_optional: false },
        { head_name: 'Admission Fee', amount: 4000, is_optional: false },
        { head_name: 'University Fee', amount: 10000, is_optional: false },
        { head_name: 'Lab Fee', amount: 6000, is_optional: false },
        { head_name: 'Library Fee', amount: 2000, is_optional: false },
        { head_name: 'Examination Fee', amount: 4000, is_optional: false },
        { head_name: 'Project Fee', amount: 3000, is_optional: true },
      ]
    },
    {
      template_name: 'Coaching Institute - IIT/JEE',
      template_code: 'COACH-JEE-001',
      description: 'IIT-JEE coaching program fee structure with test series.',
      applicable_for: 'coaching',
      fee_heads: [
        { head_name: 'Coaching Fee', amount: 95000, is_optional: false },
        { head_name: 'Admission Fee', amount: 10000, is_optional: false },
        { head_name: 'Study Material', amount: 15000, is_optional: false },
        { head_name: 'Test Series Fee', amount: 8000, is_optional: false },
        { head_name: 'Doubt Session Fee', amount: 5000, is_optional: true },
      ]
    },
    {
      template_name: 'Coaching Institute - NEET',
      template_code: 'COACH-NEET-001',
      description: 'NEET medical entrance coaching program fee structure.',
      applicable_for: 'coaching',
      fee_heads: [
        { head_name: 'Coaching Fee', amount: 85000, is_optional: false },
        { head_name: 'Admission Fee', amount: 8000, is_optional: false },
        { head_name: 'Study Material', amount: 12000, is_optional: false },
        { head_name: 'Test Series Fee', amount: 6000, is_optional: false },
        { head_name: 'Online Classes', amount: 5000, is_optional: true },
      ]
    },
    {
      template_name: 'Hostel Fee - Standard',
      template_code: 'HOSTEL-STD-001',
      description: 'Hostel accommodation fee with meals included.',
      applicable_for: 'hostel',
      fee_heads: [
        { head_name: 'Room Rent', amount: 36000, is_optional: false },
        { head_name: 'Mess Fee', amount: 30000, is_optional: false },
        { head_name: 'Hostel Admission', amount: 5000, is_optional: false },
        { head_name: 'Security Deposit', amount: 10000, is_optional: false },
        { head_name: 'Laundry Fee', amount: 3000, is_optional: true },
        { head_name: 'WiFi Charges', amount: 2000, is_optional: true },
      ]
    }
  ];

  const seedDefaultTemplates = async () => {
    if (!organizationId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Organization not found' });
      return;
    }

    setSeeding(true);
    let created = 0;
    let skipped = 0;

    try {
      for (const template of DEFAULT_TEMPLATES) {
        // Check if template already exists
        const { data: existing } = await supabase
          .from('fee_templates')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('template_code', template.template_code)
          .eq('is_system_template', true)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Create template
        const { data: newTemplate, error: templateError } = await supabase
          .from('fee_templates')
          .insert({
            name: template.template_name, // Required NOT NULL column
            template_name: template.template_name,
            template_code: template.template_code,
            description: template.description,
            applicable_for: template.applicable_for,
            is_default: false,
            is_system_template: true,
            total_amount: template.fee_heads.reduce((sum, h) => sum + h.amount, 0),
            branch_id: branchId,
            organization_id: organizationId,
          })
          .select()
          .single();

        if (templateError) {
          console.error('Error creating template:', template.template_name, templateError);
          continue;
        }

        // Create fee heads
        const feeHeads = template.fee_heads.map((h, idx) => ({
          template_id: newTemplate.id,
          split_name: h.head_name, // Required NOT NULL column
          head_name: h.head_name,
          amount: h.amount,
          is_optional: h.is_optional,
          due_date_offset: 30,
          installment_allowed: true,
          display_order: idx + 1,
          branch_id: branchId,
          organization_id: organizationId,
        }));

        await supabase.from('fee_head_splits').insert(feeHeads);
        created++;
      }

      toast({
        title: 'Success!',
        description: `Created ${created} templates, ${skipped} already existed`,
      });
      fetchTemplates();
    } catch (error) {
      console.error('Seed error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to seed templates' });
    }
    setSeeding(false);
  };

  const handleUseTemplate = async (systemTemplate) => {
    // Copy system template to current branch as new template
    setSeeding(true);
    
    try {
      // Check if already copied
      const { data: existing } = await supabase
        .from('fee_templates')
        .select('id')
        .eq('branch_id', branchId)
        .eq('template_code', `${systemTemplate.template_code}-COPY`)
        .eq('is_system_template', false)
        .maybeSingle();

      if (existing) {
        toast({ 
          variant: 'destructive', 
          title: 'Already Exists', 
          description: 'This template has already been copied to your branch' 
        });
        setSeeding(false);
        return;
      }

      // Create copy
      const { data: newTemplate, error } = await supabase
        .from('fee_templates')
        .insert({
          name: `${systemTemplate.template_name || systemTemplate.name} (Copy)`, // Required NOT NULL
          template_name: `${systemTemplate.template_name || systemTemplate.name} (Copy)`,
          template_code: `${systemTemplate.template_code}-COPY`,
          description: systemTemplate.description,
          applicable_for: systemTemplate.applicable_for,
          is_default: false,
          is_system_template: false,
          total_amount: systemTemplate.total_amount,
          branch_id: branchId,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      // Copy fee heads
      const feeHeads = (systemTemplate.fee_head_splits || []).map((h, idx) => ({
        template_id: newTemplate.id,
        fee_type_id: h.fee_type_id,
        split_name: h.head_name || h.split_name, // Required NOT NULL column
        head_name: h.head_name || h.split_name,
        amount: h.amount,
        is_optional: h.is_optional,
        due_date_offset: h.due_date_offset || 30,
        installment_allowed: h.installment_allowed !== false,
        display_order: idx + 1,
        branch_id: branchId,
        organization_id: organizationId,
      }));

      await supabase.from('fee_head_splits').insert(feeHeads);

      toast({
        title: 'Template Added!',
        description: `"${systemTemplate.template_name}" has been added to your branch. You can now edit and customize it.`,
      });
      fetchTemplates();
    } catch (error) {
      console.error('Use template error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to use template' });
    }
    setSeeding(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      template_name: '',
      template_code: '',
      description: '',
      applicable_for: 'all',
      is_default: false,
      fee_head_splits: [],
    });
    setEditMode(false);
    setSelectedTemplate(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleEdit = (template) => {
    setFormData({
      template_name: template.template_name,
      template_code: template.template_code,
      description: template.description || '',
      applicable_for: template.applicable_for || 'all',
      is_default: template.is_default,
      fee_head_splits: template.fee_head_splits || [],
    });
    setSelectedTemplate(template);
    setEditMode(true);
    setShowCreateDialog(true);
  };

  const handleDuplicate = (template) => {
    setFormData({
      template_name: `${template.template_name} (Copy)`,
      template_code: `${template.template_code}_COPY`,
      description: template.description || '',
      applicable_for: template.applicable_for || 'all',
      is_default: false,
      fee_head_splits: template.fee_head_splits?.map(h => ({
        ...h,
        id: `new_${Date.now()}_${Math.random()}`,
      })) || [],
    });
    setEditMode(false);
    setSelectedTemplate(null);
    setShowCreateDialog(true);
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const handleAssign = (template) => {
    setSelectedTemplate(template);
    setShowAssignDialog(true);
  };

  const handleDelete = (template) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedTemplate) return;
    
    try {
      // Delete fee heads first
      await supabase
        .from('fee_head_splits')
        .delete()
        .eq('template_id', selectedTemplate.id);

      // Delete template
      const { error } = await supabase
        .from('fee_templates')
        .delete()
        .eq('id', selectedTemplate.id)
        .eq('branch_id', branchId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Template deleted successfully' });
      fetchTemplates();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete template' });
    }
    setShowDeleteDialog(false);
    setSelectedTemplate(null);
  };

  const handleSave = async () => {
    if (!formData.template_name || !formData.template_code) {
      toast({ variant: 'destructive', title: 'Error', description: 'Template name and code are required' });
      return;
    }

    if (formData.fee_head_splits.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'At least one fee head is required' });
      return;
    }

    setSaving(true);
    
    try {
      let templateId = selectedTemplate?.id;

      if (editMode && templateId) {
        // Update existing template
        const { error } = await supabase
          .from('fee_templates')
          .update({
            name: formData.template_name, // Required NOT NULL column
            template_name: formData.template_name,
            template_code: formData.template_code,
            description: formData.description,
            applicable_for: formData.applicable_for,
            is_default: formData.is_default,
            total_amount: formData.fee_head_splits.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0),
            updated_at: new Date().toISOString(),
          })
          .eq('id', templateId);

        if (error) throw error;

        // Delete old fee heads
        await supabase
          .from('fee_head_splits')
          .delete()
          .eq('template_id', templateId);
      } else {
        // Create new template
        const { data: newTemplate, error } = await supabase
          .from('fee_templates')
          .insert({
            name: formData.template_name, // Required NOT NULL column
            template_name: formData.template_name,
            template_code: formData.template_code,
            description: formData.description,
            applicable_for: formData.applicable_for,
            is_default: formData.is_default,
            total_amount: formData.fee_head_splits.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0),
            branch_id: branchId,
            organization_id: organizationId,
          })
          .select()
          .single();

        if (error) throw error;
        templateId = newTemplate.id;
      }

      // Insert fee heads
      const feeHeads = formData.fee_head_splits.map((h, idx) => ({
        template_id: templateId,
        fee_type_id: h.fee_type_id,
        split_name: h.head_name || h.split_name, // Required NOT NULL column
        head_name: h.head_name || h.split_name,
        amount: parseFloat(h.amount) || 0,
        is_optional: h.is_optional,
        due_date_offset: h.due_date_offset || 30,
        installment_allowed: h.installment_allowed !== false,
        display_order: idx + 1,
        branch_id: branchId,
        organization_id: organizationId,
      }));

      const { error: headsError } = await supabase
        .from('fee_head_splits')
        .insert(feeHeads);

      if (headsError) throw headsError;

      toast({ 
        title: 'Success', 
        description: editMode ? 'Template updated successfully' : 'Template created successfully' 
      });
      setShowCreateDialog(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save template' });
    }
    setSaving(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FILTERED TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────────

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = 
      t.template_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.template_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterApplicable === 'all' || t.applicable_for === filterApplicable;
    return matchesSearch && matchesFilter;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading Fee Templates...</span>
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
              <FileText className="h-8 w-8 text-primary" />
              Fee Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage reusable fee structures
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchTemplates}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* FILTERS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterApplicable} onValueChange={setFilterApplicable}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  <SelectItem value="new_admission">New Admission</SelectItem>
                  <SelectItem value="regular">Regular Students</SelectItem>
                  <SelectItem value="rte">RTE Students</SelectItem>
                  <SelectItem value="staff_ward">Staff Ward</SelectItem>
                  <SelectItem value="sports_quota">Sports Quota</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* READY TEMPLATES SECTION - System Templates */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Package className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">🌟 Ready-to-Use Templates</CardTitle>
                  <CardDescription>
                    10 professional templates for all school/college types. Click "Use This Template" to add to your branch.
                  </CardDescription>
                </div>
              </div>
              {systemTemplates.length === 0 && (
                <Button 
                  onClick={seedDefaultTemplates} 
                  disabled={seeding}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Load 10 Default Templates
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          {systemTemplates.length > 0 && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {systemTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onDuplicate={() => {}}
                    onPreview={handlePreview}
                    onAssign={() => {}}
                    onUseTemplate={handleUseTemplate}
                  />
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* YOUR BRANCH TEMPLATES */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Your Branch Templates</h2>
            <Badge variant="outline">{filteredTemplates.length} templates</Badge>
          </div>
          
          {filteredTemplates.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Branch Templates Yet</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? 'No templates match your search' 
                  : 'Use a ready template above or create your own custom template'}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Template
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onPreview={handlePreview}
                  onAssign={handleAssign}
                  onUseTemplate={() => {}}
                />
              ))}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* CREATE/EDIT DIALOG */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowCreateDialog(open); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {editMode ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                {editMode ? 'Update the fee template details' : 'Define a reusable fee structure'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template_name">Template Name *</Label>
                  <Input
                    id="template_name"
                    value={formData.template_name}
                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                    placeholder="e.g., Standard Fee - Class 1-5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template_code">Template Code *</Label>
                  <Input
                    id="template_code"
                    value={formData.template_code}
                    onChange={(e) => setFormData({ ...formData, template_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., STD_FEE_1_5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this fee template"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicable_for">Applicable For</Label>
                  <Select 
                    value={formData.applicable_for} 
                    onValueChange={(val) => setFormData({ ...formData, applicable_for: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="new_admission">New Admission</SelectItem>
                      <SelectItem value="regular">Regular Students</SelectItem>
                      <SelectItem value="rte">RTE Students</SelectItem>
                      <SelectItem value="staff_ward">Staff Ward</SelectItem>
                      <SelectItem value="sports_quota">Sports Quota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Set as default template</Label>
                </div>
              </div>

              <Separator />

              {/* Fee Heads Editor */}
              <FeeHeadEditor
                heads={formData.fee_head_splits}
                feeTypes={feeTypes}
                onChange={(heads) => setFormData({ ...formData, fee_head_splits: heads })}
              />
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
                    {editMode ? 'Update Template' : 'Create Template'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* PREVIEW DIALOG */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Template Preview
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate?.template_name} ({selectedTemplate?.template_code})
              </DialogDescription>
            </DialogHeader>
            
            {selectedTemplate && (
              <div className="space-y-4">
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description || 'No description'}</p>
                  </CardContent>
                </Card>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Head</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Optional</TableHead>
                      <TableHead className="text-right">Due Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTemplate.fee_head_splits?.map((head, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{head.head_name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(head.amount)}</TableCell>
                        <TableCell className="text-center">
                          {head.is_optional ? (
                            <Badge variant="secondary">Optional</Badge>
                          ) : (
                            <Badge variant="default">Required</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{head.due_date_offset} days</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="font-semibold">Total Template Amount</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(selectedTemplate.fee_head_splits?.reduce((sum, h) => sum + (h.amount || 0), 0) || 0)}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowPreviewDialog(false);
                handleEdit(selectedTemplate);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Template
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
              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedTemplate?.template_name}"? 
                This action cannot be undone.
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

export default FeeTemplates;
