import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Globe } from 'lucide-react';

// Import Tab Components - SINGLE SOURCE OF TRUTH
import WebsiteSettingsTab from '@/components/front-cms-editor/WebsiteSettingsTab';
import SchoolLoginSettingsTab from '@/components/front-cms-editor/SchoolLoginSettingsTab';
import GeneralSettingsTab from '@/components/front-cms-editor/GeneralSettingsTab';
import HomeLayoutTab from '@/components/front-cms-editor/HomeLayoutTab';
import PagesTab from '@/components/front-cms-editor/PagesTab';
import NewsTab from '@/components/front-cms-editor/NewsTab';
import EventsTab from '@/components/front-cms-editor/EventsTab';
import GalleryTab from '@/components/front-cms-editor/GalleryTab';
import NoticesTab from '@/components/front-cms-editor/NoticesTab';
import MenusTab from '@/components/front-cms-editor/MenusTab';
import Menus from '@/pages/super-admin/front-cms/Menus';
import MediaManagerTab from '@/components/front-cms-editor/MediaManagerTab';
import BannersTab from '@/components/front-cms-editor/BannersTab';
import { errorLoggerService } from '@/services/errorLoggerService';

/**
 * UNIFIED FRONT CMS EDITOR
 * 
 * Single component used by both Master Admin and Super Admin.
 * Only difference: how branchId is obtained.
 * 
 * Props:
 * - branchId: string (required) - School context for all operations
 * - role: 'master_admin' | 'super_admin' - For permission context
 * - basePath: string - Base route path (e.g., '/master-admin/front-cms' or '/school/front-cms')
 */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Front CMS Error:", error, errorInfo);
    errorLoggerService.logError(error, errorInfo, {
      type: 'CMS Error',
      module: 'front-cms-unified',
      role: this.props.role
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-red-200 rounded bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <h3 className="font-bold mb-2">Something went wrong</h3>
          <pre className="text-xs overflow-auto p-2 bg-white dark:bg-slate-800 rounded border">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const UnifiedFrontCmsEditor = ({ branchId, role = 'super_admin', basePath = '/school/front-cms' }) => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  console.log(`[UnifiedFrontCMS] Role: ${role}, Tab: ${tab}, SchoolId: ${branchId}`);

  // Tab to Component Mapping - SINGLE SOURCE OF TRUTH
  const routeToComponent = {
    'website-settings': WebsiteSettingsTab,
    'login-settings': SchoolLoginSettingsTab,
    'menus': Menus,
    'pages': PagesTab,
    'gallery': GalleryTab,
    'news': NewsTab,
    'media': MediaManagerTab,
    'banners': BannersTab,
    // Additional tabs
    'general-settings': GeneralSettingsTab,
    'layout': HomeLayoutTab,
    'events': EventsTab,
    'notices': NoticesTab,
  };

  const ActiveComponent = routeToComponent[tab] || WebsiteSettingsTab;

  // If no school selected
  if (!branchId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="bg-white dark:bg-slate-800 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No School Selected</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
              {role === 'master_admin' 
                ? 'Please select a school from the dropdown above to manage Front CMS.'
                : 'Unable to identify your school. Please contact support.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      <ErrorBoundary role={role}>
        <ActiveComponent branchId={branchId} />
      </ErrorBoundary>
    </div>
  );
};

export default UnifiedFrontCmsEditor;

