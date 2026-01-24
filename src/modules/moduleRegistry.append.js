import React from 'react';
import { FileText, Activity, Zap, Globe, LayoutTemplate, UserPlus } from 'lucide-react';
import DomainList from '@/pages/master-admin/custom-domain/DomainList';
import DomainSettings from '@/pages/master-admin/custom-domain/DomainSettings';
import SchoolLoginPageSettings from '@/pages/school-owner/system-settings/SchoolLoginPageSettings';
import SchoolRequests from '@/pages/master-admin/SchoolRequests';

// --- DUMMY MODULES FOR VALIDATION ---
const DummyDashboard = () => <div className="p-10"><h1 className="text-2xl font-bold text-blue-600">Dummy Module 1: Analytics</h1><p>Safe injection test.</p></div>;
const DummyReports = () => <div className="p-10"><h1 className="text-2xl font-bold text-green-600">Dummy Module 2: Adv Reports</h1><p>Safe injection test.</p></div>;
const DummySettings = () => <div className="p-10"><h1 className="text-2xl font-bold text-purple-600">Dummy Module 3: Beta Settings</h1><p>Safe injection test.</p></div>;

/**
 * NEW MODULE REGISTRY
 * Register new modules here. They will be safely merged into the application.
 * 
 * Format:
 * {
 *   key: 'unique-key',
 *   role: 'master_admin' | 'school_owner' | 'student' | 'teacher',
 *   route: { path: '/path', element: <Component /> },
 *   sidebar: { title: 'Title', icon: Icon, path: '/path' }
 * }
 */

export const NEW_MODULES = [
  {
    key: 'school-requests',
    role: 'master_admin',
    route: { path: '/master-admin/school-requests', element: <SchoolRequests /> },
    sidebar: { title: 'School Requests', icon: UserPlus, path: '/master-admin/school-requests' }
  },
  {
    key: 'dummy-module-1',
    role: 'master_admin',
    route: { path: '/master-admin/dummy-analytics', element: <DummyDashboard /> },
    sidebar: { title: 'Beta Analytics', icon: Activity, path: '/master-admin/dummy-analytics' }
  },
  {
    key: 'dummy-module-2',
    role: 'school_owner',
    route: { path: '/school-owner/dummy-reports', element: <DummyReports /> },
    sidebar: { title: 'Beta Reports', icon: FileText, path: '/school-owner/dummy-reports' }
  },
  {
    key: 'dummy-module-3',
    role: 'master_admin',
    route: { path: '/master-admin/dummy-settings', element: <DummySettings /> },
    sidebar: { title: 'Beta Settings', icon: Zap, path: '/master-admin/dummy-settings' }
  },
  // ✅ Custom Domain Modules
  {
    key: 'custom-domain-list',
    role: 'master_admin',
    route: { path: '/master-admin/custom-domain', element: <DomainList /> },
    sidebar: { title: 'Custom Domain', icon: Globe, path: '/master-admin/custom-domain' }
  },
  {
    key: 'custom-domain-settings',
    role: 'master_admin',
    route: { path: '/master-admin/custom-domain/instruction', element: <DomainSettings /> }
  },
  // ✅ School Owner Login Settings
  {
    key: 'school-login-settings',
    role: 'school_owner',
    route: { path: '/school-owner/system-settings/login-page', element: <SchoolLoginPageSettings /> },
    sidebar: { title: 'Login Page Settings', icon: LayoutTemplate, path: '/school-owner/system-settings/login-page' }
  }
];
