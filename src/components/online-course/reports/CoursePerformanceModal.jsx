import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const COLORS = ['#22c55e', '#ef4444', '#94a3b8']; // Green, Red, Slate

const CoursePerformanceModal = ({ isOpen, onClose, studentId, courseId, branchId }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLessons: 0,
    completedLessons: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    lessonProgress: 0,
    quizPerformance: []
  });

  useEffect(() => {
    if (isOpen && studentId && courseId) {
      fetchPerformance();
    }
  }, [isOpen, studentId, courseId]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      // 1. Lesson Stats
      const { count: totalLessons } = await supabase
        .from('course_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      const { count: completedLessons } = await supabase
        .from('student_course_progress')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .not('lesson_id', 'is', null); // Assuming progress tracks lesson completion

      // 2. Quiz Stats
      const { count: totalQuizzes } = await supabase
        .from('course_quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      // Fetch actual quiz attempts
      const { data: attempts } = await supabase
        .from('student_quiz_attempts')
        .select('*, quiz:course_quizzes(title)')
        .eq('student_id', studentId)
        .eq('course_id', courseId);

      const completedQuizzes = attempts?.length || 0;
      
      // Calculate lesson progress percentage
      const lessonProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      setStats({
        totalLessons: totalLessons || 0,
        completedLessons: completedLessons || 0,
        totalQuizzes: totalQuizzes || 0,
        completedQuizzes: completedQuizzes || 0,
        lessonProgress,
        quizPerformance: attempts || []
      });

    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate data for charts (example aggregation if multiple quizzes)
  const chartData = stats.quizPerformance.map(q => ({
    name: q.quiz?.title || 'Quiz',
    Correct: q.correct_answers,
    Wrong: q.wrong_answers,
    Skipped: q.not_attempted,
    percentage: q.total_questions > 0 ? Math.round((q.correct_answers / q.total_questions) * 100) : 0
  }));

  // Pie chart data for the first/latest quiz or aggregated (showing specifically for the first quiz as per design usually, or we map them)
  // For simplicity and UI fit, let's aggregate totals for the pie chart across all quizzes taken
  const totalCorrect = stats.quizPerformance.reduce((acc, curr) => acc + curr.correct_answers, 0);
  const totalWrong = stats.quizPerformance.reduce((acc, curr) => acc + curr.wrong_answers, 0);
  const totalSkipped = stats.quizPerformance.reduce((acc, curr) => acc + curr.not_attempted, 0);
  
  const pieData = [
    { name: 'Correct Answer', value: totalCorrect },
    { name: 'Wrong Answer', value: totalWrong },
    { name: 'Not Attempted', value: totalSkipped },
  ];

  // Check if there is any quiz data to show charts
  const hasQuizData = stats.quizPerformance.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Performance</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
        ) : (
          <div className="space-y-8">
            {/* Lesson Progress */}
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex justify-between mb-2 text-sm font-medium">
                <span>Total Lesson: {stats.totalLessons}</span>
                <span>Completed Lesson: {stats.completedLessons}</span>
              </div>
              <div className="flex items-center gap-4">
                <Progress value={stats.lessonProgress} className="h-3 flex-1" />
                <span className="text-sm font-bold w-12 text-right">{stats.lessonProgress}%</span>
              </div>
              <div className="flex justify-between mt-4 text-sm font-medium border-t pt-4">
                 <span>Total Quiz: {stats.totalQuizzes}</span>
                 <span>Completed Quiz: {stats.completedQuizzes}</span>
              </div>
            </div>

            {/* Quiz Performance Details */}
            <div>
              <h3 className="font-bold text-lg mb-4">Quiz Performance</h3>
              {hasQuizData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Stats List */}
                  <div className="space-y-4">
                    {stats.quizPerformance.map((quiz, idx) => (
                      <div key={idx} className="p-4 border rounded-md bg-white shadow-sm">
                        <h4 className="font-semibold text-blue-600 mb-2">{quiz.quiz?.title}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span>Total Questions:</span> <span>{quiz.total_questions}</span></div>
                          <div className="flex justify-between text-green-600"><span>Correct Answer:</span> <span>{quiz.correct_answers}</span></div>
                          <div className="flex justify-between text-red-600"><span>Wrong Answer:</span> <span>{quiz.wrong_answers}</span></div>
                          <div className="flex justify-between text-slate-500"><span>Not Attempted:</span> <span>{quiz.not_attempted}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-64 border rounded-lg p-2 flex flex-col items-center justify-center bg-white">
                      <h4 className="text-sm font-semibold mb-2">Current Quiz Performance</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-64 border rounded-lg p-2 flex flex-col bg-white">
                      <h4 className="text-sm font-semibold mb-2 text-center">All Quiz Performance (%)</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" width={80} style={{fontSize: '10px'}} />
                          <Tooltip />
                          <Bar dataKey="percentage" fill="#f97316" barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8 bg-slate-50 rounded border">No quiz attempts found.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CoursePerformanceModal;
