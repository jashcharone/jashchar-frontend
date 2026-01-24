import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ExamSchedule = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [examGroups, setExamGroups] = useState([]);
    const [exams, setExams] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        group_id: '',
        exam_id: '',
    });

    const branchId = user?.profile?.branch_id;

    const fetchGroups = useCallback(async () => {
        if (!branchId) return;
        let query = supabase.from('exam_groups').select('id, name').eq('branch_id', branchId);
        if (selectedBranch) {
            query = query.eq('branch_id', selectedBranch.id);
        }
        const { data, error } = await query;
        if (error) toast({ variant: 'destructive', title: 'Error fetching groups' });
        else setExamGroups(data || []);
    }, [branchId, selectedBranch, toast]);

    const fetchExams = useCallback(async (groupId) => {
        if (!groupId) return;
        let query = supabase.from('exams').select('id, name').eq('exam_group_id', groupId);
        if (selectedBranch) {
            query = query.eq('branch_id', selectedBranch.id);
        }
        const { data, error } = await query;
        if (error) toast({ variant: 'destructive', title: 'Error fetching exams' });
        else setExams(data || []);
    }, [selectedBranch, toast]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleFilterChange = (key, value) => {
        setFilters(f => {
            const newFilters = { ...f, [key]: value };
            if (key === 'group_id') {
                newFilters.exam_id = '';
                setExams([]);
                fetchExams(value);
            }
            return newFilters;
        });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!filters.exam_id) {
            toast({ variant: 'destructive', title: 'Please select an exam.' });
            return;
        }
        setLoading(true);

        const { data, error } = await supabase
            .from('exam_subjects')
            .select(`
                *,
                subject:subjects(name, code)
            `)
            .eq('exam_id', filters.exam_id)
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching schedule', description: error.message });
        } else {
            setSchedule(data || []);
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Exam Schedule</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Select Criteria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <Label>Exam Group *</Label>
                                <Select value={filters.group_id} onValueChange={(v) => handleFilterChange('group_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Group" /></SelectTrigger>
                                    <SelectContent>{examGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Exam *</Label>
                                <Select value={filters.exam_id} onValueChange={(v) => handleFilterChange('exam_id', v)} disabled={!filters.group_id}>
                                    <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
                                    <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4"/> : <Search className="mr-2 h-4 w-4" />} Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {schedule.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Schedule List</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Date From</TableHead>
                                        <TableHead>Start Time</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Room No</TableHead>
                                        <TableHead>Marks (Max)</TableHead>
                                        <TableHead>Marks (Min)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schedule.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.subject?.name} ({item.subject?.code})</TableCell>
                                            <TableCell>{format(new Date(item.date), 'yyyy/MM/dd')}</TableCell>
                                            <TableCell>{item.time}</TableCell>
                                            <TableCell>{item.duration} Min</TableCell>
                                            <TableCell>{item.room_no}</TableCell>
                                            <TableCell>{item.max_marks}</TableCell>
                                            <TableCell>{item.min_marks}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ExamSchedule;
