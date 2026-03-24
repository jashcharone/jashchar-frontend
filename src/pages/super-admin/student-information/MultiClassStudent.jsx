import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Construction, Users } from 'lucide-react';

const MultiClassStudent = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Multi Class Student
        </h1>

        <Card className="p-10">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Construction className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-xl font-semibold">Coming Soon</p>
            <p className="text-sm mt-2 max-w-md text-center">
              Assign students to multiple classes/sections simultaneously with proper session and branch isolation.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MultiClassStudent;
