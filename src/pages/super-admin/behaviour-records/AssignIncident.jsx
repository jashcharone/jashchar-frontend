import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Plus, Eye, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import AssignIncidentModal from '@/components/behaviour-records/AssignIncidentModal';
import ViewAssignedIncidentsModal from '@/components/behaviour-records/ViewAssignedIncidentsModal';

const AssignIncident = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (user?.user_metadata?.branch_id) {
      fetchClasses();
    }
  }, [user, selectedBranch]);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      let query = supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', user.user_metadata.branch_id);

      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSections = async (classId) => {
    try {
      let query = supabase
        .from('sections')
        .select('id, name')
        .eq('branch_id', user.user_metadata.branch_id);

      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSections(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleSearch = async () => {
    if (!selectedClass || !selectedSection) {
      toast({ variant: "destructive", title: "Error", description: "Please select Class and Section" });
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch students
      let studentQuery = supabase
        .from('student_profiles')
        .select('id, full_name, admission_no, gender, phone, class_id, section_id')
        .eq('branch_id', user.user_metadata.branch_id)
        .eq('class_id', selectedClass)
        .eq('section_id', selectedSection);

      if (selectedBranch) {
        studentQuery = studentQuery.eq('branch_id', selectedBranch.id);
      }

      const { data: studentsData, error: studentError } = await studentQuery;

      if (studentError) throw studentError;

      // 2. Fetch points for these students
      if (studentsData.length > 0) {
        const studentIds = studentsData.map(s => s.id);
        let pointsQuery = supabase
          .from('student_behaviour_incidents')
          .select(`
            student_id,
            incident:behaviour_incidents (point)
          `)
          .in('student_id', studentIds);

        if (selectedBranch) {
            pointsQuery = pointsQuery.eq('branch_id', selectedBranch.id);
        }

        const { data: pointsData, error: pointsError } = await pointsQuery;

        if (pointsError) throw pointsError;

        // Aggregate points
        const studentsWithPoints = studentsData.map(student => {
          const studentRecords = pointsData.filter(r => r.student_id === student.id);
          const totalPoints = studentRecords.reduce((sum, record) => sum + (record.incident?.point || 0), 0);
          return { ...student, totalPoints };
        });

        setStudents(studentsWithPoints);
      } else {
        setStudents([]);
      }

    } catch (error) {
      console.error('Error fetching students:', error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (student) => {
    setSelectedStudent(student);
    setAssignModalOpen(true);
  };

  const openViewModal = (student) => {
    setSelectedStudent(student);
    setViewModalOpen(true);
  };

  const handleAssignSuccess = () => {
    handleSearch(); // Refresh list to update points
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Assign Incident</h1>

        <Card>
          <CardHeader>
            <CardTitle>Select Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {students.length > 0 || loading ? (
          <Card>
            <CardHeader>
              <CardTitle>Assign Incident List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Total Points</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length > 0 ? (
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>{student.admission_no}</TableCell>
                          <TableCell>{student.gender}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell>
                            <span className={student.totalPoints < 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                              {student.totalPoints}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openAssignModal(student)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewModal(student)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          No students found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : null}

        <AssignIncidentModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          student={selectedStudent}
          onAssignSuccess={handleAssignSuccess}
        />

        <ViewAssignedIncidentsModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          student={selectedStudent}
          onUpdate={handleAssignSuccess}
        />
      </div>
    </DashboardLayout>
  );
};

export default AssignIncident;
