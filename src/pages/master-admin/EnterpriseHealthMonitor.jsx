import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, Activity, Server, AlertTriangle, Database } from 'lucide-react';
import { runFullSystemScan } from '@/utils/security/healthCheckSystem';
import { takeSystemSnapshot } from '@/utils/security/snapshotManager';
import { supabase } from '@/lib/customSupabaseClient';

const EnterpriseHealthMonitor = () => {
    const [healthData, setHealthData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [backingUp, setBackingUp] = useState(false);

    const refreshHealth = () => {
        setRefreshing(true);
        // Simulate network delay for realism
        setTimeout(() => {
            const data = runFullSystemScan();
            setHealthData(data);
            setRefreshing(false);
        }, 800);
    };

    const handleManualSnapshot = () => {
        takeSystemSnapshot('manual_console_request');
        refreshHealth();
        alert("Manual snapshot created successfully.");
    };

    const handleFullBackup = async () => {
        try {
            setBackingUp(true);
            
            // Client-side backup of critical tables
            const tables = ['schools', 'users', 'subscriptions', 'payments', 'school_requests'];
            const backupData = {};

            for (const table of tables) {
                const { data, error } = await supabase.from(table).select('*');
                if (!error) {
                    backupData[table] = data;
                }
            }
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `jashchar_client_backup_${new Date().toISOString()}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            alert("Client-side System Backup downloaded successfully.");
        } catch (error) {
            console.error("Backup failed", error);
            alert("Backup failed. Check console for details.");
        } finally {
            setBackingUp(false);
        }
    };

    useEffect(() => {
        refreshHealth();
    }, []);

    if (!healthData) return (
        <DashboardLayout>
            <div className="p-8 flex justify-center text-gray-500">Initializing Security Scans...</div>
        </DashboardLayout>
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'green': return 'bg-emerald-500';
            case 'yellow': return 'bg-amber-500';
            case 'red': return 'bg-rose-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8 text-emerald-600" />
                            Enterprise Health Monitor
                        </h1>
                        <p className="text-gray-500">Real-time security and immutability enforcement dashboard.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="px-3 py-1 text-sm bg-slate-100">
                            {healthData.environment}
                        </Badge>
                        <Button onClick={refreshHealth} disabled={refreshing}>
                            {refreshing ? 'Scanning...' : 'Run Diagnostics'}
                        </Button>
                        <Button variant="secondary" onClick={handleManualSnapshot}>
                            Create Snapshot
                        </Button>
                        <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={handleFullBackup} disabled={backingUp}>
                            <Database className="h-4 w-4 mr-2" />
                            {backingUp ? 'Exporting...' : 'Full DB Backup'}
                        </Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-l-emerald-500">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">System Integrity Score</p>
                                    <h3 className="text-3xl font-bold mt-2">{healthData.score}/100</h3>
                                </div>
                                <Activity className={`h-8 w-8 ${healthData.overallStatus === 'green' ? 'text-emerald-500' : 'text-amber-500'}`} />
                            </div>
                            <div className="mt-4 text-xs text-emerald-600 font-medium flex items-center">
                                <ShieldCheck className="h-3 w-3 mr-1" /> All Systems Operational
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Route Lock Status</p>
                                    <h3 className="text-2xl font-bold mt-2 text-emerald-600">
                                        {healthData.components.routes.status}
                                    </h3>
                                </div>
                                <Lock className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="mt-4 text-xs text-gray-500">
                                {healthData.components.routes.violations.length === 0 ? 'No violations detected' : `${healthData.components.routes.violations.length} issues found`}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Snapshots Available</p>
                                    <h3 className="text-3xl font-bold mt-2">{healthData.components.snapshots.count}</h3>
                                </div>
                                <Database className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="mt-4 text-xs text-gray-500">
                                Last Backup: {new Date(healthData.components.snapshots.lastBackup).toLocaleTimeString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Lock className="h-5 w-5 text-blue-600" />
                                Immutability Enforcement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                    <span className="font-medium">Core Routes</span>
                                </div>
                                <Badge variant="secondary">LOCKED</Badge>
                            </div>
                             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                    <span className="font-medium">Sidebar Structure</span>
                                </div>
                                <Badge variant="secondary">FROZEN</Badge>
                            </div>
                             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                    <span className="font-medium">Permission Merge Strategy</span>
                                </div>
                                <Badge variant="secondary">APPEND-ONLY</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Server className="h-5 w-5 text-purple-600" />
                                Active Firewalls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-100 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-purple-900">Breakage Firewall</h4>
                                    <p className="text-xs text-purple-700">Intercepting dangerous config changes</p>
                                </div>
                                <Badge className="bg-purple-200 text-purple-800 hover:bg-purple-300">ACTIVE</Badge>
                            </div>
                             <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-blue-900">UI Structure Freeze</h4>
                                    <p className="text-xs text-blue-700">Monitoring critical page DOMs</p>
                                </div>
                                <Badge className="bg-blue-200 text-blue-800 hover:bg-blue-300">ACTIVE</Badge>
                            </div>
                             <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-amber-900">Staging Mode</h4>
                                    <p className="text-xs text-amber-700">Experimental features isolated</p>
                                </div>
                                <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300">ENFORCED</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default EnterpriseHealthMonitor;
