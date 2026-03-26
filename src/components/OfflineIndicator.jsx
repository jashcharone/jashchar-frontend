import React, { useState } from 'react';
import { useRecovery } from '@/contexts/RecoveryContext';
import { WifiOff, RefreshCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DiagnosticModal from './DiagnosticModal';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineIndicator = () => {
  const { isReadOnly, diagnosticResult, forceRetry, initializing } = useRecovery();
  const [showDetails, setShowDetails] = useState(false);

  if (!isReadOnly && !initializing) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
            <div className="bg-background/80 backdrop-blur-md border border-destructive/50 shadow-lg text-foreground rounded-xl p-4 flex items-center gap-4 ring-1 ring-destructive/20">
                <div className="bg-destructive/10 p-2 rounded-full shrink-0">
                    <WifiOff className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-sm">System Offline</h4>
                    <p className="text-xs text-muted-foreground">
                        {initializing ? "Checking connection..." : "Read-only mode active. Changes won't save."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8" 
                        onClick={() => setShowDetails(true)}
                        title="Diagnostic Details"
                    >
                        <Info className="h-4 w-4" />
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={forceRetry} 
                        disabled={initializing}
                        className={initializing ? "animate-pulse" : ""}
                    >
                        <RefreshCcw className={`h-3 w-3 mr-2 ${initializing ? "animate-spin" : ""}`} />
                        Retry
                    </Button>
                </div>
            </div>
        </motion.div>
      </AnimatePresence>

      <DiagnosticModal 
        isOpen={showDetails} 
        onClose={() => setShowDetails(false)} 
        diagnosticResult={diagnosticResult} 
      />
    </>
  );
};

export default OfflineIndicator;
