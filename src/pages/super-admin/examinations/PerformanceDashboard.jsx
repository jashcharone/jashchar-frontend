import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { analyticsService, examService } from '@/services/examinationService';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/utils/dateUtils';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Minus, Users, Award, Target, 
    BookOpen, RefreshCw, Download, BarChart3, PieChart as PieChartIcon,
    ArrowUpRight, ArrowDownRight, GraduationCap, Calculator
} from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

const PerformanceDashboard = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    
    // Data states
    const [exams, setExams] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [topPerformers, setTopPerformers] = useState([]);
    const [subjectSummary, setSubjectSummary] = useState([]);
    const [classComparison, setClassComparison] = useState([]);
    
    // Filter states
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    useEffect(() => {
        if (selectedBranch?.id) {
            loadInitialData();
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        if (selectedExam) {
            loadAnalytics();
        }
    }, [selectedExam, selectedClass, selectedSubject]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadExams(),
                loadClasses(),
                loadSubjects()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadExams = async () => {
        try {
            const response = await examService.getAll({
                branch_id: selectedBranch.id,
                session_id: currentSessionId
            });
            if (response.data.success) {
                setExams(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading exams:', error);
        }
    };

    const loadClasses = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('id, name')
            .eq('branch_id', selectedBranch.id)
            .order('name');
        
        if (!error) setClasses(data || []);
    };

    const loadSubjects = async () => {
        const { data, error } = await supabase
            .from('subjects')
            .select('id, name')
            .eq('branch_id', selectedBranch.id)
            .order('name');
        
        if (!error) setSubjects(data || []);
    };

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const response = await analyticsService.getDashboardSummary({
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                exam_id: selectedExam
            });

            if (response.data.success) {
                const { exam_stats, top_performers, subject_summary } = response.data.data;
                
                // Aggregate stats if multiple class summaries
                if (exam_stats?.length > 0) {
                    const aggregated = exam_stats.reduce((acc, stat) => ({
                        total_students: (acc.total_students || 0) + (stat.total_students || 0),
                        appeared_students: (acc.appeared_students || 0) + (stat.appeared_students || 0),
                        passed_students: (acc.passed_students || 0) + (stat.passed_students || 0),
                        failed_students: (acc.failed_students || 0) + (stat.failed_students || 0),
                        distinction_count: (acc.distinction_count || 0) + (stat.distinction_count || 0),
                        first_class_count: (acc.first_class_count || 0) + (stat.first_class_count || 0),
                        second_class_count: (acc.second_class_count || 0) + (stat.second_class_count || 0),
                        third_class_count: (acc.third_class_count || 0) + (stat.third_class_count || 0),
                        highest_marks: Math.max(acc.highest_marks || 0, stat.highest_marks || 0),
                        lowest_marks: Math.min(acc.lowest_marks || 100, stat.lowest_marks || 100),
                        average_marks: stat.average_marks, // Will need proper calculation
                        grade_distribution: stat.grade_distribution || {}
                    }), {});
                    
                    setAnalytics(aggregated);
                }
                
                setTopPerformers(top_performers || []);
                setSubjectSummary(subject_summary || []);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const computeAnalytics = async () => {
        if (!selectedExam) {
            toast.error('Please select an exam first');
            return;
        }

        setLoading(true);
        try {
            const response = await analyticsService.computeAnalytics({
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                exam_id: selectedExam,
                class_id: selectedClass || null,
                subject_id: selectedSubject || null
            });

            if (response.data.success) {
                toast.success('Analytics computed successfully');
                loadAnalytics();
            }
        } catch (error) {
            console.error('Error computing analytics:', error);
            toast.error('Failed to compute analytics');
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data
    const getGradeDistributionData = () => {
        if (!analytics?.grade_distribution) return [];
        return Object.entries(analytics.grade_distribution).map(([grade, count]) => ({
            name: grade,
            value: count
        }));
    };

    const getDivisionData = () => {
        if (!analytics) return [];
        return [
            { name: 'Distinction (75%+)', value: analytics.distinction_count || 0, color: '#10b981' },
            { name: 'First Class (60-74%)', value: analytics.first_class_count || 0, color: '#3b82f6' },
            { name: 'Second Class (50-59%)', value: analytics.second_class_count || 0, color: '#f59e0b' },
            { name: 'Third Class (Pass-49%)', value: analytics.third_class_count || 0, color: '#ef4444' }
        ].filter(d => d.value > 0);
    };

    const getSubjectChartData = () => {
        return subjectSummary.map(s => ({
            name: s.subject?.name || 'Unknown',
            average: parseFloat(s.average_marks || 0).toFixed(1),
            pass_rate: parseFloat(s.pass_percentage || 0).toFixed(1)
        }));
    };

    const getTrendIcon = (trend) => {
        if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    };

    const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) => (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                    <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
                        <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                    </div>
                </div>
                {trend && (
                    <div className="flex items-center mt-4 text-sm">
                        {trend === 'up' ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {trendValue}
                        </span>
                        <span className="text-muted-foreground ml-1">vs previous exam</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <DashboardLayout>
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-6 h-6" />
                        Performance Analytics Dashboard
                    </h1>
                    <p className="text-muted-foreground">Comprehensive exam performance analysis</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                    <Button onClick={computeAnalytics} disabled={loading || !selectedExam}>
                        <Calculator className="w-4 h-4 mr-2" /> Compute Analytics
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Examination</Label>
                            <Select value={selectedExam} onValueChange={setSelectedExam}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select exam" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(exam => (
                                        <SelectItem key={exam.id} value={exam.id}>
                                            {exam.exam_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Class (Optional)</Label>
                            <Select value={selectedClass || 'all'} onValueChange={v => setSelectedClass(v === 'all' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject (Optional)</Label>
                            <Select value={selectedSubject || 'all'} onValueChange={v => setSelectedSubject(v === 'all' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Subjects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {subjects.map(sub => (
                                        <SelectItem key={sub.id} value={sub.id}>
                                            {sub.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>&nbsp;</Label>
                            <Button variant="outline" className="w-full" onClick={() => window.print()}>
                                <Download className="w-4 h-4 mr-2" /> Export Report
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {!selectedExam ? (
                <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Select an examination to view analytics</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Students"
                            value={analytics?.appeared_students || 0}
                            subtitle={`of ${analytics?.total_students || 0} enrolled`}
                            icon={Users}
                            color="blue"
                        />
                        <StatCard
                            title="Pass Rate"
                            value={`${analytics?.passed_students && analytics?.appeared_students 
                                ? ((analytics.passed_students / analytics.appeared_students) * 100).toFixed(1) 
                                : 0}%`}
                            subtitle={`${analytics?.passed_students || 0} passed`}
                            icon={GraduationCap}
                            color="green"
                        />
                        <StatCard
                            title="Average Marks"
                            value={parseFloat(analytics?.average_marks || 0).toFixed(1)}
                            subtitle={`Highest: ${analytics?.highest_marks || 0}`}
                            icon={Target}
                            color="purple"
                        />
                        <StatCard
                            title="Distinction"
                            value={analytics?.distinction_count || 0}
                            subtitle="75% and above"
                            icon={Award}
                            color="yellow"
                        />
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
                            <TabsTrigger value="toppers">Top Performers</TabsTrigger>
                            <TabsTrigger value="distribution">Grade Distribution</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Division Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Result Distribution</CardTitle>
                                        <CardDescription>Students by performance category</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={getDivisionData()}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, value }) => `${name}: ${value}`}
                                                >
                                                    {getDivisionData().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Pass/Fail Summary */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Pass/Fail Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm">Passed</span>
                                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                                    {analytics?.passed_students || 0} students
                                                </span>
                                            </div>
                                            <Progress 
                                                value={analytics?.appeared_students 
                                                    ? (analytics.passed_students / analytics.appeared_students) * 100 
                                                    : 0} 
                                                className="h-3"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm">Failed</span>
                                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                    {analytics?.failed_students || 0} students
                                                </span>
                                            </div>
                                            <Progress 
                                                value={analytics?.appeared_students 
                                                    ? (analytics.failed_students / analytics.appeared_students) * 100 
                                                    : 0} 
                                                className="h-3 [&>div]:bg-red-500"
                                            />
                                        </div>
                                        
                                        <div className="pt-4 border-t">
                                            <div className="grid grid-cols-2 gap-4 text-center">
                                                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        {analytics?.highest_marks || 0}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">Highest Marks</p>
                                                </div>
                                                <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                        {analytics?.lowest_marks || 0}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">Lowest Marks</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="subjects" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Subject-wise Performance</CardTitle>
                                    <CardDescription>Average marks and pass rate by subject</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {subjectSummary.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={getSubjectChartData()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                                                <Tooltip />
                                                <Legend />
                                                <Bar yAxisId="left" dataKey="average" name="Average Marks" fill="#3b82f6" />
                                                <Bar yAxisId="right" dataKey="pass_rate" name="Pass Rate %" fill="#10b981" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No subject-wise analytics available</p>
                                            <p className="text-sm">Click "Compute Analytics" to generate</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="toppers" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Top Performers</CardTitle>
                                    <CardDescription>Top 10 students by percentage</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {topPerformers.length > 0 ? (
                                        <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">Rank</TableHead>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Enroll ID</TableHead>
                                                    <TableHead className="text-right">Obtained</TableHead>
                                                    <TableHead className="text-right">Percentage</TableHead>
                                                    <TableHead className="text-center">Grade</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {topPerformers.map((student, index) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell>
                                                            {index < 3 ? (
                                                                <Badge variant={index === 0 ? 'default' : 'outline'} className={
                                                                    index === 0 ? 'bg-yellow-500 dark:bg-yellow-600' :
                                                                    index === 1 ? 'bg-gray-400 dark:bg-gray-500' :
                                                                    'bg-orange-400 dark:bg-orange-500'
                                                                }>
                                                                    #{index + 1}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">#{index + 1}</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {student.students?.first_name} {student.students?.last_name}
                                                        </TableCell>
                                                        <TableCell>{student.students?.enrollment_id}</TableCell>
                                                        <TableCell className="text-right">
                                                            {student.obtained_marks}/{student.total_marks}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {parseFloat(student.percentage).toFixed(2)}%
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline">{student.grade}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No top performers data available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="distribution" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Grade Distribution</CardTitle>
                                    <CardDescription>Number of students per grade</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {getGradeDistributionData().length > 0 ? (
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={getGradeDistributionData()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="value" name="Students" fill="#3b82f6">
                                                    {getGradeDistributionData().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <PieChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No grade distribution data available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
        </DashboardLayout>
    );
};

export default PerformanceDashboard;
