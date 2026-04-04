/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART STUDENT FACE REGISTRATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Face Registration specifically for Students
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';
import { formatDate } from '@/utils/dateUtils';
import { aiEngineApi } from '@/services/aiEngineApi';

import {
    ScanFace, Camera, Users, User, GraduationCap, CheckCircle2, XCircle,
    AlertTriangle, Loader2, RefreshCw, Search, Plus, Trash2, Eye, Upload
} from 'lucide-react';

const SmartStudentFaceRegistration = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalStudents: 0,
        registered: 0,
        pending: 0
    });

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

    // Fetch students
    const fetchStudents = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);

        try {
            let query = supabase
                .from('student_profiles')
                .select('id, full_name, enrollment_id, roll_number, photo_url, class_id, section_id, classes(name), sections(name)')
                .eq('branch_id', branchId)
                .or('status.eq.active,status.is.null');

            if (selectedClass) {
                query = query.eq('class_id', selectedClass);
            }
            if (selectedSection) {
                query = query.eq('section_id', selectedSection);
            }
            if (currentSessionId) {
                query = query.eq('session_id', currentSessionId);
            }

            const { data: studentData, error } = await query.order('full_name');
            if (error) throw error;

            // Fetch face embeddings
            const studentIds = studentData.map(s => s.id);
            const { data: faceData } = await supabase
                .from('face_embeddings')
                .select('person_id')
                .in('person_id', studentIds)
                .eq('person_type', 'student');

            const registeredIds = new Set(faceData?.map(f => f.person_id) || []);

            const studentsWithStatus = studentData.map(student => ({
                ...student,
                hasFace: registeredIds.has(student.id)
            }));

            setStudents(studentsWithStatus);
            setStats({
                totalStudents: studentsWithStatus.length,
                registered: studentsWithStatus.filter(s => s.hasFace).length,
                pending: studentsWithStatus.filter(s => !s.hasFace).length
            });
        } catch (err) {
            console.error('Error fetching students:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load students'
            });
        } finally {
            setLoading(false);
        }
    }, [branchId, selectedClass, selectedSection, currentSessionId]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Filter students by search
    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.enrollment_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll_number?.toString().includes(searchQuery)
    );

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ScanFace className="h-7 w-7 text-blue-600" />
                            Student Face Registration
                        </h1>
                        <p className="text-muted-foreground">Register student faces for AI attendance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1">
                            <Users className="h-4 w-4 mr-1" />
                            {stats.totalStudents} Total
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {stats.registered} Registered
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-yellow-50 text-yellow-700">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {stats.pending} Pending
                        </Badge>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label>Class</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Classes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
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
                                        <SelectValue placeholder="All Sections" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        {sections.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Button onClick={fetchStudents} variant="outline" className="w-full">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Registration Progress</span>
                            <span className="text-sm text-muted-foreground">
                                {stats.registered} / {stats.totalStudents} ({stats.totalStudents > 0 ? Math.round((stats.registered / stats.totalStudents) * 100) : 0}%)
                            </span>
                        </div>
                        <Progress value={stats.totalStudents > 0 ? (stats.registered / stats.totalStudents) * 100 : 0} className="h-2" />
                    </CardContent>
                </Card>

                {/* Students Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Students List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Roll No</TableHead>
                                        <TableHead>Face Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map(student => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                        {student.photo_url ? (
                                                            <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{student.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">{student.enrollment_id}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {student.classes?.name} - {student.sections?.name}
                                            </TableCell>
                                            <TableCell>{student.roll_number || '-'}</TableCell>
                                            <TableCell>
                                                {student.hasFace ? (
                                                    <Badge className="bg-green-500">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Registered
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            // Navigate to face capture for this student
                                                            window.location.href = `/super-admin/attendance/face-registration?studentId=${student.id}`;
                                                        }}
                                                    >
                                                        <Camera className="h-4 w-4 mr-1" />
                                                        {student.hasFace ? 'Update' : 'Register'}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredStudents.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No students found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default SmartStudentFaceRegistration;
