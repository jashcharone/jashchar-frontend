import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const SendEmail = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Send Email</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <Construction className="h-16 w-16 text-yellow-500 mb-4" />
          <p className="text-lg font-semibold">This feature is under construction.</p>
          <p className="text-muted-foreground">We're working hard to bring you a full-featured email sending tool. Stay tuned!</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default SendEmail;
