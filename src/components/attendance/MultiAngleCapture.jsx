// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - MULTI-ANGLE FACE CAPTURE COMPONENT (DAY 16)
// Guided capture wizard for front, left, right face angles with quality validation
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { aiEngineApi } from '@/services/aiEngineApi';
import { loadFaceModels, areModelsLoaded, detectSingleFace, analyzeFaceQuality } from '@/utils/faceRecognition';

import {
    Camera, ScanFace, CheckCircle2, XCircle, ChevronRight, ChevronLeft, RotateCcw,
    Loader2, AlertTriangle, Eye, EyeOff, Maximize2, ArrowLeft, ArrowRight,
    Check, X, RefreshCw, Video, VideoOff, User, Sparkles
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ANGLE GUIDE OVERLAY - Shows user where to position face
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const AngleGuideOverlay = ({ angle, faceDetected, quality }) => {
    const getGuidePosition = () => {
        switch (angle) {
            case 'left':
                return { transform: 'translateX(15%) rotateY(-25deg)' };
            case 'right':
                return { transform: 'translateX(-15%) rotateY(25deg)' };
            default:
                return { transform: 'none' };
        }
    };

    const getGuideText = () => {
        switch (angle) {
            case 'left':
                return 'Turn head slightly LEFT';
            case 'right':
                return 'Turn head slightly RIGHT';
            default:
                return 'Look straight at camera';
        }
    };

    const getArrowIcon = () => {
        switch (angle) {
            case 'left':
                return <ArrowLeft className="w-8 h-8 text-white animate-pulse" />;
            case 'right':
                return <ArrowRight className="w-8 h-8 text-white animate-pulse" />;
            default:
                return <User className="w-8 h-8 text-white" />;
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Face Guide Oval */}
            <div 
                className={`w-40 h-52 sm:w-48 sm:h-64 border-4 border-dashed rounded-[50%] transition-all duration-300 ${
                    faceDetected 
                        ? quality?.isGood 
                            ? 'border-green-500 shadow-lg shadow-green-500/30' 
                            : 'border-yellow-500 shadow-lg shadow-yellow-500/30'
                        : 'border-white/50'
                }`}
                style={getGuidePosition()}
            >
                {/* Arrow indicator */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    {getArrowIcon()}
                    <div className="bg-black/70 px-3 py-1.5 rounded-lg mt-2">
                        <p className="text-white text-sm font-medium whitespace-nowrap">{getGuideText()}</p>
                    </div>
                </div>

                {/* Quality indicator */}
                {faceDetected && quality && (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <Badge 
                            variant="outline" 
                            className={`${
                                quality.isGood 
                                    ? 'bg-green-500/90 text-white border-green-400' 
                                    : 'bg-yellow-500/90 text-white border-yellow-400'
                            }`}
                        >
                            {Math.round(quality.score * 100)}% Quality
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ANGLE PROGRESS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const AngleProgressIndicator = ({ angles, currentAngle, captures }) => {
    return (
        <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
            {angles.map((angle, index) => {
                const isCompleted = captures[angle];
                const isCurrent = currentAngle === angle;
                const isPending = !isCompleted && !isCurrent;

                return (
                    <React.Fragment key={angle}>
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    isCompleted
                                        ? 'bg-green-500 text-white'
                                        : isCurrent
                                        ? 'bg-primary text-white ring-4 ring-primary/30'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {isCompleted ? (
                                    <Check className="w-6 h-6" />
                                ) : (
                                    <span className="text-sm font-medium capitalize">
                                        {angle === 'front' ? '👤' : angle === 'left' ? '👈' : '👉'}
                                    </span>
                                )}
                            </div>
                            <span className={`text-xs mt-1 capitalize ${isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                                {angle}
                            </span>
                        </div>
                        {index < angles.length - 1 && (
                            <ChevronRight className={`w-4 h-4 ${captures[angle] ? 'text-green-500' : 'text-muted-foreground'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CAPTURED PHOTOS PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CapturedPhotosPreview = ({ captures, onRetake, onRemove }) => {
    const angles = ['front', 'left', 'right'];
    
    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {angles.map((angle) => (
                <div key={angle} className="relative">
                    <div className={`aspect-square rounded-xl overflow-hidden border-2 ${
                        captures[angle] 
                            ? 'border-green-500' 
                            : 'border-dashed border-muted-foreground/30'
                    }`}>
                        {captures[angle] ? (
                            <>
                                <img 
                                    src={captures[angle].imageData} 
                                    alt={`${angle} angle`} 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                            {Math.round(captures[angle].quality * 100)}%
                                        </Badge>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 w-6 p-0 hover:bg-red-500/20"
                                            onClick={() => onRetake(angle)}
                                        >
                                            <RefreshCw className="w-3 h-3 text-white" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50">
                                <Camera className="w-6 h-6 text-muted-foreground/50 mb-1" />
                                <span className="text-[10px] text-muted-foreground capitalize">{angle}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN MULTI-ANGLE CAPTURE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const MultiAngleCapture = ({ 
    open, 
    onClose, 
    person, 
    personType = 'student',
    branchId,
    organizationId,
    onEnrollmentComplete 
}) => {
    const { toast } = useToast();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    
    // Camera state
    const [stream, setStream] = useState(null);
    const [videoReady, setVideoReady] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    
    // AI state
    const [modelsLoading, setModelsLoading] = useState(true);
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceQuality, setFaceQuality] = useState(null);
    
    // Capture state
    const angles = ['front', 'left', 'right'];
    const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
    const [captures, setCaptures] = useState({});
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState(null);
    
    // Enrollment state
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollmentProgress, setEnrollmentProgress] = useState(0);
    const [enrollmentStatus, setEnrollmentStatus] = useState('');
    
    const currentAngle = angles[currentAngleIndex];
    const allCaptured = angles.every(a => captures[a]);
    
    // Initialize AI models
    useEffect(() => {
        const initModels = async () => {
            try {
                setModelsLoading(true);
                await loadFaceModels();
                setModelsLoading(false);
            } catch (error) {
                console.error('Failed to load AI models:', error);
                setModelsLoading(false);
            }
        };
        if (open) initModels();
    }, [open]);
    
    // Start camera
    useEffect(() => {
        if (open && !modelsLoading) {
            startCamera();
        }
        return () => stopCamera();
    }, [open, modelsLoading]);
    
    // Face detection loop
    useEffect(() => {
        let animationId;
        let isRunning = true;
        
        const detectFace = async () => {
            if (!isRunning || !videoRef.current || modelsLoading || !areModelsLoaded() || !videoReady) return;
            
            try {
                const detection = await detectSingleFace(videoRef.current);
                if (detection) {
                    setFaceDetected(true);
                    setFaceQuality(analyzeFaceQuality(detection));
                } else {
                    setFaceDetected(false);
                    setFaceQuality(null);
                }
            } catch (error) {
                console.error('Detection error:', error);
            }
            
            if (isRunning) {
                animationId = requestAnimationFrame(() => setTimeout(detectFace, 100));
            }
        };
        
        if (!modelsLoading && stream && videoReady) {
            detectFace();
        }
        
        return () => {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, [modelsLoading, stream, videoReady]);
    
    const startCamera = async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setVideoReady(false);
            setCameraError(null);
            
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            setStream(mediaStream);
        } catch (error) {
            console.error('Camera error:', error);
            setCameraError('Unable to access camera. Please check permissions.');
        }
    };
    
    useEffect(() => {
        if (stream && videoRef.current) {
            const video = videoRef.current;
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
            
            const handleReady = async () => {
                try {
                    await video.play();
                    setTimeout(() => setVideoReady(true), 200);
                } catch (err) {
                    console.error('Video play error:', err);
                }
            };
            
            video.addEventListener('loadedmetadata', handleReady);
            return () => video.removeEventListener('loadedmetadata', handleReady);
        }
    }, [stream]);
    
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setVideoReady(false);
    };
    
    // Capture current angle
    const captureAngle = async () => {
        if (!videoRef.current || !canvasRef.current || !faceDetected) return;
        
        setIsCapturing(true);
        
        // Countdown
        for (let c = 3; c > 0; c--) {
            setCountdown(c);
            await new Promise(r => setTimeout(r, 1000));
        }
        setCountdown(null);
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        setCaptures(prev => ({
            ...prev,
            [currentAngle]: {
                imageData,
                quality: faceQuality?.score || 0.6,
                timestamp: Date.now()
            }
        }));
        
        toast({
            title: `✅ ${currentAngle.charAt(0).toUpperCase() + currentAngle.slice(1)} captured!`,
            description: `Quality: ${Math.round((faceQuality?.score || 0.6) * 100)}%`
        });
        
        // Move to next angle
        if (currentAngleIndex < angles.length - 1) {
            setCurrentAngleIndex(prev => prev + 1);
        }
        
        setIsCapturing(false);
    };
    
    // Retake specific angle
    const handleRetake = (angle) => {
        setCaptures(prev => {
            const newCaptures = { ...prev };
            delete newCaptures[angle];
            return newCaptures;
        });
        setCurrentAngleIndex(angles.indexOf(angle));
    };
    
    // Reset all
    const handleReset = () => {
        setCaptures({});
        setCurrentAngleIndex(0);
        setEnrollmentProgress(0);
        setEnrollmentStatus('');
    };
    
    // Complete enrollment
    const handleEnrollment = async () => {
        if (!allCaptured) return;
        
        setIsEnrolling(true);
        setEnrollmentProgress(0);
        
        try {
            // Prepare images for multi-angle enrollment
            const images = {
                front: captures.front?.imageData.split(',')[1],
                left: captures.left?.imageData.split(',')[1],
                right: captures.right?.imageData.split(',')[1]
            };
            
            setEnrollmentStatus('Uploading images...');
            setEnrollmentProgress(20);
            
            setEnrollmentStatus('Generating 512D ArcFace embeddings...');
            setEnrollmentProgress(40);
            
            // Call multi-angle enrollment API
            const result = await aiEngineApi.enrollFaceMultiAngle(
                branchId,
                person.id,
                person.full_name,
                personType,
                images
            );
            
            setEnrollmentProgress(80);
            setEnrollmentStatus('Updating FAISS index...');
            
            await new Promise(r => setTimeout(r, 500));
            
            setEnrollmentProgress(100);
            setEnrollmentStatus('Complete!');
            
            toast({
                title: '🎉 Multi-angle enrollment complete!',
                description: `${result.data?.angles?.success?.length || 3} angles saved for ${person.full_name}`
            });
            
            onEnrollmentComplete?.();
            setTimeout(() => onClose(), 1500);
        } catch (error) {
            console.error('Enrollment error:', error);
            toast({
                variant: 'destructive',
                title: 'Enrollment failed',
                description: error.message
            });
        }
        
        setIsEnrolling(false);
    };
    
    // Reset on close
    useEffect(() => {
        if (!open) {
            handleReset();
            stopCamera();
        }
    }, [open]);
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Multi-Angle Face Registration
                    </DialogTitle>
                    <DialogDescription>
                        Capture {person?.full_name}'s face from multiple angles for better recognition accuracy
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    {/* Progress Indicator */}
                    <AngleProgressIndicator 
                        angles={angles} 
                        currentAngle={currentAngle} 
                        captures={captures} 
                    />
                    
                    {/* Camera View */}
                    {!allCaptured && (
                        <Card>
                            <CardContent className="p-2 sm:p-4">
                                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                                    {modelsLoading ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-3" />
                                                <p className="text-white">Loading AI models...</p>
                                            </div>
                                        </div>
                                    ) : cameraError ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                            <div className="text-center">
                                                <VideoOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                <p className="text-destructive">{cameraError}</p>
                                                <Button variant="outline" className="mt-3" onClick={startCamera}>
                                                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <video
                                                ref={videoRef}
                                                autoPlay playsInline muted
                                                className="w-full h-full object-cover"
                                                style={{ transform: 'scaleX(-1)' }}
                                            />
                                            <AngleGuideOverlay 
                                                angle={currentAngle} 
                                                faceDetected={faceDetected}
                                                quality={faceQuality}
                                            />
                                            
                                            {countdown && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                    <div className="text-8xl font-bold text-white animate-pulse">{countdown}</div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                
                                <canvas ref={canvasRef} className="hidden" />
                                
                                {/* Capture Controls */}
                                <div className="flex justify-center mt-4">
                                    <Button 
                                        onClick={captureAngle}
                                        disabled={!faceDetected || isCapturing || captures[currentAngle]}
                                        size="lg"
                                        className="px-8"
                                    >
                                        {isCapturing ? (
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        ) : (
                                            <Camera className="w-5 h-5 mr-2" />
                                        )}
                                        Capture {currentAngle.charAt(0).toUpperCase() + currentAngle.slice(1)}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Captured Photos Preview */}
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm">Captured Photos</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <CapturedPhotosPreview 
                                captures={captures} 
                                onRetake={handleRetake}
                            />
                        </CardContent>
                    </Card>
                    
                    {/* Enrollment Progress */}
                    {isEnrolling && (
                        <Card className="border-primary/50">
                            <CardContent className="py-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                        <span className="font-medium">{enrollmentStatus}</span>
                                    </div>
                                    <Progress value={enrollmentProgress} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
                
                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
                    <Button variant="outline" onClick={handleReset} disabled={isEnrolling}>
                        <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </Button>
                    <Button variant="outline" onClick={onClose} disabled={isEnrolling}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleEnrollment}
                        disabled={!allCaptured || isEnrolling}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isEnrolling ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Complete Enrollment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MultiAngleCapture;
