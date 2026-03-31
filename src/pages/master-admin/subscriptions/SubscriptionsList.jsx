import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Search, MoreHorizontal, Check, X, Loader2, Edit, StopCircle, PlayCircle, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// NOTE: AssignPlanDialog has been removed.
// Schools are assigned plans through School Requests approval flow, not from this subscriptions page.
// See: /master-admin/school-requests

const UpdatePlanDialog = ({ subscription, branchId, onPlanUpdated, onOpenChange }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [newPlanId, setNewPlanId] = useState(subscription.plan_id || '');
    const [status, setStatus] = useState(subscription.status || 'active');
    const [usage, setUsage] = useState({ active_students: 0, active_staff: 0 });
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const { data: plansData, error: plansError } = await supabase.from('subscription_plans').select('*').eq('status', true);
            if (plansError) toast({ variant: 'destructive', title: 'Failed to fetch plans' });
            else setPlans(plansData || []);

            if (branchId) {
                // Fetch usage directly since RPC might be unreliable
                const [studentsResponse, staffResponse] = await Promise.all([
                    supabase.from('student_profiles').select('*', { count: 'exact', head: true }).eq('branch_id', branchId).or('is_disabled.is.null,is_disabled.eq.false'),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('branch_id', branchId).eq('status', 'active')
                ]);
                
                setUsage({ 
                    active_students: studentsResponse.count || 0, 
                    active_staff: staffResponse.count || 0 
                });
            }
        };
        fetchData();
    }, [branchId, toast]);

    useEffect(() => {
        const plan = plans.find(p => p.id === newPlanId);
        if (!plan) {
            setPreview(null);
            return;
        }
        
        const studentCount = usage.active_students;
        const staffCount = usage.active_staff;
        
        let baseAmount = 0;
        if (plan.plan_type === 'Postpaid') {
            baseAmount = (studentCount * (plan.per_student_charge || 0)) + (staffCount * (plan.per_staff_charge || 0));
        } else {
            baseAmount = plan.price || 0;
        }
        
        const gst = baseAmount * ((plan.gst_percentage || 0) / 100);
        const total = baseAmount + gst;

        setPreview({ baseAmount, gst, total, studentCount, staffCount });
    }, [newPlanId, plans, usage]);

    const handleUpdate = async () => {
        if (!newPlanId) {
            toast({ variant: 'destructive', title: 'Please select a plan.' });
            return;
        }
        setLoading(true);
        
        const updateData = { 
            plan_id: newPlanId,
            status: status,
            ...(preview ? {
                total_students: preview.studentCount,
                total_staff: preview.staffCount,
                total_amount: preview.total
            } : {})
        };

        const { error } = await supabase.from('school_subscriptions')
            .update(updateData)
            .eq('id', subscription.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to update plan', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Subscription updated successfully.' });
            onPlanUpdated();
            onOpenChange(false);
        }
        setLoading(false);
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Update Subscription</DialogTitle>
                <DialogDescription>
                    Modify the plan or status for <span className="font-semibold">{subscription.plan?.name}</span>
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-plan">Subscription Plan</Label>
                        <Select value={newPlanId} onValueChange={setNewPlanId}>
                            <SelectTrigger id="new-plan"><SelectValue placeholder="Select a plan" /></SelectTrigger>
                            <SelectContent>
                                {plans.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="sub-status">Subscription Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="sub-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="trialing">Trialing</SelectItem>
                                <SelectItem value="past_due">Past Due</SelectItem>
                                <SelectItem value="canceled">Canceled</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-3 bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold text-lg border-b pb-2 mb-2">New Plan Preview</h4>
                    {preview ? <>
                        <div className="flex justify-between"><span>Plan:</span><span>{plans.find(p=>p.id===newPlanId)?.name}</span></div>
                        <div className="flex justify-between"><span>Students:</span><span>{preview.studentCount}</span></div>
                        <div className="flex justify-between"><span>Staff:</span><span>{preview.staffCount}</span></div>
                        <div className="flex justify-between"><span>Base Amount:</span><span>₹{preview.baseAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>GST ({plans.find(p=>p.id===newPlanId)?.gst_percentage || 0}%):</span><span>₹{preview.gst.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-xl pt-2 border-t mt-2"><span>Total:</span><span>₹{preview.total.toFixed(2)}</span></div>
                    </> : <p className="text-muted-foreground text-sm">Select a plan to see the preview.</p>}
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={loading || !newPlanId}>
                    {loading && <Loader2 className="animate-spin mr-2" />} Update Subscription
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

const StopRenewalDialog = ({ subscription, onRenewalUpdated, onOpenChange }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleStopRenewal = async () => {
        setLoading(true);
        const { error } = await supabase.from('school_subscriptions').update({ auto_renew: false }).eq('id', subscription.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to stop auto-renewal', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Auto-renewal has been stopped for this subscription.' });
            onRenewalUpdated();
            onOpenChange(false);
        }
        setLoading(false);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Stop Auto Renewal</DialogTitle>
                <DialogDescription>
                    Are you sure you want to stop the auto renewal for the <span className="font-semibold">{subscription.plan?.name}</span> plan? The subscription will expire at the end of the current cycle.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleStopRenewal} disabled={loading}>
                    {loading && <Loader2 className="animate-spin mr-2" />} Yes, Stop Renewal
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

const StartRenewalDialog = ({ subscription, onRenewalUpdated, onOpenChange }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleStartRenewal = async () => {
        setLoading(true);
        const { error } = await supabase.from('school_subscriptions').update({ auto_renew: true }).eq('id', subscription.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to start auto-renewal', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Auto-renewal has been enabled for this subscription.' });
            onRenewalUpdated();
            onOpenChange(false);
        }
        setLoading(false);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Start Auto Renewal</DialogTitle>
                <DialogDescription>
                    Are you sure you want to enable auto renewal for the <span className="font-semibold">{subscription.plan?.name}</span> plan?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleStartRenewal} disabled={loading}>
                    {loading && <Loader2 className="animate-spin mr-2" />} Yes, Start Renewal
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

const SubscriptionsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dialogState, setDialogState] = useState({ isOpen: false, type: null, data: null });

  const openDialog = (type, data) => setDialogState({ isOpen: true, type, data });
  const closeDialog = () => setDialogState({ isOpen: false, type: null, data: null });

  const fetchSchoolsAndSubscriptions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, contact_number, status, logo_url, subscription: school_subscriptions(id, status, auto_renew, plan_id, plan: subscription_plans(name, plan_type))')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching schools', description: error.message });
    } else {
      setSchools(data.map(s => ({...s, subscription: s.subscription[0] || null })));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSchoolsAndSubscriptions();
  }, [fetchSchoolsAndSubscriptions]);
  
  const filteredSchools = schools.filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const renderDialog = () => {
    if (!dialogState.isOpen) return null;
    
    switch (dialogState.type) {
      // assignPlan case removed - schools are assigned plans through School Requests approval
      case 'updatePlan':
        return (
          <Dialog open={dialogState.isOpen} onOpenChange={closeDialog}>
            <UpdatePlanDialog 
                subscription={dialogState.data.subscription} 
                branchId={dialogState.data.branchId}
                onPlanUpdated={fetchSchoolsAndSubscriptions} 
                onOpenChange={closeDialog} 
            />
          </Dialog>
        );
      case 'stopRenewal':
        return (
          <Dialog open={dialogState.isOpen} onOpenChange={closeDialog}>
            <StopRenewalDialog subscription={dialogState.data} onRenewalUpdated={fetchSchoolsAndSubscriptions} onOpenChange={closeDialog} />
          </Dialog>
        );
      case 'startRenewal':
        return (
          <Dialog open={dialogState.isOpen} onOpenChange={closeDialog}>
            <StartRenewalDialog subscription={dialogState.data} onRenewalUpdated={fetchSchoolsAndSubscriptions} onOpenChange={closeDialog} />
          </Dialog>
        );
      default:
        return null;
    }
  };


  return (
    <DashboardLayout>
      {renderDialog()}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">School Subscriptions</h1>
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search school..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
      </div>
      
      <div className="bg-card rounded-xl shadow-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Schools List</h2>
          {loading ? (
            <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50"><tr className="border-b">
                    <th className="px-6 py-3">School Name</th>
                    <th className="px-6 py-3">Subscription Plan</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Auto Renew</th>
                    <th className="px-6 py-3 text-center">Action</th>
                </tr></thead>
                <tbody>
                  {filteredSchools.map((school) => (
                    <tr key={school.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-3">
                              <img src={school.logo_url || `https://ui-avatars.com/api/?name=${(school.name || 'S').charAt(0)}&background=random&color=fff`} alt={school.name || 'School'} className="w-8 h-8 rounded-full" />
                              <div><p>{school.name || 'Unknown'}</p><p className="text-xs text-muted-foreground">{school.contact_number || ''}</p></div>
                          </div>
                      </td>
                      <td className="px-6 py-4">{school.subscription?.plan?.name || <Badge variant="destructive">Not Subscribed</Badge>}</td>
                      <td className="px-6 py-4"><Badge variant={school.subscription?.status === 'active' ? 'default' : 'secondary'}>{school.subscription?.status || 'N/A'}</Badge></td>
                      <td className="px-6 py-4">{school.subscription ? (school.subscription.auto_renew ? <Check className="text-green-500"/> : <X className="text-red-500"/>) : 'N/A'}</td>
                       <td className="px-6 py-4 text-center">
                          {school.subscription ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openDialog('updatePlan', { subscription: school.subscription, branchId: school.id })} className="cursor-pointer">
                                        <Edit className="mr-2 h-4 w-4" /> Update Plan
                                    </DropdownMenuItem>
                                    {school.subscription.auto_renew ? (
                                        <DropdownMenuItem onClick={() => openDialog('stopRenewal', school.subscription)} className="text-destructive cursor-pointer">
                                            <StopCircle className="mr-2 h-4 w-4" /> Stop Auto Renewal
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem onClick={() => openDialog('startRenewal', school.subscription)} className="text-green-600 cursor-pointer">
                                            <PlayCircle className="mr-2 h-4 w-4" /> Start Auto Renewal
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => navigate(`/master-admin/subscriptions/bill/${school.id}`)} className="cursor-pointer">
                                        <FileText className="mr-2 h-4 w-4" /> Generate Bill
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-muted-foreground text-sm">�</span>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </DashboardLayout>
  );
};

export default SubscriptionsList;

