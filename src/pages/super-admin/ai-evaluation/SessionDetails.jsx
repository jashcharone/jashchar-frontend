/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SESSION DETAILS
 * View and manage individual evaluation session
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileSearch,
  ArrowLeft,
  Upload,
  List,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Award,
  Eye,
  Download,
  Settings,
  Brain,
  Loader2,
  BarChart3,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/utils/dateUtils';

const SessionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [session, setSession] = useState(null);
  const [papers, setPapers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch session details
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/ai-evaluation/sessions/${id}`);
        
        if (response?.success) {
          setSession(response.data);
        } else {
          throw new Error(response?.error || 'Failed to load session');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({ variant: 'destructive', title: 'Failed to load session details' });
        navigate('/super-admin/ai-evaluation/sessions');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchSessionDetails();
    }
  }, [id, navigate]);

  // Fetch papers
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await api.get(`/ai-evaluation/sessions/${id}/papers`);
        if (response?.success) {
          setPapers(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching papers:', error);
      }
    };
    
    if (id) {
      fetchPapers();
    }
  }, [id]);

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get(`/ai-evaluation/sessions/${id}/questions`);
        if (response?.success) {
          setQuestions(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };
    
    if (id) {
      fetchQuestions();
    }
  }, [id]);

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      // Session statuses
      draft: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock },
      uploading: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Upload },
      processing: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: RefreshCw },
      ready_for_review: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Eye },
      reviewing: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Eye },
      completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
      // Paper-level statuses (ai_evaluation_status)
      pending: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock },
      evaluating: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: RefreshCw },
      partial: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle },
      failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle }
    };
    
    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Get workflow steps
  const getWorkflowSteps = () => {
    const steps = [
      { id: 'upload', label: 'Upload Papers', icon: Upload, path: `/super-admin/ai-evaluation/sessions/${id}/upload` },
      { id: 'questions', label: 'Map Questions', icon: List, path: `/super-admin/ai-evaluation/sessions/${id}/questions` },
      { id: 'evaluate', label: 'AI Evaluation', icon: Brain, path: `/super-admin/ai-evaluation/sessions/${id}/evaluate` },
      { id: 'review', label: 'Teacher Review', icon: Eye, path: `/super-admin/ai-evaluation/sessions/${id}/review` },
      { id: 'finalize', label: 'Finalize Marks', icon: Award, path: `/super-admin/ai-evaluation/sessions/${id}/finalize` }
    ];
    
    // Determine current step based on session status
    const statusToStep = {
      draft: 0,
      uploading: 1,
      processing: 2,
      ready_for_review: 3,
      reviewing: 3,
      completed: 4
    };
    
    const currentStep = statusToStep[session?.status] || 0;
    
    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStep,
      current: index === currentStep,
      upcoming: index > currentStep
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Session Not Found</h2>
        <p className="text-gray-400 mb-4">The evaluation session you're looking for doesn't exist.</p>
        <Link
          to="/super-admin/ai-evaluation/sessions"
          className="text-blue-400 hover:text-blue-300"
        >
          ← Back to Sessions
        </Link>
      </div>
    );
  }

  const workflowSteps = getWorkflowSteps();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/super-admin/ai-evaluation/sessions')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileSearch className="w-7 h-7 text-blue-400" />
              {session.evaluation_name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(session.status)}
              <span className="text-gray-400 text-sm">
                Created {formatDate(session.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Evaluation Workflow</h2>
        
        <div className="flex items-center justify-between">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <Link
                  to={step.path}
                  className={`flex flex-col items-center gap-2 group ${
                    step.current ? '' : step.completed ? '' : 'opacity-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    step.completed
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : step.current
                      ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500 ring-4 ring-blue-500/20'
                      : 'bg-gray-700/50 text-gray-500 border border-gray-600'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    step.current ? 'text-blue-400' : step.completed ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </Link>
                
                {index < workflowSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    step.completed ? 'bg-green-500/30' : 'bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{papers.length}</p>
              <p className="text-sm text-gray-400">Papers Uploaded</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <List className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{questions.length}</p>
              <p className="text-sm text-gray-400">Questions Mapped</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {papers.filter(p => p.ai_evaluation_status === 'completed').length}
              </p>
              <p className="text-sm text-gray-400">Evaluated</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {papers.filter(p => p.ai_evaluation_status === 'completed' && !p.reviewed).length}
              </p>
              <p className="text-sm text-gray-400">Pending Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex gap-4">
          {['overview', 'papers', 'questions', 'results'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Session Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Class</span>
                  <span className="text-white">{session.class_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Section</span>
                  <span className="text-white">{session.section_name || 'All Sections'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subject</span>
                  <span className="text-white">{session.subject_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Exam</span>
                  <span className="text-white">{session.evaluation_code || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Exam Date</span>
                  <span className="text-white">{session.exam_date ? formatDate(session.exam_date) : '-'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Marks Configuration</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Marks</span>
                  <span className="text-white font-medium">{session.total_marks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Passing Marks</span>
                  <span className="text-white font-medium">{session.passing_marks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">OCR Engine</span>
                  <span className="text-white capitalize">{session.ocr_engine || 'Tesseract'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">AI Model</span>
                  <span className="text-white">{session.ai_model || 'GPT-4o'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'papers' && (
          <div>
            {papers.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Papers Uploaded</h3>
                <p className="text-gray-400 mb-4">Upload scanned answer sheets to begin evaluation</p>
                <Link
                  to={`/super-admin/ai-evaluation/sessions/${id}/upload`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4" />
                  Upload Papers
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {papers.map(paper => (
                  <div key={paper.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-white">{paper.student_name || `Paper ${paper.id}`}</p>
                        <p className="text-sm text-gray-400">{paper.roll_number || 'Roll number not mapped'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(paper.ai_evaluation_status || 'pending')}
                      <Link
                        to={`/super-admin/ai-evaluation/review/${paper.id}`}
                        className="px-3 py-1 text-blue-400 hover:text-blue-300"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'questions' && (
          <div>
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <List className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Questions Mapped</h3>
                <p className="text-gray-400 mb-4">Map questions with expected answers for AI evaluation</p>
                <Link
                  to={`/super-admin/ai-evaluation/sessions/${id}/questions`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <List className="w-4 h-4" />
                  Map Questions
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div key={q.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{q.question_text || `Question ${index + 1}`}</p>
                        <p className="text-sm text-gray-400">Max Marks: {q.max_marks}</p>
                      </div>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'results' && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Results Not Available</h3>
            <p className="text-gray-400 mb-4">Complete AI evaluation to view results and analytics</p>
            <Link
              to={`/super-admin/ai-evaluation/analytics?session=${id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              <BarChart3 className="w-4 h-4" />
              View Analytics
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetails;
