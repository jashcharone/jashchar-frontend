import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Printer, Search, Eye, Download, Loader2 } from 'lucide-react';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';
import { formatDate } from '@/utils/dateUtils';

const StudentIdCard = () => {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const printRef = useRef(null);
    
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [filters, setFilters] = useState({ class_id: '', section_id: '' });
    const [showPreview, setShowPreview] = useState(false);
    const [branchInfo, setBranchInfo] = useState(null);

    const branchId = user?.profile?.branch_id || selectedBranch?.id;

    // Fetch branch info
    useEffect(() => {
        if (!branchId) return;
        const fetchBranchInfo = async () => {
            const { data, error } = await supabase
                .from('branches')
                .select('*')
                .eq('id', branchId)
                .single();
            
            if (!error && data) {
                setBranchInfo(data);
            }
        };
        fetchBranchInfo();
    }, [branchId]);

    // Fetch classes
    useEffect(() => {
        if (!branchId) return;
        const fetchClasses = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('classes')
                    .select('id, name')
                    .eq('branch_id', branchId);
                
                if (error) throw error;
                setClasses(sortClasses(data || []));
            } catch (error) {
                console.error('Error fetching classes:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch classes' });
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [branchId, toast]);

    // Fetch sections when class is selected
    useEffect(() => {
        if (!filters.class_id) {
            setSections([]);
            return;
        }
        const fetchSections = async () => {
            try {
                const { data, error } = await supabase
                    .from('class_sections')
                    .select('sections(id, name)')
                    .eq('class_id', filters.class_id);
                
                if (error) throw error;
                const sectionsList = data ? data.map(item => item.sections).filter(Boolean) : [];
                setSections(sortSections(sectionsList));
            } catch (error) {
                console.error('Error fetching sections:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch sections' });
            }
        };
        fetchSections();
    }, [filters.class_id, toast]);

    // Fetch students
    const handleSearch = async () => {
        if (!filters.class_id) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a class' });
            return;
        }

        setLoading(true);
        try {
            // FIXED: Using only columns that exist in database
            // present_address is the actual column name (not address)
            let query = supabase
                .from('student_profiles')
                .select(`
                    id,
                    enrollment_id,
                    full_name,
                    first_name,
                    last_name,
                    gender,
                    date_of_birth,
                    blood_group,
                    phone,
                    father_name,
                    mother_name,
                    present_address,
                    permanent_address,
                    city,
                    state,
                    pincode,
                    photo_url,
                    status,
                    session_id,
                    classes:classes!student_profiles_class_id_fkey(id, name),
                    sections:sections!student_profiles_section_id_fkey(id, name)
                `)
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .eq('class_id', filters.class_id)
                .or('status.is.null,status.eq.active');
            
            if (filters.section_id) {
                query = query.eq('section_id', filters.section_id);
            }
            
            const { data, error } = await query.order('full_name');
            
            if (error) throw error;
            setStudents(data || []);
            setSelectedStudents([]);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch students' });
        } finally {
            setLoading(false);
        }
    };

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedStudents(students.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    // Handle individual selection
    const handleSelectStudent = (studentId, checked) => {
        if (checked) {
            setSelectedStudents(prev => [...prev, studentId]);
        } else {
            setSelectedStudents(prev => prev.filter(id => id !== studentId));
        }
    };

    // Print ID cards
    const handlePrint = () => {
        if (selectedStudents.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one student' });
            return;
        }
        setShowPreview(true);
    };

    // Actual print function
    const executePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Student ID Cards</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: Arial, sans-serif; }
                        .id-card-container { display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; justify-content: center; }
                        .id-card { 
                            width: 340px; 
                            height: 220px; 
                            border: 2px solid #1e40af; 
                            border-radius: 12px; 
                            overflow: hidden;
                            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                            page-break-inside: avoid;
                        }
                        .card-header { 
                            background: white; 
                            padding: 8px 12px; 
                            text-align: center; 
                            border-bottom: 3px solid #fbbf24;
                        }
                        .school-name { font-size: 14px; font-weight: bold; color: #1e40af; }
                        .card-body { display: flex; padding: 12px; color: white; }
                        .photo-section { width: 90px; margin-right: 12px; }
                        .photo { 
                            width: 80px; 
                            height: 100px; 
                            border: 3px solid white; 
                            border-radius: 6px; 
                            background: #e5e7eb;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 40px;
                            color: #6b7280;
                        }
                        .info-section { flex: 1; font-size: 11px; }
                        .info-row { display: flex; margin-bottom: 4px; }
                        .info-label { width: 70px; font-weight: bold; }
                        .info-value { flex: 1; }
                        .student-name { font-size: 14px; font-weight: bold; margin-bottom: 6px; }
                        .card-footer { background: rgba(0,0,0,0.2); padding: 6px; text-align: center; font-size: 10px; color: white; }
                        @media print {
                            .id-card { break-inside: avoid; margin-bottom: 20px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="id-card-container">
                        ${printContent.innerHTML}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // Get selected students for preview
    const getSelectedStudentsData = () => {
        return students.filter(s => selectedStudents.includes(s.id));
    };

    // ID Card Component
    const Contact = ({ student }) => {
        // FIXED: Derive name from full_name OR first_name + last_name
        const fullName = student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown';
        const nameParts = fullName.split(' ');
        const initials = nameParts.length >= 2 
            ? `${nameParts[0]?.[0] || ''}${nameParts[nameParts.length - 1]?.[0] || ''}`
            : fullName.substring(0, 2).toUpperCase();
        
        // Get phone number
        const phoneNumber = student.phone || 'N/A';
        
        // Get best available address
        const displayAddress = student.present_address || student.permanent_address || '';
        
        // Get admission number (enrollment_id)
        const enrollmentId = student.enrollment_id || 'N/A';
        
        return (
            <div className="id-card">
                <div className="card-header">
                    <div className="school-name">{branchInfo?.branch_name || branchInfo?.name || 'School Name'}</div>
                </div>
                <div className="card-body">
                    <div className="photo-section">
                        <div className="photo">
                            {student.photo_url ? (
                                <img src={student.photo_url} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : initials}
                        </div>
                    </div>
                    <div className="info-section">
                        <div className="student-name">{fullName}</div>
                        <div className="info-row">
                            <span className="info-label">Enroll ID:</span>
                            <span className="info-value">{enrollmentId}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Class:</span>
                            <span className="info-value">{student.classes?.name || 'N/A'} - {student.sections?.name || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">DOB:</span>
                            <span className="info-value">{student.date_of_birth ? formatDate(student.date_of_birth, 'N/A') : 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Blood:</span>
                            <span className="info-value">{student.blood_group || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Father:</span>
                            <span className="info-value">{student.father_name || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Phone:</span>
                            <span className="info-value">{phoneNumber}</span>
                        </div>
                    </div>
                </div>
                <div className="card-footer">
                    {displayAddress ? `${displayAddress}${student.city ? ', ' + student.city : ''}` : 'Address not provided'}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <CreditCard className="h-6 w-6" />
                            Student ID Card
                        </h1>
                        <p className="text-muted-foreground">Generate and print student ID cards</p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search Students</CardTitle>
                        <CardDescription>Select class and section to find students</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-2 min-w-[200px]">
                                <label className="text-sm font-medium">Class *</label>
                                <Select 
                                    value={filters.class_id} 
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, class_id: value, section_id: '' }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 min-w-[200px]">
                                <label className="text-sm font-medium">Section</label>
                                <Select 
                                    value={filters.section_id} 
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, section_id: value === 'all' ? '' : value }))}
                                    disabled={!filters.class_id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Sections" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id}>
                                                {sec.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleSearch} disabled={loading || !filters.class_id}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Students List */}
                {students.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Students ({students.length})</CardTitle>
                                    <CardDescription>{selectedStudents.length} selected</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        onClick={handlePrint} 
                                        disabled={selectedStudents.length === 0}
                                        variant="default"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview & Print ({selectedStudents.length})
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={selectedStudents.length === students.length && students.length > 0}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead>Photo</TableHead>
                                            <TableHead>Enroll ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Section</TableHead>
                                            <TableHead>Father Name</TableHead>
                                            <TableHead>Phone</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map((student) => {
                                            // FIXED: Derive display name from full_name OR first_name + last_name
                                            const displayName = student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown';
                                            const nameParts = displayName.split(' ');
                                            const initials = nameParts.length >= 2 
                                                ? `${nameParts[0]?.[0] || ''}${nameParts[nameParts.length - 1]?.[0] || ''}`
                                                : displayName.substring(0, 2).toUpperCase();
                                            const phoneNumber = student.phone || '-';
                                            const enrollmentId = student.enrollment_id || '-';
                                            
                                            return (
                                            <TableRow key={student.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedStudents.includes(student.id)}
                                                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={student.photo_url} />
                                                        <AvatarFallback>{initials}</AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{enrollmentId}</Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{displayName}</TableCell>
                                                <TableCell>{student.classes?.name || 'N/A'}</TableCell>
                                                <TableCell>{student.sections?.name || 'N/A'}</TableCell>
                                                <TableCell>{student.father_name || '-'}</TableCell>
                                                <TableCell>{phoneNumber}</TableCell>
                                            </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Preview Modal */}
                {showPreview && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full">
                            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-4 flex justify-between items-center">
                                <h2 className="text-xl font-bold">ID Card Preview ({selectedStudents.length} cards)</h2>
                                <div className="flex gap-2">
                                    <Button onClick={executePrint}>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowPreview(false)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                            <div ref={printRef} className="p-6 flex flex-wrap gap-4 justify-center">
                                {getSelectedStudentsData().map((student) => (
                                    <Contact key={student.id} student={student} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {students.length === 0 && filters.class_id && !loading && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No Students Found</h3>
                            <p className="text-muted-foreground">No students found for the selected class and section</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentIdCard;
