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
import html2canvas from 'html2canvas';
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
    Info,
    Terminal,
    MonitorDown
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
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
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
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
    const [isCapturing, setIsCapturing] = useState(false);
    const [consoleLogs, setConsoleLogs] = useState([]);
    const [consoleLogsCaptured, setConsoleLogsCaptured] = useState(false);

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
                setConsoleLogs([]);
                setConsoleLogsCaptured(false);
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

    // Capture background screenshot using html2canvas
    const captureBackgroundScreenshot = async () => {
        setIsCapturing(true);
        try {
            // Hide the modal temporarily
            const modalBackdrop = document.querySelector('[data-state="open"]');
            const dialogContent = document.querySelector('[role="dialog"]');
            
            if (dialogContent) {
                dialogContent.style.visibility = 'hidden';
            }
            if (modalBackdrop) {
                modalBackdrop.style.visibility = 'hidden';
            }

            // Small delay to ensure modal is hidden
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture the entire page - full screen with high quality
            const canvas = await html2canvas(document.documentElement, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 2, // Higher quality
                logging: false,
                width: window.innerWidth,
                height: window.innerHeight,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                scrollX: 0,
                scrollY: 0,
                ignoreElements: (element) => {
                    // Ignore the modal elements
                    return element.getAttribute('role') === 'dialog' || 
                           element.classList.contains('fixed') ||
                           element.hasAttribute('data-radix-portal');
                }
            });

            // Show modal again
            if (dialogContent) {
                dialogContent.style.visibility = 'visible';
            }
            if (modalBackdrop) {
                modalBackdrop.style.visibility = 'visible';
            }

            // Convert canvas to base64
            const dataUrl = canvas.toDataURL('image/png');
            setScreenshotPreview(dataUrl);
            
            // Convert base64 to blob without using fetch (CSP-safe)
            const base64Data = dataUrl.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            const file = new File([blob], 'background-screenshot.png', { type: 'image/png' });
            setScreenshot(file);

            toast({ 
                title: 'Screenshot Captured!', 
                description: 'Background page captured successfully.' 
            });

        } catch (error) {
            console.error('Failed to capture background:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Capture Failed', 
                description: 'Failed to capture background. Try uploading manually.' 
            });
            
            // Make sure modal is visible again on error
            const dialogContent = document.querySelector('[role="dialog"]');
            const modalBackdrop = document.querySelector('[data-state="open"]');
            if (dialogContent) dialogContent.style.visibility = 'visible';
            if (modalBackdrop) modalBackdrop.style.visibility = 'visible';
        } finally {
            setIsCapturing(false);
        }
    };

    // Capture console logs/errors
    const captureConsoleLogs = () => {
        try {
            // Get all captured console logs from window if available
            const capturedLogs = [];
            
            // Get errors from performance entries
            const resourceErrors = performance.getEntriesByType('resource')
                .filter(entry => entry.duration === 0 || entry.transferSize === 0)
                .slice(-10)
                .map(entry => ({
                    type: 'resource_error',
                    message: `Failed to load: ${entry.name}`,
                    timestamp: new Date().toISOString()
                }));
            
            capturedLogs.push(...resourceErrors);

            // Try to access any stored console logs (if error boundary is capturing)
            if (window.__JASHCHAR_CONSOLE_LOGS__) {
                capturedLogs.push(...window.__JASHCHAR_CONSOLE_LOGS__.slice(-50));
            }

            // Check for last known errors
            if (window.__JASHCHAR_LAST_ERRORS__) {
                capturedLogs.push(...window.__JASHCHAR_LAST_ERRORS__.slice(-20));
            }

            // Add current page state
            capturedLogs.push({
                type: 'page_info',
                message: `Page: ${location.pathname}`,
                timestamp: new Date().toISOString()
            });

            // Add memory info if available
            if (performance.memory) {
                capturedLogs.push({
                    type: 'memory_info',
                    message: `Heap: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)}MB`,
                    timestamp: new Date().toISOString()
                });
            }

            // Add navigation timing
            const navTiming = performance.getEntriesByType('navigation')[0];
            if (navTiming) {
                capturedLogs.push({
                    type: 'timing_info',
                    message: `Page Load: ${Math.round(navTiming.domContentLoadedEventEnd)}ms`,
                    timestamp: new Date().toISOString()
                });
            }

            setConsoleLogs(capturedLogs);
            setConsoleLogsCaptured(true);

            toast({ 
                title: 'Console Captured!', 
                description: `${capturedLogs.length} entries captured.`
            });

        } catch (error) {
            console.error('Failed to capture console:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Capture Failed', 
                description: 'Failed to capture console logs.' 
            });
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
                organization_id: organizationId,
                branch_id: selectedBranch?.id,
                session_id: currentSessionId,
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
                    has_screenshot: !!screenshotData,
                    
                    // Console logs
                    console_logs: consoleLogs,
                    has_console_logs: consoleLogsCaptured
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
            <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="border-b p-3 sm:p-4 shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center shrink-0">
                            <Bug className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-base sm:text-lg truncate">Report a Bug or Issue</DialogTitle>
                            <DialogDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">
                                Help us improve by reporting problems you encounter
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <TabsList className="grid grid-cols-3 mx-2 sm:mx-4 mt-2 sm:mt-4 shrink-0">
                        <TabsTrigger value="basic" className="text-[10px] sm:text-xs px-1 sm:px-3">
                            <FileText className="h-3 w-3 mr-0.5 sm:mr-1 hidden xs:inline" /> Basic
                        </TabsTrigger>
                        <TabsTrigger value="details" className="text-[10px] sm:text-xs px-1 sm:px-3">
                            <ListOrdered className="h-3 w-3 mr-0.5 sm:mr-1 hidden xs:inline" /> Details
                        </TabsTrigger>
                        <TabsTrigger value="screenshot" className="text-[10px] sm:text-xs px-1 sm:px-3">
                            <Image className="h-3 w-3 mr-0.5 sm:mr-1 hidden xs:inline" /> Screenshot
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-2 sm:pb-4 min-h-0">
                        {/* Basic Info Tab */}
                        <TabsContent value="basic" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                            {/* Category */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-xs sm:text-sm font-medium flex items-center gap-1">
                                    Category <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                                        <SelectValue placeholder="Select bug category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BUG_CATEGORIES.map(cat => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                <div className="flex items-center gap-2">
                                                    <cat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                                    <span className="text-xs sm:text-sm">{cat.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formData.category && (
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                        {BUG_CATEGORIES.find(c => c.value === formData.category)?.description}
                                    </p>
                                )}
                            </div>

                            {/* Priority */}
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Priority</Label>
                                <div className="grid grid-cols-4 gap-1 sm:flex sm:gap-2 sm:flex-wrap">
                                    {PRIORITY_LEVELS.map(p => (
                                        <Button
                                            key={p.value}
                                            type="button"
                                            variant={formData.priority === p.value ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleChange('priority', p.value)}
                                            className={cn(
                                                "flex items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-3 h-7 sm:h-8",
                                                formData.priority === p.value && p.color
                                            )}
                                        >
                                            <span className={cn(
                                                "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0",
                                                formData.priority === p.value ? "bg-white" : p.color
                                            )} />
                                            <span className="truncate">{p.label}</span>
                                        </Button>
                                    ))}
                                </div>
                                {formData.priority && (
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                        {PRIORITY_LEVELS.find(p => p.value === formData.priority)?.description}
                                    </p>
                                )}
                            </div>

                            {/* Bug Title */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-xs sm:text-sm font-medium flex items-center gap-1">
                                    Bug Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    placeholder="Brief description of the issue"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    maxLength={200}
                                    className="h-9 sm:h-10 text-xs sm:text-sm"
                                />
                                <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
                                    {formData.title.length}/200
                                </p>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-xs sm:text-sm font-medium flex items-center gap-1">
                                    Description <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    placeholder="Describe the bug in detail. What were you trying to do?"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={3}
                                    maxLength={2000}
                                    className="text-xs sm:text-sm min-h-[80px] sm:min-h-[100px]"
                                />
                                <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
                                    {formData.description.length}/2000
                                </p>
                            </div>

                            {/* Capture Console Logs */}
                            <div className="p-2 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2 sm:space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="h-4 w-4 text-orange-500 shrink-0" />
                                        <Label className="text-xs sm:text-sm font-medium">Console Logs (F12)</Label>
                                    </div>
                                    <Button
                                        type="button"
                                        variant={consoleLogsCaptured ? "outline" : "secondary"}
                                        size="sm"
                                        onClick={captureConsoleLogs}
                                        className={cn(
                                            "text-xs h-7 sm:h-8 w-full sm:w-auto",
                                            consoleLogsCaptured && "border-green-500 text-green-600"
                                        )}
                                    >
                                        {consoleLogsCaptured ? (
                                            <>
                                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                Captured ({consoleLogs.length})
                                            </>
                                        ) : (
                                            <>
                                                <Terminal className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                Capture Console
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                    Captures browser performance, errors, and page timing info to help debug issues.
                                </p>
                                {consoleLogsCaptured && consoleLogs.length > 0 && (
                                    <div className="max-h-24 sm:max-h-32 overflow-x-auto overflow-y-auto bg-gray-900 text-green-400 text-[10px] sm:text-xs p-2 rounded font-mono">
                                        {consoleLogs.slice(0, 10).map((log, idx) => (
                                            <div key={idx} className="py-0.5 whitespace-nowrap">
                                                [{log.type}] {log.message}
                                            </div>
                                        ))}
                                        {consoleLogs.length > 10 && (
                                            <div className="text-gray-500 mt-1">
                                                ... and {consoleLogs.length - 10} more entries
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Details Tab */}
                        <TabsContent value="details" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                            {/* Steps to Reproduce */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Steps to Reproduce</Label>
                                <Textarea
                                    placeholder="1. Go to...&#10;2. Click on...&#10;3. Enter...&#10;4. See error"
                                    value={formData.stepsToReproduce}
                                    onChange={(e) => handleChange('stepsToReproduce', e.target.value)}
                                    rows={3}
                                    className="text-xs sm:text-sm min-h-[70px] sm:min-h-[90px]"
                                />
                            </div>

                            {/* Expected Behavior */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Expected Behavior</Label>
                                <Textarea
                                    placeholder="What should have happened?"
                                    value={formData.expectedBehavior}
                                    onChange={(e) => handleChange('expectedBehavior', e.target.value)}
                                    rows={2}
                                    className="text-xs sm:text-sm min-h-[50px] sm:min-h-[60px]"
                                />
                            </div>

                            {/* Actual Behavior */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Actual Behavior</Label>
                                <Textarea
                                    placeholder="What actually happened?"
                                    value={formData.actualBehavior}
                                    onChange={(e) => handleChange('actualBehavior', e.target.value)}
                                    rows={2}
                                    className="text-xs sm:text-sm min-h-[50px] sm:min-h-[60px]"
                                />
                            </div>

                            {/* Auto-collected Info */}
                            <div className="p-2 sm:p-4 bg-muted/50 rounded-lg space-y-2 sm:space-y-3">
                                <Label className="text-[10px] sm:text-xs uppercase text-muted-foreground">Auto-Collected Information</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                        <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground shrink-0">Module:</span>
                                        <span className="font-mono text-[10px] sm:text-xs truncate">{moduleInfo}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground shrink-0">Reporter:</span>
                                        <span className="truncate">{reporterName}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                        {deviceInfo.isMobile ? (
                                            <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                                        ) : (
                                            <Monitor className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                                        )}
                                        <span className="text-muted-foreground shrink-0">Device:</span>
                                        <span className="truncate">{deviceInfo.browser} / {deviceInfo.os}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                        <Monitor className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground shrink-0">Screen:</span>
                                        <span>{deviceInfo.screenSize}</span>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Screenshot Tab */}
                        <TabsContent value="screenshot" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                            <div className="space-y-1 sm:space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Screenshot (Optional)</Label>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                    A screenshot helps us understand the issue faster. Max file size: 5MB
                                </p>
                            </div>

                            {/* Capture Background Button - Always visible */}
                            {!screenshotPreview && (
                                <div className="p-2 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center shrink-0">
                                                <MonitorDown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-xs sm:text-sm">Capture Background</p>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground">Auto-capture the page behind this modal</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="default"
                                            size="sm"
                                            onClick={captureBackgroundScreenshot}
                                            disabled={isCapturing}
                                            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                                        >
                                            {isCapturing ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />
                                                    Capturing...
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                    Capture
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* OR Divider */}
                            {!screenshotPreview && (
                                <div className="relative py-1">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">or upload manually</span>
                                    </div>
                                </div>
                            )}

                            {!screenshotPreview ? (
                                <div 
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-4 sm:p-8",
                                        "flex flex-col items-center justify-center gap-2 sm:gap-4",
                                        "cursor-pointer hover:bg-muted/50 transition-colors"
                                    )}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-xs sm:text-sm">Click to upload screenshot</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
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
                                <div className="relative border rounded-lg overflow-hidden">
                                    <img 
                                        src={screenshotPreview} 
                                        alt="Screenshot preview"
                                        className="w-full max-h-[50vh] sm:max-h-[400px] object-contain bg-gray-100 dark:bg-gray-800"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-1 right-1 sm:top-2 sm:right-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                                        onClick={removeScreenshot}
                                    >
                                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" /> Remove
                                    </Button>
                                </div>
                            )}

                            {/* Tips */}
                            <div className="p-2 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <h4 className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 sm:mb-2">
                                    📸 Screenshot Tips
                                </h4>
                                <ul className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 space-y-0.5 sm:space-y-1 list-disc list-inside">
                                    <li>Capture the entire screen where the issue occurs</li>
                                    <li>Include any error messages visible</li>
                                    <li>Highlight or circle the problem area if possible</li>
                                    <li className="hidden sm:list-item">Press Windows + Shift + S for quick screenshot on Windows</li>
                                </ul>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="border-t p-2 sm:pt-4 sm:px-4 shrink-0">
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                        <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">
                            <span className="text-red-500">*</span> Required fields
                        </p>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                                variant="outline" 
                                onClick={onClose} 
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSubmit} 
                                disabled={!isFormValid() || isSubmitting}
                                className="flex-1 sm:flex-none bg-pink-600 hover:bg-pink-700 text-xs sm:text-sm h-8 sm:h-9"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                        Submit
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
