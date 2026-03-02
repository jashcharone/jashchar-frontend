/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI BRAIN DASHBOARD
 * "The Control Center of Cortex AI"
 * ═══════════════════════════════════════════════════════════════════════════════
 * Features:
 * - Brain Health Status
 * - Manual Analysis Trigger
 * - Decision Logs
 * - AI Rules Management
 * - Analysis History
 */

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { formatDateTime } from '@/utils/dateUtils';
import { 
    Brain, 
    Activity, 
    Zap, 
    Clock, 
    AlertTriangle,
    TrendingUp,
    PlayCircle,
    Settings,
    History,
    ChevronRight,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    Cpu,
    BarChart3,
    Lightbulb
} from 'lucide-react';

const AIBrainDashboard = () => {
    const [brainStatus, setBrainStatus] = useState(null);
    const [decisionLogs, setDecisionLogs] = useState([]);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [aiRules, setAIRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        
        // Fetch each API independently so one failure doesn't block others
        try {
            const statusRes = await api.get('/cortex/brain/status');
            console.log('[AI Brain] Status response:', statusRes.data);
            setBrainStatus(statusRes.data);
        } catch (error) {
            console.error('[AI Brain] Status API error:', error?.response?.data || error.message);
        }
        
        try {
            const logsRes = await api.get('/cortex/brain/logs?limit=10');
            setDecisionLogs(logsRes.data?.data || []);
        } catch (error) {
            console.error('[AI Brain] Logs API error:', error?.response?.data || error.message);
        }
        
        try {
            const historyRes = await api.get('/cortex/brain/history?days=7');
            setAnalysisHistory(historyRes.data || []);
        } catch (error) {
            console.error('[AI Brain] History API error:', error?.response?.data || error.message);
        }
        
        try {
            const rulesRes = await api.get('/cortex/brain/rules');
            setAIRules(rulesRes.data || []);
        } catch (error) {
            console.error('[AI Brain] Rules API error:', error?.response?.data || error.message);
        }
        
        setLoading(false);
    };

    const triggerAnalysis = async () => {
        setAnalyzing(true);
        try {
            const response = await api.post('/cortex/brain/analyze');
            console.log('Analysis response:', response);
            
            if (response?.data?.success) {
                alert(`✅ Analysis Complete!\n\nInsights: ${response.data.results?.insights || 0}\nAlerts: ${response.data.results?.alerts || 0}\nSuggestions: ${response.data.results?.suggestions || 0}`);
                fetchAllData();
            } else if (response?.data?.error) {
                alert(`❌ Analysis failed: ${response.data.error}`);
            } else {
                // Still refresh data even if response format is different
                alert('✅ Analysis triggered successfully!');
                fetchAllData();
            }
        } catch (error) {
            console.error('Analysis error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
            alert(`❌ Analysis failed: ${errorMsg}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const getBrainStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-400';
            case 'idle': return 'text-yellow-400';
            case 'sleeping': return 'text-orange-400';
            case 'inactive': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getBrainStatusBg = (status) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 border-green-500/50';
            case 'idle': return 'bg-yellow-500/20 border-yellow-500/50';
            case 'sleeping': return 'bg-orange-500/20 border-orange-500/50';
            case 'inactive': return 'bg-red-500/20 border-red-500/50';
            default: return 'bg-gray-500/20 border-gray-500/50';
        }
    };

    const getHealthScoreColor = (score) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Brain className="w-16 h-16 text-purple-500 animate-pulse mx-auto mb-4" />
                    <p className="text-gray-400">Loading AI Brain...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-500" />
                        AI Brain Engine
                    </h1>
                    <p className="text-gray-400 mt-1">Monitor and control Cortex AI processing</p>
                </div>
                
                <button
                    onClick={triggerAnalysis}
                    disabled={analyzing}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                        ${analyzing 
                            ? 'bg-purple-500/50 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25'
                        } text-white`}
                >
                    {analyzing ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <PlayCircle className="w-5 h-5" />
                            Run Analysis Now
                        </>
                    )}
                </button>
            </div>

            {/* Brain Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Card */}
                <div className={`p-6 rounded-xl border ${getBrainStatusBg(brainStatus?.status)}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Brain Status</p>
                            <p className={`text-2xl font-bold capitalize ${getBrainStatusColor(brainStatus?.status)}`}>
                                {brainStatus?.status || 'Unknown'}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${getBrainStatusBg(brainStatus?.status)}`}>
                            <Activity className={`w-6 h-6 ${getBrainStatusColor(brainStatus?.status)}`} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                        Last analysis: {brainStatus?.hoursSinceAnalysis || '?'} hours ago
                    </p>
                </div>

                {/* Health Score */}
                <div className="p-6 rounded-xl border border-gray-700 bg-gray-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Health Score</p>
                            <p className={`text-2xl font-bold ${getHealthScoreColor(brainStatus?.healthScore)}`}>
                                {brainStatus?.healthScore || 0}%
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-500/20">
                            <Cpu className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                    <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                brainStatus?.healthScore >= 80 ? 'bg-green-500' :
                                brainStatus?.healthScore >= 60 ? 'bg-yellow-500' :
                                brainStatus?.healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${brainStatus?.healthScore || 0}%` }}
                        />
                    </div>
                </div>

                {/* Today's Alerts */}
                <div className="p-6 rounded-xl border border-gray-700 bg-gray-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Today's Alerts</p>
                            <p className="text-2xl font-bold text-orange-400">
                                {brainStatus?.todaysStats?.alerts || 0}
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-orange-500/20">
                            <AlertTriangle className="w-6 h-6 text-orange-400" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                        {brainStatus?.todaysStats?.suggestions || 0} suggestions pending
                    </p>
                </div>

                {/* Insights Generated */}
                <div className="p-6 rounded-xl border border-gray-700 bg-gray-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Today's Insights</p>
                            <p className="text-2xl font-bold text-purple-400">
                                {brainStatus?.todaysStats?.insights || 0}
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-500/20">
                            <Lightbulb className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">AI-generated insights today</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-700 pb-2">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'logs', label: 'Decision Logs', icon: FileText },
                    { id: 'rules', label: 'AI Rules', icon: Settings },
                    { id: 'history', label: 'History', icon: History }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors
                            ${activeTab === tab.id 
                                ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500' 
                                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">AI Brain Overview</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* AI Settings Summary */}
                            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                <h4 className="text-white font-medium mb-3">Current Configuration</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">AI Level:</span>
                                        <span className="text-white capitalize">{brainStatus?.settings?.aiLevel || 'Basic'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Auto Insights:</span>
                                        <span className={brainStatus?.settings?.autoInsights ? 'text-green-400' : 'text-red-400'}>
                                            {brainStatus?.settings?.autoInsights ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Auto Alerts:</span>
                                        <span className={brainStatus?.settings?.autoAlerts ? 'text-green-400' : 'text-red-400'}>
                                            {brainStatus?.settings?.autoAlerts ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Schedule */}
                            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                <h4 className="text-white font-medium mb-3">Analysis Schedule</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-300">Runs every 6 hours automatically</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-purple-400" />
                                        <span className="text-gray-300">Manual trigger available anytime</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                        <span className="text-gray-300">Daily summaries at 6 AM</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* What AI Analyzes */}
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                            <h4 className="text-white font-medium mb-3">What Cortex AI Analyzes</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Attendance Patterns', icon: '📊', color: 'blue' },
                                    { label: 'Fee Default Risk', icon: '💰', color: 'green' },
                                    { label: 'Academic Performance', icon: '📚', color: 'purple' },
                                    { label: 'Dropout Risk', icon: '⚠️', color: 'red' }
                                ].map((item, idx) => (
                                    <div key={idx} className="text-center p-3 bg-gray-800/50 rounded-lg">
                                        <span className="text-2xl">{item.icon}</span>
                                        <p className="text-sm text-gray-300 mt-1">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">Decision Logs</h3>
                            <button 
                                onClick={fetchAllData}
                                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                        
                        {decisionLogs.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No decision logs yet. Run an analysis to see logs.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {decisionLogs.map((log, idx) => (
                                    <div 
                                        key={log.id || idx}
                                        className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700"
                                    >
                                        <div className={`p-2 rounded-lg ${
                                            log.status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                                        }`}>
                                            {log.status === 'success' 
                                                ? <CheckCircle className="w-5 h-5 text-green-400" />
                                                : <XCircle className="w-5 h-5 text-red-400" />
                                            }
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium capitalize">
                                                {log.action_type?.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {formatDateTime(log.created_at)}
                                                {log.outputs && (
                                                    <span className="ml-2">
                                                        • {log.outputs.insights_count || 0} insights, {log.outputs.alerts_count || 0} alerts
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-500 capitalize">
                                            {log.triggered_by || 'system'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'rules' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">AI Rules</h3>
                            <button className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-500">
                                + Add Rule
                            </button>
                        </div>
                        
                        {aiRules.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No custom rules configured. Add rules to customize AI behavior.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {aiRules.map((rule, idx) => (
                                    <div 
                                        key={rule.id || idx}
                                        className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700"
                                    >
                                        <div className={`p-2 rounded-lg ${
                                            rule.is_active ? 'bg-green-500/20' : 'bg-gray-500/20'
                                        }`}>
                                            <AlertCircle className={`w-5 h-5 ${
                                                rule.is_active ? 'text-green-400' : 'text-gray-400'
                                            }`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{rule.rule_name}</p>
                                            <p className="text-sm text-gray-400">{rule.description}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            rule.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                            rule.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                            rule.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                            {rule.severity}
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Analysis History (Last 7 Days)</h3>
                        
                        {analysisHistory.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No analysis history available yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {analysisHistory.map((item, idx) => (
                                    <div 
                                        key={item.id || idx}
                                        className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700"
                                    >
                                        <div className="p-2 rounded-lg bg-purple-500/20">
                                            <BarChart3 className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">
                                                {item.analysis_date} - {item.analysis_type}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                Analyzed {item.total_students_analyzed} students • 
                                                {item.total_alerts_generated} alerts • 
                                                {item.total_insights_generated} insights
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                item.critical_alerts > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                            }`}>
                                                {item.critical_alerts > 0 ? `${item.critical_alerts} critical` : 'All clear'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIBrainDashboard;
