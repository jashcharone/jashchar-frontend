import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Loader2, FileText, Printer } from 'lucide-react';
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

const SubjectGroup = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const [subjectGroups, setSubjectGroups] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [classSections, setClassSections] = useState([]); // Class-Section mappings
    const [subjects, setSubjects] = useState([]);
    
    // Single class, multiple sections, multiple subjects
    const [formData, setFormData] = useState({ 
        name: '', 
        description: '', 
        class_id: '', // Single class
        section_ids: [], // Multiple sections
        subject_ids: [] // Multiple subjects
    });
    const [isEditing, setIsEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // BRANCH FIX: Always use selectedBranch.id from BranchContext
    const branchId = selectedBranch?.id;

    // Filter sections based on selected class using class_sections junction table
    const filteredSections = formData.class_id 
        ? sections.filter(section => 
            classSections.some(cs => cs.class_id === formData.class_id && cs.section_id === section.id)
          )
        : [];

    const fetchPrerequisites = async () => {
        if (!branchId) {
            if (user) setIsFetching(false);
            return;
        }

        try {
            // BRANCH FIX: Use ONLY selectedBranch.id
            const { data } = await api.get('/academics/subject-groups/prerequisites', {
                params: { branchId }
            });

            setClasses(data.classes || []);
            setSections(data.sections || []);
            setSubjects(data.subjects || []);
            setClassSections(data.classSections || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to load prerequisites', description: error.response?.data?.message || error.message });
            setClasses([]);
            setSections([]);
            setSubjects([]);
            setClassSections([]);
        }
    };

    const fetchSubjectGroups = async () => {
        if (!branchId) return;
        setIsFetching(true);
        try {
            // BRANCH FIX: Use ONLY selectedBranch.id
            const { data } = await api.get('/academics/subject-groups', {
                params: { branchId }
            });

            const enrichedData = (data || []).map(group => {
                const classId = group.class_id || (group.class_ids && group.class_ids[0]);
                const className = classes.find(c => c.id === classId)?.name || '';
                const groupSections = sections.filter(s => group.section_ids?.includes(s.id));
                const classSectionDisplay = groupSections.length > 0 
                    ? groupSections.map(s => `${className} - ${s.name}`).join('\n')
                    : className;
                const groupSubjects = subjects.filter(s => group.subject_ids?.includes(s.id)).map(s => s.name);
                return { 
                    ...group, 
                    class_id: classId,
                    class_name: className,
                    class_section_display: classSectionDisplay,
                    subject_names: groupSubjects
                };
            });

            setSubjectGroups(enrichedData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to fetch subject groups', description: error.response?.data?.message || error.message });
        }
        setIsFetching(false);
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchPrerequisites();
        }
        loadData();
    }, [user, branchId, selectedBranch]);

    useEffect(() => {
        if((classes.length > 0 || sections.length > 0 || subjects.length > 0) && branchId) {
            fetchSubjectGroups();
        }
    }, [user, classes, sections, subjects, branchId]);

    // Reset section selection when class changes
    useEffect(() => {
        if (formData.class_id && !isEditing) {
            setFormData(prev => ({ ...prev, section_ids: [] }));
        }
    }, [formData.class_id]);

    const resetForm = () => {
        setFormData({ name: '', description: '', class_id: '', section_ids: [], subject_ids: [] });
        setIsEditing(null);
    };

    const handleSectionToggle = (sectionId) => {
        setFormData(prev => ({
            ...prev,
            section_ids: prev.section_ids.includes(sectionId)
                ? prev.section_ids.filter(id => id !== sectionId)
                : [...prev.section_ids, sectionId]
        }));
    };

    const handleSubjectToggle = (subjectId) => {
        setFormData(prev => ({
            ...prev,
            subject_ids: prev.subject_ids.includes(subjectId)
                ? prev.subject_ids.filter(id => id !== subjectId)
                : [...prev.subject_ids, subjectId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.class_id || formData.subject_ids.length === 0) {
            toast({ variant: 'destructive', title: 'Please fill all required fields (Name, Class, Subjects).' });
            return;
        }
        setLoading(true);
        
        // BRANCH FIX: Use ONLY selectedBranch.id
        const payload = { 
            name: formData.name,
            description: formData.description,
            class_id: formData.class_id,
            class_ids: [formData.class_id],
            section_ids: formData.section_ids,
            subject_ids: formData.subject_ids,
            branch_id: branchId
        };
        try {
            if (isEditing) {
                await api.put(`/academics/subject-groups/${isEditing}`, payload, { params: { branchId } });
                toast({ title: 'Subject Group Updated!' });
            } else {
                await api.post('/academics/subject-groups', payload, { params: { branchId } });
                toast({ title: 'Subject Group Added!' });
            }
            resetForm();
            await fetchSubjectGroups();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving subject group', description: error.response?.data?.message || error.message });
        }
        setLoading(false);
    };

    const handleEdit = (group) => {
        setIsEditing(group.id);
        // Support both class_id (new) and class_ids[0] (old) for backward compatibility
        const classId = group.class_id || (group.class_ids && group.class_ids[0]) || '';
        setFormData({
            name: group.name,
            description: group.description || '',
            class_id: classId,
            section_ids: group.section_ids || [],
            subject_ids: group.subject_ids || [],
        });
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/academics/subject-groups/${id}`, {
                params: { branchId: selectedBranch?.id }
            });
            toast({ title: 'Subject Group Deleted' });
            await fetchSubjectGroups();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting subject group', description: error.response?.data?.message || error.message });
        }
    };

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Form Panel */}
                <div className="bg-card border rounded-lg shadow-sm">
                    <div className="border-b px-4 py-3">
                        <h2 className="font-semibold text-lg">{isEditing ? 'Edit' : 'Add'} Subject Group</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        {/* Name */}
                        <div>
                            <Label className="text-sm">Name <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                placeholder="e.g., Class 1st Subject Group"
                                className="mt-1"
                            />
                        </div>

                        {/* Class - Single Select Dropdown */}
                        <div>
                            <Label className="text-sm">Class <span className="text-red-500">*</span></Label>
                            <Select 
                                value={formData.class_id} 
                                onValueChange={(value) => setFormData({...formData, class_id: value})}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sections - Checkbox List (Show only sections mapped to selected class) */}
                        <div>
                            <Label className="text-sm">Sections <span className="text-red-500">*</span></Label>
                            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded p-2 bg-background">
                                {!formData.class_id ? (
                                    <p className="text-sm text-muted-foreground">Select a class first</p>
                                ) : filteredSections.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No sections assigned to this class</p>
                                ) : (
                                    filteredSections.map(section => (
                                        <label 
                                            key={section.id} 
                                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                                        >
                                            <Checkbox 
                                                checked={formData.section_ids.includes(section.id)}
                                                onCheckedChange={() => handleSectionToggle(section.id)}
                                            />
                                            <span className="text-sm">{section.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Subjects - Checkbox List */}
                        <div>
                            <Label className="text-sm">Subject <span className="text-red-500">*</span></Label>
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded p-2 bg-background">
                                {subjects.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No subjects found</p>
                                ) : (
                                    subjects.map(subject => (
                                        <label 
                                            key={subject.id} 
                                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                                        >
                                            <Checkbox 
                                                checked={formData.subject_ids.includes(subject.id)}
                                                onCheckedChange={() => handleSubjectToggle(subject.id)}
                                            />
                                            <span className="text-sm">{subject.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <Label className="text-sm">Description</Label>
                            <Textarea 
                                value={formData.description} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="mt-1"
                                rows={3}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-2 pt-2">
                            {isEditing && (
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            )}
                            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Right List Panel */}
                <div className="bg-card border rounded-lg shadow-sm">
                    <div className="border-b px-4 py-3 flex items-center justify-between">
                        <h2 className="font-semibold text-lg">Subject Group List</h2>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Export">
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Print">
                                <Printer className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Name</th>
                                    <th className="px-4 py-3 text-left font-medium">Class (Section)</th>
                                    <th className="px-4 py-3 text-left font-medium">Subject</th>
                                    <th className="px-4 py-3 text-right font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isFetching ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </td>
                                    </tr>
                                ) : subjectGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-muted-foreground">
                                            No subject groups found
                                        </td>
                                    </tr>
                                ) : subjectGroups.map(group => (
                                    <tr key={group.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 text-blue-600">{group.name}</td>
                                        <td className="px-4 py-3">
                                            {/* Display "Class - Section" on separate lines */}
                                            <div className="space-y-0.5">
                                                {group.class_section_display.split('\n').map((line, idx) => (
                                                    <div key={idx} className="text-sm">{line}</div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {/* Display subjects on separate lines */}
                                            <div className="space-y-0.5">
                                                {group.subject_names.map((name, idx) => (
                                                    <div key={idx} className="text-sm">{name}</div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleEdit(group)}
                                                    className="h-8 w-8"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Subject Group?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. Timetables using this group might be affected.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                onClick={() => handleDelete(group.id)} 
                                                                className="bg-destructive hover:bg-destructive/90"
                                                            >
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
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SubjectGroup;
