import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const StudentExamResult = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

  const fetchResults = async () => {
    // Mock results
    const mockResults = [
      {
        exam_name: 'Mid Term Examination 2024',
        subjects: [
          { name: 'Mathematics', max: 100, obtained: 85, grade: 'A' },
          { name: 'Science', max: 100, obtained: 78, grade: 'B+' },
          { name: 'English', max: 100, obtained: 92, grade: 'A+' },
        ],
        total_max: 300,
        total_obtained: 255,
        percentage: 85.00,
        result: 'Pass',
        division: 'First'
      }
    ];
    setResults(mockResults);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">My Exam Results</h1>
        {results.map((res, idx) => (
          <Card key={idx}>
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle>{res.exam_name}</CardTitle>
                <Badge variant={res.result === 'Pass' ? 'success' : 'destructive'} className={res.result === 'Pass' ? 'bg-green-500' : 'bg-red-500'}>{res.result}</Badge>
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
                      <TableCell>{sub.name}</TableCell>
                      <TableCell>{sub.max}</TableCell>
                      <TableCell>{sub.obtained}</TableCell>
                      <TableCell>{sub.grade}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell>Grand Total</TableCell>
                    <TableCell>{res.total_max}</TableCell>
                    <TableCell>{res.total_obtained}</TableCell>
                    <TableCell>{res.percentage}% ({res.division})</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentExamResult;
