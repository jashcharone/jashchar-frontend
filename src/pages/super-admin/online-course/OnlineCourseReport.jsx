import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import StudentCoursePurchaseReport from '@/components/online-course/reports/StudentCoursePurchaseReport';
import CourseSellCountReport from '@/components/online-course/reports/CourseSellCountReport';
import CourseTrendingReport from '@/components/online-course/reports/CourseTrendingReport';
import CourseCompleteReport from '@/components/online-course/reports/CourseCompleteReport';
import CourseRatingReport from '@/components/online-course/reports/CourseRatingReport';
import GuestReport from '@/components/online-course/reports/GuestReport';

const OnlineCourseReport = () => {
  const { user } = useAuth();
  const branchId = user?.user_metadata?.branch_id;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-4">Online Course Report</h1>
        
        <Tabs defaultValue="purchase" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-transparent justify-start mb-4 p-0">
            <TabsTrigger value="purchase" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-4 py-2 rounded-md bg-white">Student Course Purchase Report</TabsTrigger>
            <TabsTrigger value="sell_count" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-4 py-2 rounded-md bg-white">Course Sell Count Report</TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-4 py-2 rounded-md bg-white">Course Trending Report</TabsTrigger>
            <TabsTrigger value="complete" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-4 py-2 rounded-md bg-white">Course Complete Report</TabsTrigger>
            <TabsTrigger value="rating" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-4 py-2 rounded-md bg-white">Course Rating Report</TabsTrigger>
            <TabsTrigger value="guest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-4 py-2 rounded-md bg-white">Guest Report</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="purchase"><StudentCoursePurchaseReport branchId={branchId} /></TabsContent>
            <TabsContent value="sell_count"><CourseSellCountReport branchId={branchId} /></TabsContent>
            <TabsContent value="trending"><CourseTrendingReport branchId={branchId} /></TabsContent>
            <TabsContent value="complete"><CourseCompleteReport branchId={branchId} /></TabsContent>
            <TabsContent value="rating"><CourseRatingReport branchId={branchId} /></TabsContent>
            <TabsContent value="guest"><GuestReport branchId={branchId} /></TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default OnlineCourseReport;
