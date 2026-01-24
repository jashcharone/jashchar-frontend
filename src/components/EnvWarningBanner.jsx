import React from 'react';
import { useEnvStatus } from '@/contexts/EnvStatusContext';
import { AlertOctagon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { maskEnvValue } from '@/utils/envLogger';
import EnvSetupGuide from './EnvSetupGuide';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const EnvWarningBanner = () => {
  const { envLoaded, errors, config } = useEnvStatus();

  // Hide banner in production builds so static sites don't show setup prompts
  if (envLoaded || import.meta.env.PROD) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive/95 text-destructive-foreground backdrop-blur-sm px-4 py-3 shadow-lg flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left animate-in slide-in-from-top duration-500">
      <div className="bg-background/20 p-2 rounded-full shrink-0">
        <AlertOctagon className="h-6 w-6" />
      </div>
      <div className="flex-1 max-w-3xl">
        <h3 className="font-bold text-lg">System setup incomplete</h3>
        <p className="text-sm opacity-90">Database connection keys are missing. The application is running in safe read-only mode.</p>
      </div>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm" className="shrink-0 gap-2 font-semibold">
            <Settings className="h-4 w-4" />
            Configure Now
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Environment Setup</DialogTitle>
          </DialogHeader>
          <EnvSetupGuide errors={errors} />
          <div className="bg-muted p-3 rounded text-xs font-mono break-all mt-4">
            <p className="text-muted-foreground mb-1">Current Config:</p>
            <div className="space-y-1">
              <p>URL: {maskEnvValue(config?.url)}</p>
              <p>KEY: {maskEnvValue(config?.key)}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnvWarningBanner;
