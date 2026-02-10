
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from '@/contexts/SupabaseAuthContext.jsx';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import { BranchProvider } from '@/contexts/BranchContext.jsx';
import { OrganizationProvider } from '@/contexts/OrganizationContext.jsx';
import { Toaster } from '@/components/ui/toaster';
import { initDevTools } from "@/utils/devTools";
import { initGlobalErrorHandlers } from "@/lib/globalErrorHandlers";
import { initSentry } from "@/lib/sentry";
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OrgSwitcher from '@/components/OrgSwitcher';
import '@/index.css';

import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import ReportIssueButton from '@/components/ReportIssue/ReportIssueButton';

// Initialize Sentry error tracking (must be first)
initSentry();

// Initialize global error handlers (Queries Finder)
initGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <GlobalErrorBoundary>
      <Router>
        <OrganizationProvider>
          <AuthProvider>
            <BranchProvider>
              <ThemeProvider>
                <App />
                <Toaster />
                <ReportIssueButton />
                <PWAInstallPrompt />
                <OrgSwitcher />
              </ThemeProvider>
            </BranchProvider>
          </AuthProvider>
        </OrganizationProvider>
      </Router>
    </GlobalErrorBoundary>
  </>
);
