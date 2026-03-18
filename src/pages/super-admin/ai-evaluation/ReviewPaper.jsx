/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REVIEW PAPER - Enhanced Day 6 Version
 * Detailed view to review and modify AI-evaluated paper with side-by-side view
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  ArrowLeft,
  ArrowRight,
  FileText,
  Brain,
  AlertTriangle,
  MessageSquare,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Split,
  Maximize2,
  History,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/utils/dateUtils';
import ReviewQuestionCard from './components/ReviewQuestionCard';
import MarksOverrideModal from './components/MarksOverrideModal';

const ReviewPaper = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [paper, setPaper] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [editingResult, setEditingResult] = useState(null);
  const [comment, setComment] = useState('');
  
  // Enhanced state
  const [viewMode, setViewMode] = useState('split'); // 'split', 'image', 'results'
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [papersList, setPapersList] = useState([]);
  const [currentPaperIndex, setCurrentPaperIndex] = useState(0);
  const [imageRotation, setImageRotation] = useState(0);

  // Fetch paper details
  useEffect(() => {
    const fetchPaper = async () => {
      try {
        setLoading(true);
        
        const [paperRes, resultsRes] = await Promise.all([
          api.get(`/ai-evaluation/papers/${paperId}`),
          api.get(`/ai-evaluation/papers/${paperId}/results`)
        ]);
        
        if (paperRes?.success) {
          setPaper(paperRes.data);
        }
        
        if (resultsRes?.success) {
          setResults(resultsRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching paper:', error);
        toast({ variant: 'destructive', title: 'Failed to load paper details' });
        navigate('/super-admin/ai-evaluation/review');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaper();
  }, [paperId, navigate]);

  // Fetch papers list for navigation
  useEffect(() => {
    const fetchPapersList = async () => {
      try {
        const params = new URLSearchParams({ status: 'pending', limit: '100' });
        const response = await api.get(`/ai-evaluation/review/papers?${params.toString()}`);
        if (response?.success) {
          const list = response.data || [];
          setPapersList(list);
          const currentIdx = list.findIndex(p => p.id === paperId);
          if (currentIdx >= 0) setCurrentPaperIndex(currentIdx);
        }
      } catch (error) {
        console.error('Error fetching papers list:', error);
      }
    };
    
    fetchPapersList();
  }, [paperId]);

  // Update marks for a question
  const updateMarks = (resultId, newMarks) => {
    setResults(prev => prev.map(r => 
      r.id === resultId 
        ? { ...r, teacher_marks: newMarks, modified: true }
        : r
    ));
  };

  // Save review
  const handleSaveReview = async (status) => {
    try {
      setSaving(true);
      
      const response = await api.post(`/ai-evaluation/papers/${paperId}/review`, {
        status, // 'approved' or 'modified'
        results: results.filter(r => r.modified).map(r => ({
          id: r.id,
          teacher_marks: r.teacher_marks
        })),
        comment: comment || null
      });
      
      if (response?.success) {
        toast({ title: `Paper ${status === 'approved' ? 'approved' : 'marks updated'}!` });
        navigate('/super-admin/ai-evaluation/review');
      } else {
        throw new Error(response?.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      toast({ variant: 'destructive', title: 'Failed to save review' });
    } finally {
      setSaving(false);
    }
  };

  // Navigation between papers
  const navigateToPaper = (direction) => {
    const newIndex = direction === 'next' 
      ? Math.min(currentPaperIndex + 1, papersList.length - 1)
      : Math.max(currentPaperIndex - 1, 0);
    
    if (newIndex !== currentPaperIndex && papersList[newIndex]) {
      navigate(`/super-admin/ai-evaluation/review/${papersList[newIndex].id}`);
    }
  };

  // Handle marks override from ReviewQuestionCard
  const handleQuestionUpdate = (questionId, updatedData) => {
    setResults(prev => prev.map(r =>
      r.id === questionId
        ? { ...r, ...updatedData, modified: true }
        : r
    ));
  };

  // Open override modal
  const openOverrideModal = (question) => {
    setSelectedQuestion(question);
    setShowOverrideModal(true);
  };

  // Handle override save
  const handleOverrideSave = (updatedQuestion) => {
    handleQuestionUpdate(updatedQuestion.id, updatedQuestion);
  };

  // Rotate image
  const rotateImage = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };

  // Calculate totals
  const aiTotal = results.reduce((sum, r) => sum + (r.ai_marks || 0), 0);
  const teacherTotal = results.reduce((sum, r) => sum + (r.teacher_marks ?? r.ai_marks ?? 0), 0);
  const hasModifications = results.some(r => r.modified);

  // Calculate stats
  const reviewStats = useMemo(() => {
    const requiresReview = results.filter(r => r.requires_review).length;
    const lowConfidence = results.filter(r => (r.confidence || 0) < 70).length;
    const maxTotal = results.reduce((sum, r) => sum + (r.max_marks || 0), 0);
    const percentage = maxTotal > 0 ? Math.round((teacherTotal / maxTotal) * 100) : 0;
    
    return { requiresReview, lowConfidence, maxTotal, percentage };
  }, [results, teacherTotal]);

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'text-green-400';
    if (confidence >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading paper review...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Paper Not Found</h2>
        <Link to="/super-admin/ai-evaluation/review" className="text-blue-400">
          ← Back to Review Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/super-admin/ai-evaluation/review')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              Review: {paper.student_name || 'Unknown Student'}
            </h1>
            <p className="text-gray-400 text-sm">
              Roll: {paper.roll_number || '-'} | Session: {paper.evaluation_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded ${viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Split View"
            >
              <Split className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('image')}
              className={`p-1.5 rounded ${viewMode === 'image' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Image Only"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('results')}
              className={`p-1.5 rounded ${viewMode === 'results' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Results Only"
            >
              <Brain className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation buttons for next/prev paper */}
          <button
            onClick={() => navigateToPaper('prev')}
            disabled={currentPaperIndex === 0}
            className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-400 text-sm min-w-[60px] text-center">
            {papersList.length > 0 ? `${currentPaperIndex + 1} of ${papersList.length}` : '1 of 1'}
          </span>
          <button
            onClick={() => navigateToPaper('next')}
            disabled={currentPaperIndex >= papersList.length - 1}
            className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg hover:bg-gray-700"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Left - Paper Image */}
        {(viewMode === 'split' || viewMode === 'image') && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Answer Sheet</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImageZoom(z => Math.max(50, z - 25))}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 w-12 text-center">{imageZoom}%</span>
              <button
                onClick={() => setImageZoom(z => Math.min(200, z + 25))}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" onClick={rotateImage}>
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg overflow-auto max-h-[600px]">
            {paper.file_urls?.length > 0 ? (
              <img
                src={paper.file_urls[0]?.url || paper.file_urls[0]}
                alt="Answer Sheet"
                className="mx-auto transition-transform"
                style={{ 
                  transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`, 
                  transformOrigin: 'center center' 
                }}
              />
            ) : (
              <div className="flex items-center justify-center py-20 text-gray-500">
                <FileText className="w-12 h-12" />
                <span className="ml-2">Image not available</span>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right - AI Results */}
        {(viewMode === 'split' || viewMode === 'results') && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{aiTotal}</p>
                <p className="text-xs text-gray-400">AI Marks</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${hasModifications ? 'text-purple-400' : 'text-gray-400'}`}>
                  {teacherTotal}
                </p>
                <p className="text-xs text-gray-400">Teacher Marks</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${getConfidenceColor(paper.ai_confidence || 0)}`}>
                  {paper.ai_confidence || 0}%
                </p>
                <p className="text-xs text-gray-400">AI Confidence</p>
              </div>
            </div>
          </div>

          {/* Question-wise Results */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Question-wise Evaluation
              </h3>
            </div>
            
            <div className="divide-y divide-gray-700 max-h-[350px] overflow-y-auto">
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No evaluation results found
                </div>
              ) : (
                results.map((result, index) => (
                  <div key={result.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-medium">
                          {result.question_number || index + 1}
                        </span>
                        <span className="font-medium text-white text-sm">
                          {result.question_text?.substring(0, 50) || `Question ${index + 1}`}
                          {result.question_text?.length > 50 ? '...' : ''}
                        </span>
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded ${getConfidenceColor(result.confidence)} bg-gray-700`}>
                        {result.confidence || 0}% confident
                      </div>
                    </div>
                    
                    {/* Extracted Answer */}
                    {result.extracted_text && (
                      <div className="mb-3 p-2 bg-gray-700/50 rounded text-sm">
                        <p className="text-xs text-gray-500 mb-1">Extracted Answer:</p>
                        <p className="text-gray-300">{result.extracted_text}</p>
                      </div>
                    )}
                    
                    {/* AI Reasoning */}
                    {result.ai_reasoning && (
                      <div className="mb-3 text-sm">
                        <p className="text-xs text-gray-500 mb-1">AI Reasoning:</p>
                        <p className="text-gray-400 italic">{result.ai_reasoning}</p>
                      </div>
                    )}
                    
                    {/* Marks */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-xs text-gray-500">AI: </span>
                          <span className="text-blue-400 font-medium">{result.ai_marks || 0}</span>
                          <span className="text-gray-500 text-xs">/{result.max_marks || 0}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Teacher: </span>
                          <input
                            type="number"
                            value={result.teacher_marks ?? result.ai_marks ?? 0}
                            onChange={(e) => updateMarks(result.id, parseFloat(e.target.value) || 0)}
                            min="0"
                            max={result.max_marks || 100}
                            step="0.5"
                            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          />
                          <span className="text-gray-500 text-xs">/{result.max_marks || 0}</span>
                        </div>
                      </div>
                      
                      {result.modified && (
                        <span className="text-xs text-purple-400 flex items-center gap-1">
                          <Edit className="w-3 h-3" />
                          Modified
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Review Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add any comments about this evaluation..."
              rows="2"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/super-admin/ai-evaluation/review')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Queue
            </button>
            
            <div className="flex items-center gap-3">
              {hasModifications ? (
                <button
                  onClick={() => handleSaveReview('modified')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={() => handleSaveReview('approved')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Marks Override Modal */}
      <MarksOverrideModal
        isOpen={showOverrideModal}
        onClose={() => {
          setShowOverrideModal(false);
          setSelectedQuestion(null);
        }}
        question={selectedQuestion}
        paperId={paperId}
        onSave={handleOverrideSave}
      />
    </div>
  );
};

export default ReviewPaper;
