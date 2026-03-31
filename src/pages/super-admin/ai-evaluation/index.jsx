/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CORTEX EVALUATE™ - AI Paper Evaluation Module
 * "India's First AI Answer Sheet Valuation System"
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module is part of Cortex AI Add-on
 * Requires active Cortex AI subscription to access
 * 
 * Features:
 * - AI-powered answer sheet evaluation
 * - Handwriting recognition (OCR)
 * - Teacher review workflow
 * - Final marks integration
 * - Analytics dashboard
 */

import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FileSearch, Brain } from 'lucide-react';
import { useCortexAccess } from '@/hooks/useCortexAccess';
import AIEvaluationLayout from './components/AIEvaluationLayout';
import AIEvaluationDashboard from './AIEvaluationDashboard';
import EvaluationSessions from './EvaluationSessions';
import CreateSession from './CreateSession';
import SessionDetails from './SessionDetails';
import UploadPapers from './UploadPapers';
import QuestionMapping from './QuestionMapping';
import AIEvaluationProcess from './AIEvaluationProcess';
import TeacherReview from './TeacherReview';
import ReviewPaper from './ReviewPaper';
import FinalMarks from './FinalMarks';
import AIEvaluationAnalytics from './AIEvaluationAnalytics';
import AIEvaluationSettings from './AIEvaluationSettings';
import AuditLogs from './AuditLogs';
import CortexUpgradePage from '../cortex-ai/CortexUpgradePage';

const AIEvaluation = () => {
  const navigate = useNavigate();
  const { hasAccess, loading, plan, planName, daysRemaining } = useCortexAccess();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-gray-900 to-black">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
            <FileSearch className="w-8 h-8 text-white" />
          </div>
          <p className="text-blue-300">Loading Cortex Evaluate™...</p>
        </div>
      </div>
    );
  }

  // No access - Show upgrade page
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <FileSearch className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Cortex Evaluate™ - AI Paper Valuation
          </h1>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            This feature requires an active Cortex AI subscription. 
            Cortex Evaluate™ uses advanced AI to automatically evaluate answer sheets, 
            recognizing handwritten answers and providing instant marks.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/50 border border-blue-500/30 rounded-xl p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FileSearch className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">AI Evaluation</h3>
              <p className="text-gray-400 text-sm">Instant answer sheet evaluation with handwriting recognition</p>
            </div>
            <div className="bg-gray-800/50 border border-purple-500/30 rounded-xl p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Smart Scoring</h3>
              <p className="text-gray-400 text-sm">Keyword-based intelligent marking with confidence scores</p>
            </div>
            <div className="bg-gray-800/50 border border-green-500/30 rounded-xl p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 font-bold text-xl">90%</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Time Savings</h3>
              <p className="text-gray-400 text-sm">Save up to 90% time compared to manual evaluation</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/super-admin/cortex-ai')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Subscribe to Cortex AI
          </button>
        </div>
      </div>
    );
  }

  // Has access - Show full AI Evaluation module
  return (
    <AIEvaluationLayout>
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
        {/* Dashboard */}
        <Route index element={<AIEvaluationDashboard />} />
        <Route path="dashboard" element={<AIEvaluationDashboard />} />
        
        {/* Evaluation Sessions */}
        <Route path="sessions" element={<EvaluationSessions />} />
        <Route path="sessions/create" element={<CreateSession />} />
        <Route path="sessions/:sessionId" element={<SessionDetails />} />
        <Route path="sessions/:sessionId/upload" element={<UploadPapers />} />
        <Route path="sessions/:sessionId/questions" element={<QuestionMapping />} />
        <Route path="sessions/:sessionId/evaluate" element={<AIEvaluationProcess />} />
        <Route path="sessions/:sessionId/results" element={<FinalMarks />} />
        <Route path="sessions/:sessionId/audit-logs" element={<AuditLogs />} />
        
        {/* Direct access routes - redirect to sessions (need to select session first) */}
        <Route path="upload" element={<Navigate to="/super-admin/ai-evaluation/sessions" replace state={{ message: 'Please select a session to upload papers' }} />} />
        <Route path="question-mapping" element={<Navigate to="/super-admin/ai-evaluation/sessions" replace state={{ message: 'Please select a session to map questions' }} />} />
        
        {/* Teacher Review */}
        <Route path="review" element={<TeacherReview />} />
        <Route path="review/:paperId" element={<ReviewPaper />} />
        
        {/* Final Marks */}
        <Route path="final-marks" element={<FinalMarks />} />
        
        {/* Analytics */}
        <Route path="analytics" element={<AIEvaluationAnalytics />} />
        
        {/* Settings */}
        <Route path="settings" element={<AIEvaluationSettings />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/super-admin/ai-evaluation" replace />} />
      </Routes>
    </AIEvaluationLayout>
  );
};

export default AIEvaluation;
