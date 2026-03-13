import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { BookPlus } from 'lucide-react';

const AddExamSubjects = ({ exam, onClose }) => {
    return (
        <div className="py-8 text-center space-y-4">
            <BookPlus className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Add Exam Subjects</h3>
            <p className="text-sm text-muted-foreground">
                This feature is being migrated to the new examination module.
            </p>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
        </div>
    );
};

export default AddExamSubjects;
