import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Eye, Edit, Trash2 } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LeaveModal = ({ open, setOpen, leave, roles, leaveTypes, staffList, onSave }) => {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        staff_id: '',
        apply_date: format(new Date(), 'yyyy-MM-dd'),
        leave_type_id: '',
        from_date: '',
        to_date: '',
        reason: '',
        note: '',
        status: 'Pending',
        document: null,
    });

    useEffect(() => {
        if (leave) {
            setFormData({
                staff_id: leave.staff_id,
                apply_date: leave.apply_date,
                leave_type_id: leave.leave_type_id,
                from_date: leave.from_date,
                to_date: leave.to_date,
                reason: leave.reason,
                note: leave.note || '',
                status: leave.status,
                document: null
            });
        } else {
            setFormData({
                staff_id: '',
                apply_date: format(new Date(), 'yyyy-MM-dd'),
                leave_type_id: '',
                from_date: '',
                to_date: '',
                reason: '',
                note: '',
                status: 'Pending',
                document: null,
            });
        }
    }, [leave, open]);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(formData, leave?.id);
        setIsSaving(false);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader><DialogTitle>{leave ? 'Edit' : 'Add'} Leave Request</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div>
                        <Label>Role</Label>
                        <Select value={staffList.find(s => s.id === formData.staff_id)?.role_id || ''} disabled={!!leave}>
                            <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                            <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Name</Label>
                        <Select value={formData.staff_id} onValueChange={(v) => setFormData({...formData, staff_id: v})} disabled={!!leave}>
                            <SelectTrigger><SelectValue placeholder="Select Staff" /></SelectTrigger>
                            <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div><Label>Apply Date</Label><Input type="date" value={formData.apply_date} onChange={e => setFormData({...formData, apply_date: e.target.value})} /></div>
                    <div><Label>Leave Type</Label><Select value={formData.leave_type_id} onValueChange={v => setFormData({...formData, leave_type_id: v})}><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger><SelectContent>{leaveTypes.map(lt => <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Leave From Date</Label><Input type="date" value={formData.from_date} onChange={e => setFormData({...formData, from_date: e.target.value})} /></div>
                    <div><Label>Leave To Date</Label><Input type="date" value={formData.to_date} onChange={e => setFormData({...formData, to_date: e.target.value})} /></div>
                    <div className="col-span-2"><Label>Reason</Label><Textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} /></div>
                    <div className="col-span-2"><Label>Note</Label><Textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
                    <div className="col-span-2"><Label>Attach Document</Label><ImageUploader onFileChange={file => setFormData({...formData, document: file})} /></div>
                    <div>
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Disapproved">Disapproved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const ViewLeaveModal = ({ leave, open, setOpen }) => (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Leave Details</DialogTitle></DialogHeader>
            {leave && <div className="grid grid-cols-2 gap-4 py-4 text-sm">
                <div><span className="font-semibold">Name:</span> {leave.staff?.full_name}</div>
                <div><span className="font-semibold">Staff ID:</span> {leave.staff?.school_code}</div>
                <div><span className="font-semibold">Submitted By:</span> {leave.staff?.full_name}</div>
                <div><span className="font-semibold">Leave Type:</span> {leave.leave_type?.name}</div>
                <div className="col-span-2"><span className="font-semibold">Leave:</span> {format(new Date(leave.from_date), 'dd/MM/yy')} to {format(new Date(leave.to_date), 'dd/MM/yy')} ({differenceInDays(new Date(leave.to_date), new Date(leave.from_date)) + 1} days)</div>
                <div><span className="font-semibold">Apply Date:</span> {format(new Date(leave.apply_date), 'dd/MM/yy')}</div>
                <div><span className="font-semibold">Status:</span> {leave.status}</div>
                <div className="col-span-2"><span className="font-semibold">Reason:</span> {leave.reason}</div>
                {leave.document_url && <div className="col-span-2"><a href={leave.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Download Document</a></div>}
                <div className="col-span-2 mt-4">
                    <Label>Note</Label>
                    <Textarea readOnly value={leave.note || 'N/A'}/>
                </div>
            </div>}
        </DialogContent>
    </Dialog>
);


const ApproveStaffLeave = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const [roles, setRoles] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [leaves, setLeaves] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);

    const branchId = user?.profile?.branch_id;

    const fetchInitialData = async () => {
        if (!branchId || !selectedBranch?.id) return;
        setLoading(true);
        const [rolesRes, staffRes, leaveTypesRes, leavesRes] = await Promise.all([
            supabase.from('roles').select('*').eq('branch_id', branchId).not('name', 'in', '("student","parent")'),
            supabase.from('employee_profiles').select('id, full_name, role_id, school_code').eq('branch_id', selectedBranch.id),
            supabase.from('leave_types').select('*').eq('branch_id', selectedBranch.id),
            supabase.from('leave_requests').select('*').eq('branch_id', selectedBranch.id).order('created_at', { ascending: false })
        ]);

        setRoles(rolesRes.data || []);
        const staffData = staffRes.data || [];
        setStaffList(staffData);
        const leaveTypesData = leaveTypesRes.data || [];
        setLeaveTypes(leaveTypesData);
        
        // Client-side join for leaves
        const leavesWithJoins = (leavesRes.data || []).map(leave => ({
            ...leave,
            staff: staffData.find(s => s.id === leave.staff_id) || null,
            leave_type: leaveTypesData.find(lt => lt.id === leave.leave_type_id) || null
        }));
        setLeaves(leavesWithJoins);
        setLoading(false);
    };

    useEffect(() => {
        if (branchId && selectedBranch?.id) {
            fetchInitialData();
        }
    }, [branchId, selectedBranch?.id]);

    const handleSaveLeave = async (formData, leaveId) => {
        if (!selectedBranch?.id) {
            toast({ variant: "destructive", title: "Branch not selected" });
            return;
        }
        let documentUrl = null;
        if (formData.document) {
            const file = formData.document;
            const filePath = `leave_documents/${branchId}/${formData.staff_id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage.from('school-logos').upload(filePath, file);
            if (!uploadError) {
                documentUrl = supabase.storage.from('school-logos').getPublicUrl(filePath).data.publicUrl;
            }
        }

        const dataToSave = {
            branch_id: selectedBranch.id,
            staff_id: formData.staff_id,
            leave_type_id: formData.leave_type_id,
            from_date: formData.from_date,
            to_date: formData.to_date,
            reason: formData.reason,
            admin_remark: formData.note,
            status: formData.status?.toLowerCase() || 'pending',
            ...(documentUrl && { document_url: documentUrl }),
        };

        const { error } = leaveId 
            ? await supabase.from('leave_requests').update(dataToSave).eq('id', leaveId)
            : await supabase.from('leave_requests').insert(dataToSave);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to save leave', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Leave request saved.' });
            fetchInitialData();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        const { error } = await supabase.from('leave_requests').delete().eq('id', id);
        if (error) toast({ variant: 'destructive', title: 'Failed to delete' });
        else {
            toast({ title: 'Deleted successfully' });
            fetchInitialData();
        }
    };

    return (
        <DashboardLayout>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Approve Leave Request</CardTitle>
                    <Button onClick={() => { setEditingLeave(null); setModalOpen(true); }}>Add Leave Request</Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase bg-muted/50">
                                <tr>
                                    {['Staff', 'Leave Type', 'Leave Date', 'Days', 'Apply Date', 'Status', 'Action'].map(h => <th key={h} className="px-6 py-3">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center p-4"><Loader2 className="animate-spin mx-auto"/></td></tr>
                                ) : leaves.map(leave => (
                                    <tr key={leave.id} className="border-b hover:bg-muted/30">
                                        <td className="px-6 py-4 font-medium">{leave.staff?.full_name} <br/><span className="text-xs text-muted-foreground">{leave.staff?.school_code}</span></td>
                                        <td className="px-6 py-4">{leave.leave_type?.name}</td>
                                        <td className="px-6 py-4">{format(new Date(leave.from_date), 'dd/MM/yy')} - {format(new Date(leave.to_date), 'dd/MM/yy')}</td>
                                        <td className="px-6 py-4">{differenceInDays(new Date(leave.to_date), new Date(leave.from_date)) + 1}</td>
                                        <td className="px-6 py-4">{format(new Date(leave.created_at), 'dd/MM/yy')}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${leave.status === 'approved' ? 'bg-green-100 text-green-800' : leave.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{leave.status}</span></td>
                                        <td className="px-6 py-4 space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingLeave(leave); setViewModalOpen(true); }}><Eye className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingLeave(leave); setModalOpen(true); }}><Edit className="h-4 w-4 text-blue-600" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(leave.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <LeaveModal
                open={modalOpen}
                setOpen={setModalOpen}
                leave={editingLeave}
                roles={roles}
                leaveTypes={leaveTypes}
                staffList={staffList}
                onSave={handleSaveLeave}
            />
            
            <ViewLeaveModal
                open={viewModalOpen}
                setOpen={setViewModalOpen}
                leave={editingLeave}
            />
        </DashboardLayout>
    );
};

export default ApproveStaffLeave;
