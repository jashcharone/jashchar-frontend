import { Book, Building2, User, Users, Settings, Briefcase, GraduationCap, CreditCard, LayoutDashboard, MonitorPlay, BarChart, FileText, Newspaper, Mail, IndianRupee, List, Shield, SlidersHorizontal } from 'lucide-react';

const MasterAdminModules = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/master-admin-dashboard'
  },
  {
    title: 'Schools',
    icon: Building2,
    path: '/master-admin/schools'
  },
  {
    title: 'Subscriptions',
    icon: CreditCard,
    subModules: [
      { title: 'All Subscriptions', path: '/master-admin/subscriptions/list', icon: List },
      { title: 'Subscription Plans', path: '/master-admin/subscriptions/plans', icon: IndianRupee },
      { title: 'Transactions', path: '/master-admin/subscriptions/transactions', icon: IndianRupee },
    ]
  },
  {
    title: 'Frontend CMS',
    icon: MonitorPlay,
    subModules: [
        { title: 'Website Settings', path: '/master-admin/frontend-cms/website-settings', icon: Settings },
    ]
  },
  {
    title: 'System Settings',
    icon: Settings,
    subModules: [
        { title: 'Session Setting', path: '/master-admin/system-settings/session', icon: SlidersHorizontal },
        { title: 'Role & Permission', path: '/master-admin/system-settings/role-permission', icon: Shield },
        { title: 'Email Settings', path: '/master-admin/system-settings/email', icon: Mail },
    ]
  }
];

export default MasterAdminModules;
