/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART STUDENT LIVE FACE ATTENDANCE
 * ─────────────────────────────────────────────────────────────────────────────
 * AI-powered Live Face Attendance specifically for Students
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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
import { sortClasses, sortSections } from '@/utils/classOrderUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

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

import {
    ScanFace, Camera, Video, VideoOff, Users, User, GraduationCap, CheckCircle2, XCircle,
    AlertTriangle, Loader2, Clock, Calendar, Play, Pause, RefreshCw, Volume2, VolumeX, Settings,
    BarChart3, History, TrendingUp, UserCheck, UserX, Target, Zap, Maximize2, Minimize2, Filter,
    ChevronLeft, ChevronRight, CircleDot, Eye, AlertCircle, Bell, BellOff, ArrowRight, School
} from 'lucide-react';

// Constants
const COOLDOWN_MS = 30000;
const SCAN_INTERVAL_MS = 1000;

const SmartStudentLiveFace = () => {
    const { user, currentSessionId, currentSessionName, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd } = usePermissions();

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

    // Class Selection
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [classStudents, setClassStudents] = useState([]);

    // Stats
    const [stats, setStats] = useState({
        totalRegistered: 0,
        presentToday: 0,
        absentToday: 0,
        recognitionRate: 0
    });

    // Settings
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [autoMark, setAutoMark] = useState(true);
    const [matchThreshold, setMatchThreshold] = useState(0.5);

    // Load classes
    useEffect(() => {
        if (branchId) {
            fetchClasses();
        }
    }, [branchId]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('id, name')
                .eq('branch_id', branchId);
            if (error) throw error;
            setClasses(sortClasses(data || []));
        } catch (err) {
            console.error('Error fetching classes:', err);
        }
    };

    const fetchSections = async (classId) => {
        if (!classId) return;
        try {
            const { data, error } = await supabase
                .from('class_sections')
                .select('sections(id, name)')
                .eq('class_id', classId);
            if (error) throw error;
            const sectionsList = (data || []).map(item => item.sections).filter(Boolean);
            setSections(sortSections(sectionsList));
        } catch (err) {
            console.error('Error fetching sections:', err);
        }
    };

    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass);
            setSelectedSection('');
        } else {
            setSections([]);
        }
    }, [selectedClass]);

    // Load face models
    useEffect(() => {
        const initModels = async () => {
            try {
                setModelLoadProgress('Loading AI models...');
                if (!areModelsLoaded()) {
                    await loadFaceModels();
                }
                setModelLoadProgress('Models loaded successfully');
                setModelsLoading(false);
            } catch (err) {
                console.error('Failed to load face models:', err);
                setModelLoadProgress('Failed to load models');
                toast({
                    variant: 'destructive',
                    title: 'AI Models Failed',
                    description: 'Could not load face recognition models'
                });
            }
        };
        initModels();
    }, []);

    // Fetch registered faces for selected class/section
    const fetchRegisteredFaces = useCallback(async () => {
        if (!branchId || !selectedClass || !selectedSection) return;

        try {
            // Fetch students with face embeddings
            const { data, error } = await supabase
                .from('student_profiles')
                .select('id, full_name, enrollment_id, roll_number, photo_url')
                .eq('branch_id', branchId)
                .eq('class_id', selectedClass)
                .eq('section_id', selectedSection)
                .or('status.eq.active,status.is.null');

            if (error) throw error;

            // Fetch face embeddings
            const studentIds = data.map(s => s.id);
            const { data: faceData, error: faceError } = await supabase
                .from('face_embeddings')
                .select('*')
                .in('person_id', studentIds)
                .eq('person_type', 'student');

            if (faceError) throw faceError;

            const studentsWithFaces = data.map(student => {
                const face = faceData?.find(f => f.person_id === student.id);
                return {
                    ...student,
                    hasFace: !!face,
                    faceEmbedding: face?.embedding_512d || face?.embedding
                };
            });

            setClassStudents(studentsWithFaces);
            setRegisteredFaces(studentsWithFaces.filter(s => s.hasFace));

            setStats(prev => ({
                ...prev,
                totalRegistered: studentsWithFaces.filter(s => s.hasFace).length
            }));
        } catch (err) {
            console.error('Error fetching registered faces:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load student faces'
            });
        }
    }, [branchId, selectedClass, selectedSection]);

    useEffect(() => {
        fetchRegisteredFaces();
    }, [fetchRegisteredFaces]);

    // Camera control
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStream(mediaStream);
            setCameraError(null);
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError('Could not access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsScanning(false);
    };

    // Mark attendance
    const markAttendance = async (student, confidence) => {
        if (!autoMark) return;
        if (recentlyMarked.has(student.id)) return;

        try {
            const today = new Date().toISOString().split('T')[0];

            // Check if already marked
            const { data: existing } = await supabase
                .from('student_attendance')
                .select('id')
                .eq('student_id', student.id)
                .eq('date', today)
                .single();

            if (existing) return;

            // Mark attendance
            const { error } = await supabase
                .from('student_attendance')
                .insert({
                    student_id: student.id,
                    branch_id: branchId,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                    class_id: selectedClass,
                    section_id: selectedSection,
                    date: today,
                    status: 'present',
                    marked_by: 'ai_face_recognition',
                    confidence_score: confidence,
                    marked_at: new Date().toISOString()
                });

            if (error) throw error;

            // Add to recently marked
            setRecentlyMarked(prev => new Set([...prev, student.id]));
            setMatchedPersons(prev => [...prev, { ...student, confidence, time: new Date() }]);

            // Play sound
            if (soundEnabled) {
                const audio = new Audio('/sounds/success.mp3');
                audio.play().catch(() => {});
            }

            toast({
                title: '✓ Attendance Marked',
                description: `${student.full_name} - ${(confidence * 100).toFixed(0)}% match`
            });

            setStats(prev => ({ ...prev, presentToday: prev.presentToday + 1 }));
        } catch (err) {
            console.error('Error marking attendance:', err);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <GraduationCap className="h-7 w-7 text-blue-600" />
                            Smart Student Face Attendance
                        </h1>
                        <p className="text-muted-foreground">AI-powered live face recognition for students</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1">
                            <Users className="h-4 w-4 mr-1" />
                            {registeredFaces.length} Registered
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700">
                            <UserCheck className="h-4 w-4 mr-1" />
                            {stats.presentToday} Present
                        </Badge>
                    </div>
                </div>

                {/* Class/Section Selection */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Select Class & Section
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Class</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Section</Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button onClick={fetchRegisteredFaces} variant="outline" className="w-full">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Load Students
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Camera Feed */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="h-5 w-5" />
                                    Live Camera Feed
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSoundEnabled(!soundEnabled)}
                                    >
                                        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                                    </Button>
                                    {stream ? (
                                        <Button variant="destructive" size="sm" onClick={stopCamera}>
                                            <VideoOff className="h-4 w-4 mr-2" />
                                            Stop
                                        </Button>
                                    ) : (
                                        <Button variant="default" size="sm" onClick={startCamera} disabled={modelsLoading}>
                                            <Video className="h-4 w-4 mr-2" />
                                            Start Camera
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                                {modelsLoading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                        <p>{modelLoadProgress}</p>
                                    </div>
                                ) : cameraError ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400">
                                        <AlertTriangle className="h-8 w-8 mb-2" />
                                        <p>{cameraError}</p>
                                    </div>
                                ) : !stream ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                        <ScanFace className="h-12 w-12 mb-2" />
                                        <p>Click "Start Camera" to begin</p>
                                        <p className="text-sm">Select class & section first</p>
                                    </div>
                                ) : null}
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                    style={{ display: stream ? 'block' : 'none' }}
                                />
                                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student List & Attendance Status */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Students ({classStudents.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-2">
                                    {classStudents.map(student => {
                                        const isMarked = recentlyMarked.has(student.id);
                                        return (
                                            <div
                                                key={student.id}
                                                className={`flex items-center justify-between p-2 rounded-lg border ${
                                                    isMarked ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                        student.hasFace ? 'bg-blue-100' : 'bg-gray-200'
                                                    }`}>
                                                        {student.hasFace ? (
                                                            <ScanFace className="h-4 w-4 text-blue-600" />
                                                        ) : (
                                                            <User className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{student.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">{student.roll_number || student.enrollment_id}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    {isMarked ? (
                                                        <Badge className="bg-green-500">Present</Badge>
                                                    ) : student.hasFace ? (
                                                        <Badge variant="outline">Waiting</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">No Face</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {classStudents.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="h-8 w-8 mx-auto mb-2" />
                                            <p>Select class & section to load students</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Matches */}
                {matchedPersons.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Recent Matches
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {matchedPersons.slice(-10).reverse().map((match, idx) => (
                                    <div key={idx} className="flex-shrink-0 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <p className="font-medium">{match.full_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(match.confidence * 100).toFixed(0)}% match
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SmartStudentLiveFace;
