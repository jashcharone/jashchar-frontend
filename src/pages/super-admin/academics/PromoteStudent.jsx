import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Save } from 'lucide-react';

const PromoteStudent = () => {
    const { toast } = useToast();
    const { user, currentSessionId, currentSessionName } = useAuth();
    const { selectedBranch } = useBranch();
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [sessions, setSessions] = useState([]);
    
    const [filters, setFilters] = useState({ class_id: '', section_id: '' });
    const [promotionData, setPromotionData] = useState({ session_id: '', class_id: '', section_id: '' });
    const [students, setStudents] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const branchId = user?.profile?.branch_id;

    useEffect(() => {
        if (!branchId || !selectedBranch) return;
        const fetchPrereqs = async () => {
            try {
                const { data } = await api.get('/academics/promotions/prerequisites', {
                    params: { branchId, branchId: selectedBranch.id }
                });
                setClasses(data.classes || []);
                setSessions(data.sessions || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error loading promotion data', description: error.response?.data?.message || error.message });
                setClasses([]);
                setSessions([]);
            }
        };
        fetchPrereqs();
    }, [branchId, selectedBranch]);

    useEffect(() => {
        if (filters.class_id) {
            const fetchSections = async () => {
                try {
                    const { data } = await api.get('/academics/promotions/sections', {
                        params: { classId: filters.class_id, branchId: selectedBranch?.id }
                    });
                    setSections((data || []).map((item) => item.sections || item).filter(Boolean));
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error loading sections', description: error.response?.data?.message || error.message });
                    setSections([]);
                }
            };
            fetchSections();
        } else {
            // Do not clear sections immediately to allow 'To' dropdowns to use the same list if needed, 
            // but logic says 'To' class might change, so we need 'To' sections.
            // The sections list state is shared? No, we should fetch based on the specific dropdown interaction.
            // Here we are updating sections for the Filter part.
            // For promotion destination, we need separate logic or shared if classes are same.
            // Let's assume simple flow: fetch sections for filter. 
            // Destination sections? We might need a separate state or just allow any section.
            // Let's reuse setSections for now but be careful. Actually, 'To' sections need to update when 'To' class changes.
            // I'll add 'toSections' state.
        }
    }, [filters.class_id]);

    // State for destination sections
    const [toSections, setToSections] = useState([]);
    useEffect(() => {
        if (promotionData.class_id) {
             const fetchToSections = async () => {
                try {
                    const { data } = await api.get('/academics/promotions/sections', {
                        params: { classId: promotionData.class_id, branchId: selectedBranch?.id }
                    });
                    setToSections((data || []).map((item) => item.sections || item).filter(Boolean));
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error loading destination sections', description: error.response?.data?.message || error.message });
                    setToSections([]);
                }
            };
            fetchToSections();
        } else {
            setToSections([]);
        }
    }, [promotionData.class_id]);


    const handleSearch = async () => {
        if (!filters.class_id || !filters.section_id) {
            toast({ variant: 'destructive', title: 'Please select Class and Section.' });
            return;
        }
        if (!currentSessionId) {
            toast({ variant: 'destructive', title: 'No session selected. Please set a current session.' });
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get('/academics/promotions/students', {
                params: {
                    branchId: branchId,
                    branchId: selectedBranch.id,
                    classId: filters.class_id,
                    sectionId: filters.section_id,
                    sessionId: currentSessionId
                }
            });

            setStudents((data || []).map((s) => ({ ...s, result: 'Pass', status: 'Continue' })));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching students', description: error.response?.data?.message || error.message });
            setStudents([]);
        }
        setLoading(false);
    };

    const handleStudentChange = (id, field, value) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handlePromote = async () => {
        if (!promotionData.session_id || !promotionData.class_id || !promotionData.section_id) {
            toast({ variant: 'destructive', title: 'Please select promotion Session, Class, and Section.' });
            return;
        }
        setIsSaving(true);
        
        try {
            await api.post('/academics/promotions', {
                branch_id: branchId,
                branch_id: selectedBranch.id,
                promotion_session_id: promotionData.session_id,
                promotion_class_id: promotionData.class_id,
                promotion_section_id: promotionData.section_id,
                current_class_id: filters.class_id,
                current_section_id: filters.section_id,
                students
            }, {
                params: { branchId: selectedBranch.id }
            });

            toast({ title: 'Students promoted successfully!' });
            setStudents([]);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Promotion failed', description: error.response?.data?.message || error.message });
        }
        setIsSaving(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Promote Students</h1>
            <div className="bg-card p-6 rounded-xl shadow-lg mb-6 border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div><Label>Current Class *</Label><Select value={filters.class_id} onValueChange={v => setFilters(p => ({...p, class_id: v}))}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Current Section *</Label><Select value={filters.section_id} onValueChange={v => setFilters(p => ({...p, section_id: v}))} disabled={!filters.class_id}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                    <Button onClick={handleSearch} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />} Search</Button>
                </div>
            </div>

            {students.length > 0 && (
                <div className="bg-card p-6 rounded-xl shadow-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6 border-b pb-6">
                        <h3 className="text-lg font-semibold md:col-span-4 text-primary">Promote Students to Next Session</h3>
                        <div><Label>Promote In Session *</Label><Select value={promotionData.session_id} onValueChange={v => setPromotionData(p => ({...p, session_id: v}))}><SelectTrigger><SelectValue placeholder="Select Session" /></SelectTrigger><SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Promote to Class *</Label><Select value={promotionData.class_id} onValueChange={v => setPromotionData(p => ({...p, class_id: v}))}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Promote to Section *</Label><Select value={promotionData.section_id} onValueChange={v => setPromotionData(p => ({...p, section_id: v}))} disabled={!promotionData.class_id}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{toSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3">Student Name</th>
                                    <th className="px-6 py-3">Admission No</th>
                                    <th className="px-6 py-3">Current Result</th>
                                    <th className="px-6 py-3">Next Session Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id} className="border-b hover:bg-muted/50">
                                        <td className="px-6 py-4">{s.full_name}</td>
                                        <td className="px-6 py-4">{s.school_code}</td>
                                        <td className="px-6 py-4">
                                            <Select value={s.result} onValueChange={v => handleStudentChange(s.id, 'result', v)}>
                                                <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="Pass">Pass</SelectItem><SelectItem value="Fail">Fail</SelectItem></SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Select value={s.status} onValueChange={v => handleStudentChange(s.id, 'status', v)}>
                                                <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="Continue">Continue</SelectItem><SelectItem value="Leave">Leave</SelectItem></SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button onClick={handlePromote} disabled={isSaving} size="lg">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                            Promote
                        </Button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default PromoteStudent;
