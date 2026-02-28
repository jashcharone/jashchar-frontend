import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Save, Trash2, Loader2, UserCheck, BookOpen, Search, Edit2, X, CheckCircle2, Users, GraduationCap } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SubjectTeacher = () => {
  const { toast } = useToast();
  const { user, school } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  
  // Edit mode states
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editTeachers, setEditTeachers] = useState([]);

  // BRANCH FIX: Always use selectedBranch.id from BranchContext
  const branchId = selectedBranch?.id;

  const fetchInitialData = async () => {
    if (!branchId) return;
    
    setIsFetching(true);
    try {
      // PERFORMANCE FIX: Fetch ALL data in parallel using Promise.all
      const headers = { 'x-school-id': branchId, 'x-branch-id': branchId };
      const params = { branchId };

      const [classesRes, sectionsRes, subjectsRes, teachersRes, assignmentsRes] = await Promise.all([
        api.get('/academics/classes', { params, headers }),
        api.get('/academics/sections', { params, headers }),
        api.get('/academics/subjects', { params, headers }),
        api.get('/hr/staff', { params, headers }),
        api.get('/academics/subject-teachers', { params, headers }).catch(() => ({ data: [] }))
      ]);

      setClasses(classesRes.data?.classes || classesRes.data || []);
      setAllSections(sectionsRes.data?.sections || sectionsRes.data || []);
      setSubjects(subjectsRes.data?.subjects || subjectsRes.data || []);
      setTeachers(teachersRes.data?.staff || teachersRes.data || []);
      setAssignments(assignmentsRes.data || []);

    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Error loading data', 
        description: error.response?.data?.message || error.message 
      });
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

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(teacher => {
    const name = getTeacherName(teacher);
    return name.toLowerCase().includes(teacherSearch.toLowerCase());
  });

  // Get teacher initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    const cleanName = typeof name === 'object' ? name.name : name;
    return cleanName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  };

  // Get teacher display name safely
  function getTeacherName(teacher) {
    if (!teacher) return 'Unknown';
    return typeof teacher.full_name === 'object' ? teacher.full_name?.name : (teacher.full_name || teacher.first_name || 'Unknown');
  }

  const handleTeacherToggle = (teacherId) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId) 
        : [...prev, teacherId]
    );
  };

  const handleEditTeacherToggle = (teacherId) => {
    setEditTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId) 
        : [...prev, teacherId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedSection || !selectedSubject || selectedTeachers.length === 0) {
      toast({ variant: 'destructive', title: 'Please fill all required fields' });
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/academics/subject-teachers', {
        branch_id: branchId,
        class_id: selectedClass,
        section_id: selectedSection,
        subject_id: selectedSubject,
        teacher_ids: selectedTeachers
      }, {
        params: { branchId },
        headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
      });
      toast({ title: 'Success', description: 'Subject teachers assigned successfully.' });
      setSelectedTeachers([]);
      setSelectedSubject('');
      // Refresh assignments list
      await fetchInitialData();
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to assign subject teachers', 
        description: error.response?.data?.message || error.message 
      });
    }
    setLoading(false);
  };

  const handleDeleteAssignment = async (id) => {
    setIsDeleting(id);
    try {
      await api.delete(`/academics/subject-teachers/${id}`, {
        params: { branchId },
        headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
      });
      toast({ title: 'Success', description: 'Assignment removed.' });
      await fetchInitialData();
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to delete assignment', 
        description: error.response?.data?.message || error.message 
      });
    }
    setIsDeleting(null);
  };

  // Start editing an assignment
  const startEdit = (assignment) => {
    setEditingAssignment(assignment);
    setEditTeachers([assignment.teacher_id]);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingAssignment(null);
    setEditTeachers([]);
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingAssignment || editTeachers.length === 0) {
      toast({ variant: 'destructive', title: 'Please select at least one teacher.' });
      return;
    }
    
    setLoading(true);
    try {
      // Delete old and create new
      await api.delete(`/academics/subject-teachers/${editingAssignment.id}`, {
        params: { branchId },
        headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
      });
      await api.post('/academics/subject-teachers', {
        branch_id: branchId,
        class_id: editingAssignment.class_id,
        section_id: editingAssignment.section_id,
        subject_id: editingAssignment.subject_id,
        teacher_ids: editTeachers
      }, {
        params: { branchId },
        headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
      });
      
      toast({ title: 'Updated', description: 'Assignment updated successfully!' });
      cancelEdit();
      await fetchInitialData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update assignment.' });
    }
    setLoading(false);
  };

  if (isFetching) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Subject Teachers...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Subject Teachers
            </h1>
            <p className="text-muted-foreground mt-1">
              Assign teachers to subjects for each class and section
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1.5 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30">
              <Users className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300">{teachers.length} Teachers</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5 bg-green-500/10 dark:bg-green-500/20 border-green-500/30">
              <BookOpen className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300">{assignments.length} Assignments</span>
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Assignment Form - Enhanced */}
          <Card className="shadow-lg border-0 bg-card">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Assign Subject Teacher
              </CardTitle>
              <CardDescription className="text-blue-100">
                Select class, section, subject and teachers to create an assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Class *</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="h-11 border-border focus:border-primary focus:ring-primary">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Section *</Label>
                    <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                      <SelectTrigger className="h-11 border-border focus:border-primary focus:ring-primary">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((sec) => (
                          <SelectItem key={sec.id} value={sec.id}>
                            {sec.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subject *</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="h-11 border-border focus:border-primary focus:ring-primary">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Teachers *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search teachers..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      className="pl-9 h-11 border-border focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-background space-y-1">
                    {filteredTeachers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No teachers found</p>
                    ) : (
                      filteredTeachers.map((teacher) => (
                        <div 
                          key={teacher.id} 
                          className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                            selectedTeachers.includes(teacher.id) 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'hover:bg-muted/50 border border-transparent'
                          }`}
                          onClick={() => handleTeacherToggle(teacher.id)}
                        >
                          <Checkbox
                            id={`teacher-${teacher.id}`}
                            checked={selectedTeachers.includes(teacher.id)}
                            onCheckedChange={() => handleTeacherToggle(teacher.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                            <AvatarImage src={teacher.photo_url} alt={getTeacherName(teacher)} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-medium">
                              {getInitials(teacher.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{getTeacherName(teacher)}</p>
                            {teacher.designation && (
                              <p className="text-xs text-muted-foreground truncate">
                                {typeof teacher.designation === 'object' ? teacher.designation.name : teacher.designation}
                              </p>
                            )}
                          </div>
                          {selectedTeachers.includes(teacher.id) && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {selectedTeachers.length > 0 && (
                    <p className="text-xs text-primary font-medium">{selectedTeachers.length} teacher(s) selected</p>
                  )}
                </div>
              </form>
            </CardContent>
            <CardFooter className="bg-muted/50 rounded-b-lg">
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Assign Teachers
              </Button>
            </CardFooter>
          </Card>

          {/* Assignments List - Enhanced */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Current Assignments
              </CardTitle>
              <CardDescription className="text-green-100">
                View and manage subject-teacher assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {assignments.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No assignments yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Use the form to assign teachers to subjects</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Class</TableHead>
                        <TableHead className="font-semibold">Section</TableHead>
                        <TableHead className="font-semibold">Subject</TableHead>
                        <TableHead className="font-semibold">Teacher</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((a) => (
                        <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">
                              {a.classes?.name || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border">
                              {a.sections?.name || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-foreground">{a.subjects?.name || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage src={a.teacher?.photo_url} alt={a.teacher?.full_name} />
                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white text-xs">
                                  {getInitials(a.teacher?.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{a.teacher?.full_name || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => startEdit(a)}
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    disabled={isDeleting === a.id}
                                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    {isDeleting === a.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove <strong>{a.teacher?.full_name}</strong> from teaching <strong>{a.subjects?.name}</strong> in <strong>{a.classes?.name} - {a.sections?.name}</strong>.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteAssignment(a.id)} className="bg-red-600 hover:bg-red-700">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Assignment Dialog */}
        <AlertDialog open={!!editingAssignment} onOpenChange={(open) => !open && cancelEdit()}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                Edit Assignment
              </AlertDialogTitle>
              <AlertDialogDescription>
                Change teacher for <strong>{editingAssignment?.subjects?.name}</strong> in{' '}
                <strong>{editingAssignment?.classes?.name} - {editingAssignment?.sections?.name}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label className="text-sm font-medium mb-3 block">Select New Teacher</Label>
              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-1 bg-background">
                {teachers.map((teacher) => (
                  <div 
                    key={teacher.id} 
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                      editTeachers.includes(teacher.id) 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                    onClick={() => handleEditTeacherToggle(teacher.id)}
                  >
                    <Checkbox
                      checked={editTeachers.includes(teacher.id)}
                      onCheckedChange={() => handleEditTeacherToggle(teacher.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={teacher.photo_url} alt={getTeacherName(teacher)} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                        {getInitials(teacher.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{getTeacherName(teacher)}</span>
                  </div>
                ))}
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelEdit} className="gap-2">
                <X className="h-4 w-4" /> Cancel
              </AlertDialogCancel>
              <Button onClick={saveEdit} disabled={loading || editTeachers.length === 0} className="bg-blue-600 hover:bg-blue-700 gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default SubjectTeacher;
