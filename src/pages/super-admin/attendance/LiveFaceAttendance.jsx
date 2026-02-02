// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - LIVE FACE ATTENDANCE
// Real-time AI-powered face recognition for automatic attendance marking
// Uses face-api.js for browser-based face detection and matching
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

// Real AI Face Recognition
import {
    loadFaceModels,
    areModelsLoaded,
    detectSingleFace,
    findBestMatch,
    stringToDescriptor,
    analyzeFaceQuality
} from '@/utils/faceRecognition';

import {
    ScanFace,
    Camera,
    Play,
    Pause,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Users,
    User,
    GraduationCap,
    Briefcase,
    Clock,
    Calendar,
    Video,
    VideoOff,
    Volume2,
    VolumeX,
    Maximize2,
    Settings,
    History,
    UserCheck,
    UserX
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// LIVE FACE ATTENDANCE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const LiveFaceAttendance = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    
    // State
    const [isScanning, setIsScanning] = useState(false);
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [modelLoadProgress, setModelLoadProgress] = useState('');
    
    // Face detection state
    const [currentFace, setCurrentFace] = useState(null);
    const [matchedPerson, setMatchedPerson] = useState(null);
    const [matchConfidence, setMatchConfidence] = useState(0);
    
    // Registered faces database
    const [registeredFaces, setRegisteredFaces] = useState([]);
    const [loadingFaces, setLoadingFaces] = useState(true);
    
    // Attendance log
    const [attendanceLog, setAttendanceLog] = useState([]);
    const [todayStats, setTodayStats] = useState({ total: 0, present: 0, students: 0, staff: 0 });
    
    // Settings
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [autoMark, setAutoMark] = useState(true);
    const [matchThreshold, setMatchThreshold] = useState(0.6);
    
    // Recently marked (to prevent duplicates within cooldown)
    const [recentlyMarked, setRecentlyMarked] = useState(new Set());
    const COOLDOWN_MS = 30000; // 30 seconds cooldown per person
    
    // Permissions
    const hasViewPermission = canView('attendance.live_face') || canView('attendance');
    const hasAddPermission = canAdd('attendance.live_face') || canAdd('attendance');
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    // Load AI models
    useEffect(() => {
        const initModels = async () => {
            try {
                setModelsLoading(true);
                await loadFaceModels((progress) => setModelLoadProgress(progress));
                setModelsLoading(false);
            } catch (error) {
                console.error('Failed to load AI models:', error);
                setCameraError('Failed to load AI face recognition models');
                setModelsLoading(false);
            }
        };
        initModels();
    }, []);
    
    // Load registered faces from database
    useEffect(() => {
        if (branchId) {
            fetchRegisteredFaces();
            fetchTodayStats();
        }
    }, [branchId]);
    
    const fetchRegisteredFaces = async () => {
        setLoadingFaces(true);
        
        // First get face encodings
        const { data: facesData, error: facesError } = await supabase
            .from('face_encodings')
            .select('*')
            .eq('branch_id', branchId)
            .eq('is_active', true);
        
        if (facesError) {
            toast({ variant: 'destructive', title: 'Error loading faces', description: facesError.message });
            setLoadingFaces(false);
            return;
        }
        
        // Get student_ids from faces (Note: DB column is 'person_id', but some older code might use 'student_id')
        const studentIds = (facesData || []).map(f => f.person_id || f.student_id).filter(Boolean);
        
        // Fetch student profiles to get class_id and section_id
        let studentMap = {};
        if (studentIds.length > 0) {
            // First try student_profiles
            const { data: studentsData } = await supabase
                .from('student_profiles')
                .select('id, class_id, section_id')
                .in('id', studentIds);
            
            if (studentsData) {
                studentMap = studentsData.reduce((acc, s) => {
                    acc[s.id] = { class_id: s.class_id, section_id: s.section_id };
                    return acc;
                }, {});
            }
            
            // Also try student_session_assignments for current session (class assignment may be there)
            if (currentSessionId) {
                const { data: assignmentsData } = await supabase
                    .from('student_session_assignments')
                    .select('student_id, class_id, section_id')
                    .eq('session_id', currentSessionId)
                    .in('student_id', studentIds);
                
                if (assignmentsData) {
                    assignmentsData.forEach(a => {
                        // Override with session assignment data (more current)
                        if (a.class_id) {
                            studentMap[a.student_id] = {
                                ...studentMap[a.student_id],
                                class_id: a.class_id,
                                section_id: a.section_id || studentMap[a.student_id]?.section_id
                            };
                        }
                    });
                }
            }
            
            console.log('[LiveAttendance] Student map:', Object.keys(studentMap).length, 'entries');
        }
        
        // Convert encoding vectors to proper Float32Arrays
        // Handle: Array, Object with numbered keys, JSON string
        const processedFaces = (facesData || []).map(face => {
            const studentId = face.person_id || face.student_id;
            let descriptor = null;
            const vec = face.encoding_vector;
            
            if (vec) {
                try {
                    if (Array.isArray(vec)) {
                        descriptor = new Float32Array(vec);
                    } else if (typeof vec === 'string') {
                        descriptor = new Float32Array(JSON.parse(vec));
                    } else if (typeof vec === 'object') {
                        // Object with numbered keys like {0: val, 1: val, ...}
                        descriptor = new Float32Array(Object.values(vec));
                    }
                    console.log(`[LiveAttendance] Face ${studentId}: descriptor length = ${descriptor?.length}`);
                } catch (e) {
                    console.error(`[LiveAttendance] Failed to parse descriptor for ${studentId}:`, e);
                }
            }
            
            // Add class_id and section_id from student_profiles
            const studentInfo = studentMap[studentId] || {};
            
            return { 
                ...face, 
                student_id: studentId, // Ensure uniform access later
                descriptor, 
                class_id: studentInfo.class_id, 
                section_id: studentInfo.section_id 
            };
        });
        
        // Filter out faces with invalid descriptors
        const validFaces = processedFaces.filter(f => f.descriptor && f.descriptor.length === 128);
        setRegisteredFaces(validFaces);
        console.log(`[LiveAttendance] Loaded ${validFaces.length} valid registered faces (${processedFaces.length - validFaces.length} invalid)`);
        
        setLoadingFaces(false);
    };
    
    const fetchTodayStats = async () => {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('student_attendance')
            .select('id, status, student_id')
            .eq('branch_id', branchId)
            .eq('date', today);
        
        if (!error && data) {
            setTodayStats({
                total: data.length,
                present: data.filter(a => a.status === 'present').length,
                students: data.length,
                staff: 0
            });
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // CAMERA CONTROLS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const startCamera = async () => {
        try {
            console.log('[LiveAttendance] Starting camera...');
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            };
            
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('[LiveAttendance] Got media stream:', mediaStream);
            setStream(mediaStream);
            setIsScanning(true);
            setCameraError(null);
        } catch (error) {
            console.error('Camera error:', error);
            setCameraError(`Unable to access camera: ${error.message}. Please check permissions.`);
        }
    };
    
    // Connect stream to video element when both are available
    useEffect(() => {
        if (stream && isScanning) {
            // Small delay to ensure video element is rendered
            const connectVideo = () => {
                if (videoRef.current) {
                    console.log('[LiveAttendance] Connecting stream to video element');
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().then(() => {
                        console.log('[LiveAttendance] Video playing!');
                    }).catch(err => {
                        console.error('[LiveAttendance] Video play error:', err);
                    });
                } else {
                    console.log('[LiveAttendance] Video ref not ready, retrying...');
                    setTimeout(connectVideo, 100);
                }
            };
            setTimeout(connectVideo, 50);
        }
    }, [stream, isScanning]);
    
    const stopCamera = () => {
        setIsScanning(false);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // FACE DETECTION LOOP
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    useEffect(() => {
        let animationId;
        let isRunning = true;
        
        const detectAndMatch = async () => {
            if (!isRunning || !videoRef.current || !isScanning || modelsLoading || !areModelsLoaded()) {
                if (isRunning && isScanning) {
                    animationId = requestAnimationFrame(() => setTimeout(detectAndMatch, 200));
                }
                return;
            }
            
            // Check if video is ready
            if (videoRef.current.readyState < 2) {
                console.log('[LiveAttendance] Video not ready yet, waiting...');
                if (isRunning && isScanning) {
                    animationId = requestAnimationFrame(() => setTimeout(detectAndMatch, 200));
                }
                return;
            }
            
            try {
                console.log('[LiveAttendance] Running face detection...');
                const detection = await detectSingleFace(videoRef.current);
                
                if (detection) {
                    const quality = analyzeFaceQuality(detection);
                    setCurrentFace({ detection, quality });
                    
                    // Draw face box
                    drawFaceBox(detection, quality);
                    
                    // Try to match if quality is good enough
                    if (quality.isGood && registeredFaces.length > 0) {
                        const result = findBestMatch(detection.descriptor, registeredFaces, matchThreshold);
                        
                        if (result.match) {
                            setMatchedPerson(result.match);
                            setMatchConfidence(result.confidence);
                            
                            // Auto-mark attendance if enabled
                            if (autoMark && !recentlyMarked.has(result.match.person_id)) {
                                await markAttendance(result.match, result.confidence);
                            }
                        } else {
                            setMatchedPerson(null);
                            setMatchConfidence(0);
                        }
                    }
                } else {
                    setCurrentFace(null);
                    setMatchedPerson(null);
                    setMatchConfidence(0);
                    clearOverlay();
                }
            } catch (error) {
                console.error('Detection error:', error);
            }
            
            if (isRunning && isScanning) {
                animationId = requestAnimationFrame(() => setTimeout(detectAndMatch, 150));
            }
        };
        
        if (isScanning && !modelsLoading) {
            detectAndMatch();
        }
        
        return () => {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, [isScanning, modelsLoading, registeredFaces, autoMark, matchThreshold, recentlyMarked]);
    
    const drawFaceBox = (detection, quality) => {
        if (!overlayCanvasRef.current || !videoRef.current) return;
        
        const canvas = overlayCanvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const box = detection.detection.box;
        
        // Color based on match status
        let color = '#ffff00'; // Yellow - scanning
        if (matchedPerson) {
            color = '#00ff00'; // Green - matched
        } else if (!quality.isGood) {
            color = '#ff0000'; // Red - poor quality
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(canvas.width - box.x - box.width, box.y, box.width, box.height);
        
        // Draw label
        ctx.fillStyle = color;
        ctx.font = 'bold 18px Arial';
        const labelX = canvas.width - box.x - box.width;
        
        if (matchedPerson) {
            ctx.fillText(`✓ ${matchedPerson.person_name}`, labelX, box.y - 10);
            ctx.font = '14px Arial';
            ctx.fillText(`${Math.round(matchConfidence * 100)}% match`, labelX, box.y + box.height + 20);
        } else {
            ctx.fillText('Scanning...', labelX, box.y - 10);
        }
    };
    
    const clearOverlay = () => {
        if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // ATTENDANCE MARKING
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const markAttendance = async (person, confidence) => {
        if (!person || !branchId) return;
        
        // Ensure we have a valid ID
        const personId = person.person_id || person.student_id;
        
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        
        // Add to cooldown set
        setRecentlyMarked(prev => new Set([...prev, personId]));
        
        // Remove from cooldown after timeout
        setTimeout(() => {
            setRecentlyMarked(prev => {
                const next = new Set(prev);
                next.delete(personId);
                return next;
            });
        }, COOLDOWN_MS);
        
        try {
            // Check if already marked today
            const { data: existing, error: checkError } = await supabase
                .from('student_attendance')
                .select('id')
                .eq('branch_id', branchId)
                .eq('student_id', personId)
                .eq('date', today)
                .maybeSingle(); // Use maybeSingle to avoid 406/PGRST116 error if not found
            
            if (checkError) {
                console.error('Error checking existing attendance:', checkError);
            }

            if (existing) {
                // Already marked - add to log but don't insert again
                addToLog(person, 'already', confidence);
                return;
            }
            
            // Mark attendance
            // Format time as HH:MM:SS for PostgreSQL TIME column
            const timeString = now.toTimeString().split(' ')[0]; // "HH:MM:SS"
            
            // Get class_id and section_id from person data (fetched separately from student_profiles)
            const classId = person.class_id;
            const sectionId = person.section_id;
            
            if (!classId) {
                console.error('Missing class_id for student:', personId, '- Student may not have class assigned');
                addToLog(person, 'error', confidence);
                return;
            }
            
            const attendanceData = {
                branch_id: branchId,
                organization_id: organizationId,
                session_id: currentSessionId,
                student_id: personId,
                class_id: classId,
                section_id: sectionId,
                date: today,
                status: 'present',
                check_in_time: timeString,
                marked_by: user?.id || null,
                marked_at: now.toISOString(),
                remark: `AI Face Recognition (${Math.round(confidence * 100)}% confidence)`,
                is_late: now.getHours() >= 9 && now.getMinutes() > 30,
                late_minutes: now.getHours() >= 9 ? Math.max(0, (now.getHours() - 9) * 60 + now.getMinutes() - 30) : 0
            };
            
            const { error } = await supabase
                .from('student_attendance')
                .insert(attendanceData);
            
            if (error) {
                console.error('Attendance error:', error);
                addToLog(person, 'error', confidence);
            } else {
                addToLog(person, 'success', confidence);
                
                // Play sound if enabled
                if (soundEnabled) {
                    playSuccessSound();
                }
                
                // Update stats
                setTodayStats(prev => ({
                    ...prev,
                    total: prev.total + 1,
                    present: prev.present + 1,
                    students: person.person_type === 'student' ? prev.students + 1 : prev.students,
                    staff: person.person_type === 'staff' ? prev.staff + 1 : prev.staff
                }));
                
                toast({
                    title: '✅ Attendance Marked',
                    description: `${person.person_name} - Present`,
                });
            }
        } catch (error) {
            console.error('Mark attendance error:', error);
            addToLog(person, 'error', confidence);
        }
    };
    
    const addToLog = (person, status, confidence) => {
        const logEntry = {
            id: Date.now(),
            person_name: person.person_name,
            person_type: person.person_type,
            confidence: Math.round(confidence * 100),
            status,
            time: new Date().toLocaleTimeString()
        };
        
        setAttendanceLog(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50
    };
    
    const playSuccessSound = () => {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR0tX4na/9OJEwwySJ3f/+SgEAAcPIne//WrCwASM4/d//W7CAAOLone//bDCQAMKYjc//fLCgAKJofc//nRDAAIJIba//jWDQAGIoXa//rbDwAFIITZ//vfEQAEHoPY//zjEwADHILX//3nFQACGoHW//7qFwABGYDV//7tGQAAF3/U///wGwAAFn7T///zHQAAFX3S///2HwAAFHzR///4IQAAE3vQ///6IwAAEnrP///8JQAAEXLO///+JwAAEHHN////KQAAD3DM////KwAADm/L////LQAADW7K////LwAADG3J////MQAAC2zI////MwAACmvH////NQAACWrG////NwAACGnF////OQAABmjE////OwAABWfD////PQAABGXC////PwAAA2TB////QQAAAma/////QwAAAWW+////RQAAAGe8////Rg==');
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch {}
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    if (!hasViewPermission) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
                        <h2 className="text-xl font-semibold">Access Denied</h2>
                        <p className="text-muted-foreground">You don't have permission to view this page.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ScanFace className="w-8 h-8 text-primary" />
                            Live Face Attendance
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            🤖 Real AI-powered face recognition for automatic attendance
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm">
                            {registeredFaces.length} faces registered
                        </Badge>
                        <Badge variant={isScanning ? "default" : "secondary"} className={isScanning ? "bg-green-500 animate-pulse" : ""}>
                            {isScanning ? "🔴 LIVE" : "⏸️ Paused"}
                        </Badge>
                    </div>
                </div>
                
                {/* AI Model Loading */}
                {modelsLoading && (
                    <Alert className="border-blue-500/50 bg-blue-500/5">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <AlertDescription className="text-blue-700">
                            🤖 Loading AI Face Recognition Models... {modelLoadProgress}
                        </AlertDescription>
                    </Alert>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Camera Feed - 2/3 width */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Video className="w-5 h-5" />
                                        Camera Feed
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setSoundEnabled(!soundEnabled)}
                                        >
                                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            variant={isScanning ? "destructive" : "default"}
                                            onClick={isScanning ? stopCamera : startCamera}
                                            disabled={modelsLoading}
                                        >
                                            {isScanning ? (
                                                <><Pause className="w-4 h-4 mr-2" /> Stop</>
                                            ) : (
                                                <><Play className="w-4 h-4 mr-2" /> Start</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
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
                                    ) : !isScanning ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                                            <div className="text-center">
                                                <Camera className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
                                                <p className="text-lg font-medium">Camera Paused</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Click "Start" to begin face scanning
                                                </p>
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
                                                style={{ transform: 'scaleX(-1)' }}
                                                onLoadedData={() => console.log('[Video] Data loaded')}
                                                onPlay={() => console.log('[Video] Playing')}
                                                onError={(e) => console.error('[Video] Error:', e)}
                                            />
                                            <canvas
                                                ref={overlayCanvasRef}
                                                className="absolute inset-0 w-full h-full pointer-events-none"
                                                style={{ transform: 'scaleX(-1)' }}
                                            />
                                            
                                            {/* Match Result Overlay */}
                                            {matchedPerson && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="absolute bottom-4 left-4 right-4 bg-green-500/90 text-white p-4 rounded-xl"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <CheckCircle2 className="w-12 h-12" />
                                                        <div className="flex-1">
                                                            <p className="text-xl font-bold">{matchedPerson.person_name}</p>
                                                            <p className="text-sm opacity-90">
                                                                {matchedPerson.person_type === 'student' ? '🎓 Student' : '💼 Staff'}
                                                                {' • '}
                                                                {Math.round(matchConfidence * 100)}% confidence
                                                            </p>
                                                        </div>
                                                        <Badge className="bg-white text-green-600 text-lg px-4 py-2">
                                                            PRESENT
                                                        </Badge>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                            </CardContent>
                        </Card>
                        
                        {/* Settings */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="autoMark"
                                            checked={autoMark}
                                            onChange={(e) => setAutoMark(e.target.checked)}
                                            className="rounded"
                                        />
                                        <Label htmlFor="autoMark" className="text-sm">Auto-mark attendance</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm">Match threshold:</Label>
                                        <Select value={String(matchThreshold)} onValueChange={(v) => setMatchThreshold(parseFloat(v))}>
                                            <SelectTrigger className="w-24">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0.4">40% (Loose)</SelectItem>
                                                <SelectItem value="0.5">50% (Normal)</SelectItem>
                                                <SelectItem value="0.6">60% (Strict)</SelectItem>
                                                <SelectItem value="0.7">70% (Very Strict)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Right Panel - 1/3 width */}
                    <div className="space-y-4">
                        {/* Today's Stats */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Today's Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-green-500/10 rounded-lg">
                                        <p className="text-3xl font-bold text-green-600">{todayStats.present}</p>
                                        <p className="text-sm text-muted-foreground">Present</p>
                                    </div>
                                    <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                                        <p className="text-3xl font-bold text-blue-600">{todayStats.total}</p>
                                        <p className="text-sm text-muted-foreground">Total</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Live Log */}
                        <Card className="flex-1">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Live Attendance Log
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-80">
                                    <div className="space-y-2">
                                        {attendanceLog.length === 0 ? (
                                            <div className="text-center text-muted-foreground py-8">
                                                <Clock className="w-12 h-12 mx-auto opacity-50 mb-2" />
                                                <p>No attendance marked yet</p>
                                                <p className="text-sm">Start scanning to see entries</p>
                                            </div>
                                        ) : (
                                            attendanceLog.map((log) => (
                                                <motion.div
                                                    key={log.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`flex items-center gap-3 p-2 rounded-lg ${
                                                        log.status === 'success' ? 'bg-green-500/10' :
                                                        log.status === 'already' ? 'bg-yellow-500/10' :
                                                        'bg-red-500/10'
                                                    }`}
                                                >
                                                    {log.status === 'success' ? (
                                                        <UserCheck className="w-5 h-5 text-green-500" />
                                                    ) : log.status === 'already' ? (
                                                        <User className="w-5 h-5 text-yellow-500" />
                                                    ) : (
                                                        <UserX className="w-5 h-5 text-red-500" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{log.person_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {log.confidence}% • {log.time}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {log.status === 'success' ? '✓ Marked' :
                                                         log.status === 'already' ? 'Already' : 'Error'}
                                                    </Badge>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LiveFaceAttendance;
