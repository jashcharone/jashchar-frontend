import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FeeTemplates = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Templates</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage reusable fee templates for quick fee assignment</p>
          </div>
          <Button><Plus className="w-4 h-4 mr-2" /> Create Template</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fee Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Fee Templates Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                Fee templates allow you to create predefined fee structures that can be quickly applied to students or classes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FeeTemplates;
