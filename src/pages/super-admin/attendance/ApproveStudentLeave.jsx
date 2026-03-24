import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ApproveStudentLeave = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    const branchId = user?.profile?.branch_id;

    const fetchLeaveRequests = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);

        try {
            // Get leave requests (no FK join - leave_types not linked)
            const { data, error } = await supabase
                .from('leave_requests')
                .select(`
                    id,
                    from_date,
                    to_date,
                    reason,
                    status,
                    admin_remark,
                    created_at,
                    staff_id,
                    leave_type_id
                `)
                .eq('branch_id', branchId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Get leave types separately
            const leaveTypeIds = [...new Set(data?.filter(r => r.leave_type_id).map(r => r.leave_type_id))];
            let leaveTypeMap = new Map();
            
            if (leaveTypeIds.length > 0) {
                const { data: ltData } = await supabase
                    .from('leave_types')
                    .select('id, name')
                    .in('id', leaveTypeIds);
                
                leaveTypeMap = new Map((ltData || []).map(lt => [lt.id, lt.name]));
            }
            
            // Get staff names for the requests
            const staffIds = [...new Set(data?.filter(r => r.staff_id).map(r => r.staff_id))];
            let staffMap = new Map();
            
            if (staffIds.length > 0) {
                const { data: staffData } = await supabase
                    .from('employee_profiles')
                    .select('id, full_name')
                    .in('id', staffIds);
                
                staffMap = new Map((staffData || []).map(s => [s.id, s.full_name]));
            }
            
            const formattedData = (data || []).map(req => ({
                ...req,
                start_date: req.from_date,
                end_date: req.to_date,
                applicant_name: staffMap.get(req.staff_id) || 'N/A',
                leave_type: { name: leaveTypeMap.get(req.leave_type_id) || 'General Leave' },
                class_name: 'Staff',
                section_name: ''
            }));

            setRequests(formattedData);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching leave requests', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [branchId, selectedBranch, toast]);

    useEffect(() => {
        fetchLeaveRequests();
    }, [fetchLeaveRequests]);

    const handleStatusChange = async (leaveId, newStatus) => {
        const { error } = await supabase.from('leave_requests')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', leaveId);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error updating status', description: error.message });
        } else {
            toast({ title: 'Status Updated', description: `Request has been ${newStatus}.` });
            fetchLeaveRequests(); // Refresh data
        }
    };

    const filteredRequests = requests.filter(req => req.status === activeTab);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
            case 'pending':
            default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Approve Leave Requests</h1>
            </div>

            <Card>
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase bg-muted/50">
                                <tr>
                                    {['Applicant', 'Type', 'Date Range', 'Applied On', 'Reason', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center p-4"><Loader2 className="mx-auto animate-spin" /></td></tr>
                                ) : filteredRequests.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center p-4">No {activeTab} requests found.</td></tr>
                                ) : filteredRequests.map(req => (
                                    <tr key={req.id} className="border-b hover:bg-muted/30">
                                        <td className="px-6 py-4">
                                            <div className="font-bold">{req.applicant_name}</div>
                                            <div className="text-xs text-muted-foreground">{req.class_name} - {req.section_name}</div>
                                        </td>
                                        <td className="px-6 py-4">{req.leave_type?.name || 'N/A'}</td>
                                        <td className="px-6 py-4">{format(new Date(req.start_date), 'dd/MM/yy')} - {format(new Date(req.end_date), 'dd/MM/yy')}</td>
                                        <td className="px-6 py-4">{format(new Date(req.created_at), 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(req.id, 'approved')}>
                                                        <Check className="h-4 w-4 mr-1 text-green-600" /> Approve
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(req.id, 'rejected')}>
                                                        <X className="h-4 w-4 mr-1 text-red-600" /> Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default ApproveStudentLeave;
