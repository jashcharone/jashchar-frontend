/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI INSIGHTS PANEL — Transport Intelligence (Day 26)
 * Embeddable component providing AI-driven transport recommendations
 * Can be placed in TransportDashboard or TransportAnalysis
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Brain, AlertTriangle, TrendingUp, Route, Fuel, Wrench, Users,
    Loader2, RefreshCw, ChevronDown, ChevronUp, Lightbulb, Shield
} from 'lucide-react';
import api from '@/services/api';

const INSIGHT_CATEGORIES = {
    route_optimization: { icon: Route, color: 'text-blue-600 bg-blue-50', label: 'Route Optimization' },
    cost_saving: { icon: Fuel, color: 'text-green-600 bg-green-50', label: 'Cost Saving' },
    maintenance_alert: { icon: Wrench, color: 'text-orange-600 bg-orange-50', label: 'Maintenance Alert' },
    safety: { icon: Shield, color: 'text-red-600 bg-red-50', label: 'Safety' },
    capacity: { icon: Users, color: 'text-purple-600 bg-purple-50', label: 'Capacity' },
    general: { icon: Lightbulb, color: 'text-amber-600 bg-amber-50', label: 'Insight' },
};

const PRIORITY_COLORS = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
};

const AIInsightsPanel = ({ branchId, organizationId }) => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);
    const [expandedInsight, setExpandedInsight] = useState(null);

    const generateInsights = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const params = { branchId, organizationId };
            const [overviewRes, trendsRes] = await Promise.all([
                api.get('/transport/analytics/overview', { params }),
                api.get('/transport/analytics/trends', { params }),
            ]);

            const overview = overviewRes.data?.data || {};
            const trends = trendsRes.data?.data || [];

            // Generate intelligent insights from data
            const generated = [];

            // 1. Vehicle utilization
            if (overview.totalVehicles > 0 && overview.totalRoutes > 0) {
                const ratio = overview.totalRoutes / overview.totalVehicles;
                if (ratio > 1.5) {
                    generated.push({
                        id: 'vehicle-shortage',
                        category: 'capacity',
                        priority: 'high',
                        title: 'Vehicle Shortage Detected',
                        summary: `You have ${overview.totalRoutes} routes but only ${overview.totalVehicles} vehicles. Some routes may share vehicles.`,
                        recommendation: 'Consider adding more vehicles or consolidating nearby routes to reduce overlaps.',
                    });
                } else if (ratio < 0.5) {
                    generated.push({
                        id: 'excess-vehicles',
                        category: 'cost_saving',
                        priority: 'medium',
                        title: 'Underutilized Fleet',
                        summary: `${overview.totalVehicles} vehicles for only ${overview.totalRoutes} routes suggests fleet underutilization.`,
                        recommendation: 'Review fleet size — reducing idle vehicles can save ₹50,000-₹1,00,000/year per vehicle in maintenance and insurance.',
                    });
                }
            }

            // 2. Driver shortage
            if (overview.totalDrivers > 0 && overview.totalVehicles > 0) {
                if (overview.totalDrivers < overview.totalVehicles) {
                    generated.push({
                        id: 'driver-shortage',
                        category: 'safety',
                        priority: 'high',
                        title: 'Driver Shortage',
                        summary: `Only ${overview.totalDrivers} drivers for ${overview.totalVehicles} vehicles. Not all vehicles can operate simultaneously.`,
                        recommendation: 'Recruit additional drivers to ensure full fleet coverage and emergency backup.',
                    });
                }
            }

            // 3. Incident trends
            if (overview.totalIncidents > 5) {
                generated.push({
                    id: 'high-incidents',
                    category: 'safety',
                    priority: 'high',
                    title: 'High Incident Count',
                    summary: `${overview.totalIncidents} incidents recorded. Review patterns to prevent recurring issues.`,
                    recommendation: 'Conduct driver safety training and implement stricter pre-trip checklists.',
                });
            }

            // 4. Maintenance tracking
            if (overview.totalMaintenance === 0 && overview.totalVehicles > 0) {
                generated.push({
                    id: 'no-maintenance',
                    category: 'maintenance_alert',
                    priority: 'medium',
                    title: 'No Maintenance Records',
                    summary: 'No vehicle maintenance records found. Regular servicing prevents breakdowns and ensures safety.',
                    recommendation: 'Set up a preventive maintenance schedule for all vehicles (every 5,000 km or monthly).',
                });
            }

            // 5. Fuel efficiency from trends
            if (trends.length >= 2) {
                const last = trends[trends.length - 1];
                const prev = trends[trends.length - 2];
                if (last?.fuel_cost > 0 && prev?.fuel_cost > 0) {
                    const change = ((last.fuel_cost - prev.fuel_cost) / prev.fuel_cost) * 100;
                    if (change > 20) {
                        generated.push({
                            id: 'fuel-spike',
                            category: 'cost_saving',
                            priority: 'medium',
                            title: 'Fuel Cost Spike',
                            summary: `Fuel costs increased by ${change.toFixed(0)}% from ${prev.month} to ${last.month}.`,
                            recommendation: 'Check for route inefficiencies, vehicle condition, or fuel price changes. Consider route optimization.',
                        });
                    }
                }
            }

            // 6. Trip efficiency
            if (overview.totalTrips > 0 && overview.totalStudents > 0) {
                const tripsPerStudent = overview.totalTrips / overview.totalStudents;
                generated.push({
                    id: 'trip-efficiency',
                    category: 'route_optimization',
                    priority: 'low',
                    title: 'Trip Efficiency Index',
                    summary: `${overview.totalTrips} trips serving ${overview.totalStudents} students (${tripsPerStudent.toFixed(1)} trips/student).`,
                    recommendation: tripsPerStudent > 2 ? 'Consider consolidating routes to reduce total trips.' : 'Trip efficiency looks good! Keep monitoring.',
                });
            }

            // 7. General recommendation if no data
            if (generated.length === 0) {
                generated.push({
                    id: 'getting-started',
                    category: 'general',
                    priority: 'low',
                    title: 'Getting Started with Transport Analytics',
                    summary: 'Add more vehicles, routes, drivers, and log trips to unlock AI-powered insights.',
                    recommendation: 'Start by assigning vehicles to routes and recording daily trips for meaningful analytics.',
                });
            }

            setInsights(generated);
        } catch (err) {
            console.error('[AIInsights] Error:', err);
            setInsights([{
                id: 'error',
                category: 'general',
                priority: 'low',
                title: 'Unable to Generate Insights',
                summary: 'Could not fetch analytics data. Please check your connection.',
                recommendation: 'Try refreshing or check if the transport module has data.',
            }]);
        } finally { setLoading(false); }
    }, [branchId, organizationId]);

    useEffect(() => { generateInsights(); }, [generateInsights]);

    const highCount = insights.filter(i => i.priority === 'high').length;
    const medCount = insights.filter(i => i.priority === 'medium').length;

    return (
        <Card className="border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="h-5 w-5 text-indigo-600" />
                        AI Transport Insights
                        {highCount > 0 && <Badge variant="destructive" className="text-xs">{highCount} Critical</Badge>}
                        {medCount > 0 && <Badge className="text-xs bg-yellow-100 text-yellow-700">{medCount} Warning</Badge>}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); generateInsights(); }} disabled={loading}>
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                            <span className="text-sm text-muted-foreground">Analyzing transport data...</span>
                        </div>
                    ) : (
                        insights.map(insight => {
                            const cat = INSIGHT_CATEGORIES[insight.category] || INSIGHT_CATEGORIES.general;
                            const Icon = cat.icon;
                            const isOpen = expandedInsight === insight.id;

                            return (
                                <div key={insight.id}
                                    className={`rounded-lg border p-3 transition cursor-pointer hover:shadow-sm ${PRIORITY_COLORS[insight.priority] || ''}`}
                                    onClick={() => setExpandedInsight(isOpen ? null : insight.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-1.5 rounded-md ${cat.color}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm">{insight.title}</span>
                                                <Badge variant="outline" className="text-[10px]">{cat.label}</Badge>
                                            </div>
                                            <p className="text-xs mt-1 opacity-80">{insight.summary}</p>
                                            {isOpen && (
                                                <div className="mt-2 p-2 bg-white/60 dark:bg-gray-900/60 rounded text-xs">
                                                    <span className="font-semibold">💡 Recommendation:</span> {insight.recommendation}
                                                </div>
                                            )}
                                        </div>
                                        {isOpen ? <ChevronUp className="h-4 w-4 mt-1" /> : <ChevronDown className="h-4 w-4 mt-1" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            )}
        </Card>
    );
};

export default AIInsightsPanel;
