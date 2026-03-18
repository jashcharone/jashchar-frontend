/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ATTENDANCE HEATMAP COMPONENT - Day 32
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Face Attendance System - Advanced Heatmap Visualizations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip } from '@/components/ui/tooltip';
import { 
    RefreshCw, Calendar, Camera, Clock, Activity, 
    TrendingUp, BarChart3, Grid3X3, MapPin
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import faceAnalyticsApi from '@/services/faceAnalyticsApi';

// ═══════════════════════════════════════════════════════════════════════════════
// HEATMAP CELL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const HeatmapCell = ({ value, maxValue, hour, day }) => {
    // Calculate intensity (0-1)
    const intensity = maxValue > 0 ? value / maxValue : 0;
    
    // Color based on intensity (green gradient)
    const getBackgroundColor = () => {
        if (value === 0) return 'bg-gray-100 dark:bg-gray-800';
        if (intensity < 0.25) return 'bg-green-100 dark:bg-green-900/30';
        if (intensity < 0.5) return 'bg-green-300 dark:bg-green-700/50';
        if (intensity < 0.75) return 'bg-green-500 dark:bg-green-600';
        return 'bg-green-700 dark:bg-green-500';
    };

    const getTextColor = () => {
        if (value === 0) return 'text-gray-400';
        if (intensity < 0.5) return 'text-green-800 dark:text-green-100';
        return 'text-white';
    };

    return (
        <div 
            className={cn(
                'w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-md',
                'text-xs font-medium transition-all hover:scale-110 hover:z-10',
                'cursor-pointer shadow-sm',
                getBackgroundColor(),
                getTextColor()
            )}
            title={`${day} ${hour}:00 - ${value} recognitions`}
        >
            {value > 0 ? value : '-'}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CAMERA HEATMAP CELL
// ═══════════════════════════════════════════════════════════════════════════════

const CameraStatCard = ({ camera, maxRecognitions }) => {
    const intensity = maxRecognitions > 0 ? camera.total / maxRecognitions : 0;
    const successRate = camera.total > 0 
        ? ((camera.successful / camera.total) * 100).toFixed(1) 
        : 0;
    
    const getBorderColor = () => {
        if (intensity < 0.25) return 'border-l-green-300';
        if (intensity < 0.5) return 'border-l-green-500';
        if (intensity < 0.75) return 'border-l-yellow-500';
        return 'border-l-orange-500';
    };

    return (
        <Card className={cn('border-l-4', getBorderColor())}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                            <Camera className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold">{camera.camera_name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {camera.location}
                            </p>
                        </div>
                    </div>
                    <Badge 
                        variant="outline" 
                        className={cn(
                            parseFloat(successRate) >= 90 ? 'bg-green-100 text-green-800' :
                            parseFloat(successRate) >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        )}
                    >
                        {successRate}% success
                    </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{camera.total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{camera.successful}</p>
                        <p className="text-xs text-muted-foreground">Success</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{camera.failed}</p>
                        <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                </div>
                <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span>Avg. Confidence</span>
                        <span>{(camera.avg_confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all" 
                            style={{ width: `${camera.avg_confidence * 100}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HEATMAP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const AttendanceHeatmap = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeView, setActiveView] = useState('hourly');
    const [selectedDays, setSelectedDays] = useState('7');

    // Data
    const [hourlyData, setHourlyData] = useState(null);
    const [cameraData, setCameraData] = useState([]);

    const branchId = selectedBranch?.id;

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA FETCH
    // ═══════════════════════════════════════════════════════════════════════════

    const fetchHeatmapData = useCallback(async () => {
        if (!branchId) return;

        try {
            setRefreshing(true);
            
            const [hourlyRes, cameraRes] = await Promise.all([
                faceAnalyticsApi.getHourlyHeatmap({ 
                    branch_id: branchId, 
                    days: parseInt(selectedDays) 
                }),
                faceAnalyticsApi.getCameraHeatmap({ 
                    branch_id: branchId 
                })
            ]);

            if (hourlyRes.success) setHourlyData(hourlyRes.data);
            if (cameraRes.success) setCameraData(cameraRes.data || []);

        } catch (error) {
            console.error('Error fetching heatmap data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [branchId, selectedDays]);

    useEffect(() => {
        fetchHeatmapData();
    }, [fetchHeatmapData]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER HOURLY HEATMAP
    // ═══════════════════════════════════════════════════════════════════════════

    const renderHourlyHeatmap = () => {
        if (loading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <div className="grid grid-cols-14 gap-1">
                        {Array.from({ length: 98 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-10" />
                        ))}
                    </div>
                </div>
            );
        }

        if (!hourlyData) {
            return (
                <div className="text-center py-12 text-muted-foreground">
                    <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No heatmap data available</p>
                </div>
            );
        }

        const { heatmap, labels } = hourlyData;
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const hours = labels?.hours || Array.from({ length: 13 }, (_, i) => i + 6);

        // Find max value for color scaling
        let maxValue = 0;
        Object.values(heatmap).forEach(dayData => {
            Object.values(dayData).forEach(count => {
                if (count > maxValue) maxValue = count;
            });
        });

        return (
            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    {/* Hour Labels */}
                    <div className="flex gap-1 mb-2 ml-16">
                        {hours.map(hour => (
                            <div 
                                key={hour} 
                                className="w-10 md:w-12 text-center text-xs text-muted-foreground"
                            >
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Heatmap Grid */}
                    {dayLabels.map((day, dayIdx) => (
                        <div key={day} className="flex items-center gap-1 mb-1">
                            <div className="w-14 text-sm font-medium text-muted-foreground">
                                {day}
                            </div>
                            {hours.map(hour => (
                                <HeatmapCell
                                    key={`${dayIdx}-${hour}`}
                                    value={heatmap[dayIdx]?.[hour] || 0}
                                    maxValue={maxValue}
                                    hour={hour}
                                    day={day}
                                />
                            ))}
                        </div>
                    ))}

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-6">
                        <span className="text-xs text-muted-foreground">Less</span>
                        <div className="flex gap-1">
                            <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800" />
                            <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30" />
                            <div className="w-6 h-6 rounded bg-green-300 dark:bg-green-700/50" />
                            <div className="w-6 h-6 rounded bg-green-500 dark:bg-green-600" />
                            <div className="w-6 h-6 rounded bg-green-700 dark:bg-green-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">More</span>
                    </div>
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER CAMERA HEATMAP
    // ═══════════════════════════════════════════════════════════════════════════

    const renderCameraHeatmap = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-48 w-full" />
                    ))}
                </div>
            );
        }

        if (cameraData.length === 0) {
            return (
                <div className="text-center py-12 text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No camera data available for today</p>
                    <p className="text-sm mt-2">Recognition data will appear here once cameras start recording.</p>
                </div>
            );
        }

        const maxRecognitions = Math.max(...cameraData.map(c => c.total), 1);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cameraData.map((camera, idx) => (
                    <CameraStatCard 
                        key={camera.camera_id || idx} 
                        camera={camera}
                        maxRecognitions={maxRecognitions}
                    />
                ))}
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER SPOOF TRENDS
    // ═══════════════════════════════════════════════════════════════════════════

    const [spoofTrends, setSpoofTrends] = useState([]);

    useEffect(() => {
        const fetchSpoofTrends = async () => {
            if (!branchId) return;
            try {
                const res = await faceAnalyticsApi.getSpoofTrends({ 
                    branch_id: branchId, 
                    days: parseInt(selectedDays) 
                });
                if (res.success) setSpoofTrends(res.data || []);
            } catch (error) {
                console.error('Error fetching spoof trends:', error);
            }
        };
        fetchSpoofTrends();
    }, [branchId, selectedDays]);

    const renderSpoofTrends = () => {
        if (loading) {
            return <Skeleton className="h-[300px] w-full" />;
        }

        if (spoofTrends.length === 0) {
            return (
                <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No spoof attempt data available</p>
                </div>
            );
        }

        const maxAttempts = Math.max(...spoofTrends.map(d => d.total), 1);

        return (
            <div className="space-y-4">
                {spoofTrends.map((day, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-muted-foreground">
                            {formatDate(day.date)}
                        </div>
                        <div className="flex-1">
                            <div className="flex gap-1 h-8">
                                {/* Total bar */}
                                <div 
                                    className="bg-red-200 dark:bg-red-900/50 rounded-l transition-all"
                                    style={{ width: `${(day.total / maxAttempts) * 100}%` }}
                                />
                                {/* Blocked overlay */}
                                <div 
                                    className="bg-green-500 dark:bg-green-600 rounded-r transition-all -ml-1"
                                    style={{ width: `${((day.blocked || 0) / maxAttempts) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="w-24 text-right">
                            <Badge variant={day.total === 0 ? 'secondary' : 'destructive'}>
                                {day.total} / {day.blocked || 0}
                            </Badge>
                        </div>
                    </div>
                ))}
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-200 dark:bg-red-900/50" />
                        <span>Total Attempts</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500" />
                        <span>Blocked</span>
                    </div>
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    if (!branchId) {
        return (
            <Alert>
                <Camera className="h-4 w-4" />
                <AlertDescription>
                    Please select a branch to view heatmap visualizations.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Grid3X3 className="h-8 w-8 text-primary" />
                        Recognition Heatmaps
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Visual analytics of face recognition activity
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedDays} onValueChange={setSelectedDays}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Days" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="14">Last 14 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button 
                        variant="outline" 
                        onClick={fetchHeatmapData}
                        disabled={refreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeView} onValueChange={setActiveView}>
                <TabsList>
                    <TabsTrigger value="hourly" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Hourly Activity
                    </TabsTrigger>
                    <TabsTrigger value="camera" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Camera Performance
                    </TabsTrigger>
                    <TabsTrigger value="spoof" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Spoof Trends
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="hourly" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recognition Activity Heatmap</CardTitle>
                            <CardDescription>
                                Face recognition activity by day and hour (6 AM - 6 PM)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderHourlyHeatmap()}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="camera" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Camera Performance Overview</CardTitle>
                            <CardDescription>
                                Recognition stats for each camera today
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderCameraHeatmap()}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="spoof" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Spoof Attempt Trends</CardTitle>
                            <CardDescription>
                                Anti-spoofing activity over the selected period
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderSpoofTrends()}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AttendanceHeatmap;
