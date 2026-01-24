import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';

const PlaceholderPage = ({ title }) => {
  const { toast } = useToast();

  React.useEffect(() => {
    toast({
      title: "ðŸš§ Under Construction ðŸš§",
      description: "This feature isn't implemented yet”but stay tuned!",
      duration: 5000,
    });
  }, [toast]);

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-xl text-muted-foreground">This page is coming soon!</p>
      </div>
    </DashboardLayout>
  );
};

const ExpensePage = () => <PlaceholderPage title="Expense Management" />;

export default ExpensePage;
