import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const SearchDueFees = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const branchId = user?.profile?.branch_id;

    const [feeGroups, setFeeGroups] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('all');
    
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchPrerequisites = useCallback(async () => {
        if (!branchId || !selectedBranch) return;
        const [groupsRes, classesRes, sectionsRes] = await Promise.all([
            supabase.from('fee_groups').select('id, name').eq('branch_id', branchId).eq('branch_id', selectedBranch.id),
            supabase.from('classes').select('id, name').eq('branch_id', branchId).eq('branch_id', selectedBranch.id),
            supabase.from('sections').select('id, name').eq('branch_id', branchId).eq('branch_id', selectedBranch.id),
        ]);
        setFeeGroups(groupsRes.data || []);
        setClasses(classesRes.data || []);
        setSections(sectionsRes.data || []);
    }, [branchId, selectedBranch]);

    useEffect(() => {
        fetchPrerequisites();
    }, [fetchPrerequisites]);

    const handleGroupSelect = (groupId) => {
        setSelectedGroups(prev => 
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    const handleSearch = async () => {
        if (selectedGroups.length === 0 || !selectedClass) {
            toast({ variant: 'destructive', title: 'Criteria Missing', description: 'Please select at least one Fees Group and a Class.' });
            return;
        }
        setLoading(true);
        setSearched(true);

        const { data, error } = await supabase.rpc('get_due_fees_students', {
            p_branch_id: branchId,
            p_branch_id: selectedBranch.id,
            p_class_id: selectedClass,
            p_section_id: selectedSection === 'all' ? null : selectedSection,
            p_fee_group_ids: selectedGroups
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Error searching due fees', description: error.message });
            setStudents([]);
        } else {
            setStudents(data);
        }
        
        setLoading(false);
    };

    const handleAddFees = (studentId, feeGroupNames) => {
        navigate(`/super-admin/fees-collection/student-fees/${studentId}`);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Search Due Fees</h1>
            <Card className="mb-6">
                <CardHeader><CardTitle>Select Criteria</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-sm font-medium">Fees Group *</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        {selectedGroups.length > 0 ? `${selectedGroups.length} selected` : "Select Groups"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0">
                                    <ScrollArea className="h-48">
                                        <div className="p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Checkbox id="select-all" onCheckedChange={(checked) => setSelectedGroups(checked ? feeGroups.map(g => g.id) : [])} />
                                                <label htmlFor="select-all">Select All</label>
                                            </div>
                                            {feeGroups.map(group => (
                                                <div key={group.id} className="flex items-center space-x-2 mt-1">
                                                    <Checkbox id={group.id} checked={selectedGroups.includes(group.id)} onCheckedChange={() => handleGroupSelect(group.id)} />
                                                    <label htmlFor={group.id}>{group.name}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Class *</label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Section</label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}><SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search</Button>
                    </div>
                </CardContent>
            </Card>

            {searched && (
                 <Card>
                    <CardHeader><CardTitle>Student List</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? <div className="text-center p-8"><Loader2 className="animate-spin mx-auto"/></div> : (
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr className="text-left"><th className="p-2">Class</th><th className="p-2">Admission No</th><th className="p-2">Student Name</th><th className="p-2">Fees Group</th><th className="p-2 text-right">Amount (₹)</th><th className="p-2 text-right">Paid (₹)</th><th className="p-2 text-right">Discount (₹)</th><th className="p-2 text-right">Fine (₹)</th><th className="p-2 text-right">Balance (₹)</th><th className="p-2 text-center">Action</th></tr>
                                    </thead>
                                    <tbody>
                                        {students.length > 0 ? students.map(student => (
                                            <tr key={`${student.student_id}-${student.fee_group_name}`} className="border-b">
                                                <td className="p-2">{student.class_name} - {student.section_name}</td>
                                                <td className="p-2">{student.admission_no}</td>
                                                <td className="p-2 font-semibold">{student.full_name}</td>
                                                <td className="p-2">{student.fee_group_name}</td>
                                                <td className="p-2 text-right">{Number(student.total_amount).toFixed(2)}</td>
                                                <td className="p-2 text-right">{Number(student.total_paid).toFixed(2)}</td>
                                                <td className="p-2 text-right">{Number(student.total_discount).toFixed(2)}</td>
                                                <td className="p-2 text-right">{Number(student.total_fine).toFixed(2)}</td>
                                                <td className="p-2 text-right font-bold text-red-600">{Number(student.balance).toFixed(2)}</td>
                                                <td className="p-2 text-center"><Button size="sm" variant="outline" onClick={() => handleAddFees(student.student_id, student.fee_group_name)}>$ Add Fees</Button></td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="10" className="p-4 text-center">No students with due fees found for the selected criteria.</td></tr>
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

export default SearchDueFees;
