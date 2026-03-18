/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI HEALTH MONITOR DASHBOARD - MASTER ADMIN
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Real-time AI provider health monitoring for Master Admin
 * 
 * Features:
 * - Live status indicators for all AI providers
 * - Response time monitoring
 * - Uptime statistics
 * - Manual health check trigger
 * - Alert history
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Activity, 
    Zap, 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    RefreshCw,
    Clock,
    TrendingUp,
    Server,
    Eye,
    Brain,
    FileText,
    MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';

const AIHealthMonitorDashboard = () => {
    const [quickStatus, setQuickStatus] = useState(null);
    const [healthReport, setHealthReport] = useState(null);
    const [usageStats, setUsageStats] = useState(null);
    const [healthHistory, setHealthHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [lastCheck, setLastCheck] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Load quick status on mount
    useEffect(() => {
        loadQuickStatus();
        loadUsageStats();
        loadHealthHistory();
    }, []);

    // Auto refresh every 5 minutes
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(() => {
            loadQuickStatus();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const loadQuickStatus = async () => {
        try {
            const response = await api.get('/ai-health/status');
            console.log('[AI Health] Quick status response:', response);
            if (response.success) {
                setQuickStatus(response.data);
            }
        } catch (error) {
            console.error('Failed to load AI status:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsageStats = async () => {
        try {
            const response = await api.get('/ai-health/usage?days=7');
            if (response.success) {
                setUsageStats(response.data);
            }
        } catch (error) {
            console.error('Failed to load usage stats:', error);
        }
    };

    const loadHealthHistory = async () => {
        try {
            const response = await api.get('/ai-health/history');
            if (response.success) {
                setHealthHistory(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load health history:', error);
        }
    };

    const runHealthCheck = async () => {
        setChecking(true);
        try {
            const response = await api.post('/ai-health/check');
            console.log('[AI Health] Full check response:', response);
            if (response.success) {
                setHealthReport(response.data);
                setLastCheck(new Date().toISOString());
                // Reload history after check
                loadHealthHistory();
            }
        } catch (error) {
            console.error('Health check failed:', error);
        } finally {
            setChecking(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'degraded':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'down':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Activity className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-100 border-green-500 text-green-800';
            case 'degraded':
                return 'bg-yellow-100 border-yellow-500 text-yellow-800';
            case 'down':
                return 'bg-red-100 border-red-500 text-red-800';
            default:
                return 'bg-gray-100 border-gray-300 text-gray-600';
        }
    };

    const getOverallStatusBadge = () => {
        if (!healthReport) return null;
        
        const status = healthReport.overall_status;
        const bgColor = status === 'healthy' ? 'bg-green-500' : 
                       status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500';
        
        return (
            <span className={`${bgColor} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                {status === 'healthy' ? 'All Systems Operational' : 
                 status === 'degraded' ? 'Partial Degradation' : 'Critical Issues'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading AI Health Status...</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="w-7 h-7 text-blue-600" />
                        AI Health Monitor
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Real-time monitoring of all Cortex AI providers
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded"
                        />
                        Auto-refresh (5 min)
                    </label>
                    <button
                        onClick={runHealthCheck}
                        disabled={checking}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                            ${checking 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                        {checking ? 'Checking...' : 'Run Health Check'}
                    </button>
                </div>
            </div>

            {/* Overall Status Banner */}
            {healthReport && (
                <div className={`p-4 rounded-lg border-l-4 ${
                    healthReport.overall_status === 'healthy' ? 'bg-green-50 border-green-500' :
                    healthReport.overall_status === 'degraded' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-red-50 border-red-500'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {getStatusIcon(healthReport.overall_status)}
                            <div>
                                <h3 className="font-semibold">
                                    {healthReport.overall_status === 'healthy' ? 'All Systems Operational' :
                                     healthReport.overall_status === 'degraded' ? 'Partial Service Degradation' :
                                     'Critical Service Outage'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {healthReport.summary.healthy}/{healthReport.summary.total} providers healthy
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            Last checked: {formatDateTime(healthReport.timestamp)}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Claude Status */}
                <div className={`p-4 rounded-lg border-2 ${
                    quickStatus?.claude?.configured ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-6 h-6 text-purple-600" />
                            <h3 className="font-semibold">Claude</h3>
                        </div>
                        {quickStatus?.claude?.configured ? 
                            <CheckCircle className="w-5 h-5 text-green-500" /> : 
                            <XCircle className="w-5 h-5 text-red-500" />
                        }
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Analytics & Insights</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Model: {quickStatus?.claude?.model || 'Not configured'}
                    </p>
                    {healthReport?.providers?.claude && (
                        <div className="mt-2 text-xs">
                            <span className="text-gray-500">Response: </span>
                            <span className="font-medium">
                                {healthReport.providers.claude.response_time_ms}ms
                            </span>
                        </div>
                    )}
                </div>

                {/* OpenAI Status */}
                <div className={`p-4 rounded-lg border-2 ${
                    quickStatus?.openai?.configured ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-green-600" />
                            <h3 className="font-semibold">OpenAI</h3>
                        </div>
                        {quickStatus?.openai?.configured ? 
                            <CheckCircle className="w-5 h-5 text-green-500" /> : 
                            <XCircle className="w-5 h-5 text-red-500" />
                        }
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Chat Assistant</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Model: {quickStatus?.openai?.model || 'Not configured'}
                    </p>
                    {healthReport?.providers?.openai && (
                        <div className="mt-2 text-xs">
                            <span className="text-gray-500">Response: </span>
                            <span className="font-medium">
                                {healthReport.providers.openai.response_time_ms}ms
                            </span>
                        </div>
                    )}
                </div>

                {/* Google Vision Status */}
                <div className={`p-4 rounded-lg border-2 ${
                    quickStatus?.google_vision?.configured ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Eye className="w-6 h-6 text-blue-600" />
                            <h3 className="font-semibold">Google Vision</h3>
                        </div>
                        {quickStatus?.google_vision?.configured ? 
                            <CheckCircle className="w-5 h-5 text-green-500" /> : 
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        }
                    </div>
                    <p className="text-sm text-gray-600 mt-2">OCR (Premium)</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {quickStatus?.google_vision?.engine || (quickStatus?.google_vision?.configured ? 'Configured' : 'Using fallback')}
                    </p>
                    {healthReport?.providers?.google_vision && (
                        <div className="mt-2 text-xs">
                            <span className="text-gray-500">Response: </span>
                            <span className="font-medium">
                                {healthReport.providers.google_vision.response_time_ms}ms
                            </span>
                        </div>
                    )}
                </div>

                {/* Tesseract Status */}
                <div className={`p-4 rounded-lg border-2 ${
                    quickStatus?.tesseract?.configured ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-6 h-6 text-orange-600" />
                            <h3 className="font-semibold">Tesseract</h3>
                        </div>
                        {quickStatus?.tesseract?.configured ? 
                            <CheckCircle className="w-5 h-5 text-green-500" /> : 
                            <XCircle className="w-5 h-5 text-red-500" />
                        }
                    </div>
                    <p className="text-sm text-gray-600 mt-2">OCR (Fallback)</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {quickStatus?.tesseract?.engine || 'Local Engine'}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                        Active: {quickStatus?.ocr?.active_engine?.replace('_', ' ').toUpperCase() || 'Unknown'}
                    </p>
                </div>
            </div>

            {/* Billing & Cost Section */}
            {usageStats?.billing && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow p-6 text-white">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        💰 AI Usage & Billing (This Month)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Monthly Quota */}
                        <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-sm opacity-80">Monthly Quota</p>
                            <p className="text-2xl font-bold">₹{usageStats.billing.monthly_quota_inr}</p>
                            <p className="text-xs opacity-60">${usageStats.billing.monthly_quota_usd} USD</p>
                        </div>

                        {/* Spent */}
                        <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-sm opacity-80">Spent</p>
                            <p className="text-2xl font-bold">₹{usageStats.billing.spent_inr}</p>
                            <p className="text-xs opacity-60">${usageStats.billing.spent_usd} USD</p>
                        </div>

                        {/* Remaining */}
                        <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-sm opacity-80">Remaining</p>
                            <p className="text-2xl font-bold text-green-300">₹{usageStats.billing.remaining_inr}</p>
                            <p className="text-xs opacity-60">${usageStats.billing.remaining_usd} USD</p>
                        </div>

                        {/* Usage % */}
                        <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-sm opacity-80">Usage</p>
                            <p className="text-2xl font-bold">{usageStats.billing.usage_percent}%</p>
                            <div className="mt-2 w-full bg-white/20 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${usageStats.billing.usage_percent > 80 ? 'bg-red-400' : 'bg-green-400'}`}
                                    style={{ width: `${Math.min(100, usageStats.billing.usage_percent)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* API Calls & Token Usage */}
            {usageStats?.api_calls && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        📊 API Calls & Token Usage (Last {usageStats.period_days} Days)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Claude Usage */}
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Brain className="w-5 h-5 text-purple-600" />
                                <h3 className="font-semibold">Claude</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">API Calls</span>
                                    <span className="font-medium">{usageStats.api_calls.claude}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Input Tokens</span>
                                    <span className="font-medium">{(usageStats.token_usage?.claude?.input || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Output Tokens</span>
                                    <span className="font-medium">{(usageStats.token_usage?.claude?.output || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-gray-500">Cost</span>
                                    <span className="font-medium text-purple-600">${usageStats.costs?.usd?.claude || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* OpenAI Usage */}
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <MessageSquare className="w-5 h-5 text-green-600" />
                                <h3 className="font-semibold">OpenAI</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">API Calls</span>
                                    <span className="font-medium">{usageStats.api_calls.openai}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Input Tokens</span>
                                    <span className="font-medium">{(usageStats.token_usage?.openai?.input || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Output Tokens</span>
                                    <span className="font-medium">{(usageStats.token_usage?.openai?.output || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-gray-500">Cost</span>
                                    <span className="font-medium text-green-600">${usageStats.costs?.usd?.openai || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Google Vision Usage */}
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Eye className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold">Google Vision</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">API Calls</span>
                                    <span className="font-medium">{usageStats.api_calls.google_vision}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Images Processed</span>
                                    <span className="font-medium">{usageStats.token_usage?.google_vision?.images || 0}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-gray-500">Cost</span>
                                    <span className="font-medium text-blue-600">${usageStats.costs?.usd?.google_vision || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Cost Summary */}
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="text-gray-600">Total Cost (Last {usageStats.period_days} days)</span>
                        <div className="text-right">
                            <span className="text-xl font-bold text-gray-800">
                                ₹{usageStats.costs?.inr?.total || 0}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                                (${usageStats.costs?.usd?.total || 0} USD)
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Usage Statistics */}
            {usageStats && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Usage Statistics (Last {usageStats.period_days} Days)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Uptime */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Uptime</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span>Claude</span>
                                    <span className={`font-medium ${usageStats.uptime.claude >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {usageStats.uptime.claude}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>OpenAI</span>
                                    <span className={`font-medium ${usageStats.uptime.openai >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {usageStats.uptime.openai}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Google Vision</span>
                                    <span className={`font-medium ${usageStats.uptime.google_vision >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {usageStats.uptime.google_vision}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Avg Response Time */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Response Time</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span>Claude</span>
                                    <span className="font-medium">{usageStats.avg_response_time.claude}ms</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>OpenAI</span>
                                    <span className="font-medium">{usageStats.avg_response_time.openai}ms</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Google Vision</span>
                                    <span className="font-medium">{usageStats.avg_response_time.google_vision}ms</span>
                                </div>
                            </div>
                        </div>

                        {/* Evaluations */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">AI Evaluations</h3>
                            <div className="text-3xl font-bold text-blue-600">
                                {usageStats.evaluations.total}
                            </div>
                            <p className="text-sm text-gray-500">Total evaluations</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Health Check History */}
            {healthHistory.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Recent Health Checks
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claude</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OpenAI</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Google Vision</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {healthHistory.slice(0, 10).map((log, index) => (
                                    <tr key={log.id || index}>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatDateTime(log.timestamp)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                log.overall_status === 'healthy' ? 'bg-green-100 text-green-800' :
                                                log.overall_status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {getStatusIcon(log.overall_status)}
                                                {log.overall_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={log.claude_status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                                                {log.claude_status} ({log.claude_response_ms}ms)
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={log.openai_status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                                                {log.openai_status} ({log.openai_response_ms}ms)
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={log.google_vision_status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                                                {log.google_vision_status} ({log.google_vision_response_ms}ms)
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Provider Details (after health check) */}
            {healthReport && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Server className="w-5 h-5 text-blue-600" />
                        Detailed Provider Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(healthReport.providers).map(([key, provider]) => (
                            <div 
                                key={key}
                                className={`p-4 rounded-lg border-l-4 ${getStatusColor(provider.status)}`}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{provider.name}</h3>
                                    {getStatusIcon(provider.status)}
                                </div>
                                <p className="text-sm mt-1">{provider.message}</p>
                                <div className="mt-2 text-xs text-gray-500 space-y-1">
                                    <p>Response Time: {provider.response_time_ms}ms</p>
                                    {provider.model && <p>Model: {provider.model}</p>}
                                    <p>Last Check: {formatDateTime(provider.last_check)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">How to Use</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Click <strong>Run Health Check</strong> to test all AI providers with actual API calls</li>
                    <li>• <strong>Green</strong> = Working, <strong>Yellow</strong> = Degraded, <strong>Red</strong> = Down</li>
                    <li>• Auto-refresh checks configuration every 5 minutes</li>
                    <li>• If any AI shows <strong>Red</strong>, check API keys and billing in respective dashboards</li>
                </ul>
            </div>
        </div>
    );
};

export default AIHealthMonitorDashboard;
