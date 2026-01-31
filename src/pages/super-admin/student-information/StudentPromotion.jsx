import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
    GraduationCap, 
    ArrowRight, 
    CheckCircle, 
    AlertTriangle, 
    Loader2,
    Users,
    ArrowUpRight
} from 'lucide-react';

const StudentPromotion = () => {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // Data states
    const [sessions, setSessions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [targetClasses, setTargetClasses] = useState([]);
    const [targetSections, setTargetSections] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    
    // Filter states
    const [filters, setFilters] = useState({
        current_session: '',
        promote_session: '',
        current_class: '',
        current_section: '',
        promote_class: '',
        promote_section: ''
    });
    
    // Results
    const [promotionResults, setPromotionResults] = useState(null);

    const branchId = user?.profile?.branch_id || selectedBranch?.id;

    // Fetch sessions
    useEffect(() => {
        if (!branchId) return;
        const fetchSessions = async () => {
            try {
                const { data, error } = await supabase
                    .from('sessions')
                    .select('id, name, is_active')
                    .eq('branch_id', branchId)
                    .order('name', { ascending: false });
                
                if (error) throw error;
                setSessions(data || []);
                
                // Auto-select current active session
                const activeSession = data?.find(s => s.is_active);
                if (activeSession) {
                    setFilters(prev => ({ ...prev, current_session: activeSession.id }));
                }
            } catch (error) {
                console.error('Error fetching sessions:', error);
            }
        };
        fetchSessions();
    }, [branchId]);

    // Fetch classes
    useEffect(() => {
        if (!branchId) return;
        const fetchClasses = async () => {
            try {
                const { data, error } = await supabase
                    .from('classes')
                    .select('id, name')
                    .eq('branch_id', branchId)
                    .order('name');
                
                if (error) throw error;
                setClasses(data || []);
                setTargetClasses(data || []);
            } catch (error) {
                console.error('Error fetching classes:', error);
            }
        };
        fetchClasses();
    }, [branchId]);

    // Fetch sections for current class
    useEffect(() => {
        if (!filters.current_class) {
            setSections([]);
            return;
        }
        const fetchSections = async () => {
            try {
                const { data, error } = await supabase
                    .from('class_sections')
                    .select('sections(id, name)')
                    .eq('class_id', filters.current_class);
                
                if (error) throw error;
                setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
            } catch (error) {
                console.error('Error fetching sections:', error);
            }
        };
        fetchSections();
    }, [filters.current_class]);

    // Fetch sections for target class
    useEffect(() => {
        if (!filters.promote_class) {
            setTargetSections([]);
            return;
        }
        const fetchTargetSections = async () => {
            try {
                const { data, error } = await supabase
                    .from('class_sections')
                    .select('sections(id, name)')
                    .eq('class_id', filters.promote_class);
                
                if (error) throw error;
                setTargetSections(data ? data.map(item => item.sections).filter(Boolean) : []);
            } catch (error) {
                console.error('Error fetching target sections:', error);
            }
        };
        fetchTargetSections();
    }, [filters.promote_class]);

    // Search students
    const handleSearch = async () => {
        if (!filters.current_class || !filters.current_session) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select session and class' });
            return;
        }

        setLoading(true);
        setStudents([]);
        setSelectedStudents([]);
        
        try {
            let query = supabase
                .from('student_profiles')
                .select(`
                    id,
                    school_code,
                    roll_number,
                    first_name,
                    last_name,
                    gender,
                    father_name,
                    phone,
                    classes:class_id(id, name),
                    sections:section_id(id, name)
                `)
                .eq('branch_id', branchId)
                .eq('session_id', filters.current_session)  // CRITICAL: Filter by session
                .eq('class_id', filters.current_class)
                .or('is_disabled.is.null,is_disabled.eq.false');  // Only active students
            
            if (filters.current_section) {
                query = query.eq('section_id', filters.current_section);
            }
            
            const { data, error } = await query.order('roll_number', { ascending: true, nullsFirst: false });
            
            if (error) throw error;
            setStudents(data || []);
            
            if (!data || data.length === 0) {
                toast({ title: 'No Students', description: 'No active students found in selected class/session' });
            }
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

    // Promote students
    const handlePromote = async () => {
        if (selectedStudents.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one student' });
            return;
        }
        
        if (!filters.promote_class || !filters.promote_session) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select promotion class and session' });
            return;
        }

        setPromoting(true);
        setProgress(0);
        const results = { success: 0, failed: 0, errors: [] };
        
        try {
            const totalStudents = selectedStudents.length;
            
            for (let i = 0; i < totalStudents; i++) {
                const studentId = selectedStudents[i];
                const student = students.find(s => s.id === studentId);
                
                try {
                    // Update student with new class, section, and session
                    // IMPORTANT: Roll number is reset to NULL - new roll will be assigned in new session
                    const updateData = {
                        class_id: filters.promote_class,
                        session_id: filters.promote_session,
                        roll_number: null,  // Reset roll number for new session - will be re-assigned
                        updated_at: new Date().toISOString()
                    };
                    
                    if (filters.promote_section) {
                        updateData.section_id = filters.promote_section;
                    }
                    
                    const { error } = await supabase
                        .from('student_profiles')
                        .update(updateData)
                        .eq('id', studentId);
                    
                    if (error) throw error;
                    results.success++;
                } catch (err) {
                    results.failed++;
                    results.errors.push({
                        student: `${student?.first_name} ${student?.last_name}`,
                        school_code: student?.school_code,
                        error: err.message
                    });
                }
                
                setProgress(Math.round(((i + 1) / totalStudents) * 100));
            }
            
            setPromotionResults(results);
            
            if (results.success > 0) {
                toast({ 
                    title: 'Promotion Complete', 
                    description: `${results.success} students promoted successfully${results.failed > 0 ? `, ${results.failed} failed` : ''}. Roll numbers will be assigned when editing students.` 
                });
                // Refresh student list
                handleSearch();
            }
        } catch (error) {
            console.error('Promotion error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Promotion process failed' });
        } finally {
            setPromoting(false);
        }
    };

    // Get class name by ID
    const getClassName = (classId) => {
        return classes.find(c => c.id === classId)?.name || 'N/A';
    };

    // Get session name by ID
    const getSessionName = (sessionId) => {
        return sessions.find(s => s.id === sessionId)?.name || 'N/A';
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <GraduationCap className="h-6 w-6" />
                            Student Promotion
                        </h1>
                        <p className="text-muted-foreground">Promote students to next class/session</p>
                    </div>
                </div>

                {/* Filters Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Promotion Settings</CardTitle>
                        <CardDescription>Select current and target class/session for promotion</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Current Selection */}
                            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Current Class
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Current Session *</label>
                                        <Select 
                                            value={filters.current_session} 
                                            onValueChange={(value) => setFilters(prev => ({ ...prev, current_session: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Session" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sessions.map((session) => (
                                                    <SelectItem key={session.id} value={session.id}>
                                                        {session.name} {session.is_active && '(Active)'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Current Class *</label>
                                        <Select 
                                            value={filters.current_class} 
                                            onValueChange={(value) => setFilters(prev => ({ 
                                                ...prev, 
                                                current_class: value, 
                                                current_section: '' 
                                            }))}
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
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Current Section</label>
                                        <Select 
                                            value={filters.current_section} 
                                            onValueChange={(value) => setFilters(prev => ({ 
                                                ...prev, 
                                                current_section: value === 'all' ? '' : value 
                                            }))}
                                            disabled={!filters.current_class}
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
                                </div>
                            </div>

                            {/* Promotion Target */}
                            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <h3 className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <ArrowUpRight className="h-4 w-4" />
                                    Promote To
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Target Session *</label>
                                        <Select 
                                            value={filters.promote_session} 
                                            onValueChange={(value) => setFilters(prev => ({ ...prev, promote_session: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Session" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sessions.map((session) => (
                                                    <SelectItem key={session.id} value={session.id}>
                                                        {session.name} {session.is_active && '(Active)'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Target Class *</label>
                                        <Select 
                                            value={filters.promote_class} 
                                            onValueChange={(value) => setFilters(prev => ({ 
                                                ...prev, 
                                                promote_class: value, 
                                                promote_section: '' 
                                            }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Class" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {targetClasses.map((cls) => (
                                                    <SelectItem key={cls.id} value={cls.id}>
                                                        {cls.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Target Section</label>
                                        <Select 
                                            value={filters.promote_section} 
                                            onValueChange={(value) => setFilters(prev => ({ 
                                                ...prev, 
                                                promote_section: value === 'all' ? '' : value 
                                            }))}
                                            disabled={!filters.promote_class}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Section" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">No Change</SelectItem>
                                                {targetSections.map((sec) => (
                                                    <SelectItem key={sec.id} value={sec.id}>
                                                        {sec.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-center">
                            <Button 
                                onClick={handleSearch} 
                                disabled={loading || !filters.current_class || !filters.current_session}
                                size="lg"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                                Search Students
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Promotion Progress */}
                {promoting && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Promoting students...</span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Promotion Results */}
                {promotionResults && (
                    <Alert className={promotionResults.failed > 0 ? 'border-yellow-500' : 'border-green-500'}>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Promotion Results</AlertTitle>
                        <AlertDescription>
                            <div className="space-y-2">
                                <p>
                                    <span className="text-green-600 font-semibold">{promotionResults.success} students</span> promoted successfully
                                    {promotionResults.failed > 0 && (
                                        <>, <span className="text-red-600 font-semibold">{promotionResults.failed} failed</span></>
                                    )}
                                </p>
                                {promotionResults.errors.length > 0 && (
                                    <div className="mt-2 text-sm">
                                        <p className="font-medium">Errors:</p>
                                        <ul className="list-disc pl-4">
                                            {promotionResults.errors.slice(0, 5).map((err, i) => (
                                                <li key={i}>{err.student} ({err.school_code}): {err.error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Students List */}
                {students.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Students ({students.length})</CardTitle>
                                    <CardDescription>{selectedStudents.length} selected for promotion</CardDescription>
                                </div>
                                <Button 
                                    onClick={handlePromote} 
                                    disabled={selectedStudents.length === 0 || promoting || !filters.promote_class || !filters.promote_session}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {promoting ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4 mr-2" />
                                    )}
                                    Promote {selectedStudents.length} Students
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Promotion Summary */}
                            {selectedStudents.length > 0 && filters.promote_class && (
                                <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                                        <strong>{selectedStudents.length} students</strong> will be promoted from{' '}
                                        <strong>{getClassName(filters.current_class)}</strong> to{' '}
                                        <strong>{getClassName(filters.promote_class)}</strong>{' '}
                                        (Session: {getSessionName(filters.promote_session)})
                                    </AlertDescription>
                                </Alert>
                            )}
                            
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
                                            <TableHead>Admission No</TableHead>
                                            <TableHead>Adm No</TableHead>
                                            <TableHead>Roll</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Gender</TableHead>
                                            <TableHead>Father Name</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Section</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell>
                                                    <Checkbox 
                                                        checked={selectedStudents.includes(student.id)}
                                                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{student.school_code}</TableCell>
                                                <TableCell className="font-mono">{student.roll_number || '-'}</TableCell>
                                                <TableCell>{student.first_name} {student.last_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={student.gender === 'Male' ? 'default' : 'secondary'}>
                                                        {student.gender}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{student.father_name || '-'}</TableCell>
                                                <TableCell>{student.classes?.name || '-'}</TableCell>
                                                <TableCell>{student.sections?.name || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {!loading && students.length === 0 && filters.current_class && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No Students Found</h3>
                            <p className="text-muted-foreground">
                                Select a class and search to view students for promotion
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentPromotion;
