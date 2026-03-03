import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Layout, Image as ImageIcon, Palette, Eye, Monitor, Smartphone, GraduationCap, User, Lock, ArrowRight, Sparkles, Shield, BookOpen, Users, Wand2, X } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';
import MediaSelectorModal from '@/components/front-cms/MediaSelectorModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SchoolLoginSettingsTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaField, setMediaField] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showPreview, setShowPreview] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(0);
  
  const [formData, setFormData] = useState({
    page_title: '',
    subtitle: '',
    welcome_text: 'Welcome Back',
    form_subtitle: 'Sign in to access your dashboard',
    logo_url: '',
    accent_color: '#3b82f6',
    background_type: 'gradient',
    background_image_url: '',
    slider_image_1: '',
    slider_image_2: '',
    slider_image_3: '',
    social_login_enabled: false
  });

  useEffect(() => {
    if (branchId) loadSettings();
  }, [branchId]);

  // Slider preview animation
  useEffect(() => {
    if (formData.background_type === 'slider') {
      const images = [formData.slider_image_1, formData.slider_image_2, formData.slider_image_3].filter(Boolean);
      if (images.length > 1) {
        const interval = setInterval(() => {
          setSliderIndex(prev => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(interval);
      }
    }
  }, [formData.background_type, formData.slider_image_1, formData.slider_image_2, formData.slider_image_3]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getSchoolLoginSettings(branchId);
      if (data) {
        setFormData(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load login page settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.page_title) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Page Title is required.' });
      return;
    }

    setSaving(true);
    try {
      await cmsEditorService.upsertSchoolLoginSettings(branchId, formData);
      toast({ title: 'Success', description: 'Login page settings saved successfully!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMediaSelect = (file) => {
    if (mediaField) {
      handleChange(mediaField, file.file_url);
      setMediaField(null);
    }
  };

  // Preset themes
  const presetThemes = [
    { name: 'Modern Blue', color: '#3b82f6', icon: '🔵' },
    { name: 'Royal Purple', color: '#7c3aed', icon: '💜' },
    { name: 'Nature Green', color: '#10b981', icon: '🌿' },
    { name: 'Sunset Orange', color: '#f97316', icon: '🌅' },
    { name: 'Classic Red', color: '#dc2626', icon: '❤️' },
    { name: 'Ocean Teal', color: '#0d9488', icon: '🌊' },
  ];

  if (loading) {
    return (
      <div className="p-12 flex flex-col justify-center items-center min-h-[500px]">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500 mb-4" />
        <p className="text-slate-500">Loading login settings...</p>
      </div>
    );
  }

  // Preview variables
  const sliderImages = [formData.slider_image_1, formData.slider_image_2, formData.slider_image_3].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Login Page Designer</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Customize your school's login experience</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Preview Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            
            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className={`flex ${showPreview ? '' : ''}`}>
        {/* Settings Panel */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full max-w-4xl mx-auto'} p-6 space-y-6 overflow-y-auto`} style={{ maxHeight: 'calc(100vh - 80px)' }}>
          
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="branding" className="gap-2">
                <Layout className="h-4 w-4" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="background" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Background
              </TabsTrigger>
              <TabsTrigger value="theme" className="gap-2">
                <Palette className="h-4 w-4" />
                Theme
              </TabsTrigger>
            </TabsList>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6">
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Layout className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="dark:text-white">Content & Branding</CardTitle>
                  </div>
                  <CardDescription className="dark:text-slate-400">Configure the text and logo displayed on your login page</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label className="font-medium dark:text-slate-200">School Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-700 overflow-hidden">
                        {formData.logo_url ? (
                          <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Input 
                            value={formData.logo_url} 
                            onChange={e => handleChange('logo_url', e.target.value)} 
                            placeholder="Paste image URL or select from media"
                            className="flex-1"
                          />
                          <Button type="button" variant="outline" onClick={() => setMediaField('logo_url')}>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Browse
                          </Button>
                        </div>
                        {formData.logo_url && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 h-8"
                            onClick={() => handleChange('logo_url', '')}
                          >
                            <X className="h-3 w-3 mr-1" /> Remove Logo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Page Title */}
                  <div className="space-y-2">
                    <Label className="font-medium dark:text-slate-200">Page Title <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.page_title} 
                      onChange={e => handleChange('page_title', e.target.value)} 
                      placeholder="e.g. Jashchar Institution"
                      className="h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Displayed on the left panel of the login page</p>
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-2">
                    <Label className="font-medium dark:text-slate-200">Tagline / Subtitle</Label>
                    <Input 
                      value={formData.subtitle} 
                      onChange={e => handleChange('subtitle', e.target.value)} 
                      placeholder="e.g. Excellence in Education"
                      className="h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-slate-600">
                    {/* Welcome Text */}
                    <div className="space-y-2">
                      <Label className="font-medium dark:text-slate-200">Welcome Text</Label>
                      <Input 
                        value={formData.welcome_text} 
                        onChange={e => handleChange('welcome_text', e.target.value)} 
                        placeholder="Welcome Back"
                        className="h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>

                    {/* Form Subtitle */}
                    <div className="space-y-2">
                      <Label className="font-medium dark:text-slate-200">Form Subtitle</Label>
                      <Input 
                        value={formData.form_subtitle} 
                        onChange={e => handleChange('form_subtitle', e.target.value)} 
                        placeholder="Sign in to access your dashboard"
                        className="h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Social Login Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700 mt-4">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">Google Sign-In</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Allow users to sign in with Google</p>
                    </div>
                    <Switch 
                      checked={formData.social_login_enabled} 
                      onCheckedChange={val => handleChange('social_login_enabled', val)} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Background Tab */}
            <TabsContent value="background" className="space-y-6">
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <CardTitle className="dark:text-white">Background Style</CardTitle>
                  </div>
                  <CardDescription className="dark:text-slate-400">Choose how the left panel looks</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  
                  {/* Background Type */}
                  <div className="space-y-2">
                    <Label className="font-medium dark:text-slate-200">Background Type</Label>
                    <Select value={formData.background_type} onValueChange={val => handleChange('background_type', val)}>
                      <SelectTrigger className="h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <SelectValue placeholder="Select Background Style" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                        <SelectItem value="gradient">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-purple-600"></div>
                            Accent Gradient (Automatic)
                          </div>
                        </SelectItem>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Static Image
                          </div>
                        </SelectItem>
                        <SelectItem value="slider">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Image Slider (Premium)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Static Image Upload */}
                  {formData.background_type === 'image' && (
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700 animate-in fade-in duration-300">
                      <Label className="font-medium dark:text-slate-200">Background Image</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={formData.background_image_url} 
                          onChange={e => handleChange('background_image_url', e.target.value)} 
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={() => setMediaField('background_image_url')}>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Browse
                        </Button>
                      </div>
                      {formData.background_image_url && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden">
                          <img src={formData.background_image_url} alt="Preview" className="w-full h-full object-cover" />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            className="absolute top-2 right-2"
                            onClick={() => handleChange('background_image_url', '')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Slider Images */}
                  {formData.background_type === 'slider' && (
                    <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <Label className="font-medium dark:text-slate-200">Slider Images (Up to 3)</Label>
                      </div>
                      
                      {[1, 2, 3].map(num => (
                        <div key={num} className="space-y-2">
                          <Label className="text-sm text-slate-600 dark:text-slate-400">Slide {num}</Label>
                          <div className="flex gap-2 items-center">
                            {formData[`slider_image_${num}`] && (
                              <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0">
                                <img src={formData[`slider_image_${num}`]} alt={`Slide ${num}`} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <Input 
                              value={formData[`slider_image_${num}`]} 
                              onChange={e => handleChange(`slider_image_${num}`, e.target.value)} 
                              placeholder="Image URL..."
                              className="flex-1"
                            />
                            <Button type="button" variant="outline" size="icon" onClick={() => setMediaField(`slider_image_${num}`)}>
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                            {formData[`slider_image_${num}`] && (
                              <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => handleChange(`slider_image_${num}`, '')}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Theme Tab */}
            <TabsContent value="theme" className="space-y-6">
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <CardTitle className="dark:text-white">Color Theme</CardTitle>
                  </div>
                  <CardDescription className="dark:text-slate-400">Set your brand's accent color</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  
                  {/* Color Presets */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-purple-500" />
                      <Label className="font-medium dark:text-slate-200">Quick Presets</Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {presetThemes.map(theme => (
                        <button
                          key={theme.name}
                          type="button"
                          onClick={() => handleChange('accent_color', theme.color)}
                          className={`p-3 rounded-xl border-2 transition-all hover:scale-105 dark:bg-slate-700 ${
                            formData.accent_color === theme.color 
                              ? 'border-slate-900 dark:border-white shadow-lg' 
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full shadow-inner"
                              style={{ backgroundColor: theme.color }}
                            />
                            <span className="text-sm font-medium dark:text-slate-200">{theme.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Color */}
                  <div className="space-y-3 pt-4 border-t dark:border-slate-600">
                    <Label className="font-medium dark:text-slate-200">Custom Color</Label>
                    <div className="flex gap-3 items-center">
                      <div className="relative">
                        <input 
                          type="color" 
                          value={formData.accent_color} 
                          onChange={e => handleChange('accent_color', e.target.value)}
                          className="w-16 h-12 rounded-lg border-2 border-slate-200 dark:border-slate-600 cursor-pointer"
                        />
                      </div>
                      <Input 
                        value={formData.accent_color} 
                        onChange={e => handleChange('accent_color', e.target.value)} 
                        placeholder="#3b82f6"
                        className="flex-1 h-12 font-mono dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Preview Swatch */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700 mt-4">
                    <Label className="font-medium mb-3 block dark:text-slate-200">Color Preview</Label>
                    <div className="flex gap-3">
                      <div 
                        className="flex-1 h-12 rounded-lg flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: formData.accent_color }}
                      >
                        Primary Button
                      </div>
                      <div 
                        className="flex-1 h-12 rounded-lg flex items-center justify-center font-medium border-2"
                        style={{ borderColor: formData.accent_color, color: formData.accent_color }}
                      >
                        Link Text
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="w-1/2 bg-slate-800 p-6 sticky top-20 h-[calc(100vh-80px)] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </h3>
              <div className="flex gap-2">
                <Button 
                  variant={previewMode === 'desktop' ? 'secondary' : 'ghost'} 
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className={previewMode === 'desktop' ? '' : 'text-white/60 hover:text-white'}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button 
                  variant={previewMode === 'mobile' ? 'secondary' : 'ghost'} 
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className={previewMode === 'mobile' ? '' : 'text-white/60 hover:text-white'}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Preview Frame */}
            <div className={`bg-white rounded-xl overflow-hidden shadow-2xl mx-auto transition-all duration-300 ${
              previewMode === 'mobile' ? 'w-[320px] h-[568px]' : 'w-full h-[calc(100%-60px)]'
            }`}>
              <div className="h-full flex overflow-hidden" style={{ fontSize: previewMode === 'mobile' ? '10px' : '12px' }}>
                
                {/* Left Side Preview (Desktop only) */}
                {previewMode === 'desktop' && (
                  <div className="w-[55%] relative overflow-hidden">
                    {/* Background */}
                    <div className="absolute inset-0">
                      {formData.background_type === 'slider' && sliderImages.length > 0 ? (
                        <>
                          {sliderImages.map((img, idx) => (
                            <div 
                              key={idx} 
                              className={`absolute inset-0 transition-opacity duration-1000 ${
                                idx === sliderIndex ? 'opacity-100' : 'opacity-0'
                              }`}
                              style={{ 
                                backgroundImage: `url(${img})`, 
                                backgroundSize: 'cover', 
                                backgroundPosition: 'center' 
                              }}
                            />
                          ))}
                        </>
                      ) : formData.background_type === 'image' && formData.background_image_url ? (
                        <div 
                          className="absolute inset-0"
                          style={{ 
                            backgroundImage: `url(${formData.background_image_url})`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center' 
                          }}
                        />
                      ) : (
                        <div 
                          className="absolute inset-0"
                          style={{ 
                            background: `linear-gradient(135deg, ${formData.accent_color} 0%, #1e1b4b 50%, #0f172a 100%)`
                          }}
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
                      <div className="flex items-center gap-2">
                        {formData.logo_url ? (
                          <img src={formData.logo_url} alt="Logo" className="h-6 bg-white/90 p-1 rounded" />
                        ) : (
                          <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                            <GraduationCap className="h-3 w-3" />
                          </div>
                        )}
                        <span className="font-semibold text-xs">{formData.page_title || 'School Name'}</span>
                      </div>
                      <div>
                        <p className="text-amber-400 text-[8px] mb-1">EDUCATION EXCELLENCE</p>
                        <h2 className="text-lg font-bold leading-tight">Empowering<br/>Future Leaders</h2>
                      </div>
                      <p className="text-white/50 text-[8px]">© 2025</p>
                    </div>
                  </div>
                )}

                {/* Right Side - Form */}
                <div className={`${previewMode === 'desktop' ? 'w-[45%]' : 'w-full'} bg-white p-4 flex items-center justify-center`}>
                  <div className="w-full max-w-[200px]">
                    {previewMode === 'mobile' && formData.logo_url && (
                      <img src={formData.logo_url} alt="Logo" className="h-8 mx-auto mb-3" />
                    )}
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{formData.welcome_text || 'Welcome Back'}</h3>
                    <p className="text-[9px] text-slate-500 mb-3">{formData.form_subtitle || 'Sign in to access your dashboard'}</p>
                    
                    <div className="space-y-2">
                      <div className="relative">
                        <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                        <div className="h-7 bg-slate-100 rounded pl-6 flex items-center text-[9px] text-slate-400">Email or Mobile</div>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                        <div className="h-7 bg-slate-100 rounded pl-6 flex items-center text-[9px] text-slate-400">••••••••</div>
                      </div>
                      <button 
                        className="w-full h-7 rounded text-white text-[9px] font-medium flex items-center justify-center gap-1"
                        style={{ backgroundColor: formData.accent_color }}
                      >
                        Sign In <ArrowRight className="h-3 w-3" />
                      </button>
                      {formData.social_login_enabled && (
                        <button className="w-full h-7 rounded border border-slate-200 text-[9px] text-slate-600">
                          Continue with Google
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MediaSelectorModal 
        isOpen={!!mediaField} 
        onClose={() => setMediaField(null)} 
        onSelect={handleMediaSelect} 
        branchId={branchId}
      />
    </div>
  );
};

export default SchoolLoginSettingsTab;
