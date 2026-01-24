import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Play, Trash2, Terminal, CheckCircle2, XCircle, Loader2, AlertTriangle, Clock, CheckCircle, Copy, ExternalLink, LogIn } from 'lucide-react';
import { runDemoAutomation } from '@/utils/demoAutomationEngine';
import { purgeDemoData } from '@/utils/demoPurgeEngine';
import { DemoLogger } from '@/utils/demoLogger';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from '@/lib/customSupabaseClient';

// Module mapping for automation phases
const MODULE_PHASE_MAP = {
  'academics': [3], // Phase 3: Academic & HR
  'human_resource': [3], // Phase 3: Academic & HR
  'student_information': [4], // Phase 4: Student Enrollment
  'fees_collection': [5], // Phase 5: Fees & Finance
  'library': [6], // Phase 6: Library & Inventory
  'inventory': [6], // Phase 6: Library & Inventory
  'hostel': [7], // Phase 7: Hostel
  'transport': [8], // Phase 8: Transport
};

const DemoAutomationV2 = () => {
  const [status, setStatus] = useState('idle'); // idle, running, complete, error
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [scenario, setScenario] = useState('standard');
  const [phases, setPhases] = useState([]);
  const [verificationResults, setVerificationResults] = useState(null);
  const [schoolCredentials, setSchoolCredentials] = useState(null);
  const [availableModules, setAvailableModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const logEndRef = useRef(null);

  // Load available modules from module_registry (centralized source)
  useEffect(() => {
    const loadModules = async () => {
      try {
        const { data, error } = await supabase
          .from('module_registry')
          .select('slug, name, category')
          .eq('is_active', true)
          .order('category')
          .order('name');
        
        if (error) throw error;
        
        // Filter to only modules that have automation phases
        const automatableModules = (data || []).filter(m => 
          MODULE_PHASE_MAP[m.slug] || MODULE_PHASE_MAP[m.name?.toLowerCase()]
        );
        
        setAvailableModules(automatableModules);
        
        // Select all by default
        setSelectedModules(automatableModules.map(m => m.slug));
        setLoadingModules(false);
      } catch (error) {
        console.error('Failed to load modules:', error);
        // Fallback to hardcoded modules
        const fallbackModules = [
          { id: 'academics', name: 'Academics', slug: 'academics', category: 'academics' },
          { id: 'human_resource', name: 'Human Resource', slug: 'human_resource', category: 'administration' },
          { id: 'student_information', name: 'Student Information', slug: 'student_information', category: 'core' },
          { id: 'fees_collection', name: 'Fees Collection', slug: 'fees_collection', category: 'finance' },
          { id: 'library', name: 'Library', slug: 'library', category: 'academics' },
          { id: 'inventory', name: 'Inventory', slug: 'inventory', category: 'administration' },
          { id: 'hostel', name: 'Hostel', slug: 'hostel', category: 'administration' },
          { id: 'transport', name: 'Transport', slug: 'transport', category: 'administration' },
        ];
        setAvailableModules(fallbackModules);
        setSelectedModules(fallbackModules.map(m => m.slug));
        setLoadingModules(false);
      }
    };
    
    loadModules();
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleStart = async () => {
    console.log('ðŸš€ Starting Demo Automation...', { scenario });
    try {
      setVerificationResults(null);
      setSchoolCredentials(null);
      setPhases([]);
      setLogs([]);
      setProgress(0);
      setStatus('running');
      
      console.log('ðŸ“ž Calling runDemoAutomation...');
      await runDemoAutomation(
        setLogs, 
        setProgress, 
        setStatus, 
        scenario,
        setPhases,
        setVerificationResults,
        setSchoolCredentials,
        selectedModules // Pass selected modules
      );
      console.log('✅ runDemoAutomation completed');
    } catch (error) {
      console.error('❌ Automation Error:', error);
      setStatus('error');
      setLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        message: `❌ Fatal Error: ${error.message}`,
        type: 'error'
      }]);
    }
  };

  const handlePurge = async () => {
    const confirm = window.confirm("Are you sure you want to PURGE all demo data? This action is irreversible for demo schools.");
    if (!confirm) return;

    setStatus('running');
    setLogs([]);
    setProgress(0);
    
    const logger = new DemoLogger(setLogs);
    const success = await purgeDemoData(logger);
    
    setStatus(success ? 'idle' : 'error');
    setProgress(success ? 100 : 0);
  };

  const handleCopyLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    // Optional: You could use a toast notification here instead of alert
    alert("Logs copied to clipboard!");
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Terminal className="h-8 w-8 text-primary" />
              Demo Automation Engine V2
            </h1>
            <p className="text-muted-foreground mt-1">
              Full-stack frontend-driven data generator for Jashchar ERP. <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-2">Headless Simulation Mode</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1 italic">
              Note: This engine runs in the background via API for speed. It does not visually fill forms on screen.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Select value={scenario} onValueChange={setScenario} disabled={status === 'running'}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Scenario" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="standard">Standard High School</SelectItem>
                    <SelectItem value="primary">Primary School</SelectItem>
                    <SelectItem value="coaching">Coaching Center</SelectItem>
                </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                const allSelected = availableModules.length === selectedModules.length;
                setSelectedModules(allSelected ? [] : availableModules.map(m => m.slug));
              }}
              disabled={status === 'running' || loadingModules}
            >
              {availableModules.length === selectedModules.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handlePurge}
              disabled={status === 'running'}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Purge Demo Data
            </Button>
            <Button 
              onClick={handleStart} 
              disabled={status === 'running'}
              className="bg-green-600 hover:bg-green-700"
            >
              {status === 'running' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Run Full Setup
            </Button>
          </div>
        </div>

        {/* Phase Progress */}
        {phases.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Phase Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {phases.map((phase) => (
                  <div key={phase.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0">
                      {phase.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {phase.status === 'running' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                      {phase.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                      {phase.status === 'pending' && <Clock className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{phase.name}</div>
                    </div>
                    <Badge variant={phase.status === 'completed' ? 'default' : phase.status === 'running' ? 'secondary' : 'outline'}>
                      {phase.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Summary */}
        {status === 'complete' && verificationResults && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-800">Automation Completed Successfully!</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Students:</span> {verificationResults.students}
                </div>
                <div>
                  <span className="font-semibold">Staff:</span> {verificationResults.staff}
                </div>
                <div>
                  <span className="font-semibold">Classes:</span> {verificationResults.classes}
                </div>
                <div>
                  <span className="font-semibold">Subjects:</span> {verificationResults.subjects}
                </div>
                <div>
                  <span className="font-semibold">Fee Masters:</span> {verificationResults.fees}
                </div>
                <div>
                  <span className="font-semibold">Attendance Records:</span> {verificationResults.attendance}
                </div>
              </div>
              {schoolCredentials && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm mb-2 text-green-800">School Owner Credentials:</div>
                      <div className="text-xs space-y-1 font-mono text-gray-700">
                        <div><span className="font-semibold">Email:</span> {schoolCredentials.email}</div>
                        <div><span className="font-semibold">Password:</span> {schoolCredentials.password}</div>
                        <div><span className="font-semibold">School:</span> {schoolCredentials.schoolName}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(`Email: ${schoolCredentials.email}\nPassword: ${schoolCredentials.password}`);
                          alert("Credentials copied!");
                        }}
                      >
                        <Copy className="mr-2 h-3 w-3" /> Copy
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.open('/login', '_blank')}
                      >
                        <LogIn className="mr-2 h-3 w-3" /> Login & Explore
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Module Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Modules to Test</CardTitle>
            <CardDescription>
              Choose which modules to populate with demo data. Core modules (School, Subscription) are always included.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingModules ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading modules...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableModules.map((module) => {
                  const isSelected = selectedModules.includes(module.slug);
                  return (
                    <div
                      key={module.id}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => {
                        if (status === 'running') return;
                        if (isSelected) {
                          setSelectedModules(prev => prev.filter(s => s !== module.slug));
                        } else {
                          setSelectedModules(prev => [...prev, module.slug]);
                        }
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (status === 'running') return;
                          if (checked) {
                            setSelectedModules(prev => [...prev, module.slug]);
                          } else {
                            setSelectedModules(prev => prev.filter(s => s !== module.slug));
                          }
                        }}
                        disabled={status === 'running'}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{module.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{module.category}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedModules.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">
                  Selected: {selectedModules.length} of {availableModules.length} modules
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedModules.map(slug => {
                    const mod = availableModules.find(m => m.slug === slug);
                    return mod?.name;
                  }).filter(Boolean).join(', ')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Engine Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {status === 'idle' && <Badge variant="secondary">IDLE</Badge>}
                {status === 'running' && <Badge className="bg-blue-500 animate-pulse">RUNNING</Badge>}
                {status === 'complete' && <Badge className="bg-green-500">COMPLETE</Badge>}
                {status === 'error' && <Badge variant="destructive">ERROR</Badge>}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Safety Lock</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Active (Sandboxed)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Console */}
        <Card className="bg-black border-slate-800">
          <CardHeader className="border-b border-slate-800 bg-slate-900/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-slate-200 font-mono text-sm">Execution Logs</CardTitle>
              <div className="flex gap-2 items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={handleCopyLogs}
                  disabled={logs.length === 0}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] overflow-y-auto p-4 font-mono text-sm space-y-1">
              {logs.length === 0 && <div className="text-slate-600 italic">Ready to initialize...</div>}
              {logs.map((log, idx) => (
                <div key={idx} className={`flex gap-3 ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-green-400' : 
                  log.type === 'warning' ? 'text-yellow-400' : 'text-slate-300'
                }`}>
                  <span className="opacity-40 min-w-[80px]">{log.timestamp}</span>
                  <span>{log.message}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DemoAutomationV2;
