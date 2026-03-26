import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Save, UploadCloud, Trash2, Download, Info } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Template Download Component
const TemplateDownload = () => {
  const handleDownloadTemplate = () => {
    // Create SVG template (2230 x 300)
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="2230" height="300" viewBox="0 0 2230 300">
  <!-- Background -->
  <rect width="2230" height="300" fill="white"/>
  
  <!-- Logo Placeholder Box -->
  <rect x="40" y="30" width="160" height="180" fill="#f5f5f5" stroke="#ddd" stroke-width="2"/>
  <text x="120" y="110" font-family="Arial, sans-serif" font-size="18" fill="#666" text-anchor="middle">LOGO</text>
  <text x="120" y="135" font-family="Arial, sans-serif" font-size="12" fill="#999" text-anchor="middle">(Add Here)</text>
  
  <!-- School Name -->
  <text x="240" y="80" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#1a365d">Your School Name Here</text>
  
  <!-- Tagline -->
  <text x="240" y="125" font-family="Arial, sans-serif" font-size="22" fill="#4a5568">School Tagline / Motto</text>
  
  <!-- Affiliation -->
  <text x="240" y="165" font-family="Arial, sans-serif" font-size="16" fill="#718096">Affiliated to: CBSE/ICSE/State Board (Affiliation No: XXXXXX)</text>
  
  <!-- Contact Details (Right Side) -->
  <text x="2190" y="60" font-family="Arial, sans-serif" font-size="16" fill="#4a5568" text-anchor="end">Address: Your School Address, City - PIN</text>
  <text x="2190" y="90" font-family="Arial, sans-serif" font-size="16" fill="#4a5568" text-anchor="end">Phone: +91 98765 43210</text>
  <text x="2190" y="120" font-family="Arial, sans-serif" font-size="16" fill="#4a5568" text-anchor="end">Email: school@example.com</text>
  <text x="2190" y="150" font-family="Arial, sans-serif" font-size="16" fill="#4a5568" text-anchor="end">Website: www.yourschool.com</text>
  
  <!-- Bottom Line -->
  <rect x="0" y="280" width="2230" height="20" fill="#3182ce"/>
</svg>`;

    // Create and download the SVG file
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'print_header_template_2230x300.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNGTemplate = () => {
    // Create canvas for PNG
    const canvas = document.createElement('canvas');
    canvas.width = 2230;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 2230, 300);
    
    // Logo placeholder box
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(40, 30, 160, 180);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 30, 160, 180);
    
    // Logo text
    ctx.fillStyle = '#666';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LOGO', 120, 110);
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.fillText('(Add Here)', 120, 135);
    
    // School name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('Your School Name Here', 240, 80);
    
    // Tagline
    ctx.fillStyle = '#4a5568';
    ctx.font = '22px Arial';
    ctx.fillText('School Tagline / Motto', 240, 125);
    
    // Affiliation
    ctx.fillStyle = '#718096';
    ctx.font = '16px Arial';
    ctx.fillText('Affiliated to: CBSE/ICSE/State Board (Affiliation No: XXXXXX)', 240, 165);
    
    // Contact details (right side)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4a5568';
    ctx.font = '16px Arial';
    ctx.fillText('Address: Your School Address, City - PIN', 2190, 60);
    ctx.fillText('Phone: +91 98765 43210', 2190, 90);
    ctx.fillText('Email: school@example.com', 2190, 120);
    ctx.fillText('Website: www.yourschool.com', 2190, 150);
    
    // Bottom line
    ctx.fillStyle = '#3182ce';
    ctx.fillRect(0, 280, 2230, 20);
    
    // Download as PNG
    const link = document.createElement('a');
    link.download = 'print_header_template_2230x300.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Download Header Template</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Download a ready-to-use template (2230px × 300px). Edit it with any image editor (Canva, Photoshop, etc.), 
            add your school logo & details, then upload.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="bg-white dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800"
              onClick={handleDownloadPNGTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG Template
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              className="text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Download SVG Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }],  // Explicit alignment buttons
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link', 'image'],
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'size',
  'blockquote', 'list', 'bullet', 'indent',
  'link', 'image', 'align'
];

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
      {/* Template Download Section */}
      <TemplateDownload />
      
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
            formats={quillFormats}
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
  const { selectedBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('fees_receipt');
  const [allSettings, setAllSettings] = useState({});
  const [school, setSchool] = useState(null);

  // Use selectedBranch from header
  const branchId = selectedBranch?.id;

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

      // Build query for print settings - use selectedBranch from header
      const { data, error } = await supabase
        .from('print_settings')
        .select('*')
        .eq('branch_id', branchId);

      if (error) {
        console.warn('Print settings fetch warning:', error.message);
      }

      console.log('Fetched print_settings for branch:', branchId, data);

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
  }, [branchId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (type, formData) => {
    if (!branchId) {
      toast({ variant: 'destructive', title: 'Error', description: 'School ID not found' });
      return;
    }

    setLoading(true);
    try {
      // Use selectedBranch from header
      const saveBranchId = branchId;
      
      // Check if record exists for this type + branch
      const { data: existing } = await supabase
        .from('print_settings')
        .select('id')
        .eq('branch_id', saveBranchId)
        .eq('type', type)
        .maybeSingle();

      const saveData = {
        branch_id: saveBranchId,
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
          <h1 className="text-2xl font-semibold text-foreground">Print Header Footer</h1>
          
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
                key={`${id}-${branchId}`}
                type={id}
                settings={allSettings[id]}
                onSave={handleSave}
                loading={loading}
                branchId={branchId}
                school={school}
              />
            )
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PrintHeaderFooter;
