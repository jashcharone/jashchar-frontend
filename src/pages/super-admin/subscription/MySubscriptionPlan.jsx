import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, AlertCircle, Calendar, Users, UserCheck, Shield, CreditCard, Clock, AlertTriangle, Zap } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { calculateBillingStatus, getStatusBadge, formatExpiryDate } from '@/utils/billingStatus';
import SubscriptionExpiryWidget from '@/components/subscription/SubscriptionExpiryWidget';

const MySubscriptionPlan = () => {
    const { user, loading: authLoading } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [schoolUsage, setSchoolUsage] = useState({ active_students: 0, active_staff: 0 });

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    useEffect(() => {
        if (authLoading) return;

        if (!branchId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch subscription details with grace_period_end_date
                const { data: schoolData, error: schoolError } = await supabase
                    .from('schools')
                    .select(`
                        name,
                        subscription:school_subscriptions (
                            id,
                            status,
                            start_date,
                            end_date,
                            grace_period_end_date,
                            auto_renew,
                            total_students,
                            total_staff,
                            plan:subscription_plans (
                                name,
                                description,
                                plan_type,
                                price,
                                subscription_period_type,
                                subscription_period_value,
                                per_student_charge,
                                per_staff_charge,
                                modules
                            )
                        )
                    `)
                    .eq('id', branchId)
                    .single();

                if (schoolError) throw schoolError;

                // Fetch current usage stats
                const { data: usageData, error: usageError } = await supabase.rpc('get_school_usage', { p_branch_id: branchId });
                
                if (usageError) {
                    console.error('Error fetching usage:', usageError);
                    // Fallback to 0 if RPC fails
                    setSchoolUsage({ active_students: 0, active_staff: 0 });
                } else if (usageData && usageData.length > 0) {
                    setSchoolUsage(usageData[0]);
                }

                if (schoolData?.subscription && schoolData.subscription.length > 0) {
                    // Sort by start_date descending to get the latest
                    const latestSub = schoolData.subscription.sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
                    setSubscription(latestSub);
                } else {
                    setSubscription(null);
                }

            } catch (error) {
                console.error("Error fetching subscription:", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to load subscription details." });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [branchId, authLoading, toast]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!subscription) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                    <AlertCircle className="h-16 w-16 text-yellow-500" />
                    <h2 className="text-2xl font-bold">No Active Subscription</h2>
                    <p className="text-muted-foreground max-w-md">
                        It seems you don't have an active subscription plan. Please contact the master admin to activate your account.
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    const { plan, status, end_date, grace_period_end_date, total_students, total_staff } = subscription;
    const isPrepaid = plan.plan_type === 'Prepaid';
    
    // Calculate billing status with grace period
    const billingStatus = calculateBillingStatus(subscription);
    const statusBadge = getStatusBadge(billingStatus);
    
    const daysRemaining = billingStatus.daysRemaining;
    const graceDaysRemaining = billingStatus.graceDaysRemaining;
    const studentPercentage = isPrepaid && total_students > 0 ? (schoolUsage.active_students / total_students) * 100 : 0;
    const staffPercentage = isPrepaid && total_staff > 0 ? (schoolUsage.active_staff / total_staff) * 100 : 0;

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">My Subscription Plan</h1>
            
            {/* Subscription Expiry Widget */}
            <div className="mb-6">
                <SubscriptionExpiryWidget subscription={subscription} plan={plan} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plan Overview Card */}
                <Card className="lg:col-span-2 border-primary/20 shadow-md">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl text-primary">{plan.name}</CardTitle>
                                <CardDescription className="mt-1">{plan.description}</CardDescription>
                            </div>
                            <Badge className={statusBadge.className}>
                                {statusBadge.label}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Grace Period Alert */}
                        {billingStatus.isInGracePeriod && (
                            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <AlertTitle>Grace Period Active</AlertTitle>
                                <AlertDescription>
                                    Your subscription has expired, but you have {graceDaysRemaining} days remaining in the grace period. 
                                    Please renew your subscription to avoid service interruption.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Expiring Soon Alert */}
                        {billingStatus.status === 'expiring_soon' && (
                            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                                <Zap className="h-4 w-4 text-yellow-600" />
                                <AlertTitle>Renewal Due Soon</AlertTitle>
                                <AlertDescription>
                                    Your subscription expires in {daysRemaining} days. Please renew to avoid interruption.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Billing Type</p>
                                <p className="text-lg font-semibold flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    {plan.plan_type}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Expiration Date</p>
                                <p className="text-lg font-semibold flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    {formatExpiryDate(end_date, grace_period_end_date)}
                                </p>
                                {billingStatus.isInGracePeriod ? (
                                    <div className="space-y-1">
                                        <p className="text-xs text-orange-600 font-bold flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {graceDaysRemaining} grace days remaining
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Original expiry: {end_date ? format(new Date(end_date), 'MMM dd, yyyy') : 'N/A'}
                                        </p>
                                    </div>
                                ) : daysRemaining !== null && (
                                    <p className={`text-xs ${daysRemaining <= 7 ? 'text-yellow-600 font-bold' : 'text-green-600'}`}>
                                        {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Module Access
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {plan.modules && plan.modules.length > 0 ? (
                                    plan.modules.map((mod, idx) => (
                                        <Badge key={idx} variant="secondary" className="bg-secondary/50">
                                            {mod.replace(/_/g, ' ')}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground">No specific modules assigned.</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Usage Statistics Card */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Usage Statistics</CardTitle>
                        <CardDescription>Current resource utilization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Student Usage */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" /> Students
                                </span>
                                <span className="font-medium">
                                    {schoolUsage.active_students} / {isPrepaid ? total_students : 'Unlimited'}
                                </span>
                            </div>
                            {isPrepaid && (
                                <Progress value={studentPercentage} className={`h-2 ${studentPercentage > 90 ? 'bg-red-100' : ''}`} indicatorClassName={studentPercentage > 90 ? 'bg-red-500' : ''} />
                            )}
                        </div>

                        {/* Staff Usage */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <UserCheck className="h-4 w-4" /> Staff
                                </span>
                                <span className="font-medium">
                                    {schoolUsage.active_staff} / {isPrepaid ? total_staff : 'Unlimited'}
                                </span>
                            </div>
                            {isPrepaid && (
                                <Progress value={staffPercentage} className={`h-2 ${staffPercentage > 90 ? 'bg-red-100' : ''}`} indicatorClassName={staffPercentage > 90 ? 'bg-red-500' : ''} />
                            )}
                        </div>

                        <div className="pt-4 mt-4 border-t text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                            {isPrepaid ? (
                                <p>You are on a <strong>Prepaid</strong> plan. Usage limits are strictly enforced. Upgrade your plan if you need to add more users.</p>
                            ) : (
                                <p>You are on a <strong>Postpaid</strong> plan. You will be billed at the end of the cycle based on the maximum number of active users.</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" onClick={() => toast({title: "Contact Support", description: "Please contact Master Admin to upgrade your plan."})}>
                            Request Upgrade
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default MySubscriptionPlan;
