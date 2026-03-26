import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';

const DeleteBranchModal = ({ open, onOpenChange, branch, onConfirm, loading }) => {
  const [confirmText, setConfirmText] = useState('');
  
  const branchName = branch?.name || branch?.branch_name || '';
  const isConfirmValid = confirmText === branchName;

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm(branch.id);
      setConfirmText('');
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Branch
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              This action <strong>cannot be undone</strong>. This will permanently delete the branch
              <strong className="text-foreground"> "{branchName}"</strong> and all associated data including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>All students assigned to this branch</li>
              <li>All staff members and principals</li>
              <li>All academic records (classes, sections, timetables)</li>
              <li>All fee records and transactions</li>
              <li>All attendance records</li>
            </ul>
            <div className="pt-2 space-y-2">
              <Label htmlFor="confirm-delete" className="text-sm font-medium">
                Type <strong>"{branchName}"</strong> to confirm deletion:
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Enter branch name"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmValid || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Branch
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteBranchModal;
