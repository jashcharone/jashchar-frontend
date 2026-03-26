import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Save, Info } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FeesCarryForward = () => {
    const { user, school, currentSessionId, currentSessionName } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const currencySymbol = school?.currency_symbol || '₹';

    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [filteredSections, setFilteredSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState('all');
    const [selectedSection, setSelectedSection] = useState('all');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searched, setSearched] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [previousSessionName, setPreviousSessionName] = useState('');

    const fetchPrerequisites = useCallback(async () => {
        if (!selectedBranch?.id) return;
        const [classesRes, sectionsRes, settingsRes] = await Promise.all([
            supabase.from('classes').select('id, name').eq('branch_id', selectedBranch.id),
            supabase.from('sections').select('id, name').eq('branch_id', selectedBranch.id),
            supabase.from('schools').select('carry_forward_fees_due_days, current_session_id').eq('id', selectedBranch.id).single(),
        ]);
        
        setClasses(classesRes.data || []);
        setSections(sectionsRes.data || []);
        
        if (settingsRes.data?.carry_forward_fees_due_days) {
            const days = settingsRes.data.carry_forward_fees_due_days;
            const newDueDate = addDays(new Date(), days);
            setDueDate(format(newDueDate, 'yyyy-MM-dd'));
        }
        
        // Fetch previous session name
        if (settingsRes.data?.current_session_id) {
            const { data: prevSessionData } = await supabase
                .from('sessions')
                .select('name')
                .eq('branch_id', selectedBranch.id)
                .neq('id', settingsRes.data.current_session_id)
                .order('end_date', { ascending: false })
                .limit(1)
                .single();
            
            setPreviousSessionName(prevSessionData?.name || 'Previous Session');
        }
        
    }, [selectedBranch?.id]);

    useEffect(() => {
        fetchPrerequisites();
    }, [fetchPrerequisites]);

    // Fetch sections when class changes
    const fetchSectionsForClass = useCallback(async (classId) => {
        if (!classId || classId === 'all') {
            setFilteredSections([]);
            return;
        }
        const { data } = await supabase
            .from('class_sections')
            .select('sections(id, name)')
            .eq('class_id', classId);
        const sectionsData = data?.map(d => d.sections).filter(Boolean) || [];
        setFilteredSections(sectionsData);
    }, []);

    useEffect(() => {
        fetchSectionsForClass(selectedClass);
        setSelectedSection('all'); // Reset section when class changes
    }, [selectedClass, fetchSectionsForClass]);

    const handleSearch = async () => {
        if (!selectedBranch) {
            toast({ variant: 'destructive', title: 'Branch not selected' });
            return;
        }
        setLoading(true);
        setSearched(true);
        
        const { data, error } = await supabase.rpc('get_previous_session_balance', {
            p_branch_id: selectedBranch.id,
            p_class_id: selectedClass === 'all' ? null : selectedClass,
            p_school_id: selectedBranch.id,
            p_section_id: selectedSection === 'all' ? null : selectedSection
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Error searching students', description: error.message });
            setStudents([]);
        } else {
            setStudents(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (students.length === 0 || !selectedBranch) {
            toast({ variant: 'destructive', title: 'No students to process' });
            return;
        }
        setIsSaving(true);
        
        const { error } = await supabase.rpc('carry_forward_fees', {
            p_branch_id: selectedBranch.id,
            p_due_date: dueDate,
            p_students_balance: students
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Error carrying forward fees', description: error.message });
        } else {
            toast({ title: 'Success!', description: 'Fees have been carried forward to the new session.' });
            handleSearch(); // Refresh the list
        }
        setIsSaving(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Fees Carry Forward</h1>
            
            {/* Session Context Alert */}
            <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">Session Information</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                    This will calculate outstanding balance from <strong>{previousSessionName || 'Previous Session'}</strong> and carry forward to <strong>{currentSessionName || 'Current Session'}</strong>.
                </AlertDescription>
            </Alert>
            
            <Card className="mb-6">
                <CardHeader><CardTitle>Select Criteria</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="text-sm font-medium">Class</label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div>
                             <label className="text-sm font-medium">Section</label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={selectedClass === 'all'}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{filteredSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search</Button>
                    </div>
                </CardContent>
            </Card>

            {searched && (
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Balance from: {previousSessionName || 'Previous Session'}</CardTitle>
                            {dueDate && <p className="text-sm">Due Date: <span className="font-semibold text-primary">{format(new Date(dueDate), 'dd-MM-yyyy')}</span></p>}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="text-center p-8"><Loader2 className="animate-spin mx-auto"/></div> : (
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr className="text-left"><th className="p-2">Student Name</th><th className="p-2">Enroll ID</th><th className="p-2">Admission Date</th><th className="p-2">Roll Number</th><th className="p-2">Father Name</th><th className="p-2 text-right">Balance ({currencySymbol})</th></tr>
                                    </thead>
                                    <tbody>
                                        {students.length > 0 ? students.map(student => (
                                            <tr key={student.id} className="border-b">
                                                <td className="p-2">{student.full_name}</td>
                                                <td className="p-2">{student.enrollment_id}</td>
                                                <td className="p-2">{student.admission_date ? format(new Date(student.admission_date), 'dd-MM-yyyy') : 'N/A'}</td>
                                                <td className="p-2">{student.roll_number}</td>
                                                <td className="p-2">{student.father_name}</td>
                                                <td className="p-2 text-right font-semibold">{currencySymbol}{Number(student.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="6" className="p-4 text-center">No students with balance found for {previousSessionName || 'the previous session'}.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {students.length > 0 && (
                            <div className="flex justify-between items-center mt-6">
                                <p className="text-sm text-muted-foreground">
                                    Total Students: <strong>{students.length}</strong> | 
                                    Total Balance: <strong>{currencySymbol}{students.reduce((sum, s) => sum + Number(s.balance), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                </p>
                                <Button onClick={handleSave} disabled={isSaving || loading}>
                                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4" />}
                                    Carry Forward to {currentSessionName || 'Current Session'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default FeesCarryForward;
