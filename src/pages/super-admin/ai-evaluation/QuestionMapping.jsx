/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUESTION MAPPING
 * Map questions with expected answers for AI evaluation
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  List,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle,
  FileText,
  Award,
  Brain,
  AlertCircle,
  Loader2,
  Edit,
  GripVertical
} from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

const QuestionMapping = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch session and questions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [sessionRes, questionsRes] = await Promise.all([
          api.get(`/ai-evaluation/sessions/${sessionId}`),
          api.get(`/ai-evaluation/sessions/${sessionId}/questions`)
        ]);
        
        if (sessionRes.data?.success) {
          setSession(sessionRes.data.data);
        }
        
        if (questionsRes.data?.success) {
          setQuestions(questionsRes.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [sessionId]);

  // Add new question
  const addQuestion = () => {
    const newQuestion = {
      id: `temp_${Date.now()}`,
      question_number: questions.length + 1,
      question_text: '',
      expected_answer: '',
      max_marks: 10,
      question_type: 'subjective',
      keywords: '',
      marking_scheme: '',
      isNew: true
    };
    
    setQuestions([...questions, newQuestion]);
    setEditingId(newQuestion.id);
  };

  // Update question
  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  // Remove question
  const removeQuestion = (id) => {
    if (id.startsWith('temp_')) {
      setQuestions(questions.filter(q => q.id !== id));
    } else {
      if (confirm('Are you sure you want to delete this question?')) {
        setQuestions(questions.filter(q => q.id !== id));
      }
    }
  };

  // Save all questions
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await api.post(`/ai-evaluation/sessions/${sessionId}/questions`, {
        questions: questions.map((q, index) => ({
          ...q,
          question_number: index + 1,
          max_marks: parseInt(q.max_marks) || 0
        }))
      });
      
      if (response.data?.success) {
        toast.success('Questions saved successfully!');
        // Refresh questions from server
        const refreshRes = await api.get(`/ai-evaluation/sessions/${sessionId}/questions`);
        if (refreshRes.data?.success) {
          setQuestions(refreshRes.data.data || []);
        }
      } else {
        throw new Error(response.data?.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  // Calculate total marks
  const totalMarks = questions.reduce((sum, q) => sum + (parseInt(q.max_marks) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/super-admin/ai-evaluation/sessions/${sessionId}`)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <List className="w-7 h-7 text-purple-400" />
              Question Mapping
            </h1>
            <p className="text-gray-400 mt-1">
              {session?.session_name || 'Define questions and expected answers'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Questions
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <List className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xl font-bold text-white">{questions.length}</p>
              <p className="text-sm text-gray-400">Questions</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-xl font-bold text-white">{totalMarks}</p>
              <p className="text-sm text-gray-400">Total Marks</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-blue-400" />
            <div>
              <p className={`text-xl font-bold ${
                totalMarks === session?.total_marks ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {session?.total_marks || 100}
              </p>
              <p className="text-sm text-gray-400">Expected Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Marks Mismatch Warning */}
      {totalMarks !== session?.total_marks && questions.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-400">
            Total marks ({totalMarks}) don't match session total ({session?.total_marks || 100}). 
            Please adjust question marks.
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`bg-gray-800/50 border rounded-xl p-6 transition-all ${
              editingId === question.id ? 'border-blue-500' : 'border-gray-700'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Question Number */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  {index + 1}
                </div>
                <GripVertical className="w-4 h-4 text-gray-600 cursor-move" />
              </div>

              {/* Question Content */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {/* Question Type */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                    <select
                      value={question.question_type}
                      onChange={(e) => updateQuestion(question.id, 'question_type', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="short">Short Answer</option>
                      <option value="long">Long Answer</option>
                      <option value="subjective">Subjective</option>
                      <option value="numerical">Numerical</option>
                    </select>
                  </div>

                  {/* Max Marks */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Marks</label>
                    <input
                      type="number"
                      value={question.max_marks}
                      onChange={(e) => updateQuestion(question.id, 'max_marks', e.target.value)}
                      min="1"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  {/* Question Number Override */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Q. Number</label>
                    <input
                      type="text"
                      value={question.question_number}
                      onChange={(e) => updateQuestion(question.id, 'question_number', e.target.value)}
                      placeholder="1, 1a, 2(i)"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="flex items-end justify-end">
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Question Text (for AI context)</label>
                  <textarea
                    value={question.question_text}
                    onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                    rows="2"
                    placeholder="Enter the question text (helps AI understand what to evaluate)..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                </div>

                {/* Expected Answer */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Expected Answer / Model Answer</label>
                  <textarea
                    value={question.expected_answer}
                    onChange={(e) => updateQuestion(question.id, 'expected_answer', e.target.value)}
                    rows="3"
                    placeholder="Enter the model answer or key points that should be present..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={question.keywords}
                    onChange={(e) => updateQuestion(question.id, 'keywords', e.target.value)}
                    placeholder="important, keywords, for, evaluation"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Question Button */}
        <button
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <Link
          to={`/super-admin/ai-evaluation/sessions/${sessionId}/upload`}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Upload
        </Link>
        
        <div className="flex items-center gap-4">
          {questions.length > 0 && totalMarks === session?.total_marks && (
            <Link
              to={`/super-admin/ai-evaluation/sessions/${sessionId}/evaluate`}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Brain className="w-5 h-5" />
              Start AI Evaluation →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionMapping;
