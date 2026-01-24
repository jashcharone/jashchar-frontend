import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calendar, Clock, AlertTriangle, CheckCircle, 
  CreditCard, TrendingDown, Zap
} from 'lucide-react';
import { calculateBillingStatus, getStatusBadge, formatExpiryDate } from '@/utils/billingStatus';
import { format, differenceInDays } from 'date-fns';

const SubscriptionExpiryWidget = ({ subscription, plan, className = '' }) => {
  if (!subscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Active Subscription</AlertTitle>
            <AlertDescription>
              Please contact the administrator to activate your subscription.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const statusObj = calculateBillingStatus(subscription);
  const badgeConfig = getStatusBadge(statusObj);
  const { end_date, grace_period_end_date } = subscription;

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!end_date) return 100; // Lifetime
    
    const now = new Date();
    const end = new Date(end_date);
    
    if (statusObj.isInGracePeriod && grace_period_end_date) {
      const graceEnd = new Date(grace_period_end_date);
      const graceStart = end;
      const totalGraceDays = differenceInDays(graceEnd, graceStart);
      const remainingGraceDays = differenceInDays(graceEnd, now);
      return Math.max(0, Math.min(100, (remainingGraceDays / totalGraceDays) * 100));
    }
    
    // For active subscriptions, calculate based on plan period
    // This is a simplified calculation - you might want to use start_date for more accuracy
    if (statusObj.daysRemaining > 0) {
      // Assuming 365 days for annual plans, adjust as needed
      const totalDays = 365; // This should come from plan data
      return Math.max(0, Math.min(100, (statusObj.daysRemaining / totalDays) * 100));
    }
    
    return 0;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Status
            </CardTitle>
            <CardDescription className="mt-1">
              {plan?.name || 'No Plan'} - {plan?.subscription_period_value || 'N/A'} {plan?.subscription_period_type || ''}
            </CardDescription>
          </div>
          <Badge className={badgeConfig.className}>
            {badgeConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subscription Progress</span>
            <span className="font-medium">
              {statusObj.isInGracePeriod 
                ? `${statusObj.graceDaysRemaining} grace days left`
                : statusObj.daysRemaining !== null 
                  ? `${statusObj.daysRemaining} days remaining`
                  : 'Lifetime'}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={`h-2 ${
              statusObj.severity === 'critical' ? 'bg-red-100' :
              statusObj.severity === 'warning' ? 'bg-yellow-100' :
              'bg-green-100'
            }`}
          />
        </div>

        {/* Expiry Information */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Expiry Date
            </div>
            <p className="font-semibold">
              {formatExpiryDate(end_date, grace_period_end_date)}
            </p>
          </div>
          
          {statusObj.isInGracePeriod && grace_period_end_date && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Grace Period Ends
              </div>
              <p className="font-semibold text-orange-600 dark:text-orange-400">
                {format(new Date(grace_period_end_date), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
        </div>

        {/* Status Alert */}
        {statusObj.severity !== 'success' && (
          <Alert 
            variant={
              statusObj.severity === 'critical' ? 'destructive' :
              statusObj.severity === 'warning' ? 'default' :
              'default'
            }
            className={
              statusObj.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
              statusObj.severity === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
              'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            }
          >
            {statusObj.severity === 'critical' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : statusObj.severity === 'warning' ? (
              <Zap className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {statusObj.severity === 'critical' ? 'Action Required' :
               statusObj.severity === 'warning' ? 'Renewal Due Soon' :
               'Subscription Info'}
            </AlertTitle>
            <AlertDescription>
              {statusObj.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        {(statusObj.status === 'expiring_soon' || statusObj.status === 'grace_period' || statusObj.status === 'expired') && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Need to renew? Contact your administrator or visit the subscription page.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionExpiryWidget;

