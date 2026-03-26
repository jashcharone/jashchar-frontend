import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Save, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AssignClassTeacher = () => {
    const { toast } = useToast();
    const { user, school } = useAuth();
    const { selectedBranch } = useBranch();
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [allSections, setAllSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classTeachers, setClassTeachers] = useState([]);
    
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedTeachers, setSelectedTeachers] = useState([]);
    const [editingKey, setEditingKey] = useState(null); // tracks which class+section is being edited

    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Search & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // BRANCH FIX: Always use selectedBranch.id from BranchContext
    const branchId = selectedBranch?.id;

    const fetchInitialData = async () => {
        if (!branchId) {
            if (user) setIsFetching(false);
            return;
        }
        setIsFetching(true);
        try {
            const { data } = await api.get('/academics/class-teachers', {
                params: { branchId },
                headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
            });

            setClasses(data.classes || []);
            setAllSections(data.sections || []);
            setTeachers(data.teachers || []);
            setClassTeachers(data.assignments || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error loading class teacher data', description: error.response?.data?.message || error.message });
            setClasses([]);
            setAllSections([]);
            setTeachers([]);
            setClassTeachers([]);
        }
        setIsFetching(false);
    };

    useEffect(() => {
        fetchInitialData();
    }, [branchId]);

    useEffect(() => {
        if (selectedClass) {
            const filtered = (allSections || []).filter((section) => {
                if (!Array.isArray(section.class_sections)) return true;
                if (section.class_sections.length === 0) return true;
                return section.class_sections.some((cs) => cs.class_id === selectedClass);
            });
            setSections(filtered);
        } else {
            setSections([]);
            setSelectedSection('');
        }
    }, [selectedClass, allSections]);

    // Group assignments by class+section for display (multiple teachers per row)
    const groupedAssignments = useMemo(() => {
        const grouped = {};
        (classTeachers || []).forEach(ct => {
            const key = `${ct.class_id}_${ct.section_id}`;
            if (!grouped[key]) {
                grouped[key] = {
                    key,
                    class_id: ct.class_id,
                    section_id: ct.section_id,
                    className: ct.classes?.name || '-',
                    sectionName: ct.sections?.name || '-',
                    teachers: [],
                    ids: []
                };
            }
            grouped[key].teachers.push({
                id: ct.id,
                teacher_id: ct.teacher_id,
                full_name: ct.teachers?.full_name || '-'
            });
            grouped[key].ids.push(ct.id);
        });
        return Object.values(grouped);
    }, [classTeachers]);

    // Filter by search query
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return groupedAssignments;
        const q = searchQuery.toLowerCase();
        return groupedAssignments.filter(g =>
            g.className.toLowerCase().includes(q) ||
            g.sectionName.toLowerCase().includes(q) ||
            g.teachers.some(t => t.full_name.toLowerCase().includes(q))
        );
    }, [groupedAssignments, searchQuery]);

    // Pagination
    const totalEntries = filteredGroups.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / rowsPerPage));
    const paginatedGroups = filteredGroups.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const showingTo = Math.min(currentPage * rowsPerPage, totalEntries);

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);
    
    const handleTeacherToggle = (teacherId) => {
        setSelectedTeachers(prev => prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]);
    };

    const handleEdit = (group) => {
        setSelectedClass(group.class_id);
        setSelectedSection(group.section_id);
        setSelectedTeachers(group.teachers.map(t => t.teacher_id));
        setEditingKey(group.key);
        // Scroll form into view
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingKey(null);
        setSelectedClass('');
        setSelectedSection('');
        setSelectedTeachers([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClass || !selectedSection || selectedTeachers.length === 0) {
            toast({ variant: 'destructive', title: 'Please select class, section, and at least one teacher.' });
            return;
        }
        setLoading(true);
        
        try {
            await api.post('/academics/class-teachers', {
                branch_id: branchId,
                class_id: selectedClass,
                section_id: selectedSection,
                teacher_ids: selectedTeachers
            }, {
                params: { branchId },
                headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
            });

            toast({ title: 'Success', description: editingKey ? 'Class teachers updated.' : 'Class teachers assigned.' });
            setSelectedTeachers([]);
            setSelectedClass('');
            setSelectedSection('');
            setEditingKey(null);
            await fetchInitialData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to assign teachers', description: error.response?.data?.message || error.message });
        }
        setLoading(false);
    };
    
    const handleDeleteGroup = async (group) => {
        try {
            // Delete all assignments for this class+section
            for (const id of group.ids) {
                await api.delete(`/academics/class-teachers/${id}`, {
                    params: { branchId },
                    headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
                });
            }
            toast({ title: 'Success', description: 'Class teacher assignment removed.' });
            await fetchInitialData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to delete assignment', description: error.response?.data?.message || error.message });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold">Assign Class Teacher</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Assign Form */}
                    <Card className="lg:col-span-1 shadow-md border">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {editingKey ? 'Edit Class Teacher' : 'Assign Class Teacher'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>Class <span className="text-red-500">*</span></Label>
                                    <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection(''); }}>
                                        <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                        <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Section <span className="text-red-500">*</span></Label>
                                    <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                        <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                                        <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Class Teacher <span className="text-red-500">*</span></Label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto p-3 border rounded-md bg-background mt-1">
                                        {teachers.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No teachers found</p>
                                        ) : teachers.map(teacher => (
                                            <div key={teacher.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`teacher-${teacher.id}`}
                                                    checked={selectedTeachers.includes(teacher.id)}
                                                    onCheckedChange={() => handleTeacherToggle(teacher.id)}
                                                />
                                                <Label htmlFor={`teacher-${teacher.id}`} className="font-normal cursor-pointer text-sm">
                                                    {teacher.full_name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Note: Previous assignments for this section will be replaced.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={loading} className="flex-1">
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        {editingKey ? 'Update' : 'Save'}
                                    </Button>
                                    {editingKey && (
                                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Right Panel - Class Teacher List */}
                    <Card className="lg:col-span-2 shadow-md border">
                        <CardHeader>
                            <CardTitle className="text-lg">Class Teacher List</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Search */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Show</span>
                                    <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                                        <SelectTrigger className="w-[70px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <span className="text-sm text-muted-foreground">entries</span>
                                </div>
                                <div>
                                    <Input
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-8 w-[200px]"
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto border rounded-md">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Class</th>
                                            <th className="px-4 py-3 font-semibold">Section</th>
                                            <th className="px-4 py-3 font-semibold">Class Teacher</th>
                                            <th className="px-4 py-3 text-right font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isFetching ? (
                                            <tr><td colSpan="4" className="text-center p-8"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
                                        ) : paginatedGroups.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center p-8 text-muted-foreground">No class teachers assigned</td></tr>
                                        ) : paginatedGroups.map((group) => (
                                            <tr key={group.key} className="border-b hover:bg-muted/30">
                                                <td className="px-4 py-3 font-medium">{group.className}</td>
                                                <td className="px-4 py-3">{group.sectionName}</td>
                                                <td className="px-4 py-3">
                                                    {group.teachers.map((t, i) => (
                                                        <div key={t.id}>{t.full_name}</div>
                                                    ))}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="default"
                                                            size="icon"
                                                            className="h-8 w-8 bg-blue-500 hover:bg-blue-600"
                                                            onClick={() => handleEdit(group)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5 text-white" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="default"
                                                                    size="icon"
                                                                    className="h-8 w-8 bg-red-500 hover:bg-red-600"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 text-white" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Class Teacher?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This will remove all teacher assignments for {group.className} - {group.sectionName}.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteGroup(group)} className="bg-destructive hover:bg-destructive/90">
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex justify-between items-center mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {showingFrom} to {showingTo} of {totalEntries} entries
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <Button
                                            key={page}
                                            variant={page === currentPage ? 'default' : 'outline'}
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AssignClassTeacher;
