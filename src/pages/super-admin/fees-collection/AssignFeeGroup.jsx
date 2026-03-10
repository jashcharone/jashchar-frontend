import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Save } from 'lucide-react';

const AssignFeeGroup = () => {
    const { masterId, roleSlug } = useParams();
    const navigate = useNavigate();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    // Dynamic base path for navigation
    const basePath = roleSlug || 'super-admin';

    const [master, setMaster] = useState(null);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [students, setStudents] = useState([]);
    const [filters, setFilters] = useState({ class_id: '', section_id: '', category_id: '', gender: '', is_rte_student: '' });
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.profile?.branch_id || !masterId || !selectedBranch) return;
            setLoading(true);
            const [masterRes, classesRes, sectionsRes, categoriesRes, allocatedRes] = await Promise.all([
                supabase.from('fee_masters').select('*, fee_groups(name), fee_types(name)').eq('id', masterId).single(),
                supabase.from('classes').select('id, name').eq('branch_id', selectedBranch.id),
                supabase.from('sections').select('id, name').eq('branch_id', selectedBranch.id),
                supabase.from('student_categories').select('id, name').eq('branch_id', selectedBranch.id),
                supabase.from('student_fee_allocations').select('student_id').eq('fee_master_id', masterId)
            ]);

            if (masterRes.data) setMaster(masterRes.data);
            if (classesRes.data) setClasses(classesRes.data);
            if (sectionsRes.data) setSections(sectionsRes.data);
            if (categoriesRes.data) setCategories(categoriesRes.data);
            if (allocatedRes.data) setSelectedStudents(new Set(allocatedRes.data.map(a => a.student_id)));
            setLoading(false);
        };
        fetchData();
    }, [user, masterId, selectedBranch]);

    const handleSearch = async () => {
        if (!selectedBranch) return;
        setSearching(true);
        let query = supabase.from('student_profiles')
            .select('id, full_name, school_code, father_name, gender, is_rte_student, category_id, category:student_categories(name)')
            .eq('branch_id', selectedBranch.id)
            .eq('status', 'active');
        
        if (filters.gender) query = query.eq('gender', filters.gender);
        if (filters.class_id) query = query.eq('class_id', filters.class_id);
        if (filters.section_id) query = query.eq('section_id', filters.section_id);
        if (filters.category_id) query = query.eq('category_id', filters.category_id);
        if (filters.is_rte_student) query = query.eq('is_rte_student', filters.is_rte_student === 'yes');

        const { data, error } = await query;
        if (error) toast({ variant: 'destructive', title: 'Error searching students' });
        else setStudents(data || []);
        setSearching(false);
    };
    
    const handleSelectStudent = (studentId, isChecked) => {
        const newSet = new Set(selectedStudents);
        if (isChecked) newSet.add(studentId);
        else newSet.delete(studentId);
        setSelectedStudents(newSet);
    };

    const handleSave = async () => {
        if (!selectedBranch) return;
        setLoading(true);
        const allocations = Array.from(selectedStudents).map(student_id => ({
            branch_id: selectedBranch.id,
            session_id: currentSessionId,
            organization_id: organizationId,
            student_id,
            fee_master_id: masterId
        }));
        
        // First delete all existing allocations for this master id
        // Ideally we should filter by branch_id too, but masterId implies branch if fee_masters has branch_id
        await supabase.from('student_fee_allocations').delete().eq('fee_master_id', masterId);

        // Then insert the new set
        const { error } = await supabase.from('student_fee_allocations').insert(allocations);

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving allocations', description: error.message });
        } else {
            toast({ title: 'Student Allocations Saved!' });
            navigate(`/${basePath}/fees-collection/master`);
        }
        setLoading(false);
    };

    if (loading && !master) return <DashboardLayout><p>Loading...</p></DashboardLayout>;

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-2">Assign/View Student</h1>
            {master && <p className="text-muted-foreground mb-6">Fee Group: {master.fee_groups.name} - {master.fee_types.name}</p>}

            <div className="bg-card p-6 rounded-lg shadow mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                    <div><Label>Class</Label><Select onValueChange={v => setFilters({...filters, class_id: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Section</Label><Select onValueChange={v => setFilters({...filters, section_id: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Category</Label><Select onValueChange={v => setFilters({...filters, category_id: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Gender</Label><Select onValueChange={v => setFilters({...filters, gender: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></div>
                    <div><Label>RTE</Label><Select onValueChange={v => setFilters({...filters, is_rte_student: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                    <Button onClick={handleSearch} disabled={searching}><Search className="mr-2 h-4 w-4" />{searching ? 'Searching...' : 'Search'}</Button>
                </div>
            </div>

            <div className="bg-card p-6 rounded-lg shadow">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-muted-foreground border-b">
                                <th className="p-2"><Checkbox /></th>
                                <th className="p-2">Admission No</th>
                                <th className="p-2">Student Name</th>
                                <th className="p-2">Father Name</th>
                                <th className="p-2">Category</th>
                                <th className="p-2">Gender</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} className="border-b">
                                    <td className="p-2"><Checkbox checked={selectedStudents.has(student.id)} onCheckedChange={c => handleSelectStudent(student.id, c)} /></td>
                                    <td className="p-2">{student.school_code}</td>
                                    <td className="p-2">{student.full_name}</td>
                                    <td className="p-2">{student.father_name}</td>
                                    <td className="p-2">{student.category?.name || 'General'}</td>
                                    <td className="p-2 capitalize">{student.gender}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {students.length === 0 && !searching && <p className="text-center py-8 text-muted-foreground">No students found for selected criteria. Click search to begin.</p>}
                 </div>
                 {students.length > 0 && (
                    <div className="flex justify-end mt-6">
                        <Button onClick={handleSave} disabled={loading}><Save className="mr-2 h-4 w-4" />{loading ? 'Saving...' : 'Save'}</Button>
                    </div>
                 )}
            </div>
        </DashboardLayout>
    );
};

export default AssignFeeGroup;
