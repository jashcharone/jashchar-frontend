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
import { Search, Save, Users, AlertCircle, Loader2 } from 'lucide-react';

const StaffAttendance = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ? Use selectedBranch from BranchContext (for Super Admin)
  const branchId = selectedBranch?.id;
  const sessionId = currentSessionId;
  const orgId = organizationId || selectedBranch?.organization_id;

  // Fetch departments when branch changes
  useEffect(() => {
    if (branchId) {
      fetchDepartments();
      // Reset staff list when branch changes
      setStaffList([]);
    }
  }, [branchId]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('branch_id', branchId)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Silently fail - departments might not exist
    }
  };

  const fetchStaff = async () => {
    if (!branchId) {
      toast({
        title: "Error",
        description: "Please select a branch first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch employee profiles
      let query = supabase
        .from('employee_profiles')
        .select(`
          id, 
          full_name, 
          first_name, 
          last_name, 
          employee_id,
          department_id,
          departments(name),
          designation_id,
          designations(name)
        `)
        .eq('branch_id', branchId)
        .order('full_name');

      if (selectedDepartment !== 'all') {
        query = query.eq('department_id', selectedDepartment);
      }

      const { data: staffData, error: staffError } = await query;
      if (staffError) throw staffError;

      console.log('[StaffAttendance] Fetched staff:', staffData?.length);

      // Fetch existing attendance for the date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('branch_id', branchId)
        .eq('attendance_date', attendanceDate);

      if (attendanceError) {
        console.warn('[StaffAttendance] Could not fetch attendance:', attendanceError.message);
      }

      const processedStaff = (staffData || []).map(staff => {
        const attendance = attendanceData?.find(a => a.staff_id === staff.id);
        return {
          ...staff,
          display_name: staff.full_name || [staff.first_name, staff.last_name].filter(Boolean).join(' ') || 'Unknown',
          emp_code: staff.staff_id || '-',
          department_name: staff.departments?.name || '-',
          attendance_status: attendance?.status || 'present',
          attendance_note: attendance?.note || '',
          attendance_id: attendance?.id || null,
        };
      });

      setStaffList(processedStaff);
      
      if (processedStaff.length === 0) {
        toast({
          title: "No Staff Found",
          description: "No active staff members found for this branch and filter.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch staff list.",
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
    if (!branchId || !sessionId) {
      toast({
        title: "Error",
        description: "Missing branch or session. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const upsertData = staffList.map(staff => ({
        branch_id: branchId,
        session_id: sessionId,
        organization_id: orgId,
        staff_id: staff.id,
        attendance_date: attendanceDate,
        status: staff.attendance_status,
        note: staff.attendance_note || null,
        source: 'manual',
      }));

      // Delete existing and insert new (safer than upsert for this case)
      const staffIds = staffList.map(s => s.id);
      
      if (staffIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('staff_attendance')
          .delete()
          .eq('branch_id', branchId)
          .eq('attendance_date', attendanceDate)
          .in('staff_id', staffIds);
            
        if (deleteError) {
          console.warn('[StaffAttendance] Delete warning:', deleteError.message);
        }

        const { error: insertError } = await supabase
          .from('staff_attendance')
          .insert(upsertData);

        if (insertError) throw insertError;
      }

      toast({
        title: "? Success",
        description: `Attendance saved for ${staffList.length} staff members.`,
      });
      
      // Refresh to get updated IDs
      fetchStaff();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save attendance.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Mark all as present/absent
  const markAll = (status) => {
    setStaffList(prev => prev.map(staff => ({ ...staff, attendance_status: status })));
  };

  // Count attendance stats
  const stats = {
    total: staffList.length,
    present: staffList.filter(s => s.attendance_status === 'present').length,
    absent: staffList.filter(s => s.attendance_status === 'absent').length,
    late: staffList.filter(s => s.attendance_status === 'late').length,
    halfDay: staffList.filter(s => s.attendance_status === 'half_day').length,
  };

  return (
    <DashboardLayout>
      <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="h-6 w-6" />
          Staff Attendance
        </h1>

        {/* Branch Check */}
        {!branchId && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-800 dark:text-yellow-200">Please select a branch from the top menu to continue.</span>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Attendance Date</Label>
              <Input 
                type="date" 
                value={attendanceDate} 
                onChange={(e) => setAttendanceDate(e.target.value)} 
                max={new Date().toISOString().split('T')[0]}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <Button 
              onClick={fetchStaff} 
              disabled={loading || !branchId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Branch: <span className="font-medium text-gray-700 dark:text-gray-200">{selectedBranch?.name || 'Not selected'}</span>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        {staffList.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header with stats */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-white">Staff List ({stats.total})</h3>
                <div className="flex gap-3 text-sm">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                    Present: {stats.present}
                  </span>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                    Absent: {stats.absent}
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                    Late: {stats.late}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    Half Day: {stats.halfDay}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => markAll('present')} className="dark:border-gray-600 dark:text-gray-300">
                  Mark All Present
                </Button>
                <Button variant="outline" size="sm" onClick={() => markAll('absent')} className="dark:border-gray-600 dark:text-gray-300">
                  Mark All Absent
                </Button>
                <Button onClick={saveAttendance} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Attendance
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700/50">
                    <TableHead className="text-gray-700 dark:text-gray-300">#</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Emp ID</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Department</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Attendance</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff, index) => (
                    <TableRow key={staff.id} className="dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <TableCell className="text-gray-700 dark:text-gray-300">{index + 1}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-mono text-sm">{staff.emp_code}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white font-medium">{staff.display_name}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">{staff.department_name}</TableCell>
                      <TableCell>
                        <div className="flex gap-3 flex-wrap">
                          {[
                            { value: 'present', label: 'Present', color: 'green' },
                            { value: 'late', label: 'Late', color: 'yellow' },
                            { value: 'absent', label: 'Absent', color: 'red' },
                            { value: 'half_day', label: 'Half Day', color: 'blue' },
                          ].map(({ value, label, color }) => (
                            <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`attendance-${staff.id}`}
                                checked={staff.attendance_status === value}
                                onChange={() => handleAttendanceChange(staff.id, value)}
                                className={`form-radio h-4 w-4 text-${color}-600`}
                              />
                              <span className={`text-sm text-${color}-600 dark:text-${color}-400`}>{label}</span>
                            </label>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={staff.attendance_note || ''}
                          onChange={(e) => handleNoteChange(staff.id, e.target.value)}
                          placeholder="Add note..."
                          className="h-8 w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {staffList.length === 0 && !loading && branchId && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
            <Users className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Staff Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Click "Search" to load staff members for attendance marking
            </p>
            <Button onClick={fetchStaff} disabled={loading}>
              <Search className="mr-2 h-4 w-4" /> Load Staff
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffAttendance;
