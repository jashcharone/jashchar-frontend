import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Search, Save } from 'lucide-react';

const StaffAttendance = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('all');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  let branchId = user?.user_metadata?.branch_id || user?.profile?.branch_id;
  if (!branchId) {
      branchId = sessionStorage.getItem('ma_target_branch_id');
  }

  useEffect(() => {
    if (branchId) {
      fetchRoles();
    }
  }, [branchId]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .eq('branch_id', branchId)
        .not('name', 'in', '("student","parent")');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roles.",
        variant: "destructive",
      });
    }
  };

  const fetchStaff = async () => {
    if (!selectedBranch?.id || !branchId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('employee_profiles')
        .select('id, full_name, first_name, last_name, role:roles(name), school_code')
        .eq('branch_id', selectedBranch.id);

      if (selectedRole !== 'all') {
        query = query.eq('role_id', selectedRole);
      }

      const { data: staffData, error: staffError } = await query;
      if (staffError) throw staffError;

      // Fetch existing attendance for the date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('branch_id', selectedBranch.id)
        .eq('attendance_date', attendanceDate);

      if (attendanceError) throw attendanceError;

      const processedStaff = staffData.map(staff => {
        const attendance = attendanceData.find(a => a.staff_id === staff.id);
        return {
          ...staff,
          full_name: staff.full_name || [staff.first_name, staff.last_name].filter(Boolean).join(' ') || 'Unknown',
          attendance_status: attendance ? attendance.status : 'Present', // Default to Present
          attendance_note: attendance ? attendance.note : '',
          attendance_id: attendance ? attendance.id : null,
        };
      });

      setStaffList(processedStaff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff list.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (staffId, status) => {
    setStaffList(prev => prev.map(staff => 
      staff.id === staffId ? { ...staff, attendance_status: status } : staff
    ));
  };

  const handleNoteChange = (staffId, note) => {
    setStaffList(prev => prev.map(staff => 
      staff.id === staffId ? { ...staff, attendance_note: note } : staff
    ));
  };

  const saveAttendance = async () => {
    if (!selectedBranch?.id || !branchId) {
      toast({ variant: "destructive", title: "Branch not selected" });
      return;
    }
    try {
      const upsertData = staffList.map(staff => ({
        branch_id: selectedBranch.id,
        staff_id: staff.id,
        attendance_date: attendanceDate,
        status: staff.attendance_status?.toLowerCase() || 'present',
        note: staff.attendance_note,
        source: 'manual'
      }));

      // Delete existing for this date and branch
      const { error: deleteError } = await supabase
        .from('staff_attendance')
        .delete()
        .eq('branch_id', selectedBranch.id)
        .eq('attendance_date', attendanceDate);
        
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('staff_attendance')
        .insert(upsertData);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Attendance saved successfully.",
      });
      fetchStaff(); // Refresh to get new IDs
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: "Failed to save attendance.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Staff Attendance</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div>
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Attendance Date</Label>
              <Input 
                type="date" 
                value={attendanceDate} 
                onChange={(e) => setAttendanceDate(e.target.value)} 
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <Button onClick={fetchStaff} disabled={loading}>
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </div>
        </div>

        {staffList.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Staff List</h3>
              <Button onClick={saveAttendance}>
                <Save className="mr-2 h-4 w-4" /> Save Attendance
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>{staff.school_code || '-'}</TableCell>
                    <TableCell>{staff.full_name}</TableCell>
                    <TableCell>{staff.role?.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {['Present', 'Late', 'Absent', 'Half Day'].map((status) => (
                          <label key={status} className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`attendance-${staff.id}`}
                              checked={staff.attendance_status === status}
                              onChange={() => handleAttendanceChange(staff.id, status)}
                              className={`form-radio h-4 w-4 ${
                                status === 'Present' ? 'text-green-600' :
                                status === 'Late' ? 'text-yellow-600' :
                                status === 'Absent' ? 'text-red-600' :
                                'text-blue-600'
                              }`}
                            />
                            <span className="text-sm">{status}</span>
                          </label>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={staff.attendance_note || ''}
                        onChange={(e) => handleNoteChange(staff.id, e.target.value)}
                        placeholder="Note"
                        className="h-8"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffAttendance;
