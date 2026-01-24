import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
    Play, Pause, Square, Copy, AlertTriangle, CheckCircle2, 
    XCircle, Loader2, ChevronDown, ChevronUp, Terminal, Bug
} from 'lucide-react';
import { automationEngine } from '@/utils/demoAutomationEngine';
import { cn } from '@/lib/utils';

const DemoAutomationDialog = () => {
    const [state, setState] = useState(automationEngine.state);
    const [isMinimized, setIsMinimized] = useState(false);
    const logEndRef = useRef(null);

    useEffect(() => {
        // Subscribe to engine updates
        const unsubscribe = automationEngine.subscribe(setState);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [state.logs]);

    const handleStart = () => automationEngine.start();
    const handlePause = () => automationEngine.pause();
    const handleResume = () => automationEngine.resume();
    const handleStop = () => automationEngine.stop();
    const handleCopyPrompt = () => {
        if (state.fixPrompt) {
            navigator.clipboard.writeText(state.fixPrompt);
            alert('Fix Prompt copied to clipboard!');
        }
    };

    // Only show if active or running or has logs (triggered from DemoAutomationV2 page originally)
    // For this specific requirement, we'll always show it floating if there is ANY activity or if explicitly opened.
    // Or purely based on state. Let's show it always for Master Admin context if we could check context, 
    // but for now, we'll let it be present but minimized if idle.
    if (state.status === 'idle' && state.logs.length === 0) return null;

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-50 transition-all duration-300 shadow-2xl",
            isMinimized ? "w-64" : "w-[450px]"
        )}>
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                {/* Header */}
                <CardHeader className="p-3 bg-slate-100 dark:bg-slate-900 border-b flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full animate-pulse", 
                            state.status === 'running' ? 'bg-green-500' : 
                            state.status === 'error' ? 'bg-red-500' : 'bg-slate-400'
                        )} />
                        <CardTitle className="text-sm font-bold">Auto-Tester Bot</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(!isMinimized)}>
                            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardHeader>

                {!isMinimized && (
                    <>
                        <CardContent className="p-4 space-y-4">
                            {/* Progress */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Progress</span>
                                    <span>{Math.round(state.progress)}%</span>
                                </div>
                                <Progress value={state.progress} className="h-2" />
                            </div>

                            {/* Status & Timer */}
                            <div className="flex justify-between items-center">
                                <Badge variant={state.status === 'error' ? 'destructive' : 'outline'}>
                                    {state.status.toUpperCase()}
                                </Badge>
                                <span className="text-xs font-mono text-muted-foreground">
                                    {new Date(state.elapsedTime * 1000).toISOString().substr(11, 8)}
                                </span>
                            </div>

                            {/* Phases */}
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                {state.phases.map((phase) => (
                                    <div key={phase.id} className="flex items-center justify-between text-xs">
                                        <span className={cn(
                                            "flex items-center gap-2",
                                            state.currentPhase === phase.id ? "font-bold text-primary" : "text-muted-foreground"
                                        )}>
                                            {phase.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                            {phase.status === 'failed' && <XCircle className="h-3 w-3 text-red-500" />}
                                            {phase.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                                            {phase.status === 'pending' && <div className="h-3 w-3 rounded-full border" />}
                                            {phase.name}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Logs Preview */}
                            <div className="bg-slate-950 text-slate-200 p-2 rounded-md font-mono text-[10px] h-24 overflow-y-auto">
                                {state.logs.map((log, i) => (
                                    <div key={i} className={cn(
                                        "truncate",
                                        log.type === 'error' && "text-red-400",
                                        log.type === 'success' && "text-green-400"
                                    )}>
                                        <span className="opacity-50 mr-2">[{log.timestamp}]</span>
                                        {log.message}
                                    </div>
                                ))}
                                <div ref={logEndRef} />
                            </div>

                            {/* Error Section */}
                            {state.status === 'error' && (
                                <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 dark:border-red-900 space-y-2">
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs">
                                        <Bug className="h-4 w-4" />
                                        <span>Automation Halted</span>
                                    </div>
                                    <p className="text-[10px] text-red-600/80 dark:text-red-400/80 break-all">
                                        {state.error}
                                    </p>
                                    <Button size="sm" variant="destructive" className="w-full h-7 text-xs" onClick={handleCopyPrompt}>
                                        <Copy className="h-3 w-3 mr-2" />
                                        Copy Auto-Fix Prompt
                                    </Button>
                                </div>
                            )}
                        </CardContent>

                        <Separator />

                        <CardFooter className="p-3 flex justify-between">
                            {state.status === 'error' ? (
                                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={handleResume}>
                                    Resume Automation
                                </Button>
                            ) : (
                                <>
                                    {state.status === 'running' ? (
                                        <Button size="sm" variant="outline" onClick={handlePause}>
                                            <Pause className="h-4 w-4 mr-1" /> Pause
                                        </Button>
                                    ) : (
                                        <Button size="sm" onClick={handleResume} disabled={state.status === 'complete'}>
                                            <Play className="h-4 w-4 mr-1" /> Resume
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={handleStop}>
                                        <Square className="h-4 w-4 fill-current" />
                                    </Button>
                                </>
                            )}
                        </CardFooter>
                    </>
                )}
            </Card>
        </div>
    );
};

export default DemoAutomationDialog;
