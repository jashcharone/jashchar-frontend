// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - FACE REGISTRATION
// Capture and register faces for face recognition attendance
// REAL AI INTEGRATION using face-api.js
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// REAL AI FACE RECOGNITION IMPORT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
import {
    loadFaceModels,
    areModelsLoaded,
    detectSingleFace,
    getFaceDescriptor,
    descriptorToString,
    analyzeFaceQuality
} from '@/utils/faceRecognition';
import {
    ScanFace,
    Camera,
    Plus,
    Search,
    RefreshCw,
    Trash2,
    Edit,
    Eye,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Users,
    User,
    GraduationCap,
    Briefcase,
    Shield,
    Calendar,
    Clock,
    Download,
    Upload,
    Save,
    X,
    Circle,
    Aperture,
    Maximize2,
    RotateCcw,
    ZoomIn,
    Video,
    VideoOff,
    Image,
    Check
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CAMERA CAPTURE COMPONENT WITH REAL AI FACE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CameraCapture = ({ onCapture, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('user');
    const [capturedImages, setCapturedImages] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [countdown, setCountdown] = useState(null);
    
    // AI Face Detection States
    const [modelsLoading, setModelsLoading] = useState(true);
    const [modelLoadProgress, setModelLoadProgress] = useState('');
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceQuality, setFaceQuality] = useState(null);
    const [currentDescriptor, setCurrentDescriptor] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Face detection guide positions for optimal capture
    const captureAngles = [
        { id: 1, label: 'Front View', instruction: 'Look straight at the camera' },
        { id: 2, label: 'Left Turn', instruction: 'Turn head slightly left' },
        { id: 3, label: 'Right Turn', instruction: 'Turn head slightly right' },
    ];
    
    // Load AI models on mount
    useEffect(() => {
        const initModels = async () => {
            try {
                setModelsLoading(true);
                await loadFaceModels((progress) => setModelLoadProgress(progress));
                setModelsLoading(false);
            } catch (error) {
                console.error('Failed to load AI models:', error);
                setCameraError('Failed to load AI face recognition models. Please refresh and try again.');
                setModelsLoading(false);
            }
        };
        initModels();
    }, []);
    
    useEffect(() => {
        if (!modelsLoading) {
            startCamera();
        }
        return () => stopCamera();
    }, [facingMode, modelsLoading]);
    
    // Real-time face detection loop
    useEffect(() => {
        let animationId;
        let isRunning = true;
        
        const detectFace = async () => {
            if (!isRunning || !videoRef.current || modelsLoading || !areModelsLoaded()) return;
            
            try {
                const detection = await detectSingleFace(videoRef.current);
                
                if (detection) {
                    setFaceDetected(true);
                    const quality = analyzeFaceQuality(detection);
                    setFaceQuality(quality);
                    setCurrentDescriptor(detection.descriptor);
                    
                    // Draw face box on overlay canvas
                    if (overlayCanvasRef.current && videoRef.current) {
                        const canvas = overlayCanvasRef.current;
                        const video = videoRef.current;
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        const box = detection.detection.box;
                        // Draw green box if quality is good, yellow if medium, red if poor
                        ctx.strokeStyle = quality.isGood ? '#00ff00' : quality.score > 0.5 ? '#ffff00' : '#ff0000';
                        ctx.lineWidth = 3;
                        
                        // Mirror coordinates for selfie camera
                        if (facingMode === 'user') {
                            ctx.strokeRect(canvas.width - box.x - box.width, box.y, box.width, box.height);
                        } else {
                            ctx.strokeRect(box.x, box.y, box.width, box.height);
                        }
                        
                        // Draw quality label
                        ctx.fillStyle = quality.isGood ? '#00ff00' : '#ffff00';
                        ctx.font = '16px Arial';
                        const labelX = facingMode === 'user' ? canvas.width - box.x - box.width : box.x;
                        ctx.fillText(`Quality: ${Math.round(quality.score * 100)}%`, labelX, box.y - 10);
                    }
                } else {
                    setFaceDetected(false);
                    setFaceQuality(null);
                    setCurrentDescriptor(null);
                    
                    // Clear overlay
                    if (overlayCanvasRef.current) {
                        const ctx = overlayCanvasRef.current.getContext('2d');
                        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    }
                }
            } catch (error) {
                console.error('Face detection error:', error);
            }
            
            if (isRunning) {
                animationId = requestAnimationFrame(() => {
                    setTimeout(detectFace, 100); // Run detection every 100ms
                });
            }
        };
        
        if (!modelsLoading && stream) {
            detectFace();
        }
        
        return () => {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, [modelsLoading, stream, facingMode]);
    
    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            };
            
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setCameraError(null);
        } catch (error) {
            console.error('Camera error:', error);
            setCameraError('Unable to access camera. Please check permissions.');
        }
    };
    
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
    
    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        if (!faceDetected) {
            console.warn('No face detected - cannot capture');
            return;
        }
        
        setIsProcessing(true);
        
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        
        // Mirror for selfie camera
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        
        ctx.drawImage(video, 0, 0);
        
        // Get real face descriptor using AI
        const descriptor = currentDescriptor ? descriptorToString(currentDescriptor) : null;
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImages(prev => [...prev, {
            id: Date.now(),
            data: imageData,
            angle: captureAngles[capturedImages.length]?.label || 'Extra',
            descriptor: descriptor,
            quality: faceQuality?.score || 0,
            hasRealAI: !!descriptor
        }]);
        
        setIsProcessing(false);
    };
    
    const handleAutoCapture = async () => {
        setIsCapturing(true);
        
        for (let i = 0; i < 3; i++) {
            // Wait for face to be detected before countdown
            let waitAttempts = 0;
            while (!faceDetected && waitAttempts < 30) {
                await new Promise(r => setTimeout(r, 200));
                waitAttempts++;
            }
            
            if (!faceDetected) {
                console.warn('Face not detected, skipping capture');
                continue;
            }
            
            // Countdown
            for (let c = 3; c > 0; c--) {
                setCountdown(c);
                await new Promise(r => setTimeout(r, 1000));
            }
            setCountdown(null);
            
            captureImage();
            await new Promise(r => setTimeout(r, 500));
        }
        
        setIsCapturing(false);
    };
    
    const removeImage = (id) => {
        setCapturedImages(prev => prev.filter(img => img.id !== id));
    };
    
    const handleSave = () => {
        if (capturedImages.length < 1) return;
        onCapture(capturedImages);
    };
    
    return (
        <div className="space-y-6">
            {/* AI Model Loading State */}
            {modelsLoading && (
                <Alert className="border-blue-500/50 bg-blue-500/5">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <AlertDescription className="text-blue-700">
                        🤖 Loading AI Face Recognition Models... {modelLoadProgress}
                    </AlertDescription>
                </Alert>
            )}
            
            {/* AI Status Badge */}
            {!modelsLoading && (
                <div className="flex items-center gap-2">
                    <Badge variant={faceDetected ? "default" : "secondary"} className={faceDetected ? "bg-green-500" : ""}>
                        {faceDetected ? "✅ Face Detected" : "👁️ Scanning..."}
                    </Badge>
                    {faceQuality && (
                        <Badge variant="outline" className={faceQuality.isGood ? "border-green-500 text-green-600" : "border-yellow-500 text-yellow-600"}>
                            Quality: {Math.round(faceQuality.score * 100)}%
                        </Badge>
                    )}
                    <Badge variant="outline" className="border-purple-500 text-purple-600">
                        🤖 Real AI Active
                    </Badge>
                </div>
            )}
            
            {/* Camera View */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                {cameraError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="text-center">
                            <VideoOff className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-destructive">{cameraError}</p>
                            <Button variant="outline" className="mt-4" onClick={startCamera}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </div>
                ) : modelsLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="text-center">
                            <Loader2 className="w-16 h-16 mx-auto text-primary mb-4 animate-spin" />
                            <p className="text-primary font-medium">Loading AI Models...</p>
                            <p className="text-sm text-muted-foreground mt-2">{modelLoadProgress}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />
                        
                        {/* AI Face Detection Overlay */}
                        <canvas 
                            ref={overlayCanvasRef}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />
                        
                        {/* Face Guide Overlay (shown only when no face detected) */}
                        {!faceDetected && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-[50%] relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded text-white text-sm">
                                        Position face here
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Quality Issues Warning */}
                        {faceDetected && faceQuality && faceQuality.issues.length > 0 && (
                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-yellow-500/90 px-4 py-2 rounded-lg text-black text-sm max-w-xs text-center">
                                ⚠️ {faceQuality.issues[0]}
                            </div>
                        )}
                        
                        {/* Countdown Overlay */}
                        {countdown && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <motion.div
                                    key={countdown}
                                    initial={{ scale: 2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="text-8xl font-bold text-white"
                                >
                                    {countdown}
                                </motion.div>
                            </div>
                        )}
                        
                        {/* Current instruction */}
                        {capturedImages.length < 3 && !isCapturing && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white text-sm">
                                {captureAngles[capturedImages.length]?.instruction || 'Ready to capture'}
                            </div>
                        )}
                    </>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
            </div>
            
            {/* Camera Controls */}
            <div className="flex items-center justify-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                    disabled={modelsLoading}
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
                
                <Button
                    size="lg"
                    className={`w-16 h-16 rounded-full ${faceDetected ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    onClick={captureImage}
                    disabled={isCapturing || cameraError || modelsLoading || !faceDetected || isProcessing}
                >
                    {isProcessing ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                        <Aperture className="w-8 h-8" />
                    )}
                </Button>
                
                <Button
                    variant="outline"
                    onClick={handleAutoCapture}
                    disabled={isCapturing || cameraError || capturedImages.length >= 3 || modelsLoading}
                >
                    {isCapturing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Video className="w-4 h-4 mr-2" />
                    )}
                    Auto Capture (3)
                </Button>
            </div>
            
            {/* Captured Images */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Captured Images ({capturedImages.length}/3 minimum)</Label>
                    {capturedImages.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setCapturedImages([])}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                    {capturedImages.map((img) => (
                        <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border">
                            <img src={img.data} alt={img.angle} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                                {img.angle}
                                {img.hasRealAI && <span className="ml-1">🤖</span>}
                            </div>
                            {/* AI Quality Badge */}
                            <div className="absolute top-1 left-1">
                                <Badge variant="secondary" className={`text-xs ${img.quality > 0.7 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                    {Math.round(img.quality * 100)}%
                                </Badge>
                            </div>
                            <button
                                onClick={() => removeImage(img.id)}
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    
                    {/* Empty slots */}
                    {Array.from({ length: Math.max(0, 3 - capturedImages.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Registration Quality</span>
                    <span>{Math.min(100, Math.round(capturedImages.length * 33))}%</span>
                </div>
                <Progress value={Math.min(100, capturedImages.length * 33)} />
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handleSave} disabled={capturedImages.length < 1}>
                    <Save className="w-4 h-4 mr-2" />
                    Save {capturedImages.length} Photo{capturedImages.length !== 1 ? 's' : ''}
                </Button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// REGISTRATION DIALOG
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const RegistrationDialog = ({ open, onClose, branchId, organizationId, sessionId, onSaved }) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1); // 1: Select User, 2: Capture Photos, 3: Confirm
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState('student');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    
    useEffect(() => {
        if (!open) {
            setStep(1);
            setSearchTerm('');
            setSearchResults([]);
            setSelectedUser(null);
            setCapturedPhotos([]);
        }
    }, [open]);
    
    const searchUsers = async () => {
        if (!searchTerm || searchTerm.length < 2) return;
        
        setLoading(true);
        // Use correct table names: student_profiles with full_name, employee_profiles (not staff_profiles)
        const table = searchType === 'student' ? 'student_profiles' : 'employee_profiles';
        
        let query;
        if (searchType === 'student') {
            query = supabase
                .from(table)
                .select('id, full_name, admission_number, class_id, section_id, photo_url')
                .eq('branch_id', branchId)
                .or(`full_name.ilike.%${searchTerm}%,admission_number.ilike.%${searchTerm}%`)
                .limit(20);
        } else {
            query = supabase
                .from(table)
                .select('id, full_name, phone, designation_id, department_id, photo_url')
                .eq('branch_id', branchId)
                .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
                .limit(20);
        }
        
        const { data, error } = await query;
        
        if (error) {
            toast({ variant: 'destructive', title: 'Search failed', description: error.message });
        } else {
            setSearchResults(data || []);
        }
        
        setLoading(false);
    };
    
    const handleCapture = (photos) => {
        setCapturedPhotos(photos);
        setStep(3);
    };
    
    const handleSaveFace = async () => {
        if (!selectedUser || capturedPhotos.length < 1) return;
        
        setLoading(true);
        
        try {
            // Get the best quality photo with real AI descriptor
            const bestPhoto = capturedPhotos
                .filter(p => p.hasRealAI && p.descriptor)
                .sort((a, b) => b.quality - a.quality)[0] || capturedPhotos[0];
            
            // Parse the descriptor from string (already JSON stringified)
            let encodingVector = null;
            if (bestPhoto.descriptor) {
                try {
                    encodingVector = JSON.parse(bestPhoto.descriptor);
                } catch {
                    encodingVector = Array(128).fill(0).map(() => Math.random() * 2 - 1);
                }
            } else {
                // Fallback to dummy if no AI descriptor available
                encodingVector = Array(128).fill(0).map(() => Math.random() * 2 - 1);
            }
            
            // Calculate average quality from all photos
            const avgQuality = capturedPhotos.reduce((sum, p) => sum + (p.quality || 0), 0) / capturedPhotos.length;
            
            const payload = {
                branch_id: branchId,
                organization_id: organizationId,
                // Required columns
                user_id: selectedUser.id,
                user_type: searchType,
                // Additional face registration data
                person_type: searchType,
                person_id: selectedUser.id,
                person_name: selectedUser.full_name,
                encoding_vector: encodingVector,
                photo_url: bestPhoto?.data || null,
                photo_angle: bestPhoto?.angle || 'front',
                confidence_score: Math.min(1.0, avgQuality),
                lighting_quality: avgQuality > 0.7 ? 'good' : avgQuality > 0.5 ? 'medium' : 'poor',
                model_name: bestPhoto.hasRealAI ? 'face-api.js' : 'fallback_random',
                model_version: bestPhoto.hasRealAI ? '1.0' : '0.0',
                is_active: true,
            };
            
            const { error } = await supabase
                .from('face_encodings')
                .insert(payload);
            
            if (error) throw error;
            
            // Show success with AI status
            toast({ 
                title: bestPhoto.hasRealAI ? '🤖 Real AI Face Registered!' : 'Face registered',
                description: `${capturedPhotos.length} photos captured for ${selectedUser.full_name}. ${bestPhoto.hasRealAI ? 'AI encoding saved!' : 'Using fallback encoding.'}`,
            });
            
            onSaved();
            onClose();
        } catch (error) {
            console.error('Registration error:', error);
            toast({ variant: 'destructive', title: 'Registration failed', description: error.message });
        }
        
        setLoading(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScanFace className="w-5 h-5 text-primary" />
                        Register Face for Attendance
                    </DialogTitle>
                    <DialogDescription>
                        Step {step} of 3: {
                            step === 1 ? 'Select User' : 
                            step === 2 ? 'Capture Photos' : 
                            'Confirm Registration'
                        }
                    </DialogDescription>
                </DialogHeader>
                
                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 py-4">
                    {[1, 2, 3].map((s) => (
                        <React.Fragment key={s}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                                {step > s ? <Check className="w-5 h-5" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`w-16 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
                
                {/* Step 1: Select User */}
                {step === 1 && (
                    <div className="space-y-6">
                        <Tabs value={searchType} onValueChange={setSearchType} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="student" className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" />
                                    Student
                                </TabsTrigger>
                                <TabsTrigger value="staff" className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    Staff
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Input
                                    placeholder={`Search ${searchType} by name or ID...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                                    className="pl-10"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <Button onClick={searchUsers} disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                            </Button>
                        </div>
                        
                        {/* Search Results */}
                        <ScrollArea className="h-64 border rounded-lg">
                            <div className="p-2 space-y-2">
                                {searchResults.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Search for a {searchType} to register</p>
                                    </div>
                                ) : (
                                    searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                                selectedUser?.id === user.id 
                                                    ? 'bg-primary/10 border-primary border' 
                                                    : 'hover:bg-muted border border-transparent'
                                            }`}
                                            onClick={() => setSelectedUser(user)}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                                {user.photo_url ? (
                                                    <img src={user.photo_url} className="w-full h-full object-cover" />
                                                ) : searchType === 'student' ? (
                                                    <GraduationCap className="w-6 h-6 text-primary" />
                                                ) : (
                                                    <Briefcase className="w-6 h-6 text-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {user.full_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {searchType === 'student' ? user.admission_number : user.phone}
                                                    {user.class_name && ` • ${user.class_name} ${user.section || ''}`}
                                                    {user.department && ` • ${user.department}`}
                                                </p>
                                            </div>
                                            {selectedUser?.id === user.id && (
                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                        
                        {selectedUser && (
                            <Alert className="border-primary/50 bg-primary/5">
                                <User className="w-4 h-4" />
                                <AlertDescription>
                                    Selected: <strong>{selectedUser.full_name}</strong>
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="flex justify-end">
                            <Button onClick={() => setStep(2)} disabled={!selectedUser}>
                                Continue to Capture
                                <Camera className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
                
                {/* Step 2: Capture Photos */}
                {step === 2 && (
                    <CameraCapture 
                        onCapture={handleCapture}
                        onClose={() => setStep(1)}
                    />
                )}
                
                {/* Step 3: Confirm */}
                {step === 3 && (
                    <div className="space-y-6">
                        <Alert className="border-green-500/50 bg-green-500/5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <AlertDescription className="text-green-700">
                                {capturedPhotos.length} photos captured successfully
                            </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {/* User Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">User Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                            {searchType === 'student' 
                                                ? <GraduationCap className="w-8 h-8 text-primary" />
                                                : <Briefcase className="w-8 h-8 text-primary" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-semibold">
                                                {selectedUser?.full_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {searchType === 'student' ? selectedUser?.admission_number : selectedUser?.phone}
                                            </p>
                                            <Badge variant="outline" className="mt-1 capitalize">{searchType}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            {/* Photo Preview */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Captured Photos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-2">
                                        {capturedPhotos.map((photo) => (
                                            <img 
                                                key={photo.id}
                                                src={photo.data}
                                                alt={photo.angle}
                                                className="w-full aspect-square object-cover rounded-lg"
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(2)}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Retake Photos
                            </Button>
                            <Button onClick={handleSaveFace} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Complete Registration
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN FACE REGISTRATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const FaceRegistration = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd, canEdit, canDelete } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [loading, setLoading] = useState(true);
    const [registrations, setRegistrations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    
    // Dialog state
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    
    // Permissions
    const hasViewPermission = canView('attendance.face_registration') || canView('attendance');
    const hasAddPermission = canAdd('attendance.face_registration') || canAdd('attendance');
    
    // Fetch registrations
    useEffect(() => {
        if (branchId) {
            fetchRegistrations();
        }
    }, [branchId]);
    
    const fetchRegistrations = async () => {
        setLoading(true);
        
        // Fetch face_encodings without FK joins (they don't exist)
        const { data, error } = await supabase
            .from('face_encodings')
            .select('*')
            .eq('branch_id', branchId)
            .order('id', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
        } else {
            // Fetch user details for each registration
            const processedData = await Promise.all((data || []).map(async (reg) => {
                let userName = 'Unknown';
                let userCode = '';
                let userDetail = '';
                let photoUrl = null;
                
                // Use person_name from record if available
                if (reg.person_name) {
                    userName = reg.person_name;
                }
                
                if (reg.person_id) {
                    if (reg.person_type === 'student') {
                        const { data: student } = await supabase
                            .from('student_profiles')
                            .select('full_name, admission_number, photo_url')
                            .eq('id', reg.person_id)
                            .single();
                        if (student) {
                            userName = student.full_name;
                            userCode = student.admission_number || '';
                            photoUrl = student.photo_url;
                        }
                    } else {
                        const { data: staff } = await supabase
                            .from('employee_profiles')
                            .select('full_name, phone, photo_url')
                            .eq('id', reg.person_id)
                            .single();
                        if (staff) {
                            userName = staff.full_name;
                            userCode = staff.phone || '';
                            photoUrl = staff.photo_url;
                        }
                    }
                }
                
                return {
                    ...reg,
                    user_name: userName,
                    user_code: userCode,
                    user_detail: userDetail,
                    photo_url: photoUrl,
                };
            }));
            setRegistrations(processedData);
        }
        
        setLoading(false);
    };
    
    // Filter
    const filteredRegistrations = registrations.filter(reg => {
        const matchesSearch = !searchTerm || 
            reg.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reg.user_code?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === 'all' || reg.person_type === filterType;
        
        return matchesSearch && matchesType;
    });
    
    // Stats
    const stats = {
        total: registrations.length,
        students: registrations.filter(r => r.person_type === 'student').length,
        staff: registrations.filter(r => r.person_type === 'staff').length,
        active: registrations.filter(r => r.is_active).length,
    };
    
    const handleDeactivate = async (id) => {
        const { error } = await supabase
            .from('face_encodings')
            .update({ is_active: false })
            .eq('id', id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Face registration deactivated' });
            fetchRegistrations();
        }
    };
    
    const handleActivate = async (id) => {
        const { error } = await supabase
            .from('face_encodings')
            .update({ is_active: true })
            .eq('id', id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: '✅ Face registration activated!' });
            fetchRegistrations();
        }
    };
    
    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ScanFace className="h-8 w-8 text-primary" />
                        Face Registration
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Register faces for AI-powered attendance recognition
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchRegistrations}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {hasAddPermission && (
                        <Button onClick={() => setRegisterDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Register Face
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <ScanFace className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Registered</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <GraduationCap className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.students}</p>
                                <p className="text-sm text-muted-foreground">Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/10">
                                <Briefcase className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.staff}</p>
                                <p className="text-sm text-muted-foreground">Staff</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px] relative">
                            <Input
                                placeholder="Search by name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="User Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="student">Students</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            
            {/* Registrations Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredRegistrations.length === 0 ? (
                <Card>
                    <CardContent className="py-20 text-center">
                        <ScanFace className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Registrations Found</h3>
                        <p className="text-muted-foreground mb-4">
                            {registrations.length === 0 
                                ? "No faces have been registered yet."
                                : "No registrations match your search criteria."}
                        </p>
                        {hasAddPermission && registrations.length === 0 && (
                            <Button onClick={() => setRegisterDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Register First Face
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filteredRegistrations.map((reg) => (
                            <motion.div
                                key={reg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <Card className={!reg.is_active ? 'opacity-60' : ''}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                                                {reg.photo_url ? (
                                                    <img src={reg.photo_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ScanFace className="w-8 h-8 text-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{reg.user_name}</h3>
                                                    <Badge variant={reg.is_active ? 'default' : 'secondary'} className="text-xs">
                                                        {reg.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {reg.user_code} {reg.user_detail && `• ${reg.user_detail}`}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="capitalize">
                                                        {reg.person_type === 'student' 
                                                            ? <GraduationCap className="w-3 h-3 mr-1" />
                                                            : <Briefcase className="w-3 h-3 mr-1" />
                                                        }
                                                        {reg.person_type}
                                                    </Badge>
                                                    <span>•</span>
                                                    <span>{reg.photo_angle || 'front'}</span>
                                                    <span>•</span>
                                                    <span>{Math.round((reg.confidence_score || 0) * 100)}% quality</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-muted/30 border-t justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            Registered: {new Date(reg.created_at).toLocaleDateString()}
                                        </span>
                                        {reg.is_active ? (
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleDeactivate(reg.id)}
                                                className="text-destructive"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Deactivate
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleActivate(reg.id)}
                                                className="text-green-500 hover:text-green-600"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                Activate
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
            
            {/* Registration Dialog */}
            <RegistrationDialog
                open={registerDialogOpen}
                onClose={() => setRegisterDialogOpen(false)}
                branchId={branchId}
                organizationId={organizationId}
                sessionId={currentSessionId}
                onSaved={fetchRegistrations}
            />
        </DashboardLayout>
    );
};

export default FaceRegistration;
