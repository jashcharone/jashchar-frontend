/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI EVALUATION PROCESS
 * Real-time AI evaluation of uploaded answer papers
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Brain,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  ArrowLeft,
  Loader2,
  Zap,
  Eye
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const AIEvaluationProcess = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });

  // Fetch session and papers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [sessionRes, papersRes] = await Promise.all([
          api.get(`/ai-evaluation/sessions/${sessionId}`),
          api.get(`/ai-evaluation/sessions/${sessionId}/papers`)
        ]);
        
        if (sessionRes.data?.success) {
          setSession(sessionRes.data.data);
        }
        
        if (papersRes.data?.success) {
          setPapers(papersRes.data.data || []);
          const completed = (papersRes.data.data || []).filter(p => p.ai_status === 'completed').length;
          const total = (papersRes.data.data || []).length;
          setProgress({
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({ variant: 'destructive', title: 'Failed to load session data' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [sessionId]);

  // Start AI Evaluation
  const startEvaluation = async () => {
    try {
      setEvaluating(true);
      
      const pendingPapers = papers.filter(p => p.ai_status !== 'completed');
      
      for (const paper of pendingPapers) {
        setCurrentPaper(paper.id);
        
        try {
          const response = await api.post(`/ai-evaluation/evaluate/${paper.id}`);
          
          if (response.data?.success) {
            setPapers(prev => prev.map(p => 
              p.id === paper.id 
                ? { ...p, ai_status: 'completed', ...response.data.data }
                : p
            ));
            
            setProgress(prev => ({
              ...prev,
              completed: prev.completed + 1,
              percentage: Math.round(((prev.completed + 1) / prev.total) * 100)
            }));
          }
        } catch (error) {
          console.error(`Error evaluating paper ${paper.id}:`, error);
          setPapers(prev => prev.map(p => 
            p.id === paper.id ? { ...p, ai_status: 'failed' } : p
          ));
        }
        
        // Small delay between papers
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast({ title: 'AI Evaluation completed!' });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({ variant: 'destructive', title: 'Evaluation failed' });
    } finally {
      setEvaluating(false);
      setCurrentPaper(null);
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing': return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'failed': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/super-admin/ai-evaluation/sessions/${sessionId}`)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-blue-400" />
            AI Evaluation
          </h1>
          <p className="text-gray-400 mt-1">{session?.session_name || 'Processing answer papers'}</p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Evaluation Progress</h2>
            <p className="text-gray-400 text-sm">{progress.completed} of {progress.total} papers evaluated</p>
          </div>
          <div className="text-3xl font-bold text-blue-400">{progress.percentage}%</div>
        </div>
        
        <div className="h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          {!evaluating && progress.completed < progress.total && (
            <button
              onClick={startEvaluation}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <Play className="w-5 h-5" />
              Start AI Evaluation
            </button>
          )}
          
          {evaluating && (
            <div className="flex items-center gap-3 text-blue-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Evaluating papers... Please wait</span>
            </div>
          )}
          
          {progress.completed === progress.total && progress.total > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>All papers evaluated!</span>
              </div>
              <Link
                to={`/super-admin/ai-evaluation/review?session=${sessionId}`}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Review Results
              </Link>
            </div>
          )}
          
          {progress.total === 0 && (
            <div className="text-yellow-400">
              No papers to evaluate. Please upload papers first.
            </div>
          )}
        </div>
      </div>

      {/* Papers List */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="font-semibold text-white">Papers Status</h3>
        </div>
        
        {papers.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No papers found for this session</p>
            <Link
              to={`/super-admin/ai-evaluation/sessions/${sessionId}/upload`}
              className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              Upload Papers →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
            {papers.map((paper, index) => (
              <div
                key={paper.id}
                className={`flex items-center gap-4 p-4 transition-colors ${
                  currentPaper === paper.id ? 'bg-blue-500/10' : 'hover:bg-gray-700/30'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {paper.student_name || `Paper ${index + 1}`}
                  </p>
                  <p className="text-sm text-gray-400">{paper.roll_number || 'Pending student mapping'}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  {paper.ai_status === 'completed' && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {paper.ai_total_marks || 0}
                        <span className="text-gray-400 text-sm">/{session?.total_marks || 100}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Confidence: {paper.ai_confidence || 0}%
                      </p>
                    </div>
                  )}
                  
                  {currentPaper === paper.id && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Zap className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  )}
                  
                  {getStatusIcon(currentPaper === paper.id ? 'processing' : paper.ai_status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-medium text-blue-400 mb-1">How AI Evaluation Works:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>OCR extracts text from scanned answer sheets</li>
              <li>AI analyzes answers against expected answers and keywords</li>
              <li>Marks are assigned based on content matching and understanding</li>
              <li>Confidence score indicates AI's certainty in evaluation</li>
              <li>Teacher reviews and approves/modifies the marks</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEvaluationProcess;
