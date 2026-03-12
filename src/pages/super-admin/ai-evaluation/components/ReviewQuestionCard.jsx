/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REVIEW QUESTION CARD - Day 6: Teacher Review Interface
 * Individual question review with AI marks and override capability
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import {
  Brain,
  Edit2,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const ReviewQuestionCard = ({
  result,
  questionNumber,
  onMarksChange,
  onFeedbackChange,
  readOnly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(result.requires_review || false);
  const [editedMarks, setEditedMarks] = useState(result.teacher_marks ?? result.ai_marks ?? 0);
  const [feedback, setFeedback] = useState(result.teacher_feedback || '');

  const aiMarks = result.ai_marks || 0;
  const maxMarks = result.max_marks || 1;
  const confidence = Math.round((result.ai_confidence || 0) * 100);
  const teacherMarks = result.teacher_marks ?? aiMarks;
  const isModified = teacherMarks !== aiMarks;

  // Confidence level styling
  const getConfidenceStyle = () => {
    if (confidence >= 85) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (confidence >= 70) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  // Handle save marks
  const handleSave = () => {
    const validMarks = Math.min(Math.max(0, parseFloat(editedMarks) || 0), maxMarks);
    setEditedMarks(validMarks);
    onMarksChange(result.id, validMarks);
    setIsEditing(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setEditedMarks(teacherMarks);
    setIsEditing(false);
  };

  // Handle quick approval
  const handleQuickApprove = () => {
    onMarksChange(result.id, aiMarks, true);
  };

  // Handle feedback save
  const handleFeedbackSave = () => {
    if (onFeedbackChange) {
      onFeedbackChange(result.id, feedback);
    }
  };

  return (
    <div className={`bg-gray-800/50 rounded-lg border ${
      result.requires_review 
        ? 'border-orange-500/50' 
        : isModified 
          ? 'border-blue-500/50' 
          : 'border-gray-700'
    }`}>
      {/* Question Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Question Number */}
          <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold text-white">
            {questionNumber}
          </span>

          {/* Question Info */}
          <div>
            <p className="text-sm text-gray-300">
              {result.question_text?.substring(0, 80) || `Question ${questionNumber}`}
              {(result.question_text?.length || 0) > 80 && '...'}
            </p>
            <div className="flex items-center gap-3 mt-1">
              {/* Status Badges */}
              {result.requires_review && (
                <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  Needs Review
                </span>
              )}
              {isModified && (
                <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                  <Edit2 className="w-3 h-3" />
                  Modified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Marks Display */}
        <div className="flex items-center gap-4">
          {/* AI Confidence */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getConfidenceStyle()}`}>
            <Brain className="w-3 h-3" />
            <span className="text-xs font-medium">{confidence}%</span>
          </div>

          {/* Marks */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${isModified ? 'text-blue-400' : 'text-white'}`}>
                {teacherMarks}
              </span>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">{maxMarks}</span>
            </div>
            {isModified && (
              <span className="text-xs text-gray-500">AI: {aiMarks}</span>
            )}
          </div>

          {/* Expand Icon */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-4 space-y-4">
          {/* Student Answer */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Student Answer (OCR Extracted)</h4>
            <div className="bg-gray-900/50 rounded p-3 text-sm text-gray-300 max-h-40 overflow-y-auto">
              {result.student_answer || (
                <span className="text-gray-500 italic">No answer detected</span>
              )}
            </div>
          </div>

          {/* Model Answer */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Model Answer</h4>
            <div className="bg-gray-900/50 rounded p-3 text-sm text-green-300/80 max-h-40 overflow-y-auto">
              {result.model_answer || (
                <span className="text-gray-500 italic">Model answer not available</span>
              )}
            </div>
          </div>

          {/* AI Feedback */}
          {result.ai_feedback && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">AI Feedback</h4>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                <p className="text-sm text-blue-300">{result.ai_feedback.summary}</p>
                {result.ai_feedback.strengths?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-green-400 font-medium">Strengths: </span>
                    <span className="text-xs text-gray-300">{result.ai_feedback.strengths.join(', ')}</span>
                  </div>
                )}
                {result.ai_feedback.improvements?.length > 0 && (
                  <div className="mt-1">
                    <span className="text-xs text-orange-400 font-medium">Improvements: </span>
                    <span className="text-xs text-gray-300">{result.ai_feedback.improvements.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Algorithm Details (Collapsible) */}
          {result.evaluation_details?.algorithms && (
            <details className="group">
              <summary className="text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-gray-300">
                AI Algorithm Details
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {result.evaluation_details.algorithms.map((algo, i) => (
                  <div key={i} className="bg-gray-900/30 rounded p-2 text-xs">
                    <span className="text-gray-500">{algo.algorithm}: </span>
                    <span className="text-white font-medium">{Math.round(algo.score * 100)}%</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Marks Edit Section */}
          {!readOnly && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-400">Award Marks:</label>
                  <input
                    type="number"
                    min="0"
                    max={maxMarks}
                    step="0.5"
                    value={editedMarks}
                    onChange={(e) => setEditedMarks(e.target.value)}
                    className="w-20 px-3 py-1 bg-gray-900 border border-gray-600 rounded text-white text-center focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <span className="text-gray-500">/ {maxMarks}</span>
                  <button
                    onClick={handleSave}
                    className="p-1.5 bg-green-600 hover:bg-green-700 rounded text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-1.5 bg-gray-600 hover:bg-gray-700 rounded text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                  >
                    <Edit2 className="w-3 h-3" />
                    Modify Marks
                  </button>
                  
                  {!result.approved && (
                    <button
                      onClick={handleQuickApprove}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded text-sm text-green-400"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Accept AI
                    </button>
                  )}
                </div>
              )}

              {/* Quick Marks Buttons */}
              {!isEditing && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 mr-2">Quick:</span>
                  {[0, maxMarks * 0.5, maxMarks * 0.75, maxMarks].map(mark => (
                    <button
                      key={mark}
                      onClick={() => onMarksChange(result.id, mark)}
                      className={`px-2 py-1 text-xs rounded ${
                        teacherMarks === mark 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {mark}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Teacher Comment */}
          {!readOnly && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <label className="text-xs font-semibold text-gray-400 uppercase">Teacher Comment (Optional)</label>
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onBlur={handleFeedbackSave}
                placeholder="Add a comment for this question..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewQuestionCard;
