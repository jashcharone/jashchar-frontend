import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ROUTES } from '@/registry/routeRegistry';

const StudentDetails = () => {
    const { user, currentSessionId } = useAuth();
    const { canEdit, canDelete } = usePermissions();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [filters, setFilters] = useState({ class_id: '', section_id: '', keyword: '' });
    const [viewMode, setViewMode] = useState('list');
    const [standardFields, setStandardFields] = useState([]);

    const branchId = user?.profile?.branch_id;

    const getFieldConfig = (fieldName) => {
        const field = standardFields.find(f => f.field_name === fieldName);
        // Default to enabled if settings failed to load, for safety
        return field || { is_enabled: true, is_required: false };
    };

    useEffect(() => {
        if (!branchId) return;
        const fetchSettings = async () => {
            try {
                const response = await api.get('/form-settings', {
                     params: { branchId, module: 'student_admission' }
                });
                if (response.data.success) {
                    setStandardFields(response.data.systemFields);
                }
            } catch (error) {
                console.error("Error fetching form settings", error);
            }
        };
        fetchSettings();
    }, [branchId]);

    const handleDelete = async (studentId) => {
        if (!window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;
        
        try {
            const { error } = await supabase.from('student_profiles').delete().eq('id', studentId);
            if (error) throw error;
            
            setStudents(prev => prev.filter(s => s.id !== studentId));
            toast({ title: "Student deleted successfully" });
        } catch (error) {
            console.error("Delete error:", error);
            toast({ variant: "destructive", title: "Error deleting student", description: error.message });
        }
    };

    useEffect(() => {
        if (!branchId || !selectedBranch?.id) return;
        const fetchPrereqs = async () => {
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('id, name')
                .eq('branch_id', selectedBranch.id);
            if (classError) toast({ variant: 'destructive', title: 'Error fetching classes' });
            else setClasses(classData || []);
        };
        fetchPrereqs();
    }, [branchId, selectedBranch, toast]);

    useEffect(() => {
        if (filters.class_id) {
            const fetchSections = async () => {
                const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', filters.class_id);
                setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
            };
            fetchSections();
        } else {
            setSections([]);
        }
    }, [filters.class_id]);

    const handleSearch = async () => {
        if (!filters.class_id) {
            toast({ variant: 'destructive', title: 'Please select a class.' });
            return;
        }
        if (!currentSessionId) {
            toast({ variant: 'destructive', title: 'No session selected. Please set a current session in the header.' });
            return;
        }
        setLoading(true);
        const { data: roleData, error: roleError } = await supabase.from('roles').select('id').eq('name', 'student').eq('branch_id', branchId).maybeSingle();
        if (roleError || !roleData) {
             toast({ variant: 'destructive', title: 'Could not verify student role.'});
             setLoading(false);
             return;
        }

        // Use student_profiles table instead of profiles view to avoid join issues
        // Filter by current session
        let studentQuery = supabase.from('student_profiles').select(`
            id, full_name, school_code, roll_number, gender, dob, phone, photo_url,
            father_name, session_id,
            category:student_categories( name ),
            class:classes!student_profiles_class_id_fkey( name ),
            section:sections!student_profiles_section_id_fkey( name )
        `, { count: 'exact' })
        .eq('branch_id', selectedBranch.id)
        .eq('role_id', roleData.id)
        .eq('class_id', filters.class_id)
        .eq('session_id', currentSessionId); // Filter by current session
        
        if (filters.section_id && filters.section_id !== 'all') {
            studentQuery = studentQuery.eq('section_id', filters.section_id);
        }

        if (filters.keyword) {
            studentQuery = studentQuery.or(`full_name.ilike.%${filters.keyword}%,school_code.ilike.%${filters.keyword}%,roll_number.ilike.%${filters.keyword}%`);
        }

        const { data: studentsData, error: studentsError, count } = await studentQuery;

        if (studentsError) {
            console.error("Student fetch error:", studentsError);
            toast({ variant: 'destructive', title: 'Error fetching students', description: studentsError.message });
            setLoading(false);
            setStudents([]);
            return;
        }
        
        if (studentsData && studentsData.length > 0) {
            toast({ title: `${count || 0} students found.`});
        } else {
            toast({ title: "No students found." });
        }
        
        setStudents(studentsData || []);
        
        setLoading(false);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        if(key === 'class_id') setFilters(prev => ({ ...prev, section_id: ''}));
    };

    const StudentListView = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                    <tr>
                        <th className="p-3">Adm No</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Class</th>
                        {getFieldConfig('father_name').is_enabled && <th className="p-3">Father Name</th>}
                        <th className="p-3">DoB</th>
                        <th className="p-3">Gender</th>
                        {getFieldConfig('category').is_enabled && <th className="p-3">Category</th>}
                        {getFieldConfig('phone').is_enabled && <th className="p-3">Mobile</th>}
                        <th className="p-3">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => (
                        <tr key={s.id} className="border-b">
                            <td className="p-3">{s.school_code}</td>
                            <td className="p-3 font-medium text-primary">{s.full_name}</td>
                            <td className="p-3">{s.roll_number}</td>
                            <td className="p-3">{s.class?.name} ({s.section?.name})</td>
                            {getFieldConfig('father_name').is_enabled && <td className="p-3">{s.father_name}</td>}
                            <td className="p-3">{s.dob ? format(new Date(s.dob), 'dd/MM/yyyy') : ''}</td>
                            <td className="p-3">{s.gender}</td>
                            {getFieldConfig('category').is_enabled && <td className="p-3">{s.category?.name}</td>}
                            {getFieldConfig('phone').is_enabled && <td className="p-3">{s.phone}</td>}
                            <td className="p-3">
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_PROFILE.replace(':studentId', s.id))} title="View Profile">
                                        <Eye className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    {canEdit('student_information.student_details') && (
                                        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.SUPER_ADMIN.EDIT_STUDENT.replace(':id', s.id))} title="Edit Student">
                                            <Edit className="h-4 w-4 text-orange-600" />
                                        </Button>
                                    )}
                                    {canDelete('student_information.student_details') && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} title="Delete Student">
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    const StudentDetailsView = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {students.map(s => (
                <Card key={s.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 p-4 bg-muted/50">
                        <Avatar>
                            <AvatarImage src={s.photo_url} alt={s.full_name} />
                            <AvatarFallback>{s.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base">{s.full_name}</CardTitle>
                            <p className="text-xs text-muted-foreground">Adm No: {s.school_code}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 text-sm space-y-2">
                        <p><strong>Roll No:</strong> {s.roll_number}</p>
                        <p><strong>Class:</strong> {s.class?.name} ({s.section?.name})</p>
                        {getFieldConfig('father_name').is_enabled && <p><strong>Father:</strong> {s.father_name}</p>}
                        {getFieldConfig('phone').is_enabled && <p><strong>Mobile:</strong> {s.phone}</p>}
                    </CardContent>
                    <CardFooter className="p-4 bg-muted/50 flex gap-2">
                        <Button className="flex-1" variant="outline" size="sm" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_PROFILE.replace(':studentId', s.id))}>
                            <Eye className="mr-2 h-4 w-4"/> View
                        </Button>
                        {canEdit('student_information.student_details') && (
                            <Button className="flex-1" variant="outline" size="sm" onClick={() => navigate(ROUTES.SUPER_ADMIN.EDIT_STUDENT.replace(':id', s.id))}>
                                <Edit className="mr-2 h-4 w-4"/> Edit
                            </Button>
                        )}
                        {canDelete('student_information.student_details') && (
                            <Button className="flex-1" variant="destructive" size="sm" onClick={() => handleDelete(s.id)}>
                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Student Details</h1>
            <div className="bg-card p-6 rounded-lg shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div><label className="text-sm">Class *</label><Select value={filters.class_id} onValueChange={v => handleFilterChange('class_id', v)}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><label className="text-sm">Section</label><Select value={filters.section_id} onValueChange={v => handleFilterChange('section_id', v)} disabled={!filters.class_id}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><label className="text-sm">Search by Keyword</label><Input placeholder="Name, Roll No, Adm No..." value={filters.keyword} onChange={e => handleFilterChange('keyword', e.target.value)} /></div>
                    <Button onClick={handleSearch} disabled={loading}><Search className="mr-2 h-4 w-4" />{loading ? 'Searching...' : 'Search'}</Button>
                </div>
            </div>

            {students.length > 0 ? (
                <Tabs value={viewMode} onValueChange={setViewMode}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="list">List View</TabsTrigger>
                        <TabsTrigger value="details">Details View</TabsTrigger>
                    </TabsList>
                    <TabsContent value="list"><Card><CardContent className="p-0">{viewMode === 'list' && <StudentListView />}</CardContent></Card></TabsContent>
                    <TabsContent value="details">{viewMode === 'details' && <StudentDetailsView />}</TabsContent>
                </Tabs>
            ) : !loading && <div className="text-center py-10 text-muted-foreground">No students found for the selected criteria.</div>}
        </DashboardLayout>
    );
};

export default StudentDetails;
