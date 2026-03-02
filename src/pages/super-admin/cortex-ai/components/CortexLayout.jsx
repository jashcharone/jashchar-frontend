/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CORTEX LAYOUT - Main Layout with AI Sidebar Navigation
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Brain,
  LayoutDashboard,
  BarChart3,
  Zap,
  Mic,
  Eye,
  Settings,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Cpu,
  ClipboardCheck,
  Heart,
  Target,
  Dna,
  Link2,
  Baby
} from 'lucide-react';

const CortexLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'AI Dashboard',
      icon: LayoutDashboard,
      path: '/super-admin/cortex-ai',
      description: 'Overview & Insights'
    },
    {
      id: 'brain',
      label: 'AI Brain Engine',
      icon: Cpu,
      path: '/super-admin/cortex-ai/brain',
      description: 'AI Processing Core',
      badge: 'NEW'
    },
    {
      id: 'analytics',
      label: 'AI Analytics',
      icon: BarChart3,
      path: '/super-admin/cortex-ai/analytics',
      description: 'Smart Reports'
    },
    {
      id: 'automation',
      label: 'AI Automation',
      icon: Zap,
      path: '/super-admin/cortex-ai/automation',
      description: 'Rules & Actions'
    },
    {
      id: 'voice',
      label: 'Voice Cortex',
      icon: Mic,
      path: '/super-admin/cortex-ai/voice',
      description: 'Voice Commands'
    },
    {
      id: 'vision',
      label: 'Cortex Vision',
      icon: Eye,
      path: '/super-admin/cortex-ai/vision',
      description: 'Face Recognition AI'
    },
    {
      id: 'auditor',
      label: 'Auto Auditor',
      icon: ClipboardCheck,
      path: '/super-admin/cortex-ai/auditor',
      description: 'CBSE/State Compliance',
      badge: 'NEW'
    },
    {
      id: 'emotion',
      label: 'Parent Emotion',
      icon: Heart,
      path: '/super-admin/cortex-ai/emotion',
      description: 'Sentiment Analysis',
      badge: 'NEW'
    },
    {
      id: 'predict',
      label: 'Student Prediction',
      icon: Target,
      path: '/super-admin/cortex-ai/predict',
      description: 'Dropout & Career AI',
      badge: 'NEW'
    },
    {
      id: 'dna',
      label: 'School DNA',
      icon: Dna,
      path: '/super-admin/cortex-ai/dna',
      description: 'Identity Score',
      badge: 'NEW'
    },
    {
      id: 'trust',
      label: 'Trust Ledger',
      icon: Link2,
      path: '/super-admin/cortex-ai/trust',
      description: 'Document Verification',
      badge: 'NEW'
    },
    {
      id: 'parent-insights',
      label: 'Parent Insights',
      icon: Baby,
      path: '/super-admin/cortex-ai/parent-insights',
      description: 'Daily Child Updates',
      badge: 'NEW'
    },
    {
      id: 'profit',
      label: 'Profit Intelligence',
      icon: TrendingUp,
      path: '/super-admin/cortex-ai/profit',
      description: 'Business Analytics'
    },
    {
      id: 'settings',
      label: 'Cortex Settings',
      icon: Settings,
      path: '/super-admin/cortex-ai/settings',
      description: 'AI Configuration'
    }
  ];

  const isActive = (path) => {
    if (path === '/super-admin/cortex-ai') {
      return location.pathname === path || location.pathname === path + '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Cortex AI Sidebar */}
      <div 
        className={`bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 border-r border-purple-500/20 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-sm">Cortex AI</h2>
                  <p className="text-xs text-purple-300">Intelligence Layer</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* AI Status Indicator */}
        {!isCollapsed && (
          <div className="p-4 border-b border-purple-500/20">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">AI Engine Active</span>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-purple-600/20'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-purple-400 group-hover:text-purple-300'}`} />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs truncate block ${active ? 'text-purple-200' : 'text-gray-500'}`}>
                      {item.description}
                    </span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* AI Quick Action - Fixed at bottom */}
        {!isCollapsed && (
          <div className="p-4 border-t border-purple-500/20 mt-auto">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Ask Cortex AI</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default CortexLayout;
