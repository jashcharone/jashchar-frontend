import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from 'lucide-react';

const AddStudent = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Construction className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">Add Student - Coming Soon</h3>
          <p className="text-sm mt-1">This feature is under development</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddStudent;
