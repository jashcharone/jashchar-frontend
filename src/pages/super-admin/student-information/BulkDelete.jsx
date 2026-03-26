import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Construction } from 'lucide-react';

const BulkDelete = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          Bulk Delete Students
        </h1>

        <Card className="p-10">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Construction className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-xl font-semibold">Coming Soon</p>
            <p className="text-sm mt-2 max-w-md text-center">
              Bulk student deletion with safety checks, confirmation workflows, and audit logging is under development.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BulkDelete;
