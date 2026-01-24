import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DiagnosticReport from './DiagnosticReport';
import { copyDiagnosticToClipboard } from '@/utils/diagnosticLogger';
import { Copy } from 'lucide-react';

const DiagnosticModal = ({ isOpen, onClose, diagnosticResult }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connection Diagnostics</DialogTitle>
          <DialogDescription>
            Technical details about the current connection status.
          </DialogDescription>
        </DialogHeader>
        
        <DiagnosticReport diagnosticResult={diagnosticResult} />

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" size="sm" onClick={copyDiagnosticToClipboard}>
            <Copy className="h-4 w-4 mr-2" /> Copy Report
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiagnosticModal;
