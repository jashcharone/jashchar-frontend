import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Save, UploadCloud, Trash2, Building2, Download, Info, AlertCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const PRINT_TYPES = [
  { id: 'fees_receipt', label: 'Fees Receipt' },
  { id: 'payslip', label: 'Payslip' },
  { id: 'online_admission_receipt', label: 'Online Admission Receipt' },
  { id: 'online_exam', label: 'Online Exam' },
  { id: 'general_purpose', label: 'General Purpose' },
];

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'size': ['small', false, 'large'] }],
    ['blockquote'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link', 'image'],
  ],
};

const PrintSettingsForm = ({ type, settings, onSave, loading, branchId, isOrgDefault, branchName }) => {
  const [headerImage, setHeaderImage] = useState(settings?.header_image_url || '');
  const [footerContent, setFooterContent] = useState(settings?.footer_content || 'This receipt is computer generated hence no signature is required.');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    setHeaderImage(settings?.header_image_url || '');
    setFooterContent(settings?.footer_content || 'This receipt is computer generated hence no signature is required.');
  }, [settings]);

  const handleDownloadTemplate = () => {
    // Create a canvas to generate a template
    const canvas = document.createElement('canvas');
    canvas.width = 2230;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 2230, 300);
    
    // Left side - Logo placeholder
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(40, 40, 200, 200);
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 200, 200);
    ctx.fillStyle = '#6B7280';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LOGO', 140, 145);
    ctx.font = '14px Arial';
    ctx.fillText('(Add Here)', 140, 165);
    
    // School name placeholder
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Your School Name Here', 280, 100);
    
    // Tagline
    ctx.fillStyle = '#6B7280';
    ctx.font = '24px Arial';
    ctx.fillText('School Tagline / Motto', 280, 145);
    
    // Affiliation
    ctx.font = '18px Arial';
    ctx.fillText('Affiliated to: CBSE/ICSE/State Board (Affiliation No: XXXXXX)', 280, 185);
    
    // Right side - Contact info
    ctx.fillStyle = '#374151';
    ctx.font = '18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Address: Your School Address, City - PIN', 2190, 70);
    ctx.fillText('Phone: +91 98765 43210', 2190, 105);
    ctx.fillText('Email: school@example.com', 2190, 140);
    ctx.fillText('Website: www.yourschool.com', 2190, 175);
    
    // Bottom decorative line
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(0, 270, 2230, 30);
    
    // Download
    const link = document.createElement('a');
    link.download = 'print_header_template_2230x300.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    toast({ 
      title: '📥 Template Downloaded!', 
      description: 'Edit this template in Canva, Photoshop, or any image editor. Replace the placeholders with your school details and upload.' 
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please select an image file' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `print-headers/${branchId || 'org-default'}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('school-logos')
        .getPublicUrl(fileName);

      setHeaderImage(publicUrl);
      toast({ title: '✅ Image uploaded successfully!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setHeaderImage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(type, { header_image_url: headerImage, footer_content: footerContent });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info Banner */}
      <div className={`p-4 rounded-lg border ${isOrgDefault ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
        <div className="flex items-start gap-3">
          {isOrgDefault ? (
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium text-sm">
              {isOrgDefault 
                ? '🌐 Organization Default - Applies to ALL branches' 
                : `🏫 Branch Override - Only for "${branchName}"`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isOrgDefault 
                ? 'Changes here will apply to all branches that don\'t have their own custom settings.' 
                : 'This setting overrides the organization default for this specific branch only.'}
            </p>
          </div>
        </div>
      </div>

      {/* Header Image Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Label className="text-base font-medium text-foreground">
            Header Image (2230px × 300px) <span className="text-red-500">*</span>
          </Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleDownloadTemplate}
            className="gap-2 w-fit"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>
        
        <div className="bg-muted/50 p-3 rounded-md border border-dashed">
          <p className="text-xs text-muted-foreground">
            💡 <strong>How to create your header:</strong><br/>
            1. Click "Download Template" to get a sample image<br/>
            2. Open in Canva, Photoshop, or any image editor<br/>
            3. Replace placeholders with your school logo, name & contact details<br/>
            4. Export as PNG (2230×300 pixels) and upload below
          </p>
        </div>
        
        <div 
          className="border-2 border-dashed border-border rounded-lg min-h-[200px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20 dark:bg-muted/10 relative overflow-hidden"
          onClick={() => !headerImage && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : headerImage ? (
            <div className="w-full p-4">
              {/* Full Header Image Preview */}
              <div className="w-full border rounded-lg overflow-hidden shadow-sm bg-white">
                <img 
                  src={headerImage} 
                  alt="Header" 
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '300px' }}
                />
              </div>
              
              <div className="flex justify-center mt-4 gap-2 flex-wrap">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <UploadCloud className="h-4 w-4 mr-2" /> Change
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-10">
              <UploadCloud className="h-10 w-10" />
              <span>Click to upload or drag and drop</span>
              <span className="text-xs">Recommended: 2230px × 300px (PNG or JPG)</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Content Section */}
      <div className="space-y-3">
        <Label className="text-base font-medium text-foreground">Footer Content</Label>
        <div className="border rounded-lg overflow-hidden bg-background dark:bg-card [&_.ql-toolbar]:bg-muted [&_.ql-toolbar]:border-border [&_.ql-container]:border-border [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-foreground [&_.ql-toolbar_button]:text-foreground [&_.ql-toolbar_.ql-stroke]:stroke-foreground [&_.ql-toolbar_.ql-fill]:fill-foreground [&_.ql-toolbar_.ql-picker]:text-foreground [&_.ql-toolbar_.ql-picker-label]:text-foreground">
          <ReactQuill
            theme="snow"
            value={footerContent}
            onChange={setFooterContent}
            modules={quillModules}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save {isOrgDefault ? 'for All Branches' : `for ${branchName}`}
        </Button>
      </div>
    </form>
  );
};

const PrintHeaderFooter = () => {
  const { user, organizationId } = useAuth();
  const { toast } = useToast();
  const { branches, selectedBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('fees_receipt');
  const [allSettings, setAllSettings] = useState({});
  const [currentBranchId, setCurrentBranchId] = useState('all'); // 'all' = organization default

  const userBranchId = user?.profile?.branch_id;
  const userOrgId = organizationId || user?.profile?.organization_id;

  // Check if current selection is organization default
  const isOrgDefault = currentBranchId === 'all';
  const currentBranchName = isOrgDefault 
    ? 'All Branches' 
    : branches?.find(b => b.id === currentBranchId)?.branch_name || 'Selected Branch';

  const fetchSettings = useCallback(async () => {
    if (!userBranchId) {
      console.log('No branchId, skipping fetch');
      setFetching(false);
      return;
    }
    setFetching(true);
    try {
      let query = supabase.from('print_settings').select('*');

      if (isOrgDefault) {
        // Fetch organization defaults (branch_id is NULL)
        query = query.is('branch_id', null);
        if (userOrgId) {
          query = query.eq('organization_id', userOrgId);
        }
      } else {
        // Fetch branch-specific settings
        query = query.eq('branch_id', currentBranchId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Print settings fetch warning:', error.message);
      }

      console.log('Fetched print_settings for:', isOrgDefault ? 'org-default' : currentBranchId, data);

      // If no branch-specific settings, try to fetch org defaults as fallback
      if (!isOrgDefault && (!data || data.length === 0)) {
        console.log('No branch settings, fetching org defaults as fallback...');
        let fallbackQuery = supabase.from('print_settings').select('*').is('branch_id', null);
        if (userOrgId) {
          fallbackQuery = fallbackQuery.eq('organization_id', userOrgId);
        }
        const { data: fallbackData } = await fallbackQuery;
        
        // Mark fallback data as inherited
        const settingsMap = {};
        (fallbackData || []).forEach(item => {
          settingsMap[item.type] = { ...item, _inherited: true };
        });
        setAllSettings(settingsMap);
        return;
      }

      // Map data by type
      const settingsMap = {};
      (data || []).forEach(item => {
        settingsMap[item.type] = item;
      });
      
      setAllSettings(settingsMap);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setFetching(false);
    }
  }, [userBranchId, userOrgId, currentBranchId, isOrgDefault]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (type, formData) => {
    if (!userBranchId) {
      toast({ variant: 'destructive', title: 'Error', description: 'School ID not found' });
      return;
    }

    setLoading(true);
    try {
      // Determine save parameters based on selection
      const targetBranchId = isOrgDefault ? null : currentBranchId;
      
      // Check if record already exists
      let existingQuery = supabase
        .from('print_settings')
        .select('id')
        .eq('type', type);
      
      if (isOrgDefault) {
        existingQuery = existingQuery.is('branch_id', null);
        if (userOrgId) {
          existingQuery = existingQuery.eq('organization_id', userOrgId);
        }
      } else {
        existingQuery = existingQuery.eq('branch_id', targetBranchId);
      }
      
      const { data: existing } = await existingQuery.maybeSingle();

      const saveData = {
        branch_id: targetBranchId,
        organization_id: userOrgId || null,
        type,
        header_image_url: formData.header_image_url || null,
        footer_content: formData.footer_content || null,
        updated_at: new Date().toISOString(),
      };

      let data, error;
      if (existing?.id) {
        // Update existing record
        const result = await supabase
          .from('print_settings')
          .update(saveData)
          .eq('id', existing.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('print_settings')
          .insert(saveData)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      setAllSettings(prev => ({
        ...prev,
        [type]: data
      }));

      toast({ 
        title: '✅ Success!', 
        description: isOrgDefault 
          ? 'Settings saved for all branches.' 
          : `Settings saved for ${currentBranchName}.`
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Failed to save settings', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Print Header & Footer</h1>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent h-auto p-0 gap-0 flex-wrap">
                {PRINT_TYPES.map(({ id, label }) => (
                  <TabsTrigger 
                    key={id} 
                    value={id}
                    className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-3 py-2 text-sm text-muted-foreground"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Branch Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Apply settings to:</span>
            </div>
            <Select value={currentBranchId} onValueChange={setCurrentBranchId}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌐</span>
                    <span>All Branches (Organization Default)</span>
                  </div>
                </SelectItem>
                {branches && branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏫</span>
                      <span>{branch.branch_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg border border-border p-6">
          {PRINT_TYPES.map(({ id }) => (
            activeTab === id && (
              <PrintSettingsForm
                key={`${id}-${currentBranchId}`}
                type={id}
                settings={allSettings[id]}
                onSave={handleSave}
                loading={loading}
                branchId={currentBranchId}
                isOrgDefault={isOrgDefault}
                branchName={currentBranchName}
              />
            )
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PrintHeaderFooter;
