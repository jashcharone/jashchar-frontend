import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, TrendingDown, IndianRupee, Users, Clock,
  CheckCircle2, AlertTriangle, Calendar, Wallet, CreditCard,
  Building2, Target, Activity, Zap, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════════
// FEE DASHBOARD WIDGETS
// Reusable widget components for fee management dashboards
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format currency in Indian format
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format compact currency (L, Cr)
 */
export const formatCompactCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

// ─────────────────────────────────────────────────────────────────────────────────
// COLLECTION SUMMARY WIDGET
// ─────────────────────────────────────────────────────────────────────────────────

export const CollectionSummaryWidget = ({ 
  totalAllocated = 0, 
  totalCollected = 0, 
  totalDue = 0,
  collectionRate = 0,
  trend = null,
  size = 'default' // 'compact' | 'default' | 'large'
}) => {
  const isCompact = size === 'compact';
  
  return (
    <Card className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-br from-primary/5 to-primary/10"
    )}>
      <CardHeader className={cn("pb-2", isCompact && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isCompact ? "text-sm" : "text-lg")}>
          <Target className={cn(isCompact ? "h-4 w-4" : "h-5 w-5", "text-primary")} />
          Collection Summary
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(isCompact && "p-3 pt-0")}>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Collection Progress</span>
              <span className="font-semibold">{collectionRate.toFixed(1)}%</span>
            </div>
            <Progress value={collectionRate} className="h-3" />
          </div>
          
          {/* Stats Grid */}
          <div className={cn("grid gap-3", isCompact ? "grid-cols-2" : "grid-cols-3")}>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className={cn("font-bold text-blue-600", isCompact ? "text-lg" : "text-xl")}>
                {formatCompactCurrency(totalAllocated)}
              </p>
              <p className="text-xs text-blue-600/70">Allocated</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className={cn("font-bold text-green-600", isCompact ? "text-lg" : "text-xl")}>
                {formatCompactCurrency(totalCollected)}
              </p>
              <p className="text-xs text-green-600/70">Collected</p>
            </div>
            {!isCompact && (
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xl font-bold text-amber-600">
                  {formatCompactCurrency(totalDue)}
                </p>
                <p className="text-xs text-amber-600/70">Pending</p>
              </div>
            )}
          </div>
          
          {/* Trend */}
          {trend !== null && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {trend >= 0 ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{trend.toFixed(1)}% vs last month
                </Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-100 text-red-700">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {trend.toFixed(1)}% vs last month
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// TODAY'S COLLECTION WIDGET
// ─────────────────────────────────────────────────────────────────────────────────

export const TodayCollectionWidget = ({
  amount = 0,
  payments = 0,
  students = 0,
  variant = 'default' // 'default' | 'minimal' | 'highlight'
}) => {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-green-600" />
          <span className="font-medium text-green-700">Today</span>
        </div>
        <span className="text-2xl font-bold text-green-600">{formatCurrency(amount)}</span>
      </div>
    );
  }

  return (
    <Card className={cn(
      variant === 'highlight' && "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn(
              "text-sm font-medium uppercase tracking-wider",
              variant === 'highlight' ? "text-green-100" : "text-muted-foreground"
            )}>
              Today's Collection
            </p>
            <p className={cn(
              "text-3xl font-bold mt-1",
              variant === 'highlight' ? "text-white" : "text-green-600"
            )}>
              {formatCurrency(amount)}
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-2xl",
            variant === 'highlight' ? "bg-white/20" : "bg-green-100"
          )}>
            <IndianRupee className={cn(
              "h-8 w-8",
              variant === 'highlight' ? "text-white" : "text-green-600"
            )} />
          </div>
        </div>
        <Separator className={cn("my-4", variant === 'highlight' && "bg-white/20")} />
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className={cn(
              "text-2xl font-bold",
              variant === 'highlight' ? "text-white" : "text-gray-800"
            )}>
              {payments}
            </p>
            <p className={cn(
              "text-sm",
              variant === 'highlight' ? "text-green-100" : "text-muted-foreground"
            )}>
              Payments
            </p>
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold",
              variant === 'highlight' ? "text-white" : "text-gray-800"
            )}>
              {students}
            </p>
            <p className={cn(
              "text-sm",
              variant === 'highlight' ? "text-green-100" : "text-muted-foreground"
            )}>
              Students
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// PAYMENT STATUS WIDGET
// ─────────────────────────────────────────────────────────────────────────────────

export const PaymentStatusWidget = ({
  fullyPaid = 0,
  partialPaid = 0,
  unpaid = 0,
  totalStudents = 0,
  layout = 'vertical' // 'vertical' | 'horizontal' | 'pie'
}) => {
  const total = fullyPaid + partialPaid + unpaid;
  const fullyPaidPercent = total > 0 ? (fullyPaid / total) * 100 : 0;
  const partialPercent = total > 0 ? (partialPaid / total) * 100 : 0;
  const unpaidPercent = total > 0 ? (unpaid / total) * 100 : 0;

  if (layout === 'horizontal') {
    return (
      <div className="flex gap-2 h-8 rounded-full overflow-hidden bg-gray-100">
        {fullyPaidPercent > 0 && (
          <div 
            className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${fullyPaidPercent}%` }}
          >
            {fullyPaidPercent > 10 && `${Math.round(fullyPaidPercent)}%`}
          </div>
        )}
        {partialPercent > 0 && (
          <div 
            className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${partialPercent}%` }}
          >
            {partialPercent > 10 && `${Math.round(partialPercent)}%`}
          </div>
        )}
        {unpaidPercent > 0 && (
          <div 
            className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${unpaidPercent}%` }}
          >
            {unpaidPercent > 10 && `${Math.round(unpaidPercent)}%`}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Payment Status
          <Badge variant="secondary" className="ml-auto">{totalStudents} Students</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Fully Paid */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-24">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Paid</span>
            </div>
            <div className="flex-1">
              <Progress value={fullyPaidPercent} className="h-2 bg-green-100" />
            </div>
            <div className="w-20 text-right">
              <span className="font-semibold text-green-600">{fullyPaid}</span>
              <span className="text-xs text-muted-foreground ml-1">({Math.round(fullyPaidPercent)}%)</span>
            </div>
          </div>

          {/* Partial Paid */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-24">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Partial</span>
            </div>
            <div className="flex-1">
              <Progress value={partialPercent} className="h-2 bg-amber-100" />
            </div>
            <div className="w-20 text-right">
              <span className="font-semibold text-amber-600">{partialPaid}</span>
              <span className="text-xs text-muted-foreground ml-1">({Math.round(partialPercent)}%)</span>
            </div>
          </div>

          {/* Unpaid */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-24">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm">Unpaid</span>
            </div>
            <div className="flex-1">
              <Progress value={unpaidPercent} className="h-2 bg-red-100" />
            </div>
            <div className="w-20 text-right">
              <span className="font-semibold text-red-600">{unpaid}</span>
              <span className="text-xs text-muted-foreground ml-1">({Math.round(unpaidPercent)}%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// OVERDUE ALERT WIDGET
// ─────────────────────────────────────────────────────────────────────────────────

export const OverdueAlertWidget = ({
  overdueCount = 0,
  overdueAmount = 0,
  dueThisWeek = 0,
  onClick
}) => {
  if (overdueCount === 0 && dueThisWeek === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-green-700">All Clear!</p>
          <p className="text-sm text-green-600">No overdue payments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-red-50 border-red-200 cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-700">Overdue Payments</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{overdueCount}</p>
            <p className="text-sm text-red-600/70">students have overdue fees</p>
            <Separator className="my-3 bg-red-200" />
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Total Overdue:</span>
              <span className="font-bold text-red-700">{formatCurrency(overdueAmount)}</span>
            </div>
            {dueThisWeek > 0 && (
              <div className="flex justify-between text-sm mt-2">
                <span className="text-amber-600">Due This Week:</span>
                <span className="font-bold text-amber-700">{dueThisWeek} students</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// PAYMENT MODE BREAKDOWN WIDGET
// ─────────────────────────────────────────────────────────────────────────────────

export const PaymentModeWidget = ({
  modes = [], // [{ mode: 'Cash', amount: 5000, count: 10 }, ...]
  layout = 'list' // 'list' | 'cards' | 'bar'
}) => {
  const modeIcons = {
    Cash: Wallet,
    Online: CreditCard,
    UPI: Zap,
    Bank: Building2,
    Cheque: CreditCard,
  };

  const modeColors = {
    Cash: 'green',
    Online: 'blue',
    UPI: 'purple',
    Bank: 'gray',
    Cheque: 'amber',
  };

  const total = modes.reduce((sum, m) => sum + (m.amount || 0), 0);

  if (layout === 'cards') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {modes.map((m, idx) => {
          const Icon = modeIcons[m.mode] || Wallet;
          const color = modeColors[m.mode] || 'gray';
          return (
            <div 
              key={idx}
              className={cn(
                "p-4 rounded-lg text-center",
                `bg-${color}-50 dark:bg-${color}-900/20`
              )}
            >
              <Icon className={cn("h-6 w-6 mx-auto mb-2", `text-${color}-600`)} />
              <p className={cn("text-xl font-bold", `text-${color}-700`)}>
                {formatCompactCurrency(m.amount)}
              </p>
              <p className={cn("text-sm", `text-${color}-600`)}>{m.mode}</p>
              <p className="text-xs text-muted-foreground">{m.count} payments</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {modes.map((m, idx) => {
          const Icon = modeIcons[m.mode] || Wallet;
          const color = modeColors[m.mode] || 'gray';
          const percentage = total > 0 ? (m.amount / total) * 100 : 0;
          
          return (
            <div key={idx} className="flex items-center gap-4">
              <div className={cn("p-2 rounded-lg", `bg-${color}-100`)}>
                <Icon className={cn("h-4 w-4", `text-${color}-600`)} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{m.mode}</span>
                  <span className="text-muted-foreground">{m.count} payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={percentage} className="h-1.5 flex-1" />
                  <span className="text-sm font-semibold w-20 text-right">
                    {formatCompactCurrency(m.amount)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// CLASS WISE COLLECTION WIDGET
// ─────────────────────────────────────────────────────────────────────────────────

export const ClassWiseCollectionWidget = ({
  classes = [], // [{ name: 'Class 1', allocated: 10000, collected: 8000, students: 30 }, ...]
  sortBy = 'name' // 'name' | 'collected' | 'pending' | 'rate'
}) => {
  const sortedClasses = [...classes].sort((a, b) => {
    switch (sortBy) {
      case 'collected':
        return b.collected - a.collected;
      case 'pending':
        return (b.allocated - b.collected) - (a.allocated - a.collected);
      case 'rate':
        const rateA = a.allocated > 0 ? a.collected / a.allocated : 0;
        const rateB = b.allocated > 0 ? b.collected / b.allocated : 0;
        return rateB - rateA;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Class-wise Collection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedClasses.map((cls, idx) => {
            const rate = cls.allocated > 0 ? (cls.collected / cls.allocated) * 100 : 0;
            return (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{cls.name}</span>
                  <Badge variant={rate >= 80 ? 'default' : rate >= 50 ? 'secondary' : 'destructive'}>
                    {rate.toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={rate} className="h-1.5 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{cls.students} students</span>
                  <span>
                    {formatCompactCurrency(cls.collected)} / {formatCompactCurrency(cls.allocated)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// QUICK STAT MINI WIDGET
// ─────────────────────────────────────────────────────────────────────────────────

export const QuickStatMini = ({ 
  label, 
  value, 
  icon: Icon = Activity, 
  color = 'primary',
  trend,
  onClick 
}) => (
  <div 
    className={cn(
      "flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50",
      onClick && "cursor-pointer hover:bg-gray-100 transition-colors"
    )}
    onClick={onClick}
  >
    <div className={cn("p-2 rounded-lg", `bg-${color}/10`)}>
      <Icon className={cn("h-4 w-4", `text-${color}`)} />
    </div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
    {trend !== undefined && (
      <div className={cn(
        "text-xs font-medium",
        trend >= 0 ? "text-green-600" : "text-red-600"
      )}>
        {trend >= 0 ? '+' : ''}{trend}%
      </div>
    )}
  </div>
);

export default {
  CollectionSummaryWidget,
  TodayCollectionWidget,
  PaymentStatusWidget,
  OverdueAlertWidget,
  PaymentModeWidget,
  ClassWiseCollectionWidget,
  QuickStatMini,
  formatCurrency,
  formatCompactCurrency,
};
