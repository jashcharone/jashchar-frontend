// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI ACADEMIC INSIGHTS - Day 18 of Academic Intelligence
// ═══════════════════════════════════════════════════════════════════════════════
// AI-powered insights dashboard for personalized learning intelligence
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Sparkles, AlertTriangle, TrendingUp, TrendingDown, Users, User,
    GraduationCap, BookOpen, Target, Eye, Check, Clock, AlertCircle, CheckCircle2,
    ChevronRight, RefreshCw, Filter, Bell, Lightbulb, Zap, BarChart3, Activity,
    MessageSquare, FileQuestion, Layers, School, ArrowRight, Play, Settings
} from 'lucide-react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { apiGet, apiPost, apiPatch } from '@/utils/apiClient';
import { formatDate, formatDateTime, getRelativeDate } from '@/utils/dateUtils';
import { toast } from 'sonner';

const IMPACT_COLORS = {
    critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-500', icon: 'text-red-500' },
    high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-500', icon: 'text-orange-500' },
    medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-500', icon: 'text-yellow-500' },
    low: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-500', icon: 'text-green-500' }
};

export default function AIAcademicInsights() {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Data states
    const [dashboardData, setDashboardData] = useState(null);
    const [insights, setInsights] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [questionSuggestions, setQuestionSuggestions] = useState([]);

    // Filters
    const [entityFilter, setEntityFilter] = useState('all');
    const [impactFilter, setImpactFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('active');

    // Dialogs
    const [insightDetailDialog, setInsightDetailDialog] = useState({ open: false, insight: null });

    useEffect(() => {
        if (selectedBranch?.id) {
            loadDashboard();
        }
    }, [selectedBranch, currentSessionId]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const response = await apiGet(`/api/ai-academic-insights/dashboard?branch_id=${selectedBranch.id}`);
            if (response.success) {
                setDashboardData(response.data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            toast.error('Failed to load AI insights dashboard');
        } finally {
            setLoading(false);
        }
    };

    const loadInsights = async () => {
        try {
            let url = `/api/ai-academic-insights/insights?branch_id=${selectedBranch.id}`;
            if (entityFilter !== 'all') url += `&entity_type=${entityFilter}`;
            if (impactFilter !== 'all') url += `&impact_level=${impactFilter}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;

            const response = await apiGet(url);
            if (response.success) setInsights(response.data);
        } catch (error) {
            console.error('Error loading insights:', error);
        }
    };

    const loadInterventions = async () => {
        try {
            const response = await apiGet(`/api/ai-academic-insights/interventions?branch_id=${selectedBranch.id}`);
            if (response.success) setInterventions(response.data);
        } catch (error) {
            console.error('Error loading interventions:', error);
        }
    };

    const loadQuestionSuggestions = async () => {
        try {
            const response = await apiGet(`/api/ai-academic-insights/questions?branch_id=${selectedBranch.id}`);
            if (response.success) setQuestionSuggestions(response.data);
        } catch (error) {
            console.error('Error loading questions:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'insights' && selectedBranch?.id) {
            loadInsights();
        } else if (activeTab === 'interventions' && selectedBranch?.id) {
            loadInterventions();
        } else if (activeTab === 'questions' && selectedBranch?.id) {
            loadQuestionSuggestions();
        }
    }, [activeTab, entityFilter, impactFilter, statusFilter, selectedBranch]);

    const handleGenerateInsights = async (type) => {
        setGenerating(true);
        try {
            const endpoint = type === 'students' 
                ? '/api/ai-academic-insights/generate/students'
                : '/api/ai-academic-insights/generate/classes';
            
            const response = await apiPost(`${endpoint}?branch_id=${selectedBranch.id}`, {});
            if (response.success) {
                toast.success(response.message || 'Insights generated successfully');
                loadDashboard();
                if (activeTab === 'insights') loadInsights();
            }
        } catch (error) {
            toast.error('Failed to generate insights');
        } finally {
            setGenerating(false);
        }
    };

    const handleAcknowledgeInsight = async (insightId) => {
        try {
            const response = await apiPatch(`/api/ai-academic-insights/insights/${insightId}/acknowledge?branch_id=${selectedBranch.id}`);
            if (response.success) {
                toast.success('Insight acknowledged');
                loadInsights();
                loadDashboard();
                setInsightDetailDialog({ open: false, insight: null });
            }
        } catch (error) {
            toast.error('Failed to acknowledge insight');
        }
    };

    const handleUpdateIntervention = async (id, status) => {
        try {
            const response = await apiPatch(`/api/ai-academic-insights/interventions/${id}?branch_id=${selectedBranch.id}`, { status });
            if (response.success) {
                toast.success('Intervention updated');
                loadInterventions();
            }
        } catch (error) {
            toast.error('Failed to update intervention');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // DASHBOARD TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const DashboardTab = () => (
        <div className="space-y-6">
            {/* AI Generation Actions */}
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Brain className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">AI Insight Engine</h3>
                                <p className="text-white/80">Generate intelligent insights from your academic data</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="secondary" 
                                onClick={() => handleGenerateInsights('students')}
                                disabled={generating}
                            >
                                <Sparkles className={`h-4 w-4 mr-2 ${generating ? 'animate-pulse' : ''}`} />
                                Analyze Students
                            </Button>
                            <Button 
                                variant="secondary"
                                onClick={() => handleGenerateInsights('classes')}
                                disabled={generating}
                            >
                                <Layers className={`h-4 w-4 mr-2 ${generating ? 'animate-pulse' : ''}`} />
                                Analyze Classes
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)
                ) : (
                    <>
                        <StatsCard
                            title="Critical Insights"
                            value={dashboardData?.counts?.critical || 0}
                            icon={<AlertTriangle className="h-5 w-5" />}
                            color="red"
                            subtitle="Needs immediate attention"
                        />
                        <StatsCard
                            title="High Priority"
                            value={dashboardData?.counts?.high || 0}
                            icon={<AlertCircle className="h-5 w-5" />}
                            color="orange"
                            subtitle="Action recommended"
                        />
                        <StatsCard
                            title="Pending Interventions"
                            value={dashboardData?.pendingInterventions || 0}
                            icon={<Users className="h-5 w-5" />}
                            color="purple"
                            subtitle="Students need support"
                        />
                        <StatsCard
                            title="Active Recommendations"
                            value={dashboardData?.pendingRecommendations || 0}
                            icon={<Lightbulb className="h-5 w-5" />}
                            color="blue"
                            subtitle="Learning suggestions"
                        />
                    </>
                )}
            </div>

            {/* Insight Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">By Entity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-blue-500" /> Student Insights
                                </span>
                                <Badge variant="outline">{dashboardData?.counts?.byEntity?.student || 0}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2 text-sm">
                                    <School className="h-4 w-4 text-green-500" /> Class Insights
                                </span>
                                <Badge variant="outline">{dashboardData?.counts?.byEntity?.class || 0}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2 text-sm">
                                    <GraduationCap className="h-4 w-4 text-purple-500" /> Teacher Insights
                                </span>
                                <Badge variant="outline">{dashboardData?.counts?.byEntity?.teacher || 0}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Insight Impact Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {['critical', 'high', 'medium', 'low'].map((level) => {
                                const count = dashboardData?.counts?.[level] || 0;
                                const total = dashboardData?.counts?.total || 1;
                                const percentage = (count / total) * 100;
                                
                                return (
                                    <div key={level} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="capitalize flex items-center gap-2">
                                                <span 
                                                    className={`w-3 h-3 rounded-full ${IMPACT_COLORS[level].bg}`}
                                                />
                                                {level}
                                            </span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                        <Progress 
                                            value={percentage} 
                                            className={`h-2 ${IMPACT_COLORS[level].bg}`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Insights */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Recent Critical & High Insights
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('insights')}>
                            View All <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}
                        </div>
                    ) : (dashboardData?.recentInsights?.length || 0) === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                            <p>No critical or high priority insights at the moment!</p>
                            <p className="text-sm">Run AI analysis to discover insights.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {dashboardData.recentInsights.map((insight) => (
                                <InsightRow 
                                    key={insight.id} 
                                    insight={insight}
                                    onClick={() => setInsightDetailDialog({ open: true, insight })}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // INSIGHTS TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const InsightsTab = () => (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Entity Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="class">Class</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={impactFilter} onValueChange={setImpactFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Impact Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="low">🟢 Low</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="acknowledged">Acknowledged</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Insights List */}
            <Card>
                <CardContent className="p-0">
                    {insights.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Brain className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No insights found</p>
                            <p className="text-sm">Generate insights using the AI Engine or adjust your filters.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {insights.map((insight) => (
                                <InsightRow 
                                    key={insight.id} 
                                    insight={insight}
                                    detailed
                                    onClick={() => setInsightDetailDialog({ open: true, insight })}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // INTERVENTIONS TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const InterventionsTab = () => (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        Recommended Interventions
                    </CardTitle>
                    <CardDescription>
                        AI-suggested interventions for students who need additional support
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {interventions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                            <p className="text-lg font-medium">No pending interventions</p>
                            <p className="text-sm">All students are on track!</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {interventions.map((intervention) => (
                                <InterventionRow 
                                    key={intervention.id}
                                    intervention={intervention}
                                    onUpdateStatus={(status) => handleUpdateIntervention(intervention.id, status)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // QUESTIONS TAB
    // ═══════════════════════════════════════════════════════════════════════════════

    const QuestionsTab = () => (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileQuestion className="h-5 w-5 text-blue-500" />
                        AI Question Suggestions
                    </CardTitle>
                    <CardDescription>
                        Intelligently generated questions for assessments and practice
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {questionSuggestions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileQuestion className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No question suggestions yet</p>
                            <p className="text-sm">AI-generated questions will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {questionSuggestions.map((question) => (
                                <QuestionRow key={question.id} question={question} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="h-7 w-7 text-purple-600" />
                        AI Academic Insights
                    </h1>
                    <p className="text-gray-500">Intelligent analytics and personalized recommendations</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={loadDashboard}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 h-auto p-1">
                    <TabsTrigger value="dashboard" className="flex items-center gap-1 py-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="flex items-center gap-1 py-2">
                        <Lightbulb className="h-4 w-4" />
                        <span>Insights</span>
                        {(dashboardData?.counts?.active || 0) > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                                {dashboardData.counts.active}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="interventions" className="flex items-center gap-1 py-2">
                        <Users className="h-4 w-4" />
                        <span>Interventions</span>
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="flex items-center gap-1 py-2">
                        <FileQuestion className="h-4 w-4" />
                        <span>Questions</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard"><DashboardTab /></TabsContent>
                <TabsContent value="insights"><InsightsTab /></TabsContent>
                <TabsContent value="interventions"><InterventionsTab /></TabsContent>
                <TabsContent value="questions"><QuestionsTab /></TabsContent>
            </Tabs>

            {/* Insight Detail Dialog */}
            <Dialog open={insightDetailDialog.open} onOpenChange={(open) => setInsightDetailDialog({ open, insight: null })}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className={`h-5 w-5 ${IMPACT_COLORS[insightDetailDialog.insight?.impact_level || 'medium'].icon}`} />
                            AI Insight Detail
                        </DialogTitle>
                    </DialogHeader>
                    {insightDetailDialog.insight && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg ${IMPACT_COLORS[insightDetailDialog.insight.impact_level].bg}`}>
                                <h3 className="font-semibold text-lg">{insightDetailDialog.insight.title}</h3>
                                <p className="text-gray-600 mt-1">{insightDetailDialog.insight.summary}</p>
                            </div>

                            {insightDetailDialog.insight.data_points && (
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" /> Data Points
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(insightDetailDialog.insight.data_points).map(([key, value]) => (
                                            <div key={key} className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                                                <p className="font-medium">{typeof value === 'number' ? `${Math.round(value)}%` : value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {insightDetailDialog.insight.recommendations?.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4" /> Recommendations
                                    </h4>
                                    <div className="space-y-2">
                                        {insightDetailDialog.insight.recommendations.map((rec, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-500" />
                                                <div>
                                                    <p className="font-medium">{rec.action}</p>
                                                    <Badge variant="outline" className="mt-1">Priority: {rec.priority}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Separator />

                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Generated {formatDateTime(insightDetailDialog.insight.generated_at)}</span>
                                <Badge className={IMPACT_COLORS[insightDetailDialog.insight.impact_level].bg + ' ' + IMPACT_COLORS[insightDetailDialog.insight.impact_level].text}>
                                    {insightDetailDialog.insight.impact_level} impact
                                </Badge>
                            </div>

                            <div className="flex gap-3">
                                {insightDetailDialog.insight.status === 'active' && (
                                    <Button 
                                        className="flex-1"
                                        onClick={() => handleAcknowledgeInsight(insightDetailDialog.insight.id)}
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Acknowledge
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => setInsightDetailDialog({ open: false, insight: null })}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatsCard({ title, value, icon, color, subtitle }) {
    const colorClasses = {
        red: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
        orange: 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
        purple: 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
        blue: 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
        green: 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
    };

    return (
        <Card className={`border-l-4 ${color === 'red' ? 'border-l-red-500' : color === 'orange' ? 'border-l-orange-500' : color === 'purple' ? 'border-l-purple-500' : color === 'blue' ? 'border-l-blue-500' : 'border-l-green-500'}`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                        {icon}
                    </div>
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
                {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}

function InsightRow({ insight, detailed, onClick }) {
    const colors = IMPACT_COLORS[insight.impact_level] || IMPACT_COLORS.medium;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 hover:bg-gray-50 transition cursor-pointer border-l-4 ${colors.border}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Sparkles className={`h-4 w-4 ${colors.icon}`} />
                    </div>
                    <div>
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{insight.summary}</p>
                        {detailed && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                <span className="capitalize flex items-center gap-1">
                                    {insight.entity_type === 'student' ? <User className="h-3 w-3" /> : <School className="h-3 w-3" />}
                                    {insight.entity_type}
                                </span>
                                <span>•</span>
                                <span>{getRelativeDate(insight.generated_at)}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={`${colors.bg} ${colors.text}`}>
                        {insight.impact_level}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
            </div>
        </motion.div>
    );
}

function InterventionRow({ intervention, onUpdateStatus }) {
    const severityColors = {
        critical: 'border-red-500 bg-red-50',
        high: 'border-orange-500 bg-orange-50',
        medium: 'border-yellow-500 bg-yellow-50',
        low: 'border-green-500 bg-green-50'
    };

    return (
        <div className={`p-4 border-l-4 ${severityColors[intervention.severity]}`}>
            <div className="flex justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">
                            {intervention.student?.first_name} {intervention.student?.last_name}
                        </h4>
                        <Badge variant="outline">
                            {intervention.student?.class?.name} {intervention.student?.section?.name}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{intervention.trigger_reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge className={severityColors[intervention.severity].replace('border-', 'bg-').replace('-500', '-100')}>
                            {intervention.severity}
                        </Badge>
                        <span className="text-xs text-gray-400 capitalize">{intervention.intervention_type}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {intervention.status === 'pending' && (
                        <>
                            <Button size="sm" variant="outline" onClick={() => onUpdateStatus('in_progress')}>
                                <Play className="h-3 w-3 mr-1" /> Start
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => onUpdateStatus('dismissed')}>
                                Dismiss
                            </Button>
                        </>
                    )}
                    {intervention.status === 'in_progress' && (
                        <Button size="sm" onClick={() => onUpdateStatus('completed')}>
                            <Check className="h-3 w-3 mr-1" /> Complete
                        </Button>
                    )}
                    {intervention.status === 'completed' && (
                        <Badge variant="success">Completed</Badge>
                    )}
                </div>
            </div>
        </div>
    );
}

function QuestionRow({ question }) {
    const difficultyColors = {
        easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <p className="font-medium">{question.question_text}</p>
                    <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline">{question.subject?.name}</Badge>
                        <Badge className={difficultyColors[question.difficulty_level]}>
                            {question.difficulty_level}
                        </Badge>
                        <span className="text-xs text-gray-400">{question.question_type}</span>
                    </div>
                </div>
                {question.is_approved ? (
                    <Badge variant="success" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3 mr-1" /> Approved
                    </Badge>
                ) : (
                    <Button size="sm" variant="outline">
                        Approve
                    </Button>
                )}
            </div>
        </div>
    );
}
