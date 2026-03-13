import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { CalendarCheck } from 'lucide-react';

const ExamAttendance = ({ exam, onClose }) => {
    return (
        <div className="py-8 text-center space-y-4">
            <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Exam Attendance</h3>
            <p className="text-sm text-muted-foreground">
                This feature is being migrated to the new examination module.
            </p>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
        </div>
    );
};

export default ExamAttendance;
