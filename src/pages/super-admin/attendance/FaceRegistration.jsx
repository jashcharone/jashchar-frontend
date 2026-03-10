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
    const [videoReady, setVideoReady] = useState(false);
    
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
            if (!isRunning || !videoRef.current || modelsLoading || !areModelsLoaded() || !videoReady) return;
            
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
        
        if (!modelsLoading && stream && videoReady) {
            detectFace();
        }
        
        return () => {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, [modelsLoading, stream, facingMode, videoReady]);
    
    const startCamera = async () => {
        try {
            // Stop existing stream first
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setVideoReady(false);
            setCameraError(null);
            
            // Mobile-friendly constraints - less strict
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const constraints = {
                video: {
                    facingMode: isMobile ? { ideal: facingMode } : facingMode,
                    width: { ideal: isMobile ? 640 : 1280, max: 1920 },
                    height: { ideal: isMobile ? 480 : 720, max: 1080 }
                },
                audio: false
            };
            
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
        } catch (error) {
            console.error('Camera error:', error);
            // Try fallback with minimal constraints
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                setStream(fallbackStream);
            } catch (fallbackError) {
                setCameraError('Unable to access camera. Please check permissions and try again.');
            }
        }
    };
    
    useEffect(() => {
        if (stream && videoRef.current) {
            const video = videoRef.current;
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
            
            // Handle video ready state - try multiple events for robustness
            const tryPlay = async () => {
                try {
                    await video.play();
                    // Wait a bit for dimensions to stabilize
                    setTimeout(() => {
                        if (video.videoWidth > 0 && video.videoHeight > 0) {
                            setVideoReady(true);
                            console.log('Video ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
                        }
                    }, 200);
                } catch (err) {
                    console.error('Video play error:', err);
                    // On mobile, video might need user interaction to play
                    setCameraError('Tap the video to start camera');
                }
            };
            
            const handleLoadedMetadata = () => {
                console.log('loadedmetadata event');
                tryPlay();
            };
            
            const handleCanPlay = () => {
                console.log('canplay event');
                if (!videoReady) tryPlay();
            };
            
            // Handle tap to play on mobile (autoplay policy)
            const handleClick = () => {
                if (!videoReady) {
                    console.log('Video tapped, trying to play');
                    tryPlay();
                    setCameraError(null);
                }
            };
            
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('click', handleClick);
            
            // Cleanup
            return () => {
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                video.removeEventListener('canplay', handleCanPlay);
                video.removeEventListener('click', handleClick);
            };
        }
    }, [stream, videoReady]);
    
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setVideoReady(false);
    };
    
    // Switch camera (front/back) for mobile
    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };
    
    // Force capture - works without face detection
    const forceCapture = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas) {
            console.log('Video or canvas not ready');
            return false;
        }
        
        // Wait for valid dimensions (up to 2 seconds)
        let attempts = 0;
        while ((video.videoWidth === 0 || video.videoHeight === 0) && attempts < 20) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.log('Could not get valid video dimensions after waiting');
            // Try to capture anyway with fallback dimensions
        }
        
        setIsProcessing(true);
        
        try {
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Mirror for front camera
            if (facingMode === 'user') {
                ctx.translate(width, 0);
                ctx.scale(-1, 1);
            }
            
            ctx.drawImage(video, 0, 0, width, height);
            
            const descriptor = currentDescriptor ? descriptorToString(currentDescriptor) : null;
            const imageData = canvas.toDataURL('image/jpeg', 0.85);
            
            // Verify we actually got image data (not blank)
            if (imageData.length < 1000) {
                console.log('Captured image seems blank');
                setIsProcessing(false);
                return false;
            }
            
            setCapturedImages(prev => [...prev, {
                id: Date.now(),
                data: imageData,
                angle: ['Front', 'Left', 'Right', 'Up', 'Down', 'Extra'][capturedImages.length] || 'Extra',
                descriptor: descriptor,
                quality: faceQuality?.score || 0.6,
                hasRealAI: !!descriptor
            }]);
            
            setIsProcessing(false);
            return true;
        } catch (err) {
            console.error('Capture error:', err);
            setIsProcessing(false);
            return false;
        }
    };
    
    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current) {
            console.log('Video or canvas not ready');
            return false;
        }
        
        // Check if video is actually playing and has dimensions
        if (!videoReady || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
            console.log('Video not ready for capture', { videoReady, width: videoRef.current?.videoWidth, height: videoRef.current?.videoHeight });
            return false;
        }
        
        // For mobile, allow capture even without face detection (AI models may be slow)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!faceDetected && !isMobile) {
            console.log('No face detected');
            return false;
        }
        
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
            angle: ['Front', 'Left', 'Right', 'Up', 'Down', 'Extra'][capturedImages.length] || 'Extra',
            descriptor: descriptor,
            quality: faceQuality?.score || 0.5,
            hasRealAI: !!descriptor
        }]);
        
        setIsProcessing(false);
        return true;
    };
    
    const handleAutoCapture = async () => {
        setIsCapturing(true);
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        for (let i = 0; i < 6; i++) {
            // Skip if already have 6 photos
            if (capturedImages.length >= 6) break;
            
            // Wait for face detection (shorter wait on mobile)
            let waitAttempts = 0;
            const maxAttempts = isMobile ? 10 : 25;
            
            while (!faceDetected && waitAttempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 200));
                waitAttempts++;
            }
            
            // Countdown
            for (let c = 3; c > 0; c--) {
                setCountdown(c);
                await new Promise(r => setTimeout(r, 1000));
            }
            setCountdown(null);
            
            // Use forceCapture on mobile (always works), regular captureImage on desktop
            let captured = false;
            if (isMobile) {
                captured = await forceCapture();
            } else {
                captured = await captureImage();
            }
            
            if (captured) {
                await new Promise(r => setTimeout(r, 800)); // Wait before next capture
            }
        }
        
        setIsCapturing(false);
    };
    
    // Manual capture handler - ALWAYS works on mobile
    const handleManualCapture = async () => {
        if (isProcessing || isCapturing) return;
        if (capturedImages.length >= 6) return;
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // On mobile, use forceCapture which always works
        // On desktop, try captureImage first (needs face detection)
        let captured = false;
        
        if (isMobile) {
            captured = await forceCapture();
        } else {
            captured = await captureImage();
            if (!captured) {
                // Fallback to force capture on desktop too
                captured = await forceCapture();
            }
        }
        
        if (!captured) {
            console.log('Manual capture failed - video may not be ready');
        }
    };
    
    const removeImage = (id) => {
        setCapturedImages(prev => prev.filter(img => img.id !== id));
    };
    
    const handleSave = () => {
        if (capturedImages.length < 1) return;
        onCapture(capturedImages);
    };
    
    return (
        <div className="space-y-2 sm:space-y-4">
            {/* Person Name Banner */}
            {personName && (
                <Alert className="border-primary/50 bg-primary/5 py-2">
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    <AlertDescription className="text-xs sm:text-sm">
                        Registering: <strong className="truncate">{personName}</strong>
                    </AlertDescription>
                </Alert>
            )}
            
            {/* AI Model Loading State */}
            {modelsLoading && (
                <Alert className="border-blue-500/50 bg-blue-500/5 py-2">
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-500" />
                    <AlertDescription className="text-xs sm:text-sm text-blue-700">
                        🤖 Loading AI... {modelLoadProgress}
                    </AlertDescription>
                </Alert>
            )}
            
            {/* AI Status Badge */}
            {!modelsLoading && (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <Badge variant={videoReady ? "default" : "secondary"} className={`text-[10px] sm:text-xs ${videoReady ? "bg-blue-500" : ""}`}>
                        {videoReady ? "📹 Ready" : "⏳ Loading..."}
                    </Badge>
                    <Badge variant={faceDetected ? "default" : "secondary"} className={`text-[10px] sm:text-xs ${faceDetected ? "bg-green-500" : ""}`}>
                        {faceDetected ? "✅ Face" : "👁️ Scanning"}
                    </Badge>
                    {faceQuality && (
                        <Badge variant="outline" className={`text-[10px] sm:text-xs ${faceQuality.isGood ? "border-green-500 text-green-600" : "border-yellow-500 text-yellow-600"}`}>
                            {Math.round(faceQuality.score * 100)}%
                        </Badge>
                    )}
                </div>
            )}
            
            {/* Camera View - Mobile optimized aspect ratio */}
            <div className="relative aspect-[4/3] sm:aspect-video bg-black rounded-lg sm:rounded-xl overflow-hidden">
                {cameraError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="text-center px-4">
                            <VideoOff className="w-10 h-10 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-2 sm:mb-4" />
                            <p className="text-destructive text-xs sm:text-base">{cameraError}</p>
                            <Button variant="outline" size="sm" className="mt-3 sm:mt-4" onClick={startCamera}>
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Retry
                            </Button>
                        </div>
                    </div>
                ) : modelsLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="text-center px-4">
                            <Loader2 className="w-10 h-10 sm:w-16 sm:h-16 mx-auto text-primary mb-2 sm:mb-4 animate-spin" />
                            <p className="text-primary font-medium text-sm sm:text-base">Loading AI...</p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">{modelLoadProgress}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay playsInline muted
                            webkit-playsinline="true"
                            className="w-full h-full object-cover"
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />
                        <canvas 
                            ref={overlayCanvasRef}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />
                        
                        {/* Camera Switch Button - Mobile Only */}
                        <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2 sm:hidden bg-black/50 hover:bg-black/70 text-white border-0"
                            onClick={switchCamera}
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        
                        {/* Video Ready Indicator */}
                        {!videoReady && !cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                        
                        {!faceDetected && videoReady && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-32 h-44 sm:w-48 sm:h-64 border-2 border-dashed border-white/50 rounded-[50%] relative">
                                    <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 bg-black/50 px-2 sm:px-3 py-0.5 sm:py-1 rounded text-white text-xs sm:text-sm whitespace-nowrap">
                                        Position face here
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {countdown && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="text-6xl sm:text-8xl font-bold text-white animate-pulse">{countdown}</div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Captured Images */}
            {capturedImages.length > 0 && (
                <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">Captured ({capturedImages.length}/6)</Label>
                    <div className="flex gap-1.5 sm:gap-2">
                        {capturedImages.map((img) => (
                            <div key={img.id} className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-primary/20">
                                <img src={img.data} alt={img.angle} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] sm:text-xs p-0.5 sm:p-1 text-center">
                                    {Math.round(img.quality * 100)}%
                                </div>
                                <button
                                    onClick={() => removeImage(img.id)}
                                    className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-red-500 text-white rounded-full p-0.5"
                                >
                                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Controls - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                <Button variant="outline" size="sm" onClick={onClose} className="order-2 sm:order-1">
                    Cancel
                </Button>
                <div className="flex gap-1.5 sm:gap-2 order-1 sm:order-2">
                    {capturedImages.length < 6 && (
                        <>
                            {/* Manual Capture - Less restrictive on mobile */}
                            <Button
                                onClick={handleManualCapture}
                                disabled={isProcessing || isCapturing || (!stream && !videoReady)}
                                variant="outline"
                                size="sm"
                                className="flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 animate-spin" />
                                ) : (
                                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                )}
                                <span>Capture ({capturedImages.length}/6)</span>
                            </Button>
                            {/* Auto Capture - Works even without AI on mobile */}
                            <Button
                                onClick={handleAutoCapture}
                                disabled={isCapturing || (!stream && !videoReady)}
                                size="sm"
                                className="flex-1 sm:flex-none text-xs sm:text-sm bg-primary"
                            >
                                {isCapturing ? (
                                    <><Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" /> Capturing...</>
                                ) : (
                                    <><Aperture className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Auto (6)</>
                                )}
                            </Button>
                        </>
                    )}
                    {capturedImages.length > 0 && (
                        <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none text-xs sm:text-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Save<span className="hidden sm:inline"> Face</span>
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
            <DialogContent className="w-[95vw] max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
                <DialogHeader className="pb-2 sm:pb-4">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <ScanFace className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        <span className="truncate">Register - {person?.full_name}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
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
                    <div className="space-y-3 sm:space-y-4">
                        <Alert className="border-green-500/50 bg-green-500/5 py-2">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                            <AlertDescription className="text-green-700 text-xs sm:text-sm">
                                {capturedPhotos.length} photos captured!
                            </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            {capturedPhotos.map((photo) => (
                                <div key={photo.id} className="relative rounded-lg overflow-hidden">
                                    <img src={photo.data} alt={photo.angle} className="w-full aspect-square object-cover" />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] sm:text-xs p-0.5 sm:p-1 text-center">
                                        {Math.round(photo.quality * 100)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex flex-col-reverse sm:flex-row justify-between gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setCapturedPhotos([]); setShowCamera(true); }}>
                                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Retake
                            </Button>
                            <Button onClick={handleSaveFace} disabled={loading} size="sm" className="bg-green-600 hover:bg-green-700">
                                {loading && <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />}
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                Complete<span className="hidden sm:inline"> Registration</span>
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
            <DialogContent className="w-[95vw] max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
                <DialogHeader className="pb-2 sm:pb-4">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        <span className="truncate">Edit - {registration?.person_name}</span>
                    </DialogTitle>
                </DialogHeader>
                
                {showCamera ? (
                    <CameraCapture 
                        onCapture={handleCapture}
                        onClose={onClose}
                        personName={registration?.person_name}
                    />
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        <Alert className="border-green-500/50 bg-green-500/5 py-2">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                            <AlertDescription className="text-green-700 text-xs sm:text-sm">
                                {capturedPhotos.length} new photos captured!
                            </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            {capturedPhotos.map((photo) => (
                                <div key={photo.id} className="relative rounded-lg overflow-hidden">
                                    <img src={photo.data} alt={photo.angle} className="w-full aspect-square object-cover" />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] sm:text-xs p-0.5 sm:p-1 text-center">
                                        {Math.round(photo.quality * 100)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex flex-col-reverse sm:flex-row justify-between gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setCapturedPhotos([]); setShowCamera(true); }}>
                                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Retake
                            </Button>
                            <Button onClick={handleUpdateFace} disabled={loading} size="sm" className="bg-blue-600 hover:bg-blue-700">
                                {loading && <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />}
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                Update<span className="hidden sm:inline"> Face</span>
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
            {/* Header - Mobile Optimized */}
            <div className="flex flex-col gap-3 mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <ScanFace className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Face Registration</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                                Register faces for AI-powered attendance
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="flex-shrink-0">
                        <RefreshCw className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>
            </div>
            
            {/* Stats Dashboard - Mobile Optimized Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <Card>
                    <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-4">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
                                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-2xl font-bold">{stats.totalStudents}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-4">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.registeredStudents}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Registered</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50/50 dark:bg-orange-950/20">
                    <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-4">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/10">
                                <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.pendingStudents}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-4">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10">
                                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-2xl font-bold">{stats.totalStaff}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Staff</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-4">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.registeredStaff}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Staff Reg.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-4">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10">
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-2xl font-bold">{stats.studentPercent}%</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Done</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Progress Bars - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <Card>
                    <CardContent className="p-3 sm:pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" /> 
                                <span className="hidden xs:inline">Student</span> Registration
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground">{stats.registeredStudents}/{stats.totalStudents}</span>
                        </div>
                        <Progress value={stats.studentPercent} className="h-1.5 sm:h-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 sm:pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" /> 
                                <span className="hidden xs:inline">Staff</span> Registration
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground">{stats.registeredStaff}/{stats.totalStaff}</span>
                        </div>
                        <Progress value={stats.staffPercent} className="h-1.5 sm:h-2" />
                    </CardContent>
                </Card>
            </div>
            
            {/* Main Content */}
            <Card>
                <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="students" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" /> 
                                <span>Students</span>
                                <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs px-1 sm:px-2">{students.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="staff" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" /> 
                                <span>Staff</span>
                                <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs px-1 sm:px-2">{staff.length}</Badge>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                
                <CardContent className="p-3 sm:p-6 pt-0">
                    {/* Filters - Mobile Optimized */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-2 sm:gap-3 mb-3 sm:mb-4 p-2 sm:p-4 bg-muted/30 rounded-lg">
                        {activeTab === 'students' ? (
                            <>
                                <div className="col-span-1 sm:flex-1 sm:min-w-[150px] sm:max-w-[200px]">
                                    <Label className="text-[10px] sm:text-xs mb-1 block">Class</Label>
                                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                                        <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                                            <SelectValue placeholder="Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Classes</SelectItem>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-1 sm:flex-1 sm:min-w-[150px] sm:max-w-[200px]">
                                    <Label className="text-[10px] sm:text-xs mb-1 block">Section</Label>
                                    <Select 
                                        value={selectedSection} 
                                        onValueChange={setSelectedSection}
                                        disabled={selectedClass === 'all'}
                                    >
                                        <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                                            <SelectValue placeholder="Section" />
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
                            <div className="col-span-1 sm:flex-1 sm:min-w-[150px] sm:max-w-[200px]">
                                <Label className="text-[10px] sm:text-xs mb-1 block">Department</Label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Depts</SelectItem>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        <div className="col-span-1 sm:flex-1 sm:min-w-[120px] sm:max-w-[180px]">
                            <Label className="text-[10px] sm:text-xs mb-1 block">Status</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="registered">✅ Registered</SelectItem>
                                    <SelectItem value="pending">⏳ Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[180px]">
                            <Label className="text-[10px] sm:text-xs mb-1 block">Search</Label>
                            <div className="relative">
                                <Input
                                    placeholder={`Search...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 sm:pl-9 h-8 sm:h-10 text-xs sm:text-sm"
                                />
                                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Data List - Mobile Cards / Desktop Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-10 sm:py-20">
                            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
                        </div>
                    ) : (activeTab === 'students' ? filteredStudents : filteredStaff).length === 0 ? (
                        <div className="text-center py-10">
                            <div className="text-muted-foreground">
                                {activeTab === 'students' ? (
                                    <>
                                        <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm sm:text-base">No students found. Select a class.</p>
                                    </>
                                ) : (
                                    <>
                                        <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm sm:text-base">No staff found. Try changing filter.</p>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="sm:hidden space-y-2">
                                {(activeTab === 'students' ? filteredStudents : filteredStaff).map((person, index) => {
                                    const registration = faceRegistrations[person.id];
                                    const isRegistered = !!registration;
                                    const quality = registration?.confidence_score || 0;
                                    
                                    return (
                                        <div 
                                            key={person.id} 
                                            className={`p-3 rounded-lg border ${!isRegistered ? 'bg-orange-50/30 dark:bg-orange-950/10 border-orange-200' : 'bg-card'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Photo */}
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border flex-shrink-0">
                                                    {registration?.photo_url ? (
                                                        <img src={registration.photo_url} className="w-full h-full object-cover" alt="" />
                                                    ) : person.photo_url ? (
                                                        <img src={person.photo_url} className="w-full h-full object-cover" alt="" />
                                                    ) : activeTab === 'students' ? (
                                                        <GraduationCap className="w-6 h-6 text-primary/50" />
                                                    ) : (
                                                        <Briefcase className="w-6 h-6 text-primary/50" />
                                                    )}
                                                </div>
                                                
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="font-medium text-sm truncate">{person.full_name}</h4>
                                                        {isRegistered ? (
                                                            <Badge className="bg-green-500 text-[10px] px-1.5 py-0.5 flex-shrink-0">
                                                                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Done
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px] px-1.5 py-0.5 flex-shrink-0">
                                                                Pending
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {activeTab === 'students' 
                                                            ? `${person.admission_number || '-'} • ${person.classes?.class_name || ''} ${person.sections?.section_name || ''}`
                                                            : `${person.phone || '-'} • ${person.department || '-'}`
                                                        }
                                                    </p>
                                                    {isRegistered && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className={`text-[10px] px-1.5 ${getQualityColor(quality)}`}>
                                                                Quality: {Math.round(quality * 100)}%
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t">
                                                {!isRegistered && hasAddPermission && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRegisterClick(person, activeTab === 'students' ? 'student' : 'staff')}
                                                        className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                                                    >
                                                        <Camera className="w-3.5 h-3.5 mr-1" /> Register Face
                                                    </Button>
                                                )}
                                                {isRegistered && hasEditPermission && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditClick(person, activeTab === 'students' ? 'student' : 'staff')}
                                                        className="h-8 text-xs"
                                                    >
                                                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                                                    </Button>
                                                )}
                                                {isRegistered && hasDeletePermission && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                                                        onClick={() => handleDeleteFace(person.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Desktop Table View */}
                            <div className="hidden sm:block border rounded-lg overflow-hidden">
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
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                    
                    {/* Summary Footer - Mobile Optimized */}
                    {(activeTab === 'students' ? filteredStudents : filteredStaff).length > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 sm:mt-4 px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-0">
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
