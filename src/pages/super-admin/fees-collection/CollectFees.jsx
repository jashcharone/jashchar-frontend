import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const CollectFees = () => {
    const navigate = useNavigate();
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = user?.profile?.branch_id;

    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('all');
    const [keyword, setKeyword] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchClasses = useCallback(async () => {
        if (!branchId || !selectedBranch) return;
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('*')
            .eq('branch_id', selectedBranch.id)
            .order('name');
        if (classError) toast({ variant: 'destructive', title: 'Error fetching classes' });
        else setClasses(classData || []);
    }, [branchId, selectedBranch, toast]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    // Fetch sections when selectedClass changes
    useEffect(() => {
        const fetchSections = async () => {
            if (!selectedClass) {
                setSections([]);
                setSelectedSection('all');
                return;
            }
            
            const { data, error } = await supabase
                .from('class_sections')
                .select('sections(id, name)')
                .eq('class_id', selectedClass)
                .order('sections(name)');

            if (error) {
                console.error('Error fetching sections:', error);
                toast({ variant: 'destructive', title: 'Error fetching sections' });
            } else {
                setSections(data.map(item => item.sections).filter(Boolean));
                setSelectedSection('all'); // Reset section selection
            }
        };

        fetchSections();
    }, [selectedClass, toast]);

    const handleSearch = async () => {
        if (!selectedClass) {
            toast({ variant: 'destructive', title: 'Class is required' });
            return;
        }
        if (!currentSessionId) {
            toast({ variant: 'destructive', title: 'No session selected. Please set a current session.' });
            return;
        }
        if (!selectedBranch) {
            toast({ variant: 'destructive', title: 'Branch not selected' });
            return;
        }
        setLoading(true);
        setSearched(true);
        
        try {
            // Use student_profiles directly - it's faster and more reliable
            // Filter by current session
            let query = supabase
                .from('student_profiles')
                .select('id, full_name, father_name, phone, school_code, session_id, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
                .eq('branch_id', selectedBranch.id)
                .eq('class_id', selectedClass)
                .eq('session_id', currentSessionId);

            if (selectedSection && selectedSection !== 'all') {
                query = query.eq('section_id', selectedSection);
            }

            if (keyword) {
                query = query.or(`full_name.ilike.%${keyword}%,school_code.ilike.%${keyword}%`);
            }

            const { data, error } = await query.order('full_name');

            if (error) throw error;
            setStudents(data || []);
        } catch (error) {
            console.error('Search error:', error);
            toast({ variant: 'destructive', title: 'Error searching students', description: error.message });
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Collect Fees</h1>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Select Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center">Class <span className="text-red-500 ml-1">*</span></label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Section</label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Search By Keyword</label>
                            <Input 
                                placeholder="Student Name, Admission No..."
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {searched && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Student List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="p-2 font-medium">Admission No</th>
                                            <th className="p-2 font-medium">Student Name</th>
                                            <th className="p-2 font-medium">Class</th>
                                            <th className="p-2 font-medium">Father Name</th>
                                            <th className="p-2 font-medium">Date of Birth</th>
                                            <th className="p-2 font-medium">Phone</th>
                                            <th className="p-2 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.length > 0 ? students.map(student => (
                                            <tr key={student.id} className="border-b hover:bg-muted/50 transition-colors">
                                                <td className="p-2">{student.school_code || '-'}</td>
                                                <td className="p-2 font-medium">{student.full_name}</td>
                                                <td className="p-2">{student.classes?.name} {student.sections?.name ? `(${student.sections.name})` : ''}</td>
                                                <td className="p-2">{student.father_name || '-'}</td>
                                                <td className="p-2">{student.dob ? format(new Date(student.dob), 'dd-MM-yyyy') : 'N/A'}</td>
                                                <td className="p-2">{student.phone || '-'}</td>
                                                <td className="p-2 text-right">
                                                    <Button size="sm" onClick={() => navigate(`/super-admin/fees-collection/student-fees/${student.id}`)}>
                                                        $ Collect Fees
                                                    </Button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="7" className="p-8 text-center text-muted-foreground">No students found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default CollectFees;
