import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';

const EnvSetupGuide = ({ errors }) => {
  return (
    <div className="bg-card p-4 rounded-lg border border-border text-sm text-foreground space-y-4 shadow-sm">
      <div className="flex items-center gap-2 text-destructive font-bold">
        <AlertTriangle className="h-5 w-5" />
        <h3>Configuration Required</h3>
      </div>
      
      {errors && errors.length > 0 && (
        <div className="bg-destructive/10 p-3 rounded border border-destructive/20">
          <p className="font-semibold mb-1">Missing Variables:</p>
          <ul className="list-disc list-inside space-y-1 text-destructive">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="font-medium mb-2">How to fix:</p>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Locate the <code className="bg-muted px-1 py-0.5 rounded">.env</code> file in your project root.</li>
          <li>Add the required keys from your Supabase dashboard.</li>
          <li>Keys must start with <code className="bg-muted px-1 py-0.5 rounded">VITE_</code> to be visible.</li>
        </ol>
      </div>
    </div>
  );
};

export default EnvSetupGuide;
