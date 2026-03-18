/**
 * ReportGeneratorLayout - Master Layout Component
 * This is the main layout that wraps all report generator pages
 * Provides header with actions, children handle their own sidebar/content layout
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, Calendar, FileText, Briefcase, BookOpen,
  Bus, Home, Edit3, CheckSquare, CreditCard, Monitor,
  Save, Clock, PanelLeftClose, PanelLeft, RefreshCw, ArrowLeft
} from 'lucide-react';

// Gradient colors by module
const GRADIENTS = {
  blue: 'from-blue-600 to-blue-700',
  green: 'from-green-600 to-green-700',
  purple: 'from-purple-600 to-purple-700',
  orange: 'from-orange-600 to-orange-700',
  cyan: 'from-cyan-600 to-cyan-700',
  amber: 'from-amber-600 to-amber-700',
  indigo: 'from-indigo-600 to-indigo-700',
  pink: 'from-pink-600 to-pink-700',
  teal: 'from-teal-600 to-teal-700',
  rose: 'from-rose-600 to-rose-700',
  red: 'from-red-600 to-red-700',
  emerald: 'from-emerald-600 to-emerald-700',
};

// Icon mapping by color
const ICONS = {
  blue: Users,
  green: DollarSign,
  purple: Calendar,
  orange: FileText,
  cyan: Briefcase,
  amber: BookOpen,
  indigo: Bus,
  pink: Home,
  teal: Edit3,
  rose: CheckSquare,
  red: CreditCard,
  emerald: Monitor,
};

const ReportGeneratorLayout = ({
  title,                    // Page title
  subtitle,                 // Page subtitle (optional)
  moduleColor = 'blue',     // Module color for gradient
  showSidebar = true,       // Whether sidebar is visible
  onToggleSidebar,          // Toggle sidebar callback
  onSave,                   // Save template callback  
  onSchedule,               // Schedule report callback
  onRefresh,                // Refresh data callback
  isLoading = false,        // Loading state
  children                  // Main content (handles sidebar internally)
}) => {
  const navigate = useNavigate();
  const gradient = GRADIENTS[moduleColor] || GRADIENTS.blue;
  const IconComponent = ICONS[moduleColor] || Users;

  // Handle back navigation
  const handleBack = () => {
    navigate('/super-admin/reports/dashboard');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className={`bg-gradient-to-r ${gradient} text-white shadow-lg flex-shrink-0`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back + Sidebar Toggle + Title */}
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="p-2 hover:bg-white/20 rounded-lg transition"
                title="Back to Reports"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                  title={showSidebar ? 'Hide Templates' : 'Show Templates'}
                >
                  {showSidebar ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                </button>
              )}
              <div className="p-2 bg-white/20 rounded-lg">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-white/80">{subtitle}</p>}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className={`p-2 rounded-lg bg-white/10 hover:bg-white/20 transition ${isLoading ? 'animate-spin' : ''}`}
                  title="Refresh Data"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}

              {onSave && (
                <button
                  onClick={onSave}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                  title="Save Template"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Save</span>
                </button>
              )}

              {onSchedule && (
                <button
                  onClick={onSchedule}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                  title="Schedule Report"
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Schedule</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Children handle sidebar/content layout */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default ReportGeneratorLayout;
