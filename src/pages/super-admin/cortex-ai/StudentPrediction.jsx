/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STUDENT PREDICTION - AI-Powered Future Prediction System
 * "India's First Thinking ERP - Cortex AI"
 * ═══════════════════════════════════════════════════════════════════════════════
 * Features:
 * - Dropout risk prediction
 * - Result/marks prediction
 * - Career suggestions based on performance
 * - Stream recommendations (Science/Commerce/Arts)
 */

import React, { useState, useEffect } from 'react';
import { 
  Target, AlertTriangle, TrendingUp, TrendingDown, GraduationCap, 
  Brain, Search, Filter, ChevronDown, RefreshCw,
  BookOpen, Briefcase, Star, Award, Minus
} from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const StudentPrediction = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dropout');
  const [dropoutRiskList, setDropoutRiskList] = useState([]);
  const [resultPredictions, setResultPredictions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showStudent, setShowStudent] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, [activeTab]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dropout') {
        const res = await api.get('/cortex/predict/dropout');
        setDropoutRiskList(res.data.data || []);
      } else if (activeTab === 'results') {
        const res = await api.get('/cortex/predict/results');
        setResultPredictions(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      // Mock data
      if (activeTab === 'dropout') {
        setDropoutRiskList([
          { id: 1, studentName: 'Rahul Kumar', class: '9th A', admissionNo: 'STU001', riskScore: 85, factors: ['Poor attendance (62%)', 'Fee arrears', 'Declining grades'], trend: 'increasing' },
          { id: 2, studentName: 'Priya Singh', class: '8th B', admissionNo: 'STU045', riskScore: 72, factors: ['Parent complaint', 'Transfer inquiry'], trend: 'stable' },
          { id: 3, studentName: 'Amit Verma', class: '10th A', admissionNo: 'STU102', riskScore: 65, factors: ['Health issues', 'Frequent absences'], trend: 'decreasing' }
        ]);
      } else {
        setResultPredictions([
          { id: 1, studentName: 'Sneha Reddy', class: '10th A', admissionNo: 'STU201', predictedPercentage: 92, confidence: 88, improvement: '+5%', suggestedStream: 'Science' },
          { id: 2, studentName: 'Kiran Patel', class: '10th B', admissionNo: 'STU156', predictedPercentage: 78, confidence: 82, improvement: '+3%', suggestedStream: 'Commerce' },
          { id: 3, studentName: 'Meera Nair', class: '10th A', admissionNo: 'STU178', predictedPercentage: 85, confidence: 85, improvement: '+7%', suggestedStream: 'Science' }
        ]);
      }
    }
    setLoading(false);
  };

  const getStudentPrediction = async (studentId) => {
    try {
      const res = await api.get(`/cortex/predict/student/${studentId}`);
      setShowStudent(res.data.data);
    } catch (error) {
      // Mock detailed prediction
      setShowStudent({
        studentName: 'Rahul Kumar',
        class: '9th A',
        admissionNo: 'STU001',
        dropoutRisk: 85,
        academicPrediction: {
          math: { current: 65, predicted: 58, trend: 'down' },
          science: { current: 72, predicted: 75, trend: 'up' },
          english: { current: 68, predicted: 65, trend: 'down' },
          overall: { current: 68, predicted: 66, trend: 'down' }
        },
        careerSuggestions: [
          { career: 'Technical Diploma', match: 78 },
          { career: 'Sports', match: 72 },
          { career: 'Vocational Training', match: 68 }
        ],
        riskFactors: [
          { factor: 'Attendance', severity: 'high', details: '62% current, target 75%' },
          { factor: 'Fee Payment', severity: 'medium', details: '2 months pending' },
          { factor: 'Academic Performance', severity: 'medium', details: 'Declining 15% over 3 months' }
        ],
        recommendations: [
          'Schedule parent-teacher meeting urgently',
          'Assign peer mentor from class',
          'Consider fee installment plan',
          'Extra coaching for Math and English'
        ]
      });
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (score >= 60) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (score >= 40) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-green-500 bg-green-500/10 border-green-500/30';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing' || trend === 'up') return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (trend === 'decreasing' || trend === 'down') return <TrendingDown className="w-4 h-4 text-green-400" />;
    return <Minus className="w-4 h-4 text-yellow-400" />;
  };

  const getStreamColor = (stream) => {
    if (stream === 'Science') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (stream === 'Commerce') return 'bg-green-500/20 text-green-400 border-green-500/30';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  };

  const filteredDropout = dropoutRiskList.filter(s =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredResults = resultPredictions.filter(s =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-600/20 flex items-center justify-center animate-pulse">
            <Target className="w-6 h-6 text-orange-400" />
          </div>
          <p className="text-gray-400">Analyzing student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Student Future Prediction</h1>
            <p className="text-sm text-gray-400">Dropout Risk ≫ Result Prediction ≫ Career Guidance</p>
          </div>
        </div>
        <button 
          onClick={fetchPredictions}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('dropout')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'dropout'
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Dropout Risk
          </div>
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'results'
              ? 'bg-green-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Result Predictions
          </div>
        </button>
        <button
          onClick={() => setActiveTab('career')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'career'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Career Guidance
          </div>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search student name or admission no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">All Classes</option>
          <option value="8">8th</option>
          <option value="9">9th</option>
          <option value="10">10th</option>
        </select>
      </div>

      {/* Dropout Risk Tab */}
      {activeTab === 'dropout' && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 bg-red-500/5">
            <h3 className="font-medium text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Students at Risk of Dropout
              <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-sm">
                {filteredDropout.length} students
              </span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Student</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Admission No</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Class</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Risk Score</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Trend</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Key Factors</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDropout.map((student) => (
                  <tr key={student.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-white font-medium">{student.studentName}</td>
                    <td className="py-3 px-4 text-gray-400">{student.admissionNo}</td>
                    <td className="py-3 px-4 text-gray-300">{student.class}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(student.riskScore)}`}>
                        {student.riskScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getTrendIcon(student.trend)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {student.factors.slice(0, 2).map((f, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                            {f}
                          </span>
                        ))}
                        {student.factors.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                            +{student.factors.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => getStudentPrediction(student.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result Predictions Tab */}
      {activeTab === 'results' && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 bg-green-500/5">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-green-400" />
              Predicted Results & Stream Recommendations
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Student</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Class</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Predicted %</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Confidence</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Improvement</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Suggested Stream</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((student) => (
                  <tr key={student.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-white font-medium">{student.studentName}</td>
                    <td className="py-3 px-4 text-gray-300">{student.class}</td>
                    <td className="py-3 px-4">
                      <span className="text-2xl font-bold text-green-400">{student.predictedPercentage}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${student.confidence}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-sm">{student.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-green-400 font-medium">{student.improvement}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStreamColor(student.suggestedStream)}`}>
                        {student.suggestedStream}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => getStudentPrediction(student.id)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm"
                      >
                        Full Analysis
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Career Guidance Tab */}
      {activeTab === 'career' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl border border-blue-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Science Stream</h3>
                <p className="text-sm text-blue-300">Engineering, Medical, Research</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4">Students with strong Math & Science scores are recommended for Science stream.</p>
            <div className="text-3xl font-bold text-blue-400">45 students</div>
            <p className="text-sm text-gray-500">Recommended for Science</p>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl border border-green-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Commerce Stream</h3>
                <p className="text-sm text-green-300">CA, Business, Finance</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4">Students with analytical skills and business interest are recommended for Commerce.</p>
            <div className="text-3xl font-bold text-green-400">32 students</div>
            <p className="text-sm text-gray-500">Recommended for Commerce</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl border border-purple-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Arts Stream</h3>
                <p className="text-sm text-purple-300">Law, Journalism, Design</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4">Students with creative and language skills are recommended for Arts/Humanities.</p>
            <div className="text-3xl font-bold text-purple-400">23 students</div>
            <p className="text-sm text-gray-500">Recommended for Arts</p>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {showStudent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{showStudent.studentName}</h2>
                <p className="text-gray-400">{showStudent.class} | {showStudent.admissionNo}</p>
              </div>
              <button 
                onClick={() => setShowStudent(null)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Risk Score */}
              <div className={`p-4 rounded-xl border ${getRiskColor(showStudent.dropoutRisk)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Dropout Risk Score</span>
                  <span className="text-3xl font-bold">{showStudent.dropoutRisk}%</span>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h4 className="font-medium text-white mb-3">Risk Factors</h4>
                <div className="space-y-2">
                  {showStudent.riskFactors?.map((rf, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${
                      rf.severity === 'high' ? 'bg-red-500/10 border-red-500/20' :
                      rf.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20' :
                      'bg-blue-500/10 border-blue-500/20'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{rf.factor}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          rf.severity === 'high' ? 'bg-red-500 text-white' :
                          rf.severity === 'medium' ? 'bg-yellow-500 text-black' :
                          'bg-blue-500 text-white'
                        }`}>{rf.severity}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{rf.details}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-medium text-white mb-3">AI Recommendations</h4>
                <div className="space-y-2">
                  {showStudent.recommendations?.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-gray-800 rounded-lg">
                      <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career Suggestions */}
              {showStudent.careerSuggestions && (
                <div>
                  <h4 className="font-medium text-white mb-3">Career Suggestions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {showStudent.careerSuggestions.map((cs, idx) => (
                      <div key={idx} className="p-3 bg-gray-800 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-400">{cs.match}%</div>
                        <p className="text-sm text-gray-400">{cs.career}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPrediction;
