import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import DashboardLayout from '@/components/DashboardLayout';
import { Link } from 'react-router-dom';
import { Loader2, PlusCircle, Edit, Trash2, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/apiClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SubscriptionPlans = () => {
    const { toast } = useToast();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [syncing, setSyncing] = useState(null);

    const fetchPlans = async () => {
        setLoading(true);
        let query = supabase.from('subscription_plans').select('*').order('created_at', { ascending: false });
        
        if (showActiveOnly) {
            query = query.eq('status', true);
        }

        const { data, error } = await query;
        
        if (error) {
            toast({ variant: "destructive", title: "Error fetching plans", description: error.message });
        } else {
            setPlans(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPlans();
    }, [showActiveOnly]);

    const handleStatusChange = async (planId, newStatus) => {
        const { error } = await supabase.from('subscription_plans').update({ status: newStatus }).eq('id', planId);
        if (error) {
            toast({ variant: "destructive", title: "Error updating status", description: error.message });
        } else {
            toast({ title: "Status Updated", description: "Plan status has been changed." });
            if (showActiveOnly && !newStatus) {
                fetchPlans();
            } else {
                setPlans(plans.map(plan => plan.id === planId ? { ...plan, status: newStatus } : plan));
            }
        }
    };
    
    const handleDeletePlan = async (planId) => {
        const { error } = await supabase.from('subscription_plans').delete().eq('id', planId);
         if (error) {
            toast({ variant: "destructive", title: "Error deleting plan", description: error.message });
        } else {
            toast({ title: "Plan Deleted", description: "The plan has been successfully deleted." });
            fetchPlans();
        }
    }

    const handleSyncPermissions = async (planId) => {
        setSyncing(planId);
        try {
            const response = await apiClient.post('/subscriptions/sync-permissions', { planId });
            if (response.data) {
                const { schoolsUpdated, permissionsAdded } = response.data.details;
                toast({ 
                    title: "Sync Complete", 
                    description: `Updated ${schoolsUpdated} schools with ${permissionsAdded} new permissions.` 
                });
            }
        } catch (error) {
            console.error("Sync Error:", error);
            toast({ 
                variant: "destructive", 
                title: "Sync Failed", 
                description: error.response?.data?.message || error.message 
            });
        } finally {
            setSyncing(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold">Subscription Plans</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border">
                        <Switch 
                            id="active-filter" 
                            checked={showActiveOnly} 
                            onCheckedChange={setShowActiveOnly} 
                        />
                        <Label htmlFor="active-filter" className="cursor-pointer">Show Active Only</Label>
                    </div>
                    <Link to="/master-admin/subscription-invoices">
                        <Button variant="outline">View Invoices</Button>
                    </Link>
                     <Link to="/master-admin/add-subscription-plan">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Plan
                        </Button>
                    </Link>
                </div>
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="overflow-x-auto bg-card p-4 rounded-lg shadow border">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pricing</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Limits</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                {/* Removed Manage Modules Column */}
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {plans.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-muted-foreground">
                                        No subscription plans found.
                                    </td>
                                </tr>
                            ) : (
                                plans.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{plan.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><Badge variant={plan.plan_type === 'Prepaid' ? 'secondary' : 'default'}>{plan.plan_type}</Badge></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {plan.plan_type === 'Prepaid' ? (
                                                <span className="font-semibold">₹{plan.price || '0'}</span>
                                            ) : (
                                                <div className="flex flex-col text-xs">
                                                    <span>Student: ₹{plan.per_student_charge || '0'}</span>
                                                    <span>Staff: ₹{plan.per_staff_charge || '0'}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {plan.plan_type === 'Prepaid' ? (
                                                <div className="flex flex-col text-xs">
                                                    <span>Students: {plan.no_of_students}</span>
                                                    <span>Staff: {plan.no_of_staffs}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Unlimited</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Switch
                                                checked={plan.status}
                                                onCheckedChange={(newStatus) => handleStatusChange(plan.id, newStatus)}
                                            />
                                        </td>
                                        {/* Removed Manage Modules Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon"
                                                                onClick={() => handleSyncPermissions(plan.id)}
                                                                disabled={syncing === plan.id}
                                                            >
                                                                {syncing === plan.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                                ) : (
                                                                    <RefreshCw className="h-4 w-4 text-blue-600" />
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Sync Permissions to All Schools</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <Link to={`/master-admin/edit-subscription-plan/${plan.id}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the subscription plan.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeletePlan(plan.id)} className="bg-destructive hover:bg-destructive/90">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </DashboardLayout>
    );
};

export default SubscriptionPlans;

