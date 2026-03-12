/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MARKS OVERRIDE MODAL - Day 6: Teacher Review Interface
 * Modal for detailed marks modification with reason tracking
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  AlertTriangle,
  Brain,
  Calculator,
  History,
  Save,
  Loader2,
  Plus,
  Minus,
  RotateCcw
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const OVERRIDE_REASONS = [
  { id: 'partial_credit', label: 'Partial Credit Deserved', icon: '📝' },
  { id: 'alternate_correct', label: 'Alternate Correct Answer', icon: '✓' },
  { id: 'ai_error', label: 'AI Evaluation Error', icon: '🤖' },
  { id: 'handwriting_issue', label: 'Handwriting Recognition Issue', icon: '✍️' },
  { id: 'step_marks', label: 'Step-wise Marks Given', icon: '📊' },
  { id: 'grace_marks', label: 'Grace Marks', icon: '🎁' },
  { id: 'other', label: 'Other (Please specify)', icon: '📋' }
];

const MarksOverrideModal = ({
  isOpen,
  onClose,
  question,
  paperId,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newMarks, setNewMarks] = useState(0);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Initialize with AI marks
  useEffect(() => {
    if (question) {
      setNewMarks(question.ai_marks || 0);
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const maxMarks = question.max_marks || 0;
  const aiMarks = question.ai_marks || 0;
  const marksDiff = newMarks - aiMarks;

  // Handle marks input
  const handleMarksChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setNewMarks(Math.min(Math.max(0, numValue), maxMarks));
  };

  // Increment/Decrement marks
  const adjustMarks = (delta) => {
    const newValue = Math.min(Math.max(0, newMarks + delta), maxMarks);
    setNewMarks(newValue);
  };

  // Reset to AI marks
  const resetToAI = () => {
    setNewMarks(aiMarks);
  };

  // Calculate quick marks
  const setPercentage = (percent) => {
    setNewMarks(Math.round((maxMarks * percent / 100) * 2) / 2); // Round to 0.5
  };

  // Save override
  const handleSave = async () => {
    if (!selectedReason) {
      toast({ variant: 'destructive', title: 'Please select a reason for override' });
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      toast({ variant: 'destructive', title: 'Please provide a custom reason' });
      return;
    }

    try {
      setLoading(true);

      const overrideData = {
        question_id: question.id,
        original_marks: aiMarks,
        new_marks: newMarks,
        reason: selectedReason === 'other' ? customReason : selectedReason,
        notes: additionalNotes
      };

      const response = await api.post(`/ai-evaluation/papers/${paperId}/questions/${question.id}/override`, overrideData);

      if (response.data?.success) {
        toast({ title: 'Marks updated successfully' });
        onSave?.({
          ...question,
          teacher_marks: newMarks,
          override_reason: overrideData.reason,
          override_notes: additionalNotes
        });
        onClose();
      } else {
        throw new Error(response.data?.error || 'Failed to save override');
      }
    } catch (error) {
      console.error('Override save error:', error);
      toast({ variant: 'destructive', title: error.response?.data?.error || 'Failed to save marks override' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Edit3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Override Marks</h2>
              <p className="text-sm text-gray-400">
                Q{question.question_number}: {question.question_text?.substring(0, 40)}...
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
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Current AI Assessment */}
          <div className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">AI Assessment:</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-white">{aiMarks}</span>
              <span className="text-gray-400">/{maxMarks}</span>
              <div className="text-xs text-purple-400">
                {Math.round((question.ai_confidence || 0) * 100)}% confidence
              </div>
            </div>
          </div>

          {/* Marks Input */}
          <div className="bg-gray-900/30 rounded-lg p-4">
            <label className="text-sm font-medium text-gray-300 block mb-3">
              New Marks
            </label>
            
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={() => adjustMarks(-0.5)}
                disabled={newMarks <= 0}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-red-400"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <input
                  type="number"
                  value={newMarks}
                  onChange={(e) => handleMarksChange(e.target.value)}
                  step="0.5"
                  min="0"
                  max={maxMarks}
                  className="w-24 text-center text-2xl font-bold bg-gray-700 border-2 border-blue-500/50 rounded-lg py-2 text-white focus:outline-none focus:border-blue-500"
                />
                <span className="absolute -right-8 top-1/2 -translate-y-1/2 text-gray-400">
                  /{maxMarks}
                </span>
              </div>
              
              <button
                onClick={() => adjustMarks(0.5)}
                disabled={newMarks >= maxMarks}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-green-400"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Percentage Buttons */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[0, 25, 50, 75, 100].map(percent => (
                <button
                  key={percent}
                  onClick={() => setPercentage(percent)}
                  className={`px-3 py-1.5 rounded text-sm ${
                    Math.round(newMarks / maxMarks * 100) === percent
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {percent}%
                </button>
              ))}
              <button
                onClick={resetToAI}
                className="px-3 py-1.5 rounded text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                AI
              </button>
            </div>

            {/* Difference Indicator */}
            {marksDiff !== 0 && (
              <div className={`mt-3 text-center text-sm ${
                marksDiff > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {marksDiff > 0 ? '+' : ''}{marksDiff.toFixed(1)} from AI marks
              </div>
            )}
          </div>

          {/* Override Reason */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Reason for Override <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OVERRIDE_REASONS.map(reason => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm ${
                    selectedReason === reason.id
                      ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
                      : 'bg-gray-700/50 border-2 border-transparent text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>{reason.icon}</span>
                  <span className="flex-1 truncate">{reason.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Reason Input */}
            {selectedReason === 'other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom reason..."
                className="w-full mt-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Add any additional notes or justification..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Override History Toggle */}
          {question.override_history?.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300"
              >
                <History className="w-4 h-4" />
                View Override History ({question.override_history.length})
              </button>
              
              {showHistory && (
                <div className="mt-2 bg-gray-900/50 rounded-lg p-3 space-y-2">
                  {question.override_history.map((entry, idx) => (
                    <div key={idx} className="text-xs border-b border-gray-700 pb-2 last:border-0">
                      <div className="flex justify-between text-gray-400">
                        <span>{entry.teacher_name}</span>
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-white mt-1">
                        {entry.old_marks} → {entry.new_marks} ({entry.reason})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-200">
                Mark overrides are logged for audit purposes.
              </p>
              <p className="text-xs text-yellow-400/70">
                Your name and timestamp will be recorded with this change.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-900/30">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              Max: {maxMarks} marks
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !selectedReason || (selectedReason === 'other' && !customReason.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Override
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarksOverrideModal;
