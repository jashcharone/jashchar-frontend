import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StudentTransportReport = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Transport Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md border border-green-200 dark:border-green-800">
            ✅ This module is now active and registered in the system.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTransportReport;
