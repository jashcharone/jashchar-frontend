import React, { useState, useEffect, useCallback } from 'react';
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
import { Search, Save, Users, ArrowLeft } from 'lucide-react';

const AssignFeeGroup = () => {
    const { masterId: urlMasterId, roleSlug } = useParams();
    const navigate = useNavigate();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const basePath = roleSlug || 'super-admin';

    // Fee group/master selection (when no masterId in URL)
    const [feeGroups, setFeeGroups] = useState([]);
    const [feeMasters, setFeeMasters] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedMasterId, setSelectedMasterId] = useState(urlMasterId || '');

    const activeMasterId = urlMasterId || selectedMasterId;

    const [master, setMaster] = useState(null);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [students, setStudents] = useState([]);
    const [filters, setFilters] = useState({ class_id: '', section_id: '', category_id: '', gender: '', is_rte_student: '' });
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Fetch fee groups when no masterId in URL
    useEffect(() => {
        if (urlMasterId || !selectedBranch) return;
        const fetchFeeGroups = async () => {
            const { data } = await supabase
                .from('fee_groups')
                .select('id, name')
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', currentSessionId)
                .order('name');
            setFeeGroups(data || []);
        };
        fetchFeeGroups();
    }, [urlMasterId, selectedBranch, currentSessionId]);

    // Fetch fee masters when a group is selected
    useEffect(() => {
        if (!selectedGroupId || !selectedBranch) { setFeeMasters([]); return; }
        const fetchFeeMasters = async () => {
            const { data } = await supabase
                .from('fee_masters')
                .select('id, amount, fee_types(name), due_date')
                .eq('fee_group_id', selectedGroupId)
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', currentSessionId)
                .order('created_at');
            setFeeMasters(data || []);
        };
        fetchFeeMasters();
    }, [selectedGroupId, selectedBranch, currentSessionId]);

    // Fetch master details + classes/sections/categories when activeMasterId is set
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedBranch || !activeMasterId) return;
            setLoading(true);
            const [masterRes, classesRes, sectionsRes, categoriesRes, allocatedRes] = await Promise.all([
                supabase.from('fee_masters').select('*, fee_groups(name), fee_types(name)').eq('id', activeMasterId).single(),
                supabase.from('classes').select('id, name').eq('branch_id', selectedBranch.id),
                supabase.from('sections').select('id, name').eq('branch_id', selectedBranch.id),
                supabase.from('student_categories').select('id, name').eq('branch_id', selectedBranch.id),
                supabase.from('student_fee_allocations').select('student_id').eq('fee_master_id', activeMasterId)
            ]);

            if (masterRes.data) setMaster(masterRes.data);
            if (classesRes.data) setClasses(classesRes.data);
            if (sectionsRes.data) setSections(sectionsRes.data);
            if (categoriesRes.data) setCategories(categoriesRes.data);
            if (allocatedRes.data) setSelectedStudents(new Set(allocatedRes.data.map(a => a.student_id)));
            setLoading(false);
        };
        fetchData();
    }, [activeMasterId, selectedBranch]);

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

    const handleSelectAll = (isChecked) => {
        if (isChecked) {
            setSelectedStudents(new Set(students.map(s => s.id)));
        } else {
            setSelectedStudents(new Set());
        }
    };

    const handleSave = async () => {
        if (!selectedBranch || !activeMasterId) return;
        setLoading(true);
        const allocations = Array.from(selectedStudents).map(student_id => ({
            branch_id: selectedBranch.id,
            session_id: currentSessionId,
            organization_id: organizationId,
            student_id,
            fee_master_id: activeMasterId
        }));
        
        await supabase.from('student_fee_allocations').delete()
            .eq('fee_master_id', activeMasterId)
            .eq('branch_id', selectedBranch.id)
            .eq('session_id', currentSessionId);

        const { error } = await supabase.from('student_fee_allocations').insert(allocations);

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving allocations', description: error.message });
        } else {
            toast({ title: 'Student Allocations Saved!' });
            if (urlMasterId) {
                navigate(`/${basePath}/fees-collection/master`);
            }
        }
        setLoading(false);
    };

    const handleBack = () => {
        setSelectedMasterId('');
        setMaster(null);
        setStudents([]);
        setSelectedStudents(new Set());
        setFilters({ class_id: '', section_id: '', category_id: '', gender: '', is_rte_student: '' });
    };

    // Step 1: No masterId — show fee group + master selection
    if (!activeMasterId) {
        return (
            <DashboardLayout>
                <h1 className="text-2xl font-bold mb-2">Assign Fee Group to Students</h1>
                <p className="text-muted-foreground mb-6">Select a Fee Group and Fee Type to assign students</p>

                <div className="bg-card p-6 rounded-lg shadow max-w-2xl">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-base font-medium">Fee Group</Label>
                            <Select value={selectedGroupId} onValueChange={(v) => { setSelectedGroupId(v); setSelectedMasterId(''); }}>
                                <SelectTrigger><SelectValue placeholder="Select Fee Group" /></SelectTrigger>
                                <SelectContent>
                                    {feeGroups.map(g => (
                                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedGroupId && (
                            <div className="space-y-2">
                                <Label className="text-base font-medium">Fee Type (Master)</Label>
                                {feeMasters.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-2">No fee masters found for this group.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {feeMasters.map(m => (
                                            <div
                                                key={m.id}
                                                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => setSelectedMasterId(m.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium">{m.fee_types?.name || 'Unknown'}</p>
                                                        <p className="text-sm text-muted-foreground">Amount: ₹{Number(m.amount || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline">Assign Students →</Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {feeGroups.length === 0 && (
                            <p className="text-center py-8 text-muted-foreground">No fee groups found. Create fee groups first from Fee Master page.</p>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Step 2: masterId available — show student assignment
    if (loading && !master) return <DashboardLayout><p>Loading...</p></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="flex items-center gap-3 mb-2">
                {!urlMasterId && (
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                )}
                <h1 className="text-2xl font-bold">Assign/View Students</h1>
            </div>
            {master && <p className="text-muted-foreground mb-6">Fee Group: {master.fee_groups?.name} — {master.fee_types?.name} (₹{Number(master.amount || 0).toLocaleString()})</p>}

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
                                <th className="p-2"><Checkbox checked={students.length > 0 && selectedStudents.size === students.length} onCheckedChange={handleSelectAll} /></th>
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
                    {students.length === 0 && !searching && <p className="text-center py-8 text-muted-foreground">Use the filters above and click Search to find students.</p>}
                 </div>
                 {students.length > 0 && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-muted-foreground">{selectedStudents.size} of {students.length} students selected</p>
                        <Button onClick={handleSave} disabled={loading || selectedStudents.size === 0}><Save className="mr-2 h-4 w-4" />{loading ? 'Saving...' : `Save (${selectedStudents.size})`}</Button>
                    </div>
                 )}
            </div>
        </DashboardLayout>
    );
};

export default AssignFeeGroup;
