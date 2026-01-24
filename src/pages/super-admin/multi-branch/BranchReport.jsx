import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePermissions } from '@/contexts/PermissionContext';
import { useToast } from '@/components/ui/use-toast';
import { ROUTES } from '@/registry/routeRegistry';

const data = [
  { name: 'Branch A', students: 400, staff: 24 },
  { name: 'Branch B', students: 300, staff: 18 },
  { name: 'Branch C', students: 200, staff: 12 },
];

const BranchReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canView } = usePermissions();

  useEffect(() => {
    if (!canView('multi_branch.branch_list')) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view branch reports.",
        variant: "destructive"
      });
      navigate(ROUTES.SUPER_ADMIN.DASHBOARD);
    }
  }, [canView, navigate, toast]);

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Branch Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#8884d8" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="staff" fill="#82ca9d" name="Staff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        <p><strong>Note:</strong> This is a demo report. Real data integration is coming soon.</p>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default BranchReport;
