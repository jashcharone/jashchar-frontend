import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingFallback;
