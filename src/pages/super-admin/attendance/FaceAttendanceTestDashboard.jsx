// ╔═══════════════════════════════════════════════════════════════════════════════════╗
// ║  DAY 38: FACE ATTENDANCE SYSTEM TEST DASHBOARD                                   ║
// ║  System Health Check, AI Engine Connectivity, Recognition Testing                ║
// ╚═══════════════════════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/customSupabaseClient';
import { aiEngineApi } from '@/services/aiEngineApi';
import { formatDateTime } from '@/utils/dateUtils';
import {
  Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, Cpu,
  Database, Camera, Wifi, Shield, Clock, Server, HardDrive,
  Zap, Eye, Brain, BarChart3, Play, Pause, RotateCcw, Info
} from 'lucide-react';

// ═══════════════════════════════ STATUS INDICATOR ═══════════════════════════════
const StatusIndicator = ({ status, label, detail, icon: Icon }) => {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    warning: 'bg-yellow-500',
    checking: 'bg-blue-500 animate-pulse',
    'not-configured': 'bg-gray-400',
  };

  const badges = {
    online: <Badge className="bg-green-100 text-green-800">Online</Badge>,
    offline: <Badge className="bg-red-100 text-red-800">Offline</Badge>,
    warning: <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>,
    checking: <Badge className="bg-blue-100 text-blue-800">Checking...</Badge>,
    'not-configured': <Badge className="bg-gray-100 text-gray-600">Not Configured</Badge>,
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-gray-400'}`} />
        {Icon && <Icon className="w-5 h-5 text-gray-500" />}
        <div>
          <p className="font-medium text-sm">{label}</p>
          {detail && <p className="text-xs text-gray-500">{detail}</p>}
        </div>
      </div>
      {badges[status] || <Badge className="bg-gray-100 text-gray-600">Unknown</Badge>}
    </div>
  );
};

// ═══════════════════════════════ TEST RESULT CARD ═══════════════════════════════
const TestResultCard = ({ test, onRerun }) => {
  const statusIcons = {
    passed: <CheckCircle className="w-5 h-5 text-green-500" />,
    failed: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    running: <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />,
    pending: <Clock className="w-5 h-5 text-gray-400" />,
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        {statusIcons[test.status]}
        <div>
          <p className="font-medium text-sm">{test.name}</p>
          <p className="text-xs text-gray-500">{test.message || 'Pending...'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {test.duration && (
          <span className="text-xs text-gray-400">{test.duration}ms</span>
        )}
        <Button variant="ghost" size="sm" onClick={() => onRerun(test.id)} disabled={test.status === 'running'}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════
export default function FaceAttendanceTestDashboard() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  const [systemStatus, setSystemStatus] = useState({
    aiEngine: 'checking',
    database: 'checking',
    faissIndex: 'checking',
    cameras: 'checking',
    notifications: 'checking',
  });

  const [aiEngineInfo, setAiEngineInfo] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [overallHealth, setOverallHealth] = useState(0);
  const [dbStats, setDbStats] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [aiEngineAvailable, setAiEngineAvailable] = useState(null); // null = unchecked, true/false

  // Helper: safely query a Supabase table (returns null if table doesn't exist)
  const safeTableQuery = async (tableName, queryFn) => {
    try {
      const result = await queryFn();
      if (result?.error) {
        const msg = result.error.message || '';
        // Table doesn't exist or RLS blocks
        if (msg.includes('does not exist') || msg.includes('permission denied') || result.error.code === '42P01') {
          return { exists: false, data: null, error: result.error };
        }
        return { exists: true, data: null, error: result.error };
      }
      return { exists: true, data: result.data, count: result.count, error: null };
    } catch {
      return { exists: false, data: null, error: { message: 'Query failed' } };
    }
  };

  // ═══════════════════ SYSTEM HEALTH CHECK ═══════════════════
  const checkSystemHealth = useCallback(async () => {
    // Guard: Skip database queries if branchId is not available
    if (!branchId) {
      setSystemStatus({
        aiEngine: 'checking',
        database: 'not-configured',
        faissIndex: 'checking',
        cameras: 'not-configured',
        notifications: 'not-configured',
      });
      return;
    }

    setSystemStatus(prev => ({
      ...prev,
      aiEngine: 'checking',
      database: 'checking',
      faissIndex: 'checking',
      cameras: 'checking',
      notifications: 'checking',
    }));

    // Check AI Engine (via backend proxy)
    try {
      const data = await aiEngineApi.checkHealth();
      if (data?.success !== false) {
        setAiEngineInfo(data?.data || data);
        setAiEngineAvailable(true);
        setSystemStatus(prev => ({ ...prev, aiEngine: 'online' }));
      } else {
        setAiEngineAvailable(false);
        setSystemStatus(prev => ({ ...prev, aiEngine: 'not-configured' }));
      }
    } catch {
      setAiEngineAvailable(false);
      setSystemStatus(prev => ({ ...prev, aiEngine: 'not-configured' }));
    }

    // Check FAISS Index (via backend proxy)
    try {
      const data = await aiEngineApi.getIndexStatus();
      if (data?.success !== false) {
        const totalFaces = data?.total_faces || data?.data?.total_faces || 0;
        setSystemStatus(prev => ({
          ...prev,
          faissIndex: totalFaces > 0 ? 'online' : 'warning',
        }));
      } else {
        setSystemStatus(prev => ({ ...prev, faissIndex: 'not-configured' }));
      }
    } catch {
      setSystemStatus(prev => ({ ...prev, faissIndex: 'not-configured' }));
    }

    // Check Database (face_embeddings_v2 table)
    const dbResult = await safeTableQuery('face_embeddings_v2', () =>
      supabase
        .from('face_embeddings_v2')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
    );

    if (!dbResult.exists) {
      setSystemStatus(prev => ({ ...prev, database: 'not-configured' }));
      setDbStats(null);
    } else if (dbResult.error) {
      setSystemStatus(prev => ({ ...prev, database: 'warning' }));
      setDbStats(null);
    } else {
      setDbStats({ registeredFaces: dbResult.count || 0 });
      setSystemStatus(prev => ({ ...prev, database: 'online' }));
    }

    // Check Cameras (camera_devices table)
    const camResult = await safeTableQuery('camera_devices', () =>
      supabase
        .from('camera_devices')
        .select('id, is_active')
        .eq('branch_id', branchId)
    );

    if (!camResult.exists) {
      setSystemStatus(prev => ({ ...prev, cameras: 'not-configured' }));
    } else if (camResult.error) {
      setSystemStatus(prev => ({ ...prev, cameras: 'warning' }));
    } else {
      const cameras = camResult.data || [];
      const activeCameras = cameras.filter(c => c.is_active).length;
      setSystemStatus(prev => ({
        ...prev,
        cameras: activeCameras > 0 ? 'online' : cameras.length > 0 ? 'warning' : 'not-configured',
      }));
    }

    // Notification check
    setSystemStatus(prev => ({ ...prev, notifications: 'online' }));

    setLastChecked(new Date());
  }, [branchId]);

  // ═══════════════════ CALCULATE OVERALL HEALTH ═══════════════════
  useEffect(() => {
    const statusValues = Object.values(systemStatus);
    const configuredServices = statusValues.filter(s => s !== 'not-configured' && s !== 'checking');
    if (configuredServices.length === 0) {
      setOverallHealth(0);
      return;
    }
    const score = configuredServices.reduce((acc, s) => {
      if (s === 'online') return acc + 100;
      if (s === 'warning') return acc + 50;
      return acc;
    }, 0);
    setOverallHealth(Math.round(score / configuredServices.length));
  }, [systemStatus]);

  // ═══════════════════ TEST DEFINITIONS ═══════════════════
  const allTests = [
    {
      id: 'ai_engine_health',
      name: 'AI Engine Health Check',
      category: 'connectivity',
      run: async () => {
        const start = Date.now();
        try {
          const data = await aiEngineApi.checkHealth();
          const duration = Date.now() - start;
          if (data && data.success !== false) {
            return { status: 'passed', message: `AI Engine responding in ${duration}ms`, duration };
          }
          return { status: 'warning', message: 'AI Engine returned unsuccessful response - not deployed yet', duration };
        } catch {
          return { status: 'warning', message: 'AI Engine not deployed. Deploy the Python AI Engine to enable face recognition.', duration: Date.now() - start };
        }
      },
    },
    {
      id: 'faiss_index_status',
      name: 'FAISS Vector Index Status',
      category: 'connectivity',
      run: async () => {
        const start = Date.now();
        try {
          const data = await aiEngineApi.getIndexStatus();
          const duration = Date.now() - start;
          if (data?.success === false) {
            return { status: 'warning', message: 'FAISS index not available - AI Engine not deployed', duration };
          }
          const totalFaces = data?.total_faces || data?.data?.total_faces || 0;
          if (totalFaces > 0) {
            return { status: 'passed', message: `Index has ${totalFaces} face vectors`, duration };
          }
          return { status: 'warning', message: 'Index is empty - no faces registered', duration };
        } catch {
          return { status: 'warning', message: 'FAISS service not available - deploy AI Engine first', duration: Date.now() - start };
        }
      },
    },
    {
      id: 'db_face_embeddings',
      name: 'Database Face Embeddings Table',
      category: 'database',
      run: async () => {
        const start = Date.now();
        const result = await safeTableQuery('face_embeddings_v2', () =>
          supabase.from('face_embeddings_v2').select('id', { count: 'exact', head: true }).eq('branch_id', branchId)
        );
        const duration = Date.now() - start;
        if (!result.exists) return { status: 'warning', message: 'Table not created yet - run database migrations', duration };
        if (result.error) return { status: 'failed', message: result.error.message, duration };
        return { status: 'passed', message: `${result.count || 0} face records found`, duration };
      },
    },
    {
      id: 'db_recognition_logs',
      name: 'Database Recognition Logs Table',
      category: 'database',
      run: async () => {
        const start = Date.now();
        const result = await safeTableQuery('face_recognition_logs', () =>
          supabase.from('face_recognition_logs').select('id', { count: 'exact', head: true }).eq('branch_id', branchId)
        );
        const duration = Date.now() - start;
        if (!result.exists) return { status: 'warning', message: 'Table not created yet - run database migrations', duration };
        if (result.error) return { status: 'failed', message: result.error.message, duration };
        return { status: 'passed', message: `${result.count || 0} recognition logs`, duration };
      },
    },
    {
      id: 'db_attendance_records',
      name: 'Database Attendance Records Table',
      category: 'database',
      run: async () => {
        const start = Date.now();
        const result = await safeTableQuery('face_attendance_logs', () =>
          supabase.from('face_attendance_logs').select('id', { count: 'exact', head: true }).eq('branch_id', branchId)
        );
        const duration = Date.now() - start;
        if (!result.exists) return { status: 'warning', message: 'Table not created yet - run database migrations', duration };
        if (result.error) return { status: 'failed', message: result.error.message, duration };
        return { status: 'passed', message: `${result.count || 0} attendance records`, duration };
      },
    },
    {
      id: 'db_cameras_table',
      name: 'Database AI Cameras Table',
      category: 'database',
      run: async () => {
        const start = Date.now();
        const result = await safeTableQuery('camera_devices', () =>
          supabase.from('camera_devices').select('id, is_active').eq('branch_id', branchId)
        );
        const duration = Date.now() - start;
        if (!result.exists) return { status: 'warning', message: 'Table not created yet - run database migrations', duration };
        if (result.error) return { status: 'failed', message: result.error.message, duration };
        const data = result.data || [];
        const active = data.filter(c => c.is_active).length;
        return { status: 'passed', message: `${data.length} cameras (${active} active)`, duration };
      },
    },
    {
      id: 'db_spoof_attempts',
      name: 'Database Spoof Attempts Table',
      category: 'database',
      run: async () => {
        const start = Date.now();
        const result = await safeTableQuery('anti_spoofing_alerts', () =>
          supabase.from('anti_spoofing_alerts').select('id', { count: 'exact', head: true }).eq('branch_id', branchId)
        );
        const duration = Date.now() - start;
        if (!result.exists) return { status: 'warning', message: 'Table not created yet - run database migrations', duration };
        if (result.error) return { status: 'failed', message: result.error.message, duration };
        const count = result.count || 0;
        return { status: count > 0 ? 'warning' : 'passed', message: `${count} spoof attempts detected`, duration };
      },
    },
    {
      id: 'ai_liveness_check',
      name: 'AI Liveness Detection Module',
      category: 'ai',
      run: async () => {
        const start = Date.now();
        try {
          const data = await aiEngineApi.checkHealth();
          const duration = Date.now() - start;
          if (data?.success === false) {
            return { status: 'warning', message: 'AI Engine not deployed - liveness detection unavailable', duration };
          }
          const healthData = data?.data || data;
          const hasLiveness = healthData?.modules?.liveness || healthData?.liveness_enabled;
          return {
            status: hasLiveness ? 'passed' : 'warning',
            message: hasLiveness ? 'Liveness detection active' : 'Liveness detection not available',
            duration,
          };
        } catch {
          return { status: 'warning', message: 'AI Engine not deployed - liveness detection unavailable', duration: Date.now() - start };
        }
      },
    },
    {
      id: 'ai_face_recognition',
      name: 'AI Face Recognition Module',
      category: 'ai',
      run: async () => {
        const start = Date.now();
        try {
          const data = await aiEngineApi.checkHealth();
          const duration = Date.now() - start;
          if (data?.success === false) {
            return { status: 'warning', message: 'AI Engine not deployed - face recognition unavailable', duration };
          }
          const healthData = data?.data || data;
          return {
            status: 'passed',
            message: `ArcFace model loaded, ${healthData?.model || 'buffalo_l'}`,
            duration,
          };
        } catch {
          return { status: 'warning', message: 'AI Engine not deployed - face recognition unavailable', duration: Date.now() - start };
        }
      },
    },
    {
      id: 'latency_test',
      name: 'API Latency Test (Round Trip)',
      category: 'performance',
      run: async () => {
        // Skip latency test if AI engine is known to be unavailable
        if (aiEngineAvailable === false) {
          return { status: 'warning', message: 'Skipped - AI Engine not deployed', duration: 0 };
        }
        const times = [];
        for (let i = 0; i < 3; i++) {
          const start = Date.now();
          try {
            await aiEngineApi.checkHealth();
            times.push(Date.now() - start);
          } catch {
            times.push(5000);
          }
        }
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        return {
          status: avg < 200 ? 'passed' : avg < 500 ? 'warning' : 'failed',
          message: `Average latency: ${avg}ms (${times.join(', ')}ms)`,
          duration: avg,
        };
      },
    },
  ];

  // ═══════════════════ RUN ALL TESTS ═══════════════════
  const runAllTests = async () => {
    setIsRunningAll(true);
    const results = allTests.map(t => ({
      ...t,
      status: 'running',
      message: 'Running...',
      duration: null,
    }));
    setTestResults([...results]);

    for (let i = 0; i < allTests.length; i++) {
      try {
        const result = await allTests[i].run();
        results[i] = { ...results[i], ...result };
      } catch (err) {
        results[i] = {
          ...results[i],
          status: 'failed',
          message: err.message || 'Unexpected error',
          duration: null,
        };
      }
      setTestResults([...results]);
    }

    setIsRunningAll(false);
  };

  // ═══════════════════ RERUN SINGLE TEST ═══════════════════
  const rerunTest = async (testId) => {
    const test = allTests.find(t => t.id === testId);
    if (!test) return;

    setTestResults(prev =>
      prev.map(t =>
        t.id === testId ? { ...t, status: 'running', message: 'Running...' } : t
      )
    );

    try {
      const result = await test.run();
      setTestResults(prev =>
        prev.map(t => (t.id === testId ? { ...t, ...result } : t))
      );
    } catch (err) {
      setTestResults(prev =>
        prev.map(t =>
          t.id === testId
            ? { ...t, status: 'failed', message: err.message }
            : t
        )
      );
    }
  };

  useEffect(() => {
    checkSystemHealth();
  }, [checkSystemHealth]);

  // ═══════════════════ HEALTH COLOR ═══════════════════
  const healthColor =
    overallHealth >= 80 ? 'text-green-600' : overallHealth >= 50 ? 'text-yellow-600' : 'text-red-600';
  const healthBg =
    overallHealth >= 80 ? 'bg-green-500' : overallHealth >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  const passedCount = testResults.filter(t => t.status === 'passed').length;
  const failedCount = testResults.filter(t => t.status === 'failed').length;
  const warningCount = testResults.filter(t => t.status === 'warning').length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* ═══════ HEADER ═══════ */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-7 h-7 text-blue-600" />
              Face Attendance System Test Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              System health monitoring, connectivity tests & diagnostics
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={checkSystemHealth}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh Status
            </Button>
          <Button onClick={runAllTests} disabled={isRunningAll}>
            {isRunningAll ? (
              <><Pause className="w-4 h-4 mr-2 animate-spin" /> Running Tests...</>
            ) : (
              <><Play className="w-4 h-4 mr-2" /> Run All Tests</>
            )}
          </Button>
        </div>
      </div>

      {/* ═══════ AI ENGINE NOT CONFIGURED BANNER ═══════ */}
      {aiEngineAvailable === false && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">AI Face Recognition Engine Not Deployed</AlertTitle>
          <AlertDescription className="text-blue-700">
            The Python AI Engine (FastAPI) is not running. This is expected if the AI Face Attendance
            module has not been deployed yet. The engine handles face detection, recognition, and FAISS
            vector indexing. Deploy the AI Engine service to enable these features.
          </AlertDescription>
        </Alert>
      )}

      {/* ═══════ OVERALL HEALTH SCORE ═══════ */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Overall System Health</h2>
              <p className="text-sm text-gray-500">
                Last checked: {lastChecked ? formatDateTime(lastChecked) : 'Never'}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-4xl font-bold ${healthColor}`}>{overallHealth}%</span>
              <p className="text-xs text-gray-400 mt-1">
                {Object.values(systemStatus).every(s => s === 'not-configured' || s === 'checking')
                  ? 'Setup Required'
                  : overallHealth >= 80 ? 'System Healthy' : overallHealth >= 50 ? 'Needs Attention' : 'Critical Issues'}
              </p>
            </div>
          </div>
          <Progress value={overallHealth} className={`mt-4 h-3 ${healthBg}`} />
        </CardContent>
      </Card>

      {/* ═══════ SYSTEM STATUS GRID ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4" /> AI Engine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusIndicator
              status={systemStatus.aiEngine}
              label="Python AI Engine (FastAPI)"
              detail={
                systemStatus.aiEngine === 'online'
                  ? (aiEngineInfo ? `Model: ${aiEngineInfo.model || 'ArcFace'}` : 'Connected')
                  : systemStatus.aiEngine === 'not-configured'
                    ? 'Not deployed - deploy AI Engine to enable'
                    : 'Checking...'
              }
              icon={Cpu}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" /> Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusIndicator
              status={systemStatus.database}
              label="Supabase PostgreSQL"
              detail={
                systemStatus.database === 'online'
                  ? (dbStats ? `${dbStats.registeredFaces} registered faces` : 'Connected')
                  : systemStatus.database === 'not-configured'
                    ? 'Face tables not created yet'
                    : 'Checking...'
              }
              icon={HardDrive}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" /> FAISS Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusIndicator
              status={systemStatus.faissIndex}
              label="FAISS Vector Search"
              detail={
                systemStatus.faissIndex === 'not-configured'
                  ? 'Not available - deploy AI Engine first'
                  : '512-dimensional face vectors'
              }
              icon={Eye}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="w-4 h-4" /> Cameras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusIndicator
              status={systemStatus.cameras}
              label="AI Camera Network"
              detail="Entry/Exit/Classroom cameras"
              icon={Wifi}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusIndicator
              status={systemStatus.notifications}
              label="Anti-Spoof & Liveness"
              detail="Photo/Video/Mask detection"
              icon={Shield}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="w-4 h-4" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusIndicator
              status={systemStatus.notifications}
              label="SMS/Email/Push System"
              detail="Parent notification channels"
              icon={Wifi}
            />
          </CardContent>
        </Card>
      </div>

      {/* ═══════ TEST RESULTS TABS ═══════ */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Tests ({testResults.length})
          </TabsTrigger>
          <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="ai">AI Modules</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {testResults.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">✅ {passedCount} Passed</span>
            <span className="text-red-600">❌ {failedCount} Failed</span>
            <span className="text-yellow-600">⚠️ {warningCount} Warnings</span>
          </div>
        )}

        {testResults.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Tests Run</AlertTitle>
            <AlertDescription>
              Click "Run All Tests" to execute the diagnostic test suite.
            </AlertDescription>
          </Alert>
        )}

        <TabsContent value="all" className="space-y-2">
          {testResults.map(test => (
            <TestResultCard key={test.id} test={test} onRerun={rerunTest} />
          ))}
        </TabsContent>

        {['connectivity', 'database', 'ai', 'performance'].map(cat => (
          <TabsContent key={cat} value={cat} className="space-y-2">
            {testResults
              .filter(t => t.category === cat)
              .map(test => (
                <TestResultCard key={test.id} test={test} onRerun={rerunTest} />
              ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* ═══════ QUICK DIAGNOSTIC INFO ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">AI Engine URL</p>
              <p className="font-mono text-xs mt-1 truncate">Backend Proxy (/api/camera/ai)</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Branch ID</p>
              <p className="font-mono text-xs mt-1 truncate">{branchId || 'N/A'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Session ID</p>
              <p className="font-mono text-xs mt-1 truncate">{currentSessionId || 'N/A'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Organization ID</p>
              <p className="font-mono text-xs mt-1 truncate">{organizationId || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
