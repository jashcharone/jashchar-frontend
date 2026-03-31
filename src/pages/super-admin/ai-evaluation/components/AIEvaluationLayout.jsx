/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI EVALUATION LAYOUT - Main Layout with Sidebar Navigation
 * "Cortex Evaluate™ - India's First AI Paper Valuation"
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  FileSearch,
  LayoutDashboard,
  FolderOpen,
  Upload,
  FileQuestion,
  Brain,
  ClipboardCheck,
  Award,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Home,
  ArrowLeft,
  Plus,
  MapPin
} from 'lucide-react';

const AIEvaluationLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Menu items grouped by section
  const menuSections = [
    {
      title: 'WORKFLOW',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          path: '/super-admin/ai-evaluation',
          description: 'Overview & Stats'
        },
        {
          id: 'sessions',
          label: 'Evaluation Sessions',
          icon: FolderOpen,
          path: '/super-admin/ai-evaluation/sessions',
          description: 'Manage Sessions'
        },
        {
          id: 'create-session',
          label: 'Create Session',
          icon: Plus,
          path: '/super-admin/ai-evaluation/sessions/create',
          description: 'New Evaluation'
        },
        {
          id: 'upload-papers',
          label: 'Upload Papers',
          icon: Upload,
          path: '/super-admin/ai-evaluation/sessions',
          description: 'Select Session First',
          infoOnly: true
        },
        {
          id: 'question-mapping',
          label: 'Question Mapping',
          icon: MapPin,
          path: '/super-admin/ai-evaluation/sessions',
          description: 'Select Session First',
          infoOnly: true
        }
      ]
    },
    {
      title: 'REVIEW & RESULTS',
      items: [
        {
          id: 'review',
          label: 'Teacher Review',
          icon: ClipboardCheck,
          path: '/super-admin/ai-evaluation/review',
          description: 'AI Marks Verification',
          badge: 'PENDING'
        },
        {
          id: 'final-marks',
          label: 'Final Marks',
          icon: Award,
          path: '/super-admin/ai-evaluation/final-marks',
          description: 'Approved Marks'
        }
      ]
    },
    {
      title: 'ANALYTICS & SETTINGS',
      items: [
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          path: '/super-admin/ai-evaluation/analytics',
          description: 'AI Accuracy & Insights'
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/super-admin/ai-evaluation/settings',
          description: 'OCR & AI Config'
        }
      ]
    }
  ];

  // Flatten for backward compatibility
  const menuItems = menuSections.flatMap(section => section.items);

  const isActive = (path) => {
    if (path === '/super-admin/ai-evaluation') {
      return location.pathname === path || location.pathname === path + '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* AI Evaluation Sidebar */}
      <div 
        className={`bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900 border-r border-blue-500/20 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-blue-500/20">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileSearch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-sm">Cortex Evaluate™</h2>
                  <p className="text-xs text-blue-300">AI Paper Valuation</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* AI Status Indicator */}
        {!isCollapsed && (
          <div className="px-4 py-3 mx-3 mt-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">AI Engine Active</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Tesseract OCR Ready</p>
          </div>
        )}

        {/* Exit to Main Dashboard Button */}
        <div className="px-3 mt-3">
          <Link
            to="/super-admin/dashboard"
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 
              bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 
              text-orange-300 hover:from-orange-600/30 hover:to-red-600/30 hover:text-orange-200`}
            title={isCollapsed ? 'Exit to Dashboard' : undefined}
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0 text-orange-400" />
            {!isCollapsed && (
              <div>
                <span className="text-sm font-medium">Exit to Dashboard</span>
                <p className="text-xs text-orange-400/60">Main Menu</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {menuSections.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              {!isCollapsed && (
                <div className="px-3 py-1 mb-1">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </span>
                </div>
              )}
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={({ isActive: navActive }) =>
                      `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-blue-500/30'
                          : item.infoOnly 
                            ? 'text-gray-500 hover:bg-gray-800/30 hover:text-gray-400 cursor-pointer'
                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                      }`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${
                      isActive(item.path) ? 'text-blue-400' : item.infoOnly ? 'text-gray-600' : 'text-gray-500 group-hover:text-blue-400'
                    }`} />
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span className={`text-sm font-medium ${item.infoOnly ? 'text-gray-500' : ''}`}>{item.label}</span>
                          <p className={`text-xs ${item.infoOnly ? 'text-gray-600 italic' : 'text-gray-500 group-hover:text-gray-400'}`}>{item.description}</p>
                        </div>
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            item.badge === 'PENDING' 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Powered by Cortex AI™</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default AIEvaluationLayout;
