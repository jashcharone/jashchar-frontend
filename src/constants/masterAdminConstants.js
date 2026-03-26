export const MASTER_ADMIN_CONSTANTS = {
  PROTECTED_TABLES: [
    'schools',
    'users', // auth.users concept, usually managed via edge functions or profiles
    'school_owner_profiles',
    'master_admin_profiles',
    'subscription_plans',
    'school_subscriptions',
    'subscription_invoices',
    'transactions',
    'fee_payments',
    'billing_audit',
    'enterprise_shield', // logical concept
    'system_settings',
    'roles',
    'permissions'
  ],
  PROTECTED_ROUTES: [
    '/master-admin/schools',
    '/master-admin/enterprise-shield',
    '/master-admin/system-settings',
    '/master-admin/billing',
    '/master-admin/subscriptions'
  ],
  PROTECTED_OPERATIONS: ['INSERT', 'UPDATE', 'DELETE']
};
