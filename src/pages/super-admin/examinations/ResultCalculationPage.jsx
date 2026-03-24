/**
 * Result Calculation Page - Phase 5
 * Calculate, verify, and publish examination results
 * @file jashchar-frontend/src/pages/super-admin/examinations/ResultCalculationPage.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { 
    examGroupService, 
    resultsService 
} from '@/services/examinationService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import { 
    Calculator,
    RefreshCw,
    Settings,
    Send,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    ShieldCheck,
    Loader2,
    TrendingUp,
    Users,
    Award,
    FileText,
    Download,
    Globe
} from 'lucide-react';

const ResultCalculationPage = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // Data State
    const [examGroups, setExamGroups] = useState([]);
    const [classes, setClasses] = useState([]);
    const [results, setResults] = useState([]);
    const [selectedResults, setSelectedResults] = useState([]);

    // Filter State
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Calculation Options
    const [includeGrace, setIncludeGrace] = useState(true);
    const [includeModeration, setIncludeModeration] = useState(true);

    // UI State
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [confirmPublish, setConfirmPublish] = useState(false);

    // Summary Stats
    const [stats, setStats] = useState({
        total: 0,
        passed: 0,
        compartment: 0,
        failed: 0,
        verified: 0,
        published: 0
    });

    // Load initial data
    useEffect(() => {
        if (selectedBranch?.id) {
            loadExamGroups();
            loadClasses();
        }
    }, [selectedBranch?.id, currentSessionId]);

    useEffect(() => {
        if (selectedGroup) {
            loadResults();
        }
    }, [selectedGroup, selectedClass, selectedStatus]);

    useEffect(() => {
        // Calculate stats from results
        if (results.length > 0) {
            setStats({
                total: results.length,
                passed: results.filter(r => r.result_status === 'pass').length,
                compartment: results.filter(r => r.result_status === 'compartment').length,
                failed: results.filter(r => r.result_status === 'fail').length,
                verified: results.filter(r => r.is_verified).length,
                published: results.filter(r => r.is_published).length
            });
        } else {
            setStats({ total: 0, passed: 0, compartment: 0, failed: 0, verified: 0, published: 0 });
        }
    }, [results]);

    const loadExamGroups = async () => {
        try {
            const response = await examGroupService.getAll();
            if (response.success) {
                setExamGroups(response.data || []);
            }
        } catch (error) {
            console.error('Error loading exam groups:', error);
        }
    };

    const loadClasses = async () => {
        try {
            const { data } = await supabase
                .from('classes')
                .select('id, name')
                .eq('branch_id', selectedBranch.id)
                .order('name');
            setClasses(data || []);
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    };

    const loadResults = async () => {
        setLoading(true);
        try {
            const filters = { exam_group_id: selectedGroup };
            if (selectedClass) filters.class_id = selectedClass;
            if (selectedStatus) filters.result_status = selectedStatus;
            
            const response = await resultsService.getResults(filters);
            if (response.success) {
                setResults(response.data || []);
                setSelectedResults([]);
            }
        } catch (error) {
            console.error('Error loading results:', error);
            toast({ title: 'Error', description: 'Failed to load results', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = async () => {
        if (!selectedGroup) {
            toast({ title: 'Error', description: 'Please select an exam group', variant: 'destructive' });
            return;
        }

        setCalculating(true);
        try {
            const response = await resultsService.calculate({
                exam_group_id: selectedGroup,
                class_id: selectedClass || undefined,
                include_grace: includeGrace,
                include_moderation: includeModeration
            });

            if (response.success) {
                toast({ 
                    title: 'Success', 
                    description: `Results calculated for ${response.summary?.total_students || 0} students` 
                });
                loadResults();
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setCalculating(false);
        }
    };

    const handleVerify = async () => {
        if (selectedResults.length === 0) {
            toast({ title: 'Error', description: 'Please select results to verify', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const response = await resultsService.verify({
                result_ids: selectedResults,
                verification_notes: 'Verified via Result Calculation Page'
            });

            if (response.success) {
                toast({ title: 'Success', description: `${response.data?.length || 0} results verified` });
                loadResults();
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        setPublishing(true);
        try {
            const response = await resultsService.publish({
                exam_group_id: selectedGroup,
                class_id: selectedClass || undefined
            });

            if (response.success) {
                toast({ title: 'Success', description: response.message });
                loadResults();
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setPublishing(false);
            setConfirmPublish(false);
        }
    };

    const handleViewDetails = (result) => {
        setSelectedStudent(result);
        setShowDetailsDialog(true);
    };

    const toggleSelectAll = (checked) => {
        if (checked) {
            setSelectedResults(results.map(r => r.id));
        } else {
            setSelectedResults([]);
        }
    };

    const toggleSelect = (id) => {
        setSelectedResults(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pass':
                return <Badge className="bg-green-500 dark:bg-green-600">Pass</Badge>;
            case 'compartment':
                return <Badge className="bg-yellow-500 dark:bg-yellow-600">Compartment</Badge>;
            case 'fail':
                return <Badge className="bg-red-500 dark:bg-red-600">Fail</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getGradeBadge = (grade) => {
        const gradeColors = {
            'A+': 'bg-emerald-500 dark:bg-emerald-600',
            'A': 'bg-green-500 dark:bg-green-600',
            'B+': 'bg-teal-500 dark:bg-teal-600',
            'B': 'bg-cyan-500 dark:bg-cyan-600',
            'C+': 'bg-blue-500 dark:bg-blue-600',
            'C': 'bg-indigo-500 dark:bg-indigo-600',
            'D': 'bg-yellow-500 dark:bg-yellow-600',
            'E': 'bg-orange-500 dark:bg-orange-600',
            'F': 'bg-red-500 dark:bg-red-600'
        };
        return (
            <Badge className={gradeColors[grade] || 'bg-gray-500 dark:bg-gray-600'}>
                {grade}
            </Badge>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Result Calculation</h1>
                        <p className="text-muted-foreground">Calculate, verify, and publish examination results</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadResults} disabled={!selectedGroup}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Calculation Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            Result Calculation
                        </CardTitle>
                        <CardDescription>
                            Select exam group and options to calculate results
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label>Exam Group *</Label>
                                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Exam Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {examGroups.map(group => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Class (Optional)</Label>
                                <Select 
                                    value={selectedClass || 'all'} 
                                    onValueChange={(v) => setSelectedClass(v === 'all' ? '' : v)}
                                >
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
                                <Label>Options</Label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            checked={includeGrace}
                                            onCheckedChange={setIncludeGrace}
                                        />
                                        <span className="text-sm">Include Grace Marks</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            checked={includeModeration}
                                            onCheckedChange={setIncludeModeration}
                                        />
                                        <span className="text-sm">Include Moderation</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Button 
                                    onClick={handleCalculate}
                                    disabled={!selectedGroup || calculating}
                                    className="w-full"
                                >
                                    {calculating ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Calculator className="w-4 h-4 mr-2" />
                                    )}
                                    Calculate Results
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                {selectedGroup && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.total}</p>
                                        <p className="text-xs text-muted-foreground">Total Students</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <div>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.passed}</p>
                                        <p className="text-xs text-muted-foreground">Passed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                    <div>
                                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.compartment}</p>
                                        <p className="text-xs text-muted-foreground">Compartment</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                    <div>
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                                        <p className="text-xs text-muted-foreground">Failed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-purple-500" />
                                    <div>
                                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.verified}</p>
                                        <p className="text-xs text-muted-foreground">Verified</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-indigo-500" />
                                    <div>
                                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.published}</p>
                                        <p className="text-xs text-muted-foreground">Published</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Pass Rate Progress */}
                {stats.total > 0 && (
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">Overall Pass Rate</span>
                                <span className="text-sm font-bold">
                                    {((stats.passed / stats.total) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <Progress value={(stats.passed / stats.total) * 100} className="h-2" />
                        </CardContent>
                    </Card>
                )}

                {/* Results Filter & Actions */}
                {selectedGroup && (
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">
                                    Results ({results.length})
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Select 
                                        value={selectedStatus || 'all'} 
                                        onValueChange={(v) => setSelectedStatus(v === 'all' ? '' : v)}
                                    >
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="pass">Pass</SelectItem>
                                            <SelectItem value="compartment">Compartment</SelectItem>
                                            <SelectItem value="fail">Fail</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button 
                                        variant="outline" 
                                        onClick={handleVerify}
                                        disabled={selectedResults.length === 0}
                                    >
                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                        Verify Selected ({selectedResults.length})
                                    </Button>
                                    <Button 
                                        onClick={() => setConfirmPublish(true)}
                                        disabled={results.length === 0}
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Publish Results
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                    Loading results...
                                </div>
                            ) : results.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No results found</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Click "Calculate Results" to generate results
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40px]">
                                                <Checkbox 
                                                    checked={selectedResults.length === results.length}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead>Rank</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Admission No</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Percentage</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Verified</TableHead>
                                            <TableHead>Published</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results.map(result => (
                                            <TableRow key={result.id}>
                                                <TableCell>
                                                    <Checkbox 
                                                        checked={selectedResults.includes(result.id)}
                                                        onCheckedChange={() => toggleSelect(result.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-bold">
                                                    {result.rank || '-'}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {result.students?.first_name} {result.students?.last_name}
                                                </TableCell>
                                                <TableCell>{result.students?.admission_no}</TableCell>
                                                <TableCell>{result.classes?.name}</TableCell>
                                                <TableCell>
                                                    {result.total_marks}/{result.max_marks}
                                                </TableCell>
                                                <TableCell className="font-bold">
                                                    {result.percentage?.toFixed(2)}%
                                                </TableCell>
                                                <TableCell>
                                                    {result.grade && getGradeBadge(result.grade)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(result.result_status)}</TableCell>
                                                <TableCell>
                                                    {result.is_verified ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {result.is_published ? (
                                                        <CheckCircle className="w-5 h-5 text-blue-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleViewDetails(result)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Student Details Dialog */}
                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Result Details</DialogTitle>
                            <DialogDescription>
                                {selectedStudent?.students?.first_name} {selectedStudent?.students?.last_name} 
                                ({selectedStudent?.students?.admission_no})
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="pt-4 text-center">
                                        <p className="text-2xl font-bold">{selectedStudent?.total_marks}</p>
                                        <p className="text-xs text-muted-foreground">Total Marks</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4 text-center">
                                        <p className="text-2xl font-bold">{selectedStudent?.percentage?.toFixed(2)}%</p>
                                        <p className="text-xs text-muted-foreground">Percentage</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4 text-center">
                                        <p className="text-2xl font-bold">{selectedStudent?.grade || '-'}</p>
                                        <p className="text-xs text-muted-foreground">Grade</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4 text-center">
                                        <p className="text-2xl font-bold">#{selectedStudent?.rank || '-'}</p>
                                        <p className="text-xs text-muted-foreground">Rank</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Subject-wise Results */}
                            <div>
                                <h3 className="font-medium mb-2">Subject-wise Results</h3>
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Marks</TableHead>
                                            <TableHead>Max</TableHead>
                                            <TableHead>%</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Grace</TableHead>
                                            <TableHead>Moderation</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedStudent?.subject_results?.map((sub, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{sub.subject_name}</TableCell>
                                                <TableCell>{sub.final_marks}</TableCell>
                                                <TableCell>{sub.max_marks}</TableCell>
                                                <TableCell>
                                                    {((sub.final_marks / sub.max_marks) * 100).toFixed(1)}%
                                                </TableCell>
                                                <TableCell>
                                                    {sub.is_passed ? (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {sub.grace_applied && (
                                                        <Badge variant="outline" className="text-green-600 dark:text-green-400">
                                                            Applied
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {sub.moderation_applied && (
                                                        <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                                                            Applied
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            </div>

                            {/* Status summary */}
                            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Subjects Passed:</span>
                                    <Badge className="bg-green-500 dark:bg-green-600">{selectedStudent?.subjects_passed}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Subjects Failed:</span>
                                    <Badge className="bg-red-500 dark:bg-red-600">{selectedStudent?.subjects_failed}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Result:</span>
                                    {getStatusBadge(selectedStudent?.result_status)}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Publish Confirmation */}
                <AlertDialog open={confirmPublish} onOpenChange={setConfirmPublish}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Publish Results?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will publish all results for the selected exam group
                                {selectedClass ? ' and class' : ''}.
                                Published results will be visible to students and parents.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handlePublish} disabled={publishing}>
                                {publishing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Publish
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default ResultCalculationPage;
