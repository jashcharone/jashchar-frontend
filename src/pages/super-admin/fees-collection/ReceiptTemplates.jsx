/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RECEIPT TEMPLATE DESIGNER
 * Day 28 Implementation - Fee Collection Phase 3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Customizable receipt templates
 * - Multiple template formats (A4, Thermal, A5)
 * - School logo & branding
 * - Variable field placeholders
 * - Live preview
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Save,
  Eye,
  Printer,
  Settings,
  Image,
  Type,
  Layout,
  QrCode,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Available template variables
const TEMPLATE_VARIABLES = [
  { key: '{{receipt_number}}', label: 'Receipt Number', example: 'RCP/2025-26/00001' },
  { key: '{{date}}', label: 'Receipt Date', example: '10-02-2026' },
  { key: '{{time}}', label: 'Receipt Time', example: '02:30 PM' },
  { key: '{{student_name}}', label: 'Student Name', example: 'Rahul Kumar' },
  { key: '{{admission_number}}', label: 'Admission Number', example: 'ADM/2024/001' },
  { key: '{{class_section}}', label: 'Class & Section', example: '10th A' },
  { key: '{{parent_name}}', label: 'Parent Name', example: 'Mr. Suresh Kumar' },
  { key: '{{phone}}', label: 'Phone Number', example: '9876543210' },
  { key: '{{amount}}', label: 'Total Amount', example: '₹15,000' },
  { key: '{{amount_in_words}}', label: 'Amount in Words', example: 'Fifteen Thousand Only' },
  { key: '{{payment_method}}', label: 'Payment Method', example: 'Cash' },
  { key: '{{fee_details}}', label: 'Fee Details Table', example: 'Tuition Fee: ₹10,000' },
  { key: '{{school_name}}', label: 'School Name', example: 'ABC Public School' },
  { key: '{{school_address}}', label: 'School Address', example: 'Bangalore, Karnataka' },
  { key: '{{academic_year}}', label: 'Academic Year', example: '2025-2026' },
  { key: '{{qr_code}}', label: 'QR Code', example: '[QR]' },
  { key: '{{transaction_id}}', label: 'Transaction ID', example: 'TXN123456' },
  { key: '{{cashier_name}}', label: 'Cashier Name', example: 'Admin User' }
];

// Default template content
const DEFAULT_TEMPLATES = {
  a4: {
    name: 'A4 Full Page',
    size: 'A4',
    orientation: 'portrait',
    content: `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="{{school_logo}}" alt="Logo" style="height: 60px;" />
    <h1 style="margin: 10px 0 5px;">{{school_name}}</h1>
    <p style="margin: 0; color: #666;">{{school_address}}</p>
  </div>
  
  <div style="text-align: center; background: #f0f0f0; padding: 10px; margin-bottom: 20px;">
    <h2 style="margin: 0;">FEE RECEIPT</h2>
    <p style="margin: 5px 0 0;">Academic Year: {{academic_year}}</p>
  </div>
  
  <table style="width: 100%; margin-bottom: 20px;">
    <tr>
      <td><strong>Receipt No:</strong> {{receipt_number}}</td>
      <td style="text-align: right;"><strong>Date:</strong> {{date}}</td>
    </tr>
    <tr>
      <td><strong>Student Name:</strong> {{student_name}}</td>
      <td style="text-align: right;"><strong>Class:</strong> {{class_section}}</td>
    </tr>
    <tr>
      <td><strong>Admission No:</strong> {{admission_number}}</td>
      <td style="text-align: right;"><strong>Payment Mode:</strong> {{payment_method}}</td>
    </tr>
  </table>
  
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <thead>
      <tr style="background: #333; color: white;">
        <th style="padding: 10px; border: 1px solid #333; text-align: left;">Fee Type</th>
        <th style="padding: 10px; border: 1px solid #333; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{fee_details}}
    </tbody>
    <tfoot>
      <tr style="background: #f0f0f0; font-weight: bold;">
        <td style="padding: 10px; border: 1px solid #333;">Total</td>
        <td style="padding: 10px; border: 1px solid #333; text-align: right;">{{amount}}</td>
      </tr>
    </tfoot>
  </table>
  
  <p><strong>Amount in Words:</strong> {{amount_in_words}}</p>
  
  <div style="display: flex; justify-content: space-between; margin-top: 40px;">
    <div style="text-align: center;">
      {{qr_code}}
      <p style="font-size: 10px; margin-top: 5px;">Scan to verify</p>
    </div>
    <div style="text-align: center;">
      <div style="border-top: 1px solid #333; width: 150px; margin-top: 40px; padding-top: 5px;">
        Authorized Signature
      </div>
    </div>
  </div>
  
  <p style="text-align: center; font-size: 10px; margin-top: 30px; color: #666;">
    This is a computer generated receipt. Transaction ID: {{transaction_id}}
  </p>
</div>
    `
  },
  thermal: {
    name: 'Thermal (80mm)',
    size: '80mm',
    orientation: 'portrait',
    content: `
<div style="font-family: 'Courier New', monospace; width: 80mm; padding: 5mm; font-size: 12px;">
  <div style="text-align: center; margin-bottom: 10px;">
    <strong style="font-size: 14px;">{{school_name}}</strong>
    <p style="margin: 2px 0; font-size: 10px;">{{school_address}}</p>
    <p style="margin: 2px 0;">--------------------------------</p>
    <strong>FEE RECEIPT</strong>
  </div>
  
  <p style="margin: 2px 0;">Receipt: {{receipt_number}}</p>
  <p style="margin: 2px 0;">Date: {{date}} {{time}}</p>
  <p style="margin: 2px 0;">--------------------------------</p>
  <p style="margin: 2px 0;">Student: {{student_name}}</p>
  <p style="margin: 2px 0;">Adm No: {{admission_number}}</p>
  <p style="margin: 2px 0;">Class: {{class_section}}</p>
  <p style="margin: 2px 0;">--------------------------------</p>
  
  {{fee_details}}
  
  <p style="margin: 2px 0;">--------------------------------</p>
  <p style="margin: 2px 0;"><strong>TOTAL: {{amount}}</strong></p>
  <p style="margin: 2px 0;">Mode: {{payment_method}}</p>
  <p style="margin: 2px 0;">--------------------------------</p>
  
  <div style="text-align: center; margin: 10px 0;">
    {{qr_code}}
  </div>
  
  <p style="text-align: center; font-size: 10px;">
    Thank you!<br/>
    TXN: {{transaction_id}}
  </p>
</div>
    `
  },
  a5: {
    name: 'A5 Half Page',
    size: 'A5',
    orientation: 'landscape',
    content: `
<div style="font-family: Arial, sans-serif; padding: 15px; border: 2px solid #333;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
    <img src="{{school_logo}}" alt="Logo" style="height: 40px;" />
    <div style="text-align: center;">
      <h2 style="margin: 0;">{{school_name}}</h2>
      <p style="margin: 0; font-size: 12px;">{{school_address}}</p>
    </div>
    <div style="text-align: right;">
      <strong>RECEIPT</strong>
      <p style="margin: 0;">{{receipt_number}}</p>
      <p style="margin: 0; font-size: 12px;">{{date}}</p>
    </div>
  </div>
  
  <table style="width: 100%; font-size: 13px;">
    <tr>
      <td width="50%">
        <strong>{{student_name}}</strong><br/>
        {{admission_number}} | {{class_section}}
      </td>
      <td width="50%" style="text-align: right;">
        <strong style="font-size: 18px;">{{amount}}</strong><br/>
        {{payment_method}}
      </td>
    </tr>
  </table>
  
  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #333; display: flex; justify-content: space-between; align-items: center;">
    {{qr_code}}
    <div style="text-align: right; font-size: 10px;">
      {{transaction_id}}<br/>
      Collected by: {{cashier_name}}
    </div>
  </div>
</div>
    `
  }
};

export default function ReceiptTemplates() {
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Template settings
  const [templateConfig, setTemplateConfig] = useState({
    name: '',
    size: 'A4',
    orientation: 'portrait',
    content: DEFAULT_TEMPLATES.a4.content,
    showLogo: true,
    showQrCode: true,
    showSignature: true,
    footerText: 'This is a computer generated receipt',
    primaryColor: '#333333',
    isDefault: false
  });

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, [organizationId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fee_receipt_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
      
      // Select first template or create default
      if (data && data.length > 0) {
        selectTemplate(data[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template) => {
    setActiveTemplate(template);
    setTemplateConfig({
      name: template.name,
      size: template.size || 'A4',
      orientation: template.orientation || 'portrait',
      content: template.content,
      showLogo: template.show_logo ?? true,
      showQrCode: template.show_qr_code ?? true,
      showSignature: template.show_signature ?? true,
      footerText: template.footer_text || '',
      primaryColor: template.primary_color || '#333333',
      isDefault: template.is_default || false
    });
  };

  const createNewTemplate = (type = 'a4') => {
    const preset = DEFAULT_TEMPLATES[type];
    setActiveTemplate(null);
    setTemplateConfig({
      name: `New ${preset.name} Template`,
      size: preset.size,
      orientation: preset.orientation,
      content: preset.content,
      showLogo: true,
      showQrCode: true,
      showSignature: true,
      footerText: 'This is a computer generated receipt',
      primaryColor: '#333333',
      isDefault: false
    });
  };

  const saveTemplate = async () => {
    if (!templateConfig.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: templateConfig.name,
        size: templateConfig.size,
        orientation: templateConfig.orientation,
        content: templateConfig.content,
        show_logo: templateConfig.showLogo,
        show_qr_code: templateConfig.showQrCode,
        show_signature: templateConfig.showSignature,
        footer_text: templateConfig.footerText,
        primary_color: templateConfig.primaryColor,
        is_default: templateConfig.isDefault,
        organization_id: organizationId,
        updated_by: user.id
      };

      if (activeTemplate) {
        // Update existing
        const { error } = await supabase
          .from('fee_receipt_templates')
          .update(templateData)
          .eq('id', activeTemplate.id);
        
        if (error) throw error;
        toast.success('Template updated');
      } else {
        // Create new
        const { data, error } = await supabase
          .from('fee_receipt_templates')
          .insert({
            ...templateData,
            created_by: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        setActiveTemplate(data);
        toast.success('Template created');
      }

      loadTemplates();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async () => {
    if (!activeTemplate) return;
    
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('fee_receipt_templates')
        .delete()
        .eq('id', activeTemplate.id);

      if (error) throw error;
      
      toast.success('Template deleted');
      setActiveTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete template');
    }
  };

  const insertVariable = (variable) => {
    // Insert at cursor position (simplified - in real app use proper cursor handling)
    setTemplateConfig(prev => ({
      ...prev,
      content: prev.content + ' ' + variable
    }));
  };

  // Generate preview with sample data
  const generatePreview = () => {
    let preview = templateConfig.content;
    
    // Replace with sample data
    const sampleData = {
      '{{school_logo}}': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect fill="%23ddd" width="100" height="50"/><text x="50" y="30" text-anchor="middle" fill="%23666">LOGO</text></svg>',
      '{{school_name}}': selectedBranch?.name || 'ABC Public School',
      '{{school_address}}': 'Bangalore, Karnataka - 560001',
      '{{receipt_number}}': 'RCP/2025-26/00123',
      '{{date}}': '10-02-2026',
      '{{time}}': '02:30 PM',
      '{{student_name}}': 'Rahul Kumar',
      '{{admission_number}}': 'ADM/2024/001',
      '{{class_section}}': '10th A',
      '{{parent_name}}': 'Mr. Suresh Kumar',
      '{{phone}}': '9876543210',
      '{{amount}}': '₹15,000',
      '{{amount_in_words}}': 'Fifteen Thousand Rupees Only',
      '{{payment_method}}': 'Cash',
      '{{academic_year}}': '2025-2026',
      '{{transaction_id}}': 'TXN987654321',
      '{{cashier_name}}': 'Admin',
      '{{fee_details}}': `
        <tr><td style="padding: 8px; border: 1px solid #ddd;">Tuition Fee</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹10,000</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;">Lab Fee</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹3,000</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;">Activity Fee</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹2,000</td></tr>
      `,
      '{{qr_code}}': '<div style="width: 80px; height: 80px; background: #f0f0f0; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 10px;">[QR Code]</div>'
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return preview;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receipt Templates</h1>
          <p className="text-muted-foreground">
            Design and customize fee receipt formats
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)} className="gap-2">
            <Eye className="h-4 w-4" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={saveTemplate} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Templates
              <Select onValueChange={(v) => createNewTemplate(v)}>
                <SelectTrigger className="w-8 h-8 p-0">
                  <Plus className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 Template</SelectItem>
                  <SelectItem value="thermal">Thermal (80mm)</SelectItem>
                  <SelectItem value="a5">A5 Half Page</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  activeTemplate?.id === template.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => selectTemplate(template)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm truncate">{template.name}</div>
                  {template.is_default && (
                    <Badge variant="outline" className="text-xs">Default</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {template.size} • {template.orientation}
                </div>
              </div>
            ))}
            
            {templates.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No templates yet. Click + to create one.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor / Preview */}
        <div className="lg:col-span-3 space-y-6">
          {previewMode ? (
            /* Preview Mode */
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview - {templateConfig.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg p-4 bg-white overflow-auto"
                  style={{ minHeight: '600px' }}
                  dangerouslySetInnerHTML={{ __html: generatePreview() }}
                />
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Test Print
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </CardFooter>
            </Card>
          ) : (
            /* Edit Mode */
            <>
              {/* Template Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Template Name</Label>
                      <Input
                        value={templateConfig.name}
                        onChange={(e) => setTemplateConfig(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Receipt Template"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Paper Size</Label>
                      <Select
                        value={templateConfig.size}
                        onValueChange={(v) => setTemplateConfig(prev => ({ ...prev, size: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4 (210mm × 297mm)</SelectItem>
                          <SelectItem value="A5">A5 (148mm × 210mm)</SelectItem>
                          <SelectItem value="80mm">Thermal (80mm)</SelectItem>
                          <SelectItem value="58mm">Thermal (58mm)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Orientation</Label>
                      <Select
                        value={templateConfig.orientation}
                        onValueChange={(v) => setTemplateConfig(prev => ({ ...prev, orientation: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={templateConfig.showLogo}
                        onCheckedChange={(c) => setTemplateConfig(prev => ({ ...prev, showLogo: c }))}
                      />
                      <Label>Show Logo</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={templateConfig.showQrCode}
                        onCheckedChange={(c) => setTemplateConfig(prev => ({ ...prev, showQrCode: c }))}
                      />
                      <Label>Show QR Code</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={templateConfig.showSignature}
                        onCheckedChange={(c) => setTemplateConfig(prev => ({ ...prev, showSignature: c }))}
                      />
                      <Label>Signature Area</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={templateConfig.isDefault}
                        onCheckedChange={(c) => setTemplateConfig(prev => ({ ...prev, isDefault: c }))}
                      />
                      <Label>Set as Default</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Variables */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Variables</CardTitle>
                  <CardDescription>Click to insert into template</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_VARIABLES.map((variable) => (
                      <Badge
                        key={variable.key}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => insertVariable(variable.key)}
                        title={`Example: ${variable.example}`}
                      >
                        {variable.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* HTML Editor */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template HTML</CardTitle>
                  <CardDescription>
                    Use HTML and inline CSS to design your receipt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={templateConfig.content}
                    onChange={(e) => setTemplateConfig(prev => ({ ...prev, content: e.target.value }))}
                    className="font-mono text-sm min-h-[400px]"
                    placeholder="Enter template HTML here..."
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
