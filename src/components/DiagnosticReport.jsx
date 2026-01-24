import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';

const DiagnosticReport = ({ diagnosticResult }) => {
  if (!diagnosticResult) return null;

  const { status, classification, details, recommendation, latency, warnings } = diagnosticResult;

  const getStatusColor = (s) => {
    if (s === 'HEALTHY') return 'text-green-500';
    if (s === 'HEALTHY_WITH_WARNINGS') return 'text-yellow-500';
    if (s === 'NETWORK_FAIL') return 'text-red-500';
    return 'text-orange-500';
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold flex items-center gap-2">
                <Activity className="h-4 w-4" /> System Diagnostic
            </h3>
            <span className={`font-mono font-bold ${getStatusColor(status)}`}>
                {status}
            </span>
        </div>

        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Latency:</span>
                <span>{latency ? `${latency}ms` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Error Type:</span>
                <span>{classification?.errorType || 'None'}</span>
            </div>
            <div className="bg-muted/50 p-2 rounded">
                <p className="font-semibold mb-1 text-xs uppercase text-muted-foreground">Details</p>
                <p className="font-mono text-xs">{details || 'No details available'}</p>
            </div>
            
            {warnings && warnings.length > 0 && (
                <div className="bg-yellow-500/10 text-yellow-600 p-2 rounded text-xs">
                    <strong>Warnings:</strong>
                    <ul className="list-disc list-inside">
                        {warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}

            {recommendation && (
                <div className="flex items-start gap-2 text-blue-500 bg-blue-500/10 p-2 rounded">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{recommendation}</span>
                </div>
            )}
        </div>
    </div>
  );
};

export default DiagnosticReport;
