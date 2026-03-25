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

// AI Engine API for Python-based recognition (ArcFace 512D)
import { aiEngineApi } from '@/services/aiEngineApi';

// WebSocket hook for real-time face recognition (Day 18)
import { useFaceRecognitionWebSocket, captureVideoFrame } from '@/hooks/useFaceRecognitionWebSocket';

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
const SCAN_INTERVAL_MS = 1000; // Check faces every 1s (fast scanning for classroom mode)

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const LiveFaceAttendance = () => {
    const { user, currentSessionId, currentSessionName, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView } = usePermissions();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const scanLoopRef = useRef(null);
    const aiEngineFailuresRef = useRef(0); // consecutive AI engine failures → auto-fallback
    
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
    
    // Class Mode - For focused attendance of specific class (default ON — classroom-only mode)
    const [classMode, setClassMode] = useState(true);
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
    const [showSettings, setShowSettings] = useState(false);
    
    // Current time display
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    // 🚀 AI Engine State (Python backend with ArcFace 512D)
    const [useAIEngine, setUseAIEngine] = useState(true); // Prefer AI Engine
    const [aiEngineAvailable, setAIEngineAvailable] = useState(false);
    const [aiEngineHealthy, setAIEngineHealthy] = useState(false); // Engine running (even if FAISS empty)
    const [aiEngineChecking, setAIEngineChecking] = useState(true);
    const aiEngineAvailableRef = useRef(false);
    aiEngineAvailableRef.current = aiEngineAvailable;
    
    // 🔴 WebSocket State (Real-time recognition - Day 21)
    const [useWebSocket, setUseWebSocket] = useState(false); // Default HTTP polling (more reliable)
    const useWebSocketRef = useRef(false); // Ref so startFaceLoop always reads latest value
    useWebSocketRef.current = useWebSocket;
    const wsFrameIntervalRef = useRef(null);
    const handleWebSocketResultRef = useRef(null);
    
    // WebSocket hook for real-time face recognition
    const ws = useFaceRecognitionWebSocket({
        branchId,
        clientId: `live_attendance_${branchId}`,
        autoConnect: false,
        onResult: (...args) => handleWebSocketResultRef.current?.(...args),
        onError: (error) => {
            console.error('WebSocket error:', error);
        },
        onDisconnect: () => {
            // If WS disconnects while actively scanning, fall back to HTTP polling
            if (isScanning) {
                console.warn('[LiveFace] WebSocket disconnected during scan — falling back to HTTP polling');
                useWebSocketRef.current = false; // Immediately switch ref so startFaceLoop uses HTTP
                setUseWebSocket(false);
                // Clear WS interval and restart in HTTP mode
                if (wsFrameIntervalRef.current) {
                    clearInterval(wsFrameIntervalRef.current);
                    wsFrameIntervalRef.current = null;
                }
                startFaceLoop();
            }
        }
    });
    
    // Stats
    const [todayStats, setTodayStats] = useState({ total: 0, present: 0, students: 0, staff: 0 });
    const [classProgress, setClassProgress] = useState({ total: 0, present: 0, percent: 0 });
    const [attendanceLog, setAttendanceLog] = useState([]);
    
    // Permissions
    const hasViewPermission = canView('attendance.live_attendance') || canView('attendance');
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // WEBSOCKET RESULT HANDLER (Day 21 - Real-time face recognition)
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const handleWebSocketResult = useCallback(async (result) => {
        if (!result.success) return;
        
        // Update detected faces count
        const detectionCount = result.face_count || 0;
        setDetectedFaces(Array(detectionCount).fill({ bbox: null }));
        
        if (result.faces && result.faces.length > 0) {
            // Convert WebSocket results to display format
            const matches = result.faces
                .filter(face => face.recognized)
                .map(face => ({
                    detection: { detection: { box: { x: face.bbox?.[0] || 0, y: face.bbox?.[1] || 0, width: face.bbox?.[2] - face.bbox?.[0] || 100, height: face.bbox?.[3] - face.bbox?.[1] || 100 } } },
                    quality: { isGood: true, score: face.confidence || 0.9 },
                    match: {
                        person_id: face.person_id,
                        person_name: face.person_id, // Will be enriched from local data
                        person_type: 'student' // Default, will be enriched
                    },
                    confidence: face.match_score || 0,
                    bbox: face.bbox
                }));
            
            // Enrich with local data
            for (const m of matches) {
                const localFace = registeredFaces.find(f => f.person_id === m.match.person_id);
                if (localFace) {
                    m.match.person_name = localFace.person_name || localFace.name || m.match.person_id;
                    m.match.person_type = localFace.person_type || 'student';
                }
            }
            
            setMatchedPersons(matches);
            
            // Auto-mark attendance if enabled
            for (const m of matches) {
                if (autoMark && m.confidence > matchThreshold) {
                    const personId = m.match.person_id;
                    if (!recentlyMarked.has(personId)) {
                        await markAttendance(m.match, m.confidence);
                    }
                }
            }
            
            // Draw face boxes on canvas
            drawFaceBoxesFromWs(result.faces);
        } else {
            setMatchedPersons([]);
            clearOverlay();
        }
    }, [registeredFaces, autoMark, matchThreshold, recentlyMarked]);
    handleWebSocketResultRef.current = handleWebSocketResult;
    
    // Draw face boxes from WebSocket results
    const drawFaceBoxesFromWs = useCallback((faces) => {
        if (!overlayCanvasRef.current || !videoRef.current) return;
        
        const canvas = overlayCanvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        // Match canvas to video size
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        faces.forEach(face => {
            if (!face.bbox) return;
            
            const [x1, y1, x2, y2] = face.bbox;
            const width = x2 - x1;
            const height = y2 - y1;
            
            // Draw box
            ctx.strokeStyle = face.recognized ? '#22c55e' : '#ef4444';
            ctx.lineWidth = 3;
            ctx.strokeRect(x1, y1, width, height);
            
            // Draw label
            if (face.recognized && face.person_id) {
                ctx.fillStyle = '#22c55e';
                ctx.font = '14px Inter, sans-serif';
                ctx.fillRect(x1, y1 - 22, width, 22);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(face.person_id, x1 + 4, y1 - 6);
            }
        });
    }, []);
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    useEffect(() => {
        const init = async () => {
            try {
                setModelsLoading(true);
                
                // 🚀 Check AI Engine availability first
                setAIEngineChecking(true);
                try {
                    const health = await aiEngineApi.checkHealth();
                    // Health response: { success, data: { status, models_ready: { face_detector, face_recognizer } } }
                    const modelsReady = health?.data?.models_ready || health?.models_ready;
                    const isHealthy = health?.success && (
                        (modelsReady?.face_detector && modelsReady?.face_recognizer) ||
                        health?.data?.status === 'healthy'
                    );
                    if (isHealthy) {
                        setAIEngineHealthy(true); // Engine is running
                        // Check if FAISS index has any faces enrolled for this branch
                        try {
                            const indexResp = await aiEngineApi.getIndexStatus(branchId);
                            // Backend wraps as { success, data: { total_faces, indexes, branch_index, ... } }
                            const respData = indexResp?.data || indexResp || {};
                            // total_faces is normalized by backend; fallback: extract from indexes
                            let totalFaces = respData.total_faces;
                            if (totalFaces === undefined && respData.indexes) {
                                const bid = branchId || localStorage.getItem('selectedBranchId');
                                const branchIdx = bid
                                    ? respData.indexes.find(i => i.branch_id === bid && !i.class_id)
                                    : null;
                                totalFaces = branchIdx ? (branchIdx.embedding_count || 0)
                                    : respData.indexes.reduce((s, i) => s + (i.embedding_count || 0), 0);
                            }
                            totalFaces = totalFaces || 0;
                            
                            if (totalFaces === 0) {
                                console.log('⚠️ AI Engine healthy but FAISS index empty — click "Sync to AI" to populate');
                                setAIEngineAvailable(false);
                            } else {
                                setAIEngineAvailable(true);
                                console.log(`✅ AI Engine available (ArcFace 512D) — ${totalFaces} faces in FAISS index`);
                            }
                        } catch {
                            // FAISS status check failed, still use AI engine
                            setAIEngineAvailable(true);
                            console.log('✅ AI Engine available (ArcFace 512D - RetinaFace + ArcFace R100)');
                        }
                    }
                } catch (aiError) {
                    console.log('⚠️ AI Engine not available, using browser AI');
                    setAIEngineAvailable(false);
                }
                setAIEngineChecking(false);
                
                // Load browser-based models as fallback
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
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // FIX: Handle video stream assignment after video element is rendered
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (stream && isScanning && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(err => console.error('Video play error:', err));
        }
    }, [stream, isScanning]);
    
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
        // encoding_vector is stored as JSON string "[0.1, 0.2, ...]" - must be parsed
        const parsedFaces = (data || []).map(face => {
            let descriptor = null;
            try {
                if (face.encoding_vector) {
                    const parsed = typeof face.encoding_vector === 'string'
                        ? JSON.parse(face.encoding_vector)
                        : face.encoding_vector;
                    descriptor = Array.isArray(parsed) ? parsed : null;
                }
            } catch (e) {
                // Invalid encoding, skip
            }
            return { ...face, descriptor };
        }); // Keep all faces (AI Engine uses person_id, browser uses descriptor)
        
        setRegisteredFaces(parsedFaces);
        console.log(`[LiveFace] Loaded ${parsedFaces.length} registered faces (${parsedFaces.filter(f => f.descriptor).length} with descriptors)`);
    };
    
    const fetchClasses = async () => {
        // Try current session first; if empty, fall back to any session for this branch
        let query = supabase
            .from('classes')
            .select('id, name')
            .eq('branch_id', branchId);
        if (currentSessionId) query = query.eq('session_id', currentSessionId);
        let { data } = await query.order('name');
        
        if ((!data || data.length === 0) && currentSessionId) {
            // Fallback: load classes from any session for this branch
            const { data: fallback } = await supabase
                .from('classes')
                .select('id, name')
                .eq('branch_id', branchId)
                .order('name');
            data = fallback;
        }
        
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
        
        // Get students by class_id and section_id - try with session first, fallback without
        let query = supabase
            .from('student_profiles')
            .select('id, full_name, admission_number, photo_url')
            .eq('branch_id', branchId)
            .eq('class_id', selectedClass)
            .eq('section_id', selectedSection)
            .eq('is_disabled', false);
        if (currentSessionId) query = query.eq('session_id', currentSessionId);
        let { data } = await query.order('full_name');
        
        if ((!data || data.length === 0) && currentSessionId) {
            // Fallback: load students without session filter (class_id already scopes correctly)
            const { data: fallback } = await supabase
                .from('student_profiles')
                .select('id, full_name, admission_number, photo_url')
                .eq('branch_id', branchId)
                .eq('class_id', selectedClass)
                .eq('section_id', selectedSection)
                .eq('is_disabled', false)
                .order('full_name');
            data = fallback;
        }
        
        setClassStudents(data || []);
        
        // Fetch today's attendance for this class
        updateClassProgress();
    };
    
    const fetchTodayStats = async () => {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch student attendance
        const { data: studentData, error: studentError } = await supabase
            .from('student_attendance')
            .select('id')
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId)
            .eq('date', today)
            .eq('status', 'present');
        
        // Fetch staff attendance
        const { data: staffData, error: staffError } = await supabase
            .from('staff_attendance')
            .select('id')
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId)
            .eq('attendance_date', today)
            .eq('status', 'present');
        
        const studentCount = (!studentError && studentData) ? studentData.length : 0;
        const staffCount = (!staffError && staffData) ? staffData.length : 0;
        
        setTodayStats({
            total: studentCount + staffCount,
            present: studentCount + staffCount,
            students: studentCount,
            staff: staffCount
        });
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // SYNC FACES TO AI ENGINE (Enroll existing face_encodings into FAISS index)
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    const [syncing, setSyncing] = useState(false);
    
    const syncFacesToAIEngine = async () => {
        if (!branchId) return;
        setSyncing(true);
        
        try {
            // Fetch all registered faces with photos (include class_id for sub-index enrollment)
            const { data, error } = await supabase
                .from('face_encodings')
                .select('person_id, person_name, person_type, photo_url, user_id')
                .eq('branch_id', branchId)
                .eq('is_active', true)
                .not('photo_url', 'is', null);
            
            if (error) throw error;
            
            const faces = data || [];
            if (faces.length === 0) {
                toast({ title: '⚠️ No faces to sync', description: 'Register faces first before syncing.' });
                setSyncing(false);
                return;
            }
            
            let successCount = 0;
            let failCount = 0;
            
            // Batch lookup class_id for students from student_profiles
            const studentFaces = faces.filter(f => (f.person_type || 'student') === 'student');
            let classMap = {};
            if (studentFaces.length > 0) {
                const studentIds = studentFaces.map(f => f.user_id || f.person_id).filter(Boolean);
                const { data: profiles } = await supabase
                    .from('student_profiles')
                    .select('id, class_id, section_id')
                    .in('id', studentIds);
                if (profiles) {
                    profiles.forEach(p => { classMap[p.id] = { class_id: p.class_id, section_id: p.section_id }; });
                }
            }

            for (const face of faces) {
                try {
                    const studentInfo = classMap[face.user_id || face.person_id] || {};
                    await aiEngineApi.enrollFace(
                        face.person_id,
                        face.person_type || 'student',
                        face.person_name,
                        face.photo_url, // base64 image stored in DB
                        branchId,
                        { classId: studentInfo.class_id, sectionId: studentInfo.section_id }
                    );
                    successCount++;
                } catch (err) {
                    console.warn(`[Sync] Failed for ${face.person_name}:`, err.message);
                    failCount++;
                }
            }
            
            toast({
                title: `✅ Sync Complete`,
                description: `${successCount} faces synced to AI Engine${failCount > 0 ? `, ${failCount} failed` : ''}`
            });
            
            // Re-check AI Engine availability after sync
            if (successCount > 0) {
                setAIEngineAvailable(true);
                // Restart scan loop so it picks up AI engine mode
                if (isScanning) startFaceLoop();
            }
            
            // Refresh registered faces
            await fetchRegisteredFaces();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Sync failed', description: err.message });
        }
        
        setSyncing(false);
    };
    
    const updateClassProgress = async () => {        if (!selectedClass || !selectedSection) return;
        
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
        // Clean up WebSocket frame interval
        if (wsFrameIntervalRef.current) {
            clearInterval(wsFrameIntervalRef.current);
            wsFrameIntervalRef.current = null;
        }
        // Disconnect WebSocket
        if (ws.isConnected) {
            ws.disconnect();
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
        if (wsFrameIntervalRef.current) clearInterval(wsFrameIntervalRef.current);
        
        // 🔴 WebSocket Mode (Real-time, most efficient) - Day 21
        // Read from ref (not state) so we always see the latest value, even in callbacks
        if (useWebSocketRef.current && aiEngineAvailableRef.current) {
            // Connect to WebSocket if not already connected
            if (!ws.isConnected) {
                ws.connect();
            }
            
            // Send frames at ~5 FPS via WebSocket
            // Note: don't check ws.isConnected here (stale closure) — sendFrame() does the readyState check
            wsFrameIntervalRef.current = setInterval(() => {
                if (!videoRef.current) return;
                const imageBase64 = captureVideoFrame(videoRef.current);
                if (imageBase64) {
                    const wsClassId = classMode && selectedClass ? selectedClass : null;
                    ws.sendFrame(imageBase64, matchThreshold, wsClassId);
                }
            }, 200); // 5 FPS
            
            return; // WebSocket handles the rest via handleWebSocketResult callback
        }
        
        // 🚀 HTTP Polling Mode (Fallback when WebSocket not available)
        const isRecognizingRef = { current: false };
        scanLoopRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            
            // Skip if a previous recognize request is still in-flight (prevent pile-up)
            if (isRecognizingRef.current) return;
            
            // Skip if models not ready (for browser mode)
            if (!useAIEngine && !aiEngineAvailable && !areModelsLoaded()) return;
            
            isRecognizingRef.current = true;
            try {
                // 🚀 USE AI ENGINE (Python ArcFace 512D) if available
                if (useAIEngine && aiEngineAvailableRef.current) {
                    // Capture frame
                    const imageBase64 = captureVideoFrame(videoRef.current);
                    if (!imageBase64) { isRecognizingRef.current = false; return; }
                    
                    // Call AI Engine recognize endpoint (branch_id sent via context header + body)
                    // Class Mode: pass class_id for class-filtered sub-index search (faster, safer at scale)
                    const classFilterOpts = classMode && selectedClass ? {
                        classId: selectedClass,
                        sectionId: selectedSection || undefined,
                        recognitionMode: 'class'
                    } : { recognitionMode: 'gate' };
                    const result = await aiEngineApi.recognizeFace(imageBase64, matchThreshold, branchId, classFilterOpts);
                    
                    if (result.success) {
                        aiEngineFailuresRef.current = 0; // reset on success
                        // Node.js proxy wraps response as { success, data: {...} }
                        // Python response: { faces_detected, results: [{ status, bbox, confidence, match: { person_id, similarity } }] }
                        const aiData = result.data || result;
                        
                        const detectionCount = aiData.faces_detected || 0;
                        setDetectedFaces(Array(detectionCount).fill({ bbox: null }));
                        
                        // Map Python 'results' array (not 'matches') to display format
                        const allFaceResults = (aiData.results || aiData.matches || []);
                        const matches = allFaceResults.map(result => {
                            // Look up name from local registeredFaces using person_id
                            const localFace = result.match?.person_id
                                ? registeredFaces.find(f => f.person_id === result.match.person_id)
                                : null;
                            const resolvedName = result.match?.person_name
                                || localFace?.person_name
                                || localFace?.name
                                || result.match?.person_id;
                            const resolvedType = result.match?.person_type
                                || localFace?.person_type
                                || 'student';
                            return {
                                detection: { 
                                    detection: { 
                                        box: { 
                                            x: result.bbox?.x || 0, 
                                            y: result.bbox?.y || 0, 
                                            width: result.bbox?.width || 100, 
                                            height: result.bbox?.height || 100 
                                        } 
                                    } 
                                },
                                quality: { isGood: true, score: result.confidence || 0.9 },
                                match: (result.status === 'recognized' && result.match) ? {
                                    person_id: result.match.person_id,
                                    person_name: resolvedName,
                                    person_type: resolvedType
                                } : null,
                                confidence: result.status === 'recognized' ? (result.match?.similarity || result.match?.confidence || 0) : 0
                            };
                        });
                        
                        setMatchedPersons(matches.filter(m => m.match));
                        
                        // Auto-mark if enabled & matched
                        for (const m of matches) {
                            if (autoMark && m.match && m.confidence > matchThreshold) {
                                const personId = m.match.person_id;
                                if (!recentlyMarked.has(personId)) {
                                    await markAttendance(m.match, m.confidence);
                                }
                            }
                        }
                        
                        drawFaceBoxes(matches);
                    } else {
                        aiEngineFailuresRef.current++;
                        if (aiEngineFailuresRef.current >= 3) {
                            console.warn('[LiveFace] AI engine failed 3 times — switching to browser mode');
                            setAIEngineAvailable(false);
                            aiEngineFailuresRef.current = 0;
                        }
                        setDetectedFaces([]);
                        setMatchedPersons([]);
                        clearOverlay();
                    }
                } else {
                    // 🌐 USE BROWSER-BASED face-api.js
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
                            // compareFaces returns Euclidean DISTANCE (lower = more similar)
                            // Convert to confidence: distance 0 = 100%, distance 0.6 = ~50%, distance 1.2+ = 0%
                            for (const regFace of registeredFaces) {
                                if (!regFace.descriptor) continue;
                                
                                const distance = compareFaces(descriptor, regFace.descriptor);
                                const confidence = Math.max(0, 1 - (distance / 1.2)); // 0.0 - 1.0
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
                }
            } catch (error) {
                // AI engine timeout or error — count consecutive failures
                if (useAIEngine && aiEngineAvailable) {
                    aiEngineFailuresRef.current++;
                    if (aiEngineFailuresRef.current >= 3) {
                        console.warn('[LiveFace] AI engine timed out 3 times — switching to browser mode');
                        setAIEngineAvailable(false);
                        aiEngineFailuresRef.current = 0;
                    }
                }
                setDetectedFaces([]);
                setMatchedPersons([]);
                clearOverlay();
            } finally {
                isRecognizingRef.current = false;
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
                ctx.fillText(confText, labelX, confY);
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
        const isStaff = person.person_type === 'staff';

        // Cooldown guard
        setRecentlyMarked(prev => new Set([...prev, personId]));
        setTimeout(() => {
            setRecentlyMarked(prev => {
                const next = new Set(prev);
                next.delete(personId);
                return next;
            });
        }, COOLDOWN_MS);

        try {
            if (isStaff) {
                // STAFF path - uses staff_attendance (no class_id needed)
                const { data: existingStaff } = await supabase
                    .from('staff_attendance')
                    .select('id')
                    .eq('branch_id', branchId)
                    .eq('session_id', currentSessionId)
                    .eq('staff_id', personId)
                    .eq('attendance_date', today)
                    .maybeSingle();

                if (existingStaff) { addToLog(person, 'already', confidence); return; }

                const { error: staffError } = await supabase.from('staff_attendance').insert({
                    branch_id: branchId,
                    organization_id: organizationId,
                    session_id: currentSessionId,
                    staff_id: personId,
                    attendance_date: today,
                    status: 'present',
                    source: 'face_recognition',
                    note: `AI Face Recognition (${Math.round(confidence * 100)}%)`,
                });

                if (staffError) {
                    console.error('[LiveFace] Staff attendance insert error:', staffError);
                    addToLog(person, 'error', confidence);
                } else {
                    addToLog(person, 'success', confidence);
                    if (soundEnabled) playSuccessSound();
                    setTodayStats(prev => ({ ...prev, present: prev.present + 1, staff: prev.staff + 1 }));
                    toast({ title: 'Attendance Marked', description: `${person.person_name} (Staff) - Present` });
                }
                return;
            }

            // STUDENT path - uses student_attendance (class_id NOT NULL)
            const { data: existingStudent } = await supabase
                .from('student_attendance')
                .select('id')
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .eq('student_id', personId)
                .eq('date', today)
                .maybeSingle();

            if (existingStudent) { addToLog(person, 'already', confidence); return; }

            // Fetch class_id and section_id - required by DB NOT NULL constraint
            const { data: studentProfile } = await supabase
                .from('student_profiles')
                .select('class_id, section_id')
                .eq('id', personId)
                .maybeSingle();

            if (!studentProfile?.class_id) {
                // Graceful fallback: person may be registered as student but is actually staff
                // Check employee_profiles — if found, insert into staff_attendance instead
                const { data: empProfile } = await supabase
                    .from('employee_profiles')
                    .select('id, full_name')
                    .eq('id', personId)
                    .maybeSingle();

                if (empProfile) {
                    // Found in employee_profiles — treat as staff
                    const { data: existingEmp } = await supabase
                        .from('staff_attendance')
                        .select('id')
                        .eq('branch_id', branchId)
                        .eq('session_id', currentSessionId)
                        .eq('staff_id', personId)
                        .eq('attendance_date', today)
                        .maybeSingle();

                    if (existingEmp) { addToLog(person, 'already', confidence); return; }

                    const { error: empError } = await supabase.from('staff_attendance').insert({
                        branch_id: branchId,
                        organization_id: organizationId,
                        session_id: currentSessionId,
                        staff_id: personId,
                        attendance_date: today,
                        status: 'present',
                        source: 'face_recognition',
                        note: `AI Face Recognition (${Math.round(confidence * 100)}%) [auto-routed from student]`,
                    });

                    if (empError) {
                        console.error('[LiveFace] Staff fallback insert error:', empError);
                        addToLog(person, 'error', confidence);
                    } else {
                        addToLog({ ...person, person_type: 'staff' }, 'success', confidence);
                        if (soundEnabled) playSuccessSound();
                        setTodayStats(prev => ({ ...prev, present: prev.present + 1, staff: prev.staff + 1 }));
                        toast({ title: 'Attendance Marked', description: `${empProfile.full_name || person.person_name} (Staff) - Present` });
                    }
                    return;
                }

                // No employee record either — truly unassigned
                console.warn('[LiveFace] No class_id for student and not in employee_profiles:', personId);
                toast({ title: 'Attendance Skipped', description: `${person.person_name} has no class assigned`, variant: 'destructive' });
                addToLog(person, 'error', confidence);
                return;
            }

            const timeString = now.toTimeString().split(' ')[0];
            const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

            const { error: studentError } = await supabase.from('student_attendance').insert({
                branch_id: branchId,
                organization_id: organizationId,
                session_id: currentSessionId,
                student_id: personId,
                class_id: studentProfile.class_id,
                section_id: studentProfile.section_id || null,
                date: today,
                status: 'present',
                check_in_time: timeString,
                marked_by: user?.id || null,
                marked_at: now.toISOString(),
                remark: `AI Face Recognition (${Math.round(confidence * 100)}%)`,
                is_late: isLate,
                late_minutes: isLate ? Math.max(0, (now.getHours() - 9) * 60 + now.getMinutes() - 30) : 0,
            });

            if (studentError) {
                console.error('[LiveFace] Student attendance insert error:', studentError);
                addToLog(person, 'error', confidence);
            } else {
                addToLog(person, 'success', confidence);
                if (soundEnabled) playSuccessSound();
                setTodayStats(prev => ({ ...prev, present: prev.present + 1, students: prev.students + 1 }));
                if (classMode) {
                    setClassProgress(prev => ({
                        ...prev,
                        present: prev.present + 1,
                        percent: prev.total > 0 ? Math.round(((prev.present + 1) / prev.total) * 100) : 0
                    }));
                }
                toast({ title: 'Attendance Marked', description: `${person.person_name} - Present` });
            }
        } catch (error) {
            console.error('[LiveFace] Mark attendance error:', error);
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
            // Use Web Audio API to generate beep — avoids CSP data: URI restriction
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);          // A5
            oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);  // ~C#6
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.25);
            oscillator.onended = () => ctx.close();
        } catch {}
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    
    const markedStudentIds = useMemo(() => {
        return new Set(attendanceLog.filter(l => l.status === 'success').map(l => l.person_name));
    }, [attendanceLog]);
    
    // Deduplicate matched persons by person_id (AI may detect same face multiple times in frame)
    const uniqueMatchedPersons = useMemo(() => {
        const seen = new Map();
        for (const m of matchedPersons) {
            if (!m.match) continue;
            const pid = m.match.person_id;
            if (!seen.has(pid) || m.confidence > seen.get(pid).confidence) {
                seen.set(pid, m);
            }
        }
        return Array.from(seen.values());
    }, [matchedPersons]);
    
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
    
    if (!branchId || !currentSessionId) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                        <h2 className="text-xl font-semibold">Branch & Session Required</h2>
                        <p className="text-muted-foreground mt-2">
                            {!branchId ? 'Please select a branch first.' : 'Please select an academic session first.'}
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout>
            <div className="p-3 md:p-5 space-y-3">
                
                {/* ══════════════ TOP HERO BAR — Class/Section + Controls ══════════════ */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-800 dark:via-purple-900 dark:to-indigo-950 p-4 md:p-5 shadow-xl">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/15 blur-2xl" />
                    </div>
                    
                    <div className="relative z-10">
                        {/* Row 1: Title + Status + Time */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
                                    <ScanFace className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                                        Live Face Attendance
                                    </h1>
                                    <p className="text-white/60 text-xs md:text-sm">
                                        AI-Powered Real-time Recognition • {selectedBranch?.name || 'Branch'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                                    <Clock className="w-3.5 h-3.5 text-white/70" />
                                    <span className="text-white/90 text-sm font-mono">
                                        {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                                <Badge 
                                    className={`text-xs font-semibold px-3 py-1 ${
                                        isScanning 
                                            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' 
                                            : 'bg-white/20 text-white/80'
                                    }`}
                                >
                                    {isScanning ? "● LIVE" : "○ STANDBY"}
                                </Badge>
                            </div>
                        </div>
                        
                        {/* Row 2: Class + Section Selector (PROMINENT) */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-white/70 text-xs font-medium mb-1.5 block">Select Class</Label>
                                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                                        <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/15 focus:ring-white/30 h-10">
                                            <SelectValue placeholder="Choose class..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-white/70 text-xs font-medium mb-1.5 block">Select Section</Label>
                                    <Select 
                                        value={selectedSection} 
                                        onValueChange={setSelectedSection}
                                        disabled={!selectedClass}
                                    >
                                        <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/15 focus:ring-white/30 h-10 disabled:opacity-40">
                                            <SelectValue placeholder="Choose section..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.section_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            {/* Quick Actions */}
                            <div className="flex items-end gap-2">
                                <Button
                                    variant={isScanning ? "destructive" : "default"}
                                    onClick={isScanning ? stopCamera : startCamera}
                                    disabled={modelsLoading}
                                    className={`h-10 px-5 font-semibold shadow-lg ${
                                        !isScanning ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30' : ''
                                    }`}
                                >
                                    {modelsLoading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
                                    ) : isScanning ? (
                                        <><Pause className="w-4 h-4 mr-2" /> Stop</>
                                    ) : (
                                        <><Play className="w-4 h-4 mr-2" /> Start Camera</>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/10"
                                    title="Settings"
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        
                        {/* Row 3: Class Progress Bar (only when class+section selected) */}
                        {selectedClass && selectedSection && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-white/80 text-sm font-medium flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" />
                                        {selectedClassName} - {selectedSectionName}
                                        <span className="text-white/50 text-xs">({classStudents.length} students)</span>
                                    </span>
                                    <span className="text-white font-bold text-sm">
                                        {classProgress.present}/{classProgress.total} Present
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-emerald-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${classProgress.percent}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                    />
                                </div>
                                <p className="text-white/40 text-xs mt-1">{classProgress.percent}% attendance completed</p>
                            </div>
                        )}
                        
                        {/* Settings Panel (collapsible) */}
                        <AnimatePresence>
                            {showSettings && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="autoMark" checked={autoMark} onChange={(e) => setAutoMark(e.target.checked)} className="rounded" />
                                            <Label htmlFor="autoMark" className="text-white/80 text-xs cursor-pointer">Auto-mark</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-white/60 text-xs">Accuracy:</Label>
                                            <Select value={String(matchThreshold)} onValueChange={(v) => setMatchThreshold(parseFloat(v))}>
                                                <SelectTrigger className="w-28 h-7 bg-white/10 border-white/20 text-white text-xs">
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
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)} className="h-7 text-white/70 hover:text-white hover:bg-white/10 text-xs">
                                                {soundEnabled ? <Volume2 className="w-3 h-3 mr-1" /> : <VolumeX className="w-3 h-3 mr-1" />}
                                                {soundEnabled ? 'Sound ON' : 'Sound OFF'}
                                            </Button>
                                        </div>
                                        {aiEngineHealthy && (
                                            <Button size="sm" variant="ghost" onClick={syncFacesToAIEngine} disabled={syncing}
                                                className="h-7 text-white/70 hover:text-white hover:bg-white/10 text-xs">
                                                {syncing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                                                {syncing ? 'Syncing...' : 'Sync to AI'}
                                            </Button>
                                        )}
                                        <Badge className="bg-white/10 text-white/70 text-xs">
                                            <Users className="w-3 h-3 mr-1" />
                                            {registeredFaces.length} faces enrolled
                                        </Badge>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                
                {/* AI Loading Alert */}
                {modelsLoading && (
                    <Alert className="border-blue-500/50 bg-blue-500/5">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <AlertDescription className="text-blue-700">
                            Loading AI Face Recognition Models... {modelLoadProgress}
                        </AlertDescription>
                    </Alert>
                )}
                
                {/* ══════════════ LIVE STATS STRIP ══════════════ */}
                <div className="grid grid-cols-4 gap-2 md:gap-3">
                    {[
                        { label: 'Present Today', value: classMode && selectedClass && selectedSection ? classProgress.present : todayStats.present, sub: classMode && selectedClass && selectedSection ? `${selectedClassName} ${selectedSectionName}` : (todayStats.staff > 0 ? `${todayStats.students}S + ${todayStats.staff}T` : 'Students'), icon: UserCheck, color: 'emerald', gradient: 'from-emerald-500 to-green-600' },
                        { label: 'Faces Detected', value: detectedFaces.length, sub: 'In Frame Now', icon: Activity, color: 'violet', gradient: 'from-violet-500 to-purple-600' },
                        { label: 'Recognized', value: uniqueMatchedPersons.length, sub: 'Matched Faces', icon: Target, color: 'blue', gradient: 'from-blue-500 to-cyan-600' },
                        { label: 'Log Entries', value: attendanceLog.length, sub: 'This Session', icon: History, color: 'amber', gradient: 'from-amber-500 to-orange-600' }
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-[0.06] dark:opacity-[0.12]`} />
                                <CardContent className="p-3 md:p-4 relative">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 rounded-xl bg-${stat.color}-500/15`}>
                                            <stat.icon className={`h-4 w-4 md:h-5 md:w-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-xl md:text-2xl font-bold text-${stat.color}-700 dark:text-${stat.color}-300 leading-none`}>{stat.value}</p>
                                            <p className="text-[10px] md:text-xs text-muted-foreground truncate mt-0.5">{stat.sub}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
                
                {/* ══════════════ MAIN CONTENT — Camera + Right Panel ══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    
                    {/* Camera Feed — 8/12 columns */}
                    <div className="lg:col-span-8">
                        <Card className="overflow-hidden border-0 shadow-lg">
                            <CardContent className="p-0">
                                <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
                                    {cameraError ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                            <div className="text-center">
                                                <VideoOff className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                                <p className="text-destructive font-medium">{cameraError}</p>
                                                <Button variant="outline" className="mt-4" onClick={startCamera}>
                                                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                                                </Button>
                                            </div>
                                        </div>
                                    ) : !isScanning ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                                            <div className="text-center">
                                                <div className="relative mx-auto mb-5">
                                                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                                        <Camera className="w-10 h-10 text-white/40" />
                                                    </div>
                                                </div>
                                                <p className="text-white/70 text-lg font-medium">Camera Ready</p>
                                                <p className="text-white/40 text-sm mt-1">
                                                    {selectedClass && selectedSection 
                                                        ? `${selectedClassName} ${selectedSectionName} — Click Start to begin`
                                                        : 'Select class & section above, then click Start'}
                                                </p>
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
                                            
                                            {/* Top-left Live badge */}
                                            <div className="absolute top-3 left-3 flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 backdrop-blur-sm shadow-lg">
                                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                    <span className="text-white text-xs font-bold tracking-wider">LIVE</span>
                                                </div>
                                                {detectedFaces.length > 0 && (
                                                    <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                                                        {detectedFaces.length} face{detectedFaces.length !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Top-right class info */}
                                            {selectedClass && selectedSection && (
                                                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
                                                    <span className="text-white/90 text-xs font-medium">{selectedClassName} - {selectedSectionName}</span>
                                                    <span className="text-emerald-400 text-xs ml-2 font-bold">{classProgress.present}/{classProgress.total}</span>
                                                </div>
                                            )}
                                            
                                            {/* Bottom recognition overlay */}
                                            <AnimatePresence>
                                                {uniqueMatchedPersons.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 30 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 30 }}
                                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10 pb-4 px-4"
                                                    >
                                                        {uniqueMatchedPersons.length === 1 ? (
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-2 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                                                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-white text-xl font-bold truncate">
                                                                        {uniqueMatchedPersons[0]?.match?.person_name}
                                                                    </p>
                                                                    <p className="text-white/60 text-sm">
                                                                        {Math.round((uniqueMatchedPersons[0]?.confidence || 0) * 100)}% match
                                                                        {uniqueMatchedPersons[0]?.match?.person_type === 'staff' && ' • Staff'}
                                                                    </p>
                                                                </div>
                                                                <motion.div 
                                                                    initial={{ scale: 0.5 }} 
                                                                    animate={{ scale: 1 }}
                                                                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30"
                                                                >
                                                                    PRESENT ✓
                                                                </motion.div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 text-white">
                                                                    <Users className="w-5 h-5 text-emerald-400" />
                                                                    <span className="font-bold text-sm">
                                                                        {uniqueMatchedPersons.length} People Recognized
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {uniqueMatchedPersons.slice(0, 6).map((p, idx) => (
                                                                        <motion.div 
                                                                            key={idx}
                                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            transition={{ delay: idx * 0.05 }}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30"
                                                                        >
                                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                                            <span className="text-white text-xs font-medium">{p.match.person_name}</span>
                                                                        </motion.div>
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
                            </CardContent>
                        </Card>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    {/* Right Panel — 4/12 columns */}
                    <div className="lg:col-span-4 space-y-3">
                        
                        {/* Class Students List (always show when class selected) */}
                        {selectedClass && selectedSection && classStudents.length > 0 && (
                            <Card className="border-0 shadow-md">
                                <CardHeader className="pb-2 pt-3 px-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4 text-primary" />
                                            {selectedClassName} {selectedSectionName}
                                        </CardTitle>
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="secondary" className="text-xs">{classStudents.length}</Badge>
                                            {classProgress.present > 0 && (
                                                <Badge className="bg-emerald-500 text-white text-xs">{classProgress.present} ✓</Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    <ScrollArea className="h-[220px] lg:h-[260px]">
                                        <div className="space-y-0.5">
                                            {classStudents.map((student, idx) => {
                                                const isMarked = markedStudentIds.has(student.full_name);
                                                const hasFaceReg = registeredFaces.some(f => f.person_id === student.id);
                                                
                                                return (
                                                    <motion.div
                                                        key={student.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: idx * 0.01 }}
                                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                                                            isMarked 
                                                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800' 
                                                                : 'hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                                            isMarked ? 'bg-emerald-500 text-white' : 
                                                            hasFaceReg ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {isMarked ? '✓' : hasFaceReg ? '●' : (idx + 1)}
                                                        </div>
                                                        <span className={`flex-1 truncate text-xs ${isMarked ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : ''}`}>
                                                            {student.full_name}
                                                        </span>
                                                        {!hasFaceReg && !isMarked && (
                                                            <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" title="No face registered" />
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Live Attendance Log */}
                        <Card className="border-0 shadow-md">
                            <CardHeader className="pb-2 pt-3 px-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <History className="w-4 h-4 text-amber-600" />
                                        Live Log
                                    </CardTitle>
                                    {attendanceLog.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">{attendanceLog.length}</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <ScrollArea className={`${selectedClass && selectedSection && classStudents.length > 0 ? 'h-[250px] lg:h-[300px]' : 'h-[400px] lg:h-[560px]'}`}>
                                    <div className="space-y-1.5">
                                        {attendanceLog.length === 0 ? (
                                            <div className="text-center text-muted-foreground py-10">
                                                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                                    <Clock className="w-7 h-7 opacity-40" />
                                                </div>
                                                <p className="font-medium text-sm">No entries yet</p>
                                                <p className="text-xs mt-1">Start scanning to see attendance log</p>
                                            </div>
                                        ) : (
                                            attendanceLog.map((log) => (
                                                <motion.div
                                                    key={log.id}
                                                    initial={{ opacity: 0, x: -15 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors ${
                                                        log.status === 'success' ? 'bg-emerald-50/80 border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-800/50' :
                                                        log.status === 'already' ? 'bg-amber-50/80 border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-800/50' :
                                                        'bg-red-50/80 border-red-200/50 dark:bg-red-950/20 dark:border-red-800/50'
                                                    }`}
                                                >
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                        log.status === 'success' ? 'bg-emerald-500/15' :
                                                        log.status === 'already' ? 'bg-amber-500/15' : 'bg-red-500/15'
                                                    }`}>
                                                        {log.status === 'success' ? (
                                                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                        ) : log.status === 'already' ? (
                                                            <User className="w-3.5 h-3.5 text-amber-600" />
                                                        ) : (
                                                            <UserX className="w-3.5 h-3.5 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate text-xs">{log.person_name}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {log.confidence}% • {log.time}
                                                        </p>
                                                    </div>
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
                                                            log.status === 'success' ? 'border-emerald-400 text-emerald-600' :
                                                            log.status === 'already' ? 'border-amber-400 text-amber-600' :
                                                            'border-red-400 text-red-600'
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
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LiveFaceAttendance;
