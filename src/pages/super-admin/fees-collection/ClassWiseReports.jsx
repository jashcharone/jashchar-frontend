/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CLASS-WISE FEE REPORTS
 * Day 34 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Class/Section wise collection summary
 * - Student-wise drill down
 * - Collection percentage by class
 * - Visual comparison charts
 * - Export capabilities
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  IndianRupee, 
  Download,
  Printer,
  Loader2,
  FileSpreadsheet,
  Users,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Target,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line
} from 'recharts';

export default function ClassWiseReports() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [expandedClasses, setExpandedClasses] = useState([]);
  const [viewMode, setViewMode] = useState('summary'); // summary, detailed
  
  // Summary
  const [totalSummary, setTotalSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    totalStudents: 0,
    paidStudents: 0,
    collectionRate: 0
  });

  // Chart data
  const [comparisonData, setComparisonData] = useState([]);

  // Load data
  useEffect(() => {
    if (branchId && currentSessionId) {
      loadClassWiseData();
    }
  }, [branchId, currentSessionId]);

  const loadClassWiseData = async () => {
    setLoading(true);
    try {
      // Get all classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', branchId)
        .order('name');

      // Get sections
      const { data: sections } = await supabase
        .from('sections')
        .select('id, name, class_id')
        .eq('branch_id', branchId)
        .order('name');

      // Get fee data
      const { data: feeData } = await supabase
        .from('fee_details')
        .select(`
          id,
          total_amount,
          paid_amount,
          balance,
          status,
          student_id,
          student:student_id(id, full_name, school_code, class_id, section_id)
        `)
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId);

      // Process data by class
      const classMap = {};
      
      (classes || []).forEach(cls => {
        classMap[cls.id] = {
          id: cls.id,
          name: cls.name,
          sections: [],
          totalExpected: 0,
          totalCollected: 0,
          totalPending: 0,
          students: new Set(),
          paidStudents: new Set(),
          studentDetails: []
        };

        // Add sections
        (sections || [])
          .filter(s => s.class_id === cls.id)
          .forEach(sec => {
            classMap[cls.id].sections.push({
              id: sec.id,
              name: sec.name,
              totalExpected: 0,
              totalCollected: 0,
              totalPending: 0,
              students: new Set(),
              paidStudents: new Set(),
              studentDetails: []
            });
          });
      });

      // Aggregate fee data
      (feeData || []).forEach(fee => {
        const classId = fee.student?.class_id;
        const sectionId = fee.student?.section_id;
        const studentId = fee.student?.id;

        if (!classId || !classMap[classId]) return;

        // Update class totals
        classMap[classId].totalExpected += fee.total_amount || 0;
        classMap[classId].totalCollected += fee.paid_amount || 0;
        classMap[classId].totalPending += fee.balance || 0;
        classMap[classId].students.add(studentId);
        
        if (fee.status === 'paid' || fee.paid_amount > 0) {
          classMap[classId].paidStudents.add(studentId);
        }

        // Add student detail
        const existingStudent = classMap[classId].studentDetails.find(s => s.id === studentId);
        if (existingStudent) {
          existingStudent.totalExpected += fee.total_amount || 0;
          existingStudent.totalCollected += fee.paid_amount || 0;
          existingStudent.totalPending += fee.balance || 0;
        } else {
          classMap[classId].studentDetails.push({
            id: studentId,
            name: fee.student?.full_name,
            schoolCode: fee.student?.school_code,
            sectionId: sectionId,
            totalExpected: fee.total_amount || 0,
            totalCollected: fee.paid_amount || 0,
            totalPending: fee.balance || 0
          });
        }

        // Update section totals
        const section = classMap[classId].sections.find(s => s.id === sectionId);
        if (section) {
          section.totalExpected += fee.total_amount || 0;
          section.totalCollected += fee.paid_amount || 0;
          section.totalPending += fee.balance || 0;
          section.students.add(studentId);
          
          if (fee.status === 'paid' || fee.paid_amount > 0) {
            section.paidStudents.add(studentId);
          }
        }
      });

      // Convert to array and calculate percentages
      const classArray = Object.values(classMap).map(cls => ({
        ...cls,
        studentCount: cls.students.size,
        paidStudentCount: cls.paidStudents.size,
        collectionRate: cls.totalExpected > 0 
          ? Math.round((cls.totalCollected / cls.totalExpected) * 100) 
          : 0,
        sections: cls.sections.map(sec => ({
          ...sec,
          studentCount: sec.students.size,
          paidStudentCount: sec.paidStudents.size,
          collectionRate: sec.totalExpected > 0 
            ? Math.round((sec.totalCollected / sec.totalExpected) * 100) 
            : 0,
          studentDetails: cls.studentDetails.filter(s => s.sectionId === sec.id)
        }))
      })).sort((a, b) => a.name.localeCompare(b.name));

      setClassData(classArray);

      // Calculate totals
      const totalExpected = classArray.reduce((sum, c) => sum + c.totalExpected, 0);
      const totalCollected = classArray.reduce((sum, c) => sum + c.totalCollected, 0);
      const totalPending = classArray.reduce((sum, c) => sum + c.totalPending, 0);
      const totalStudents = classArray.reduce((sum, c) => sum + c.studentCount, 0);
      const paidStudents = classArray.reduce((sum, c) => sum + c.paidStudentCount, 0);

      setTotalSummary({
        totalExpected,
        totalCollected,
        totalPending,
        totalStudents,
        paidStudents,
        collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0
      });

      // Chart data
      const chartData = classArray.map(cls => ({
        name: cls.name,
        collected: Math.round(cls.totalCollected),
        pending: Math.round(cls.totalPending),
        rate: cls.collectionRate
      }));
      setComparisonData(chartData);

    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load class-wise data');
    } finally {
      setLoading(false);
    }
  };

  const toggleClassExpand = (classId) => {
    setExpandedClasses(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getProgressColor = (rate) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Export to Excel
  const exportToExcel = () => {
    let csv = 'Class-wise Fee Report\n';
    csv += `Generated: ${formatDate(new Date())}\n\n`;
    csv += 'Class,Section,Students,Expected,Collected,Pending,Collection %\n';
    
    classData.forEach(cls => {
      csv += `${cls.name},-,${cls.studentCount},${cls.totalExpected},${cls.totalCollected},${cls.totalPending},${cls.collectionRate}%\n`;
      cls.sections.forEach(sec => {
        csv += `,${sec.name},${sec.studentCount},${sec.totalExpected},${sec.totalCollected},${sec.totalPending},${sec.collectionRate}%\n`;
      });
    });

    csv += `\nTotal,-,${totalSummary.totalStudents},${totalSummary.totalExpected},${totalSummary.totalCollected},${totalSummary.totalPending},${totalSummary.collectionRate}%\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_wise_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  // Print report
  const printReport = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>Class-wise Fee Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .header { text-align: center; margin-bottom: 20px; }
            .total { font-weight: bold; background: #f0f9ff; }
            .progress { 
              height: 8px; 
              background: #e5e7eb; 
              border-radius: 4px;
              overflow: hidden;
            }
            .progress-bar { height: 100%; }
            .progress-green { background: #22c55e; }
            .progress-yellow { background: #eab308; }
            .progress-red { background: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${selectedBranch?.name || 'School Name'}</h2>
            <h3>Class-wise Fee Collection Report</h3>
            <p>Academic Year: 2025-26 | Generated: ${formatDate(new Date())}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Section</th>
                <th>Students</th>
                <th>Expected</th>
                <th>Collected</th>
                <th>Pending</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              ${classData.map(cls => `
                <tr style="background: #f9fafb;">
                  <td rowspan="${cls.sections.length + 1}"><strong>${cls.name}</strong></td>
                  <td><em>All Sections</em></td>
                  <td>${cls.studentCount}</td>
                  <td>₹${cls.totalExpected.toLocaleString('en-IN')}</td>
                  <td>₹${cls.totalCollected.toLocaleString('en-IN')}</td>
                  <td>₹${cls.totalPending.toLocaleString('en-IN')}</td>
                  <td>
                    <div class="progress">
                      <div class="progress-bar progress-${cls.collectionRate >= 80 ? 'green' : cls.collectionRate >= 50 ? 'yellow' : 'red'}" 
                           style="width: ${cls.collectionRate}%;"></div>
                    </div>
                    ${cls.collectionRate}%
                  </td>
                </tr>
                ${cls.sections.map(sec => `
                  <tr>
                    <td style="padding-left: 20px;">${sec.name}</td>
                    <td>${sec.studentCount}</td>
                    <td>₹${sec.totalExpected.toLocaleString('en-IN')}</td>
                    <td>₹${sec.totalCollected.toLocaleString('en-IN')}</td>
                    <td>₹${sec.totalPending.toLocaleString('en-IN')}</td>
                    <td>${sec.collectionRate}%</td>
                  </tr>
                `).join('')}
              `).join('')}
              <tr class="total">
                <td colspan="2">Grand Total</td>
                <td>${totalSummary.totalStudents}</td>
                <td>₹${totalSummary.totalExpected.toLocaleString('en-IN')}</td>
                <td>₹${totalSummary.totalCollected.toLocaleString('en-IN')}</td>
                <td>₹${totalSummary.totalPending.toLocaleString('en-IN')}</td>
                <td>${totalSummary.collectionRate}%</td>
              </tr>
            </tbody>
          </table>
          
          <p style="margin-top: 30px; text-align: center; color: #666;">
            Jashchar ERP | ${new Date().toLocaleString('en-IN')}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Class-wise Fee Report</h1>
          <p className="text-muted-foreground">
            {selectedBranch?.name} • Academic Year 2025-26
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={printReport} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expected</p>
                <p className="text-lg font-bold">
                  {formatCurrency(totalSummary.totalExpected)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(totalSummary.totalCollected)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(totalSummary.totalPending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collection Rate</p>
                <p className="text-lg font-bold text-purple-600">
                  {totalSummary.collectionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Collection Progress</span>
            <span className="text-sm font-bold">{totalSummary.collectionRate}%</span>
          </div>
          <Progress value={totalSummary.collectionRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Collected: {formatCurrency(totalSummary.totalCollected)}</span>
            <span>Pending: {formatCurrency(totalSummary.totalPending)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList>
          <TabsTrigger value="summary">Summary View</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="chart">Charts</TabsTrigger>
        </TabsList>

        {/* Summary View */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Class-wise Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="w-[150px]">Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classData.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            <span className="font-medium">{cls.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{cls.studentCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(cls.totalExpected)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(cls.totalCollected)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600 font-medium">
                          {formatCurrency(cls.totalPending)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={cls.collectionRate} 
                              className={`h-2 flex-1 ${getProgressColor(cls.collectionRate)}`} 
                            />
                            <span className="text-sm font-medium w-12 text-right">
                              {cls.collectionRate}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="text-center font-bold">
                        {totalSummary.totalStudents}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(totalSummary.totalExpected)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(totalSummary.totalCollected)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-orange-600">
                        {formatCurrency(totalSummary.totalPending)}
                      </TableCell>
                      <TableCell className="font-bold">
                        {totalSummary.collectionRate}%
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed View with Sections */}
        <TabsContent value="detailed">
          <div className="space-y-4">
            {classData.map((cls) => (
              <Card key={cls.id}>
                <Collapsible
                  open={expandedClasses.includes(cls.id)}
                  onOpenChange={() => toggleClassExpand(cls.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedClasses.includes(cls.id) 
                            ? <ChevronDown className="h-5 w-5" />
                            : <ChevronRight className="h-5 w-5" />
                          }
                          <GraduationCap className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-base">{cls.name}</CardTitle>
                            <CardDescription>
                              {cls.studentCount} students • {cls.sections.length} sections
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Collected</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(cls.totalCollected)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="font-semibold text-orange-600">
                              {formatCurrency(cls.totalPending)}
                            </p>
                          </div>
                          <div className="w-24">
                            <p className="text-xs text-muted-foreground">Progress</p>
                            <div className="flex items-center gap-2">
                              <Progress value={cls.collectionRate} className="h-2" />
                              <span className="text-sm font-bold">{cls.collectionRate}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Section</TableHead>
                              <TableHead className="text-center">Students</TableHead>
                              <TableHead className="text-right">Expected</TableHead>
                              <TableHead className="text-right">Collected</TableHead>
                              <TableHead className="text-right">Pending</TableHead>
                              <TableHead className="w-[120px]">Progress</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cls.sections.length > 0 ? (
                              cls.sections.map((sec) => (
                                <TableRow key={sec.id}>
                                  <TableCell className="font-medium">{sec.name}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline">{sec.studentCount}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(sec.totalExpected)}
                                  </TableCell>
                                  <TableCell className="text-right text-green-600">
                                    {formatCurrency(sec.totalCollected)}
                                  </TableCell>
                                  <TableCell className="text-right text-orange-600">
                                    {formatCurrency(sec.totalPending)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Progress value={sec.collectionRate} className="h-2 flex-1" />
                                      <span className="text-xs">{sec.collectionRate}%</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                  No sections defined
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Charts View */}
        <TabsContent value="chart" className="space-y-6">
          {/* Collection Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Collection vs Pending by Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `₹${v/1000}K`} />
                    <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                    <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar dataKey="collected" fill="#10B981" name="Collected" />
                    <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Collection Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Collection Rate by Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis yAxisId="left" tickFormatter={(v) => `₹${v/1000}K`} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v, name) => name === 'rate' ? `${v}%` : `₹${v.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="collected" fill="#7C3AED" name="Collected" />
                    <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#EF4444" strokeWidth={2} name="Collection Rate" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-700">Best Performing</p>
                    <p className="font-bold text-green-800">
                      {classData.length > 0 
                        ? classData.reduce((max, c) => c.collectionRate > max.collectionRate ? c : max).name
                        : '-'
                      }
                    </p>
                    <p className="text-xs text-green-600">
                      {classData.length > 0 
                        ? `${classData.reduce((max, c) => c.collectionRate > max.collectionRate ? c : max).collectionRate}% collected`
                        : ''
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm text-red-700">Needs Attention</p>
                    <p className="font-bold text-red-800">
                      {classData.length > 0 
                        ? classData.reduce((min, c) => c.collectionRate < min.collectionRate ? c : min).name
                        : '-'
                      }
                    </p>
                    <p className="text-xs text-red-600">
                      {classData.length > 0 
                        ? `${classData.reduce((min, c) => c.collectionRate < min.collectionRate ? c : min).collectionRate}% collected`
                        : ''
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-700">Highest Pending</p>
                    <p className="font-bold text-blue-800">
                      {classData.length > 0 
                        ? classData.reduce((max, c) => c.totalPending > max.totalPending ? c : max).name
                        : '-'
                      }
                    </p>
                    <p className="text-xs text-blue-600">
                      {classData.length > 0 
                        ? formatCurrency(classData.reduce((max, c) => c.totalPending > max.totalPending ? c : max).totalPending)
                        : ''
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
