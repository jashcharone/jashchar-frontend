import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, Clock, Users, CheckCircle2, XCircle, AlertCircle, 
  Search, Filter, Download, RefreshCw, Eye, Check, X
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

const LeaveManagement = () => {
  const { user, selectedBranch } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchData();
    }
  }, [selectedBranch?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch leave types
      const { data: types } = await supabase
        .from('leave_types')
        .select('*')
        .eq('branch_id', selectedBranch.id);
      setLeaveTypes(types || []);

      // Fetch employees
      const { data: emps } = await supabase
        .from('employee_profiles')
        .select('id, full_name, first_name, last_name')
        .eq('branch_id', selectedBranch.id);
      setEmployees(emps || []);

      // Fetch leave applications
      const { data: leaves, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('branch_id', selectedBranch.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Client-side join
      const leavesWithJoins = (leaves || []).map(leave => ({
        ...leave,
        employee: (emps || []).find(e => e.id === leave.staff_id) || null,
        leave_type: (types || []).find(t => t.id === leave.leave_type_id) || null
      }));
      setLeaveApplications(leavesWithJoins);

      // Calculate stats
      const pending = (leaves || []).filter(l => l.status === 'pending').length;
      const approved = (leaves || []).filter(l => l.status === 'approved').length;
      const rejected = (leaves || []).filter(l => l.status === 'rejected').length;
      setStats({ pending, approved, rejected, total: (leaves || []).length });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load leave data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: 'approved',
          admin_remark: actionNote || 'Approved'
        })
        .eq('id', leaveId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave application approved",
      });
      setShowDetailDialog(false);
      setActionNote('');
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (leaveId) => {
    if (!actionNote.trim()) {
      toast({
        title: "Required",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: 'rejected',
          admin_remark: actionNote
        })
        .eq('id', leaveId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave application rejected",
      });
      setShowDetailDialog(false);
      setActionNote('');
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const filteredApplications = leaveApplications.filter(leave => {
    if (statusFilter !== 'all' && leave.status !== statusFilter) return false;
    if (employeeFilter !== 'all' && leave.staff_id !== employeeFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const empName = `${leave.employee?.first_name || ''} ${leave.employee?.last_name || ''}`.toLowerCase();
      if (!empName.includes(search)) {
        return false;
      }
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600">Manage staff leave applications</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Applications</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by employee name or ID..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leave Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Applications</CardTitle>
            <CardDescription>
              {filteredApplications.length} application(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No leave applications found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {leave.employee?.first_name} {leave.employee?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{leave.employee?.full_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{leave.leave_type?.name || '-'}</TableCell>
                      <TableCell>
                        {leave.from_date ? format(new Date(leave.from_date), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {leave.to_date ? format(new Date(leave.to_date), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell>{leave.total_days || 1}</TableCell>
                      <TableCell>{getStatusBadge(leave.status)}</TableCell>
                      <TableCell>
                        {leave.created_at ? format(new Date(leave.created_at), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Leave Application Details</DialogTitle>
              <DialogDescription>
                Review and take action on this leave request
              </DialogDescription>
            </DialogHeader>
            
            {selectedLeave && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Employee</p>
                    <p className="font-medium">
                      {selectedLeave.employee?.first_name} {selectedLeave.employee?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{selectedLeave.employee?.full_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Leave Type</p>
                    <p className="font-medium">{selectedLeave.leave_type?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    {getStatusBadge(selectedLeave.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">From Date</p>
                    <p className="font-medium">
                      {selectedLeave.from_date ? format(new Date(selectedLeave.from_date), 'dd MMM yyyy') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To Date</p>
                    <p className="font-medium">
                      {selectedLeave.to_date ? format(new Date(selectedLeave.to_date), 'dd MMM yyyy') : '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="font-medium">{selectedLeave.reason || 'No reason provided'}</p>
                </div>

                {selectedLeave.status === 'pending' && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Admin Remarks</p>
                    <Textarea
                      placeholder="Add remarks (required for rejection)..."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                    />
                  </div>
                )}

                {selectedLeave.admin_remarks && selectedLeave.status !== 'pending' && (
                  <div>
                    <p className="text-sm text-gray-500">Admin Remarks</p>
                    <p className="font-medium">{selectedLeave.admin_remarks}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {selectedLeave?.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedLeave.id)}
                    disabled={processing}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedLeave.id)}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                </>
              )}
              {selectedLeave?.status !== 'pending' && (
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default LeaveManagement;
