/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BULK APPROVAL MODAL - Day 6: Teacher Review Interface
 * Modal for batch approval of AI-evaluated papers
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Brain,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const BulkApprovalModal = ({
  isOpen,
  onClose,
  papers,
  sessionId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPapers, setSelectedPapers] = useState(
    papers.filter(p => p.ai_confidence >= 0.85).map(p => p.id)
  );
  const [minConfidence, setMinConfidence] = useState(85);
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  // Filter papers based on confidence
  const highConfidencePapers = papers.filter(p => (p.ai_confidence || 0) * 100 >= minConfidence);
  const lowConfidencePapers = papers.filter(p => (p.ai_confidence || 0) * 100 < minConfidence);

  // Toggle paper selection
  const togglePaper = (paperId) => {
    setSelectedPapers(prev => 
      prev.includes(paperId)
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  // Select all high confidence papers
  const selectAllHighConfidence = () => {
    setSelectedPapers(highConfidencePapers.map(p => p.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPapers([]);
  };

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (selectedPapers.length === 0) {
      toast({ variant: 'destructive', title: 'Please select at least one paper' });
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post(`/ai-evaluation/sessions/${sessionId}/review/bulk-approve`, {
        paper_ids: selectedPapers,
        approval_mode: 'accept_ai_marks',
        min_confidence: minConfidence / 100
      });

      if (response.data?.success) {
        toast({ title: `${selectedPapers.length} papers approved successfully!` });
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.data?.error || 'Bulk approval failed');
      }
    } catch (error) {
      console.error('Bulk approval error:', error);
      toast({ variant: 'destructive', title: error.response?.data?.error || 'Failed to approve papers' });
    } finally {
      setLoading(false);
    }
  };

  // Summary stats
  const totalMarks = selectedPapers.reduce((sum, id) => {
    const paper = papers.find(p => p.id === id);
    return sum + (paper?.ai_total_marks || 0);
  }, 0);

  const avgConfidence = selectedPapers.length > 0
    ? selectedPapers.reduce((sum, id) => {
        const paper = papers.find(p => p.id === id);
        return sum + ((paper?.ai_confidence || 0) * 100);
      }, 0) / selectedPapers.length
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Bulk Approve Papers</h2>
              <p className="text-sm text-gray-400">
                Accept AI marks for multiple papers at once
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Confidence Filter */}
          <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Minimum AI Confidence Threshold
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max="100"
                value={minConfidence}
                onChange={(e) => {
                  setMinConfidence(parseInt(e.target.value));
                  setSelectedPapers(
                    papers.filter(p => (p.ai_confidence || 0) * 100 >= parseInt(e.target.value)).map(p => p.id)
                  );
                }}
                className="flex-1 accent-blue-500"
              />
              <span className="text-lg font-bold text-white w-16 text-center">
                {minConfidence}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Papers with AI confidence below {minConfidence}% will require manual review
            </p>
          </div>

          {/* Selection Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-900/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{selectedPapers.length}</p>
              <p className="text-xs text-gray-400">Selected</p>
            </div>
            <div className="bg-gray-900/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{avgConfidence.toFixed(0)}%</p>
              <p className="text-xs text-gray-400">Avg Confidence</p>
            </div>
            <div className="bg-gray-900/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-400">{lowConfidencePapers.length}</p>
              <p className="text-xs text-gray-400">Need Review</p>
            </div>
          </div>

          {/* Paper Groups */}
          <div className="space-y-4">
            {/* High Confidence Papers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  High Confidence ({highConfidencePapers.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllHighConfidence}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Select All
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {highConfidencePapers.length > 0 ? (
                <div className="bg-gray-900/30 rounded-lg divide-y divide-gray-700/50 max-h-40 overflow-y-auto">
                  {highConfidencePapers.map(paper => (
                    <label
                      key={paper.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-700/30 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPapers.includes(paper.id)}
                          onChange={() => togglePaper(paper.id)}
                          className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
                        />
                        <div>
                          <p className="text-sm text-white">
                            {paper.student?.full_name || `Roll: ${paper.student_roll_no}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {paper.student?.admission_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <Brain className="w-3 h-3" />
                          {Math.round((paper.ai_confidence || 0) * 100)}%
                        </span>
                        <span className="text-sm font-medium text-white">
                          {paper.ai_total_marks || 0}/{paper.max_marks || '-'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No papers meet the confidence threshold
                </p>
              )}
            </div>

            {/* Low Confidence Papers (Expandable) */}
            {lowConfidencePapers.length > 0 && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-between w-full mb-2"
                >
                  <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Requires Manual Review ({lowConfidencePapers.length})
                  </h3>
                  {showDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                
                {showDetails && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg divide-y divide-orange-500/10 max-h-40 overflow-y-auto">
                    {lowConfidencePapers.map(paper => (
                      <div key={paper.id} className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm text-white">
                            {paper.student?.full_name || `Roll: ${paper.student_roll_no}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {paper.student?.admission_number}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-xs text-orange-400">
                            <Brain className="w-3 h-3" />
                            {Math.round((paper.ai_confidence || 0) * 100)}%
                          </span>
                          <span className="text-xs text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded">
                            Manual Review
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-200">
                Bulk approval will accept AI marks as final marks for selected papers.
              </p>
              <p className="text-xs text-yellow-400/70 mt-1">
                This action can be reversed by reviewing individual papers.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-900/30">
          <div className="text-sm text-gray-400">
            {selectedPapers.length} of {papers.length} papers selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={loading || selectedPapers.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Approve {selectedPapers.length} Papers
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkApprovalModal;
