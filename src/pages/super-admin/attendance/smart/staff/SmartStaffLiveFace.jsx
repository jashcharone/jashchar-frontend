/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART STAFF LIVE FACE ATTENDANCE
 * ─────────────────────────────────────────────────────────────────────────────
 * AI-powered Live Face Attendance specifically for Staff
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

// Real AI Face Recognition
import {
    loadFaceModels,
    areModelsLoaded,
    detectAllFacesWithDescriptors as detectAllFaces,
    analyzeFaceQuality
} from '@/utils/faceRecognition';

import { aiEngineApi } from '@/services/aiEngineApi';

import {
    ScanFace, Camera, Video, VideoOff, Users, User, Briefcase, CheckCircle2, XCircle,
    AlertTriangle, Loader2, Clock, Calendar, Play, Pause, RefreshCw, Volume2, VolumeX, 
    UserCheck, UserX, History, Filter
} from 'lucide-react';

const COOLDOWN_MS = 30000;
const SCAN_INTERVAL_MS = 1000;

const SmartStaffLiveFace = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd } = usePermissions();

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);

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

    // Department Filter
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [staffList, setStaffList] = useState([]);

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

    // Load departments
    useEffect(() => {
        if (branchId) {
            fetchDepartments();
        }
    }, [branchId]);

    const fetchDepartments = async () => {
        try {
            const { data, error } = await supabase
                .from('departments')
                .select('id, name')
                .eq('branch_id', branchId)
                .order('name');
            if (error) throw error;
            setDepartments(data || []);
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    };

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

    // Fetch registered staff faces
    const fetchRegisteredFaces = useCallback(async () => {
        if (!branchId) return;

        try {
            // Fetch staff members
            let query = supabase
                .from('employee_profiles')
                .select('id, full_name, first_name, last_name, employee_id, photo_url, department_id, departments!employee_profiles_department_id_fkey(name)')
                .eq('branch_id', branchId)
                .eq('status', 'Active');

            if (selectedDepartment !== 'all') {
                query = query.eq('department_id', selectedDepartment);
            }

            const { data: staffData, error } = await query.order('full_name');
            if (error) throw error;

            // Fetch face embeddings
            const staffIds = staffData.map(s => s.id);
            const { data: faceData, error: faceError } = await supabase
                .from('face_embeddings')
                .select('*')
                .in('person_id', staffIds)
                .eq('person_type', 'staff');

            if (faceError) throw faceError;

            const staffWithFaces = staffData.map(staff => {
                const face = faceData?.find(f => f.person_id === staff.id);
                return {
                    ...staff,
                    display_name: staff.full_name || [staff.first_name, staff.last_name].filter(Boolean).join(' ') || 'Unknown',
                    hasFace: !!face,
                    faceEmbedding: face?.embedding_512d || face?.embedding
                };
            });

            setStaffList(staffWithFaces);
            setRegisteredFaces(staffWithFaces.filter(s => s.hasFace));

            setStats(prev => ({
                ...prev,
                totalRegistered: staffWithFaces.filter(s => s.hasFace).length
            }));
        } catch (err) {
            console.error('Error fetching registered faces:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load staff faces'
            });
        }
    }, [branchId, selectedDepartment]);

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
    const markAttendance = async (staff, confidence) => {
        if (!autoMark) return;
        if (recentlyMarked.has(staff.id)) return;

        try {
            const today = new Date().toISOString().split('T')[0];

            // Check if already marked
            const { data: existing } = await supabase
                .from('staff_attendance')
                .select('id')
                .eq('staff_id', staff.id)
                .eq('attendance_date', today)
                .single();

            if (existing) return;

            // Mark attendance
            const { error } = await supabase
                .from('staff_attendance')
                .insert({
                    staff_id: staff.id,
                    branch_id: branchId,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                    attendance_date: today,
                    status: 'present',
                    marked_by: 'ai_face_recognition',
                    confidence_score: confidence,
                    check_in_time: new Date().toISOString()
                });

            if (error) throw error;

            // Add to recently marked
            setRecentlyMarked(prev => new Set([...prev, staff.id]));
            setMatchedPersons(prev => [...prev, { ...staff, confidence, time: new Date() }]);

            // Play sound
            if (soundEnabled) {
                const audio = new Audio('/sounds/success.mp3');
                audio.play().catch(() => {});
            }

            toast({
                title: '✓ Attendance Marked',
                description: `${staff.display_name} - ${(confidence * 100).toFixed(0)}% match`
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
                            <Briefcase className="h-7 w-7 text-purple-600" />
                            Smart Staff Face Attendance
                        </h1>
                        <p className="text-muted-foreground">AI-powered live face recognition for staff</p>
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

                {/* Department Filter */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter by Department
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Department</Label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button onClick={fetchRegisteredFaces} variant="outline" className="w-full">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Load Staff
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

                    {/* Staff List & Attendance Status */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Staff ({staffList.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-2">
                                    {staffList.map(staff => {
                                        const isMarked = recentlyMarked.has(staff.id);
                                        return (
                                            <div
                                                key={staff.id}
                                                className={`flex items-center justify-between p-2 rounded-lg border ${
                                                    isMarked ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                        staff.hasFace ? 'bg-purple-100' : 'bg-gray-200'
                                                    }`}>
                                                        {staff.hasFace ? (
                                                            <ScanFace className="h-4 w-4 text-purple-600" />
                                                        ) : (
                                                            <User className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{staff.display_name}</p>
                                                        <p className="text-xs text-muted-foreground">{staff.departments?.name || 'No Dept'}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    {isMarked ? (
                                                        <Badge className="bg-green-500">Present</Badge>
                                                    ) : staff.hasFace ? (
                                                        <Badge variant="outline">Waiting</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">No Face</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {staffList.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="h-8 w-8 mx-auto mb-2" />
                                            <p>Select department or click Load Staff</p>
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
                                        <p className="font-medium">{match.display_name}</p>
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

export default SmartStaffLiveFace;
