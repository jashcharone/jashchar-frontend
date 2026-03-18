import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FeeCalendar = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Calendar</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Visual calendar view of fee collection dates, due dates, and payment milestones</p>
          </div>
          <Button><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Fee Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Fee Events Scheduled</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                Create a visual calendar with fee collection dates, due dates, penalty start dates, and discount deadlines.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FeeCalendar;
