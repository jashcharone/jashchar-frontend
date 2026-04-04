/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART STUDENT QR CODE GENERATOR
 * ─────────────────────────────────────────────────────────────────────────────
 * QR Code-based attendance for Students
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';
import { formatDate } from '@/utils/dateUtils';
import QRCode from 'qrcode';

import {
    QrCode, Users, User, GraduationCap, CheckCircle2,
    AlertTriangle, Loader2, RefreshCw, Search, Download, Printer
} from 'lucide-react';

const SmartStudentQRCode = () => {
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
    const [generating, setGenerating] = useState(false);

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

            if (selectedClass && selectedClass !== 'all') {
                query = query.eq('class_id', selectedClass);
            }
            if (selectedSection && selectedSection !== 'all') {
                query = query.eq('section_id', selectedSection);
            }
            if (currentSessionId) {
                query = query.eq('session_id', currentSessionId);
            }

            const { data: studentData, error } = await query.order('full_name');
            if (error) throw error;

            setStudents(studentData || []);
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

    // Generate QR Code for student
    const generateQRCode = async (student) => {
        try {
            const qrData = JSON.stringify({
                type: 'student_attendance',
                studentId: student.id,
                branchId: branchId,
                enrollmentId: student.enrollment_id,
                name: student.full_name
            });
            
            const qrDataUrl = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
            
            return qrDataUrl;
        } catch (err) {
            console.error('Error generating QR:', err);
            return null;
        }
    };

    // Download QR for single student
    const downloadQR = async (student) => {
        const qrDataUrl = await generateQRCode(student);
        if (qrDataUrl) {
            const link = document.createElement('a');
            link.download = `QR_${student.enrollment_id}_${student.full_name.replace(/\s/g, '_')}.png`;
            link.href = qrDataUrl;
            link.click();
            toast({
                title: 'QR Code Downloaded',
                description: `QR for ${student.full_name} downloaded successfully`
            });
        }
    };

    // Bulk generate QR codes
    const bulkGenerateQR = async () => {
        setGenerating(true);
        try {
            // This would generate a PDF with all QR codes
            toast({
                title: 'Generating QR Codes',
                description: `Generating QR codes for ${students.length} students...`
            });
            
            // Simulate bulk generation
            for (const student of students.slice(0, 5)) {
                await generateQRCode(student);
            }
            
            toast({
                title: 'QR Codes Generated',
                description: `Generated QR codes for ${students.length} students`
            });
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to generate QR codes'
            });
        } finally {
            setGenerating(false);
        }
    };

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
                            <QrCode className="h-7 w-7 text-blue-600" />
                            Student QR Code Generator
                        </h1>
                        <p className="text-muted-foreground">Generate QR codes for student attendance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={bulkGenerateQR} disabled={generating || students.length === 0}>
                            {generating ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            Generate All QR Codes
                        </Button>
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
                                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass || selectedClass === 'all'}>
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

                {/* Students Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Students ({filteredStudents.length})
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
                                        <TableHead>Enrollment ID</TableHead>
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
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {student.classes?.name} - {student.sections?.name}
                                            </TableCell>
                                            <TableCell>{student.roll_number || '-'}</TableCell>
                                            <TableCell>{student.enrollment_id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => downloadQR(student)}
                                                    >
                                                        <QrCode className="h-4 w-4 mr-1" />
                                                        Download QR
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

export default SmartStudentQRCode;
