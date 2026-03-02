/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * JASHCHAR CORTEX AI - Main Entry Point
 * "India's First Thinking ERP"
 * ═══════════════════════════════════════════════════════════════════════════════
 * Add-on based access - NOT regular module permission
 * Shows upgrade page if organization doesn't have Cortex AI subscription
 */

import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useCortexAccess } from '@/hooks/useCortexAccess';
import CortexLayout from './components/CortexLayout';
import CortexDashboard from './CortexDashboard';
import AIAnalytics from './AIAnalytics';
import AIAutomation from './AIAutomation';
import VoiceCortex from './VoiceCortex';
import CortexVision from './CortexVision';
import CortexSettings from './CortexSettings';
import ProfitIntelligence from './ProfitIntelligence';
import CortexUpgradePage from './CortexUpgradePage';
import AIBrainDashboard from './AIBrainDashboard';
import AutoAuditor from './AutoAuditor';
import ParentEmotion from './ParentEmotion';
import StudentPrediction from './StudentPrediction';
import SchoolDNA from './SchoolDNA';
import TrustLedger from './TrustLedger';
import ParentInsights from './ParentInsights';

const CortexAI = () => {
  const navigate = useNavigate();
  const { hasAccess, loading, plan, planName, daysRemaining } = useCortexAccess();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-gray-900 to-black">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-purple-300">Loading Cortex AI...</p>
        </div>
      </div>
    );
  }

  // No access - Show upgrade page
  if (!hasAccess) {
    return (
      <CortexUpgradePage 
        onSelectPlan={(plan, billing) => {
          // Navigate to payment page or show payment modal
          console.log('Selected plan:', plan, billing);
          // TODO: Integrate with payment gateway
          alert(`Selected: ${plan.plan_name} (${billing})\n\nPayment integration coming soon!`);
        }}
      />
    );
  }

  // Has access - Show full Cortex AI module
  return (
    <CortexLayout>
      {/* Subscription Status Banner (if expiring soon) */}
      {daysRemaining !== null && daysRemaining <= 7 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-yellow-500 text-sm">
            ⚠️ Your Cortex AI {planName} subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </span>
          <button 
            onClick={() => navigate('/super-admin/cortex-ai/settings')}
            className="text-yellow-500 text-sm underline hover:text-yellow-400"
          >
            Renew Now
          </button>
        </div>
      )}
      
      <Routes>
        <Route index element={<CortexDashboard />} />
        <Route path="dashboard" element={<CortexDashboard />} />
        <Route path="analytics" element={<AIAnalytics />} />
        <Route path="automation" element={<AIAutomation />} />
        <Route path="voice" element={<VoiceCortex />} />
        <Route path="vision" element={<CortexVision />} />
        <Route path="profit" element={<ProfitIntelligence />} />
        <Route path="brain" element={<AIBrainDashboard />} />
        <Route path="auditor" element={<AutoAuditor />} />
        <Route path="emotion" element={<ParentEmotion />} />
        <Route path="predict" element={<StudentPrediction />} />
        <Route path="dna" element={<SchoolDNA />} />
        <Route path="trust" element={<TrustLedger />} />
        <Route path="parent-insights" element={<ParentInsights />} />
        <Route path="settings" element={<CortexSettings />} />
        <Route path="upgrade" element={<CortexUpgradePage />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </CortexLayout>
  );
};

export default CortexAI;
