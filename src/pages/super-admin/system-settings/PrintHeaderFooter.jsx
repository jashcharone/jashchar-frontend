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
import { Loader2, Save, UploadCloud, Trash2, Building2 } from 'lucide-react';
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

const PrintSettingsForm = ({ type, settings, onSave, loading, branchId, school }) => {
  const [headerImage, setHeaderImage] = useState(settings?.header_image_url || '');
  const [footerContent, setFooterContent] = useState(settings?.footer_content || 'This receipt is computer generated hence no signature is required.');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    setHeaderImage(settings?.header_image_url || '');
    setFooterContent(settings?.footer_content || 'This receipt is computer generated hence no signature is required.');
  }, [settings]);

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
      const fileName = `${branchId}/print-headers/${branchId || 'default'}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('school-logos')
        .getPublicUrl(fileName);

      setHeaderImage(publicUrl);
      toast({ title: 'Image uploaded successfully!' });
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
      {/* Header Image Section */}
      <div className="space-y-3">
        <Label className="text-base font-medium text-foreground">
          Header Image (2230px X 300px) <span className="text-red-500">*</span>
        </Label>
        
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
              
              <div className="flex justify-center mt-4 gap-2">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove Image
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <UploadCloud className="h-4 w-4 mr-2" /> Change Image
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-10">
              <UploadCloud className="h-10 w-10" />
              <span>Drag and drop a file <span className="text-primary underline">here</span> or <span className="text-primary underline">click</span></span>
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
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </div>
    </form>
  );
};

const PrintHeaderFooter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { branches, selectedBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('fees_receipt');
  const [allSettings, setAllSettings] = useState({});
  const [school, setSchool] = useState(null);
  const [currentBranchId, setCurrentBranchId] = useState(selectedBranch?.id || 'all');

  const branchId = user?.profile?.branch_id;

  const fetchSettings = useCallback(async () => {
    if (!branchId) {
      console.log('No branchId, skipping fetch');
      setFetching(false);
      return;
    }
    setFetching(true);
    try {
      const { data: schoolData } = await supabase
        .from('schools')
        .select('name, address, contact_number, contact_email, domain')
        .eq('id', branchId)
        .single();
      
      // Map to expected field names
      const mappedSchool = schoolData ? {
        ...schoolData,
        phone: schoolData.contact_number,
        email: schoolData.contact_email,
        website: schoolData.domain || null
      } : null;
      setSchool(mappedSchool);

      // Build query for print settings
      let query = supabase
        .from('print_settings')
        .select('*')
        .eq('branch_id', branchId);

      // Filter by branch if selected (not 'all')
      if (currentBranchId && currentBranchId !== 'all') {
        query = query.eq('branch_id', currentBranchId);
      } else {
        query = query.is('branch_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Print settings fetch warning:', error.message);
      }

      console.log('Fetched print_settings for branch:', currentBranchId, data);

      // Map data by type
      const settingsMap = {};
      (data || []).forEach(item => {
        settingsMap[item.type] = item;
      });
      
      console.log('Settings map:', settingsMap);
      setAllSettings(settingsMap);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setFetching(false);
    }
  }, [branchId, currentBranchId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (selectedBranch?.id) {
      setCurrentBranchId(selectedBranch.id);
    }
  }, [selectedBranch]);

  const handleSave = async (type, formData) => {
    if (!branchId) {
      toast({ variant: 'destructive', title: 'Error', description: 'School ID not found' });
      return;
    }

    setLoading(true);
    try {
      // Prepare data with branch_id for branch-wise storage
      const branchId = currentBranchId && currentBranchId !== 'all' ? currentBranchId : null;
      
      // Check if record exists for this school + type + branch
      const { data: existing } = await supabase
        .from('print_settings')
        .select('id')
        .eq('branch_id', branchId)
        .eq('type', type)
        .is('branch_id', branchId ? undefined : null);
      
      let existingId = null;
      if (branchId) {
        const { data: branchExisting } = await supabase
          .from('print_settings')
          .select('id')
          .eq('branch_id', branchId)
          .eq('type', type)
          .eq('branch_id', branchId)
          .single();
        existingId = branchExisting?.id;
      } else if (existing && existing.length > 0) {
        existingId = existing[0].id;
      }

      const saveData = {
        branch_id: branchId,
        type,
        branch_id: branchId,
        header_image_url: formData.header_image_url || null,
        footer_content: formData.footer_content || null,
        updated_at: new Date().toISOString(),
      };

      let data, error;
      if (existingId) {
        // Update existing record
        const result = await supabase
          .from('print_settings')
          .update(saveData)
          .eq('id', existingId)
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

      toast({ title: 'Success!', description: `Print settings saved successfully.` });
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
        {/* Header with Tabs */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Print Header Footer</h1>
            
            {/* Branch Selector */}
            {branches && branches.length > 0 && (
              <Select value={currentBranchId} onValueChange={setCurrentBranchId}>
                <SelectTrigger className="w-[200px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches (Default)</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent h-auto p-0 gap-0">
              {PRINT_TYPES.map(({ id, label }) => (
                <TabsTrigger 
                  key={id} 
                  value={id}
                  className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm text-muted-foreground"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
                branchId={branchId}
                school={school}
                branchId={currentBranchId}
              />
            )
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PrintHeaderFooter;
