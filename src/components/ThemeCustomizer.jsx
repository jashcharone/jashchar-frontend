import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Save, Palette, Loader2, RotateCcw, Plus, Search, 
    Check, Undo2, Redo2, Lock, Unlock, Moon, Sun, Upload, Download,
    History, Heart, AlertCircle, Layers, ArrowRightLeft, Clock,
    LayoutTemplate, Type, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { premiumThemes, checkAccessibility } from '@/lib/themes';

// Force refresh
const fonts = [
  'Poppins', 'Inter', 'Roboto', 'Lato', 'Montserrat', 'Oswald', 'Raleway', 'Nunito Sans', 'Merriweather',
  'Open Sans', 'Playfair Display', 'Source Sans Pro', 'Ubuntu', 'Exo 2', 'Quicksand', 'Fira Sans',
  'Work Sans', 'Dosis', 'Josefin Sans', 'Lobster', 'Pacifico', 'Caveat'
];

const ThemeCustomizer = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { 
        settings, setSettings, applySettings, resetToDefault, 
        defaultSettings, undo, redo, canUndo, canRedo,
        saveCustomThemeToProfile, loadCustomThemeFromProfile
    } = useTheme();
    
    const [localSettings, setLocalSettings] = useState(settings);
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('themes');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [compareMode, setCompareMode] = useState(false);
    const [compareThemes, setCompareThemes] = useState([]);
    const [isLocked, setIsLocked] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [themeHistory, setThemeHistory] = useState([]);
    const [customThemeName, setCustomThemeName] = useState('');

    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings, isOpen]);
    
    useEffect(() => {
        // Load favorites from local storage
        try {
            const favs = JSON.parse(localStorage.getItem('theme-favorites') || '[]');
            setFavorites(favs);
            
            const hist = JSON.parse(localStorage.getItem('theme-history') || '[]');
            setThemeHistory(hist);
        } catch (e) {
            console.error("Error loading theme local storage", e);
        }
    }, []);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!user) {
            toast({ variant: 'destructive', title: 'Login Required', description: 'You must be logged in to upload files.' });
            return;
        }

        setIsUploadingLogo(true);
        try {
            // 1. Delete old logo if it exists and is hosted on our supabase
            const oldLogoUrl = localSettings.sidebarLogo;
            if (oldLogoUrl && oldLogoUrl.includes('school-logos')) {
                // Extract path from URL
                // URL format: .../storage/v1/object/public/school-logos/path/to/file
                const path = oldLogoUrl.split('school-logos/')[1];
                if (path) {
                    const { error: deleteError } = await supabase.storage
                        .from('school-logos')
                        .remove([path]);
                    if (deleteError) console.error('Error deleting old logo:', deleteError);
                }
            }

            // 2. Upload new logo
            const fileExt = file.name.split('.').pop();
            const fileName = `theme-logo-${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('school-logos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('school-logos')
                .getPublicUrl(filePath);

            // 4. Update Settings
            handleSettingChange('sidebarLogo', publicUrl);
            toast({ title: 'Logo Uploaded', description: 'New logo has been set.' });

        } catch (error) {
            console.error('Upload error:', error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleSettingChange = (key, value) => {
        if (isLocked) return toast({title: 'Theme Locked', variant: 'destructive', description: 'Unlock to make changes.'});
        const newSettings = { ...localSettings, [key]: value };
        setLocalSettings(newSettings);
        setSettings(newSettings);
        applySettings(newSettings); // Live preview
    };

    const handleColorChange = (key, value) => {
        if (isLocked) return toast({title: 'Theme Locked', variant: 'destructive', description: 'Unlock to make changes.'});
        const newSettings = { ...localSettings, colors: { ...(localSettings.colors || {}), [key]: value } };
        setLocalSettings(newSettings);
        setSettings(newSettings);
        applySettings(newSettings);
    };
    
    const handleThemeSelect = (theme) => {
        if (isLocked) return toast({title: 'Theme Locked', variant: 'destructive', description: 'Unlock to make changes.'});
        
        if (compareMode) {
            if (compareThemes.find(t => t.name === theme.name)) {
                setCompareThemes(compareThemes.filter(t => t.name !== theme.name));
            } else if (compareThemes.length < 2) {
                setCompareThemes([...compareThemes, theme]);
            } else {
                toast({title: "Max 2 themes", description: "You can compare up to 2 themes."});
            }
            return;
        }

        const newSettings = { 
            ...localSettings, 
            theme: theme.name,
            mode: theme.mode || (theme.category === 'Dark' ? 'dark' : 'light'),
            colors: { 
                ...localSettings.colors, 
                ...theme.colors,
            }
        };
        
        setSettings(newSettings); // This also adds to undo history
        setLocalSettings(newSettings);
        applySettings(newSettings);
        
        // Add to history
        const newHist = [theme.name, ...themeHistory.filter(n => n !== theme.name)].slice(0, 10);
        setThemeHistory(newHist);
        localStorage.setItem('theme-history', JSON.stringify(newHist));
        
        toast({title: `${theme.name} Applied`, description: "Theme colors have been updated."});
    };

    const toggleFavorite = (e, themeName) => {
        e.stopPropagation();
        let newFavs;
        if (favorites.includes(themeName)) {
            newFavs = favorites.filter(f => f !== themeName);
        } else {
            newFavs = [...favorites, themeName];
        }
        setFavorites(newFavs);
        localStorage.setItem('theme-favorites', JSON.stringify(newFavs));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // We now rely on ThemeContext's toggleMode logic which handles saving to the correct structure.
            // But here we are manually saving specific settings.
            // We need to replicate the context-aware saving logic or expose a save function from context.
            // For now, we will update the context state, and let the user click "Save" which triggers a DB update.
            // Actually, setSettings updates state, but doesn't persist to DB immediately unless we call upsert.
            
            // Let's use the same logic as ThemeContext's new save mechanism.
            // Since we can't easily access the internal saveSettings of toggleMode, we'll implement it here.
            // BUT, we need the dashboardContext.
            // We can get it from the URL.
            
            const getDashboardContext = () => {
                const path = window.location.pathname;
                if (path.startsWith('/master-admin')) return 'master_admin';
                if (path.startsWith('/school-owner')) return 'school_owner';
                if (path.startsWith('/admin')) return 'admin';
                if (path.startsWith('/teacher')) return 'teacher';
                if (path.startsWith('/student')) return 'student';
                if (path.startsWith('/parent')) return 'parent';
                if (path.startsWith('/principal')) return 'principal';
                if (path.startsWith('/accountant')) return 'accountant';
                if (path.startsWith('/librarian')) return 'librarian';
                if (path.startsWith('/employee')) return 'employee';
                if (path.startsWith('/receptionist')) return 'receptionist';
                return 'default';
            };
            
            const dashboardContext = getDashboardContext();

            if (user) {
                const { data } = await supabase.from('user_theme_settings').select('settings').eq('user_id', user.id).maybeSingle();
                let fullSettings = data?.settings || {};
                
                if (fullSettings.theme && !fullSettings[dashboardContext]) {
                    fullSettings = { ...fullSettings, [dashboardContext]: localSettings };
                } else {
                    fullSettings[dashboardContext] = localSettings;
                }

                await supabase.from('user_theme_settings').upsert({ user_id: user.id, settings: fullSettings });
            } else {
                let local = {};
                try { local = JSON.parse(localStorage.getItem('app-theme-settings')) || {}; } catch(e) {}
                
                if (local.theme && !local[dashboardContext]) {
                     local = { ...local, [dashboardContext]: localSettings };
                } else {
                     local[dashboardContext] = localSettings;
                }
                localStorage.setItem('app-theme-settings', JSON.stringify(local));
            }
            
            setSettings(localSettings); 
            toast({ title: 'Theme saved!', description: 'Your configuration has been persisted for this dashboard.' });
            onClose();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving', description: error.message });
        }
        setIsSaving(false);
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localSettings));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `theme-${localSettings.theme || 'custom'}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };
    
    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported.colors) {
                    setSettings(imported);
                    setLocalSettings(imported);
                    applySettings(imported);
                    toast({title: "Import Successful", description: "Theme loaded from file."});
                } else {
                    throw new Error("Invalid theme file format");
                }
            } catch(err) {
                toast({variant: "destructive", title: "Import Failed", description: err.message});
            }
        };
        reader.readAsText(file);
    };

    const handleResetToDefault = () => {
        if (isLocked) return toast({title: 'Theme Locked', variant: 'destructive', description: 'Unlock to make changes.'});
        
        // Preserve branding settings
        const preservedSettings = {
            sidebarTitle: localSettings.sidebarTitle,
            sidebarSubtitle: localSettings.sidebarSubtitle,
            sidebarLogo: localSettings.sidebarLogo
        };

        // Construct new settings: Default + Preserved Branding
        // We use setSettings instead of resetToDefault to avoid race conditions and state overwrites
        const newSettings = {
            ...(defaultSettings || settings),
            ...preservedSettings
        };
        
        setSettings(newSettings);
        setLocalSettings(newSettings);
        applySettings(newSettings);
        
        toast({ title: 'Reset Complete', description: 'Theme reset (Branding preserved).' });
    };

    const categories = ['All', 'Dark', 'Light', 'Glassmorphism', 'Professional', 'Creative', 'Nature', 'Minimalist', 'Accessibility'];
    
    const filteredThemes = premiumThemes.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = categoryFilter === 'All' || t.category === 'All' || t.category === categoryFilter;
        return matchesSearch && matchesCat;
    });
    
    // Color Helpers
    const currentColors = localSettings.colors || {};
    const accessibility = checkAccessibility(currentColors);

    const PaletteDisplay = ({ colors }) => (
        <div className="flex h-4 w-full rounded-md overflow-hidden border shadow-sm">
            <div className="flex-1" style={{background: colors.primary}} title="Primary" />
            <div className="flex-1" style={{background: colors.secondary}} title="Secondary" />
            <div className="flex-1" style={{background: colors.background}} title="Background" />
            <div className="flex-1" style={{background: colors.sidebarBackground}} title="Sidebar" />
            <div className="flex-1" style={{background: colors.sidebarPrimary}} title="Sidebar Active" />
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-background/95 backdrop-blur-xl border-l shadow-2xl z-50 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Palette className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">Theme Studio</h2>
                                <p className="text-xs text-muted-foreground">Customize your experience</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Undo">
                                <Undo2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Redo">
                                <Redo2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsLocked(!isLocked)} title={isLocked ? "Unlock Theme" : "Lock Theme"}>
                                {isLocked ? <Lock className="h-4 w-4 text-red-500" /> : <Unlock className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col bg-muted/5">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col justify-start">
                            <div className="px-4 pt-2 shrink-0">
                                <TabsList className="w-full grid grid-cols-3 bg-muted/50 p-1 rounded-xl">
                                    <TabsTrigger value="themes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Themes</TabsTrigger>
                                    <TabsTrigger value="customize" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Customize</TabsTrigger>
                                    <TabsTrigger value="manage" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Manage</TabsTrigger>
                                </TabsList>
                            </div>

                            {/* THEMES TAB */}
                            <TabsContent value="themes" className="flex-1 overflow-hidden flex flex-col p-4 space-y-4 mt-0 data-[state=inactive]:hidden">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search themes..." 
                                            value={searchQuery} 
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="pl-9 bg-background/50 border-muted-foreground/20"
                                        />
                                    </div>
                                    <Button 
                                        variant={compareMode ? "secondary" : "outline"} 
                                        size="icon" 
                                        onClick={() => { setCompareMode(!compareMode); setCompareThemes([]); }}
                                        title="Compare Mode"
                                        className="border-muted-foreground/20"
                                    >
                                        <ArrowRightLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {categories.map(cat => (
                                        <Badge 
                                            key={cat} 
                                            variant={categoryFilter === cat ? 'default' : 'outline'} 
                                            className={`cursor-pointer shrink-0 px-3 py-1 ${categoryFilter === cat ? 'shadow-md' : 'bg-background/50 hover:bg-background'}`}
                                            onClick={() => setCategoryFilter(cat)}
                                        >
                                            {cat}
                                        </Badge>
                                    ))}
                                    <Badge 
                                        variant={categoryFilter === 'Favorites' ? 'default' : 'outline'} 
                                        className={`cursor-pointer shrink-0 flex items-center gap-1 px-3 py-1 ${categoryFilter === 'Favorites' ? 'shadow-md' : 'bg-background/50 hover:bg-background'}`}
                                        onClick={() => setCategoryFilter('Favorites')}
                                    >
                                        <Heart className="h-3 w-3 fill-current" /> Favorites
                                    </Badge>
                                </div>
                                
                                {compareMode && compareThemes.length > 0 && (
                                    <div className="bg-muted/50 p-3 rounded-xl mb-2 text-sm border border-border/50">
                                        <p className="font-medium mb-2">Compare ({compareThemes.length}/2)</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            {compareThemes.map(t => (
                                                <div key={t.name} className="space-y-1">
                                                    <span className="text-xs font-bold">{t.name}</span>
                                                    <PaletteDisplay colors={t.colors} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <ScrollArea className="flex-1 -mx-2 px-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-20">
                                        {filteredThemes.filter(t => categoryFilter === 'Favorites' ? favorites.includes(t.name) : true).map(theme => (
                                            <Card 
                                                key={theme.name} 
                                                className={`p-3 cursor-pointer transition-all duration-300 hover:shadow-lg border-muted-foreground/10 ${localSettings.theme === theme.name ? 'ring-2 ring-primary bg-primary/5' : 'bg-card/50 hover:bg-card'}`}
                                                onClick={() => handleThemeSelect(theme)}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-semibold text-sm">{theme.name}</h3>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{theme.category}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {compareMode && (
                                                            <div 
                                                                className={`h-5 w-5 border rounded-full flex items-center justify-center transition-colors ${compareThemes.find(t => t.name === theme.name) ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30'}`}
                                                            >
                                                                {compareThemes.find(t => t.name === theme.name) && <Check className="h-3 w-3" />}
                                                            </div>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => toggleFavorite(e, theme.name)}>
                                                            <Heart 
                                                                className={`h-4 w-4 transition-colors ${favorites.includes(theme.name) ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} 
                                                            />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <PaletteDisplay colors={theme.colors} />
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {/* CUSTOMIZE TAB */}
                            <TabsContent value="customize" className="flex-1 overflow-y-auto p-4 space-y-6 mt-0 data-[state=inactive]:hidden flex flex-col justify-start">
                                
                                {/* Branding Section */}
                                <div className="space-y-4 bg-card/50 p-4 rounded-xl border border-border/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <LayoutTemplate className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Branding</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Sidebar Title</Label>
                                            <div className="relative">
                                                <Type className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    value={localSettings.sidebarTitle || ''} 
                                                    onChange={(e) => handleSettingChange('sidebarTitle', e.target.value)} 
                                                    placeholder="e.g. Jashchar ERP"
                                                    className="pl-9 bg-background/50"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Sidebar Subtitle</Label>
                                            <div className="relative">
                                                <Type className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    value={localSettings.sidebarSubtitle || ''} 
                                                    onChange={(e) => handleSettingChange('sidebarSubtitle', e.target.value)} 
                                                    placeholder="e.g. School Management"
                                                    className="pl-9 bg-background/50"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Sidebar Logo</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        value={localSettings.sidebarLogo || ''} 
                                                        onChange={(e) => handleSettingChange('sidebarLogo', e.target.value)} 
                                                        placeholder="https://... or upload"
                                                        className="pl-9 bg-background/50 pr-24"
                                                    />
                                                    <div className="absolute right-1 top-1 bottom-1">
                                                        <Label htmlFor="logo-upload" className="h-full px-3 flex items-center gap-2 bg-primary text-primary-foreground text-xs rounded-md cursor-pointer hover:bg-primary/90 transition-colors">
                                                            {isUploadingLogo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                                            Upload
                                                        </Label>
                                                        <Input 
                                                            id="logo-upload" 
                                                            type="file" 
                                                            accept="image/*" 
                                                            className="hidden" 
                                                            onChange={handleLogoUpload}
                                                            disabled={isUploadingLogo}
                                                        />
                                                    </div>
                                                </div>
                                                {localSettings.sidebarLogo && (
                                                    <div className="h-10 w-10 shrink-0 rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden p-1">
                                                        <img src={localSettings.sidebarLogo} alt="Preview" className="h-full w-full object-contain" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">Accessibility Check</h3>
                                        <Badge variant={accessibility.status === 'Good' ? 'success' : 'destructive'} className={accessibility.status === 'Good' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'}>
                                            Ratio: {accessibility.ratio}:1
                                        </Badge>
                                    </div>
                                    {accessibility.details.length > 0 && (
                                        <div className="text-xs text-red-500 flex gap-1 items-center bg-red-50 p-2 rounded-lg border border-red-100">
                                            <AlertCircle className="h-3 w-3" />
                                            {accessibility.details.join(', ')}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Sidebar Styling</h3>
                                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">PRO</Badge>
                                    </div>
                                    
                                    {/* Background & Header */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Background</Label>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-md border overflow-hidden relative shadow-sm ring-1 ring-border/50">
                                                    <Input type="color" value={currentColors.sidebarBackground?.includes('gradient') ? '#000000' : currentColors.sidebarBackground} onChange={(e) => handleColorChange('sidebarBackground', e.target.value)} className="absolute -top-2 -left-2 h-12 w-12 p-0 cursor-pointer opacity-0" />
                                                    <div className="w-full h-full" style={{background: currentColors.sidebarBackground}} />
                                                </div>
                                                <Input type="text" value={currentColors.sidebarBackground} onChange={(e) => handleColorChange('sidebarBackground', e.target.value)} className="h-8 text-xs font-mono bg-background/50" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Header BG</Label>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-md border overflow-hidden relative shadow-sm ring-1 ring-border/50">
                                                    <Input type="color" value={currentColors.sidebarHeader} onChange={(e) => handleColorChange('sidebarHeader', e.target.value)} className="absolute -top-2 -left-2 h-12 w-12 p-0 cursor-pointer opacity-0" />
                                                    <div className="w-full h-full" style={{background: currentColors.sidebarHeader}} />
                                                </div>
                                                <Input type="text" value={currentColors.sidebarHeader} onChange={(e) => handleColorChange('sidebarHeader', e.target.value)} className="h-8 text-xs font-mono bg-background/50" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gradient Presets */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">Quick Gradients</Label>
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {[
                                                'linear-gradient(to bottom, #0f172a, #1e293b)',
                                                'linear-gradient(to bottom, #000000, #434343)',
                                                'linear-gradient(to bottom, #2c3e50, #3498db)',
                                                'linear-gradient(to bottom, #8e44ad, #3498db)',
                                                'linear-gradient(to bottom, #11998e, #38ef7d)',
                                                'linear-gradient(to bottom, #ff9966, #ff5e62)',
                                            ].map((grad, i) => (
                                                <button
                                                    key={i}
                                                    className="h-8 w-8 rounded-full border shrink-0 hover:scale-110 transition-transform shadow-sm"
                                                    style={{ background: grad }}
                                                    onClick={() => handleColorChange('sidebarBackground', grad)}
                                                    title="Apply Gradient"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-px bg-border/50" />

                                    {/* Text Colors */}
                                    <div className="space-y-3">
                                        <Label className="text-xs font-medium">Text Colors</Label>
                                        
                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-border/50">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">Sidebar Text</span>
                                                    <span className="text-[10px] text-muted-foreground">Only affects sidebar</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full border overflow-hidden relative shadow-sm">
                                                        <Input type="color" value={currentColors.sidebarForeground} onChange={(e) => handleColorChange('sidebarForeground', e.target.value)} className="absolute -top-2 -left-2 h-10 w-10 p-0 cursor-pointer opacity-0" />
                                                        <div className="w-full h-full" style={{backgroundColor: currentColors.sidebarForeground}} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-border/50">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">Dashboard Text</span>
                                                    <span className="text-[10px] text-muted-foreground">Main content text</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full border overflow-hidden relative shadow-sm">
                                                        <Input type="color" value={currentColors.foreground} onChange={(e) => handleColorChange('foreground', e.target.value)} className="absolute -top-2 -left-2 h-10 w-10 p-0 cursor-pointer opacity-0" />
                                                        <div className="w-full h-full" style={{backgroundColor: currentColors.foreground}} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-border/50">
                                                <span className="text-xs">Muted / Icons</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full border overflow-hidden relative shadow-sm">
                                                        <Input type="color" value={currentColors.sidebarMutedForeground} onChange={(e) => handleColorChange('sidebarMutedForeground', e.target.value)} className="absolute -top-2 -left-2 h-10 w-10 p-0 cursor-pointer opacity-0" />
                                                        <div className="w-full h-full" style={{backgroundColor: currentColors.sidebarMutedForeground}} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-border/50">
                                                <span className="text-xs">Active Item Text</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full border overflow-hidden relative shadow-sm">
                                                        <Input type="color" value={currentColors.sidebarAccentForeground} onChange={(e) => handleColorChange('sidebarAccentForeground', e.target.value)} className="absolute -top-2 -left-2 h-10 w-10 p-0 cursor-pointer opacity-0" />
                                                        <div className="w-full h-full" style={{backgroundColor: currentColors.sidebarAccentForeground}} />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-border/50">
                                                <span className="text-xs">Active Item BG</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full border overflow-hidden relative shadow-sm">
                                                        <Input type="color" value={currentColors.sidebarAccent} onChange={(e) => handleColorChange('sidebarAccent', e.target.value)} className="absolute -top-2 -left-2 h-10 w-10 p-0 cursor-pointer opacity-0" />
                                                        <div className="w-full h-full" style={{backgroundColor: currentColors.sidebarAccent}} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-border/50" />

                                    {/* Border */}
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Border Color</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full border overflow-hidden relative shadow-sm">
                                                <Input type="color" value={currentColors.sidebarBorder} onChange={(e) => handleColorChange('sidebarBorder', e.target.value)} className="absolute -top-2 -left-2 h-10 w-10 p-0 cursor-pointer opacity-0" />
                                                <div className="w-full h-full" style={{backgroundColor: currentColors.sidebarBorder}} />
                                            </div>
                                            <Input type="text" value={currentColors.sidebarBorder} onChange={(e) => handleColorChange('sidebarBorder', e.target.value)} className="w-20 h-7 text-xs font-mono bg-background/50" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Sidebar Radius ({localSettings.sidebarRadius || 0}px)</Label>
                                        <Slider 
                                            value={[localSettings.sidebarRadius || 0]} 
                                            max={32} 
                                            step={1} 
                                            onValueChange={(val) => handleSettingChange('sidebarRadius', val[0])} 
                                            className="w-32" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Header Styling</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <Label className="text-xs">Header Background</Label>
                                            <span className="text-[10px] text-muted-foreground">Clear for auto-glass effect</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {currentColors.headerBackground && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6" 
                                                    onClick={() => handleColorChange('headerBackground', '')}
                                                    title="Reset to Auto"
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <div className="h-6 w-6 rounded-full border overflow-hidden relative shadow-sm">
                                                <Input 
                                                    type="color" 
                                                    value={currentColors.headerBackground || currentColors.background || '#ffffff'} 
                                                    onChange={(e) => handleColorChange('headerBackground', e.target.value)} 
                                                    className="absolute -top-2 -left-2 h-10 w-10 p-0 cursor-pointer opacity-0" 
                                                />
                                                <div 
                                                    className="w-full h-full" 
                                                    style={{
                                                        backgroundColor: currentColors.headerBackground || 'transparent',
                                                        backgroundImage: !currentColors.headerBackground ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                                                        backgroundSize: '8px 8px',
                                                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                                                    }} 
                                                />
                                            </div>
                                            <Input 
                                                type="text" 
                                                value={currentColors.headerBackground || 'Auto'} 
                                                onChange={(e) => handleColorChange('headerBackground', e.target.value)} 
                                                className="w-20 h-7 text-xs font-mono bg-background/50" 
                                                placeholder="Auto"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Header Radius ({localSettings.headerRadius || 0}px)</Label>
                                        <Slider 
                                            value={[localSettings.headerRadius || 0]} 
                                            max={32} 
                                            step={1} 
                                            onValueChange={(val) => handleSettingChange('headerRadius', val[0])} 
                                            className="w-32" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Main Interface</h3>
                                    {['primary', 'secondary', 'background', 'card', 'foreground', 'border', 'accent'].map(key => {
                                        const labelMap = {
                                            primary: 'Primary Color',
                                            secondary: 'Secondary Color',
                                            background: 'Page Background',
                                            card: 'Cards & Widgets',
                                            foreground: 'Text Color',
                                            border: 'Borders',
                                            accent: 'Accent Color'
                                        };
                                        return (
                                        <div key={key} className="flex items-center justify-between">
                                            <Label className="text-xs capitalize">{labelMap[key] || key}</Label>
                                            <div className="flex items-center gap-2">
                                                 <div className="h-6 w-6 rounded-full border overflow-hidden relative shadow-sm">
                                                    <Input type="color" value={currentColors[key]} onChange={(e) => handleColorChange(key, e.target.value)} className="absolute -top-2 -left-2 h-10 w-10 p-0 cursor-pointer opacity-0" />
                                                    <div className="w-full h-full" style={{backgroundColor: currentColors[key]}} />
                                                </div>
                                                <Input type="text" value={currentColors[key]} onChange={(e) => handleColorChange(key, e.target.value)} className="w-20 h-7 text-xs font-mono bg-background/50" />
                                            </div>
                                        </div>
                                    )})}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Typography & Layout</h3>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Font Family</Label>
                                        <Select value={localSettings.fontFamily} onValueChange={(val) => handleSettingChange('fontFamily', val)}>
                                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select font" /></SelectTrigger>
                                            <SelectContent>
                                                {fonts.map(f => <SelectItem key={f} value={f} style={{fontFamily: f}}>{f}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Border Radius ({localSettings.radius}px)</Label>
                                        <Slider value={[localSettings.radius]} max={20} step={1} onValueChange={(val) => handleSettingChange('radius', val[0])} className="w-32" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Shadows</Label>
                                        <Switch checked={localSettings.shadows} onCheckedChange={(val) => handleSettingChange('shadows', val)} />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* MANAGE TAB */}
                            <TabsContent value="manage" className="flex-1 overflow-y-auto p-4 space-y-6 mt-0 data-[state=inactive]:hidden flex flex-col justify-start">
                                
                                {/* CUSTOM THEME SECTION */}
                                <Card className="p-4 space-y-4 bg-card/50 border-border/50">
                                    <div className="flex items-center gap-2">
                                        <LayoutTemplate className="h-4 w-4 text-primary" />
                                        <h3 className="font-medium text-sm">My Custom Theme</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Save Current Theme</Label>
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="Theme Name" 
                                                value={customThemeName} 
                                                onChange={(e) => setCustomThemeName(e.target.value)}
                                                className="bg-background/50"
                                            />
                                            <Button 
                                                size="sm" 
                                                onClick={async () => {
                                                    if (!customThemeName) return toast({ title: "Name Required", variant: "destructive" });
                                                    setIsSaving(true);
                                                    const res = await saveCustomThemeToProfile(customThemeName);
                                                    setIsSaving(false);
                                                    toast({ title: res.success ? "Saved" : "Error", description: res.message, variant: res.success ? "default" : "destructive" });
                                                }}
                                                disabled={isSaving}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-border/50">
                                        <Button 
                                            variant="secondary" 
                                            className="w-full" 
                                            onClick={async () => {
                                                setIsSaving(true);
                                                const res = await loadCustomThemeFromProfile();
                                                setIsSaving(false);
                                                toast({ title: res.success ? "Loaded" : "Error", description: res.message, variant: res.success ? "default" : "destructive" });
                                                if (res.success) setLocalSettings(res.theme);
                                            }}
                                            disabled={isSaving}
                                        >
                                            Load My Custom Theme
                                        </Button>
                                    </div>
                                </Card>

                                <Card className="p-4 space-y-4 bg-card/50 border-border/50">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <h3 className="font-medium text-sm">Schedule Themes</h3>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Enable Scheduling</Label>
                                        <Switch 
                                            checked={localSettings.scheduling?.enabled} 
                                            onCheckedChange={(val) => {
                                                const newSched = { ...localSettings.scheduling, enabled: val };
                                                handleSettingChange('scheduling', newSched);
                                            }} 
                                        />
                                    </div>
                                    {localSettings.scheduling?.enabled && (
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div className="space-y-2">
                                                <Label>Day Start</Label>
                                                <Input type="time" value={localSettings.scheduling.dayStart} onChange={e => handleSettingChange('scheduling', {...localSettings.scheduling, dayStart: e.target.value})} className="bg-background/50" />
                                                <Label>Day Theme</Label>
                                                <div className="text-muted-foreground">Auto-switches to Light</div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Night Start</Label>
                                                <Input type="time" value={localSettings.scheduling.nightStart} onChange={e => handleSettingChange('scheduling', {...localSettings.scheduling, nightStart: e.target.value})} className="bg-background/50" />
                                                <Label>Night Theme</Label>
                                                <div className="text-muted-foreground">Auto-switches to Dark</div>
                                            </div>
                                        </div>
                                    )}
                                </Card>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium flex items-center gap-2"><History className="h-4 w-4" /> Recently Used</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {themeHistory.map((th, i) => (
                                            <Badge key={i} variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => {
                                                const t = premiumThemes.find(pt => pt.name === th);
                                                if (t) handleThemeSelect(t);
                                            }}>{th}</Badge>
                                        ))}
                                        {themeHistory.length === 0 && <span className="text-xs text-muted-foreground">No history yet</span>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button variant="outline" onClick={handleExport} className="w-full">
                                        <Download className="mr-2 h-4 w-4" /> Export JSON
                                    </Button>
                                    <div className="relative">
                                        <Button variant="outline" className="w-full">
                                            <Upload className="mr-2 h-4 w-4" /> Import JSON
                                        </Button>
                                        <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="p-4 border-t bg-background/80 backdrop-blur-md z-10 space-y-3">
                        <div className="flex justify-between gap-3">
                             <Button variant="outline" onClick={handleResetToDefault} className="flex-1">
                                <RotateCcw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving} className="flex-1 shadow-lg shadow-primary/20">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Theme
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ThemeCustomizer;
