import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, X, Save, Globe, Image as ImageIcon, MapPin, Palette, Share2, LayoutTemplate } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import DashboardLayout from '@/components/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MediaSelector from '@/components/front-cms/MediaSelector';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';
import { useSearchParams } from 'react-router-dom';

const FrontCMSSetting = () => {
  const { toast } = useToast();
  const { refreshAuth, school, user } = useAuth();
  const { selectedBranch } = useBranch();
  const [searchParams] = useSearchParams();
  
  // Debug log to check branchId sources
  console.log('[FrontCMSSetting] Debug:', {
    urlParam: searchParams.get('branch_id'),
    sessionStorage: sessionStorage.getItem('ma_target_branch_id'),
    schoolFromAuth: school?.id,
    userProfileSchoolId: user?.profile?.branch_id,
    userMetadata: user?.user_metadata?.branch_id
  });
  
  // Priority: URL param > Session Storage (Master Admin mode) > Auth context (Super Admin mode)
  const branchId = 
    searchParams.get('branch_id') || 
    sessionStorage.getItem('ma_target_branch_id') || 
    school?.id || 
    selectedBranch?.id ||
    user?.profile?.branch_id ||
    user?.user_metadata?.branch_id;
    
  console.log('[FrontCMSSetting] Resolved branchId:', branchId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Safety check for UI
  if (!branchId && !loading && user) {
     console.error('[FrontCMSSetting] CRITICAL: No branchId found for user', user.id);
  }

  const [formData, setFormData] = useState({
    // General
    homepage_title: '',
    cms_url_alias: '',
    is_active: true,
    online_admission: true,
    receive_email_to: '',
    captcha_status: 'disabled',
    working_hours: '',
    
    // Images
    logo_url: '',
    favicon_url: '',
    
    // Address & Contact
    address: '',
    google_analytics: '',
    mobile_no: '',
    email: '',
    fax: '',
    
    // Footer
    footer_about_text: '',
    copyright_text: '',
    
    // Theme
    primary_color: '#7f1d1d', // Default red-ish
    menu_bg_color: '#ffffff',
    button_hover_color: '#dc2626',
    text_color: '#000000',
    text_secondary_color: '#4b5563',
    footer_bg_color: '#1f2937',
    footer_text_color: '#ffffff',
    copyright_bg_color: '#111827',
    copyright_text_color: '#9ca3af',
    border_radius: '4',
    
    // Social
    facebook_url: '',
    twitter_url: '',
    youtube_url: '',
    google_plus_url: '',
    linkedin_url: '',
    pinterest_url: '',
    instagram_url: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getSettings(branchId);
      if (response.success && response.data) {
        const data = response.data;
        const contact = data.contact_info || {};
        const theme = data.theme || {};
        const social = data.social_links || {};

        const getSocial = (key) => {
            if (Array.isArray(social)) {
                return social.find(s => s.platform === key)?.url || '';
            }
            return social[key] || '';
        };

        setFormData({
          homepage_title: data.homepage_title || '',
          cms_url_alias: data.cms_url_alias || '',
          is_active: data.is_active,
          online_admission: contact.online_admission !== false,
          receive_email_to: contact.receive_email_to || '',
          captcha_status: contact.captcha_status || 'disabled',
          working_hours: contact.working_hours || '',
          
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
          
          address: contact.address || '',
          google_analytics: contact.google_analytics || '',
          mobile_no: contact.phone || '',
          email: contact.email || '',
          fax: contact.fax || '',
          
          // Handle both old (footer_about, copyright) and new keys (footer_about_text, copyright_text)
          footer_about_text: contact.footer_about_text || contact.footer_about || '',
          copyright_text: contact.copyright_text || contact.copyright || '',
          
          primary_color: theme.primary_color || '#7f1d1d',
          menu_bg_color: theme.menu_bg_color || '#ffffff',
          button_hover_color: theme.button_hover_color || '#dc2626',
          text_color: theme.text_color || '#000000',
          text_secondary_color: theme.text_secondary_color || '#4b5563',
          footer_bg_color: theme.footer_bg_color || '#1f2937',
          footer_text_color: theme.footer_text_color || '#ffffff',
          copyright_bg_color: theme.copyright_bg_color || '#111827',
          copyright_text_color: theme.copyright_text_color || '#9ca3af',
          border_radius: theme.border_radius || '4',
          
          facebook_url: getSocial('facebook'),
          twitter_url: getSocial('twitter'),
          youtube_url: getSocial('youtube'),
          google_plus_url: getSocial('google_plus'),
          linkedin_url: getSocial('linkedin'),
          pinterest_url: getSocial('pinterest'),
          instagram_url: getSocial('instagram'),
        });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (file, field) => {
    setFormData(prev => ({ ...prev, [field]: file.url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        homepage_title: formData.homepage_title,
        cms_url_alias: formData.cms_url_alias,
        is_active: formData.is_active,
        logo_url: formData.logo_url,
        favicon_url: formData.favicon_url,
        
        contact_info: {
            online_admission: formData.online_admission,
            receive_email_to: formData.receive_email_to,
            captcha_status: formData.captcha_status,
            working_hours: formData.working_hours,
            address: formData.address,
            google_analytics: formData.google_analytics,
            phone: formData.mobile_no,
            email: formData.email,
            fax: formData.fax,
            footer_about_text: formData.footer_about_text,
            copyright_text: formData.copyright_text
        },
        
        theme: {
            primary_color: formData.primary_color,
            menu_bg_color: formData.menu_bg_color,
            button_hover_color: formData.button_hover_color,
            text_color: formData.text_color,
            text_secondary_color: formData.text_secondary_color,
            footer_bg_color: formData.footer_bg_color,
            footer_text_color: formData.footer_text_color,
            copyright_bg_color: formData.copyright_bg_color,
            copyright_text_color: formData.copyright_text_color,
            border_radius: formData.border_radius
        },
        
        social_links: {
            facebook: formData.facebook_url,
            twitter: formData.twitter_url,
            youtube: formData.youtube_url,
            google_plus: formData.google_plus_url,
            linkedin: formData.linkedin_url,
            pinterest: formData.pinterest_url,
            instagram: formData.instagram_url
        }
      };

      const response = await frontCmsService.updateSettings(payload, branchId);
      if (response.success) {
        toast({ title: 'Settings updated successfully' });
        await refreshAuth();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto pb-24">
        <MasterAdminSchoolHeader />
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Website Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your school's public website configuration and appearance.</p>
          </div>
          <Button type="submit" onClick={handleSubmit} disabled={saving} size="lg" className="shadow-lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* General Settings */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">General Configuration</CardTitle>
                    <CardDescription>Basic settings for your school website</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-600 dark:text-slate-400">CMS Title <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.homepage_title} 
                      onChange={e => setFormData({...formData, homepage_title: e.target.value})} 
                      required 
                      className="font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 dark:text-slate-400">CMS Url Alias <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.cms_url_alias} 
                      onChange={e => setFormData({...formData, cms_url_alias: e.target.value})} 
                      required 
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Frontend Enabled</Label>
                      <p className="text-xs text-slate-500">Make website visible to public</p>
                    </div>
                    <Switch 
                      checked={formData.is_active} 
                      onCheckedChange={checked => setFormData({...formData, is_active: checked})} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Online Admission</Label>
                      <p className="text-xs text-slate-500">Allow students to apply online</p>
                    </div>
                    <Switch 
                      checked={formData.online_admission} 
                      onCheckedChange={checked => setFormData({...formData, online_admission: checked})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Receive Email To</Label>
                    <Input 
                      value={formData.receive_email_to} 
                      onChange={e => setFormData({...formData, receive_email_to: e.target.value})} 
                      placeholder="admin@school.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Captcha Status</Label>
                    <Select 
                      value={formData.captcha_status} 
                      onValueChange={val => setFormData({...formData, captcha_status: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Working Hours</Label>
                  <Textarea 
                    value={formData.working_hours} 
                    onChange={e => setFormData({...formData, working_hours: e.target.value})} 
                    placeholder="<span>Hours : </span> Mon To Fri - 9AM - 06PM"
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-slate-500">HTML is allowed for formatting.</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Address */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                    <CardDescription>Address and contact details displayed on the website</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    className="min-h-[80px]"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Mobile No</Label>
                    <Input 
                      value={formData.mobile_no} 
                      onChange={e => setFormData({...formData, mobile_no: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fax</Label>
                    <Input 
                      value={formData.fax} 
                      onChange={e => setFormData({...formData, fax: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Google Analytics Code</Label>
                  <Textarea 
                    value={formData.google_analytics} 
                    onChange={e => setFormData({...formData, google_analytics: e.target.value})} 
                    placeholder="UA-XXXXX-Y"
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Footer Content */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <LayoutTemplate className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Footer Content</CardTitle>
                    <CardDescription>Customize the footer section of your website</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>Footer About Text</Label>
                  <Textarea 
                    value={formData.footer_about_text} 
                    onChange={e => setFormData({...formData, footer_about_text: e.target.value})} 
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Copyright Text</Label>
                  <Textarea 
                    value={formData.copyright_text} 
                    onChange={e => setFormData({...formData, copyright_text: e.target.value})} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Visuals & Social */}
          <div className="space-y-8">
            
            {/* Images */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Branding Assets</CardTitle>
                    <CardDescription>Logo and Favicon</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label>Website Logo</Label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                    {formData.logo_url ? (
                      <div className="relative group w-full flex justify-center">
                        <img src={formData.logo_url} alt="Logo" className="h-20 object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                           <Button variant="secondary" size="sm" onClick={() => setFormData({...formData, logo_url: ''})}>Remove</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-4">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <span className="text-xs">No logo uploaded</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Logo URL</Label>
                    <Input 
                      value={formData.logo_url} 
                      onChange={e => setFormData({...formData, logo_url: e.target.value})} 
                      placeholder="https://..."
                    />
                  </div>

                  <MediaSelector 
                    branchId={branchId}
                    onSelect={(file) => handleImageSelect(file, 'logo_url')}
                    type="image"
                    trigger={
                      <Button type="button" variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        {formData.logo_url ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                    }
                  />
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Label>Favicon</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 border rounded-lg flex items-center justify-center bg-white dark:bg-slate-900">
                        {formData.favicon_url ? (
                            <img src={formData.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
                        ) : (
                            <Globe className="h-6 w-6 text-slate-300" />
                        )}
                    </div>
                    <div className="flex-1">
                        <MediaSelector 
                        branchId={branchId}
                        onSelect={(file) => handleImageSelect(file, 'favicon_url')}
                        type="image"
                        trigger={
                            <Button type="button" variant="outline" size="sm" className="w-full">
                            <Upload className="h-3 w-3 mr-2" />
                            Select Favicon
                            </Button>
                        }
                        />
                    </div>
                  </div>
                  <div className="pl-16">
                    <Label className="text-xs">Favicon URL</Label>
                    <Input 
                        value={formData.favicon_url} 
                        onChange={e => setFormData({...formData, favicon_url: e.target.value})} 
                        placeholder="https://..."
                        className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Options */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Palette className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Theme Colors</CardTitle>
                    <CardDescription>Customize website appearance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {[
                  { label: 'Primary Color', key: 'primary_color' },
                  { label: 'Menu Background', key: 'menu_bg_color' },
                  { label: 'Button Hover', key: 'button_hover_color' },
                  { label: 'Text Color', key: 'text_color' },
                  { label: 'Text Secondary', key: 'text_secondary_color' },
                  { label: 'Footer Background', key: 'footer_bg_color' },
                  { label: 'Footer Text', key: 'footer_text_color' },
                  { label: 'Copyright Background', key: 'copyright_bg_color' },
                  { label: 'Copyright Text', key: 'copyright_text_color' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between group">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{item.label}</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full border shadow-sm overflow-hidden relative">
                        <input 
                            type="color" 
                            value={formData[item.key]} 
                            onChange={e => setFormData({...formData, [item.key]: e.target.value})}
                            className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                        />
                      </div>
                      <Input 
                        value={formData[item.key]} 
                        onChange={e => setFormData({...formData, [item.key]: e.target.value})} 
                        className="w-24 h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <Label>Border Radius (px)</Label>
                        <Input 
                            type="number"
                            value={formData.border_radius} 
                            onChange={e => setFormData({...formData, border_radius: e.target.value})} 
                            className="w-24"
                        />
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <Share2 className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Social Media</CardTitle>
                    <CardDescription>Links to your social profiles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {[
                  { label: 'Facebook', key: 'facebook_url', placeholder: 'facebook.com/page' },
                  { label: 'Twitter', key: 'twitter_url', placeholder: 'twitter.com/handle' },
                  { label: 'Instagram', key: 'instagram_url', placeholder: 'instagram.com/profile' },
                  { label: 'YouTube', key: 'youtube_url', placeholder: 'youtube.com/channel' },
                  { label: 'LinkedIn', key: 'linkedin_url', placeholder: 'linkedin.com/in/profile' },
                  { label: 'Pinterest', key: 'pinterest_url', placeholder: 'pinterest.com/profile' },
                  { label: 'Google Plus', key: 'google_plus_url', placeholder: 'plus.google.com/profile' },
                ].map((item) => (
                  <div key={item.key} className="space-y-1">
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</Label>
                    <Input 
                      value={formData[item.key]} 
                      onChange={e => setFormData({...formData, [item.key]: e.target.value})} 
                      placeholder={`https://${item.placeholder}`}
                      className="h-9"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </form>
        
        {/* Sticky Save Button for Mobile */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
            <Button onClick={handleSubmit} disabled={saving} size="lg" className="shadow-xl rounded-full h-14 w-14 p-0">
                {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
            </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FrontCMSSetting;
