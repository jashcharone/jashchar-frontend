// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - LIVE FACE ATTENDANCE (ENHANCED VERSION)
// Big School Features: Class Mode, Multi-face detection, Real-time stats, Queue management
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

// Real AI Face Recognition
import {
    loadFaceModels,
    areModelsLoaded,
    detectAllFacesWithDescriptors as detectAllFaces,
    getFaceDescriptor,
    stringToDescriptor,
    compareFaces,
    analyzeFaceQuality
} from '@/utils/faceRecognition';

import {
    ScanFace, Camera, Video, VideoOff, Users, User, GraduationCap, Briefcase, CheckCircle2, XCircle,
    AlertTriangle, Loader2, Clock, Calendar, Play, Pause, RefreshCw, Volume2, VolumeX, Settings,
    BarChart3, History, TrendingUp, UserCheck, UserX, Target, Zap, Maximize2, Minimize2, Filter,
    ChevronLeft, ChevronRight, CircleDot, Eye, AlertCircle, Bell, BellOff, ArrowRight, School,
    Shield, Percent, Timer, Activity
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const COOLDOWN_MS = 30000; // 30 second cooldown before re-checking same person
const SCAN_INTERVAL_MS = 200; // Check faces every 200ms

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const LiveFaceAttendance = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const scanLoopRef = useRef(null);
    
    // Camera & AI State
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [modelLoadProgress, setModelLoadProgress] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    
    // Face Data
    const [registeredFaces, setRegisteredFaces] = useState([]);
    const [detectedFaces, setDetectedFaces] = useState([]);
    const [matchedPersons, setMatchedPersons] = useState([]);
    const [recentlyMarked, setRecentlyMarked] = useState(new Set());
    
    // Class Mode - For focused attendance of specific class
    const [classMode, setClassMode] = useState(false);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [classStudents, setClassStudents] = useState([]);
    
    // Settings
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [autoMark, setAutoMark] = useState(true);
    const [matchThreshold, setMatchThreshold] = useState(0.5);
    const [showFullscreen, setShowFullscreen] = useState(false);
    
    // Stats
    const [todayStats, setTodayStats] = useState({ total: 0, present: 0, students: 0, staff: 0 });
    const [classProgress, setClassProgress] = useState({ total: 0, present: 0, percent: 0 });
    const [attendanceLog, setAttendanceLog] = useState([]);
    
    // Permissions
    const hasViewPermission = canView('attendance.live_attendance') || canView('attendance');
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    useEffect(() => {
        const init = async () => {
            try {
                setModelsLoading(true);
                await loadFaceModels((progress) => setModelLoadProgress(progress));
                setModelsLoading(false);
            } catch (error) {
                console.error('AI Models load error:', error);
                setCameraError('Failed to load AI models. Please refresh.');
                setModelsLoading(false);
            }
        };
        init();
        
        return () => {
            if (scanLoopRef.current) clearInterval(scanLoopRef.current);
            stopCamera();
        };
    }, []);
    
    useEffect(() => {
        if (branchId && !modelsLoading) {
            fetchRegisteredFaces();
            fetchClasses();
            fetchTodayStats();
        }
    }, [branchId, modelsLoading, currentSessionId]);
    
    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass);
        } else {
            setSections([]);
            setSelectedSection('');
        }
    }, [selectedClass]);
    
    useEffect(() => {
        if (classMode && selectedClass && selectedSection) {
            fetchClassStudents();
        }
    }, [classMode, selectedClass, selectedSection]);
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const fetchRegisteredFaces = async () => {
        const { data, error } = await supabase
            .from('face_encodings')
            .select('*')
            .eq('branch_id', branchId)
            .eq('is_active', true);
        
        if (error) {
            console.error('Fetch faces error:', error);
            return;
        }
        
        // Parse encoding vectors for comparison
        const parsedFaces = (data || []).map(face => ({
            ...face,
            descriptor: face.encoding_vector ? Array.isArray(face.encoding_vector) ? face.encoding_vector : null : null
        })).filter(f => f.descriptor);
        
        setRegisteredFaces(parsedFaces);
    };
    
    const fetchClasses = async () => {
        const { data } = await supabase
            .from('classes')
            .select('id, name')
            .eq('branch_id', branchId)
            .order('name');
        
        setClasses((data || []).map(c => ({ ...c, class_name: c.name })));
    };
    
    const fetchSections = async (classId) => {
        const { data } = await supabase
            .from('class_sections')
            .select('section_id, sections(id, name)')
            .eq('class_id', classId);
        
        const sectionsList = (data || [])
            .filter(d => d.sections)
            .map(d => ({ id: d.sections.id, section_name: d.sections.name }));
        setSections(sectionsList);
    };
    
    const fetchClassStudents = async () => {
        if (!selectedClass || !selectedSection) return;
        
        // Get students directly by class_id and section_id
        const { data } = await supabase
            .from('student_profiles')
            .select('id, full_name, admission_number, photo_url')
            .eq('branch_id', branchId)
            .eq('class_id', selectedClass)
            .eq('section_id', selectedSection)
            .eq('is_disabled', false)
            .order('full_name');
        
        setClassStudents(data || []);
        
        // Fetch today's attendance for this class
        updateClassProgress();
    };
    
    const fetchTodayStats = async () => {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('student_attendance')
            .select('id, status, student_id')
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId)
            .eq('date', today)
            .eq('status', 'present');
        
        if (!error) {
            setTodayStats(prev => ({
                ...prev,
                present: (data || []).length,
                students: (data || []).length
            }));
        }
    };
    
    const updateClassProgress = async () => {
        if (!selectedClass || !selectedSection) return;
        
        const today = new Date().toISOString().split('T')[0];
        
        const { data: attendanceData } = await supabase
            .from('student_attendance')
            .select('student_id')
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId)
            .eq('class_id', selectedClass)
            .eq('section_id', selectedSection)
            .eq('date', today)
            .eq('status', 'present');
        
        const presentCount = (attendanceData || []).length;
        const totalCount = classStudents.length;
        
        setClassProgress({
            total: totalCount,
            present: presentCount,
            percent: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
        });
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // CAMERA CONTROL
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const startCamera = async () => {
        try {
            setCameraError(null);
            const constraints = {
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            setIsScanning(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }
            
            // Start face detection loop
            startFaceLoop();
        } catch (error) {
            console.error('Camera error:', error);
            setCameraError('Unable to access camera. Check permissions.');
        }
    };
    
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
        if (scanLoopRef.current) {
            clearInterval(scanLoopRef.current);
            scanLoopRef.current = null;
        }
        setIsScanning(false);
        setDetectedFaces([]);
        setMatchedPersons([]);
        clearOverlay();
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // FACE DETECTION LOOP
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const startFaceLoop = () => {
        if (scanLoopRef.current) clearInterval(scanLoopRef.current);
        
        scanLoopRef.current = setInterval(async () => {
            if (!videoRef.current || !areModelsLoaded()) return;
            
            try {
                const detections = await detectAllFaces(videoRef.current);
                setDetectedFaces(detections);
                
                if (detections.length > 0) {
                    const matches = [];
                    
                    for (const detection of detections) {
                        const quality = analyzeFaceQuality(detection);
                        const descriptor = detection.descriptor;
                        
                        let bestMatch = null;
                        let bestConfidence = 0;
                        
                        // Compare with registered faces
                        for (const regFace of registeredFaces) {
                            if (!regFace.descriptor) continue;
                            
                            const confidence = compareFaces(descriptor, regFace.descriptor);
                            if (confidence > matchThreshold && confidence > bestConfidence) {
                                bestMatch = regFace;
                                bestConfidence = confidence;
                            }
                        }
                        
                        matches.push({
                            detection,
                            quality,
                            match: bestMatch,
                            confidence: bestConfidence
                        });
                        
                        // Auto-mark if enabled & matched
                        if (autoMark && bestMatch && bestConfidence > matchThreshold) {
                            const personId = bestMatch.person_id || bestMatch.user_id;
                            if (!recentlyMarked.has(personId)) {
                                // Get class_id and section_id for the matched person
                                await markAttendance(bestMatch, bestConfidence);
                            }
                        }
                    }
                    
                    setMatchedPersons(matches);
                    drawFaceBoxes(matches);
                } else {
                    setMatchedPersons([]);
                    clearOverlay();
                }
            } catch (error) {
                console.error('Face detection error:', error);
            }
        }, SCAN_INTERVAL_MS);
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // DRAWING
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const drawFaceBoxes = (matches) => {
        if (!overlayCanvasRef.current || !videoRef.current) return;
        
        const canvas = overlayCanvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (const { detection, quality, match, confidence } of matches) {
            const box = detection.detection.box;
            const boxX = canvas.width - box.x - box.width; // Mirror flip
            const boxY = box.y;
            
            // Box color based on match status
            const color = match ? '#00ff00' : quality.isGood ? '#ffcc00' : '#ff0000';
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            
            // Draw rounded corners
            const cornerLength = 20;
            ctx.beginPath();
            ctx.moveTo(boxX, boxY + cornerLength);
            ctx.lineTo(boxX, boxY);
            ctx.lineTo(boxX + cornerLength, boxY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(boxX + box.width - cornerLength, boxY);
            ctx.lineTo(boxX + box.width, boxY);
            ctx.lineTo(boxX + box.width, boxY + cornerLength);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(boxX + box.width, boxY + box.height - cornerLength);
            ctx.lineTo(boxX + box.width, boxY + box.height);
            ctx.lineTo(boxX + box.width - cornerLength, boxY + box.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(boxX + cornerLength, boxY + box.height);
            ctx.lineTo(boxX, boxY + box.height);
            ctx.lineTo(boxX, boxY + box.height - cornerLength);
            ctx.stroke();
            
            // Label
            ctx.save();
            const labelX = boxX + box.width / 2;
            ctx.translate(labelX, 0);
            ctx.scale(-1, 1);
            ctx.translate(-labelX, 0);
            
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            
            if (match) {
                const labelText = `✓ ${match.person_name}`;
                const textWidth = ctx.measureText(labelText).width;
                ctx.fillStyle = 'rgba(0, 180, 0, 0.9)';
                ctx.fillRect(labelX - textWidth/2 - 10, boxY - 28, textWidth + 20, 24);
                ctx.fillStyle = '#fff';
                ctx.fillText(labelText, labelX, boxY - 10);
            } else {
                const labelText = quality.isGood ? 'Unknown' : 'Move closer';
                const textWidth = ctx.measureText(labelText).width;
                ctx.fillStyle = quality.isGood ? 'rgba(200, 150, 0, 0.9)' : 'rgba(200, 0, 0, 0.9)';
                ctx.fillRect(labelX - textWidth/2 - 10, boxY - 28, textWidth + 20, 24);
                ctx.fillStyle = '#fff';
                ctx.fillText(labelText, labelX, boxY - 10);
            }
            
            ctx.restore();
            
            // Confidence below
            if (match) {
                ctx.save();
                const confY = boxY + box.height + 20;
                ctx.translate(labelX, 0);
                ctx.scale(-1, 1);
                ctx.translate(-labelX, 0);
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                const confText = `${Math.round(confidence * 100)}%`;
                const confWidth = ctx.measureText(confText).width;
                ctx.fillStyle = 'rgba(0, 180, 0, 0.9)';
                ctx.fillRect(labelX - confWidth/2 - 8, confY - 14, confWidth + 16, 20);
                ctx.fillStyle = '#fff';
                ctx.fillText(confText, confY);
                ctx.restore();
            }
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
        
        const personId = person.person_id || person.user_id;
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        
        // Add to cooldown
        setRecentlyMarked(prev => new Set([...prev, personId]));
        setTimeout(() => {
            setRecentlyMarked(prev => {
                const next = new Set(prev);
                next.delete(personId);
                return next;
            });
        }, COOLDOWN_MS);
        
        try {
            // Check if already marked
            const { data: existing } = await supabase
                .from('student_attendance')
                .select('id')
                .eq('branch_id', branchId)
                .eq('student_id', personId)
                .eq('date', today)
                .maybeSingle();
            
            if (existing) {
                addToLog(person, 'already', confidence);
                return;
            }
            
            // Get student details for class_id and section_id
            let classId = null;
            let sectionId = null;
            
            if (person.person_type === 'student') {
                // First try session assignment
                if (currentSessionId) {
                    const { data: assignment } = await supabase
                        .from('student_session_assignments')
                        .select('class_id, section_id')
                        .eq('student_id', personId)
                        .eq('session_id', currentSessionId)
                        .maybeSingle();
                    
                    if (assignment) {
                        classId = assignment.class_id;
                        sectionId = assignment.section_id;
                    }
                }
                
                // Fallback to student profile
                if (!classId) {
                    const { data: student } = await supabase
                        .from('student_profiles')
                        .select('class_id, section_id')
                        .eq('id', personId)
                        .maybeSingle();
                    
                    if (student) {
                        classId = student.class_id;
                        sectionId = student.section_id;
                    }
                }
            }
            
            if (!classId && person.person_type === 'student') {
                console.error('Missing class_id for student:', personId);
                addToLog(person, 'error', confidence);
                return;
            }
            
            const timeString = now.toTimeString().split(' ')[0];
            
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
                remark: `AI Face Recognition (${Math.round(confidence * 100)}%)`,
                is_late: now.getHours() >= 9 && now.getMinutes() > 30,
                late_minutes: now.getHours() >= 9 ? Math.max(0, (now.getHours() - 9) * 60 + now.getMinutes() - 30) : 0
            };
            
            const { error } = await supabase.from('student_attendance').insert(attendanceData);
            
            if (error) {
                console.error('Attendance error:', error);
                addToLog(person, 'error', confidence);
            } else {
                addToLog(person, 'success', confidence);
                
                if (soundEnabled) playSuccessSound();
                
                setTodayStats(prev => ({
                    ...prev,
                    present: prev.present + 1,
                    students: prev.students + 1
                }));
                
                // Update class progress if in class mode
                if (classMode) {
                    setClassProgress(prev => ({
                        ...prev,
                        present: prev.present + 1,
                        percent: prev.total > 0 ? Math.round(((prev.present + 1) / prev.total) * 100) : 0
                    }));
                }
                
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
        setAttendanceLog(prev => [logEntry, ...prev.slice(0, 99)]);
    };
    
    const playSuccessSound = () => {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR0tX4na/9OJEwwySJ3f/+SgEAAcPIne//WrCwASM4/d//W7CAAOLone//bDCQAMKYjc//fLCgAKJofc//nRDAAIJIba//jWDQAGIoXa//rbDwAFIITZ//vfEQAEHoPY//zjEwADHILX//3nFQACGoHW//7qFwABGYDV//7tGQAAF3/U///wGwAAFn7T///zHQAAFX3S///2HwAAFHzR///4IQAAE3vQ///6IwAAEnrP///8JQAAEXLO///+JwAAEHHN////KQAAD3DM////KwAADm/L////LQAADW7K////LwAADG3J////MQAAC2zI////MwAACmvH////NQAACWrG////NwAACGnF////OQAABmjE////OwAABWfD////PQAABGXC////PwAAA2TB////QQAAAma/////QwAAAWW+////RQAAAGe8////Rg==');
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch {}
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const markedStudentIds = useMemo(() => {
        return new Set(attendanceLog.filter(l => l.status === 'success').map(l => l.person_name));
    }, [attendanceLog]);
    
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
    
    const selectedClassName = classes.find(c => c.id === selectedClass)?.class_name || '';
    const selectedSectionName = sections.find(s => s.id === selectedSection)?.section_name || '';
    
    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <ScanFace className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                            Live Face Attendance
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            🤖 Real AI face recognition • Multi-face detection
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-sm">
                            <Users className="w-3 h-3 mr-1" />
                            {registeredFaces.length} registered
                        </Badge>
                        <Badge 
                            variant={isScanning ? "default" : "secondary"} 
                            className={isScanning ? "bg-green-500 animate-pulse" : ""}
                        >
                            {isScanning ? "🔴 SCANNING" : "⏸️ Paused"}
                        </Badge>
                        {classMode && selectedClass && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <School className="w-3 h-3 mr-1" />
                                {selectedClassName} {selectedSectionName}
                            </Badge>
                        )}
                    </div>
                </div>
                
                {/* AI Loading */}
                {modelsLoading && (
                    <Alert className="border-blue-500/50 bg-blue-500/5">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <AlertDescription className="text-blue-700">
                            🤖 Loading AI Face Recognition Models... {modelLoadProgress}
                        </AlertDescription>
                    </Alert>
                )}
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-green-500/20">
                                    <UserCheck className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-700">{todayStats.present}</p>
                                    <p className="text-xs text-green-600/80">Present Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-500/20">
                                    <Activity className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{detectedFaces.length}</p>
                                    <p className="text-xs text-muted-foreground">Faces in Frame</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/20">
                                    <Target className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{matchedPersons.filter(m => m.match).length}</p>
                                    <p className="text-xs text-muted-foreground">Recognized</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-orange-500/20">
                                    <History className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{attendanceLog.length}</p>
                                    <p className="text-xs text-muted-foreground">Log Entries</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Camera Feed - 2/3 */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Video className="w-5 h-5" />
                                        Camera Feed
                                        {detectedFaces.length > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {detectedFaces.length} face{detectedFaces.length !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setSoundEnabled(!soundEnabled)}
                                            title={soundEnabled ? "Mute" : "Unmute"}
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
                                                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                                                </Button>
                                            </div>
                                        </div>
                                    ) : !isScanning ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                                            <div className="text-center">
                                                <Camera className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
                                                <p className="text-lg font-medium">Camera Ready</p>
                                                <p className="text-sm text-muted-foreground mt-1">Click "Start" to begin scanning</p>
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
                                            <canvas
                                                ref={overlayCanvasRef}
                                                className="absolute inset-0 w-full h-full pointer-events-none"
                                                style={{ transform: 'scaleX(-1)' }}
                                            />
                                            
                                            {/* Multi-face match overlay */}
                                            <AnimatePresence>
                                                {matchedPersons.filter(p => p.match).length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 20 }}
                                                        className="absolute bottom-4 left-4 right-4 bg-green-500/95 text-white p-4 rounded-xl shadow-lg"
                                                    >
                                                        {matchedPersons.filter(p => p.match).length === 1 ? (
                                                            <div className="flex items-center gap-4">
                                                                <CheckCircle2 className="w-10 h-10 flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xl font-bold truncate">
                                                                        {matchedPersons.find(p => p.match)?.match?.person_name}
                                                                    </p>
                                                                    <p className="text-sm opacity-90">
                                                                        {Math.round((matchedPersons.find(p => p.match)?.confidence || 0) * 100)}% confidence
                                                                    </p>
                                                                </div>
                                                                <Badge className="bg-white text-green-600 text-lg px-4 py-2 flex-shrink-0">
                                                                    PRESENT
                                                                </Badge>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Users className="w-6 h-6" />
                                                                    <span className="font-bold">
                                                                        {matchedPersons.filter(p => p.match).length} People Recognized
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                    {matchedPersons.filter(p => p.match).slice(0, 6).map((p, idx) => (
                                                                        <div key={idx} className="flex items-center gap-2 bg-white/20 rounded-lg p-2">
                                                                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                                                            <span className="text-sm truncate">{p.match.person_name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    )}
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                            </CardContent>
                        </Card>
                        
                        {/* Settings & Class Mode */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Settings className="w-4 h-4" /> Settings
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="classMode" className="text-sm font-normal">Class Mode</Label>
                                        <input
                                            type="checkbox"
                                            id="classMode"
                                            checked={classMode}
                                            onChange={(e) => setClassMode(e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                </div>
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
                                        <Label htmlFor="autoMark" className="text-sm">Auto-mark</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm">Threshold:</Label>
                                        <Select value={String(matchThreshold)} onValueChange={(v) => setMatchThreshold(parseFloat(v))}>
                                            <SelectTrigger className="w-28">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0.4">40% Loose</SelectItem>
                                                <SelectItem value="0.5">50% Normal</SelectItem>
                                                <SelectItem value="0.6">60% Strict</SelectItem>
                                                <SelectItem value="0.7">70% Very Strict</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                {/* Class Mode Filters */}
                                {classMode && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex items-center gap-2 mb-3">
                                            <School className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-medium">Class Mode - Focus on specific class</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs mb-1 block">Class</Label>
                                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Class" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {classes.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs mb-1 block">Section</Label>
                                                <Select 
                                                    value={selectedSection} 
                                                    onValueChange={setSelectedSection}
                                                    disabled={!selectedClass}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Section" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {sections.map(s => (
                                                            <SelectItem key={s.id} value={s.id}>{s.section_name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        
                                        {/* Class Progress */}
                                        {selectedClass && selectedSection && (
                                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium">
                                                        {selectedClassName} {selectedSectionName} Progress
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {classProgress.present}/{classProgress.total}
                                                    </span>
                                                </div>
                                                <Progress value={classProgress.percent} className="h-2" />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {classProgress.percent}% students marked present
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Right Panel - 1/3 */}
                    <div className="space-y-4">
                        {/* Live Log */}
                        <Card className="h-fit">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Live Attendance Log
                                    {attendanceLog.length > 0 && (
                                        <Badge variant="secondary" className="ml-auto">{attendanceLog.length}</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px] lg:h-[500px]">
                                    <div className="space-y-2">
                                        {attendanceLog.length === 0 ? (
                                            <div className="text-center text-muted-foreground py-12">
                                                <Clock className="w-12 h-12 mx-auto opacity-50 mb-3" />
                                                <p className="font-medium">No entries yet</p>
                                                <p className="text-sm">Start scanning to see attendance</p>
                                            </div>
                                        ) : (
                                            attendanceLog.map((log) => (
                                                <motion.div
                                                    key={log.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                                                        log.status === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' :
                                                        log.status === 'already' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800' :
                                                        'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                                                    }`}
                                                >
                                                    {log.status === 'success' ? (
                                                        <UserCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                    ) : log.status === 'already' ? (
                                                        <User className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                                    ) : (
                                                        <UserX className="w-5 h-5 text-red-600 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate text-sm">{log.person_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {log.confidence}% • {log.time}
                                                        </p>
                                                    </div>
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-xs flex-shrink-0 ${
                                                            log.status === 'success' ? 'border-green-500 text-green-600' :
                                                            log.status === 'already' ? 'border-yellow-500 text-yellow-600' :
                                                            'border-red-500 text-red-600'
                                                        }`}
                                                    >
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
                        
                        {/* Class Students List (when in class mode) */}
                        {classMode && selectedClass && selectedSection && classStudents.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" />
                                        {selectedClassName} {selectedSectionName} Students
                                        <Badge variant="secondary" className="ml-auto">{classStudents.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[250px]">
                                        <div className="space-y-1">
                                            {classStudents.map((student) => {
                                                const isMarked = markedStudentIds.has(student.full_name);
                                                const hasFaceReg = registeredFaces.some(f => f.person_id === student.id);
                                                
                                                return (
                                                    <div
                                                        key={student.id}
                                                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                                                            isMarked ? 'bg-green-50 dark:bg-green-950/30' : 'hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                                            isMarked ? 'bg-green-500 text-white' : 
                                                            hasFaceReg ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {isMarked ? '✓' : hasFaceReg ? '👤' : '?'}
                                                        </div>
                                                        <span className={`flex-1 truncate ${isMarked ? 'text-green-700 font-medium' : ''}`}>
                                                            {student.full_name}
                                                        </span>
                                                        {!hasFaceReg && (
                                                            <Badge variant="outline" className="text-xs text-orange-500 border-orange-300">
                                                                No Face
                                                            </Badge>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LiveFaceAttendance;
