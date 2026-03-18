// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - CAMERA PREVIEW COMPONENT (Day 10)
// Real-time camera preview with AI face detection overlay
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { aiEngineApi } from '@/services/aiEngineApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Camera,
    Video,
    VideoOff,
    Play,
    Pause,
    RefreshCw,
    Maximize2,
    Minimize2,
    Settings,
    ScanFace,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    Volume2,
    VolumeX,
    RotateCcw,
    Zap,
    Clock,
    Users,
    User
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CAMERA PREVIEW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const CameraPreview = ({
    onFaceDetected,
    onFaceRecognized,
    mode = 'detection', // 'detection' | 'recognition' | 'enrollment'
    autoStart = false,
    showControls = true,
    showStats = true,
    className = '',
    cameraId = null, // For IP camera mode (future)
}) => {
    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const animationRef = useRef(null);
    const lastDetectionRef = useRef(0);
    
    // State
    const [stream, setStream] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [facingMode, setFacingMode] = useState('user');
    
    // Detection state
    const [detectedFaces, setDetectedFaces] = useState([]);
    const [recognizedPersons, setRecognizedPersons] = useState([]);
    const [isDetectionActive, setIsDetectionActive] = useState(true);
    
    // Stats
    const [stats, setStats] = useState({
        fps: 0,
        detectionTime: 0,
        facesDetected: 0,
        recognitionsToday: 0
    });
    
    // Settings
    const [settings, setSettings] = useState({
        detectionInterval: 200, // ms between detections
        showBoundingBoxes: true,
        showConfidence: true,
        soundEnabled: true,
        threshold: 0.6
    });
    
    // Platform detection
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // CAMERA INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    // Get available camera devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request permission first
                await navigator.mediaDevices.getUserMedia({ video: true });
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
                setDevices(videoDevices);
                if (videoDevices.length > 0 && !selectedDevice) {
                    setSelectedDevice(videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error('Error getting devices:', err);
                setError('Camera access denied. Please allow camera permissions.');
            }
        };
        getDevices();
    }, []);
    
    // Auto-start if enabled
    useEffect(() => {
        if (autoStart && devices.length > 0) {
            startCamera();
        }
        return () => stopCamera();
    }, [autoStart, devices]);
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // CAMERA CONTROL
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const startCamera = async () => {
        try {
            setError(null);
            
            // Stop existing stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            const constraints = {
                video: {
                    deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
                    facingMode: isMobile ? { ideal: facingMode } : undefined,
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: false
            };
            
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
                setIsPlaying(true);
                
                // Start detection loop
                if (isDetectionActive) {
                    startDetectionLoop();
                }
            }
        } catch (err) {
            console.error('Camera start error:', err);
            setError(err.message || 'Failed to start camera');
        }
    };
    
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setIsPlaying(false);
        setDetectedFaces([]);
    };
    
    const toggleCamera = () => {
        if (isPlaying) {
            stopCamera();
        } else {
            startCamera();
        }
    };
    
    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        if (isPlaying) {
            stopCamera();
            setTimeout(startCamera, 100);
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // FACE DETECTION LOOP
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const startDetectionLoop = useCallback(() => {
        let lastFpsTime = performance.now();
        let frameCount = 0;
        
        const detectLoop = async () => {
            if (!videoRef.current || !isPlaying || !isDetectionActive) {
                return;
            }
            
            const now = performance.now();
            
            // Throttle detection based on interval
            if (now - lastDetectionRef.current >= settings.detectionInterval) {
                lastDetectionRef.current = now;
                
                try {
                    setIsProcessing(true);
                    const startTime = performance.now();
                    
                    // Capture frame
                    const imageBase64 = aiEngineApi.captureVideoFrame(videoRef.current);
                    
                    if (mode === 'recognition') {
                        // Recognition mode - detect and recognize
                        const result = await aiEngineApi.recognizeFace(imageBase64, settings.threshold);
                        
                        if (result.success && result.matches) {
                            setRecognizedPersons(result.matches);
                            
                            // Callback for recognized faces
                            if (onFaceRecognized && result.matches.length > 0) {
                                onFaceRecognized(result.matches);
                            }
                            
                            // Play sound for new recognition
                            if (settings.soundEnabled && result.matches.some(m => m.confidence > settings.threshold)) {
                                playRecognitionSound();
                            }
                        }
                        
                        // Update detected faces from detection
                        if (result.faces_detected) {
                            setDetectedFaces(Array(result.faces_detected).fill({}));
                        }
                    } else {
                        // Detection mode - just detect faces
                        const result = await aiEngineApi.detectFaces(imageBase64);
                        
                        if (result.success) {
                            setDetectedFaces(result.faces || []);
                            
                            // Callback for detected faces
                            if (onFaceDetected && result.faces?.length > 0) {
                                onFaceDetected(result.faces, imageBase64);
                            }
                        }
                    }
                    
                    const detectionTime = performance.now() - startTime;
                    setStats(prev => ({ ...prev, detectionTime: Math.round(detectionTime) }));
                    
                } catch (err) {
                    console.error('Detection error:', err);
                } finally {
                    setIsProcessing(false);
                }
            }
            
            // FPS calculation
            frameCount++;
            if (now - lastFpsTime >= 1000) {
                setStats(prev => ({ ...prev, fps: frameCount }));
                frameCount = 0;
                lastFpsTime = now;
            }
            
            // Draw overlay
            drawOverlay();
            
            // Continue loop
            animationRef.current = requestAnimationFrame(detectLoop);
        };
        
        animationRef.current = requestAnimationFrame(detectLoop);
    }, [isPlaying, isDetectionActive, settings, mode, onFaceDetected, onFaceRecognized]);
    
    // Restart detection when settings change
    useEffect(() => {
        if (isPlaying && isDetectionActive) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            startDetectionLoop();
        }
    }, [isDetectionActive, startDetectionLoop]);
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // OVERLAY DRAWING
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const drawOverlay = () => {
        if (!overlayCanvasRef.current || !videoRef.current) return;
        
        const canvas = overlayCanvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        // Match canvas size to video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!settings.showBoundingBoxes) return;
        
        // Draw bounding boxes for detected faces
        detectedFaces.forEach((face, index) => {
            if (!face.bbox) return;
            
            const [x, y, w, h] = face.bbox;
            const isRecognized = recognizedPersons[index]?.confidence > settings.threshold;
            
            // Box color based on recognition status
            ctx.strokeStyle = isRecognized ? '#22c55e' : '#3b82f6'; // green if recognized, blue otherwise
            ctx.lineWidth = 3;
            
            // Handle mirroring for front camera
            if (facingMode === 'user') {
                ctx.strokeRect(canvas.width - x - w, y, w, h);
            } else {
                ctx.strokeRect(x, y, w, h);
            }
            
            // Draw label
            if (settings.showConfidence) {
                const label = recognizedPersons[index]?.person_name || 
                    (face.confidence ? `${Math.round(face.confidence * 100)}%` : 'Face');
                
                ctx.fillStyle = isRecognized ? '#22c55e' : '#3b82f6';
                ctx.font = 'bold 14px Arial';
                const labelX = facingMode === 'user' ? canvas.width - x - w : x;
                ctx.fillText(label, labelX, y - 5);
            }
        });
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // SOUND
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const playRecognitionSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 880; // A5 note
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (err) {
            console.error('Sound error:', err);
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // CAPTURE FRAME (For enrollment)
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const captureFrame = useCallback(() => {
        if (!videoRef.current) return null;
        
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Handle mirroring
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        
        ctx.drawImage(videoRef.current, 0, 0);
        
        return {
            dataUrl: canvas.toDataURL('image/jpeg', 0.9),
            base64: canvas.toDataURL('image/jpeg', 0.9).split(',')[1],
            width: canvas.width,
            height: canvas.height
        };
    }, [facingMode]);
    
    // Expose capture method via ref callback
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.captureFrame = captureFrame;
        }
    }, [captureFrame]);
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    return (
        <div className={`relative ${className}`}>
            {/* Video Container */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {/* Video Element */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                
                {/* Overlay Canvas (for bounding boxes) */}
                <canvas
                    ref={overlayCanvasRef}
                    className={`absolute inset-0 w-full h-full pointer-events-none ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                
                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Loading/Error Overlay */}
                {!isPlaying && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center space-y-4">
                            <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">Camera not started</p>
                            <Button onClick={startCamera}>
                                <Play className="w-4 h-4 mr-2" />
                                Start Camera
                            </Button>
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <Alert variant="destructive" className="max-w-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </div>
                )}
                
                {/* Processing Indicator */}
                {isProcessing && (
                    <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="animate-pulse">
                            <Zap className="w-3 h-3 mr-1" />
                            Processing
                        </Badge>
                    </div>
                )}
                
                {/* Face Count Badge */}
                {isPlaying && detectedFaces.length > 0 && (
                    <div className="absolute top-4 left-4">
                        <Badge variant="default" className="bg-blue-600">
                            <Users className="w-3 h-3 mr-1" />
                            {detectedFaces.length} {detectedFaces.length === 1 ? 'Face' : 'Faces'}
                        </Badge>
                    </div>
                )}
            </div>
            
            {/* Controls */}
            {showControls && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant={isPlaying ? 'destructive' : 'default'}
                            size="sm"
                            onClick={toggleCamera}
                        >
                            {isPlaying ? (
                                <>
                                    <VideoOff className="w-4 h-4 mr-2" />
                                    Stop
                                </>
                            ) : (
                                <>
                                    <Video className="w-4 h-4 mr-2" />
                                    Start
                                </>
                            )}
                        </Button>
                        
                        {isMobile && (
                            <Button variant="outline" size="sm" onClick={switchCamera}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Switch
                            </Button>
                        )}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDetectionActive(!isDetectionActive)}
                        >
                            {isDetectionActive ? (
                                <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Detection On
                                </>
                            ) : (
                                <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Detection Off
                                </>
                            )}
                        </Button>
                    </div>
                    
                    {/* Device Selector (Desktop) */}
                    {!isMobile && devices.length > 1 && (
                        <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select camera" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.map(device => (
                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Camera ${devices.indexOf(device) + 1}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    
                    {/* Quick Settings */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={settings.showBoundingBoxes}
                                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showBoundingBoxes: checked }))}
                            />
                            <Label className="text-sm">Boxes</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={settings.soundEnabled}
                                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, soundEnabled: checked }))}
                            />
                            <Label className="text-sm">Sound</Label>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Stats */}
            {showStats && isPlaying && (
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {stats.fps} FPS
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {stats.detectionTime}ms
                    </span>
                    <span className="flex items-center gap-1">
                        <ScanFace className="w-4 h-4" />
                        {detectedFaces.length} detected
                    </span>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CAMERA PREVIEW PAGE (Standalone)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

export const CameraPreviewPage = () => {
    const [recognizedPersons, setRecognizedPersons] = useState([]);
    
    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-blue-500" />
                        Camera Preview with AI Detection
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CameraPreview
                        mode="recognition"
                        autoStart={false}
                        showControls={true}
                        showStats={true}
                        onFaceRecognized={(persons) => {
                            setRecognizedPersons(persons);
                            console.log('Recognized:', persons);
                        }}
                    />
                    
                    {/* Recent Recognitions */}
                    {recognizedPersons.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-semibold mb-3">Recent Recognitions</h3>
                            <div className="space-y-2">
                                {recognizedPersons.map((person, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <User className="w-8 h-8 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{person.person_name || 'Unknown'}</p>
                                                <p className="text-sm text-muted-foreground">{person.person_type}</p>
                                            </div>
                                        </div>
                                        <Badge variant={person.confidence > 0.7 ? 'default' : 'secondary'}>
                                            {Math.round(person.confidence * 100)}% match
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CameraPreview;
