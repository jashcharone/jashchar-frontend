import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LateFeesSlabs = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Late Fee Slabs</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Configure late fee penalties based on overdue duration</p>
          </div>
          <Button><Plus className="w-4 h-4 mr-2" /> Add Late Fee Slab</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Late Fee Slabs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Late Fee Slabs Configured</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                Define penalty slabs based on days overdue. E.g., 1-15 days: ₹50, 16-30 days: ₹100, etc.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LateFeesSlabs;
