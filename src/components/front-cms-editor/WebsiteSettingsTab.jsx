import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Settings, Image as ImageIcon, Palette, Phone, FileText, Share2, Upload, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import axios from 'axios';
import MediaSelector from '@/components/front-cms/MediaSelector';

// Professional School Theme Presets
const THEME_PRESETS = [
  {
    id: 'classic-royal',
    name: 'Classic Royal',
    description: 'Traditional elegant blue theme',
    preview: 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700',
    colors: {
      primary_color: '#1e3a5f',
      menu_bg_color: '#ffffff',
      button_hover_color: '#2563eb',
      text_color: '#1e293b',
      footer_bg_color: '#0f172a',
      footer_text_color: '#f8fafc'
    }
  },
  {
    id: 'modern-crimson',
    name: 'Modern Crimson',
    description: 'Bold red professional theme',
    preview: 'bg-gradient-to-br from-red-700 via-red-600 to-rose-500',
    colors: {
      primary_color: '#b91c1c',
      menu_bg_color: '#ffffff',
      button_hover_color: '#dc2626',
      text_color: '#1f2937',
      footer_bg_color: '#18181b',
      footer_text_color: '#fafafa'
    }
  },
  {
    id: 'nature-green',
    name: 'Nature Green',
    description: 'Fresh green eco-friendly theme',
    preview: 'bg-gradient-to-br from-emerald-700 via-green-600 to-teal-500',
    colors: {
      primary_color: '#047857',
      menu_bg_color: '#ffffff',
      button_hover_color: '#10b981',
      text_color: '#1f2937',
      footer_bg_color: '#064e3b',
      footer_text_color: '#ecfdf5'
    }
  },
  {
    id: 'premium-gold',
    name: 'Premium Gold',
    description: 'Luxury dark gold theme',
    preview: 'bg-gradient-to-br from-amber-600 via-yellow-500 to-orange-400',
    colors: {
      primary_color: '#92400e',
      menu_bg_color: '#fffbeb',
      button_hover_color: '#d97706',
      text_color: '#292524',
      footer_bg_color: '#1c1917',
      footer_text_color: '#fef3c7'
    }
  }
];

const WebsiteSettingsTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [formData, setFormData] = useState({
    cms_title: '',
    cms_url_alias: '',
    cms_frontend_active: true,
    online_admission_enabled: false,
    receive_email_to: '',
    captcha_status: 'Disabled',
    working_hours: '',
    logo_url: '',
    favicon_url: '',
    address: '',
    google_analytics: '',
    primary_color: '#6E0D06',
    menu_bg_color: '#ffffff',
    button_hover_color: '#f04133',
    text_color: '#232323',
    footer_bg_color: '#17161e',
    footer_text_color: '#ffffff',
    border_radius: 4,
    mobile_no: '',
    email: '',
    fax: '',
    footer_about_text: '',
    copyright_text: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    youtube_url: '',
    linkedin_url: ''
  });

  useEffect(() => {
    if (branchId) loadSettings();
  }, [branchId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('school_website_settings')
        .select('*')
        .eq('branch_id', branchId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData(prev => ({
          ...prev,
          cms_title: data.homepage_title || '',
          cms_url_alias: data.cms_url_alias || '',
          cms_frontend_active: data.is_active !== false,
          online_admission_enabled: false,
          receive_email_to: data.contact_info?.email || '',
          captcha_status: 'Disabled',
          working_hours: data.contact_info?.working_hours || '',
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
          address: data.contact_info?.address || '',
          google_analytics: data.meta_description || '',
          primary_color: data.theme?.primary_color || '#6E0D06',
          menu_bg_color: data.theme?.menu_bg_color || '#ffffff',
          button_hover_color: data.theme?.button_hover_color || '#f04133',
          text_color: data.theme?.text_color || '#232323',
          footer_bg_color: data.theme?.footer_bg_color || '#17161e',
          footer_text_color: data.theme?.footer_text_color || '#ffffff',
          border_radius: data.theme?.border_radius || 4,
          mobile_no: data.contact_info?.phone || '',
          email: data.contact_info?.email || '',
          fax: data.contact_info?.fax || '',
          footer_about_text: data.contact_info?.footer_about || '',
          copyright_text: data.contact_info?.copyright || '',
          facebook_url: data.social_links?.find?.(s => s.platform === 'facebook')?.url || '',
          twitter_url: data.social_links?.find?.(s => s.platform === 'twitter')?.url || '',
          instagram_url: data.social_links?.find?.(s => s.platform === 'instagram')?.url || '',
          youtube_url: data.social_links?.find?.(s => s.platform === 'youtube')?.url || '',
          linkedin_url: data.social_links?.find?.(s => s.platform === 'linkedin')?.url || ''
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const payload = {
        branch_id: branchId,
        homepage_title: formData.cms_title.trim(),
        cms_url_alias: formData.cms_url_alias.trim(),
        is_active: formData.cms_frontend_active,
        meta_description: formData.google_analytics.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        favicon_url: formData.favicon_url.trim() || null,
        contact_info: {
          email: formData.email.trim() || null,
          phone: formData.mobile_no.trim() || null,
          fax: formData.fax.trim() || null,
          address: formData.address.trim() || null,
          working_hours: formData.working_hours.trim() || null,
          footer_about: formData.footer_about_text.trim() || null,
          copyright: formData.copyright_text.trim() || null
        },
        social_links: [
          { platform: 'facebook', url: formData.facebook_url.trim() || null },
          { platform: 'twitter', url: formData.twitter_url.trim() || null },
          { platform: 'instagram', url: formData.instagram_url.trim() || null },
          { platform: 'youtube', url: formData.youtube_url.trim() || null },
          { platform: 'linkedin', url: formData.linkedin_url.trim() || null }
        ].filter(link => link.url),
        theme: {
          primary_color: formData.primary_color,
          menu_bg_color: formData.menu_bg_color,
          button_hover_color: formData.button_hover_color,
          text_color: formData.text_color,
          footer_bg_color: formData.footer_bg_color,
          footer_text_color: formData.footer_text_color,
          border_radius: formData.border_radius || 0
        }
      };

      const response = await axios.put('/api/front-cms/settings', payload, {
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'x-school-id': branchId 
        }
      });

      if (response.data.success) {
        toast({ title: 'Success', description: 'Website settings saved successfully' });
      } else {
        throw new Error(response.data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      const msg = error.response?.data?.message || error.message || 'Save Failed';
      toast({ variant: 'destructive', title: 'Save Failed', description: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Apply theme preset
  const applyTheme = (theme) => {
    setSelectedTheme(theme.id);
    setFormData(prev => ({
      ...prev,
      ...theme.colors
    }));
    toast({
      title: `${theme.name} Applied!`,
      description: 'Theme colors have been updated. Click Save to apply changes.',
    });
  };

  // Detect current theme based on primary color
  const detectCurrentTheme = () => {
    const currentPrimary = formData.primary_color?.toLowerCase();
    const matchedTheme = THEME_PRESETS.find(t => t.colors.primary_color.toLowerCase() === currentPrimary);
    return matchedTheme?.id || null;
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your school's public website configuration and appearance.</p>
        </div>
        <Button type="submit" disabled={saving} className="bg-cyan-500 hover:bg-cyan-600">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Configuration Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-cyan-500" />
                <CardTitle className="text-lg">General Configuration</CardTitle>
              </div>
              <CardDescription>Basic settings for your school website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CMS Title *</Label>
                  <Input
                    value={formData.cms_title}
                    onChange={(e) => handleChange('cms_title', e.target.value)}
                    placeholder="School Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CMS Url Alias *</Label>
                  <Input
                    value={formData.cms_url_alias}
                    onChange={(e) => handleChange('cms_url_alias', e.target.value)}
                    placeholder="13su_test_data_#1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label>Frontend Enabled</Label>
                    <p className="text-xs text-muted-foreground">Make website visible to public</p>
                  </div>
                  <Switch
                    checked={formData.cms_frontend_active}
                    onCheckedChange={(checked) => handleChange('cms_frontend_active', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label>Online Admission</Label>
                    <p className="text-xs text-muted-foreground">Allow students to apply online</p>
                  </div>
                  <Switch
                    checked={formData.online_admission_enabled}
                    onCheckedChange={(checked) => handleChange('online_admission_enabled', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Receive Email To</Label>
                  <Input
                    type="email"
                    value={formData.receive_email_to}
                    onChange={(e) => handleChange('receive_email_to', e.target.value)}
                    placeholder="jashchar2015@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Captcha Status</Label>
                  <Select value={formData.captcha_status} onValueChange={(value) => handleChange('captcha_status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Enabled">Enabled</SelectItem>
                      <SelectItem value="Disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Working Hours</Label>
                <Input
                  value={formData.working_hours}
                  onChange={(e) => handleChange('working_hours', e.target.value)}
                  placeholder="<span>Hours :</span> <span> Mon To Fri - 9AM - 06PM"
                />
                <p className="text-xs text-muted-foreground">HTML is allowed for formatting</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-cyan-500" />
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </div>
              <CardDescription>Address and contact details displayed on the website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="#104, Shivanand Complex, Opp. Purusabhe bus stand, 1st floor santur main road santur taluk"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Mobile No</Label>
                  <Input
                    value={formData.mobile_no}
                    onChange={(e) => handleChange('mobile_no', e.target.value)}
                    placeholder="0990120202"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contact@school.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fax</Label>
                  <Input
                    value={formData.fax}
                    onChange={(e) => handleChange('fax', e.target.value)}
                    placeholder="Fax number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Google Analytics Code</Label>
                <Input
                  value={formData.google_analytics}
                  onChange={(e) => handleChange('google_analytics', e.target.value)}
                  placeholder="UA-XXXXX-Y"
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer Content Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-500" />
                <CardTitle className="text-lg">Footer Content</CardTitle>
              </div>
              <CardDescription>Customize the footer section of your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Footer About Text</Label>
                <Textarea
                  value={formData.footer_about_text}
                  onChange={(e) => handleChange('footer_about_text', e.target.value)}
                  placeholder="Brief description about your school..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Copyright Text</Label>
                <Textarea
                  value={formData.copyright_text}
                  onChange={(e) => handleChange('copyright_text', e.target.value)}
                  placeholder="© 2026 Your School Name. All Rights Reserved."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - Branding, Theme, Social */}
        <div className="space-y-6">
          {/* Branding Assets Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-cyan-500" />
                <CardTitle className="text-lg">Branding Assets</CardTitle>
              </div>
              <CardDescription>Logo and Favicon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Website Logo</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="h-16 mx-auto object-contain mb-2" />
                  ) : (
                    <div className="text-muted-foreground py-4">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No logo uploaded</p>
                    </div>
                  )}
                </div>
                <Input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="Logo URL"
                  className="text-sm"
                />
                <MediaSelector
                  branchId={branchId}
                  onSelect={(file) => handleChange('logo_url', file.url)}
                  type="image"
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.logo_url ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex items-center gap-3">
                  {formData.favicon_url ? (
                    <img src={formData.favicon_url} alt="Favicon" className="h-8 w-8 object-contain rounded" />
                  ) : (
                    <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <MediaSelector
                    branchId={branchId}
                    onSelect={(file) => handleChange('favicon_url', file.url)}
                    type="image"
                    trigger={
                      <Button type="button" variant="outline" size="sm" className="flex-1">
                        <Upload className="h-4 w-4 mr-2" />
                        Select Favicon
                      </Button>
                    }
                  />
                </div>
                <Input
                  type="url"
                  value={formData.favicon_url}
                  onChange={(e) => handleChange('favicon_url', e.target.value)}
                  placeholder="Favicon URL"
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme Presets Card */}
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Quick Theme Presets</CardTitle>
              </div>
              <CardDescription>Choose a professional theme for your school website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {THEME_PRESETS.map((theme) => {
                  const isActive = selectedTheme === theme.id || detectCurrentTheme() === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => applyTheme(theme)}
                      className={`relative group p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                        isActive 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'border-slate-200 hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      {/* Theme Preview */}
                      <div className={`h-16 rounded-lg ${theme.preview} mb-3 shadow-inner relative overflow-hidden`}>
                        {/* Mini preview elements */}
                        <div className="absolute top-2 left-2 right-2 h-2 bg-white/30 rounded-full"></div>
                        <div className="absolute bottom-2 left-2 w-8 h-6 bg-white/20 rounded"></div>
                        <div className="absolute bottom-2 right-2 w-12 h-4 bg-white/40 rounded-full"></div>
                        {isActive && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-1">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Theme Info */}
                      <h4 className="font-semibold text-sm text-slate-800">{theme.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{theme.description}</p>
                      
                      {/* Color Swatches */}
                      <div className="flex gap-1 mt-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-white shadow-sm" 
                          style={{ backgroundColor: theme.colors.primary_color }}
                          title="Primary"
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" 
                          style={{ backgroundColor: theme.colors.menu_bg_color }}
                          title="Menu"
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-white shadow-sm" 
                          style={{ backgroundColor: theme.colors.footer_bg_color }}
                          title="Footer"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Theme Colors Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-cyan-500" />
                <CardTitle className="text-lg">Theme Colors</CardTitle>
              </div>
              <CardDescription>Customize website appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Color */}
              <div className="flex items-center justify-between">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="w-24 h-8 text-xs"
                  />
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                </div>
              </div>

              {/* Menu Background */}
              <div className="flex items-center justify-between">
                <Label>Menu Background</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.menu_bg_color}
                    onChange={(e) => handleChange('menu_bg_color', e.target.value)}
                    className="w-24 h-8 text-xs"
                  />
                  <input
                    type="color"
                    value={formData.menu_bg_color.startsWith('#') ? formData.menu_bg_color : '#ffffff'}
                    onChange={(e) => handleChange('menu_bg_color', e.target.value)}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                </div>
              </div>

              {/* Button Hover */}
              <div className="flex items-center justify-between">
                <Label>Button Hover</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.button_hover_color}
                    onChange={(e) => handleChange('button_hover_color', e.target.value)}
                    className="w-24 h-8 text-xs"
                  />
                  <input
                    type="color"
                    value={formData.button_hover_color}
                    onChange={(e) => handleChange('button_hover_color', e.target.value)}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="flex items-center justify-between">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.text_color}
                    onChange={(e) => handleChange('text_color', e.target.value)}
                    className="w-24 h-8 text-xs"
                  />
                  <input
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => handleChange('text_color', e.target.value)}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                </div>
              </div>

              {/* Footer Background */}
              <div className="flex items-center justify-between">
                <Label>Footer Background</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.footer_bg_color}
                    onChange={(e) => handleChange('footer_bg_color', e.target.value)}
                    className="w-24 h-8 text-xs"
                  />
                  <input
                    type="color"
                    value={formData.footer_bg_color}
                    onChange={(e) => handleChange('footer_bg_color', e.target.value)}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                </div>
              </div>

              {/* Footer Text */}
              <div className="flex items-center justify-between">
                <Label>Footer Text</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.footer_text_color}
                    onChange={(e) => handleChange('footer_text_color', e.target.value)}
                    className="w-24 h-8 text-xs"
                  />
                  <input
                    type="color"
                    value={formData.footer_text_color}
                    onChange={(e) => handleChange('footer_text_color', e.target.value)}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                </div>
              </div>

              {/* Border Radius */}
              <div className="flex items-center justify-between">
                <Label>Border Radius (px)</Label>
                <Input
                  type="number"
                  value={formData.border_radius}
                  onChange={(e) => handleChange('border_radius', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-20 h-8 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-cyan-500" />
                <CardTitle className="text-lg">Social Media</CardTitle>
              </div>
              <CardDescription>Links to your social profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Facebook</Label>
                <Input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => handleChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/page"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Twitter</Label>
                <Input
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => handleChange('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/handle"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Instagram</Label>
                <Input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/profile"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">YouTube</Label>
                <Input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => handleChange('youtube_url', e.target.value)}
                  placeholder="https://youtube.com/channel"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">LinkedIn</Label>
                <Input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/profile"
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};

export default WebsiteSettingsTab;
