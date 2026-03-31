import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Building, CreditCard, ShieldCheck, FileDown, Copy, ExternalLink, Share2, 
  Edit, Trash2, User, Mail, Phone, MapPin, ToggleLeft, ToggleRight, CheckCircle, 
  AlertTriangle, Loader2, Download, FileText, UserCircle, Settings, Power
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { schoolModuleMap } from '@/lib/schoolModules';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/registry/routeRegistry';
import api from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { formatDateWithMonthName as formatDate } from '@/utils/dateUtils';

const calculateExpiryDate = (startDate, plan) => {
  if (!plan || !startDate) return 'N/A';
  if (plan.subscription_period_type === 'Lifetime') {
    return 'Lifetime';
  }
  const date = new Date(startDate);
  const periodType = plan.subscription_period_type;
  const periodValue = plan.subscription_period_value;

  if (periodType === 'Days') date.setDate(date.getDate() + periodValue);
  else if (periodType === 'Months') date.setMonth(date.getMonth() + periodValue);
  else if (periodType === 'Years') date.setFullYear(date.getFullYear() + periodValue);
  return formatDate(date);
};

// Assign Plan Dialog Component
const AssignPlanDialog = ({ school, isOpen, onOpenChange, onPlanAssigned }) => {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      setSelectedPlanId(school?.plan_id || '');
    }
  }, [isOpen, school]);

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
    if (!selectedPlanId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a plan" });
      return;
    }
    setAssigning(true);
    try {
      const plan = plans.find(p => p.id === selectedPlanId);
      const startDate = new Date().toISOString();
      
      let endDate = null;
      if (plan.subscription_period_type !== 'Lifetime') {
        const date = new Date();
        const val = parseInt(plan.subscription_period_value || 12);
        if (plan.subscription_period_type === 'Days') date.setDate(date.getDate() + val);
        else if (plan.subscription_period_type === 'Months') date.setMonth(date.getMonth() + val);
        else if (plan.subscription_period_type === 'Years') date.setFullYear(date.getFullYear() + val);
        endDate = date.toISOString();
      }

      // Update school plan
      const { error: schoolError } = await supabase
        .from('schools')
        .update({
          plan_id: selectedPlanId,
          subscription_status: 'active'
        })
        .eq('id', school.id);

      if (schoolError) throw schoolError;

      // Expire existing subscriptions
      await supabase
        .from('school_subscriptions')
        .update({ status: 'expired' })
        .eq('branch_id', school.id)
        .eq('status', 'active');

      // Create new subscription
      const { error: subError } = await supabase
        .from('school_subscriptions')
        .insert([{
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Subscription Plan</DialogTitle>
          <DialogDescription>Select a plan for <strong>{school?.name}</strong></DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading plans...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price}/{plan.subscription_period_value} {plan.subscription_period_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlanId && (
                <div className="p-4 bg-muted rounded-lg">
                  {(() => {
                    const selectedPlan = plans.find(p => p.id === selectedPlanId);
                    return selectedPlan ? (
                      <div>
                        <p className="font-medium">{selectedPlan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{selectedPlan.price} per {selectedPlan.subscription_period_value} {selectedPlan.subscription_period_type}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={assigning || !selectedPlanId}>
            {assigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Plan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Manage Owner Dialog Component
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
      setFormData({
        firstName,
        lastName,
        phone: owner.phone || '',
      });
      setImagePreview(owner.photo_url || '');
    }
  }, [owner]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
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
        const { error: uploadError } = await supabase.storage
          .from('school-logos')
          .upload(fileName, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('school-logos')
          .getPublicUrl(fileName);
        photoUrl = publicUrl;
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: formData.phone,
          photo_url: photoUrl,
        })
        .eq('id', owner.id);
      
      if (profileError) throw profileError;
      
      if (actions.resetPassword || actions.resendEmail) {
        const { error: actionError } = await supabase.functions.invoke('manage-school-owner-actions', {
          body: {
            userId: owner.id,
            email: owner.email,
            resetPassword: actions.resetPassword,
            resendEmail: actions.resendEmail
          }
        });
        if (actionError) throw actionError;
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

  if (!owner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage School Owner</DialogTitle>
          <DialogDescription>Manage details and actions for the owner of {school?.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="md:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" value={owner.email} readOnly disabled className="bg-muted" />
            </div>
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input 
                id="firstName" 
                value={formData.firstName} 
                onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input 
                id="lastName" 
                value={formData.lastName} 
                onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input 
                id="phone" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                required 
              />
            </div>
            <div>
              <Label>Profile Image</Label>
              <div className="flex items-center gap-4 mt-2">
                <img 
                  src={imagePreview || `https://ui-avatars.com/api/?name=${owner.full_name}&background=random`} 
                  alt="Owner" 
                  className="h-20 w-20 rounded-full object-cover border-2 border-border" 
                />
                <Button asChild variant="outline" type="button">
                  <label htmlFor="admin-image-upload" className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload
                    <input 
                      id="admin-image-upload" 
                      type="file" 
                      className="sr-only" 
                      onChange={handleFileChange} 
                      accept="image/*" 
                    />
                  </label>
                </Button>
              </div>
            </div>
            <div className="md:col-span-2 border-t pt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="resetPassword" 
                    checked={actions.resetPassword} 
                    onCheckedChange={(c) => setActions({...actions, resetPassword: c})} 
                  />
                  <Label htmlFor="resetPassword" className="cursor-pointer">Reset Password</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="resendEmail" 
                    checked={actions.resendEmail} 
                    onCheckedChange={(c) => setActions({...actions, resendEmail: c})} 
                  />
                  <Label htmlFor="resendEmail" className="cursor-pointer">Re-send Welcome Email</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Owner'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SchoolDetails = () => {
  const { id: branchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [school, setSchool] = useState(null);
  const [owner, setOwner] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [schoolToAssignPlan, setSchoolToAssignPlan] = useState(null);
  const [schoolToManage, setSchoolToManage] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchSchoolDetails = useCallback(async () => {
    setLoading(true);
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select('*, plan:subscription_plans!schools_plan_id_fkey(*), subscription:school_subscriptions(status, start_date, end_date, updated_at), organization:organizations(*)')
      .eq('id', branchId)
      .maybeSingle();
    
    if (schoolError || !schoolData) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch school details.' });
      navigate('/master-admin/schools');
      return;
    }
    setSchool(schoolData);

    // Fetch owner details
    if (schoolData.owner_id) {
      const { data: ownerData, error: ownerError } = await supabase
        .from('profiles')
        .select('id, full_name, email, photo_url, phone')
        .eq('id', schoolData.owner_id)
        .maybeSingle();
      
      if (!ownerError && ownerData) {
        setOwner(ownerData);
      }
    }

    // Fetch payment history
    const { data: transData, error: transError } = await supabase
      .from('transactions')
      .select('*, plan:subscription_plans!subscription_plan_id(name)')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });
    
    if (transError) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch payment history.' });
    } else {
      setTransactions(transData || []);
    }

    setLoading(false);
  }, [branchId, navigate, toast]);

  useEffect(() => {
    fetchSchoolDetails();
  }, [fetchSchoolDetails]);

  const handleToggleStatus = async () => {
    if (!school) return;
    
    const newStatus = school.status === 'Active' ? 'Inactive' : 'Active';
    const confirmMessage = newStatus === 'Inactive' 
      ? ` ️ Warning: Setting school to Inactive will:\n\n� Block all users from logging in\n� Prevent access to school dashboard\n� Suspend all school operations\n\nYou can reactivate it anytime.\n\nAre you sure?`
      : `? Reactivate School:\n\n� All users will be able to login again\n� School dashboard will be accessible\n� All operations will resume\n\nDo you want to activate this school?`;

    if (!window.confirm(confirmMessage)) return;

    setTogglingStatus(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({ status: newStatus })
        .eq('id', branchId);

      if (error) throw error;

      toast({ 
        title: 'Status Updated', 
        description: `${school.name} is now ${newStatus}` 
      });
      fetchSchoolDetails();
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Update Failed', 
        description: error.message 
      });
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return;
    setDeleting(true);

    try {
      const response = await api.delete(`/schools/${schoolToDelete.id}/hard-delete`);
      
      toast({ 
        title: 'School Permanently Deleted', 
        description: `${schoolToDelete.name} and all its data (including ${response.data.deletedUsers || 0} users) have been permanently removed.` 
      });
      setSchoolToDelete(null);
      navigate('/master-admin/schools');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast({ variant: 'destructive', title: 'Deletion Failed', description: errorMsg });
      setDeleting(false);
    }
  };

  const handleCopyPaymentHistory = () => {
    if (transactions.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'No payment history to copy' });
      return;
    }

    const csvHeaders = ['Sl', 'Package', 'Purchase Date', 'Date of Expiry', 'Trx ID', 'Paid', 'Method'];
    const csvRows = transactions.map((t, i) => [
      i + 1,
      t.plan?.name || 'N/A',
      formatDate(t.created_at),
      calculateExpiryDate(t.created_at, school?.plan),
      t.transaction_id || 'N/A',
      `?${t.amount || 0}`,
      t.payment_method || 'N/A'
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    navigator.clipboard.writeText(csvContent);
    toast({ title: 'Copied', description: 'Payment history copied to clipboard' });
  };

  const handleExportPDF = () => {
    if (transactions.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'No payment history to export' });
      return;
    }

    // Create a simple HTML table for PDF
    const htmlContent = `
      <html>
        <head>
          <title>Payment History - ${school?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Payment History - ${school?.name}</h1>
          <table>
            <thead>
              <tr>
                <th>Sl</th>
                <th>Package</th>
                <th>Purchase Date</th>
                <th>Date of Expiry</th>
                <th>Trx ID</th>
                <th>Paid</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((t, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${t.plan?.name || 'N/A'}</td>
                  <td>${formatDate(t.created_at)}</td>
                  <td>${calculateExpiryDate(t.created_at, school?.plan)}</td>
                  <td>${t.transaction_id || 'N/A'}</td>
                  <td>?${t.amount || 0}</td>
                  <td>${t.payment_method || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-history-${school?.name}-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exported', description: 'Payment history exported successfully' });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!school) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold">School not found</p>
            <Button onClick={() => navigate('/master-admin/schools')} className="mt-4">
              Back to Schools
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const enabledModules = school.plan?.modules || [];
  const schoolUrl = school.slug ? `${window.location.origin}/${school.slug}` : '#';
  const whatsappMessage = encodeURIComponent(`Hello, your school website is ready! Check it out here: ${schoolUrl !== '#' ? schoolUrl : 'Link not available'}`);
  const whatsappLink = `https://wa.me/${school.contact_number?.replace(/\D/g,'')}?text=${whatsappMessage}`;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/master-admin/schools')}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{school.name}</h1>
            <p className="text-sm text-muted-foreground">School ID: {school.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleToggleStatus}
            disabled={togglingStatus}
          >
            {togglingStatus ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : school.status === 'Active' ? (
              <>
                <Power className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(ROUTES.MASTER_ADMIN.EDIT_SCHOOL.replace(':id', branchId))}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit School
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setSchoolToDelete(school)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-card p-6 rounded-lg shadow-md border-l-4 border-l-primary">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="mr-2" /> Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setSchoolToAssignPlan(school)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {school.plan ? 'Change Plan' : 'Assign Plan'}
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setSchoolToManage(school)}
                  disabled={!owner}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  Manage Owner
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => window.open(schoolUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Homepage
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => window.open(whatsappLink, '_blank')}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share on WhatsApp
                </Button>
              </div>
            </div>

            {/* Organization & Branch Details Card */}
            {school.organization && (
              <div className="bg-card p-6 rounded-lg shadow-md border-l-4 border-l-indigo-500">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Building className="mr-2" /> Organization & Branch Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-muted-foreground block">Organization Name</label>
                    <p className="font-medium text-base">{school.organization.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block">Organization Code</label>
                    <p className="font-medium font-mono">{school.organization.code}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block">Branch Code</label>
                    <p className="font-medium font-mono">{school.branch_code || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block">Branch Type</label>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      school.is_primary 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {school.is_primary ? 'Primary Branch' : 'Secondary Branch'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* School Information Card */}
            <div className="bg-card p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <Building className="mr-2" /> School Information
                </h2>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  school.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                  school.status === 'Inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {school.status || 'Unknown'}
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo Section */}
                <div className="flex-shrink-0 flex flex-col items-center space-y-3">
                  <div className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden">
                    {school.logo_url ? (
                      <img src={school.logo_url} alt={school.name} className="h-full w-full object-contain" />
                    ) : (
                      <Building className="h-12 w-12 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-mono">{school.enrollment_id_prefix}{school.enrollment_id_number}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">Basic Details</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground">School Name</label>
                        <p className="font-medium text-base">{school.name}</p>
                      </div>
                      
                      <div>
                        <label className="text-xs text-muted-foreground">Board</label>
                        <p className="font-medium">{school.board || 'N/A'}</p>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">School URL</label>
                        {school.slug ? (
                          <a 
                            href={schoolUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center text-blue-600 hover:underline font-medium"
                          >
                            {school.slug} <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not Set</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">Contact Info</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <label className="text-xs text-muted-foreground block">Email</label>
                          <p className="font-medium">{school.contact_email || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <label className="text-xs text-muted-foreground block">Phone</label>
                          <p className="font-medium">{school.contact_number || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Info */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">Location</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <label className="text-xs text-muted-foreground block">Address</label>
                          <p className="font-medium">{school.address || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground block">City</label>
                          <p className="font-medium">{school.city || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block">State</label>
                          <p className="font-medium">{school.state || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block">Pincode</label>
                          <p className="font-medium">{school.pincode || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block">Post Office</label>
                          <p className="font-medium">{school.post_office || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Information Card */}
            {owner && (
              <div className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <User className="mr-2" /> Owner Information
                </h2>
                <div className="flex items-start gap-4">
                  <img 
                    src={owner.photo_url || `https://ui-avatars.com/api/?name=${owner.full_name}&background=random`} 
                    alt={owner.full_name} 
                    className="h-16 w-16 rounded-full object-cover border-2 border-border" 
                  />
                  <div className="flex-1">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Name</dt>
                        <dd className="font-semibold">{owner.full_name || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground flex items-center">
                          <Mail className="h-3 w-3 mr-1" /> Email
                        </dt>
                        <dd>{owner.email || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground flex items-center">
                          <Phone className="h-3 w-3 mr-1" /> Phone
                        </dt>
                        <dd>{owner.phone || 'N/A'}</dd>
                      </div>
                    </dl>
                    <div className="mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSchoolToManage(school)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Owner
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Information Card */}
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CreditCard className="mr-2" /> Subscription Information
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Active Package</dt>
                  <dd className="font-semibold">
                    {school.plan ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {school.plan.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No Plan Assigned</span>
                    )}
                  </dd>
                </div>
                {school.plan && (
                  <>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Price</dt>
                      <dd>₹{school.plan.price || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Period</dt>
                      <dd>{school.plan.subscription_period_value || 'N/A'} {school.plan.subscription_period_type || ''}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Date of Start</dt>
                  <dd>
                    {school.subscription?.[0]?.start_date 
                      ? formatDate(school.subscription[0].start_date) 
                      : formatDate(school.created_at)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Date of Expiry</dt>
                  <dd>
                    {school.subscription?.[0]?.end_date 
                      ? formatDate(school.subscription[0].end_date) 
                      : calculateExpiryDate(school.created_at, school.plan)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Subscription Status</dt>
                  <dd>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      school.subscription?.[0]?.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {school.subscription?.[0]?.status?.toUpperCase() || 'N/A'}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Last Updated</dt>
                  <dd>
                    {school.subscription?.[0]?.updated_at 
                      ? formatDate(school.subscription[0].updated_at) 
                      : formatDate(school.updated_at)}
                  </dd>
                </div>
              </dl>
              {!school.plan && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={() => setSchoolToAssignPlan(school)}
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Assign Subscription Plan
                  </Button>
                </div>
              )}
            </div>

            {/* Payment History Card */}
            <div className="bg-card p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <CreditCard className="mr-2" /> Payment History
                </h2>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopyPaymentHistory}
                    disabled={transactions.length === 0}
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportPDF}
                    disabled={transactions.length === 0}
                  >
                    <Download className="h-4 w-4 mr-1" /> Export
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Sl</th>
                      <th className="px-4 py-2 text-left">Package</th>
                      <th className="px-4 py-2 text-left">Purchase Date</th>
                      <th className="px-4 py-2 text-left">Date of Expiry</th>
                      <th className="px-4 py-2 text-left">Trx ID</th>
                      <th className="px-4 py-2 text-right">Paid</th>
                      <th className="px-4 py-2 text-center">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-muted-foreground">
                          No payment history found.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t, i) => (
                        <tr key={t.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3">{i + 1}</td>
                          <td className="px-4 py-3">{t.plan?.name || 'N/A'}</td>
                          <td className="px-4 py-3">{formatDate(t.created_at)}</td>
                          <td className="px-4 py-3">{calculateExpiryDate(t.created_at, school.plan)}</td>
                          <td className="px-4 py-3 font-mono text-xs">{t.transaction_id || 'N/A'}</td>
                          <td className="px-4 py-3 text-right font-semibold">₹{t.amount || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 rounded text-xs bg-muted">
                              {t.payment_method || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Modules Permission Card */}
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <ShieldCheck className="mr-2" /> Modules Permission
              </h2>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {Object.entries(schoolModuleMap).map(([key, { label }]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={`module-${key}`} className="text-sm">{label}</Label>
                    <Checkbox 
                      id={`module-${key}`} 
                      checked={enabledModules.includes(key)} 
                      disabled 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* School Statistics Card */}
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Payments</span>
                  <span className="font-semibold">{transactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">
                    ₹{transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modules Enabled</span>
                  <span className="font-semibold">{enabledModules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">School Code</span>
                  <span className="font-semibold font-mono">
                    {school.enrollment_id_prefix}{school.enrollment_id_number}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!schoolToDelete} onOpenChange={(open) => !open && setSchoolToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
               ️ HARD DELETE - Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action <strong>CANNOT</strong> be undone. This will <strong>permanently delete</strong>:
              <ul className="list-disc ml-6 mt-3 space-y-1">
                <li><strong>{schoolToDelete?.name}</strong> school</li>
                <li>All user accounts (email, login credentials)</li>
                <li>All profiles (owner, staff, students)</li>
                <li>All academic data (classes, sections, subjects)</li>
                <li>All financial records (fees, payments)</li>
                <li>All other related data</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSchool}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting Everything...
                </>
              ) : (
                'Yes, PERMANENTLY delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Plan Dialog */}
      {schoolToAssignPlan && (
        <AssignPlanDialog 
          school={schoolToAssignPlan}
          isOpen={!!schoolToAssignPlan}
          onOpenChange={(isOpen) => !isOpen && setSchoolToAssignPlan(null)}
          onPlanAssigned={fetchSchoolDetails}
        />
      )}

      {/* Manage Owner Dialog */}
      {schoolToManage && (
        <ManageOwnerDialog 
          school={schoolToManage}
          owner={owner}
          isOpen={!!schoolToManage}
          onOpenChange={(isOpen) => !isOpen && setSchoolToManage(null)}
          onOwnerUpdate={fetchSchoolDetails}
        />
      )}
    </DashboardLayout>
  );
};

export default SchoolDetails;

