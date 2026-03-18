import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConcessionRequests = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Concession Requests</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Review and approve fee concession requests from students and parents</p>
          </div>
          <Button><Plus className="w-4 h-4 mr-2" /> New Concession</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Concession Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Concession Requests</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                Fee concession requests from parents and students will appear here for review and approval.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ConcessionRequests;
