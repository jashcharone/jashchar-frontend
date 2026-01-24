import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ROUTES } from '@/registry/routeRegistry';
import { BASE_SIDEBAR } from '@/config/sidebarConfig';
import { validateProjectIntegrity } from '@/utils/projectValidator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, ShieldCheck } from 'lucide-react';

const ModuleHealth = () => {
    const [report, setReport] = useState(null);
    const [registryCount, setRegistryCount] = useState(0);
    const [sidebarModuleCount, setSidebarModuleCount] = useState(0);

    const runCheck = () => {
        const integrity = validateProjectIntegrity();
        setReport(integrity);
        
        // Count Routes
        let count = 0;
        Object.values(ROUTES || {}).forEach(cat => {
            if (cat && typeof cat === 'object') {
                count += Object.keys(cat).length;
            }
        });
        setRegistryCount(count);

        // Count Sidebar Modules (Dynamic Check)
        let moduleCount = 0;
        Object.values(BASE_SIDEBAR || {}).forEach(roleMenu => {
            if (Array.isArray(roleMenu)) {
                roleMenu.forEach(item => {
                    moduleCount++;
                    if (item?.submenu) moduleCount += item.submenu.length;
                });
            }
        });
        setSidebarModuleCount(moduleCount);
    };

    useEffect(() => {
        runCheck();
    }, []);

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-green-600" />
                        <div>
                            <h1 className="text-2xl font-bold">Horizon Safety Shield</h1>
                            <p className="text-sm text-muted-foreground">Module Health & Integrity Monitor</p>
                        </div>
                    </div>
                    <Button onClick={runCheck}><RefreshCw className="mr-2 h-4 w-4"/> Re-run Check</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">System Status</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                {report?.status === 'Healthy' ? <CheckCircle className="text-green-500 h-6 w-6" /> : <AlertTriangle className="text-yellow-500 h-6 w-6" />}
                                <span className="text-2xl font-bold">{report?.status || 'Unknown'}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Routes</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{registryCount}</div>
                            <p className="text-xs text-muted-foreground">Registered in Route Registry</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Modules</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{sidebarModuleCount}</div>
                            <p className="text-xs text-muted-foreground">Dynamically Loaded from Config</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Route Registry Overview</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {Object.entries(ROUTES).map(([category, routes]) => (
                                <div key={category} className="border rounded-lg p-4">
                                    <h3 className="font-bold mb-3 flex items-center justify-between">
                                        {category} 
                                        <Badge variant="outline">{Object.keys(routes).length} Routes</Badge>
                                    </h3>
                                    <div className="max-h-60 overflow-y-auto space-y-1">
                                        {Object.entries(routes).map(([key, path]) => (
                                            <div key={key} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                                                <span className="font-mono text-xs text-muted-foreground">{key}</span>
                                                <span className="font-medium truncate ml-2" title={path}>{path}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ModuleHealth;
