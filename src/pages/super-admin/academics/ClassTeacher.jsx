import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ClassTeacher = () => {
  const { toast } = useToast();
  const { user, school } = useAuth();
  const { selectedBranch } = useBranch();
  const [classTeachers, setClassTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  // BRANCH FIX: Always use selectedBranch.id from BranchContext
  const branchId = selectedBranch?.id;

  const fetchClassTeachers = async () => {
    if (!branchId) return;
    
    setLoading(true);
    try {
      // BRANCH FIX: Use ONLY selectedBranch.id
      const { data } = await api.get('/academics/class-teachers', {
        params: { branchId },
        headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
      });
      setClassTeachers(data.assignments || []);
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Error loading class teachers', 
        description: error.response?.data?.message || error.message 
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClassTeachers();
  }, [branchId]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Class Teacher</h1>
          <p className="text-muted-foreground">View all class teacher assignments</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Teacher Assignments
            </CardTitle>
            <CardDescription>
              List of all class teachers assigned to different classes and sections.
              Use "Assign Class Teacher" to make changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : classTeachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No class teachers assigned yet. Go to "Assign Class Teacher" to assign teachers.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classTeachers.map((assignment, index) => (
                    <TableRow key={assignment.id || index}>
                      <TableCell className="font-medium">
                        {assignment.class?.name || assignment.classes?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {assignment.section?.name || assignment.sections?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {assignment.teachers?.full_name || assignment.teacher?.full_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClassTeacher;
