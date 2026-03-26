import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BackupRestore = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup Restore</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800">
            ? This module is now active and registered in the system.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRestore;
