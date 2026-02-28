import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock } from 'lucide-react';

const Timetable = () => {
  const navigate = useNavigate();
  const { roleSlug } = useParams();
  const basePath = roleSlug || 'super-admin';

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Timetable</h1>
          <p className="text-muted-foreground">Manage school timetables for classes and teachers</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="class">By Class</TabsTrigger>
            <TabsTrigger value="teacher">By Teacher</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timetable Overview
                </CardTitle>
                <CardDescription>
                  Quick access to manage all timetables. Use specific pages for detailed management:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/${basePath}/academics/class-timetable`)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Class Timetable</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Create and manage timetables for each class and section.
                        Assign subjects, teachers, and time slots.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/${basePath}/academics/teacher-timetable`)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Teacher Timetable</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        View and manage individual teacher schedules.
                        See workload distribution across the week.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="class">
            <Card>
              <CardHeader>
                <CardTitle>Class Timetables</CardTitle>
                <CardDescription>
                  View timetables organized by class. Click on a class to see detailed schedule.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Go to "Class Timetable" page for detailed class-wise timetable management.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teacher">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Timetables</CardTitle>
                <CardDescription>
                  View timetables organized by teacher. See each teacher's weekly schedule.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Go to "Teacher Timetable" page for detailed teacher-wise schedule viewing.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Timetable;
