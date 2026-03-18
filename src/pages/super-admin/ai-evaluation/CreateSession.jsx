/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CREATE EVALUATION SESSION
 * Form to create new AI paper evaluation session
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch,
  ArrowLeft,
  Save,
  FolderOpen,
  BookOpen,
  Users,
  Calendar,
  Award,
  Brain,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const CreateSession = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  
  const [formData, setFormData] = useState({
    evaluation_name: '',
    exam_name: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    exam_date: '',
    total_marks: 100,
    passing_marks: 33,
    ocr_engine: 'tesseract'
  });

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedBranch?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('id, name')
          .eq('branch_id', selectedBranch.id)
          .order('name');
        
        if (error) throw error;
        setClasses(data || []);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    
    fetchClasses();
  }, [selectedBranch?.id]);

  // Fetch sections when class changes
  useEffect(() => {
    const fetchSections = async () => {
      if (!formData.class_id) {
        setSections([]);
        return;
      }
      
      try {
        // Sections are linked via class_sections junction table
        const { data, error } = await supabase
          .from('class_sections')
          .select('sections(id, name)')
          .eq('class_id', formData.class_id);
        
        if (error) throw error;
        // Extract sections from nested response
        const sectionsList = data?.map(cs => cs.sections).filter(Boolean) || [];
        setSections(sectionsList);
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    
    fetchSections();
  }, [formData.class_id]);

  // Fetch subjects (branch-level, not class-specific)
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedBranch?.id) {
        setSubjects([]);
        return;
      }
      
      try {
        // Subjects are at branch level
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('branch_id', selectedBranch.id)
          .order('name');
        
        if (error) throw error;
        setSubjects(data || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };
    
    fetchSubjects();
  }, [selectedBranch?.id]);

  // Fetch exams
  useEffect(() => {
    const fetchExams = async () => {
      if (!selectedBranch?.id || !currentSessionId) return;
      
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('id, name')
          .eq('branch_id', selectedBranch.id)
          .eq('session_id', currentSessionId)
          .order('name');
        
        if (error) throw error;
        setExams(data || []);
      } catch (error) {
        console.error('Error fetching exams:', error);
      }
    };
    
    fetchExams();
  }, [selectedBranch?.id, currentSessionId]);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Reset dependent fields
      if (name === 'class_id') {
        updated.section_id = '';
        updated.subject_id = '';
      }
      
      // Set exam_name when exam_id changes
      if (name === 'exam_id') {
        const exam = exams.find(e => e.id === value);
        updated.exam_name = exam?.name || '';
      }
      
      return updated;
    });
  };

  // Generate session name
  const generateSessionName = () => {
    const className = classes.find(c => c.id === formData.class_id)?.name || '';
    const sectionName = sections.find(s => s.id === formData.section_id)?.name || '';
    const subjectName = subjects.find(s => s.id === formData.subject_id)?.name || '';
    const examName = formData.exam_name || '';
    
    const parts = [examName, className, sectionName, subjectName].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : 'New Evaluation Session';
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBranch?.id || !currentSessionId) {
      toast({ variant: 'destructive', title: 'Please select a branch and session' });
      return;
    }
    
    if (!formData.class_id || !formData.total_marks) {
      toast({ variant: 'destructive', title: 'Please fill in required fields' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const sessionName = formData.evaluation_name || generateSessionName();
      
      // Map frontend field names to backend expected names
      const response = await api.post('/ai-evaluation/sessions', {
        evaluation_name: sessionName,
        evaluation_code: formData.exam_name,
        class_id: formData.class_id,
        section_id: formData.section_id,
        subject_id: formData.subject_id,
        exam_date: formData.exam_date,
        total_marks: parseInt(formData.total_marks),
        passing_marks: parseInt(formData.passing_marks),
        ocr_engine: formData.ocr_engine,
        session_id: currentSessionId
      });
      
      if (response.success) {
        toast({ title: 'Evaluation session created successfully!' });
        navigate(`/super-admin/ai-evaluation/sessions/${response.data.id}`);
      } else {
        throw new Error(response.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({ variant: 'destructive', title: error.message || 'Failed to create session' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            Create Evaluation Session
          </h1>
          <p className="text-gray-400 mt-1">Set up a new AI paper evaluation session</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            Session Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Name (Optional) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Name (Auto-generated if empty)
              </label>
              <input
                type="text"
                name="evaluation_name"
                value={formData.evaluation_name}
                onChange={handleChange}
                placeholder={generateSessionName()}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Exam Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Exam (Optional)
              </label>
              <select
                name="exam_id"
                value={formData.exam_id}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Select Exam</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Link to existing exam for marks sync</p>
            </div>

            {/* Exam Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Exam Date
              </label>
              <input
                type="date"
                name="exam_date"
                value={formData.exam_date}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Class *
              </label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Section
              </label>
              <select
                name="section_id"
                value={formData.section_id}
                onChange={handleChange}
                disabled={!formData.class_id}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
              >
                <option value="">All Sections</option>
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Subject
              </label>
              <select
                name="subject_id"
                value={formData.subject_id}
                onChange={handleChange}
                disabled={!formData.class_id}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
              >
                <option value="">Select Subject</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            {/* OCR Engine */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Brain className="w-4 h-4 inline mr-2" />
                OCR Engine
              </label>
              <select
                name="ocr_engine"
                value={formData.ocr_engine}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="tesseract">Tesseract (Free)</option>
                <option value="google_vision">Google Vision (Premium)</option>
                <option value="azure_ocr">Azure OCR (Premium)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Marks Configuration */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Marks Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Marks */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Total Marks *
              </label>
              <input
                type="number"
                name="total_marks"
                value={formData.total_marks}
                onChange={handleChange}
                required
                min="1"
                max="1000"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Passing Marks */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Passing Marks
              </label>
              <input
                type="number"
                name="passing_marks"
                value={formData.passing_marks}
                onChange={handleChange}
                min="0"
                max={formData.total_marks}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Default: 33% of total marks</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-medium text-blue-400 mb-1">Next Steps After Creating Session:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Upload scanned answer sheets (images or PDF)</li>
              <li>Map questions with expected answers and marks</li>
              <li>Start AI evaluation process</li>
              <li>Review and approve AI-generated marks</li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/super-admin/ai-evaluation/sessions')}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.class_id}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Session
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Missing import
const RefreshCw = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

export default CreateSession;
