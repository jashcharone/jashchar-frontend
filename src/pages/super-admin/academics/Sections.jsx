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
import { Label } from '@/components/ui/label';
import { Save, Edit, Trash2, Loader2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const AcademicsSections = () => {
    const { toast } = useToast();
    const { user, school } = useAuth();
    const { canAdd, canEdit, canDelete } = usePermissions();
    const { selectedBranch } = useBranch();
    const [sections, setSections] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sectionName, setSectionName] = useState('');
    const [linkClassId, setLinkClassId] = useState('none'); // Optional link on create
    const [editingSection, setEditingSection] = useState(null);
    const [editedName, setEditedName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Safety check for permissions
    const safeCanEdit = (slug) => typeof canEdit === 'function' ? canEdit(slug) : false;
    const safeCanDelete = (slug) => typeof canDelete === 'function' ? canDelete(slug) : false;
    
    // Get branch_id from multiple sources with validation
    const getValidSchoolId = () => {
        // Priority: school.id > profile.branch_id > user_metadata.branch_id
        const candidates = [
            school?.id,
            user?.profile?.branch_id,
            user?.user_metadata?.branch_id,
            // Also check raw_user_meta_data for Supabase auth
            user?.raw_user_meta_data?.branch_id
        ];
        
        console.log('DEBUG getValidSchoolId: school =', school);
        console.log('DEBUG getValidSchoolId: user.profile =', user?.profile);
        console.log('DEBUG getValidSchoolId: user.user_metadata =', user?.user_metadata);
        console.log('DEBUG getValidSchoolId: candidates =', candidates);
        
        // Relaxed UUID check - just check for string and length > 20
        for (const candidate of candidates) {
            if (candidate && typeof candidate === 'string' && candidate.length > 20) {
                console.log('DEBUG: Selected valid branchId =', candidate);
                return candidate;
            }
        }
        console.error('DEBUG: No valid branchId found from any source!');
        return null;
    };

    const fetchPrerequisites = async () => {
        // BRANCH FIX: Always use selectedBranch.id from BranchContext for branch-specific data
        const branchId = selectedBranch?.id;
        console.log('fetchPrerequisites: branchId from selectedBranch =', branchId);
        
        if (!branchId) {
            console.log('fetchPrerequisites: No branchId, setting isFetching=false');
            setIsFetching(false);
            return;
        }
        
        setIsFetching(true);
        console.log('fetchPrerequisites: Starting fetch for branchId =', branchId);
        
        try {
            // Use backend API to bypass RLS issues
            // BRANCH FIX: Use ONLY selectedBranch.id for branch-specific data
            const [sectionsRes, classesRes] = await Promise.all([
                api.get(`/academics/sections?branchId=${branchId}`),
                api.get(`/academics/classes?branchId=${branchId}`)
            ]);
            
            console.log('fetchPrerequisites: sections response =', sectionsRes);
            const sectionsData = Array.isArray(sectionsRes.data) ? sectionsRes.data : (sectionsRes.data?.data || []);
            const classesData = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data?.data || []);

            console.log('fetchPrerequisites: sections loaded =', sectionsData.length, 'rows');
            setSections(sectionsData);
            setClasses(classesData);
        } catch (error) {
            console.error('fetchPrerequisites: API error =', error);
            toast({ variant: 'destructive', title: 'Failed to fetch sections', description: error.response?.data?.message || error.message });
        }

        setIsFetching(false);
    };

    useEffect(() => {
        console.log('Sections.jsx useEffect triggered: user=', !!user, 'school=', school, 'user.profile=', user?.profile);
        
        // Wait for auth to load
        if (!user) {
            console.log('Sections.jsx: user not loaded yet, waiting...');
            return;
        }
        
        fetchPrerequisites();
    }, [user, school, selectedBranch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sectionName.trim()) {
            toast({ variant: 'destructive', title: 'Section name cannot be empty.' });
            return;
        }
        
        // BRANCH FIX: Always use selectedBranch.id from BranchContext
        const branchId = selectedBranch?.id;
        
        console.log("DEBUG: Attempting to create section with branchId:", branchId);

        if (!branchId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a branch first.' });
            return;
        }

        // Check for duplicates
        const normalizedName = sectionName.trim().toLowerCase();
        const duplicate = sections.find(s => s.name.toLowerCase() === normalizedName);

        if (duplicate) {
            toast({ variant: 'destructive', title: 'Duplicate Section', description: 'A section with this name already exists.' });
            return;
        }
        
        setLoading(true);
        
        // Create Section using Backend API (Bypasses RLS issues if any)
        // BRANCH FIX: Use ONLY selectedBranch.id
        try {
            const { data: newSection } = await api.post('/academics/sections', {
                name: sectionName, 
                branch_id: branchId
            }, {
                headers: { 'x-school-id': branchId }
            });

            // 2. Optionally link to a class
            if (linkClassId && linkClassId !== 'none') {
                const { error: linkError } = await supabase.from('class_sections').insert({
                    class_id: linkClassId,
                    section_id: newSection.id
                });
                if (linkError) {
                    toast({ variant: 'warning', title: 'Section created but failed to link to class', description: linkError.message });
                } else {
                    toast({ title: 'Success', description: 'Section added and linked to class.' });
                }
            } else {
                toast({ title: 'Success', description: 'New section added.' });
            }

            setSectionName('');
            setLinkClassId('none');
            await fetchPrerequisites();
        } catch (error) {
            console.error("API Insert Error:", error);
            const msg = error.response?.data?.message || error.message;
            
            if (msg?.includes('duplicate key')) {
                toast({ variant: 'destructive', title: 'Duplicate Section', description: 'A section with this name already exists.' });
            } else {
                toast({ variant: 'destructive', title: 'Failed to add section', description: msg });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (sectionId) => {
        try {
            await api.delete(`/academics/sections/${sectionId}` , {
                params: { branchId: selectedBranch?.id }
            });
            toast({ title: 'Success', description: 'Section deleted.' });
            await fetchPrerequisites();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to delete section', description: error.response?.data?.error || error.message });
        }
    };
    
    const openEditDialog = (section) => {
        setEditingSection(section);
        setEditedName(section.name);
    };

    const handleEdit = async () => {
        if (!editedName.trim() || !editingSection) return;

        // Check for duplicates
        const normalizedName = editedName.trim().toLowerCase();
        const duplicate = sections.find(s => 
            s.name.toLowerCase() === normalizedName && 
            s.id !== editingSection.id
        );

        if (duplicate) {
            toast({ variant: 'destructive', title: 'Duplicate Section', description: 'A section with this name already exists.' });
            return;
        }
        
        // BRANCH FIX: Always use selectedBranch.id from BranchContext
        const branchId = selectedBranch?.id;
        
        setLoading(true);
        try {
            // BRANCH FIX: Use ONLY selectedBranch.id
            await api.put(`/academics/sections/${editingSection.id}`, { 
                name: editedName,
                branch_id: branchId
            }, {
                params: { branchId }
            });
            toast({ title: 'Success!', description: 'Section updated successfully.' });
            setEditingSection(null);
            setEditedName('');
            document.getElementById('edit-dialog-close')?.click();
            await fetchPrerequisites();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to update section', description: error.response?.data?.error || error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Sections</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="border shadow-lg">
                        <CardHeader>
                           <CardTitle>Add Section</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="section-name">Section Name *</Label>
                                    <Input
                                        id="section-name"
                                        placeholder="e.g., A, B, C"
                                        value={sectionName}
                                        onChange={(e) => setSectionName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="link-class">Link to Class (Optional)</Label>
                                    <Select value={linkClassId} onValueChange={setLinkClassId}>
                                        <SelectTrigger id="link-class">
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        You can link this section to more classes later in the "Class" module.
                                    </p>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card className="border shadow-lg">
                         <CardHeader>
                           <CardTitle>Section List</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Section</th>
                                            <th scope="col" className="px-6 py-3">Linked Classes</th>
                                            <th scope="col" className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isFetching ? (
                                            <tr><td colSpan="3" className="p-4 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
                                        ) : sections.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="p-4 text-center text-muted-foreground">
                                                    No sections found. 
                                                    {/* Debug info hidden in production but useful here */}
                                                    <span className="hidden">School ID: {getValidSchoolId()}</span>
                                                </td>
                                            </tr>
                                        ) : sections.map(section => (
                                            <tr key={section.id} className="border-b hover:bg-muted/30">
                                                <td className="px-6 py-4 font-medium">{section.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {Array.isArray(section.class_sections) && section.class_sections.map(cs => (
                                                            <Badge key={cs.classes?.name || Math.random()} variant="outline" className="text-xs font-normal">
                                                                {cs.classes?.name}
                                                            </Badge>
                                                        ))}
                                                        {(!section.class_sections || section.class_sections.length === 0) && (
                                                            <span className="text-muted-foreground text-xs">Unlinked</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-1">
                                                    {safeCanEdit('academics.sections') && (
                                                    <Dialog onOpenChange={(isOpen) => !isOpen && setEditingSection(null)}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(section)}>
                                                                <Edit className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Section</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <Label htmlFor="edit-section-name">Section Name *</Label>
                                                                <Input id="edit-section-name" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                                                            </div>
                                                            <DialogFooter>
                                                                <DialogClose asChild><Button id="edit-dialog-close" variant="outline">Cancel</Button></DialogClose>
                                                                <Button onClick={handleEdit} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                    )}
                                                    
                                                    {safeCanDelete('academics.sections') && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will permanently delete the section. It will be removed from all linked classes.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(section.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AcademicsSections;
