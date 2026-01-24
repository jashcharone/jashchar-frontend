/**
 * Frontend Billing Status Utility Functions
 * Handles subscription status calculation including grace period logic
 */

/**
 * Calculate subscription status with grace period
 * @param {Object} subscription - Subscription object with end_date, status, grace_period_end_date
 * @returns {Object} Status object with { status, isInGracePeriod, daysRemaining, graceDaysRemaining }
 */
export const calculateBillingStatus = (subscription) => {
  if (!subscription) {
    return {
      status: 'inactive',
      isInGracePeriod: false,
      daysRemaining: null,
      graceDaysRemaining: null,
      effectiveStatus: 'inactive',
      message: 'No active subscription'
    };
  }

  const now = new Date();
  const endDate = subscription.end_date ? new Date(subscription.end_date) : null;
  const gracePeriodEndDate = subscription.grace_period_end_date 
    ? new Date(subscription.grace_period_end_date) 
    : null;

  // If no end date, it's lifetime
  if (!endDate) {
    return {
      status: 'active',
      isInGracePeriod: false,
      daysRemaining: null,
      graceDaysRemaining: null,
      effectiveStatus: 'active',
      message: 'Lifetime subscription'
    };
  }

  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  const isExpired = endDate < now;

  // Check if in grace period
  if (isExpired && gracePeriodEndDate && gracePeriodEndDate > now) {
    const graceDaysRemaining = Math.ceil((gracePeriodEndDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      status: 'grace_period',
      isInGracePeriod: true,
      daysRemaining: 0,
      graceDaysRemaining: graceDaysRemaining,
      effectiveStatus: 'active', // School remains active during grace period
      message: `Subscription expired. ${graceDaysRemaining} days remaining in grace period.`,
      severity: graceDaysRemaining <= 2 ? 'critical' : graceDaysRemaining <= 4 ? 'warning' : 'info'
    };
  }

  // Check if grace period ended
  if (isExpired && gracePeriodEndDate && gracePeriodEndDate <= now) {
    return {
      status: 'expired',
      isInGracePeriod: false,
      daysRemaining: 0,
      graceDaysRemaining: 0,
      effectiveStatus: 'suspended',
      message: 'Subscription expired and grace period ended. Please renew to continue.',
      severity: 'critical'
    };
  }

  // Active subscription
  if (daysRemaining > 7) {
    return {
      status: 'active',
      isInGracePeriod: false,
      daysRemaining: daysRemaining,
      graceDaysRemaining: null,
      effectiveStatus: 'active',
      message: `Active subscription. Expires in ${daysRemaining} days.`,
      severity: 'success'
    };
  }

  // Expiring soon (within 7 days)
  if (daysRemaining > 0 && daysRemaining <= 7) {
    return {
      status: 'expiring_soon',
      isInGracePeriod: false,
      daysRemaining: daysRemaining,
      graceDaysRemaining: null,
      effectiveStatus: 'active',
      message: `Subscription expires in ${daysRemaining} days.`,
      severity: daysRemaining <= 3 ? 'warning' : 'info'
    };
  }

  // Expired but no grace period set yet (shouldn't happen, but handle it)
  if (isExpired && !gracePeriodEndDate) {
    return {
      status: 'expired',
      isInGracePeriod: false,
      daysRemaining: 0,
      graceDaysRemaining: null,
      effectiveStatus: 'suspended',
      message: 'Subscription expired. Please renew.',
      severity: 'critical'
    };
  }

  return {
    status: 'active',
    isInGracePeriod: false,
    daysRemaining: daysRemaining,
    graceDaysRemaining: null,
    effectiveStatus: 'active',
    message: `Active subscription. Expires in ${daysRemaining} days.`,
    severity: 'success'
  };
};

/**
 * Get status badge configuration
 * @param {Object} statusObj - Status object from calculateBillingStatus
 * @returns {Object} Badge config with variant, label, color
 */
export const getStatusBadge = (statusObj) => {
  const { status, daysRemaining, graceDaysRemaining } = statusObj;

  switch (status) {
    case 'active':
      return {
        variant: 'default',
        label: 'Active',
        color: 'green',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      };
    
    case 'expiring_soon':
      return {
        variant: 'warning',
        label: `Expires in ${daysRemaining} days`,
        color: 'yellow',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      };
    
    case 'grace_period':
      return {
        variant: 'warning',
        label: `Grace Period (${graceDaysRemaining} days)`,
        color: 'orange',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      };
    
    case 'expired':
      return {
        variant: 'destructive',
        label: 'Expired',
        color: 'red',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      };
    
    default:
      return {
        variant: 'secondary',
        label: 'Unknown',
        color: 'gray',
        className: 'bg-gray-100 text-gray-800'
      };
  }
};

/**
 * Format expiry date with grace period info
 * @param {Date|string} endDate - Subscription end date
 * @param {Date|string|null} gracePeriodEndDate - Grace period end date
 * @returns {string} Formatted date string
 */
export const formatExpiryDate = (endDate, gracePeriodEndDate = null) => {
  if (!endDate) return 'Lifetime';
  
  const end = new Date(endDate);
  const now = new Date();
  
  if (end < now && gracePeriodEndDate) {
    const graceEnd = new Date(gracePeriodEndDate);
    if (graceEnd > now) {
      return `Expired (Grace until ${graceEnd.toLocaleDateString()})`;
    }
  }
  
  return end.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

