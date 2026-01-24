import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Badge } from '@/components/ui/badge';

const AcademicsClasses = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canAdd, canEdit, canDelete } = usePermissions();
  const { selectedBranch } = useBranch();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [className, setClassName] = useState('');
  const [selectedSections, setSelectedSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Edit state
  const [editingClass, setEditingClass] = useState(null);
  const [editedClassName, setEditedClassName] = useState('');
  const [editedSelectedSections, setEditedSelectedSections] = useState([]);
  
  // Helper to get valid school ID
  const getValidSchoolId = () => {
      const candidates = [
          user?.profile?.branch_id,
          user?.user_metadata?.branch_id,
          user?.raw_user_meta_data?.branch_id
      ];
      for (const candidate of candidates) {
          if (candidate && typeof candidate === 'string' && candidate.length > 20) {
              return candidate;
          }
      }
      return null;
  };

  const fetchPrerequisites = async () => {
    // BRANCH FIX: Always use selectedBranch.id from BranchContext for branch-specific data
    const branchId = selectedBranch?.id;

    if (!branchId) {
      if (user) setIsFetching(false);
      return;
    }
    setIsFetching(true);

    try {
        // Use Backend API to bypass RLS and ensure consistent listing
        // BRANCH FIX: Use ONLY selectedBranch.id for branch-specific data
        const [classesRes, sectionsRes] = await Promise.all([
          api.get(`/academics/classes?branchId=${branchId}`),
          api.get(`/academics/sections?branchId=${branchId}`)
        ]);

        const classesDataRaw = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data?.data || []);
        const classesData = classesDataRaw.map((cls) => ({
          ...cls,
          sections: Array.isArray(cls.class_sections)
            ? cls.class_sections.map((cs) => cs.sections || { id: cs.section_id, name: cs.section_name }).filter(Boolean)
            : (cls.sections || [])
        }));
        const sectionsData = Array.isArray(sectionsRes.data) ? sectionsRes.data : (sectionsRes.data?.data || []);

        // Backend classes do not include sections join; UI already handles missing sections gracefully
        setClasses(classesData);
        setSections(sectionsData);
    } catch (err) {
        console.error('Error fetching classes/sections:', err);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
    }

    setIsFetching(false);
  };

  useEffect(() => {
    fetchPrerequisites();
  }, [user, selectedBranch]);

  const handleSectionToggle = (sectionId, isEdit = false) => {
    if (isEdit) {
      setEditedSelectedSections(prev => 
        prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
      );
    } else {
      setSelectedSections(prev => 
        prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!className.trim()) {
      toast({ variant: 'destructive', title: 'Class name cannot be empty.' });
      return;
    }

    // Check for duplicate class name
    const duplicateClass = classes.find(c => c.name.toLowerCase() === className.trim().toLowerCase());
    if (duplicateClass) {
      toast({ variant: 'destructive', title: 'Duplicate class name', description: `Class "${className}" already exists!` });
      return;
    }

    setLoading(true);

    // BRANCH FIX: Always use selectedBranch.id from BranchContext
    const branchId = selectedBranch?.id;
    if (!branchId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a branch first.' });
        setLoading(false);
        return;
    }

    let classData;
    try {
        // Use Backend API to bypass RLS issues and link sections server-side
        // BRANCH FIX: Use ONLY selectedBranch.id
        const response = await api.post('/academics/classes', {
          name: className,
          branch_id: branchId,
          section_ids: selectedSections
        });
        classData = response.data;
    } catch (err) {
        console.error('Error creating class:', err);
        toast({ variant: 'destructive', title: 'Failed to add class', description: err.response?.data?.error || err.message });
        setLoading(false);
        return;
    }

    /* 
    const { data: classData, error: classError } = await supabase.from('classes').insert({
      name: className,
      branch_id: branchId,
      branch_id: selectedBranch.id
    }).select().single();

    if (classError) {
      toast({ variant: 'destructive', title: 'Failed to add class', description: classError.message });
      setLoading(false);
      return;
    }
    */

    toast({ title: 'Success', description: 'Class created successfully' });
    setClassName('');
    setSelectedSections([]);
    await fetchPrerequisites();
    setLoading(false);
  };

  const handleDelete = async (classId) => {
    try {
      await api.delete(`/academics/classes/${classId}`);
      toast({ title: 'Success', description: 'Class deleted.' });
      await fetchPrerequisites();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete class', description: error.response?.data?.error || error.message });
    }
  };

  const openEditDialog = (classToEdit) => {
    setEditingClass(classToEdit);
    setEditedClassName(classToEdit.name);
    setEditedSelectedSections(classToEdit.sections.map(s => s.id));
  };
  
  const handleEdit = async () => {
    if (!editedClassName.trim() || !editingClass) return;
    if (editedSelectedSections.length === 0) {
      toast({ variant: 'destructive', title: 'Please select at least one section.' });
      return;
    }

    // Check for duplicate class name
    const duplicateClass = classes.find(c => 
        c.name.toLowerCase() === editedClassName.trim().toLowerCase() && 
        c.id !== editingClass.id
    );
    if (duplicateClass) {
      toast({ variant: 'destructive', title: 'Duplicate class name', description: `Class "${editedClassName}" already exists!` });
      return;
    }
    
    setLoading(true);

    // BRANCH FIX: Always use selectedBranch.id from BranchContext
    const branchId = selectedBranch?.id;

    try {
      // Update class name and linked sections via backend API
      // BRANCH FIX: Use ONLY selectedBranch.id
      await api.put(`/academics/classes/${editingClass.id}`, { 
        name: editedClassName,
        section_ids: editedSelectedSections,
        branch_id: branchId
      }, {
        params: { branchId: branchId }
      });

      toast({ title: 'Success!', description: 'Class updated successfully.' });
      document.getElementById('edit-dialog-close')?.click();
      await fetchPrerequisites();
    } catch (error) {
      console.error('Error updating class:', error);
      toast({ variant: 'destructive', title: 'Failed to update class', description: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
      setEditingClass(null);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Class</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {canAdd('academics.class') && (
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-xl shadow-lg border">
            <h2 className="text-xl font-bold mb-4">Add Class</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="class-name">Class *</Label>
                <Input id="class-name" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g., Class 1" />
              </div>
              <div>
                <Label>Sections</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-background">
                  {sections.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">No sections found. Create sections first.</p>
                  ) : (
                    sections.map(section => (
                      <div key={section.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`section-${section.id}`}
                          checked={selectedSections.includes(section.id)}
                          onCheckedChange={() => handleSectionToggle(section.id, false)}
                        />
                        <Label htmlFor={`section-${section.id}`} className="font-normal cursor-pointer">{section.name}</Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </form>
          </div>
        </div>
        )}
        <div className={canAdd('academics.class') ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-card p-6 rounded-xl shadow-lg border">
            <h2 className="text-xl font-bold mb-4">Class List</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Class</th>
                    <th scope="col" className="px-6 py-3">Sections</th>
                    <th scope="col" className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isFetching ? (
                    <tr><td colSpan="3" className="p-4 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
                  ) : classes.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center text-muted-foreground">No classes found</td></tr>
                  ) : classes.map(c => (
                    <tr key={c.id} className="border-b hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">{c.name}</td>
                      <td className="px-6 py-4 flex flex-wrap gap-1">
                        {c.sections?.map(s => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}
                        {(!c.sections || c.sections.length === 0) && <span className="text-muted-foreground text-xs">No sections</span>}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        {canEdit('academics.class') && (
                        <Dialog onOpenChange={(isOpen) => !isOpen && setEditingClass(null)}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)}>
                                    <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Class</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="edit-class-name">Class Name *</Label>
                                        <Input id="edit-class-name" value={editedClassName} onChange={(e) => setEditedClassName(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Sections</Label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-background">
                                            {sections.map(section => (
                                                <div key={`edit-${section.id}`} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`edit-section-${section.id}`}
                                                        checked={editedSelectedSections.includes(section.id)}
                                                        onCheckedChange={() => handleSectionToggle(section.id, true)}
                                                    />
                                                    <Label htmlFor={`edit-section-${section.id}`} className="font-normal cursor-pointer">{section.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button id="edit-dialog-close" variant="outline">Cancel</Button></DialogClose>
                                    <Button onClick={handleEdit} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        )}

                        {canDelete('academics.class') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Class?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete <strong>{c.name}</strong> and all its linked sections. Students assigned to this class may lose their assignment.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AcademicsClasses;
