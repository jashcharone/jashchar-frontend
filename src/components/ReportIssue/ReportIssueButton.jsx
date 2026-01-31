import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Bug, Send, X, Camera, Loader2, AlertCircle, CheckCircle,
    MessageSquare, Zap, Smartphone, Monitor, Globe, User,
    ChevronDown, Sparkles, HelpCircle, Lightbulb, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { errorLoggerService } from '@/services/errorLoggerService';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// ==================== ISSUE CATEGORIES ====================
const ISSUE_CATEGORIES = [
    { value: 'bug', label: '🐛 Bug / Error', icon: Bug, color: 'text-red-500' },
    { value: 'ui', label: '🎨 UI / Design Issue', icon: Monitor, color: 'text-purple-500' },
    { value: 'feature', label: '💡 Feature Request', icon: Lightbulb, color: 'text-yellow-500' },
    { value: 'slow', label: '🐌 Slow / Performance', icon: Zap, color: 'text-orange-500' },
    { value: 'question', label: '❓ Question / Help', icon: HelpCircle, color: 'text-blue-500' },
    { value: 'other', label: '📝 Other', icon: MessageSquare, color: 'text-gray-500' },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50 dark:bg-blue-500/20 dark:text-blue-400' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 dark:bg-yellow-500/20 dark:text-yellow-400' },
    { value: 'high', label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50 dark:bg-orange-500/20 dark:text-orange-400' },
    { value: 'critical', label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/50 dark:bg-red-500/20 dark:text-red-400' },
];

// ==================== SCREENSHOT CAPTURE ====================
const captureScreenshot = async () => {
    try {
        // Try using html2canvas if available, otherwise return null
        if (typeof window !== 'undefined' && window.html2canvas) {
            const canvas = await window.html2canvas(document.body, {
                scale: 0.5,
                logging: false,
                useCORS: true,
                allowTaint: true
            });
            return canvas.toDataURL('image/jpeg', 0.5);
        }
        return null;
    } catch (err) {
        console.warn('Screenshot capture failed:', err);
        return null;
    }
};

// ==================== DEVICE INFO COLLECTOR ====================
const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    
    // Browser detection
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    // OS detection
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';
    
    return {
        browser,
        os,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: ua.substring(0, 200),
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
};

// ==================== FLOATING BUTTON COMPONENT ====================
const FloatingButton = ({ onClick, hasUnread }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <div 
            className="fixed bottom-6 right-6 z-[9999] group print-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Tooltip */}
            <div className={`absolute bottom-full right-0 mb-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <div className="bg-slate-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-400" />
                        Report an Issue
                    </span>
                    <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                </div>
            </div>
            
            {/* Main Button */}
            <button
                onClick={onClick}
                className={`
                    relative flex items-center justify-center
                    w-14 h-14 rounded-full
                    bg-gradient-to-br from-purple-600 via-pink-500 to-red-500
                    hover:from-purple-700 hover:via-pink-600 hover:to-red-600
                    text-white shadow-lg hover:shadow-xl
                    transition-all duration-300 ease-out
                    hover:scale-110 active:scale-95
                    focus:outline-none focus:ring-4 focus:ring-purple-300
                `}
                aria-label="Report an Issue"
            >
                {/* Pulse Animation */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 animate-ping opacity-20"></span>
                
                {/* Icon */}
                <Bug className="h-6 w-6 relative z-10" />
                
                {/* Notification Badge */}
                {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-black animate-bounce">
                        !
                    </span>
                )}
            </button>
        </div>
    );
};

// ==================== REPORT DIALOG COMPONENT ====================
const ReportDialog = ({ isOpen, onClose }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [screenshot, setScreenshot] = useState(null);
    const [capturingScreenshot, setCapturingScreenshot] = useState(false);
    
    const [formData, setFormData] = useState({
        category: '',
        priority: 'medium',
        title: '',
        description: '',
        stepsToReproduce: '',
        expectedBehavior: '',
        contactEmail: ''
    });

    // Auto-fill user email if logged in
    useEffect(() => {
        if (user?.email && !formData.contactEmail) {
            setFormData(prev => ({ ...prev, contactEmail: user.email }));
        }
    }, [user]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(1);
                setSubmitted(false);
                setScreenshot(null);
                setFormData({
                    category: '',
                    priority: 'medium',
                    title: '',
                    description: '',
                    stepsToReproduce: '',
                    expectedBehavior: '',
                    contactEmail: formData.contactEmail
                });
            }, 300);
        }
    }, [isOpen]);

    const handleCaptureScreenshot = async () => {
        setCapturingScreenshot(true);
        // Close dialog briefly to capture clean screenshot
        const img = await captureScreenshot();
        setScreenshot(img);
        setCapturingScreenshot(false);
        if (img) {
            toast({ title: '📸 Screenshot Captured!', description: 'Screenshot attached to your report.' });
        } else {
            toast({ 
                title: 'Screenshot not available', 
                description: 'You can describe the issue in detail instead.',
                variant: 'default'
            });
        }
    };

    const handleSubmit = async () => {
        if (!formData.category || !formData.title || !formData.description) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill all required fields.' });
            return;
        }

        setSubmitting(true);
        
        try {
            const deviceInfo = getDeviceInfo();
            const reportData = {
                // Map to error logger format
                error_message: `[USER REPORT] ${formData.title}`,
                stack_trace: `Category: ${formData.category}\nPriority: ${formData.priority}\n\nDescription:\n${formData.description}\n\nSteps to Reproduce:\n${formData.stepsToReproduce || 'Not provided'}\n\nExpected Behavior:\n${formData.expectedBehavior || 'Not provided'}\n\nContact: ${formData.contactEmail || 'Not provided'}`,
                page_url: window.location.href,
                source: 'user_report',
                severity: formData.priority === 'critical' ? 'critical' : formData.priority === 'high' ? 'error' : 'warning',
                module_name: formData.category,
                user_role: user?.role || 'unknown',
                metadata: {
                    type: 'USER_REPORT',
                    category: formData.category,
                    priority: formData.priority,
                    device: deviceInfo,
                    screenshot: screenshot ? 'attached' : 'none',
                    screenshot_data: screenshot,
                    reporter_email: formData.contactEmail,
                    reporter_id: user?.id,
                    reporter_name: user?.name || user?.email,
                    reported_at: new Date().toISOString()
                }
            };

            await errorLoggerService.logError(
                new Error(reportData.error_message),
                { url: window.location.href },
                reportData.metadata
            );

            setSubmitted(true);
            toast({ 
                title: '✅ Report Submitted!', 
                description: 'Our team will review your report soon. Thank you!',
                className: 'bg-green-50 border-green-500'
            });

            // Auto close after success
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            console.error('Failed to submit report:', err);
            toast({ 
                variant: 'destructive', 
                title: 'Submission Failed', 
                description: 'Please try again or contact support directly.' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getCategoryIcon = (value) => {
        const cat = ISSUE_CATEGORIES.find(c => c.value === value);
        return cat ? <cat.icon className={`h-5 w-5 ${cat.color}`} /> : <Bug className="h-5 w-5" />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Success State */}
                {submitted ? (
                    <div className="py-12 text-center">
                        <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-500 mb-2">Thank You! 🎉</h2>
                        <p className="text-muted-foreground">
                            Your report has been submitted successfully.<br/>
                            Our team will review it soon.
                        </p>
                    </div>
                ) : (
                    <>
                        <DialogHeader className="border-b border-border pb-4">
                            <DialogTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                                    <Bug className="h-5 w-5 text-purple-500" />
                                </div>
                                Report an Issue
                            </DialogTitle>
                            <DialogDescription>
                                Help us improve! Describe the problem you encountered.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Progress Steps */}
                        <div className="flex items-center justify-center gap-2 py-4">
                            {[1, 2].map((s) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                        step >= s 
                                            ? 'bg-purple-600 text-white' 
                                            : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {s}
                                    </div>
                                    {s < 2 && (
                                        <div className={`w-12 h-1 rounded ${step > s ? 'bg-purple-600' : 'bg-muted'}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Category & Basic Info */}
                        {step === 1 && (
                            <div className="space-y-5 py-2">
                                {/* Category Selection */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">What type of issue is this? *</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ISSUE_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat.value })}
                                                className={`p-3 rounded-lg border-2 transition-all text-left flex items-center gap-2 ${
                                                    formData.category === cat.value
                                                        ? 'border-purple-500 bg-purple-500/10 shadow-md'
                                                        : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                                                }`}
                                            >
                                                <cat.icon className={`h-5 w-5 ${cat.color}`} />
                                                <span className="text-sm font-medium">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Priority Level</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {PRIORITY_OPTIONS.map((p) => (
                                            <button
                                                key={p.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, priority: p.value })}
                                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                                                    formData.priority === p.value
                                                        ? p.color + ' ring-2 ring-offset-1 ring-offset-background'
                                                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Brief Title *</Label>
                                    <Input 
                                        placeholder="e.g., Button not working on student list"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="h-11"
                                    />
                                </div>

                                {/* Auto-captured Info */}
                                <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Auto-captured Information</Label>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <Badge variant="outline" className="bg-background">
                                            <Globe className="h-3 w-3 mr-1" />
                                            {window.location.pathname}
                                        </Badge>
                                        <Badge variant="outline" className="bg-background">
                                            <Monitor className="h-3 w-3 mr-1" />
                                            {getDeviceInfo().browser}
                                        </Badge>
                                        <Badge variant="outline" className="bg-background">
                                            <Smartphone className="h-3 w-3 mr-1" />
                                            {getDeviceInfo().screenSize}
                                        </Badge>
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => setStep(2)}
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    disabled={!formData.category || !formData.title}
                                >
                                    Continue <ChevronDown className="h-4 w-4 ml-2 rotate-[-90deg]" />
                                </Button>
                            </div>
                        )}

                        {/* Step 2: Description & Details */}
                        {step === 2 && (
                            <div className="space-y-5 py-2">
                                {/* Selected Category Display */}
                                <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                    {getCategoryIcon(formData.category)}
                                    <span className="font-medium">{formData.title}</span>
                                    <Badge className={PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.color}>
                                        {formData.priority}
                                    </Badge>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Describe the Issue *</Label>
                                    <Textarea 
                                        placeholder="What happened? What were you trying to do?"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="min-h-[100px] resize-none"
                                    />
                                </div>

                                {/* Steps to Reproduce */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Steps to Reproduce (Optional)</Label>
                                    <Textarea 
                                        placeholder="1. Click on...\n2. Then...\n3. Error appears"
                                        value={formData.stepsToReproduce}
                                        onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                                        className="min-h-[80px] resize-none"
                                    />
                                </div>

                                {/* Screenshot */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Screenshot (Optional)</Label>
                                    {screenshot ? (
                                        <div className="relative border border-border rounded-lg overflow-hidden">
                                            <img src={screenshot} alt="Screenshot" className="w-full h-32 object-cover" />
                                            <button 
                                                onClick={() => setScreenshot(null)}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={handleCaptureScreenshot}
                                            disabled={capturingScreenshot}
                                            className="w-full"
                                        >
                                            {capturingScreenshot ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Capturing...</>
                                            ) : (
                                                <><Camera className="h-4 w-4 mr-2" /> Capture Screenshot</>
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {/* Contact Email */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Your Email (for updates)</Label>
                                    <Input 
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setStep(1)}
                                        className="flex-1"
                                    >
                                        Back
                                    </Button>
                                    <Button 
                                        onClick={handleSubmit}
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        disabled={submitting || !formData.description}
                                    >
                                        {submitting ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                                        ) : (
                                            <><Send className="h-4 w-4 mr-2" /> Submit Report</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

// ==================== MAIN EXPORT COMPONENT ====================
const ReportIssueButton = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [portalContainer, setPortalContainer] = useState(null);

    useEffect(() => {
        // Create portal container
        let container = document.getElementById('report-issue-portal');
        if (!container) {
            container = document.createElement('div');
            container.id = 'report-issue-portal';
            document.body.appendChild(container);
        }
        setPortalContainer(container);

        return () => {
            // Cleanup on unmount
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        };
    }, []);

    if (!portalContainer) return null;

    return createPortal(
        <>
            <FloatingButton onClick={() => setIsDialogOpen(true)} />
            <ReportDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
        </>,
        portalContainer
    );
};

export default ReportIssueButton;
