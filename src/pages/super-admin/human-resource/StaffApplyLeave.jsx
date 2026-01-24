import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import ImageUploader from '@/components/ImageUploader';

const StaffApplyLeave = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [appliedLeaves, setAppliedLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  
  const [formData, setFormData] = useState({
    apply_date: format(new Date(), 'yyyy-MM-dd'),
    leave_type_id: '',
    from_date: '',
    to_date: '',
    reason: '',
  });

  const branchId = user?.profile?.branch_id;
  // Assuming the logged-in user is the staff member. 
  // Note: If this page is accessed by School Owner who is not in employee_profiles, this might fail foreign key checks if staff_id references employee_profiles.
  // However, we will proceed with user.id as per instructions.
  const staffId = user?.id; 

  useEffect(() => {
    if (branchId && selectedBranch?.id) {
        fetchLeaveTypes();
        fetchAppliedLeaves();
    }
  }, [branchId, staffId, selectedBranch?.id]);

  const fetchLeaveTypes = async () => {
    if (!selectedBranch?.id) return;
    const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('branch_id', selectedBranch.id);
    if (data) setLeaveTypes(data);
  };

  const fetchAppliedLeaves = async () => {
      if (!staffId || !selectedBranch?.id) return;
      const [leavesRes, typesRes] = await Promise.all([
          supabase.from('leave_requests').select('*').eq('branch_id', selectedBranch.id).eq('staff_id', staffId).order('created_at', { ascending: false }),
          supabase.from('leave_types').select('*').eq('branch_id', selectedBranch.id)
      ]);
      
      const typesData = typesRes.data || [];
      const leavesWithTypes = (leavesRes.data || []).map(leave => ({
          ...leave,
          leave_type: typesData.find(lt => lt.id === leave.leave_type_id) || null
      }));
      setAppliedLeaves(leavesWithTypes);
  };

  const handleInputChange = (key, value) => {
      setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.leave_type_id || !formData.from_date || !formData.to_date || !formData.reason) {
          toast({ variant: "destructive", title: "Please fill all required fields" });
          return;
      }

      setIsSubmitting(true);
      
      let documentUrl = null;
      if (documentFile) {
          const filePath = `leave_documents/${branchId}/${staffId}/${Date.now()}_${documentFile.name}`;
          const { error: uploadError } = await supabase.storage.from('school-logos').upload(filePath, documentFile);
          if (!uploadError) {
              documentUrl = supabase.storage.from('school-logos').getPublicUrl(filePath).data.publicUrl;
          }
      }

      const payload = {
          branch_id: selectedBranch?.id,
          staff_id: staffId,
          leave_type_id: formData.leave_type_id,
          from_date: formData.from_date,
          to_date: formData.to_date,
          reason: formData.reason,
          status: 'pending',
          document_url: documentUrl
      };

      const { error } = await supabase.from('leave_requests').insert(payload);

      setIsSubmitting(false);

      if (error) {
          toast({ variant: "destructive", title: "Error applying leave", description: error.message });
      } else {
          toast({ title: "Leave applied successfully" });
          setFormData({
            apply_date: format(new Date(), 'yyyy-MM-dd'),
            leave_type_id: '',
            from_date: '',
            to_date: '',
            reason: '',
          });
          setDocumentFile(null);
          fetchAppliedLeaves();
      }
  };

  return (
    <DashboardLayout>
        <div className="p-6 grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Apply for Leave</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Apply Date</Label>
                                <Input type="date" value={formData.apply_date} readOnly />
                            </div>
                            <div>
                                <Label>Leave Type</Label>
                                <Select value={formData.leave_type_id} onValueChange={(v) => handleInputChange('leave_type_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map(lt => <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>From Date</Label>
                                <Input type="date" value={formData.from_date} onChange={(e) => handleInputChange('from_date', e.target.value)} />
                            </div>
                            <div>
                                <Label>To Date</Label>
                                <Input type="date" value={formData.to_date} onChange={(e) => handleInputChange('to_date', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <Label>Reason</Label>
                            <Textarea value={formData.reason} onChange={(e) => handleInputChange('reason', e.target.value)} placeholder="Reason for leave" />
                        </div>
                        <div>
                            <Label>Attach Document</Label>
                            <ImageUploader onFileChange={setDocumentFile} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Apply Leave
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Leave History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {appliedLeaves.length === 0 ? (
                            <p className="text-muted-foreground text-center">No leave history found.</p>
                        ) : (
                            appliedLeaves.map(leave => (
                                <div key={leave.id} className="border p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{leave.leave_type?.name}</p>
                                        <p className="text-sm text-muted-foreground">{format(new Date(leave.from_date), 'dd/MM/yy')} - {format(new Date(leave.to_date), 'dd/MM/yy')}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                                        leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {leave.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    </DashboardLayout>
  );
};

export default StaffApplyLeave;
