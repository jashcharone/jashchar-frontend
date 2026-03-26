import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Incidents = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Behaviour Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
              ? This module is now active and registered in the system.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Incidents;
