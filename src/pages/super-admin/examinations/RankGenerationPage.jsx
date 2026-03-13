/**
 * Rank Generation Page - Phase 5
 * Configure ranking rules, generate class/school ranks, and view subject toppers
 * @file jashchar-frontend/src/pages/super-admin/examinations/RankGenerationPage.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { 
    examGroupService, 
    rankingService,
    resultsService
} from '@/services/examinationService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import apiClient from '@/services/apiClient';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Icons
import { 
    Trophy,
    Plus,
    Play,
    RefreshCw,
    Settings,
    Medal,
    Award,
    Crown,
    Star,
    Loader2,
    Users,
    BookOpen,
    TrendingUp
} from 'lucide-react';

const RANK_SCOPES = [
    { value: 'class', label: 'Class-wise', description: 'Rank within each class' },
    { value: 'section', label: 'Section-wise', description: 'Rank within each section' },
    { value: 'school', label: 'School-wise', description: 'Rank across entire school' }
];

const TIEBREAKER_OPTIONS = [
    { value: 'total_marks', label: 'Total Marks', description: 'Higher total marks gets better rank' },
    { value: 'subjects_passed', label: 'Subjects Passed', description: 'More subjects passed gets better rank' },
    { value: 'percentage', label: 'Percentage', description: 'Higher percentage gets better rank' }
];

const RankGenerationPage = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // Data State
    const [examGroups, setExamGroups] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [rankConfigs, setRankConfigs] = useState([]);
    const [subjectToppers, setSubjectToppers] = useState([]);
    const [rankedResults, setRankedResults] = useState([]);

    // Filter State
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showConfigDialog, setShowConfigDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('rankings');

    // Generation Form State
    const [generateForm, setGenerateForm] = useState({
        rank_scope: 'class',
        tiebreaker_rules: ['total_marks'],
        top_n: 3
    });

    // Load initial data
    useEffect(() => {
        if (selectedBranch?.id) {
            loadExamGroups();
            loadClasses();
            loadSubjects();
        }
    }, [selectedBranch?.id, currentSessionId]);

    useEffect(() => {
        if (selectedGroup) {
            loadRankConfigs();
            loadRankedResults();
            loadSubjectToppers();
        }
    }, [selectedGroup, selectedClass]);

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
            const response = await apiClient.get('/api/classes');
            if (response.success) {
                setClasses(response.data || []);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    };

    const loadSubjects = async () => {
        try {
            const response = await apiClient.get('/api/subjects');
            if (response.success) {
                setSubjects(response.data || []);
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    };

    const loadRankConfigs = async () => {
        try {
            const response = await rankingService.getConfigs({ exam_group_id: selectedGroup });
            if (response.success) {
                setRankConfigs(response.data || []);
            }
        } catch (error) {
            console.error('Error loading rank configs:', error);
        }
    };

    const loadRankedResults = async () => {
        setLoading(true);
        try {
            const filters = { exam_group_id: selectedGroup };
            if (selectedClass) filters.class_id = selectedClass;
            
            const response = await resultsService.getResults(filters);
            if (response.success) {
                // Sort by rank
                const sorted = (response.data || []).sort((a, b) => (a.rank || 999) - (b.rank || 999));
                setRankedResults(sorted);
            }
        } catch (error) {
            console.error('Error loading ranked results:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSubjectToppers = async () => {
        try {
            const filters = { exam_group_id: selectedGroup };
            if (selectedClass) filters.class_id = selectedClass;
            if (selectedSubject) filters.subject_id = selectedSubject;
            
            const response = await rankingService.getSubjectToppers(filters);
            if (response.success) {
                setSubjectToppers(response.data || []);
            }
        } catch (error) {
            console.error('Error loading subject toppers:', error);
        }
    };

    const handleGenerateRanks = async () => {
        if (!selectedGroup) {
            toast({ title: 'Error', description: 'Please select an exam group', variant: 'destructive' });
            return;
        }

        setGenerating(true);
        try {
            const response = await rankingService.generateRanks({
                exam_group_id: selectedGroup,
                class_id: selectedClass || undefined,
                rank_scope: generateForm.rank_scope,
                tiebreaker_rules: generateForm.tiebreaker_rules
            });

            if (response.success) {
                toast({ 
                    title: 'Success', 
                    description: response.message || 'Ranks generated successfully'
                });
                loadRankedResults();
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateToppers = async () => {
        if (!selectedGroup) {
            toast({ title: 'Error', description: 'Please select an exam group', variant: 'destructive' });
            return;
        }

        setGenerating(true);
        try {
            const response = await rankingService.generateSubjectToppers({
                exam_group_id: selectedGroup,
                class_id: selectedClass || undefined,
                top_n: generateForm.top_n
            });

            if (response.success) {
                toast({ 
                    title: 'Success', 
                    description: response.message || 'Subject toppers generated successfully'
                });
                loadSubjectToppers();
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setGenerating(false);
        }
    };

    const toggleTiebreaker = (value) => {
        setGenerateForm(prev => {
            const rules = prev.tiebreaker_rules.includes(value)
                ? prev.tiebreaker_rules.filter(r => r !== value)
                : [...prev.tiebreaker_rules, value];
            return { ...prev, tiebreaker_rules: rules };
        });
    };

    const getRankBadge = (rank) => {
        if (rank === 1) {
            return (
                <Badge className="bg-yellow-500 text-yellow-900">
                    <Crown className="w-3 h-3 mr-1" />
                    1st
                </Badge>
            );
        } else if (rank === 2) {
            return (
                <Badge className="bg-gray-400 text-gray-900">
                    <Medal className="w-3 h-3 mr-1" />
                    2nd
                </Badge>
            );
        } else if (rank === 3) {
            return (
                <Badge className="bg-amber-600 text-amber-100">
                    <Award className="w-3 h-3 mr-1" />
                    3rd
                </Badge>
            );
        }
        return <span className="font-bold">#{rank}</span>;
    };

    // Group toppers by subject for display
    const toppersBySubject = subjectToppers.reduce((acc, topper) => {
        const subjectName = topper.subjects?.name || 'Unknown';
        if (!acc[subjectName]) {
            acc[subjectName] = [];
        }
        acc[subjectName].push(topper);
        return acc;
    }, {});

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Rank Generation</h1>
                        <p className="text-muted-foreground">Generate class/school ranks and view subject toppers</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { loadRankedResults(); loadSubjectToppers(); }} disabled={!selectedGroup}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Filters & Generation */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Rank Generation Settings
                        </CardTitle>
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
                            <div>
                                <Label>Rank Scope</Label>
                                <Select 
                                    value={generateForm.rank_scope} 
                                    onValueChange={(v) => setGenerateForm({...generateForm, rank_scope: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RANK_SCOPES.map(scope => (
                                            <SelectItem key={scope.value} value={scope.value}>
                                                {scope.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button 
                                    onClick={handleGenerateRanks}
                                    disabled={!selectedGroup || generating}
                                    className="w-full"
                                >
                                    {generating ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Trophy className="w-4 h-4 mr-2" />
                                    )}
                                    Generate Ranks
                                </Button>
                            </div>
                        </div>

                        {/* Tiebreaker Options */}
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <Label className="mb-2 block">Tiebreaker Rules (applied in order)</Label>
                            <div className="flex flex-wrap gap-4">
                                {TIEBREAKER_OPTIONS.map(option => (
                                    <div key={option.value} className="flex items-center gap-2">
                                        <Checkbox 
                                            checked={generateForm.tiebreaker_rules.includes(option.value)}
                                            onCheckedChange={() => toggleTiebreaker(option.value)}
                                        />
                                        <div>
                                            <span className="text-sm font-medium">{option.label}</span>
                                            <p className="text-xs text-muted-foreground">{option.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {!selectedGroup ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Please select an Exam Group to view rankings</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="rankings">
                                <Trophy className="w-4 h-4 mr-2" />
                                Overall Rankings
                            </TabsTrigger>
                            <TabsTrigger value="toppers">
                                <Star className="w-4 h-4 mr-2" />
                                Subject Toppers
                            </TabsTrigger>
                        </TabsList>

                        {/* Overall Rankings Tab */}
                        <TabsContent value="rankings" className="mt-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Student Rankings ({rankedResults.filter(r => r.rank).length} ranked)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                            Loading rankings...
                                        </div>
                                    ) : rankedResults.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">No ranked results found</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Calculate results first, then generate ranks
                                            </p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[100px]">Rank</TableHead>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Admission No</TableHead>
                                                    <TableHead>Class</TableHead>
                                                    <TableHead>Total Marks</TableHead>
                                                    <TableHead>Percentage</TableHead>
                                                    <TableHead>Grade</TableHead>
                                                    <TableHead>Scope</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rankedResults.map(result => (
                                                    <TableRow 
                                                        key={result.id}
                                                        className={result.rank <= 3 ? 'bg-yellow-50' : ''}
                                                    >
                                                        <TableCell>
                                                            {result.rank ? getRankBadge(result.rank) : '-'}
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
                                                            <Badge variant="outline">{result.grade}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">
                                                                {result.rank_scope || 'class'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Subject Toppers Tab */}
                        <TabsContent value="toppers" className="mt-4 space-y-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Star className="w-5 h-5" />
                                            Subject Toppers Configuration
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4 items-end">
                                        <div>
                                            <Label>Filter by Subject</Label>
                                            <Select 
                                                value={selectedSubject || 'all'} 
                                                onValueChange={(v) => {
                                                    setSelectedSubject(v === 'all' ? '' : v);
                                                    // Reload toppers when subject changes
                                                    setTimeout(loadSubjectToppers, 100);
                                                }}
                                            >
                                                <SelectTrigger className="w-[200px]">
                                                    <SelectValue placeholder="All Subjects" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Subjects</SelectItem>
                                                    {subjects.map(subject => (
                                                        <SelectItem key={subject.id} value={subject.id}>
                                                            {subject.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Top N Students</Label>
                                            <Input 
                                                type="number"
                                                value={generateForm.top_n}
                                                onChange={(e) => setGenerateForm({
                                                    ...generateForm, 
                                                    top_n: parseInt(e.target.value) || 3
                                                })}
                                                min={1}
                                                max={10}
                                                className="w-[100px]"
                                            />
                                        </div>
                                        <Button 
                                            onClick={handleGenerateToppers}
                                            disabled={!selectedGroup || generating}
                                        >
                                            {generating ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Star className="w-4 h-4 mr-2" />
                                            )}
                                            Generate Toppers
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Subject-wise Toppers Display */}
                            {Object.keys(toppersBySubject).length === 0 ? (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">No subject toppers found</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Click "Generate Toppers" to identify subject-wise top performers
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(toppersBySubject).map(([subject, toppers]) => (
                                        <Card key={subject}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4" />
                                                    {subject}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {toppers.sort((a, b) => a.rank - b.rank).map(topper => (
                                                        <div 
                                                            key={topper.id}
                                                            className={`flex items-center justify-between p-2 rounded ${
                                                                topper.rank === 1 
                                                                    ? 'bg-yellow-100' 
                                                                    : topper.rank === 2 
                                                                        ? 'bg-gray-100' 
                                                                        : topper.rank === 3 
                                                                            ? 'bg-amber-100' 
                                                                            : 'bg-muted'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {getRankBadge(topper.rank)}
                                                                <div>
                                                                    <p className="font-medium text-sm">
                                                                        {topper.students?.first_name} {topper.students?.last_name}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {topper.classes?.name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold">
                                                                    {topper.marks_obtained}/{topper.max_marks}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {topper.percentage?.toFixed(1)}%
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Top 3 Highlights */}
                {rankedResults.filter(r => r.rank && r.rank <= 3).length > 0 && activeTab === 'rankings' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Crown className="w-5 h-5 text-yellow-500" />
                                Top 3 Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {rankedResults
                                    .filter(r => r.rank && r.rank <= 3)
                                    .sort((a, b) => a.rank - b.rank)
                                    .map(result => (
                                        <Card 
                                            key={result.id}
                                            className={`${
                                                result.rank === 1 
                                                    ? 'border-yellow-400 bg-yellow-50' 
                                                    : result.rank === 2 
                                                        ? 'border-gray-400 bg-gray-50' 
                                                        : 'border-amber-400 bg-amber-50'
                                            }`}
                                        >
                                            <CardContent className="pt-4 text-center">
                                                {result.rank === 1 ? (
                                                    <Crown className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                                                ) : result.rank === 2 ? (
                                                    <Medal className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                                ) : (
                                                    <Award className="w-12 h-12 mx-auto text-amber-600 mb-2" />
                                                )}
                                                <h3 className="font-bold text-lg">
                                                    {result.students?.first_name} {result.students?.last_name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {result.classes?.name}
                                                </p>
                                                <div className="mt-3 space-y-1">
                                                    <p className="text-2xl font-bold">{result.percentage?.toFixed(2)}%</p>
                                                    <p className="text-sm">
                                                        {result.total_marks}/{result.max_marks} marks
                                                    </p>
                                                    <Badge className="mt-2">{result.grade}</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                }
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RankGenerationPage;
