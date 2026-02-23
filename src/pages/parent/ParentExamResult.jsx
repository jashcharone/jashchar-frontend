/**
 * ParentExamResult - View child's exam results
 */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChildSelector from '@/components/ChildSelector';
import { useParentChild } from '@/contexts/ParentChildContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Award } from 'lucide-react';

const ParentExamResult = () => {
  const { selectedChild } = useParentChild();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedChild?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch marks from exam_marks table with exam_subjects join
        const { data: examMarks, error } = await supabase
          .from('exam_marks')
          .select(`
            id, marks, is_absent, note,
            exam_subject:exam_subjects (
              id, max_marks, min_marks,
              exam:exams (id, name, is_publish_result),
              subject:subjects (name, code)
            )
          `)
          .eq('student_id', selectedChild.id);

        if (error) throw error;

        // Group by exam - only show published results
        const examMap = {};
        (examMarks || []).forEach(r => {
          const examName = r.exam_subject?.exam?.name || 'Unknown Exam';
          const examId = r.exam_subject?.exam?.id;
          const isPublished = r.exam_subject?.exam?.is_publish_result;
          
          if (!isPublished) return; // Only show published results

          if (!examMap[examId]) {
            examMap[examId] = {
              exam_name: examName,
              subjects: [],
              total_max: 0,
              total_obtained: 0,
            };
          }

          const obtained = r.is_absent ? 0 : Number(r.marks || 0);
          const maxMarks = Number(r.exam_subject?.max_marks || 0);
          const minMarks = Number(r.exam_subject?.min_marks || 0);

          examMap[examId].subjects.push({
            name: r.exam_subject?.subject?.name || '-',
            max: maxMarks,
            obtained: obtained,
            grade: '-',
            is_absent: r.is_absent,
            is_pass: r.is_absent ? false : obtained >= minMarks,
          });
          examMap[examId].total_max += maxMarks;
          examMap[examId].total_obtained += obtained;
        });

        // Calculate percentages
        const processedResults = Object.values(examMap).map(exam => ({
          ...exam,
          percentage: exam.total_max > 0 ? ((exam.total_obtained / exam.total_max) * 100).toFixed(1) : 0,
          result: exam.subjects.every(s => s.is_pass !== false) ? 'Pass' : 'Fail',
        }));

        setResults(processedResults);
      } catch (error) {
        console.error('Error fetching exam results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [selectedChild]);

  const childName = selectedChild ? (selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`) : '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6" />
          Exam Results
        </h1>

        <ChildSelector />

        {!selectedChild ? (
          <Card className="p-8 text-center text-muted-foreground">No child selected</Card>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No exam results available for {childName}
          </Card>
        ) : (
          results.map((res, idx) => (
            <Card key={idx}>
              <CardHeader className="bg-muted/50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>{res.exam_name}</CardTitle>
                  <Badge 
                    className={res.result === 'Pass' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                  >
                    {res.result}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Max Marks</TableHead>
                      <TableHead>Obtained Marks</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {res.subjects.map((sub, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{sub.name}</TableCell>
                        <TableCell>{sub.max}</TableCell>
                        <TableCell>
                          {sub.is_absent ? (
                            <span className="text-red-500">Absent</span>
                          ) : (
                            sub.obtained
                          )}
                        </TableCell>
                        <TableCell>{sub.grade}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell>Grand Total</TableCell>
                      <TableCell>{res.total_max}</TableCell>
                      <TableCell>{res.total_obtained}</TableCell>
                      <TableCell>{res.percentage}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentExamResult;
