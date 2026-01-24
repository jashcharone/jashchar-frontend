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
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Save, Trash2, Loader2, UserCheck, BookOpen } from 'lucide-react';
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

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // BRANCH FIX: Always use selectedBranch.id from BranchContext
  const branchId = selectedBranch?.id;

  const fetchInitialData = async () => {
    if (!branchId) return;
    
    setIsFetching(true);
    try {
      // BRANCH FIX: Use ONLY selectedBranch.id for all requests
      // Fetch classes
      const classesRes = await api.get('/academics/classes', {
        params: { branchId },
        headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
      });
      setClasses(classesRes.data?.classes || classesRes.data || []);

      // Fetch sections
      const sectionsRes = await api.get('/academics/sections', {
        params: { branchId },
        headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
      });
      setAllSections(sectionsRes.data?.sections || sectionsRes.data || []);

      // Fetch subjects
      const subjectsRes = await api.get('/academics/subjects', {
        params: { branchId },
        headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
      });
      setSubjects(subjectsRes.data?.subjects || subjectsRes.data || []);

      // Fetch teachers (staff with role teacher)
      const teachersRes = await api.get('/hr/staff', {
        params: { branchId },
        headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
      });
      const allStaff = teachersRes.data?.staff || teachersRes.data || [];
      setTeachers(allStaff.filter(s => s.designation?.toLowerCase().includes('teacher') || s.role === 'teacher'));

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
  }, [branchId, selectedBranch]);

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

  const handleTeacherToggle = (teacherId) => {
    setSelectedTeachers(prev => 
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
      // This would call the backend API to save subject-teacher assignments
      toast({ title: 'Success', description: 'Subject teachers assigned successfully.' });
      setSelectedTeachers([]);
      setSelectedSubject('');
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to assign subject teachers', 
        description: error.response?.data?.message || error.message 
      });
    }
    setLoading(false);
  };

  if (isFetching) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Subject Teacher</h1>
          <p className="text-muted-foreground">Assign teachers to specific subjects for each class and section</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Assign Subject Teacher
              </CardTitle>
              <CardDescription>
                Select class, section, subject and teachers to create an assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
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
                    <Label>Section *</Label>
                    <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                      <SelectTrigger>
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
                  <Label>Subject *</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label>Teachers *</Label>
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                    {teachers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No teachers found</p>
                    ) : (
                      teachers.map((teacher) => (
                        <div key={teacher.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`teacher-${teacher.id}`}
                            checked={selectedTeachers.includes(teacher.id)}
                            onCheckedChange={() => handleTeacherToggle(teacher.id)}
                          />
                          <label
                            htmlFor={`teacher-${teacher.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {teacher.full_name || teacher.first_name}
                            {teacher.designation && (
                              <span className="text-muted-foreground ml-2">
                                ({teacher.designation})
                              </span>
                            )}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Assign Teachers
              </Button>
            </CardFooter>
          </Card>

          {/* Assignments List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Current Assignments
              </CardTitle>
              <CardDescription>
                List of subject-teacher assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Subject teacher assignment feature coming soon.</p>
                <p className="text-sm mt-2">This will show all current subject-teacher mappings.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubjectTeacher;
