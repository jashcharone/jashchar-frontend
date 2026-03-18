import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SiblingGroups = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sibling Groups</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage sibling relationships for fee discounts and concessions</p>
          </div>
          <Button><Plus className="w-4 h-4 mr-2" /> Add Sibling Group</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sibling Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Sibling Groups Configured</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                Link siblings together to automatically apply family discounts and manage combined fee statements.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SiblingGroups;
