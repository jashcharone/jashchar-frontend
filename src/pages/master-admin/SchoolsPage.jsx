import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '@/registry/routeRegistry';
import { Building, PlusCircle, Search, MoreHorizontal, User, Edit, Trash2, ToggleLeft, ToggleRight, Upload, X, Info, CreditCard, CheckCircle, Mail, Phone, UserCog, MapPin, LayoutDashboard } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AssignPlanDialog = ({ school, isOpen, onOpenChange, onPlanAssigned }) => {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('subscription_plans').select('*').eq('status', true);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch plans" });
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedPlanId) return;
    setAssigning(true);
    try {
      const plan = plans.find(p => p.id === selectedPlanId);
      const startDate = new Date().toISOString();
      let endDate = null;
      if (plan.period_type !== 'Lifetime') {
         const date = new Date();
         const val = parseInt(plan.period_value) || 0;
         if (plan.period_type === 'Days') date.setDate(date.getDate() + val);
         if (plan.period_type === 'Months') date.setMonth(date.getMonth() + val);
         if (plan.period_type === 'Years') date.setFullYear(date.getFullYear() + val);
         endDate = date.toISOString();
      }

      await supabase.from('schools').update({ plan_id: selectedPlanId, subscription_status: 'active' }).eq('id', school.id);
      await supabase.from('school_subscriptions').update({ status: 'expired' }).eq('branch_id', school.id).eq('status', 'active');
      const { error: subError } = await supabase.from('school_subscriptions').insert([{
            branch_id: school.id,
            plan_id: selectedPlanId,
            start_date: startDate,
            end_date: endDate,
            status: 'active',
            billing_type: 'prepaid'
        }]);

      if (subError) throw subError;
      toast({ title: "Success", description: `Plan assigned to ${school.name}` });
      onPlanAssigned();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Plan to {school?.name}</DialogTitle>
          <DialogDescription>Select a subscription plan.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            {loading ? <div className="text-sm text-muted-foreground">Loading plans...</div> : (
              <div className="grid gap-2">
                {plans.map(plan => (
                  <div key={plan.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${selectedPlanId === plan.id ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`} onClick={() => setSelectedPlanId(plan.id)}>
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-xs text-muted-foreground">{plan.subscription_period_value} {plan.subscription_period_type}</div>
                    </div>
                    <div className="font-bold text-primary">₹{plan.price}</div>
                  </div>
                ))}
              </div>
            )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={assigning || !selectedPlanId}>{assigning ? 'Assigning...' : 'Assign Plan'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ManageOwnerDialog = ({ school, owner, isOpen, onOpenChange, onOwnerUpdate }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [actions, setActions] = useState({ resetPassword: false, resendEmail: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (owner) {
      const nameParts = owner.full_name?.split(' ') || [];
      const firstName = nameParts.shift() || '';
      const lastName = nameParts.join(' ') || '';
      setFormData({ firstName, lastName, phone: owner.phone || '' });
      setImagePreview(owner.photo_url || '');
    }
  }, [owner]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!owner) return;
    setIsSubmitting(true);
    try {
      let photoUrl = owner.photo_url;
      if (imageFile) {
        const fileName = `avatars/${owner.id}-${uuidv4()}`;
        const { error: uploadError } = await supabase.storage.from('school-logos').upload(fileName, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('school-logos').getPublicUrl(fileName);
        photoUrl = publicUrl;
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const { error: profileError } = await supabase.from('profiles').update({ full_name: fullName, phone: formData.phone, photo_url: photoUrl }).eq('id', owner.id);
      if (profileError) throw profileError;
      
      if (actions.resetPassword || actions.resendEmail) {
        await supabase.functions.invoke('manage-school-owner-actions', { body: { userId: owner.id, email: owner.email, resetPassword: actions.resetPassword, resendEmail: actions.resendEmail } });
      }
      toast({ title: 'Owner Updated Successfully!' });
      onOwnerUpdate(); 
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-card p-0">
        <DialogHeader className="p-6 bg-muted/50 rounded-t-lg border-b">
          <DialogTitle>Manage School Owner</DialogTitle>
          <DialogDescription>Manage details for {school?.name} owner.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><Label>Email</Label><Input value={owner?.email || ''} readOnly disabled className="bg-muted" /></div>
            <div></div>
            <div><Label>First Name</Label><Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required /></div>
            <div><Label>Last Name</Label><Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required /></div>
            <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required /></div>
            <div>
              <Label>Profile Image</Label>
              <div className="flex items-center gap-4 mt-2">
                 <Avatar className="h-16 w-16 border"><AvatarImage src={imagePreview} /><AvatarFallback>UI</AvatarFallback></Avatar>
                 <Button type="button" variant="outline" asChild><label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Upload<input type="file" className="hidden" onChange={handleFileChange} accept="image/*" /></label></Button>
              </div>
            </div>
            <div className="md:col-span-2 border-t pt-4 flex gap-6">
                <div className="flex items-center space-x-2"><Checkbox id="rp" checked={actions.resetPassword} onCheckedChange={(c) => setActions({...actions, resetPassword: c})} /><Label htmlFor="rp">Reset Password</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="re" checked={actions.resendEmail} onCheckedChange={(c) => setActions({...actions, resendEmail: c})} /><Label htmlFor="re">Resend Welcome Email</Label></div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-4">
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
             <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SchoolsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [schoolToManage, setSchoolToManage] = useState(null);
  const [schoolToAssignPlan, setSchoolToAssignPlan] = useState(null);
  
  useEffect(() => { fetchSchools(); }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await api.get('/schools');
      setSchools(response.data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchool = async () => {
      if (!schoolToDelete) return;
      setDeleting(true);
      try {
          // Delete entire organization (all branches) using the organization hard-delete endpoint
          const orgId = schoolToDelete.organization_id || schoolToDelete.id;
          await api.delete(`/schools/organization/${orgId}/hard-delete`);
          toast({ title: 'Organization Deleted', description: 'All branches and data have been permanently deleted.' });
          fetchSchools();
      } catch (err) {
          toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || err.message });
      } finally {
          setDeleting(false);
          setSchoolToDelete(null);
      }
  };

  const filteredSchools = schools.filter(school =>
    school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.branchName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group schools by organization - ONE row per organization
  const groupedOrganizations = React.useMemo(() => {
    const groups = {};
    filteredSchools.forEach(school => {
      // Use Organization ID or Name as key. Backup: 'standalone'
      const orgKey = school.organization_id || (school.organizationName ? `name-${school.organizationName}` : `standalone-${school.id}`);
      if (!groups[orgKey]) groups[orgKey] = [];
      groups[orgKey].push(school);
    });
    
    // Convert to array of organization objects
    return Object.entries(groups).map(([orgKey, branches]) => {
      // Sort branches: Primary first, then by code or creation
      branches.sort((a, b) => (a.is_primary === b.is_primary) ? 0 : a.is_primary ? -1 : 1);
      
      // Primary school (first one) is used for org-level details
      const primarySchool = branches[0];
      
      return {
        orgKey,
        primarySchool, // Use primary school for owner, contact, plan, location, status
        branches, // All branches for this org
      };
    });
  }, [filteredSchools]);

  if (loading) return <DashboardLayout><div className="flex h-[50vh] items-center justify-center">Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-3xl font-bold tracking-tight">Manage Schools</h1><p className="text-muted-foreground mt-1">Overview of all registered organizations and branches</p></div>
          <Button onClick={() => navigate(ROUTES.MASTER_ADMIN.CREATE_ORGANIZATION)}><PlusCircle className="mr-2 h-4 w-4" /> Create Organization</Button>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/40 flex items-center gap-4">
             <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or code..." className="pl-9 bg-background" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
          </div>

          <div className="relative w-full overflow-auto">
             <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-semibold">
                   <tr>
                      <th className="h-10 px-4 py-3 align-middle w-[80px]">Logo</th>
                      <th className="h-10 px-4 py-3 align-middle">Organization</th>
                      <th className="h-10 px-4 py-3 align-middle">Branch Name</th>
                      <th className="h-10 px-4 py-3 align-middle">Plan</th>
                      <th className="h-10 px-4 py-3 align-middle">Contact Info</th>
                      <th className="h-10 px-4 py-3 align-middle">Owner Details</th>
                      <th className="h-10 px-4 py-3 align-middle">Location</th>
                      <th className="h-10 px-4 py-3 align-middle">Status</th>
                      <th className="h-10 px-4 py-3 align-middle text-center min-w-[180px]">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y">
                   {groupedOrganizations.length === 0 ? (
                      <tr><td colSpan={9} className="h-24 text-center text-muted-foreground">No schools found matching criteria.</td></tr>
                   ) : (
                      groupedOrganizations.map((org) => {
                        const school = org.primarySchool; // Use primary school for org-level details
                        return (
                        <tr key={org.orgKey} className="hover:bg-muted/30 transition-colors">
                           {/* Logo */}
                           <td className="p-4 align-middle">
                              <div className="flex justify-center">
                                 <Avatar className="h-12 w-12 border-2 border-border bg-muted">
                                   <AvatarImage src={school.logo_url} className="object-cover" />
                                   <AvatarFallback><Building className="h-5 w-5 opacity-50" /></AvatarFallback>
                                 </Avatar>
                              </div>
                           </td>
                           
                           {/* Organization Name */}
                           <td className="p-4 align-middle font-medium">
                               <div className="flex flex-col max-w-[180px]">
                                  <span className="text-base text-foreground font-semibold leading-tight mb-1">{school.organizationName}</span>
                                  <code className="text-[10px] text-muted-foreground bg-muted w-fit px-1 rounded">{school.organization?.description || 'ORG-2026-007'}</code>
                               </div>
                           </td>
                           
                           {/* Branch Name - Show ALL branches */}
                           <td className="p-4 align-middle">
                               <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
                                   {org.branches.map((branch, idx) => (
                                       <div key={branch.id} className="flex flex-col pb-2 border-b border-border/50 last:border-b-0 last:pb-0">
                                           <span className="font-semibold text-foreground text-sm">{branch.branchName}</span>
                                           <span className="text-xs text-blue-500 font-medium my-0.5">
                                              {branch.is_primary ? `Branch-${parseInt(branch.branchSequence || '1')} (Primary)` : `Branch-${parseInt(branch.branchSequence || idx + 1)}`}
                                           </span>
                                           <span className="text-[10px] text-muted-foreground font-mono">Code: {branch.branch_code || branch.enrollment_id}</span>
                                       </div>
                                   ))}
                               </div>
                           </td>

                           {/* Plan - from primary school */}
                           <td className="p-4 align-middle">
                               {school.plan ? (
                                   <Badge variant="secondary" className="bg-blue-900/20 text-blue-200 border-blue-800 hover:bg-blue-900/30">
                                       {school.plan.name}
                                   </Badge>
                               ) : (
                                   <Badge variant="outline">No Plan</Badge>
                               )}
                           </td>

                           {/* Contact Info - from primary school */}
                           <td className="p-4 align-middle">
                               <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                   <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {school.email || 'N/A'}</div>
                                   <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {school.phone || 'N/A'}</div>
                               </div>
                           </td>

                           {/* Owner Details - from primary school */}
                           <td className="p-4 align-middle">
                               {school.owner ? (
                                   <div className="flex items-center gap-3">
                                       <Avatar className="h-9 w-9 border border-border">
                                           <AvatarImage src={school.owner.photo_url} />
                                           <AvatarFallback className="bg-indigo-900 text-indigo-200 text-xs font-bold">{school.owner.full_name?.substring(0,2)?.toUpperCase()}</AvatarFallback>
                                       </Avatar>
                                       <div className="flex flex-col">
                                           <span className="text-sm font-medium leading-none">{school.owner.full_name}</span>
                                           <span className="text-[10px] text-muted-foreground mt-0.5">{school.owner.email}</span>
                                           <span className="text-[10px] text-muted-foreground">{school.owner.phone}</span>
                                       </div>
                                   </div>
                               ) : (<span className="text-xs text-muted-foreground italic">Unassigned</span>)}
                           </td>

                           {/* Location - from primary school */}
                           <td className="p-4 align-middle">
                               <div className="flex flex-col text-xs">
                                   <span className="font-medium text-foreground">{school.city || 'Unknown'}</span>
                                   <span className="text-muted-foreground">{school.state || 'Karnataka'}</span>
                               </div>
                           </td>

                           {/* Status - from primary school */}
                           <td className="p-4 align-middle">
                               <Badge className={`font-normal ${school.status === 'Active' ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' : 'bg-red-900/20 text-red-400 hover:bg-red-900/30'}`}>
                                   {school.status || 'Active'}
                               </Badge>
                           </td>

                           {/* Actions Grid - use primary school for actions */}
                           <td className="p-4 align-middle">
                               <div className="grid grid-cols-2 gap-2 w-fit mx-auto">
                                   <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 w-full justify-start text-blue-400 border-blue-900/30 hover:bg-blue-900/10 hover:text-blue-300" onClick={() => navigate(ROUTES.MASTER_ADMIN.SCHOOL_DETAILS.replace(':id', school.id))}>
                                      <Info className="mr-1.5 h-3 w-3" /> Details
                                   </Button>
                                   <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 w-full justify-start text-purple-400 border-purple-900/30 hover:bg-purple-900/10 hover:text-purple-300" onClick={() => setSchoolToManage(school)}>
                                      <UserCog className="mr-1.5 h-3 w-3" /> Owner
                                   </Button>
                                   <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 w-full justify-start text-gray-400 border-gray-800 hover:bg-gray-800/50 hover:text-white" onClick={() => navigate(ROUTES.MASTER_ADMIN.EDIT_SCHOOL.replace(':id', school.id))}>
                                      <Edit className="mr-1.5 h-3 w-3" /> Edit
                                   </Button>
                                   <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 w-full justify-start text-red-400 border-red-900/30 hover:bg-red-900/10 hover:text-red-300" onClick={() => setSchoolToDelete(school)}>
                                      <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                                   </Button>
                               </div>
                           </td>
                        </tr>
                      )})
                   )}
                </tbody>
             </table>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <AlertDialog open={!!schoolToDelete} onOpenChange={(open) => !open && setSchoolToDelete(null)}>
        <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle className="text-red-500">⚠️ Delete Organization Permanently?</AlertDialogTitle>
             <AlertDialogDescription asChild>
               <div className="space-y-2">
                 <span className="block">You are about to permanently delete <b className="text-foreground">{schoolToDelete?.organizationName || schoolToDelete?.name}</b> and <b className="text-red-400">ALL its branches</b>.</span>
                 <span className="block text-red-400 font-medium">This will permanently delete:</span>
                 <ul className="list-disc list-inside text-sm text-muted-foreground">
                   <li>All branches and their settings</li>
                   <li>All students, staff, and user accounts</li>
                   <li>All academic data (classes, sections, subjects, timetables)</li>
                   <li>All fee records and payments</li>
                   <li>All attendance and exam records</li>
                   <li>All CMS content (pages, media, news, events)</li>
                   <li>All other module data</li>
                 </ul>
                 <span className="block text-red-500 font-bold mt-2">This action is IRREVERSIBLE!</span>
               </div>
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <Button variant="destructive" onClick={handleDeleteSchool} disabled={deleting}>
               {deleting ? 'Deleting Everything...' : 'Delete Organization & All Data'}
             </Button>
           </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {schoolToAssignPlan && <AssignPlanDialog school={schoolToAssignPlan} isOpen={!!schoolToAssignPlan} onOpenChange={(o) => !o && setSchoolToAssignPlan(null)} onPlanAssigned={fetchSchools} />}
      {schoolToManage && <ManageOwnerDialog school={schoolToManage} owner={schoolToManage.owner} isOpen={!!schoolToManage} onOpenChange={o => !o && setSchoolToManage(null)} onOwnerUpdate={fetchSchools} />}
    </DashboardLayout>
  );
};

export default SchoolsPage;
