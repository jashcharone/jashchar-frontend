/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART STUDENT CARDS MANAGEMENT
 * ─────────────────────────────────────────────────────────────────────────────
 * ID Card/Smart Card management for Students
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';
import { formatDate } from '@/utils/dateUtils';

import {
    CreditCard, Users, User, GraduationCap, CheckCircle2, XCircle,
    AlertTriangle, Loader2, RefreshCw, Search, Plus, Trash2, Edit
} from 'lucide-react';

const SmartStudentCards = () => {
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
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [cardNumber, setCardNumber] = useState('');

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

    // Fetch students with card info
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

            // Fetch card assignments
            const studentIds = studentData.map(s => s.id);
            const { data: cardData } = await supabase
                .from('attendance_cards')
                .select('*')
                .in('person_id', studentIds)
                .eq('person_type', 'student');

            const studentsWithCards = studentData.map(student => {
                const card = cardData?.find(c => c.person_id === student.id);
                return {
                    ...student,
                    hasCard: !!card,
                    cardNumber: card?.card_number,
                    cardStatus: card?.status || 'unassigned'
                };
            });

            setStudents(studentsWithCards);
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

    // Assign card to student
    const assignCard = async () => {
        if (!selectedStudent || !cardNumber) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please enter a card number'
            });
            return;
        }

        try {
            // Check if card already assigned
            const { data: existing } = await supabase
                .from('attendance_cards')
                .select('id')
                .eq('card_number', cardNumber)
                .single();

            if (existing) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'This card is already assigned to someone else'
                });
                return;
            }

            const { error } = await supabase
                .from('attendance_cards')
                .upsert({
                    card_number: cardNumber,
                    person_id: selectedStudent.id,
                    person_type: 'student',
                    branch_id: branchId,
                    organization_id: organizationId,
                    status: 'active',
                    assigned_at: new Date().toISOString()
                }, { onConflict: 'person_id,person_type' });

            if (error) throw error;

            toast({
                title: 'Card Assigned',
                description: `Card ${cardNumber} assigned to ${selectedStudent.full_name}`
            });

            setAssignDialogOpen(false);
            setCardNumber('');
            setSelectedStudent(null);
            fetchStudents();
        } catch (err) {
            console.error('Error assigning card:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to assign card'
            });
        }
    };

    // Remove card assignment
    const removeCard = async (student) => {
        try {
            const { error } = await supabase
                .from('attendance_cards')
                .delete()
                .eq('person_id', student.id)
                .eq('person_type', 'student');

            if (error) throw error;

            toast({
                title: 'Card Removed',
                description: `Card removed from ${student.full_name}`
            });

            fetchStudents();
        } catch (err) {
            console.error('Error removing card:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to remove card'
            });
        }
    };

    // Filter students by search
    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.enrollment_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cardNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: students.length,
        assigned: students.filter(s => s.hasCard).length,
        unassigned: students.filter(s => !s.hasCard).length
    };

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <CreditCard className="h-7 w-7 text-blue-600" />
                            Student Cards Management
                        </h1>
                        <p className="text-muted-foreground">Manage smart cards for student attendance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1">
                            <Users className="h-4 w-4 mr-1" />
                            {stats.total} Total
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {stats.assigned} Assigned
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-yellow-50 text-yellow-700">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {stats.unassigned} Unassigned
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
                                        placeholder="Search by name, ID, card..."
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
                                        <TableHead>Enrollment ID</TableHead>
                                        <TableHead>Card Number</TableHead>
                                        <TableHead>Status</TableHead>
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
                                            <TableCell>{student.enrollment_id}</TableCell>
                                            <TableCell>
                                                {student.cardNumber || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {student.hasCard ? (
                                                    <Badge className="bg-green-500">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Assigned
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Unassigned
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {student.hasCard ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeCard(student)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Remove
                                                        </Button>
                                                    ) : (
                                                        <Dialog open={assignDialogOpen && selectedStudent?.id === student.id} onOpenChange={(open) => {
                                                            setAssignDialogOpen(open);
                                                            if (open) setSelectedStudent(student);
                                                        }}>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="sm">
                                                                    <Plus className="h-4 w-4 mr-1" />
                                                                    Assign Card
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Assign Card to {student.full_name}</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-4">
                                                                    <div>
                                                                        <Label>Card Number</Label>
                                                                        <Input
                                                                            placeholder="Enter card number or scan"
                                                                            value={cardNumber}
                                                                            onChange={(e) => setCardNumber(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <Button onClick={assignCard} className="w-full">
                                                                        Assign Card
                                                                    </Button>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredStudents.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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

export default SmartStudentCards;
