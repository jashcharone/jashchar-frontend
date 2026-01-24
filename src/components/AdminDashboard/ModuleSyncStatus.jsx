import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyModuleSync } from '@/utils/moduleSyncVerification';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { moduleInitializationService } from '@/services/moduleInitializationService';

const ModuleSyncStatus = () => {
    const [report, setReport] = useState(null);
    const [syncing, setSyncing] = useState(false);

    const check = async () => {
        const r = await verifyModuleSync();
        setReport(r);
    };

    useEffect(() => { check(); }, []);

    const handleSync = async () => {
        setSyncing(true);
        await moduleInitializationService.initializeModuleSync();
        await check();
        setSyncing(false);
    };

    if (!report) return null;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">System Modules</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-2xl font-bold">{report.totalDefined}</div>
                        <p className="text-xs text-muted-foreground">
                            {report.status === 'ok' ? 'All modules synced' : `${report.missingInDb.length} missing in DB`}
                        </p>
                    </div>
                    {report.status === 'ok' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">Synced</Badge>
                    ) : (
                        <Button size="icon" variant="ghost" onClick={handleSync} disabled={syncing}>
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ModuleSyncStatus;
