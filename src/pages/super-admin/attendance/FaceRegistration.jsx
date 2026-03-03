// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - FACE REGISTRATION (ENHANCED VERSION)
// Big School Perspective: Class/Section wise student list, Staff management, Registration tracking
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';

// Real AI Face Recognition
import {
    loadFaceModels,
    areModelsLoaded,
    detectSingleFace,
    getFaceDescriptor,
    descriptorToString,
    analyzeFaceQuality
} from '@/utils/faceRecognition';

import {
    ScanFace, Camera, Plus, Search, RefreshCw, Trash2, Edit, Eye, CheckCircle2, XCircle,
    AlertTriangle, Loader2, Users, User, GraduationCap, Briefcase, Shield, Calendar, Clock,
    Download, Upload, Save, X, Circle, Aperture, Maximize2, RotateCcw, ZoomIn, Video, VideoOff,
    Image, Check, Filter, ChevronDown, FileSpreadsheet, BarChart3, Building, School,
    UserCheck, UserX, Percent, TrendingUp, AlertCircle, CheckCheck, ListFilter
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CAMERA CAPTURE COMPONENT WITH REAL AI FACE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CameraCapture = ({ onCapture, onClose, personName }) => {
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
                        ctx.strokeStyle = quality.isGood ? '#00ff00' : quality.score > 0.5 ? '#ffff00' : '#ff0000';
                        ctx.lineWidth = 3;
                        
                        if (facingMode === 'user') {
                            ctx.strokeRect(canvas.width - box.x - box.width, box.y, box.width, box.height);
                        } else {
                            ctx.strokeRect(box.x, box.y, box.width, box.height);
                        }
                        
                        ctx.fillStyle = quality.isGood ? '#00ff00' : '#ffff00';
                        ctx.font = '16px Arial';
                        const labelX = facingMode === 'user' ? canvas.width - box.x - box.width : box.x;
                        ctx.fillText(`Quality: ${Math.round(quality.score * 100)}%`, labelX, box.y - 10);
                    }
                } else {
                    setFaceDetected(false);
                    setFaceQuality(null);
                    setCurrentDescriptor(null);
                    
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
                    setTimeout(detectFace, 100);
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
                video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            setCameraError(null);
        } catch (error) {
            console.error('Camera error:', error);
            setCameraError('Unable to access camera. Please check permissions.');
        }
    };
    
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
        }
    }, [stream]);
    
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
    
    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current || !faceDetected) return;
        
        setIsProcessing(true);
        
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        
        const descriptor = currentDescriptor ? descriptorToString(currentDescriptor) : null;
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        setCapturedImages(prev => [...prev, {
            id: Date.now(),
            data: imageData,
            angle: ['Front View', 'Left Turn', 'Right Turn'][capturedImages.length] || 'Extra',
            descriptor: descriptor,
            quality: faceQuality?.score || 0,
            hasRealAI: !!descriptor
        }]);
        
        setIsProcessing(false);
    };
    
    const handleAutoCapture = async () => {
        setIsCapturing(true);
        
        for (let i = 0; i < 3; i++) {
            let waitAttempts = 0;
            while (!faceDetected && waitAttempts < 30) {
                await new Promise(r => setTimeout(r, 200));
                waitAttempts++;
            }
            
            if (!faceDetected) continue;
            
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
        <div className="space-y-4">
            {/* Person Name Banner */}
            {personName && (
                <Alert className="border-primary/50 bg-primary/5">
                    <User className="w-4 h-4" />
                    <AlertDescription>
                        Registering face for: <strong>{personName}</strong>
                    </AlertDescription>
                </Alert>
            )}
            
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
                <div className="flex items-center gap-2 flex-wrap">
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
                                <RefreshCw className="w-4 h-4 mr-2" /> Retry
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
                            autoPlay playsInline muted
                            className="w-full h-full object-cover"
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />
                        <canvas 
                            ref={overlayCanvasRef}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />
                        
                        {!faceDetected && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-[50%] relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded text-white text-sm">
                                        Position face here
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {countdown && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="text-8xl font-bold text-white animate-pulse">{countdown}</div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Captured Images */}
            {capturedImages.length > 0 && (
                <div className="space-y-2">
                    <Label>Captured Photos ({capturedImages.length}/3)</Label>
                    <div className="flex gap-2">
                        {capturedImages.map((img) => (
                            <div key={img.id} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-primary/20">
                                <img src={img.data} alt={img.angle} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs p-1 text-center">
                                    {Math.round(img.quality * 100)}%
                                </div>
                                <button
                                    onClick={() => removeImage(img.id)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Controls */}
            <div className="flex gap-2 justify-between">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <div className="flex gap-2">
                    {capturedImages.length < 3 && (
                        <>
                            <Button
                                onClick={captureImage}
                                disabled={!faceDetected || isProcessing || isCapturing}
                                variant="outline"
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Capture ({capturedImages.length}/3)
                            </Button>
                            <Button
                                onClick={handleAutoCapture}
                                disabled={isCapturing || modelsLoading}
                            >
                                {isCapturing ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Capturing...</>
                                ) : (
                                    <><Aperture className="w-4 h-4 mr-2" /> Auto Capture</>
                                )}
                            </Button>
                        </>
                    )}
                    {capturedImages.length > 0 && (
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Save Face Data
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// REGISTRATION DIALOG - Direct capture for selected person
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const QuickRegisterDialog = ({ open, onClose, person, personType, branchId, organizationId, onSaved }) => {
    const { toast } = useToast();
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCamera, setShowCamera] = useState(true);
    
    useEffect(() => {
        if (!open) {
            setCapturedPhotos([]);
            setShowCamera(true);
        }
    }, [open]);
    
    const handleCapture = (photos) => {
        setCapturedPhotos(photos);
        setShowCamera(false);
    };
    
    const handleSaveFace = async () => {
        if (!person || capturedPhotos.length < 1) return;
        
        setLoading(true);
        
        try {
            const bestPhoto = capturedPhotos
                .filter(p => p.hasRealAI && p.descriptor)
                .sort((a, b) => b.quality - a.quality)[0] || capturedPhotos[0];
            
            let encodingVector = null;
            if (bestPhoto.descriptor) {
                try {
                    encodingVector = JSON.parse(bestPhoto.descriptor);
                } catch {
                    encodingVector = Array(128).fill(0).map(() => Math.random() * 2 - 1);
                }
            } else {
                encodingVector = Array(128).fill(0).map(() => Math.random() * 2 - 1);
            }
            
            const avgQuality = capturedPhotos.reduce((sum, p) => sum + (p.quality || 0), 0) / capturedPhotos.length;
            
            const payload = {
                branch_id: branchId,
                organization_id: organizationId,
                user_id: person.id,
                user_type: personType,
                person_type: personType,
                person_id: person.id,
                person_name: person.full_name,
                encoding_vector: encodingVector,
                photo_url: bestPhoto?.data || null,
                photo_angle: bestPhoto?.angle || 'front',
                confidence_score: Math.min(1.0, avgQuality),
                lighting_quality: avgQuality > 0.7 ? 'good' : avgQuality > 0.5 ? 'medium' : 'poor',
                model_name: bestPhoto.hasRealAI ? 'face-api.js' : 'fallback_random',
                model_version: bestPhoto.hasRealAI ? '1.0' : '0.0',
                is_active: true,
            };
            
            const { error } = await supabase.from('face_encodings').insert(payload);
            
            if (error) throw error;
            
            toast({ 
                title: bestPhoto.hasRealAI ? '🤖 Real AI Face Registered!' : 'Face registered',
                description: `${capturedPhotos.length} photos captured for ${person.full_name}`,
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
                        Register Face - {person?.full_name}
                    </DialogTitle>
                    <DialogDescription>
                        {personType === 'student' ? 'Student' : 'Staff'} • {person?.admission_number || person?.phone || person?.department}
                    </DialogDescription>
                </DialogHeader>
                
                {showCamera ? (
                    <CameraCapture 
                        onCapture={handleCapture}
                        onClose={onClose}
                        personName={person?.full_name}
                    />
                ) : (
                    <div className="space-y-4">
                        <Alert className="border-green-500/50 bg-green-500/5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <AlertDescription className="text-green-700">
                                {capturedPhotos.length} photos captured successfully!
                            </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {capturedPhotos.map((photo) => (
                                <div key={photo.id} className="relative rounded-lg overflow-hidden">
                                    <img src={photo.data} alt={photo.angle} className="w-full aspect-square object-cover" />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs p-1 text-center">
                                        {photo.angle} • {Math.round(photo.quality * 100)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => { setCapturedPhotos([]); setShowCamera(true); }}>
                                <RotateCcw className="w-4 h-4 mr-2" /> Retake
                            </Button>
                            <Button onClick={handleSaveFace} disabled={loading} className="bg-green-600 hover:bg-green-700">
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
// EDIT FACE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const EditFaceDialog = ({ open, onClose, registration, branchId, organizationId, onSaved }) => {
    const { toast } = useToast();
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCamera, setShowCamera] = useState(true);
    
    useEffect(() => {
        if (!open) {
            setCapturedPhotos([]);
            setShowCamera(true);
        }
    }, [open]);
    
    const handleCapture = (photos) => {
        setCapturedPhotos(photos);
        setShowCamera(false);
    };
    
    const handleUpdateFace = async () => {
        if (!registration || capturedPhotos.length < 1) return;
        
        setLoading(true);
        
        try {
            const bestPhoto = capturedPhotos
                .filter(p => p.hasRealAI && p.descriptor)
                .sort((a, b) => b.quality - a.quality)[0] || capturedPhotos[0];
            
            let encodingVector = null;
            if (bestPhoto.descriptor) {
                try {
                    encodingVector = JSON.parse(bestPhoto.descriptor);
                } catch {
                    encodingVector = Array(128).fill(0).map(() => Math.random() * 2 - 1);
                }
            } else {
                encodingVector = Array(128).fill(0).map(() => Math.random() * 2 - 1);
            }
            
            const avgQuality = capturedPhotos.reduce((sum, p) => sum + (p.quality || 0), 0) / capturedPhotos.length;
            
            const { error } = await supabase
                .from('face_encodings')
                .update({
                    encoding_vector: encodingVector,
                    photo_url: bestPhoto?.data || registration.photo_url,
                    photo_angle: bestPhoto?.angle || 'front',
                    confidence_score: Math.min(1.0, avgQuality),
                    lighting_quality: avgQuality > 0.7 ? 'good' : avgQuality > 0.5 ? 'medium' : 'poor',
                    model_name: bestPhoto.hasRealAI ? 'face-api.js' : 'fallback_random',
                    model_version: bestPhoto.hasRealAI ? '1.0' : '0.0',
                    is_active: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', registration.id);
            
            if (error) throw error;
            
            toast({ 
                title: bestPhoto.hasRealAI ? '🤖 Face Updated with Real AI!' : '✅ Face Updated',
                description: `${capturedPhotos.length} new photos for ${registration.person_name}`,
            });
            
            onSaved();
            onClose();
        } catch (error) {
            console.error('Update error:', error);
            toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        }
        
        setLoading(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="w-5 h-5 text-blue-500" />
                        Edit Face - {registration?.person_name}
                    </DialogTitle>
                </DialogHeader>
                
                {showCamera ? (
                    <CameraCapture 
                        onCapture={handleCapture}
                        onClose={onClose}
                        personName={registration?.person_name}
                    />
                ) : (
                    <div className="space-y-4">
                        <Alert className="border-green-500/50 bg-green-500/5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <AlertDescription className="text-green-700">
                                {capturedPhotos.length} new photos captured!
                            </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {capturedPhotos.map((photo) => (
                                <div key={photo.id} className="relative rounded-lg overflow-hidden">
                                    <img src={photo.data} alt={photo.angle} className="w-full aspect-square object-cover" />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs p-1 text-center">
                                        {Math.round(photo.quality * 100)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => { setCapturedPhotos([]); setShowCamera(true); }}>
                                <RotateCcw className="w-4 h-4 mr-2" /> Retake
                            </Button>
                            <Button onClick={handleUpdateFace} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Update Face Data
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN FACE REGISTRATION COMPONENT - ENHANCED VERSION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const FaceRegistration = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd, canEdit, canDelete } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // Tab state
    const [activeTab, setActiveTab] = useState('students');
    
    // Class/Section state for students
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState('all');
    const [selectedSection, setSelectedSection] = useState('all');
    
    // Staff state
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    
    // Data state
    const [students, setStudents] = useState([]);
    const [staff, setStaff] = useState([]);
    const [faceRegistrations, setFaceRegistrations] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, registered, pending
    
    // Dialog state
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [editingRegistration, setEditingRegistration] = useState(null);
    
    // Permissions
    const hasViewPermission = canView('attendance.face_registration') || canView('attendance');
    const hasAddPermission = canAdd('attendance.face_registration') || canAdd('attendance');
    const hasEditPermission = canEdit('attendance.face_registration') || canEdit('attendance');
    const hasDeletePermission = canDelete('attendance.face_registration') || canDelete('attendance');
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    useEffect(() => {
        if (branchId) {
            fetchInitialData();
        }
    }, [branchId, currentSessionId]);
    
    useEffect(() => {
        if (branchId && selectedClass !== 'all') {
            fetchSections(selectedClass);
        } else {
            setSections([]);
            setSelectedSection('all');
        }
    }, [selectedClass, branchId]);
    
    useEffect(() => {
        if (branchId) {
            if (activeTab === 'students') {
                fetchStudents();
            } else {
                fetchStaff();
            }
        }
    }, [branchId, currentSessionId, selectedClass, selectedSection, selectedDepartment, activeTab]);
    
    const fetchInitialData = async () => {
        setLoading(true);
        
        // Fetch classes
        const { data: classData } = await supabase
            .from('classes')
            .select('id, name')
            .eq('branch_id', branchId)
            .order('name', { ascending: true });
        
        setClasses((classData || []).map(c => ({ ...c, class_name: c.name })));
        
        // Fetch departments for staff
        const { data: deptData } = await supabase
            .from('departments')
            .select('id, name')
            .eq('branch_id', branchId);
        
        setDepartments((deptData || []).map(d => ({ id: d.id, name: d.name })));
        
        // Fetch all face registrations for this branch
        await fetchFaceRegistrations();
        
        setLoading(false);
    };
    
    const fetchSections = async (classId) => {
        // Sections are linked via class_sections junction table
        const { data } = await supabase
            .from('class_sections')
            .select('section_id, sections(id, name)')
            .eq('class_id', classId);
        
        const sectionsList = (data || [])
            .filter(d => d.sections)
            .map(d => ({ id: d.sections.id, section_name: d.sections.name }));
        setSections(sectionsList);
    };
    
    const fetchFaceRegistrations = async () => {
        const { data } = await supabase
            .from('face_encodings')
            .select('*')
            .eq('branch_id', branchId);
        
        // Create a map by person_id for quick lookup
        const regMap = {};
        (data || []).forEach(reg => {
            regMap[reg.person_id] = reg;
        });
        setFaceRegistrations(regMap);
    };
    
    const fetchStudents = async () => {
        setLoading(true);
        
        let query = supabase
            .from('student_profiles')
            .select(`
                id, full_name, admission_number, photo_url, class_id, section_id
            `)
            .eq('branch_id', branchId)
            .eq('is_disabled', false)
            .order('full_name');
        
        // Filter by class
        if (selectedClass !== 'all') {
            query = query.eq('class_id', selectedClass);
            if (selectedSection !== 'all') {
                query = query.eq('section_id', selectedSection);
            }
        }
        
        const { data, error } = await query;
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            // Get class and section names separately
            const classIds = [...new Set((data || []).map(s => s.class_id).filter(Boolean))];
            const sectionIds = [...new Set((data || []).map(s => s.section_id).filter(Boolean))];
            
            let classMap = {};
            let sectionMap = {};
            
            if (classIds.length > 0) {
                const { data: classData } = await supabase
                    .from('classes')
                    .select('id, name')
                    .in('id', classIds);
                (classData || []).forEach(c => { classMap[c.id] = c.name; });
            }
            
            if (sectionIds.length > 0) {
                const { data: sectionData } = await supabase
                    .from('sections')
                    .select('id, name')
                    .in('id', sectionIds);
                (sectionData || []).forEach(s => { sectionMap[s.id] = s.name; });
            }
            
            const enrichedData = (data || []).map(student => ({
                ...student,
                classes: { class_name: classMap[student.class_id] || '' },
                sections: { section_name: sectionMap[student.section_id] || '' },
            }));
            setStudents(enrichedData);
        }
        
        setLoading(false);
    };
    
    const fetchStaff = async () => {
        setLoading(true);
        
        let query = supabase
            .from('employee_profiles')
            .select('id, full_name, phone, department_id, designation_id, photo_url')
            .eq('branch_id', branchId)
            .eq('is_disabled', false);
        
        if (selectedDepartment !== 'all') {
            query = query.eq('department_id', selectedDepartment);
        }
        
        const { data, error } = await query;
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            // Get department names
            const deptIds = [...new Set((data || []).map(s => s.department_id).filter(Boolean))];
            let deptMap = {};
            
            if (deptIds.length > 0) {
                const { data: deptData } = await supabase
                    .from('departments')
                    .select('id, name')
                    .in('id', deptIds);
                (deptData || []).forEach(d => { deptMap[d.id] = d.name; });
            }
            
            const enrichedData = (data || []).map(emp => ({
                ...emp,
                department: deptMap[emp.department_id] || '',
            }));
            setStaff(enrichedData);
        }
        
        setLoading(false);
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = !searchTerm || 
                s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const isRegistered = !!faceRegistrations[s.id];
            const matchesStatus = filterStatus === 'all' || 
                (filterStatus === 'registered' && isRegistered) ||
                (filterStatus === 'pending' && !isRegistered);
            
            return matchesSearch && matchesStatus;
        });
    }, [students, searchTerm, filterStatus, faceRegistrations]);
    
    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchesSearch = !searchTerm || 
                s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.phone?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const isRegistered = !!faceRegistrations[s.id];
            const matchesStatus = filterStatus === 'all' || 
                (filterStatus === 'registered' && isRegistered) ||
                (filterStatus === 'pending' && !isRegistered);
            
            return matchesSearch && matchesStatus;
        });
    }, [staff, searchTerm, filterStatus, faceRegistrations]);
    
    const stats = useMemo(() => {
        const totalStudents = students.length;
        const registeredStudents = students.filter(s => faceRegistrations[s.id]).length;
        const totalStaff = staff.length;
        const registeredStaff = staff.filter(s => faceRegistrations[s.id]).length;
        
        return {
            totalStudents,
            registeredStudents,
            pendingStudents: totalStudents - registeredStudents,
            studentPercent: totalStudents > 0 ? Math.round((registeredStudents / totalStudents) * 100) : 0,
            totalStaff,
            registeredStaff,
            pendingStaff: totalStaff - registeredStaff,
            staffPercent: totalStaff > 0 ? Math.round((registeredStaff / totalStaff) * 100) : 0,
        };
    }, [students, staff, faceRegistrations]);
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const handleRegisterClick = (person, type) => {
        setSelectedPerson({ ...person, personType: type });
        setRegisterDialogOpen(true);
    };
    
    const handleEditClick = (person, type) => {
        const registration = faceRegistrations[person.id];
        if (registration) {
            setEditingRegistration(registration);
            setEditDialogOpen(true);
        }
    };
    
    const handleDeleteFace = async (personId) => {
        const registration = faceRegistrations[personId];
        if (!registration) return;
        
        const confirmed = window.confirm('Are you sure you want to delete this face registration?');
        if (!confirmed) return;
        
        const { error } = await supabase
            .from('face_encodings')
            .delete()
            .eq('id', registration.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
        } else {
            toast({ title: '✅ Face registration deleted' });
            fetchFaceRegistrations();
        }
    };
    
    const handleRefresh = async () => {
        await fetchFaceRegistrations();
        if (activeTab === 'students') {
            await fetchStudents();
        } else {
            await fetchStaff();
        }
    };
    
    const getQualityColor = (score) => {
        if (score >= 0.7) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
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
                    <Button variant="outline" onClick={handleRefresh}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>
            
            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <GraduationCap className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                                <p className="text-xs text-muted-foreground">Total Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <UserCheck className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">{stats.registeredStudents}</p>
                                <p className="text-xs text-muted-foreground">Registered</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50/50 dark:bg-orange-950/20">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <UserX className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-orange-600">{stats.pendingStudents}</p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Briefcase className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalStaff}</p>
                                <p className="text-xs text-muted-foreground">Total Staff</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <UserCheck className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">{stats.registeredStaff}</p>
                                <p className="text-xs text-muted-foreground">Staff Reg.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <TrendingUp className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.studentPercent}%</p>
                                <p className="text-xs text-muted-foreground">Students Done</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Progress Bars */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" /> Student Registration Progress
                            </span>
                            <span className="text-sm text-muted-foreground">{stats.registeredStudents}/{stats.totalStudents}</span>
                        </div>
                        <Progress value={stats.studentPercent} className="h-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Staff Registration Progress
                            </span>
                            <span className="text-sm text-muted-foreground">{stats.registeredStaff}/{stats.totalStaff}</span>
                        </div>
                        <Progress value={stats.staffPercent} className="h-2" />
                    </CardContent>
                </Card>
            </div>
            
            {/* Main Content */}
            <Card>
                <CardHeader className="pb-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="students" className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" /> Students
                                <Badge variant="secondary" className="ml-1">{students.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="staff" className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Staff
                                <Badge variant="secondary" className="ml-1">{staff.length}</Badge>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-muted/30 rounded-lg">
                        {activeTab === 'students' ? (
                            <>
                                <div className="flex-1 min-w-[150px] max-w-[200px]">
                                    <Label className="text-xs mb-1 block">Class</Label>
                                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Classes</SelectItem>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 min-w-[150px] max-w-[200px]">
                                    <Label className="text-xs mb-1 block">Section</Label>
                                    <Select 
                                        value={selectedSection} 
                                        onValueChange={setSelectedSection}
                                        disabled={selectedClass === 'all'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sections</SelectItem>
                                            {sections.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.section_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 min-w-[150px] max-w-[200px]">
                                <Label className="text-xs mb-1 block">Department</Label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                            <Label className="text-xs mb-1 block">Status</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="registered">✅ Registered</SelectItem>
                                    <SelectItem value="pending">⏳ Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex-1 min-w-[200px]">
                            <Label className="text-xs mb-1 block">Search</Label>
                            <div className="relative">
                                <Input
                                    placeholder={`Search ${activeTab}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Data Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Photo</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>{activeTab === 'students' ? 'Adm No' : 'Phone'}</TableHead>
                                        {activeTab === 'students' && <TableHead>Class</TableHead>}
                                        {activeTab === 'staff' && <TableHead>Dept</TableHead>}
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Quality</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(activeTab === 'students' ? filteredStudents : filteredStaff).map((person, index) => {
                                        const registration = faceRegistrations[person.id];
                                        const isRegistered = !!registration;
                                        const quality = registration?.confidence_score || 0;
                                        
                                        return (
                                            <TableRow key={person.id} className={!isRegistered ? 'bg-orange-50/30 dark:bg-orange-950/10' : ''}>
                                                <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border">
                                                        {registration?.photo_url ? (
                                                            <img src={registration.photo_url} className="w-full h-full object-cover" alt="" />
                                                        ) : person.photo_url ? (
                                                            <img src={person.photo_url} className="w-full h-full object-cover" alt="" />
                                                        ) : activeTab === 'students' ? (
                                                            <GraduationCap className="w-5 h-5 text-primary/50" />
                                                        ) : (
                                                            <Briefcase className="w-5 h-5 text-primary/50" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{person.full_name}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {activeTab === 'students' ? person.admission_number : person.phone}
                                                </TableCell>
                                                {activeTab === 'students' && (
                                                    <TableCell>
                                                        <span className="text-sm">
                                                            {person.classes?.class_name || '-'} {person.sections?.section_name || ''}
                                                        </span>
                                                    </TableCell>
                                                )}
                                                {activeTab === 'staff' && (
                                                    <TableCell>
                                                        <span className="text-sm">{person.department || '-'}</span>
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-center">
                                                    {isRegistered ? (
                                                        <Badge className="bg-green-500">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Registered
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                                                            <AlertCircle className="w-3 h-3 mr-1" /> Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {isRegistered ? (
                                                        <Badge variant="outline" className={getQualityColor(quality)}>
                                                            {Math.round(quality * 100)}%
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {!isRegistered && hasAddPermission && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleRegisterClick(person, activeTab === 'students' ? 'student' : 'staff')}
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                <Camera className="w-3 h-3 mr-1" /> Register
                                                            </Button>
                                                        )}
                                                        {isRegistered && hasEditPermission && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleEditClick(person, activeTab === 'students' ? 'student' : 'staff')}
                                                            >
                                                                <Edit className="w-3 h-3 mr-1" /> Edit
                                                            </Button>
                                                        )}
                                                        {isRegistered && hasDeletePermission && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleDeleteFace(person.id)}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {(activeTab === 'students' ? filteredStudents : filteredStaff).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-10">
                                                <div className="text-muted-foreground">
                                                    {activeTab === 'students' ? (
                                                        <>
                                                            <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                                            <p>No students found. Select a class to view students.</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                                            <p>No staff found. Try changing the filter.</p>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    
                    {/* Summary Footer */}
                    {(activeTab === 'students' ? filteredStudents : filteredStaff).length > 0 && (
                        <div className="flex items-center justify-between mt-4 px-2 text-sm text-muted-foreground">
                            <span>
                                Showing {(activeTab === 'students' ? filteredStudents : filteredStaff).length} {activeTab}
                            </span>
                            <span>
                                {activeTab === 'students' 
                                    ? `${filteredStudents.filter(s => faceRegistrations[s.id]).length} registered, ${filteredStudents.filter(s => !faceRegistrations[s.id]).length} pending`
                                    : `${filteredStaff.filter(s => faceRegistrations[s.id]).length} registered, ${filteredStaff.filter(s => !faceRegistrations[s.id]).length} pending`
                                }
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {/* Quick Register Dialog */}
            {selectedPerson && (
                <QuickRegisterDialog
                    open={registerDialogOpen}
                    onClose={() => { setRegisterDialogOpen(false); setSelectedPerson(null); }}
                    person={selectedPerson}
                    personType={selectedPerson.personType}
                    branchId={branchId}
                    organizationId={organizationId}
                    onSaved={() => {
                        fetchFaceRegistrations();
                        setRegisterDialogOpen(false);
                        setSelectedPerson(null);
                    }}
                />
            )}
            
            {/* Edit Face Dialog */}
            {editingRegistration && (
                <EditFaceDialog
                    open={editDialogOpen}
                    onClose={() => { setEditDialogOpen(false); setEditingRegistration(null); }}
                    registration={editingRegistration}
                    branchId={branchId}
                    organizationId={organizationId}
                    onSaved={() => {
                        fetchFaceRegistrations();
                        setEditDialogOpen(false);
                        setEditingRegistration(null);
                    }}
                />
            )}
        </DashboardLayout>
    );
};

export default FaceRegistration;
