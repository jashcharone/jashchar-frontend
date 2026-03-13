import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { ClipboardEdit } from 'lucide-react';

const EnterMarks = ({ exam, onClose }) => {
    return (
        <div className="py-8 text-center space-y-4">
            <ClipboardEdit className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Enter Marks</h3>
            <p className="text-sm text-muted-foreground">
                This feature is being migrated to the new examination module.
            </p>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
        </div>
    );
};

export default EnterMarks;
