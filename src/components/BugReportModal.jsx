/**
 * BugReportModal - Professional Bug Report Form
 * ═══════════════════════════════════════════════════════════════════════════════
 * Comprehensive bug reporting modal for Jashchar ERP
 * 
 * Fields included (similar to Excel bug tracking sheet):
 * - Category (UI Bug, Functional Bug, Performance, Data Issue, etc.)
 * - Priority (Critical, High, Medium, Low)
 * - Module Name (auto-detected from current page)
 * - Page URL (auto-filled)
 * - Bug Title
 * - Description
 * - Steps to Reproduce
 * - Expected Behavior
 * - Actual Behavior
 * - Screenshot (optional - capture or upload)
 * - Reporter Information (auto-filled from user context)
 * - Device Information (auto-collected)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Bug, 
    Send, 
    Camera, 
    Upload, 
    X, 
    AlertTriangle,
    Loader2,
    CheckCircle,
    Monitor,
    Smartphone,
    Globe,
    User,
    FileText,
    Target,
    ListOrdered,
    Eye,
    AlertCircle,
    Image,
    Info
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLocation } from 'react-router-dom';
import { errorLoggerService } from '@/services/errorLoggerService';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Bug Categories
const BUG_CATEGORIES = [
    { value: 'ui_bug', label: 'UI/Visual Bug', icon: Eye, description: 'Layout issues, styling problems, broken UI' },
    { value: 'functional_bug', label: 'Functional Bug', icon: AlertTriangle, description: 'Feature not working as expected' },
    { value: 'data_issue', label: 'Data Issue', icon: FileText, description: 'Wrong data, missing data, data not saving' },
    { value: 'performance', label: 'Performance Issue', icon: Target, description: 'Slow loading, freezing, lag' },
    { value: 'crash', label: 'Crash/Error', icon: AlertCircle, description: 'Page crashes, error messages, white screen' },
    { value: 'security', label: 'Security Concern', icon: Bug, description: 'Security vulnerability or concern' },
    { value: 'accessibility', label: 'Accessibility', icon: User, description: 'Screen reader, keyboard navigation issues' },
    { value: 'suggestion', label: 'Feature Suggestion', icon: Info, description: 'Improvement idea or feature request' },
    { value: 'other', label: 'Other', icon: Bug, description: 'Something else not listed above' }
];

// Priority Levels
const PRIORITY_LEVELS = [
    { value: 'critical', label: 'Critical', color: 'bg-red-500', description: 'System down, data loss, blocking issue' },
    { value: 'high', label: 'High', color: 'bg-orange-500', description: 'Major feature broken, affecting many users' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500', description: 'Feature partially working, workaround exists' },
    { value: 'low', label: 'Low', color: 'bg-blue-500', description: 'Minor issue, cosmetic, nice-to-have fix' }
];

// Detect module from URL
const detectModule = (pathname) => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
        return parts.slice(0, 2).join('/');
    }
    return parts[0] || 'unknown';
};

// Get device info
const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    
    // Detect browser
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Opera')) browser = 'Opera';
    
    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    return {
        browser,
        os,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: ua,
        language: navigator.language,
        platform: navigator.platform,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    };
};

const BugReportModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const location = useLocation();
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    
    // Form state
    const [formData, setFormData] = useState({
        category: '',
        priority: 'medium',
        title: '',
        description: '',
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: ''
    });
    const [screenshot, setScreenshot] = useState(null);
    const [screenshotPreview, setScreenshotPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    // Auto-fill data
    const moduleInfo = detectModule(location.pathname);
    const deviceInfo = getDeviceInfo();
    const reporterName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown';
    const reporterEmail = user?.email || '';
    const reporterRole = user?.user_metadata?.role || user?.role || 'guest';

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setFormData({
                    category: '',
                    priority: 'medium',
                    title: '',
                    description: '',
                    stepsToReproduce: '',
                    expectedBehavior: '',
                    actualBehavior: ''
                });
                setScreenshot(null);
                setScreenshotPreview(null);
                setSubmitted(false);
                setActiveTab('basic');
            }, 300);
        }
    }, [isOpen]);

    // Handle form field changes
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle screenshot upload
    const handleScreenshotUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ variant: 'destructive', title: 'File Too Large', description: 'Screenshot must be less than 5MB' });
                return;
            }
            setScreenshot(file);
            const reader = new FileReader();
            reader.onload = (e) => setScreenshotPreview(e.target?.result);
            reader.readAsDataURL(file);
        }
    };

    // Remove screenshot
    const removeScreenshot = () => {
        setScreenshot(null);
        setScreenshotPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Validate form
    const isFormValid = () => {
        return formData.category && formData.title && formData.description;
    };

    // Submit bug report
    const handleSubmit = async () => {
        if (!isFormValid()) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill in all required fields' });
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare screenshot data
            let screenshotData = null;
            if (screenshot && screenshotPreview) {
                screenshotData = screenshotPreview;
            }

            // Create comprehensive bug report
            const bugReport = {
                message: `[USER REPORT] ${formData.title}`,
                stack: `Category: ${formData.category}\nPriority: ${formData.priority}\n\nDescription:\n${formData.description}\n\nSteps to Reproduce:\n${formData.stepsToReproduce || 'Not provided'}\n\nExpected Behavior:\n${formData.expectedBehavior || 'Not provided'}\n\nActual Behavior:\n${formData.actualBehavior || 'Not provided'}`
            };

            const errorInfo = {
                componentStack: `Module: ${moduleInfo}\nPage: ${location.pathname}`
            };

            const context = {
                severity: formData.priority === 'critical' ? 'critical' : 
                          formData.priority === 'high' ? 'error' : 
                          formData.priority === 'medium' ? 'warning' : 'info',
                source: 'user_report',
                module: moduleInfo,
                stack_trace: bugReport.stack,
                metadata: {
                    // Bug details
                    category: formData.category,
                    priority: formData.priority,
                    title: formData.title,
                    description: formData.description,
                    steps_to_reproduce: formData.stepsToReproduce,
                    expected_behavior: formData.expectedBehavior,
                    actual_behavior: formData.actualBehavior,
                    
                    // Reporter details
                    reporter_name: reporterName,
                    reporter_email: reporterEmail,
                    reporter_role: reporterRole,
                    reported_at: new Date().toISOString(),
                    
                    // Device & environment
                    device: deviceInfo,
                    page_url: window.location.href,
                    module_name: moduleInfo,
                    
                    // Screenshot (base64)
                    screenshot_data: screenshotData,
                    has_screenshot: !!screenshotData
                }
            };

            // Submit via errorLoggerService
            await errorLoggerService.logError(bugReport, errorInfo, context);
            
            setSubmitted(true);
            toast({ title: 'Report Submitted!', description: 'Bug report submitted successfully! Our team will review it soon.' });
            
            // Close modal after delay
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Failed to submit bug report:', error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Failed to submit bug report. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success state
    if (submitted) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Report Submitted!</h3>
                        <p className="text-muted-foreground text-sm">
                            Thank you for helping us improve Jashchar ERP. Our team will review your report soon.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                            <Bug className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">Report a Bug or Issue</DialogTitle>
                            <DialogDescription className="text-xs mt-1">
                                Help us improve by reporting problems you encounter
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid grid-cols-3 mx-4 mt-4">
                        <TabsTrigger value="basic" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" /> Basic Info
                        </TabsTrigger>
                        <TabsTrigger value="details" className="text-xs">
                            <ListOrdered className="h-3 w-3 mr-1" /> Details
                        </TabsTrigger>
                        <TabsTrigger value="screenshot" className="text-xs">
                            <Image className="h-3 w-3 mr-1" /> Screenshot
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                        {/* Basic Info Tab */}
                        <TabsContent value="basic" className="space-y-4 mt-4">
                            {/* Category */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-1">
                                    Category <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select bug category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BUG_CATEGORIES.map(cat => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                <div className="flex items-center gap-2">
                                                    <cat.icon className="h-4 w-4 text-muted-foreground" />
                                                    <span>{cat.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formData.category && (
                                    <p className="text-xs text-muted-foreground">
                                        {BUG_CATEGORIES.find(c => c.value === formData.category)?.description}
                                    </p>
                                )}
                            </div>

                            {/* Priority */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Priority</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {PRIORITY_LEVELS.map(p => (
                                        <Button
                                            key={p.value}
                                            type="button"
                                            variant={formData.priority === p.value ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleChange('priority', p.value)}
                                            className={cn(
                                                "flex items-center gap-1",
                                                formData.priority === p.value && p.color
                                            )}
                                        >
                                            <span className={cn(
                                                "w-2 h-2 rounded-full",
                                                formData.priority === p.value ? "bg-white" : p.color
                                            )} />
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                                {formData.priority && (
                                    <p className="text-xs text-muted-foreground">
                                        {PRIORITY_LEVELS.find(p => p.value === formData.priority)?.description}
                                    </p>
                                )}
                            </div>

                            {/* Bug Title */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-1">
                                    Bug Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    placeholder="Brief description of the issue (e.g., 'Save button not working on student form')"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    maxLength={200}
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {formData.title.length}/200
                                </p>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-1">
                                    Description <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    placeholder="Describe the bug in detail. What were you trying to do? What happened?"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={4}
                                    maxLength={2000}
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {formData.description.length}/2000
                                </p>
                            </div>
                        </TabsContent>

                        {/* Details Tab */}
                        <TabsContent value="details" className="space-y-4 mt-4">
                            {/* Steps to Reproduce */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Steps to Reproduce</Label>
                                <Textarea
                                    placeholder="1. Go to...&#10;2. Click on...&#10;3. Enter...&#10;4. See error"
                                    value={formData.stepsToReproduce}
                                    onChange={(e) => handleChange('stepsToReproduce', e.target.value)}
                                    rows={4}
                                />
                            </div>

                            {/* Expected Behavior */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Expected Behavior</Label>
                                <Textarea
                                    placeholder="What should have happened?"
                                    value={formData.expectedBehavior}
                                    onChange={(e) => handleChange('expectedBehavior', e.target.value)}
                                    rows={2}
                                />
                            </div>

                            {/* Actual Behavior */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Actual Behavior</Label>
                                <Textarea
                                    placeholder="What actually happened?"
                                    value={formData.actualBehavior}
                                    onChange={(e) => handleChange('actualBehavior', e.target.value)}
                                    rows={2}
                                />
                            </div>

                            {/* Auto-collected Info */}
                            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                <Label className="text-xs uppercase text-muted-foreground">Auto-Collected Information</Label>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Module:</span>
                                        <span className="font-mono text-xs">{moduleInfo}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Reporter:</span>
                                        <span>{reporterName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {deviceInfo.isMobile ? (
                                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Monitor className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="text-muted-foreground">Device:</span>
                                        <span>{deviceInfo.browser} / {deviceInfo.os}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Monitor className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Screen:</span>
                                        <span>{deviceInfo.screenSize}</span>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Screenshot Tab */}
                        <TabsContent value="screenshot" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Screenshot (Optional)</Label>
                                <p className="text-xs text-muted-foreground">
                                    A screenshot helps us understand the issue faster. Max file size: 5MB
                                </p>
                            </div>

                            {!screenshotPreview ? (
                                <div 
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-8",
                                        "flex flex-col items-center justify-center gap-4",
                                        "cursor-pointer hover:bg-muted/50 transition-colors"
                                    )}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                                        <Upload className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium">Click to upload screenshot</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleScreenshotUpload}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="relative">
                                    <img 
                                        src={screenshotPreview} 
                                        alt="Screenshot preview"
                                        className="w-full max-h-64 object-contain rounded-lg border"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={removeScreenshot}
                                    >
                                        <X className="h-4 w-4 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}

                            {/* Tips */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                                    📸 Screenshot Tips
                                </h4>
                                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
                                    <li>Capture the entire screen where the issue occurs</li>
                                    <li>Include any error messages visible</li>
                                    <li>Highlight or circle the problem area if possible</li>
                                    <li>Press Windows + Shift + S for quick screenshot on Windows</li>
                                </ul>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="border-t pt-4 px-4">
                    <div className="flex items-center justify-between w-full">
                        <p className="text-xs text-muted-foreground">
                            <span className="text-red-500">*</span> Required fields
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSubmit} 
                                disabled={!isFormValid() || isSubmitting}
                                className="bg-pink-600 hover:bg-pink-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit Report
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BugReportModal;
