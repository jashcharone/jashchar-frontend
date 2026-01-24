import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BookList = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Book List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
            ✅ This module is now active and registered in the system.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookList;
