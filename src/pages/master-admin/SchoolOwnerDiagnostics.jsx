import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Play, ShieldCheck, ShieldAlert, Download, 
  Activity, CheckCircle2, XCircle, StopCircle, AlertTriangle
} from 'lucide-react';
import { getScanQueue, calculateStats, validateModuleCount } from '@/utils/diagnosticsEngine';
import { ROUTE_COMPONENT_MAP } from '@/utils/diagnosticsMap';
import { RouteScanner } from '@/utils/diagnosticsScanner.jsx';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SchoolOwnerDiagnostics = () => {
  const [status, setStatus] = useState('idle'); // idle, scanning, complete, aborted
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, health: 0, statusColor: 'gray' });
  const [currentItem, setCurrentItem] = useState(null);
  const [deepScanMode, setDeepScanMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState('school_owner');
  const scrollRef = useRef(null);

  // Dynamically construct map to include self without circular dependency
  const LOCAL_COMPONENT_MAP = {
    ...ROUTE_COMPONENT_MAP,
    '/master-admin/school-owner-diagnostics': SchoolOwnerDiagnostics
  };

  // Initial Load & Validation
  useEffect(() => {
    loadQueue(selectedRole);
  }, [selectedRole]);

  const loadQueue = (role) => {
    try {
      setStatus('idle');
      setResults([]);
      setLogs([]);
      
      const validation = validateModuleCount(role);
      if (!validation.valid) {
        // Warn but don't abort completely, as Master Admin might have fewer modules mapped
        addLog(`WARNING: Only ${validation.count} modules detected for ${role}.`, 'warning');
      }

      const generatedQueue = getScanQueue(role);
      setQueue(generatedQueue);
      setStats({ total: generatedQueue.length, passed: 0, failed: 0, health: 0, statusColor: 'gray' });
      addLog(`System initialized for ${role}. Detected ${generatedQueue.length} scannable routes.`, 'info');
    } catch (err) {
      setStatus('aborted');
      addLog(err.message, 'error');
    }
  };

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Update stats when results change
  useEffect(() => {
    if (results.length > 0) {
      setStats(calculateStats(results));
    }
  }, [results]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const startScan = () => {
    if (status === 'aborted') return;
    setStatus('scanning');
    setResults([]);
    setCurrentIndex(0);
    setStats({ total: queue.length, passed: 0, failed: 0, health: 0, statusColor: 'gray' });
    addLog(`Starting comprehensive diagnostics scan (Deep Scan: ${deepScanMode ? 'ON' : 'OFF'})...`, 'info');
  };

  const stopScan = () => {
    setStatus('idle');
    setCurrentItem(null);
    addLog('Scan manually stopped.', 'warning');
  };

  // Scanner Logic Step
  useEffect(() => {
    if (status === 'scanning' && currentIndex < queue.length) {
      const item = queue[currentIndex];
      setCurrentItem(item);
      addLog(`Scanning: ${item.category} † ${item.name} (${item.path})`, 'info');
      
      // If component is missing in map, fail immediately
      if (!LOCAL_COMPONENT_MAP[item.path]) {
        handleScanResult({ status: 'FAIL', reason: 'Route component not found in registry map.' });
      }
      // Else, RouteScanner component will mount and trigger handleScanResult
    } else if (status === 'scanning' && currentIndex >= queue.length) {
      setStatus('complete');
      setCurrentItem(null);
      addLog('Diagnostic scan completed.', 'success');
    }
  }, [status, currentIndex, queue]);

  const handleScanResult = (result) => {
    const item = queue[currentIndex];
    const newResult = { ...item, ...result };
    
    setResults(prev => [...prev, newResult]);
    
    if (result.status === 'FAIL') {
      addLog(`FAILED: ${item.name} - ${result.reason}`, 'error');
    } else if (result.status === 'WARNING') {
      addLog(`WARNING: ${item.name} - ${result.reason}`, 'warning');
    } else {
      // Only log success if deep scan is on to reduce noise, or keep it minimal
      if (deepScanMode) addLog(`PASSED: ${item.name} (Deep Scan Verified)`, 'success');
    }

    // Move to next
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 100); // Small buffer
  };




  const downloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ stats, results, logs }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `diagnostics_report_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getProgressValue = () => {
    if (queue.length === 0) return 0;
    return Math.round((currentIndex / queue.length) * 100);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              System Diagnostics Engine
            </h1>
            <p className="text-muted-foreground mt-1">
              Live executable scan of all modules for the selected role.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Role Selector */}
            <div className="w-[200px]">
              <Select value={selectedRole} onValueChange={setSelectedRole} disabled={status === 'scanning'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school_owner">School Owner</SelectItem>
                  <SelectItem value="master_admin">Master Admin</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin (Staff)</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
                <input 
                    type="checkbox" 
                    id="deepScan" 
                    checked={deepScanMode} 
                    onChange={(e) => setDeepScanMode(e.target.checked)}
                    disabled={status === 'scanning'}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="deepScan" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Deep Scan
                </label>
            </div>
          </div>

          <div className="flex gap-3">
            {status === 'scanning' ? (
              <Button variant="destructive" onClick={stopScan}>
                <StopCircle className="mr-2 h-4 w-4" /> Stop Scan
              </Button>
            ) : (
              <Button onClick={startScan} disabled={status === 'aborted'}>
                <Play className="mr-2 h-4 w-4" /> Start Diagnostics
              </Button>
            )}
            <Button variant="outline" onClick={downloadReport} disabled={results.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>

        {/* Alert for Aborted State */}
        {status === 'aborted' && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Diagnostics Aborted</AlertTitle>
            <AlertDescription>
              The system failed the pre-flight integrity check. Less than 33 main modules were detected in the configuration. Please verify the sidebar registry.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Modules Detected</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{queue.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pass Count</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{stats.passed}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Fail Count</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{stats.failed}</div></CardContent>
          </Card>
          <Card className={stats.health > 80 ? "border-green-500 border-2" : stats.health > 50 ? "border-yellow-500 border-2" : "border-red-500 border-2"}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Health Score</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{stats.health}%</div>
                {stats.health === 100 && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress & Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          
          {/* Left: Logs & Progress */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle>Live Execution Log</CardTitle>
              <CardDescription>Real-time scanning events</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{getProgressValue()}%</span>
                </div>
                <Progress value={getProgressValue()} className="h-2" />
              </div>
              
              <div className="flex-1 bg-black rounded-lg p-4 font-mono text-xs text-green-400 overflow-y-auto" ref={scrollRef}>
                {logs.map((log, i) => (
                  <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-green-400'}`}>
                    <span className="opacity-50">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
                {status === 'idle' && logs.length === 0 && <div className="opacity-50">Ready to initialize...</div>}
              </div>
            </CardContent>
          </Card>

          {/* Right: Results Table */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle>Module Health Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground sticky top-0 z-10">
                    <tr>
                      <th className="p-4 font-medium">Module</th>
                      <th className="p-4 font-medium">Sub-Module</th>
                      <th className="p-4 font-medium">Path</th>
                      <th className="p-4 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map((res, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="p-4 font-medium">{res.category}</td>
                        <td className="p-4">{res.name}</td>
                        <td className="p-4 text-muted-foreground font-mono text-xs">{res.path}</td>
                        <td className="p-4 text-right">
                          {res.status === 'PASS' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">PASS</Badge>
                          ) : (
                            <Badge variant="destructive">FAIL</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Waiting for scan to start...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Hidden Scanner - The "Real" Engine */}
        {status === 'scanning' && currentItem && LOCAL_COMPONENT_MAP[currentItem.path] && (
          <RouteScanner 
            key={currentItem.path} // Force remount for each new path
            routePath={currentItem.path}
            Component={LOCAL_COMPONENT_MAP[currentItem.path]}
            onResult={handleScanResult}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default SchoolOwnerDiagnostics;
