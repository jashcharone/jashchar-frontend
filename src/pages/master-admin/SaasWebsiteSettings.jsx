import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, Plus, Trash2, Edit, Loader2, 
  Smartphone, Monitor, GripVertical, 
  Eye, EyeOff, Search, X, BookOpen, RefreshCw
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from '@/components/ui/switch';
import ImageUploader from '@/components/ImageUploader';
import { v4 as uuidv4 } from 'uuid';
import { Reorder } from 'framer-motion';
import { SaaSCmsPreview } from '@/components/cms/SaaSCmsPreview';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import DemoSchoolButtonSettingsTab from '@/components/cms/DemoSchoolButtonSettingsTab';
import { defaultCmsContent } from '@/config/defaultCmsContent';
import RichTextEditor from '@/components/front-cms/RichTextEditor';

const SaasWebsiteSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('desktop');
  const [activeSection, setActiveSection] = useState('header'); 
  const [editingPage, setEditingPage] = useState(null);
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [pageContent, setPageContent] = useState('');

  useEffect(() => {
      if (isPageDialogOpen) {
          setPageContent(editingPage?.content || '');
      }
  }, [isPageDialogOpen, editingPage]);
  
  // Initial State - Ensures structure exists even if DB is empty
  const [settings, setSettings] = useState(defaultCmsContent);
  
  const [activePlans, setActivePlans] = useState([]);

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Fetching SaaS settings...");
        const { data: settingsData, error } = await supabase.from('saas_website_settings').select('*').maybeSingle();
        
        if (error) throw error;

        if (settingsData) {
           console.log("Fetched settings for editor:", settingsData);
           setSettings(prev => ({
             ...prev,
             ...settingsData, // Merge DB data over defaults
             features: Array.isArray(settingsData.features) ? settingsData.features : (settingsData.general_settings?.features || prev.features),
             panels: Array.isArray(settingsData.panels) ? settingsData.panels : (settingsData.general_settings?.panels || prev.panels),
             // Ensure new sections are merged correctly if they exist, or use defaults
             offerings: settingsData.offerings || settingsData.general_settings?.offerings || prev.offerings,
             mobile_app: settingsData.mobile_app || settingsData.general_settings?.mobile_app || prev.mobile_app,
             timeline: settingsData.timeline || settingsData.general_settings?.timeline || prev.timeline,
             why_us: settingsData.why_us || settingsData.general_settings?.why_us || prev.why_us,
             clients: settingsData.clients || settingsData.general_settings?.clients || prev.clients,
             achievements: settingsData.achievements || settingsData.general_settings?.achievements || prev.achievements,
             stats: settingsData.stats || settingsData.general_settings?.stats || prev.stats,
             testimonials: settingsData.testimonials || settingsData.general_settings?.testimonials || prev.testimonials,
             pages: Array.isArray(settingsData.pages) ? settingsData.pages : (settingsData.general_settings?.pages || prev.pages),
             faq: Array.isArray(settingsData.faq) ? settingsData.faq : prev.faq,
             section_order: Array.isArray(settingsData.section_order) ? settingsData.section_order : prev.section_order,
             header: settingsData.header || prev.header,
             general_settings: settingsData.general_settings || prev.general_settings,
             contact: settingsData.contact || settingsData.general_settings?.contact || prev.contact,
             quick_cta_banner: settingsData.quick_cta_banner || settingsData.general_settings?.quick_cta_banner || prev.quick_cta_banner,
             quick_links: settingsData.quick_links || settingsData.general_settings?.quick_links || prev.quick_links,
             // Merge new demo fields specifically to ensure they're picked up if they exist
             demo_school_enabled: settingsData.demo_school_enabled !== undefined ? settingsData.demo_school_enabled : prev.demo_school_enabled,
             demo_school_label: settingsData.demo_school_label || prev.demo_school_label,
             demo_school_url: settingsData.demo_school_url || prev.demo_school_url,
             demo_school_open_in_new_tab: settingsData.demo_school_open_in_new_tab || prev.demo_school_open_in_new_tab
           }));
        } else {
            console.log("No settings found in DB, using initial defaults.");
        }

        const { data: plansData } = await supabase.from('subscription_plans').select('*').eq('status', true).eq('show_on_website', true).order('price');
        setActivePlans(plansData || []);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({ variant: 'destructive', title: 'Error loading settings', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  // Save Logic
  const syncMenuToPages = () => {
    const menuItems = settings.header?.menu_items || [];
    const currentPages = settings.pages || [];
    const newPages = [...currentPages];
    let addedCount = 0;

    // Helper to process items recursively
    const processItem = (item) => {
        // Generate slug from name if not present
        const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        // Check if page exists
        const exists = newPages.some(p => p.slug === slug);
        
        // Create page if it doesn't exist and isn't the homepage
        if (!exists && item.name !== 'School ERP') { 
             newPages.push({
                 slug: slug,
                 title: item.name,
                 content: `<h1>${item.name}</h1><p>Content coming soon...</p>`,
                 status: 'published'
             });
             addedCount++;
             
             // Update href if it's empty or hash
             if (item.href === '#' || item.href === '') {
                 item.href = `/page/${slug}`;
             }
        }

        if (item.children) {
            item.children.forEach(child => processItem(child));
        }
    };

    // Deep copy to avoid direct mutation during processing
    const newMenuItems = JSON.parse(JSON.stringify(menuItems));
    newMenuItems.forEach(processItem);

    if (addedCount > 0) {
        setSettings(prev => ({
            ...prev,
            header: { ...prev.header, menu_items: newMenuItems },
            pages: newPages
        }));
        toast({ title: "Success", description: `Created ${addedCount} new pages from menu items.` });
    } else {
        toast({ title: "Info", description: "All menu items already have corresponding pages." });
    }
  };

  const handleSave = async () => {
    // Validation for demo url
    if (settings.demo_school_enabled && settings.demo_school_url) {
        if (!settings.demo_school_url.startsWith('/') && !settings.demo_school_url.startsWith('http')) {
            toast({ variant: 'destructive', title: 'Validation Error', description: "Demo School URL must start with '/' or 'http'" });
            return;
        }
    }

    setSaving(true);
    try {
      const { id, created_at, updated_at, ...dataToSave } = settings;
      
      // FIX: Handle missing columns in Supabase by packing them into 'general_settings' (JSONB)
      // The following columns might not exist in the schema yet:
      // REMOVED: 'contact', 'features', 'panels' because they DO exist in the DB schema now.
      const missingColumns = ['achievements', 'timeline', 'mobile_app', 'offerings', 'why_us', 'clients', 'pages', 'quick_cta_banner', 'quick_links', 'stats'];
      
      // Ensure general_settings exists
      dataToSave.general_settings = dataToSave.general_settings || {};

      missingColumns.forEach(col => {
          if (dataToSave[col]) {
              // Move the data to general_settings.extra_sections
              dataToSave.general_settings[col] = dataToSave[col];
              // Remove from top level to avoid SQL error
              delete dataToSave[col];
          }
      });

      console.log("Attempting to save settings payload:", dataToSave);

      // Simple version history
      const snapshot = { 
          timestamp: new Date().toISOString(),
          summary: `Update via settings panel`
      };
      // Limit history size
      const versionHistory = [...(settings.version_history || [])].slice(-9);
      versionHistory.push(snapshot);
      
      // Check if row exists
      const { data: existing } = await supabase.from('saas_website_settings').select('id').maybeSingle();
      
      let error;
      if (existing) {
        console.log("Updating existing settings ID:", existing.id);
        const { error: updateError } = await supabase.from('saas_website_settings').update({ ...dataToSave, version_history: versionHistory }).eq('id', existing.id);
        error = updateError;
      } else {
        console.log("Inserting new settings row");
        const { error: insertError } = await supabase.from('saas_website_settings').insert([{ ...dataToSave, version_history: versionHistory }]);
        error = insertError;
      }

      if (error) throw error;

      console.log("Save successful!");
      toast({ title: 'Success', description: 'Website settings saved successfully. Changes should appear on homepage.' });
    } catch (error) {
      console.error("Save error:", error);
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value }
    }));
  };

  const updateRootSetting = (key, value) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Helper function to delete old file from Supabase storage
  const deleteOldFile = async (oldUrl) => {
      if (!oldUrl || !oldUrl.includes('supabase')) return;
      try {
          // Extract file path from URL
          // URL format: https://xxx.supabase.co/storage/v1/object/public/school-assets/cms/filename.ext
          const urlParts = oldUrl.split('/school-assets/');
          if (urlParts.length > 1) {
              const filePath = urlParts[1];
              console.log('Deleting old file:', filePath);
              const { error } = await supabase.storage.from('school-assets').remove([filePath]);
              if (error) {
                  console.warn('Failed to delete old file:', error.message);
              } else {
                  console.log('Old file deleted successfully');
              }
          }
      } catch (err) {
          console.warn('Error deleting old file:', err);
      }
  };

  // Upload new file and delete old one
  const uploadImage = async (file, folder = 'cms', oldUrl = null) => {
      if (!file) return null;
      
      // Delete old file first if provided
      if (oldUrl) {
          await deleteOldFile(oldUrl);
      }
      
      const fileName = `${folder}/${uuidv4()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('school-assets').upload(fileName, file);
      if (error) {
          console.error('Upload error:', error);
          toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
          return null;
      }
      const { data } = supabase.storage.from('school-assets').getPublicUrl(fileName);
      return data.publicUrl;
  };

  // Reordering
  const handleReorder = (newOrder) => {
      setSettings(prev => ({ ...prev, section_order: newOrder }));
  };

  // Helper for image size hints
  const ImageSizeHint = ({ type }) => {
      if (type === 'logo') return <p className="text-xs text-muted-foreground mt-1">Recommended Size: ~1350x300px (4.5:1 ratio). Transparent PNG preferred.</p>;
      if (type === 'favicon') return <p className="text-xs text-muted-foreground mt-1">Recommended Size: 512x512px (Square). PNG or ICO format.</p>;
      if (type === 'hero') return <p className="text-xs text-muted-foreground mt-1">Recommended Size: 1920x1080px. You can upload multiple images separated by commas for a slider effect.</p>;
      return null;
  };

  // --- Editors Dialog State ---
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  
  const [panelDialogOpen, setPanelDialogOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null);

  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);

  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  const renderEditor = () => {
    switch (activeSection) {
        case 'header':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Header & Branding</h3>
                    </div>

                    {/* Favicon Settings */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/40">
                        <h4 className="font-medium text-sm uppercase text-muted-foreground">Browser Favicon</h4>
                        <div className="grid gap-3">
                            <Label>Favicon Image (ICO/PNG)</Label>
                            <div className="flex items-start gap-6">
                                <div className="h-16 w-16 bg-card rounded-lg border flex items-center justify-center shadow-sm overflow-hidden">
                                    {settings.general_settings?.favicon_url ? (
                                        <img src={settings.general_settings.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">None</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <ImageUploader 
                                        onFileChange={async (f) => { 
                                            const oldUrl = settings.general_settings?.favicon_url;
                                            const url = await uploadImage(f, 'cms', oldUrl); 
                                            if (url) updateSection('general_settings', 'favicon_url', url); 
                                        }} 
                                        buttonText="Upload Favicon"
                                        showCrop={false}
                                        showCamera={false}
                                        showInstruction={false}
                                    />
                                    <ImageSizeHint type="favicon" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PWA / Mobile App Settings */}
                    <div className="space-y-4 p-4 border rounded-lg bg-card">
                        <h4 className="font-medium text-sm uppercase text-muted-foreground flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            PWA / Mobile App Settings
                        </h4>
                        <p className="text-xs text-muted-foreground mb-4">
                            Configure how the app appears when installed on a device.
                        </p>
                        
                        <div className="grid gap-3">
                            <Label>App Name (Short Name)</Label>
                            <Input 
                                value={settings.general_settings?.pwa_app_name || ''} 
                                onChange={(e) => updateSection('general_settings', 'pwa_app_name', e.target.value)} 
                                placeholder="e.g. Jashchar" 
                            />
                            <p className="text-xs text-muted-foreground">Displayed on the home screen (max 12 chars recommended).</p>
                        </div>

                        <div className="grid gap-3">
                            <Label>App Icon (512x512)</Label>
                            <div className="flex items-start gap-6">
                                <div className="h-24 w-24 bg-muted/40 rounded-xl border flex items-center justify-center overflow-hidden shadow-sm">
                                    {settings.general_settings?.pwa_icon_url ? (
                                        <img src={settings.general_settings.pwa_icon_url} alt="App Icon" className="h-full w-full object-cover" />
                                    ) : (
                                        <Smartphone className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <ImageUploader 
                                        onFileChange={async (f) => { 
                                            const oldUrl = settings.general_settings?.pwa_icon_url;
                                            const url = await uploadImage(f, 'cms', oldUrl); 
                                            if (url) updateSection('general_settings', 'pwa_icon_url', url); 
                                        }} 
                                        buttonText="Upload App Icon"
                                        showCrop={false}
                                        showCamera={false}
                                        showInstruction={false}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Required: 512x512px PNG. Used for splash screen and home screen.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid gap-3">
                            <Label>Theme Color</Label>
                            <div className="flex gap-2">
                                <Input 
                                    type="color" 
                                    value={settings.general_settings?.pwa_theme_color || '#4f46e5'} 
                                    onChange={(e) => updateSection('general_settings', 'pwa_theme_color', e.target.value)}
                                    className="w-12 h-10 p-1"
                                />
                                <Input 
                                    value={settings.general_settings?.pwa_theme_color || '#4f46e5'} 
                                    onChange={(e) => updateSection('general_settings', 'pwa_theme_color', e.target.value)} 
                                    placeholder="#4f46e5" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Navigation Bar Settings */}
                    <div className="space-y-4 p-4 border rounded-lg bg-card">
                        <h4 className="font-medium text-sm uppercase text-muted-foreground">Navigation Bar</h4>
                        
                        <div className="grid gap-3">
                            <Label>Company Name</Label>
                            <Input 
                                value={settings.header.company_name} 
                                onChange={(e) => updateSection('header', 'company_name', e.target.value)} 
                                placeholder="e.g. Jashchar ERP" 
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label>Company Logo</Label>
                            <div className="flex items-start gap-6">
                                <div className="h-32 w-auto min-w-[64px] bg-muted/40 rounded-lg border flex items-center justify-center px-2 overflow-hidden">
                                    {settings.header.company_logo ? (
                                        <img src={settings.header.company_logo} alt="Logo" className="h-24 w-auto object-contain" />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">No Logo</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <ImageUploader 
                                        onFileChange={async (f) => { 
                                            const oldUrl = settings.header?.company_logo;
                                            const url = await uploadImage(f, 'cms', oldUrl); 
                                            if (url) updateSection('header', 'company_logo', url); 
                                        }} 
                                        buttonText="Upload Logo"
                                        showCrop={false}
                                        showCamera={false}
                                        showInstruction={false}
                                    />
                                    <ImageSizeHint type="logo" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Login Button Text</Label>
                                <Input 
                                    value={settings.header.login_button_text || 'Login'} 
                                    onChange={(e) => updateSection('header', 'login_button_text', e.target.value)} 
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Login Button URL</Label>
                                <Input 
                                    value={settings.header.login_button_url || '/login'} 
                                    onChange={(e) => updateSection('header', 'login_button_url', e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Top Bar Settings */}
                    <div className="space-y-4 p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm uppercase text-muted-foreground">Top Bar Settings</h4>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="top-bar-toggle" className="text-xs">Enable</Label>
                                <Switch 
                                    id="top-bar-toggle"
                                    checked={settings.header.top_bar_enabled !== false}
                                    onCheckedChange={(checked) => updateSection('header', 'top_bar_enabled', checked)}
                                />
                            </div>
                        </div>

                        {settings.header.top_bar_enabled !== false && (
                            <div className="grid gap-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Sales Enquiry Text</Label>
                                        <Input 
                                            value={settings.header.sales_enquiry_text || ''} 
                                            onChange={(e) => updateSection('header', 'sales_enquiry_text', e.target.value)} 
                                            placeholder="Sales Enquiry"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Phone Number</Label>
                                        <Input 
                                            value={settings.header.phone_number || ''} 
                                            onChange={(e) => updateSection('header', 'phone_number', e.target.value)} 
                                            placeholder="+91 70659 65900"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Email Address</Label>
                                        <Input 
                                            value={settings.header.email_address || ''} 
                                            onChange={(e) => updateSection('header', 'email_address', e.target.value)} 
                                            placeholder="sales@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Facebook Signup Button</Label>
                                        <Switch 
                                            checked={settings.header.facebook_signup_enabled !== false}
                                            onCheckedChange={(checked) => updateSection('header', 'facebook_signup_enabled', checked)}
                                        />
                                    </div>
                                    {settings.header.facebook_signup_enabled !== false && (
                                        <Input 
                                            value={settings.header.facebook_signup_url || '#'} 
                                            onChange={(e) => updateSection('header', 'facebook_signup_url', e.target.value)} 
                                            placeholder="Facebook Signup URL"
                                        />
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label>Social Media Links</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input 
                                            placeholder="Facebook URL" 
                                            value={settings.header.social_links?.facebook || ''}
                                            onChange={(e) => {
                                                const newLinks = { ...settings.header.social_links, facebook: e.target.value };
                                                updateSection('header', 'social_links', newLinks);
                                            }}
                                        />
                                        <Input 
                                            placeholder="Instagram URL" 
                                            value={settings.header.social_links?.instagram || ''}
                                            onChange={(e) => {
                                                const newLinks = { ...settings.header.social_links, instagram: e.target.value };
                                                updateSection('header', 'social_links', newLinks);
                                            }}
                                        />
                                        <Input 
                                            placeholder="YouTube URL" 
                                            value={settings.header.social_links?.youtube || ''}
                                            onChange={(e) => {
                                                const newLinks = { ...settings.header.social_links, youtube: e.target.value };
                                                updateSection('header', 'social_links', newLinks);
                                            }}
                                        />
                                        <Input 
                                            placeholder="LinkedIn URL" 
                                            value={settings.header.social_links?.linkedin || ''}
                                            onChange={(e) => {
                                                const newLinks = { ...settings.header.social_links, linkedin: e.target.value };
                                                updateSection('header', 'social_links', newLinks);
                                            }}
                                        />
                                        <Input 
                                            placeholder="Twitter URL" 
                                            value={settings.header.social_links?.twitter || ''}
                                            onChange={(e) => {
                                                const newLinks = { ...settings.header.social_links, twitter: e.target.value };
                                                updateSection('header', 'social_links', newLinks);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <Label className="text-base font-semibold">Navigation Menu</Label>
                            <Button size="sm" variant="outline" onClick={() => {
                                const currentMenus = settings.header.menu_items || [];
                                updateSection('header', 'menu_items', [...currentMenus, { name: 'New Link', href: '#' }]);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Add Link
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {(settings.header.menu_items || []).map((item, idx) => (
                                <div key={idx} className="border rounded-lg p-3 bg-muted/40">
                                    <div className="flex gap-2 items-center mb-2">
                                        <Input 
                                            value={item.name} 
                                            onChange={(e) => {
                                                const newMenus = [...(settings.header.menu_items || [])];
                                                newMenus[idx] = { ...newMenus[idx], name: e.target.value };
                                                updateSection('header', 'menu_items', newMenus);
                                            }}
                                            placeholder="Link Name"
                                            className="flex-1 font-medium"
                                        />
                                        <Input 
                                            value={item.href} 
                                            onChange={(e) => {
                                                const newMenus = [...(settings.header.menu_items || [])];
                                                newMenus[idx] = { ...newMenus[idx], href: e.target.value };
                                                updateSection('header', 'menu_items', newMenus);
                                            }}
                                            placeholder="URL (#section or /page)"
                                            className="flex-1"
                                        />
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 hover:text-red-600" onClick={() => {
                                            const newMenus = (settings.header.menu_items || []).filter((_, i) => i !== idx);
                                            updateSection('header', 'menu_items', newMenus);
                                        }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    
                                    {/* Sub-menu Items */}
                                    <div className="pl-6 border-l-2 border-border ml-2 space-y-2">
                                        {(item.children || []).map((child, cIdx) => (
                                            <div key={cIdx} className="flex gap-2 items-center">
                                                <Input 
                                                    value={child.name} 
                                                    onChange={(e) => {
                                                        const newMenus = [...(settings.header.menu_items || [])];
                                                        const newChildren = [...(newMenus[idx].children || [])];
                                                        newChildren[cIdx] = { ...newChildren[cIdx], name: e.target.value };
                                                        newMenus[idx] = { ...newMenus[idx], children: newChildren };
                                                        updateSection('header', 'menu_items', newMenus);
                                                    }}
                                                    placeholder="Sub-link Name"
                                                    className="flex-1 h-8 text-sm"
                                                />
                                                <Input 
                                                    value={child.href} 
                                                    onChange={(e) => {
                                                        const newMenus = [...(settings.header.menu_items || [])];
                                                        const newChildren = [...(newMenus[idx].children || [])];
                                                        newChildren[cIdx] = { ...newChildren[cIdx], href: e.target.value };
                                                        newMenus[idx] = { ...newMenus[idx], children: newChildren };
                                                        updateSection('header', 'menu_items', newMenus);
                                                    }}
                                                    placeholder="Sub-link URL"
                                                    className="flex-1 h-8 text-sm"
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => {
                                                    const newMenus = [...(settings.header.menu_items || [])];
                                                    const newChildren = (newMenus[idx].children || []).filter((_, i) => i !== cIdx);
                                                    newMenus[idx] = { ...newMenus[idx], children: newChildren };
                                                    updateSection('header', 'menu_items', newMenus);
                                                }}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button size="sm" variant="ghost" className="text-xs text-primary h-7 hover:bg-primary/10" onClick={() => {
                                            const newMenus = [...(settings.header.menu_items || [])];
                                            const newChildren = [...(newMenus[idx].children || [])];
                                            newChildren.push({ name: 'New Sub-link', href: '#' });
                                            newMenus[idx] = { ...newMenus[idx], children: newChildren };
                                            updateSection('header', 'menu_items', newMenus);
                                        }}>
                                            <Plus className="h-3 w-3 mr-1" /> Add Sub-link
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {(!settings.header.menu_items || settings.header.menu_items.length === 0) && (
                                <div className="text-sm text-muted-foreground text-center py-2">Using default menu items. Add custom items to override.</div>
                            )}
                        </div>
                    </div>

                    {/* Demo School Button Settings */}
                    <DemoSchoolButtonSettingsTab 
                        settings={settings} 
                        onUpdate={updateRootSetting} 
                    />
                </div>
            );

        case 'hero':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                         <h3 className="text-xl font-semibold">Hero Section</h3>
                         <div className="flex items-center space-x-2">
                            <Label htmlFor="hero-enabled">Enabled</Label>
                            <Switch id="hero-enabled" checked={settings.hero.enabled !== false} onCheckedChange={(c) => updateSection('hero', 'enabled', c)} />
                         </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Main Title</Label>
                        <Input value={settings.hero.title} onChange={(e) => updateSection('hero', 'title', e.target.value)} placeholder="Transform Your School Management" />
                    </div>
                    <div className="grid gap-3">
                        <Label>Subtitle</Label>
                        <Textarea value={settings.hero.subtitle} onChange={(e) => updateSection('hero', 'subtitle', e.target.value)} placeholder="Comprehensive ERP solution..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Primary Button Text</Label><Input value={settings.hero.ctaText} onChange={(e) => updateSection('hero', 'ctaText', e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Primary Button Link</Label><Input value={settings.hero.ctaLink} onChange={(e) => updateSection('hero', 'ctaLink', e.target.value)} /></div>
                    </div>
                     <div className="grid gap-3">
                        <Label>Hero Images</Label>
                        <div className="space-y-3">
                            {settings.hero.image && (
                                <div className="flex gap-4 overflow-x-auto p-2">
                                    {settings.hero.image.split(',').map((img, idx) => (
                                        <div key={idx} className="relative group flex-shrink-0">
                                            <img src={img.trim()} alt={`Hero ${idx}`} className="h-20 w-32 object-cover rounded border bg-muted" />
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const imageUrl = img.trim();
                                                    await deleteOldFile(imageUrl);
                                                    const images = settings.hero.image.split(',').map(s => s.trim()).filter(Boolean);
                                                    images.splice(idx, 1);
                                                    updateSection('hero', 'image', images.join(', '));
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                title="Remove Image"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Input 
                                        value={settings.hero.image || ''} 
                                        onChange={(e) => updateSection('hero', 'image', e.target.value)} 
                                        placeholder="Paste image URL(s) here, separated by commas"
                                    />
                                </div>
                                <ImageUploader onFileChange={async (f) => { 
                                    const url = await uploadImage(f); 
                                    if (url) {
                                        const current = settings.hero.image || '';
                                        const newValue = current ? `${current}, ${url}` : url;
                                        updateSection('hero', 'image', newValue);
                                    }
                                }} buttonText="Add Image" showCrop={false} showCamera={false} showInstruction={false} />
                            </div>
                            <ImageSizeHint type="hero" />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between border p-3 rounded-lg bg-muted/40">
                        <div className="space-y-0.5">
                            <Label className="text-base">Show Enquiry Form</Label>
                            <p className="text-sm text-muted-foreground">Display the "Get Jashchar ERP" form below the hero section (Edunext style).</p>
                        </div>
                        <Switch 
                            checked={settings.hero.show_enquiry_form !== false} 
                            onCheckedChange={(c) => updateSection('hero', 'show_enquiry_form', c)} 
                        />
                    </div>

                    {/* Video Section */}
                    <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <Label className="text-base font-semibold">Hero Video (Optional)</Label>
                                <p className="text-xs text-muted-foreground">Add a background video instead of images. Supports YouTube, Vimeo, or direct MP4 links.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <Label>Enable Video</Label>
                            <Switch 
                                checked={settings.hero.video_enabled === true} 
                                onCheckedChange={(c) => updateSection('hero', 'video_enabled', c)} 
                            />
                        </div>
                        
                        {settings.hero.video_enabled && (
                            <div className="space-y-3">
                                <div className="grid gap-2">
                                    <Label>Video URL or Upload</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <Input 
                                                value={settings.hero.video_url || ''} 
                                                onChange={(e) => updateSection('hero', 'video_url', e.target.value)} 
                                                placeholder="Paste YouTube/Vimeo URL or upload video file"
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="video/mp4,video/webm,video/ogg"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        // Check file size (max 20MB - Supabase limit)
                                                        if (file.size > 20 * 1024 * 1024) {
                                                            toast({ variant: 'destructive', title: 'File too large', description: 'Video must be less than 20MB. Use YouTube/Vimeo for larger videos.' });
                                                            return;
                                                        }
                                                        try {
                                                            toast({ title: 'Uploading video...', description: 'Please wait' });
                                                            const oldUrl = settings.hero?.video_url;
                                                            const url = await uploadImage(file, 'videos', oldUrl);
                                                            if (url) {
                                                                updateSection('hero', 'video_url', url);
                                                                toast({ title: 'Success!', description: 'Video uploaded successfully' });
                                                            } else {
                                                                toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload video' });
                                                            }
                                                        } catch (err) {
                                                            console.error('Video upload error:', err);
                                                            toast({ variant: 'destructive', title: 'Upload failed', description: err.message || 'Failed to upload video' });
                                                        }
                                                    }
                                                    e.target.value = ''; // Reset input
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                id="hero-video-upload"
                                            />
                                            <Button type="button" variant="outline" className="pointer-events-none">
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                Upload Video
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        YouTube/Vimeo links recommended. Direct upload: MP4/WebM (max 20MB)
                                    </p>
                                </div>
                                
                                {settings.hero.video_url && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm text-muted-foreground">Preview</Label>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={async () => {
                                                    await deleteOldFile(settings.hero.video_url);
                                                    updateSection('hero', 'video_url', '');
                                                }}
                                            >
                                                <X className="h-4 w-4 mr-1" /> Remove Video
                                            </Button>
                                        </div>
                                        <div className="rounded-lg overflow-hidden border bg-black aspect-video max-w-md">
                                            {settings.hero.video_url.includes('youtube.com') || settings.hero.video_url.includes('youtu.be') ? (
                                                <iframe 
                                                    className="w-full h-full"
                                                    src={`https://www.youtube.com/embed/${settings.hero.video_url.includes('youtu.be') 
                                                        ? settings.hero.video_url.split('youtu.be/')[1]?.split('?')[0] 
                                                        : new URLSearchParams(new URL(settings.hero.video_url).search).get('v')}`}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    title="Hero Video Preview"
                                                />
                                            ) : settings.hero.video_url.includes('vimeo.com') ? (
                                                <iframe 
                                                    className="w-full h-full"
                                                    src={`https://player.vimeo.com/video/${settings.hero.video_url.split('vimeo.com/')[1]?.split('?')[0]}`}
                                                    allow="autoplay; fullscreen; picture-in-picture"
                                                    allowFullScreen
                                                    title="Hero Video Preview"
                                                />
                                            ) : (
                                                <video 
                                                    src={settings.hero.video_url} 
                                                    className="w-full h-full object-cover"
                                                    controls
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between border p-2 rounded bg-background">
                                        <Label className="text-sm">Autoplay</Label>
                                        <Switch 
                                            checked={settings.hero.video_autoplay !== false} 
                                            onCheckedChange={(c) => updateSection('hero', 'video_autoplay', c)} 
                                        />
                                    </div>
                                    <div className="flex items-center justify-between border p-2 rounded bg-background">
                                        <Label className="text-sm">Muted</Label>
                                        <Switch 
                                            checked={settings.hero.video_muted !== false} 
                                            onCheckedChange={(c) => updateSection('hero', 'video_muted', c)} 
                                        />
                                    </div>
                                    <div className="flex items-center justify-between border p-2 rounded bg-background">
                                        <Label className="text-sm">Loop</Label>
                                        <Switch 
                                            checked={settings.hero.video_loop !== false} 
                                            onCheckedChange={(c) => updateSection('hero', 'video_loop', c)} 
                                        />
                                    </div>
                                    <div className="flex items-center justify-between border p-2 rounded bg-background">
                                        <Label className="text-sm">Show Controls</Label>
                                        <Switch 
                                            checked={settings.hero.video_controls === true} 
                                            onCheckedChange={(c) => updateSection('hero', 'video_controls', c)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        
        case 'features':
             return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h3 className="text-xl font-semibold">Features Grid</h3>
                        <Button size="sm" onClick={() => { setEditingFeature(null); setFeatureDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Add Feature</Button>
                    </div>
                    <div className="space-y-3">
                        {settings.features.map((feat, idx) => (
                            <div key={idx} className="p-4 border rounded-lg flex justify-between items-center bg-card hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-mono text-xs">{feat.icon || 'Icon'}</div>
                                    <div>
                                        <div className="font-semibold">{feat.title}</div>
                                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">{feat.description}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingFeature({...feat, index: idx}); setFeatureDialogOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                                            const newFeats = settings.features.filter((_, i) => i !== idx);
                                            setSettings(p => ({...p, features: newFeats}));
                                    }}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                        {settings.features.length === 0 && <div className="text-center py-8 text-muted-foreground">No features added yet.</div>}
                    </div>
                </div>
             );

        case 'panels':
             return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <div>
                            <h3 className="text-xl font-semibold">App Panels</h3>
                            <p className="text-sm text-muted-foreground">Manage specific sections for School Owner, Teacher, Student, etc.</p>
                        </div>
                        <Button size="sm" onClick={() => { setEditingPanel(null); setPanelDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Add Panel</Button>
                    </div>
                    <div className="space-y-4">
                        {settings.panels.map((panel, idx) => (
                            <div key={idx} className="p-4 border rounded-lg bg-card hover:shadow-md transition-all">
                                <div className="flex gap-4">
                                    <div className="h-20 w-20 bg-muted rounded-md overflow-hidden shrink-0">
                                        {panel.image ? <img src={panel.image} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-muted-foreground/50">Img</div>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg">{panel.title}</h4>
                                                <p className="text-sm text-muted-foreground mb-2">{panel.subtitle}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingPanel({...panel, index: idx}); setPanelDialogOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                                                        const newPanels = settings.panels.filter((_, i) => i !== idx);
                                                        setSettings(p => ({...p, panels: newPanels}));
                                                }}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {panel.features && panel.features.map((f, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {settings.panels.length === 0 && <div className="text-center py-8 text-muted-foreground bg-muted/40 rounded-lg border border-dashed">No panels added yet. Add School Owner, Teacher, etc. panels here.</div>}
                    </div>
                </div>
             );

        case 'testimonials':
             return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h3 className="text-xl font-semibold">Testimonials</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.testimonials.enabled !== false} onCheckedChange={(c) => updateSection('testimonials', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Title</Label>
                        <Input value={settings.testimonials.title} onChange={(e) => updateSection('testimonials', 'title', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Subtitle</Label>
                        <Input value={settings.testimonials.subtitle} onChange={(e) => updateSection('testimonials', 'subtitle', e.target.value)} />
                    </div>
                    <div className="flex justify-between items-center pt-4">
                        <Label>Testimonial Items</Label>
                        <Button size="sm" onClick={() => { setEditingTestimonial(null); setTestimonialDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Add</Button>
                    </div>
                    <div className="grid gap-3">
                        {(settings.testimonials.items || []).map((test, idx) => (
                            <div key={idx} className="p-3 border rounded-lg flex justify-between items-center bg-card">
                                <div className="flex items-center gap-3">
                                     {test.image && <img src={test.image} className="h-8 w-8 rounded-full object-cover" />}
                                     <div>
                                        <div className="font-medium">{test.name}</div>
                                        <div className="text-xs text-muted-foreground">{test.title}</div>
                                     </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingTestimonial({...test, index: idx}); setTestimonialDialogOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                                            const newItems = settings.testimonials.items.filter((_, i) => i !== idx);
                                            updateSection('testimonials', 'items', newItems);
                                    }}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             );

        case 'cta':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                         <h3 className="text-xl font-semibold">Call to Action</h3>
                         <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.cta_section.enabled !== false} onCheckedChange={(c) => updateSection('cta_section', 'enabled', c)} />
                         </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Headline</Label>
                        <Input value={settings.cta_section.headline} onChange={(e) => updateSection('cta_section', 'headline', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Description</Label>
                        <Textarea value={settings.cta_section.description} onChange={(e) => updateSection('cta_section', 'description', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Button Text</Label>
                        <Input value={settings.cta_section.buttonText} onChange={(e) => updateSection('cta_section', 'buttonText', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Background Color</Label>
                        <div className="flex gap-2">
                            <Input type="color" value={settings.cta_section.background} onChange={(e) => updateSection('cta_section', 'background', e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                            <Input value={settings.cta_section.background} onChange={(e) => updateSection('cta_section', 'background', e.target.value)} className="font-mono" />
                        </div>
                    </div>
                </div>
            );
        
        case 'seo':
            return (
                <div className="space-y-6 p-6">
                    <h3 className="text-xl font-semibold border-b pb-4">SEO & Metadata</h3>
                    <div className="grid gap-3">
                        <Label>Meta Title</Label>
                        <Input value={settings.seo_settings.meta_title} onChange={(e) => updateSection('seo_settings', 'meta_title', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Meta Description</Label>
                        <Textarea value={settings.seo_settings.meta_description} onChange={(e) => updateSection('seo_settings', 'meta_description', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Keywords</Label>
                        <Input value={settings.seo_settings.keywords} onChange={(e) => updateSection('seo_settings', 'keywords', e.target.value)} placeholder="school, erp, management, system" />
                    </div>
                </div>
            );

        case 'faq':
             return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h3 className="text-xl font-semibold">FAQs</h3>
                        <Button size="sm" onClick={() => { setEditingFaq(null); setFaqDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Add FAQ</Button>
                    </div>
                     <div className="space-y-3">
                         {settings.faq.map((item, idx) => (
                             <div key={idx} className="p-4 border rounded-lg flex justify-between items-start bg-card">
                                 <div className="flex-1 pr-4">
                                     <div className="font-medium text-sm">{item.question}</div>
                                     <div className="text-xs text-muted-foreground truncate mt-1">{item.answer}</div>
                                 </div>
                                 <div className="flex gap-1 shrink-0">
                                     <Button variant="ghost" size="icon" onClick={() => { setEditingFaq({...item, index: idx}); setFaqDialogOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                     <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => {
                                            const newFaq = settings.faq.filter((_, i) => i !== idx);
                                            setSettings(p => ({...p, faq: newFaq}));
                                     }}><Trash2 className="h-4 w-4"/></Button>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
             );
        
        case 'pricing':
             return (
                <div className="space-y-6 p-6">
                     <div className="flex justify-between items-center border-b pb-4">
                         <h3 className="text-xl font-semibold">Pricing Section</h3>
                         <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.pricing.enabled !== false} onCheckedChange={(c) => updateSection('pricing', 'enabled', c)} />
                         </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Headline</Label>
                        <Input value={settings.pricing.title} onChange={(e) => updateSection('pricing', 'title', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Subtitle</Label>
                        <Textarea value={settings.pricing.subtitle} onChange={(e) => updateSection('pricing', 'subtitle', e.target.value)} />
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
                        Pricing plans are managed in the "Subscription Plans" section of the Master Admin dashboard.
                    </div>
                </div>
             );
             
        case 'offerings':
            // Ensure categories exist (migration from old structure)
            // If both categories and items are missing/empty, use default content
            let offeringCategories = settings.offerings.categories;
            
            if (!offeringCategories) {
                if (settings.offerings.items && settings.offerings.items.length > 0) {
                    // Migration: Has old items, put them in 'General'
                    offeringCategories = [{ id: 'default', label: 'General', items: settings.offerings.items }];
                } else {
                    // Empty or new: Use default content structure
                    offeringCategories = defaultCmsContent.offerings.categories;
                }
            }

            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Offerings Section</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.offerings.enabled !== false} onCheckedChange={(c) => updateSection('offerings', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Title</Label>
                        <Input value={settings.offerings.title || defaultCmsContent.offerings.title} onChange={(e) => updateSection('offerings', 'title', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Subtitle</Label>
                        <Textarea value={settings.offerings.subtitle || defaultCmsContent.offerings.subtitle} onChange={(e) => updateSection('offerings', 'subtitle', e.target.value)} />
                    </div>

                    <div className="space-y-6 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <Label className="font-semibold text-lg">Categories (Tabs)</Label>
                            <Button size="sm" onClick={() => {
                                const newCats = [...offeringCategories, { id: uuidv4(), label: 'New Category', items: [] }];
                                updateSection('offerings', 'categories', newCats);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Add Category
                            </Button>
                        </div>

                        <Accordion type="single" collapsible className="w-full space-y-2">
                            {offeringCategories.map((cat, catIdx) => (
                                <AccordionItem key={cat.id || catIdx} value={`cat-${catIdx}`} className="border rounded-lg px-4 bg-card">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-3 w-full text-left">
                                            <span className="font-medium">{cat.label}</span>
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                {cat.items?.length || 0} items
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 pb-4 space-y-4">
                                        <div className="flex gap-2 items-end border-b pb-4">
                                            <div className="grid gap-2 flex-1">
                                                <Label>Category Label</Label>
                                                <Input 
                                                    value={cat.label} 
                                                    onChange={(e) => {
                                                        const newCats = [...offeringCategories];
                                                        newCats[catIdx].label = e.target.value;
                                                        updateSection('offerings', 'categories', newCats);
                                                    }} 
                                                />
                                            </div>
                                            <Button 
                                                variant="destructive" 
                                                size="icon"
                                                onClick={() => {
                                                    const newCats = offeringCategories.filter((_, i) => i !== catIdx);
                                                    updateSection('offerings', 'categories', newCats);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-sm font-medium text-muted-foreground">Items in {cat.label}</Label>
                                                <Button size="sm" variant="outline" onClick={() => {
                                                    const newCats = [...offeringCategories];
                                                    newCats[catIdx].items = [...(newCats[catIdx].items || []), { title: 'New Item', description: 'Description', link: '#', icon: 'BookOpen' }];
                                                    updateSection('offerings', 'categories', newCats);
                                                }}>
                                                    <Plus className="h-3 w-3 mr-1" /> Add Item
                                                </Button>
                                            </div>

                                            <div className="grid gap-3">
                                                {(cat.items || []).map((item, itemIdx) => (
                                                    <div key={itemIdx} className="p-3 border rounded bg-muted/20 space-y-2 relative group">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="absolute top-2 right-2 h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                const newCats = [...offeringCategories];
                                                                newCats[catIdx].items = newCats[catIdx].items.filter((_, i) => i !== itemIdx);
                                                                updateSection('offerings', 'categories', newCats);
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                        <div className="grid grid-cols-2 gap-2 pr-8">
                                                            <Input 
                                                                value={item.title} 
                                                                onChange={(e) => {
                                                                    const newCats = [...offeringCategories];
                                                                    newCats[catIdx].items[itemIdx].title = e.target.value;
                                                                    updateSection('offerings', 'categories', newCats);
                                                                }} 
                                                                placeholder="Title"
                                                                className="font-medium"
                                                            />
                                                            <Input 
                                                                value={item.icon} 
                                                                onChange={(e) => {
                                                                    const newCats = [...offeringCategories];
                                                                    newCats[catIdx].items[itemIdx].icon = e.target.value;
                                                                    updateSection('offerings', 'categories', newCats);
                                                                }} 
                                                                placeholder="Icon Name (e.g. BookOpen)"
                                                            />
                                                        </div>
                                                        <Textarea 
                                                            value={item.description} 
                                                            onChange={(e) => {
                                                                const newCats = [...offeringCategories];
                                                                newCats[catIdx].items[itemIdx].description = e.target.value;
                                                                updateSection('offerings', 'categories', newCats);
                                                            }} 
                                                            placeholder="Description"
                                                            className="text-xs h-16 resize-none"
                                                        />
                                                        <Input 
                                                            value={item.link} 
                                                            onChange={(e) => {
                                                                const newCats = [...offeringCategories];
                                                                newCats[catIdx].items[itemIdx].link = e.target.value;
                                                                updateSection('offerings', 'categories', newCats);
                                                            }} 
                                                            placeholder="Link URL"
                                                            className="text-xs"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            );

        case 'mobile_app':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Mobile App Section</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.mobile_app.enabled !== false} onCheckedChange={(c) => updateSection('mobile_app', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Tagline</Label>
                        <Input value={settings.mobile_app.tagline} onChange={(e) => updateSection('mobile_app', 'tagline', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Title</Label>
                        <Input value={settings.mobile_app.title} onChange={(e) => updateSection('mobile_app', 'title', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Description</Label>
                        <Textarea value={settings.mobile_app.description} onChange={(e) => updateSection('mobile_app', 'description', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>App Image</Label>
                        <div className="flex items-center gap-4">
                            {settings.mobile_app.image && <img src={settings.mobile_app.image} className="h-20 w-auto rounded border" />}
                            <ImageUploader onFileChange={async (f) => { 
                                const oldUrl = settings.mobile_app?.image;
                                const url = await uploadImage(f, 'cms', oldUrl); 
                                if(url) updateSection('mobile_app', 'image', url); 
                            }} showCrop={false} showCamera={false} showInstruction={false} />
                        </div>
                    </div>
                </div>
            );

        case 'timeline':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Timeline / History</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.timeline.enabled !== false} onCheckedChange={(c) => updateSection('timeline', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Title</Label>
                        <Input value={settings.timeline.title} onChange={(e) => updateSection('timeline', 'title', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Subtitle</Label>
                        <Textarea value={settings.timeline.subtitle} onChange={(e) => updateSection('timeline', 'subtitle', e.target.value)} />
                    </div>
                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <Label className="font-semibold">Timeline Steps</Label>
                            <Button size="sm" variant="outline" onClick={() => {
                                const newItems = [...(settings.timeline.items || []), { year: '2025', title: 'New Milestone', description: 'Description' }];
                                updateSection('timeline', 'items', newItems);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Add Step
                            </Button>
                        </div>
                        {(settings.timeline.items || []).map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-start p-2 border rounded bg-muted/40 relative group">
                                <Input 
                                    value={item.year} 
                                    onChange={(e) => {
                                        const newItems = [...settings.timeline.items];
                                        newItems[idx].year = e.target.value;
                                        updateSection('timeline', 'items', newItems);
                                    }} 
                                    className="w-20 font-bold"
                                    placeholder="Year"
                                />
                                <div className="flex-1 space-y-2">
                                    <Input 
                                        value={item.title} 
                                        onChange={(e) => {
                                            const newItems = [...settings.timeline.items];
                                            newItems[idx].title = e.target.value;
                                            updateSection('timeline', 'items', newItems);
                                        }} 
                                        placeholder="Title"
                                    />
                                    <Input 
                                        value={item.description} 
                                        onChange={(e) => {
                                            const newItems = [...settings.timeline.items];
                                            newItems[idx].description = e.target.value;
                                            updateSection('timeline', 'items', newItems);
                                        }} 
                                        placeholder="Description"
                                        className="text-xs"
                                    />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        const newItems = settings.timeline.items.filter((_, i) => i !== idx);
                                        updateSection('timeline', 'items', newItems);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'why_us':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Why Us Section</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.why_us.enabled !== false} onCheckedChange={(c) => updateSection('why_us', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Title</Label>
                        <Input value={settings.why_us.title} onChange={(e) => updateSection('why_us', 'title', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Subtitle</Label>
                        <Textarea value={settings.why_us.subtitle} onChange={(e) => updateSection('why_us', 'subtitle', e.target.value)} />
                    </div>
                    <div className="space-y-2 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <Label>Points</Label>
                            <Button size="sm" variant="outline" onClick={() => {
                                const newItems = [...(settings.why_us.items || []), { title: 'New Point' }];
                                updateSection('why_us', 'items', newItems);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Add Point
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {(settings.why_us.items || []).map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <Input 
                                        value={item.title} 
                                        onChange={(e) => {
                                            const newItems = [...settings.why_us.items];
                                            newItems[idx].title = e.target.value;
                                            updateSection('why_us', 'items', newItems);
                                        }} 
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-red-500 shrink-0"
                                        onClick={() => {
                                            const newItems = settings.why_us.items.filter((_, i) => i !== idx);
                                            updateSection('why_us', 'items', newItems);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'clients':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Clients / Schools</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.clients.enabled !== false} onCheckedChange={(c) => updateSection('clients', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Title</Label>
                        <Input value={settings.clients.title} onChange={(e) => updateSection('clients', 'title', e.target.value)} />
                    </div>
                    <div className="space-y-2 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <Label>Client List</Label>
                            <Button size="sm" variant="outline" onClick={() => {
                                const newItems = [...(settings.clients.items || []), { name: 'New School', logo: '' }];
                                updateSection('clients', 'items', newItems);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Add Client
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(settings.clients.items || []).map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-3 p-4 border rounded-lg bg-card relative group">
                                    <div className="absolute top-2 right-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                                            onClick={() => {
                                                const newItems = settings.clients.items.filter((_, i) => i !== idx);
                                                updateSection('clients', 'items', newItems);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">School Name</Label>
                                        <Input 
                                            value={item.name} 
                                            onChange={(e) => {
                                                const newItems = [...settings.clients.items];
                                                newItems[idx].name = e.target.value;
                                                updateSection('clients', 'items', newItems);
                                            }}
                                            placeholder="School Name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Branches / Subtitle</Label>
                                        <Input 
                                            value={item.branches} 
                                            onChange={(e) => {
                                                const newItems = [...settings.clients.items];
                                                newItems[idx].branches = e.target.value;
                                                updateSection('clients', 'items', newItems);
                                            }}
                                            placeholder="e.g. 12 Branches"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Logo</Label>
                                        <div className="flex gap-2 items-start">
                                            <div className="h-16 w-16 bg-muted rounded border flex items-center justify-center overflow-hidden shrink-0">
                                                {item.logo ? (
                                                    <img src={item.logo} alt="Logo" className="h-full w-full object-contain" />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No Logo</span>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <Input 
                                                    value={item.logo || ''} 
                                                    onChange={(e) => {
                                                        const newItems = [...settings.clients.items];
                                                        newItems[idx].logo = e.target.value;
                                                        updateSection('clients', 'items', newItems);
                                                    }}
                                                    placeholder="https://..."
                                                    className="text-xs"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor={`logo-upload-${idx}`} className="cursor-pointer text-xs bg-secondary px-2 py-1 rounded hover:bg-secondary/80 transition-colors">
                                                        Upload
                                                    </Label>
                                                    <Input 
                                                        id={`logo-upload-${idx}`}
                                                        type="file" 
                                                        className="hidden" 
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const oldUrl = settings.clients?.items?.[idx]?.logo;
                                                                const url = await uploadImage(file, 'cms', oldUrl);
                                                                if (url) {
                                                                    const newItems = [...settings.clients.items];
                                                                    newItems[idx].logo = url;
                                                                    updateSection('clients', 'items', newItems);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'achievements':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Achievements</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.achievements.enabled !== false} onCheckedChange={(c) => updateSection('achievements', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Title</Label>
                        <Input value={settings.achievements.title} onChange={(e) => updateSection('achievements', 'title', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Description</Label>
                        <Textarea value={settings.achievements.description} onChange={(e) => updateSection('achievements', 'description', e.target.value)} />
                    </div>
                </div>
            );

        case 'stats':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Statistics / Highlights</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.stats?.enabled !== false} onCheckedChange={(c) => updateSection('stats', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label className="font-semibold">Stat Items</Label>
                            <Button size="sm" variant="outline" onClick={() => {
                                const newItems = [...(settings.stats?.items || []), { number: '100+', label: 'Label' }];
                                updateSection('stats', 'items', newItems);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Add Stat
                            </Button>
                        </div>
                        {(settings.stats?.items || []).map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center p-2 border rounded bg-muted/40 relative group">
                                <Input 
                                    value={item.number} 
                                    onChange={(e) => {
                                        const newItems = [...settings.stats.items];
                                        newItems[idx].number = e.target.value;
                                        updateSection('stats', 'items', newItems);
                                    }} 
                                    className="w-24 font-bold text-center"
                                    placeholder="Value"
                                />
                                <Input 
                                    value={item.label} 
                                    onChange={(e) => {
                                        const newItems = [...settings.stats.items];
                                        newItems[idx].label = e.target.value;
                                        updateSection('stats', 'items', newItems);
                                    }} 
                                    placeholder="Label (e.g. Schools)"
                                    className="flex-1"
                                />
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        const newItems = settings.stats.items.filter((_, i) => i !== idx);
                                        updateSection('stats', 'items', newItems);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'pages':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Pages & Menu Structure</h3>
                    </div>

                    {/* Navigation Menu Editor */}
                    <div className="border rounded-lg p-4 bg-muted/20 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="text-lg font-semibold">Header Menu Links</h4>
                                <p className="text-sm text-muted-foreground">Manage the links and dropdowns in your website header.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={syncMenuToPages}>
                                    <RefreshCw className="h-4 w-4 mr-2" /> Sync to Pages
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                    const currentMenus = settings.header?.menu_items || [];
                                    updateSection('header', 'menu_items', [...currentMenus, { name: 'New Link', href: '#' }]);
                                }}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Menu Item
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {(settings.header?.menu_items || []).map((item, idx) => (
                                <div key={idx} className="border rounded-lg p-3 bg-card">
                                    <div className="flex gap-2 items-center mb-2">
                                        <Input 
                                            value={item.name} 
                                            onChange={(e) => {
                                                const newMenus = [...(settings.header?.menu_items || [])];
                                                newMenus[idx] = { ...newMenus[idx], name: e.target.value };
                                                updateSection('header', 'menu_items', newMenus);
                                            }}
                                            placeholder="Link Name"
                                            className="flex-1 font-medium"
                                        />
                                        <Input 
                                            value={item.href} 
                                            onChange={(e) => {
                                                const newMenus = [...(settings.header?.menu_items || [])];
                                                newMenus[idx] = { ...newMenus[idx], href: e.target.value };
                                                updateSection('header', 'menu_items', newMenus);
                                            }}
                                            placeholder="URL (#section or /page)"
                                            className="flex-1"
                                        />
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 hover:text-red-600" onClick={() => {
                                            const newMenus = (settings.header?.menu_items || []).filter((_, i) => i !== idx);
                                            updateSection('header', 'menu_items', newMenus);
                                        }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    
                                    {/* Sub-menu Items */}
                                    <div className="pl-6 border-l-2 border-border ml-2 space-y-2">
                                        {(item.children || []).map((child, cIdx) => (
                                            <div key={cIdx} className="flex gap-2 items-center">
                                                <Input 
                                                    value={child.name} 
                                                    onChange={(e) => {
                                                        const newMenus = [...(settings.header?.menu_items || [])];
                                                        const newChildren = [...(newMenus[idx].children || [])];
                                                        newChildren[cIdx] = { ...newChildren[cIdx], name: e.target.value };
                                                        newMenus[idx] = { ...newMenus[idx], children: newChildren };
                                                        updateSection('header', 'menu_items', newMenus);
                                                    }}
                                                    placeholder="Sub-link Name"
                                                    className="flex-1 h-8 text-sm"
                                                />
                                                <Input 
                                                    value={child.href} 
                                                    onChange={(e) => {
                                                        const newMenus = [...(settings.header?.menu_items || [])];
                                                        const newChildren = [...(newMenus[idx].children || [])];
                                                        newChildren[cIdx] = { ...newChildren[cIdx], href: e.target.value };
                                                        newMenus[idx] = { ...newMenus[idx], children: newChildren };
                                                        updateSection('header', 'menu_items', newMenus);
                                                    }}
                                                    placeholder="Sub-link URL"
                                                    className="flex-1 h-8 text-sm"
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => {
                                                    const newMenus = [...(settings.header?.menu_items || [])];
                                                    const newChildren = (newMenus[idx].children || []).filter((_, i) => i !== cIdx);
                                                    newMenus[idx] = { ...newMenus[idx], children: newChildren };
                                                    updateSection('header', 'menu_items', newMenus);
                                                }}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button size="sm" variant="ghost" className="text-xs text-primary h-7 hover:bg-primary/10" onClick={() => {
                                            const newMenus = [...(settings.header?.menu_items || [])];
                                            const newChildren = [...(newMenus[idx].children || []), { name: 'New Sub Link', href: '#' }];
                                            newMenus[idx] = { ...newMenus[idx], children: newChildren };
                                            updateSection('header', 'menu_items', newMenus);
                                        }}>
                                            <Plus className="h-3 w-3 mr-1" /> Add Sub-link
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-b pb-4 pt-4">
                        <h3 className="text-xl font-semibold">Content Pages</h3>
                        <Button size="sm" onClick={() => { setEditingPage(null); setIsPageDialogOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" /> Create New Page
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {(settings.pages || []).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                No custom pages yet. Create one!
                            </div>
                        )}
                        {(settings.pages || []).map((page, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                                <div>
                                    <h4 className="font-medium">{page.title}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">/{page.slug}</span>
                                        {page.published === false && <Badge variant="secondary">Draft</Badge>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" title="View Page" onClick={() => window.open(page.slug === 'school-erp' ? '/school-erp' : `/page/${page.slug}`, '_blank')}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        setEditingPage({ ...page, index: idx });
                                        setIsPageDialogOpen(true);
                                    }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => {
                                        if (confirm('Are you sure you want to delete this page?')) {
                                            const newPages = settings.pages.filter((_, i) => i !== idx);
                                            setSettings(p => ({ ...p, pages: newPages }));
                                        }
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'quick_cta_banner':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Quick CTA Banner</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.quick_cta_banner?.enabled !== false} onCheckedChange={(c) => updateSection('quick_cta_banner', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Headline</Label>
                        <Input value={settings.quick_cta_banner?.headline || ''} onChange={(e) => updateSection('quick_cta_banner', 'headline', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Sub-headline</Label>
                        <Input value={settings.quick_cta_banner?.subheadline || ''} onChange={(e) => updateSection('quick_cta_banner', 'subheadline', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Description</Label>
                        <Textarea value={settings.quick_cta_banner?.description || ''} onChange={(e) => updateSection('quick_cta_banner', 'description', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Primary Button Text</Label><Input value={settings.quick_cta_banner?.buttonText || ''} onChange={(e) => updateSection('quick_cta_banner', 'buttonText', e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Primary Button Link</Label><Input value={settings.quick_cta_banner?.buttonLink || ''} onChange={(e) => updateSection('quick_cta_banner', 'buttonLink', e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Secondary Button Text</Label><Input value={settings.quick_cta_banner?.secondaryButtonText || ''} onChange={(e) => updateSection('quick_cta_banner', 'secondaryButtonText', e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Secondary Button Link</Label><Input value={settings.quick_cta_banner?.secondaryButtonLink || ''} onChange={(e) => updateSection('quick_cta_banner', 'secondaryButtonLink', e.target.value)} /></div>
                    </div>
                </div>
            );



        case 'quick_links':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Quick Links / Tags</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.quick_links?.enabled !== false} onCheckedChange={(c) => updateSection('quick_links', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Section Title</Label>
                        <Input value={settings.quick_links?.title || ''} onChange={(e) => updateSection('quick_links', 'title', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Tags (Comma separated)</Label>
                        <Textarea 
                            value={settings.quick_links?.tags?.join(', ') || ''} 
                            onChange={(e) => updateSection('quick_links', 'tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                            placeholder="CBSE, ICSE, State Boards, etc."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
            );

        case 'contact':
            return (
                <div className="space-y-6 p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="text-xl font-semibold">Contact Section</h3>
                        <div className="flex items-center space-x-2">
                            <Label>Enabled</Label>
                            <Switch checked={settings.contact?.enabled !== false} onCheckedChange={(c) => updateSection('contact', 'enabled', c)} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Title</Label>
                        <Input value={settings.contact?.title || ''} onChange={(e) => updateSection('contact', 'title', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Subtitle</Label>
                        <Textarea value={settings.contact?.subtitle || ''} onChange={(e) => updateSection('contact', 'subtitle', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Email Address</Label>
                        <Input value={settings.contact?.email || ''} onChange={(e) => updateSection('contact', 'email', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Phone Number</Label>
                        <Input value={settings.contact?.phone || ''} onChange={(e) => updateSection('contact', 'phone', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Address</Label>
                        <Textarea value={settings.contact?.address || ''} onChange={(e) => updateSection('contact', 'address', e.target.value)} />
                    </div>
                </div>
            );

        case 'footer':
              return (
                <div className="space-y-6 p-6">
                     <div className="flex justify-between items-center border-b pb-4">
                         <h3 className="text-xl font-semibold">Footer Settings</h3>
                    </div>
                    <div className="grid gap-3">
                        <Label>About Text</Label>
                        <Textarea value={settings.footer.aboutText} onChange={(e) => updateSection('footer', 'aboutText', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label>Copyright Text</Label>
                        <Input value={settings.footer.copyrightText} onChange={(e) => updateSection('footer', 'copyrightText', e.target.value)} />
                    </div>
                    
                    <div className="flex items-center justify-between border p-3 rounded bg-muted/20">
                        <Label>Show Payment Icons</Label>
                        <Switch checked={settings.footer.showPaymentIcons !== false} onCheckedChange={(c) => updateSection('footer', 'showPaymentIcons', c)} />
                    </div>

                    <div className="flex items-center justify-between border p-3 rounded bg-muted/20">
                        <Label>Show Back to Top Button</Label>
                        <Switch checked={settings.footer.showBackToTop !== false} onCheckedChange={(c) => updateSection('footer', 'showBackToTop', c)} />
                    </div>

                    {/* Footer Social Links */}
                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <Label className="font-semibold">Social Links</Label>
                            <Button size="sm" variant="outline" onClick={() => {
                                const newLinks = [...(settings.footer.socialLinks || []), { platform: 'facebook', href: '#' }];
                                updateSection('footer', 'socialLinks', newLinks);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Add Link
                            </Button>
                        </div>
                        {(settings.footer.socialLinks || []).map((link, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <select 
                                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={link.platform}
                                    onChange={(e) => {
                                        const newLinks = [...settings.footer.socialLinks];
                                        newLinks[idx].platform = e.target.value;
                                        updateSection('footer', 'socialLinks', newLinks);
                                    }}
                                >
                                    <option value="facebook">Facebook</option>
                                    <option value="twitter">Twitter</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="google">Google</option>
                                </select>
                                <Input 
                                    value={link.href} 
                                    onChange={(e) => {
                                        const newLinks = [...settings.footer.socialLinks];
                                        newLinks[idx].href = e.target.value;
                                        updateSection('footer', 'socialLinks', newLinks);
                                    }} 
                                    placeholder="URL"
                                />
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-500"
                                    onClick={() => {
                                        const newLinks = settings.footer.socialLinks.filter((_, i) => i !== idx);
                                        updateSection('footer', 'socialLinks', newLinks);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
             );

        default:
            return <div className="p-6 text-muted-foreground text-center">Select a section to configure.</div>;
    }
  };

  // Loading Guard
  if (loading) return (
      <DashboardLayout>
        <div className="h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
      </DashboardLayout>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="bg-card border-b px-6 py-3 flex justify-between items-center z-20 shadow-sm h-16">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>Back</Button>
            <h1 className="text-lg font-bold text-foreground">Website Builder</h1>
            <div className="h-6 w-px bg-border mx-2"></div>
            <div className="flex bg-muted p-1 rounded-md border">
                <button className={`px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === 'desktop' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`} onClick={() => setViewMode('desktop')}>
                    <Monitor className="h-3 w-3 inline mr-1"/> Desktop
                </button>
                <button className={`px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === 'mobile' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`} onClick={() => setViewMode('mobile')}>
                    <Smartphone className="h-3 w-3 inline mr-1"/> Mobile
                </button>
            </div>
        </div>
        <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                Save Changes
            </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 1. Navigation Sidebar */}
        <div className="w-64 bg-card border-r flex flex-col z-20">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-foreground">Sections</h2>
                <p className="text-xs text-muted-foreground">Select a section to edit</p>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {/* Header is special */}
                    <button 
                        onClick={() => setActiveSection('header')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                            activeSection === 'header' 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        <Monitor className="h-4 w-4" />
                        Header & Branding
                    </button>

                    {/* Dynamic Sections */}
                    <Reorder.Group axis="y" values={settings.section_order} onReorder={handleReorder} className="space-y-1 pt-2 border-t mt-2">
                        {settings.section_order.map((item) => {
                            const isActive = activeSection === item;
                            let label = item.charAt(0).toUpperCase() + item.slice(1).replace('_', ' ');
                            
                            // Custom labels
                            if (item === 'panels') label = 'App Panels';
                            if (item === 'cta') label = 'Call to Action';
                            if (item === 'quick_cta_banner') label = 'Quick CTA Banner';
                            if (item === 'quick_links') label = 'Quick Links';
                            if (item === 'stats') label = 'Statistics';

                            const isEnabled = settings[item === 'cta' ? 'cta_section' : item]?.enabled !== false;

                            return (
                                <Reorder.Item key={item} value={item}>
                                    <div 
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all cursor-pointer group ${
                                            isActive 
                                            ? 'bg-primary/10 text-primary' 
                                            : 'text-muted-foreground hover:bg-muted'
                                        } ${!isEnabled ? 'opacity-60' : ''}`}
                                        onClick={() => setActiveSection(item)}
                                    >
                                        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="flex-1 truncate">{label}</span>
                                        <div onClick={(e) => {
                                            e.stopPropagation();
                                            const key = item === 'cta' ? 'cta_section' : item;
                                            updateSection(key, 'enabled', !isEnabled);
                                        }}>
                                            {isEnabled ? <Eye className="h-3.5 w-3.5 text-green-500/70 hover:text-green-600" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />}
                                        </div>
                                    </div>
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>

                    {/* SEO & Footer */}
                    <div className="pt-2 border-t mt-2 space-y-1">
                        <button 
                            onClick={() => setActiveSection('pages')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                                activeSection === 'pages' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            <BookOpen className="h-4 w-4" /> Custom Pages
                        </button>
                        <button 
                            onClick={() => setActiveSection('seo')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                                activeSection === 'seo' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            <Search className="h-4 w-4" /> SEO Settings
                        </button>
                    </div>
                </div>
            </ScrollArea>
        </div>

        {/* 2. Editor Panel */}
        <div className="w-[450px] bg-card border-r flex flex-col shadow-xl z-10">
             <div className="h-full flex flex-col">
                 <ScrollArea className="flex-1">
                     {renderEditor()}
                 </ScrollArea>
             </div>
        </div>

        {/* 3. Preview Panel */}
        <div className="flex-1 bg-muted/20 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
             {/* Background grid pattern */}
             <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
             
             <div className={`relative transition-all duration-500 ease-in-out shadow-2xl rounded-xl overflow-hidden bg-background border-4 border-slate-800 ring-1 ring-slate-900/5
                 ${viewMode === 'mobile' ? 'w-[390px] h-[800px] rounded-[3rem] border-[10px]' : 'w-full h-full rounded-lg'}
             `}>
                 {viewMode === 'mobile' && (
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50"></div>
                 )}
                 <SaaSCmsPreview settings={settings} activePlans={activePlans} viewMode={viewMode} />
             </div>
        </div>
      </div>

      {/* --- DIALOGS --- */}

      {/* Feature Dialog */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>{editingFeature ? 'Edit Feature' : 'Add Feature'}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const newFeat = { 
                      title: formData.get('title'), 
                      description: formData.get('description'), 
                      icon: formData.get('icon') 
                  };
                  let newFeatures = [...settings.features];
                  if (editingFeature && editingFeature.index !== undefined) newFeatures[editingFeature.index] = newFeat;
                  else newFeatures.push(newFeat);
                  setSettings(p => ({...p, features: newFeatures}));
                  setFeatureDialogOpen(false);
              }} className="space-y-4">
                  <div className="grid gap-2"><Label>Title</Label><Input name="title" defaultValue={editingFeature?.title} required placeholder="e.g. Student Management" /></div>
                  <div className="grid gap-2"><Label>Description</Label><Textarea name="description" defaultValue={editingFeature?.description} required placeholder="Short description..." /></div>
                  <div className="grid gap-2">
                      <Label>Icon Name (Lucide React)</Label>
                      <Input name="icon" defaultValue={editingFeature?.icon} required placeholder="e.g. User, BookOpen, Settings" />
                      <p className="text-xs text-muted-foreground">Use exact Lucide icon names (Case Sensitive).</p>
                  </div>
                  <DialogFooter><Button type="submit">Save Feature</Button></DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

      {/* Panel Dialog (School Owner, Teacher etc) */}
      <Dialog open={panelDialogOpen} onOpenChange={setPanelDialogOpen}>
          <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingPanel ? 'Edit Panel' : 'Add New Panel'}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="grid gap-2"><Label>Panel Title</Label><Input value={editingPanel?.title || ''} onChange={e => setEditingPanel(p => ({...p, title: e.target.value}))} placeholder="e.g. School Admin Panel" /></div>
                  <div className="grid gap-2"><Label>Subtitle/Badge</Label><Input value={editingPanel?.subtitle || ''} onChange={e => setEditingPanel(p => ({...p, subtitle: e.target.value}))} placeholder="e.g. For Administrators" /></div>
                  <div className="grid gap-2"><Label>Description</Label><Textarea value={editingPanel?.description || ''} onChange={e => setEditingPanel(p => ({...p, description: e.target.value}))} placeholder="Description of this panel..." /></div>
                  
                  <div className="grid gap-2">
                      <Label>Panel Image</Label>
                      <div className="flex items-center gap-4">
                          {editingPanel?.image && <img src={editingPanel.image} className="h-12 w-12 object-cover rounded" />}
                          <ImageUploader onFileChange={async (f) => { 
                              const oldUrl = editingPanel?.image;
                              const url = await uploadImage(f, 'cms', oldUrl); 
                              if(url) setEditingPanel(p => ({...p, image: url})); 
                          }} showCrop={false} showCamera={false} showInstruction={false} />
                      </div>
                  </div>
                  
                  <div className="grid gap-2">
                      <Label>Key Features (Comma separated)</Label>
                      <Textarea 
                        value={editingPanel?.features?.join(', ') || ''} 
                        onChange={e => setEditingPanel(p => ({...p, features: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}))} 
                        placeholder="Attendance, Grades, Reports, etc."
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button onClick={() => {
                      let newPanels = [...settings.panels];
                      if (editingPanel && editingPanel.index !== undefined) newPanels[editingPanel.index] = editingPanel;
                      else newPanels.push({ ...editingPanel, id: uuidv4() });
                      setSettings(p => ({...p, panels: newPanels}));
                      setPanelDialogOpen(false);
                  }}>Save Panel</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const newTest = { 
                      name: formData.get('name'), 
                      title: formData.get('title'), 
                      text: formData.get('text'), 
                      source: formData.get('source'),
                      image: editingTestimonial?.image || '',
                      rating: parseInt(formData.get('rating') || '5') 
                  };
                  let newItems = [...(settings.testimonials.items || [])];
                  if (editingTestimonial && editingTestimonial.index !== undefined) {
                      newItems[editingTestimonial.index] = newTest;
                  } else {
                      newItems.push(newTest);
                  }
                  updateSection('testimonials', 'items', newItems);
                  setTestimonialDialogOpen(false);
              }} className="space-y-4">
                   <div className="grid gap-2"><Label>Name</Label><Input name="name" defaultValue={editingTestimonial?.name} required /></div>
                   <div className="grid gap-2"><Label>Role/Title</Label><Input name="title" defaultValue={editingTestimonial?.title} required /></div>
                   <div className="grid gap-2">
                       <Label>Source</Label>
                       <select name="source" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue={editingTestimonial?.source || 'direct'}>
                           <option value="direct">Direct / Website</option>
                           <option value="google">Google Review</option>
                           <option value="facebook">Facebook Review</option>
                       </select>
                   </div>
                   <div className="grid gap-2">
                       <Label>Rating (Stars)</Label>
                       <select name="rating" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue={editingTestimonial?.rating || 5}>
                           <option value="5">5 Stars</option>
                           <option value="4">4 Stars</option>
                           <option value="3">3 Stars</option>
                           <option value="2">2 Stars</option>
                           <option value="1">1 Star</option>
                       </select>
                   </div>
                   <div className="grid gap-2"><Label>Testimonial</Label><Textarea name="text" defaultValue={editingTestimonial?.text} required /></div>
                   <div className="grid gap-2">
                       <Label>Photo</Label>
                       <div className="flex items-center gap-4">
                           {editingTestimonial?.image && <img src={editingTestimonial.image} className="h-12 w-12 rounded-full object-cover" />}
                           <ImageUploader onFileChange={async(f)=>{ 
                               const oldUrl = editingTestimonial?.image;
                               const url=await uploadImage(f, 'cms', oldUrl); 
                               if(url) setEditingTestimonial(p=>({...p, image: url})); 
                           }} showCrop={false} showCamera={false} showInstruction={false} />
                       </div>
                   </div>
                   <DialogFooter><Button type="submit">Save</Button></DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

       {/* FAQ Dialog */}
       <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const newFaqItem = { question: formData.get('question'), answer: formData.get('answer') };
                  let newFaqs = [...settings.faq];
                  if (editingFaq && editingFaq.index !== undefined) newFaqs[editingFaq.index] = newFaqItem;
                  else newFaqs.push(newFaqItem);
                  setSettings(p => ({...p, faq: newFaqs}));
                  setFaqDialogOpen(false);
              }} className="space-y-4">
                   <div className="grid gap-2"><Label>Question</Label><Input name="question" defaultValue={editingFaq?.question} required /></div>
                   <div className="grid gap-2"><Label>Answer</Label><Textarea name="answer" defaultValue={editingFaq?.answer} required /></div>
                   <DialogFooter><Button type="submit">Save</Button></DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

      {/* Page Dialog */}
      <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
              <DialogHeader><DialogTitle>{editingPage ? 'Edit Page' : 'Add New Page'}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  
                  // Auto-sanitize slug
                  let rawSlug = formData.get('slug') || '';
                  // Remove leading/trailing slashes, replace spaces with dashes, lowercase
                  const cleanSlug = rawSlug.trim().toLowerCase().replace(/^\/+|\/+$/g, '').replace(/\s+/g, '-');

                  const newPage = { 
                      title: formData.get('title'), 
                      slug: cleanSlug, 
                      content: pageContent,
                      published: true
                  };
                  let newPages = [...(settings.pages || [])];
                  if (editingPage && editingPage.index !== undefined) newPages[editingPage.index] = newPage;
                  else newPages.push(newPage);
                  setSettings(p => ({...p, pages: newPages}));
                  setIsPageDialogOpen(false);
              }} className="space-y-4 flex-1 flex flex-col overflow-hidden">
                   <div className="grid gap-2"><Label>Page Title</Label><Input name="title" defaultValue={editingPage?.title} required placeholder="e.g. About Us" /></div>
                   <div className="grid gap-2"><Label>URL Slug</Label><Input name="slug" defaultValue={editingPage?.slug} required placeholder="e.g. about-us" /></div>
                   <div className="grid gap-2 flex-1 flex flex-col min-h-0">
                       <Label>Content</Label>
                       <div className="flex-1 overflow-hidden flex flex-col pb-12">
                           <RichTextEditor 
                               value={pageContent} 
                               onChange={setPageContent} 
                               className="h-full"
                               placeholder="Write your page content here..."
                           />
                       </div>
                   </div>
                   <DialogFooter><Button type="submit">Save Page</Button></DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

    </div>
  );
};

export default SaasWebsiteSettings;
